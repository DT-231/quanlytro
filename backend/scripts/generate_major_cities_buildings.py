import json
import random
import requests
import time
import os

# Configuration
CITY_JSON_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'city.json'))
OUTPUT_JSON_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'major_cities_buildings.json'))
DISTRICT_API_URL = "https://tailieu365.com/api/address/district?provinceId={provinceId}"

MAJOR_CITIES = [
    {"id": 1, "name": "Tp. Hà Nội"},
    {"id": 32, "name": "Tp. Đà Nẵng"},
    {"id": 50, "name": "Tp. Hồ Chí Minh"}
]

BUILDING_NAMES = [
    "Chung cư {city} Luxury", "Khu trọ {district} Xanh", "Tòa nhà {name} Tower", 
    "Căn hộ dịch vụ {district} Central", "Nhà trọ {name} Garden", "Homestay {city} Dream",
    "Apartment {district} Elite", "Building {name} Plaza", "Khu nhà ở {city} Riverside",
    "Tổ hợp {district} Smart"
]

RANDOM_NAMES = ["Hoàng Anh", "Minh Tâm", "Phúc Lộc", "Thịnh Vượng", "An Bình", "Sơn Trà", "Hải Đăng", "Kim Long", "Ngọc Bích", "Thanh Xuân"]

def fetch_districts(province_id):
    try:
        response = requests.get(DISTRICT_API_URL.format(provinceId=province_id), timeout=10)
        if response.status_code == 200:
            return response.json()
    except Exception as e:
        print(f"Error fetching districts for province {province_id}: {e}")
    return []

def generate_data():
    buildings = []
    
    for city in MAJOR_CITIES:
        print(f"Processing major city: {city['name']} (ID: {city['id']})...")
        districts = fetch_districts(city['id'])
        
        if not districts:
            print(f"No districts found for {city['name']}, skipping...")
            continue
            
        # Generate 5 buildings per major city
        for i in range(5):
            district = random.choice(districts)
            random_name = random.choice(RANDOM_NAMES)
            
            building_name_template = random.choice(BUILDING_NAMES)
            building_name = building_name_template.format(
                city=city['name'], 
                district=district['name'], 
                name=random_name
            )
            
            building_code = f"BLD-{city['id']}-{random.randint(1000, 9999)}"
            
            building_data = {
                "building_code": building_code,
                "building_name": building_name,
                "description": f"Tòa nhà cao cấp tại {district['name']}, {city['name']}. Vị trí đắc địa, tiện ích vượt trội.",
                "status": "ACTIVE",
                "address": {
                    "address_line": f"{random.randint(1, 999)} Đường {random_name}",
                    "ward": district['name'],
                    "city": city['name'],
                    "country": "Vietnam"
                }
            }
            
            buildings.append(building_data)
            print(f"  Generated: {building_name}")
            
        time.sleep(0.5)

    with open(OUTPUT_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(buildings, f, ensure_ascii=False, indent=4)
    
    print(f"\nSuccessfully generated {len(buildings)} buildings for major cities and saved to {OUTPUT_JSON_PATH}")

if __name__ == "__main__":
    generate_data()
