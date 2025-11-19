import json
import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
import uvicorn

# --- CẤU HÌNH ---
GOOGLE_API_KEY = "AIzaSyAum9-f_VhDZXVKlzcurLdBpGkAd0EtePk" 

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

# --- LOAD DỮ LIỆU ---
try:
    with open("locations.json", "r", encoding="utf-8") as f:
        ALL_LOCATIONS = json.load(f)
    print(f"✅ Đã load thành công {len(ALL_LOCATIONS)} địa điểm.")
except Exception as e:
    print(f"❌ Lỗi load file locations.json: {e}")
    ALL_LOCATIONS = []

# --- DATA MODELS (CẬP NHẬT MỚI) ---

class UserPromptRequest(BaseModel):
    prompt: str

class LocationCoords(BaseModel):
    lat: float
    lon: float

class RecommendationItem(BaseModel):
    id: int
    name: str           # Ưu tiên hiển thị
    address: str        # Ưu tiên hiển thị
    opening_hours: str  # Ưu tiên hiển thị
    reason: str         # Lý do AI chọn
    match_score: int
    location: LocationCoords
    tags: dict          # Vẫn giữ lại để frontend dùng nếu cần (vd: image, type...)

class RecommendationResponse(BaseModel):
    recommendations: List[RecommendationItem]

# --- API ENDPOINTS ---

@app.post("/api/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: UserPromptRequest):
    if not ALL_LOCATIONS:
        raise HTTPException(status_code=500, detail="Database rỗng")

    print(f"📩 Prompt nhận được: {request.prompt}")

    # Prompt tối ưu cho việc chọn địa điểm
    system_prompt = f"""
    Role: Hướng dẫn viên du lịch TP.HCM.
    
    Task:
    1. Dựa vào nhu cầu: "{request.prompt}"
    2. Chọn ra 8-12 địa điểm phù hợp nhất từ danh sách data.
    3. Trả về JSON gồm ID, match_score và reason (giải thích ngắn gọn, hấp dẫn).
    
    Data:
    {json.dumps(ALL_LOCATIONS, ensure_ascii=False)}
    
    Output JSON Schema:
    [
        {{ "id": int, "match_score": int, "reason": "string" }}
    ]
    """

    try:
        response = model.generate_content(system_prompt)
        ai_result = json.loads(response.text)
        
        final_results = []
        
        for item in ai_result:
            # Tìm địa điểm gốc trong list ALL_LOCATIONS dựa vào ID mà AI trả về
            original_loc = next((loc for loc in ALL_LOCATIONS if loc["id"] == item["id"]), None)
            
            if original_loc:
                # Trích xuất thông tin từ 'tags' để đưa ra ngoài cho dễ dùng
                tags = original_loc.get("tags", {})
                
                # Xử lý tên: Lấy name hoặc name:vi hoặc name:en
                name = tags.get("name", tags.get("name:vi", tags.get("name:en", "Địa điểm không tên")))
                
                # Xử lý địa chỉ và giờ mở cửa (có fallback nếu thiếu)
                address = tags.get("address", "Đang cập nhật địa chỉ")
                opening_hours = tags.get("opening_hours", "Đang cập nhật giờ")

                final_results.append({
                    "id": original_loc["id"],
                    "name": name,                  # <--- Field ưu tiên
                    "address": address,            # <--- Field ưu tiên
                    "opening_hours": opening_hours,# <--- Field ưu tiên
                    "reason": item.get("reason", "Gợi ý phù hợp."),
                    "match_score": item.get("match_score", 80),
                    "location": {
                        "lat": original_loc["lat"], 
                        "lon": original_loc["lon"]
                    },
                    "tags": tags # Giữ lại tags gốc
                })

        return {"recommendations": final_results}

    except Exception as e:
        print(f"❌ Lỗi xử lý: {e}")
        # Trả về list rỗng thay vì lỗi 500 để frontend không bị crash
        return {"recommendations": []}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)