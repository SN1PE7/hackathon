import requests
import json

API_URL = "http://localhost:8000"

# Test 1: Health check
print("="*60)
print("TEST 1: Health Check")
print("="*60)
try:
    response = requests.get(f"{API_URL}/")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"Error: {e}")
    exit(1)

# Test 2: Simple recommendation
print("\n" + "="*60)
print("TEST 2: Simple Recommendation")
print("="*60)

test_prompt = "Tìm 3 quán cafe nổi tiếng"

print(f"Prompt: {test_prompt}")
print("Đang gửi request... (có thể mất 30-60s)")

try:
    response = requests.post(
        f"{API_URL}/api/recommend",
        json={"prompt": test_prompt},
        timeout=120
    )
    
    print(f"\nStatus: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nThành công!")
        print(f"Số địa điểm: {len(data['recommendations'])}")
        print(f"Số coordinates: {len(data['route_coordinates'])}")
        
        if len(data['recommendations']) > 0:
            print(f"\nĐịa điểm đầu tiên:")
            first = data['recommendations'][0]
            print(json.dumps(first, indent=2, ensure_ascii=False))
        else:
            print("\nKhông có recommendations nào được trả về")
            print(f"Full response: {json.dumps(data, indent=2, ensure_ascii=False)}")
    else:
        print(f"\n❌ Lỗi: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"\n❌ Exception: {e}")
    import traceback
    traceback.print_exc()
