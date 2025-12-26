import json
import requests
import random
import os

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjY2Nzk4NzQsInR5cGUiOiJhY2Nlc3MiLCJzdWIiOiI0NTg0MWRjYS05NzE3LTQzMzgtOWNlOC04NDdiN2FkNTQ2YzAifQ.KA21v5LgnbjxroWbrJClsN3Yre7gRPelhYGFT_znSdw"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

MAJOR_CITIES = ["Tp. Hà Nội", "Tp. Đà Nẵng", "Tp. Hồ Chí Minh"]

UTILITIES_POOL = ["Điều hòa", "Tủ lạnh", "Máy giặt", "Giường", "Tủ quần áo", "Bàn làm việc", "Ban công", "Cửa sổ", "Bếp riêng", "Nóng lạnh"]

SERVICE_FEES_POOL = [
    {"name": "Internet", "amount": 100000, "description": "Wifi tốc độ cao"},
    {"name": "Vệ sinh", "amount": 50000, "description": "Dọn dẹp hành lang, rác"},
    {"name": "Gửi xe", "amount": 100000, "description": "Xe máy"},
    {"name": "Thang máy", "amount": 30000, "description": "Bảo trì thang máy"}
]

def get_buildings():
    all_buildings = []
    for city in MAJOR_CITIES:
        try:
            # Filter by city
            response = requests.get(f"{BASE_URL}/buildings", params={"city": city, "pageSize": 100}, headers=HEADERS)
            if response.status_code == 200:
                data = response.json()
                items = data.get("data", {}).get("items", [])
                all_buildings.extend(items)
                print(f"Found {len(items)} buildings in {city}")
            else:
                print(f"Failed to get buildings in {city}: {response.text}")
        except Exception as e:
            print(f"Error getting buildings in {city}: {e}")
    return all_buildings

def get_room_types():
    try:
        response = requests.get(f"{BASE_URL}/room-types/simple", headers=HEADERS)
        if response.status_code == 200:
            data = response.json()
            return data.get("data", [])
        else:
            print(f"Failed to get room types: {response.text}")
    except Exception as e:
        print(f"Error getting room types: {e}")
    return []

def create_rooms():
    buildings = get_buildings()
    room_types = get_room_types()
    
    if not buildings:
        print("No buildings found to create rooms.")
        return
    
    if not room_types:
        print("No room types found. Please create some room types first.")
        return

    print(f"Starting to create rooms for {len(buildings)} buildings...")
    
    success_count = 0
    fail_count = 0

    for building in buildings:
        building_id = building["id"]
        building_name = building["building_name"]
        
        # Create 3-5 rooms per building
        num_rooms = random.randint(3, 5)
        print(f"Creating {num_rooms} rooms for building: {building_name}")
        
        for i in range(num_rooms):
            room_type = random.choice(room_types)
            room_number = f"{random.randint(1, 9)}{random.randint(0, 9)}{random.randint(1, 9)}"
            
            # Random utilities
            utilities = random.sample(UTILITIES_POOL, random.randint(3, 6))
            
            # Random service fees
            service_fees = random.sample(SERVICE_FEES_POOL, random.randint(2, 4))
            
            room_data = {
                "building_id": building_id,
                "room_type_id": room_type["id"],
                "room_number": room_number,
                "room_name": f"Phòng {room_number} - {room_type['name']}",
                "area": float(random.randint(20, 50)),
                "capacity": random.randint(1, 4),
                "base_price": float(random.randint(3000, 15000) * 1000),
                "electricity_price": 3500.0,
                "water_price_per_person": 100000.0,
                "deposit_amount": float(random.randint(3000, 10000) * 1000),
                "default_service_fees": service_fees,
                "utilities": utilities,
                "status": "AVAILABLE",
                "description": f"Phòng đẹp, thoáng mát tại {building_name}. Đầy đủ tiện nghi: {', '.join(utilities)}."
            }
            
            try:
                response = requests.post(f"{BASE_URL}/rooms", json=room_data, headers=HEADERS)
                if response.status_code in [200, 201]:
                    print(f"  Successfully created room {room_number}")
                    success_count += 1
                else:
                    print(f"  Failed to create room {room_number}: {response.status_code} - {response.text}")
                    fail_count += 1
            except Exception as e:
                print(f"  Error creating room {room_number}: {e}")
                fail_count += 1

    print(f"\nRoom creation completed!")
    print(f"Total rooms created: {success_count}")
    print(f"Failed: {fail_count}")

if __name__ == "__main__":
    create_rooms()
