import json
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import uvicorn
import math
from datetime import datetime, timedelta
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp

# --- CONFIGURATION ---
GOOGLE_API_KEY = "AIzaSyCPX3IvX55bKMYA1S71j4URYXAQe3kZUM8" 

genai.configure(api_key=GOOGLE_API_KEY)

model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config={
        "temperature": 0.7,
        "response_mime_type": "application/json"
    }
)

app = FastAPI(title="Travel Hackathon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# loading data
try:
    with open("smart-travel\\app\\locations.json", "r", encoding="utf-8") as f:
        ALL_LOCATIONS = json.load(f)
    print(f"Đã load thành công {len(ALL_LOCATIONS)} địa điểm.")
except Exception as e:
    print(f"Lỗi load file locations.json: {e}")
    ALL_LOCATIONS = []

# --- HELPER FUNCTIONS ---

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km using Haversine formula"""
    R = 6371  # Earth radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def filter_locations_by_proximity(locations: List[dict], user_lat: float, user_lon: float, max_radius_km: float) -> List[dict]:
    """Filter locations within radius and add distance_from_user field"""
    filtered = []
    for loc in locations:
        distance = calculate_distance(user_lat, user_lon, loc["lat"], loc["lon"])
        if distance <= max_radius_km:
            loc_copy = loc.copy()
            loc_copy["distance_from_user"] = round(distance, 2)
            filtered.append(loc_copy)
    
    # Sort by distance
    filtered.sort(key=lambda x: x["distance_from_user"])
    return filtered

def filter_and_score_by_tags(locations: List[dict], preferred_tags: List[str]) -> List[dict]:
    """Score locations by matching tags and sort by relevance"""
    scored_locations = []
    
    for loc in locations:
        loc_tags = loc.get("tags", {})
        matched = []
        
        # Check which preferred tags match
        for tag in preferred_tags:
            tag_lower = tag.lower()
            # Check in various tag fields
            if any(tag_lower in str(v).lower() for k, v in loc_tags.items() if k in ["amenity", "tourism", "leisure", "cuisine", "shop"]):
                matched.append(tag)
        
        loc_copy = loc.copy()
        loc_copy["matched_tags"] = matched
        loc_copy["tag_score"] = len(matched)
        scored_locations.append(loc_copy)
    
    # Sort by tag score (desc) then by distance (asc)
    scored_locations.sort(key=lambda x: (-x["tag_score"], x.get("distance_from_user", 999)))
    return scored_locations

def solve_tsp_with_start_point(locations: List[dict], start_lat: float, start_lon: float) -> List[int]:
    """
    Solve TSP using OR-Tools, starting from user location.
    Returns: List of indices representing optimal visit order
    """
    if len(locations) <= 1:
        return list(range(len(locations)))
    
    # Create distance matrix
    coords = [(start_lat, start_lon)] + [(loc["lat"], loc["lon"]) for loc in locations]
    num_locations = len(coords)
    
    distance_matrix = []
    for i in range(num_locations):
        row = []
        for j in range(num_locations):
            if i == j:
                row.append(0)
            else:
                dist = calculate_distance(coords[i][0], coords[i][1], coords[j][0], coords[j][1])
                row.append(int(dist * 1000))  # Convert to meters for integer precision
        distance_matrix.append(row)
    
    # Create routing model
    manager = pywrapcp.RoutingIndexManager(num_locations, 1, 0)  # Start from index 0 (user location)
    routing = pywrapcp.RoutingModel(manager)
    
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return distance_matrix[from_node][to_node]
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    # Set search parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    
    # Solve
    solution = routing.SolveWithParameters(search_parameters)
    
    if solution:
        route = []
        index = routing.Start(0)
        while not routing.IsEnd(index):
            node = manager.IndexToNode(index)
            if node > 0:  # Skip start point (user location)
                route.append(node - 1)  # Adjust index to match locations list
            index = solution.Value(routing.NextVar(index))
        return route
    else:
        # Fallback: return original order
        return list(range(len(locations)))

def categorize_and_sort_by_time(locations: List[dict]) -> List[dict]:
    """
    Categorize locations by time of day based on tags.
    Priority: morning → afternoon → evening
    """
    morning_keywords = ["breakfast", "cafe", "coffee", "museum", "park"]
    afternoon_keywords = ["lunch", "restaurant", "attraction", "shopping", "mall"]
    evening_keywords = ["dinner", "bar", "pub", "entertainment", "nightlife"]
    
    categorized = []
    for loc in locations:
        tags_str = json.dumps(loc.get("tags", {})).lower()
        
        if any(kw in tags_str for kw in morning_keywords):
            time_cat = "morning"
        elif any(kw in tags_str for kw in evening_keywords):
            time_cat = "evening"
        else:
            time_cat = "afternoon"
        
        loc_copy = loc.copy()
        loc_copy["time_category"] = time_cat
        categorized.append(loc_copy)
    
    # Sort by time: morning → afternoon → evening
    time_order = {"morning": 0, "afternoon": 1, "evening": 2}
    categorized.sort(key=lambda x: time_order.get(x.get("time_category", "afternoon"), 1))
    
    return categorized

def assign_detailed_schedule(locations: List[dict], start_time_str: str) -> List[dict]:
    """
    Assign start_time, end_time, duration, travel_time for each location.
    Returns: List of locations with schedule fields added
    """
    scheduled = []
    current_time = datetime.strptime(start_time_str, "%H:%M")
    
    for i, loc in enumerate(locations):
        tags = loc.get("tags", {})
        amenity = tags.get("amenity", "")
        tourism = tags.get("tourism", "")
        
        # Estimate duration based on type
        if "restaurant" in amenity or "cafe" in amenity:
            duration = 60  # 1 hour
        elif "museum" in tourism or "attraction" in tourism:
            duration = 90  # 1.5 hours
        elif "park" in tourism or "viewpoint" in tourism:
            duration = 45
        else:
            duration = 60  # Default
        
        loc_copy = loc.copy()
        loc_copy["start_time"] = current_time.strftime("%H:%M")
        end_time = current_time + timedelta(minutes=duration)
        loc_copy["end_time"] = end_time.strftime("%H:%M")
        loc_copy["duration_minutes"] = duration
        loc_copy["order"] = i + 1
        
        # Calculate travel time to next location
        if i < len(locations) - 1:
            next_loc = locations[i + 1]
            distance = calculate_distance(loc["lat"], loc["lon"], next_loc["lat"], next_loc["lon"])
            travel_time = max(10, int(distance * 8))  # ~8 min per km, minimum 10 min
            loc_copy["travel_to_next_minutes"] = travel_time
            current_time = end_time + timedelta(minutes=travel_time)
        else:
            loc_copy["travel_to_next_minutes"] = 0
        
        scheduled.append(loc_copy)
    
    return scheduled

def build_selection_prompt(filtered_locations: List[dict], user_prompt: str, user_location_name: str) -> str:
    """Build context-aware AI selection prompt"""
    prompt = f"""
Role: Chuyên gia tư vấn du lịch TP.HCM.

Context:
- Vị trí xuất phát: {user_location_name}
- Nhu cầu: "{user_prompt}"
- Số lượng địa điểm đã lọc sẵn: {len(filtered_locations)} (đã sắp xếp theo độ phù hợp)

Task:
1. Chọn ra 6-8 địa điểm phù hợp nhất cho lịch trình 1 ngày.
2. Ưu tiên chọn đa dạng loại hình để tạo lịch trình cân bằng.
3. Phải có địa điểm ăn uống (breakfast/lunch/dinner).
4. Xem xét khoảng cách từ vị trí xuất phát (distance_from_user).
5. Ưu tiên các địa điểm có matched_tags cao.

Data:
{json.dumps(filtered_locations[:30], ensure_ascii=False)}

Output JSON Schema:
[
    {{ 
        "id": int, 
        "match_score": int (0-100), 
        "reason": "string - giải thích tại sao chọn địa điểm này"
    }}
]
"""
    return prompt

# --- DATA MODELS ---

class UserLocation(BaseModel):
    lat: float
    lon: float
    name: str = "Vị trí của bạn"

class UserPromptRequest(BaseModel):
    prompt: str
    user_location: Optional[UserLocation] = None
    preferred_tags: Optional[List[str]] = None  # e.g., ["museum", "park", "restaurant"]
    max_radius_km: Optional[float] = 15.0
    start_time: Optional[str] = "09:00"  # Format: "HH:MM"

class LocationCoords(BaseModel):
    lat: float
    lon: float

class RecommendationItem(BaseModel):
    id: int
    name: str
    address: str
    opening_hours: str
    reason: str
    match_score: int
    location: LocationCoords
    tags: dict
    # scheduling fields
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    duration_minutes: Optional[int] = None
    travel_to_next_minutes: Optional[int] = None
    order: Optional[int] = None
    distance_from_user: Optional[float] = None  # km
    matched_tags: Optional[List[str]] = None

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]
    route_coordinates: List[LocationCoords]
    # summary fields
    total_duration_minutes: Optional[int] = None
    total_travel_time_minutes: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None

# --- API ENDPOINTS ---

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Travel Hackathon API is running",
        "locations_loaded": len(ALL_LOCATIONS)
    }

@app.post("/api/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: UserPromptRequest):
    """
    AI + TSP + Rule-based Scheduling
    7-step process for optimal itinerary generation
    """
    if not ALL_LOCATIONS:
        raise HTTPException(status_code=500, detail="Database rỗng")

    print(f"\n{'='*60}")
    print(f"Prompt: {request.prompt}")
    print(f"User Location: {request.user_location.name if request.user_location else 'Not provided'}")
    print(f"Preferred Tags: {request.preferred_tags or 'None'}")
    print(f"Max Radius: {request.max_radius_km}km")
    print(f"Start Time: {request.start_time}")
    print(f"{'='*60}\n")

    try:
        # STEP 1: Filter by location proximity
        filtered_locations = ALL_LOCATIONS.copy()
        
        if request.user_location:
            print(f" Step 1: Filtering by proximity ({request.max_radius_km}km)...")
            filtered_locations = filter_locations_by_proximity(
                ALL_LOCATIONS,
                request.user_location.lat,
                request.user_location.lon,
                request.max_radius_km
            )
            print(f"{len(filtered_locations)} locations within radius")
        else:
            # No user location - add dummy distance
            for loc in filtered_locations:
                loc["distance_from_user"] = 0
        
        # STEP 2: Filter and score by tags
        if request.preferred_tags:
            print(f" Step 2: Filtering by tags {request.preferred_tags}...")
            filtered_locations = filter_and_score_by_tags(filtered_locations, request.preferred_tags)
            print(f" Tagged and scored {len(filtered_locations)} locations")
        else:
            for loc in filtered_locations:
                loc["matched_tags"] = []
                loc["tag_score"] = 0
        
        if not filtered_locations:
            print("No locations found after filtering")
            return RecommendationResponse(
                recommendations=[],
                route_coordinates=[],
                total_duration_minutes=0,
                total_travel_time_minutes=0,
                start_time=request.start_time,
                end_time=request.start_time
            )
        
        # STEP 3: AI Selection (Single Prompt)
        print(f" Step 3: AI selecting 6-8 locations from {len(filtered_locations)} candidates...")
        
        user_loc_name = request.user_location.name if request.user_location else "Trung tâm TP.HCM"
        selection_prompt = build_selection_prompt(filtered_locations, request.prompt, user_loc_name)
        
        response = model.generate_content(selection_prompt)
        ai_result = json.loads(response.text)
        
        print(f"   AI selected {len(ai_result)} locations")
        
        if not ai_result:
            print("AI returned no locations")
            return RecommendationResponse(
                recommendations=[],
                route_coordinates=[],
                total_duration_minutes=0,
                total_travel_time_minutes=0,
                start_time=request.start_time,
                end_time=request.start_time
            )
        
        # STEP 4: Map AI results to full location data
        print(f" Step 4: Mapping AI results to full location data...")
        selected_locations = []
        
        for item in ai_result:
            original_loc = next((loc for loc in filtered_locations if loc["id"] == item["id"]), None)
            if original_loc:
                loc_copy = original_loc.copy()
                loc_copy["ai_match_score"] = item.get("match_score", 80)
                loc_copy["ai_reason"] = item.get("reason", "Phù hợp với yêu cầu")
                selected_locations.append(loc_copy)
        
        print(f"   Mapped {len(selected_locations)} locations")
        
        # STEP 5: Categorize by time
        print(f" Step 5: Categorizing by time of day...")
        categorized_locations = categorize_and_sort_by_time(selected_locations)
        print(f"   Categorized into morning/afternoon/evening")
        
        # STEP 6: TSP Optimization
        print(f" Step 6: TSP route optimization...")
        
        if request.user_location:
            optimal_order = solve_tsp_with_start_point(
                categorized_locations,
                request.user_location.lat,
                request.user_location.lon
            )
        else:
            # No user location - use first location as start
            optimal_order = solve_tsp_with_start_point(
                categorized_locations,
                categorized_locations[0]["lat"],
                categorized_locations[0]["lon"]
            )
        
        optimized_locations = [categorized_locations[i] for i in optimal_order]
        print(f"   Optimized route with {len(optimized_locations)} stops")
        
        # STEP 7: Assign detailed schedule
        print(f" Step 7: Assigning detailed schedule...")
        scheduled_locations = assign_detailed_schedule(optimized_locations, request.start_time)
        print(f"   Schedule created from {scheduled_locations[0]['start_time']} to {scheduled_locations[-1]['end_time']}")
        
        # Build final response
        final_results = []
        route_coords = []
        
        for loc in scheduled_locations:
            tags = loc.get("tags", {})
            name = tags.get("name", tags.get("name:vi", tags.get("name:en", "Địa điểm không tên")))
            address = tags.get("address", "Đang cập nhật địa chỉ")
            opening_hours = tags.get("opening_hours", "Đang cập nhật giờ")
            
            coords = LocationCoords(lat=loc["lat"], lon=loc["lon"])
            
            final_results.append(RecommendationItem(
                id=loc["id"],
                name=name,
                address=address,
                opening_hours=opening_hours,
                reason=loc.get("ai_reason", "Gợi ý phù hợp"),
                match_score=loc.get("ai_match_score", 80),
                location=coords,
                tags=tags,
                start_time=loc.get("start_time"),
                end_time=loc.get("end_time"),
                duration_minutes=loc.get("duration_minutes"),
                travel_to_next_minutes=loc.get("travel_to_next_minutes"),
                order=loc.get("order"),
                distance_from_user=loc.get("distance_from_user"),
                matched_tags=loc.get("matched_tags")
            ))
            
            route_coords.append(coords)
        
        # Calculate totals
        total_duration = sum(loc.get("duration_minutes", 0) for loc in scheduled_locations)
        total_travel = sum(loc.get("travel_to_next_minutes", 0) for loc in scheduled_locations)
        start_time = scheduled_locations[0].get("start_time", request.start_time)
        end_time = scheduled_locations[-1].get("end_time", request.start_time)
        
        print(f"\n{'='*60}")
        print(f" COMPLETED: {len(final_results)} locations")
        print(f" Total Duration: {total_duration} min | Travel: {total_travel} min")
        print(f" Schedule: {start_time} → {end_time}")
        print(f"{'='*60}\n")
        
        return RecommendationResponse(
            recommendations=final_results,
            route_coordinates=route_coords,
            total_duration_minutes=total_duration,
            total_travel_time_minutes=total_travel,
            start_time=start_time,
            end_time=end_time
        )

    except json.JSONDecodeError as e:
        print(f" JSON Parse Error: {e}")
        print(f" Raw AI response: {response.text if 'response' in locals() else 'N/A'}")
        import traceback
        traceback.print_exc()
        return RecommendationResponse(
            recommendations=[],
            route_coordinates=[],
            total_duration_minutes=0,
            total_travel_time_minutes=0,
            start_time=request.start_time,
            end_time=request.start_time
        )
    except Exception as e:
        print(f" Error: {e}")
        import traceback
        traceback.print_exc()
        return RecommendationResponse(
            recommendations=[],
            route_coordinates=[],
            total_duration_minutes=0,
            total_travel_time_minutes=0,
            start_time=request.start_time,
            end_time=request.start_time
        )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)