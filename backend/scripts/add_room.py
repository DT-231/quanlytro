import json
import requests
import time

# Cấu hình
API_URL = "http://localhost:8000/api/v1/rooms"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjYzMzkwOTcsInR5cGUiOiJhY2Nlc3MiLCJzdWIiOiI2ZGZkZDUzNy1hODg2LTRjMDQtYTY3YS1jYTA3OGEwMTVjNzMifQ.q0e5IrsH1i01iDvPd-Bhp4MECLi4qcyrvL5u9u31B88"
JSON_FILE = "data/room.json"

# Headers
headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def load_room_data(filename):
    """Đọc dữ liệu phòng từ file JSON"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
        print(f"✓ Đã load {len(data)} tòa nhà từ file {filename}")
        return data
    except FileNotFoundError:
        print(f"✗ Không tìm thấy file {filename}")
        return None
    except json.JSONDecodeError:
        print(f"✗ File {filename} không đúng định dạng JSON")
        return None

def create_room(room_data, building_id):
    """Gọi API để tạo phòng"""
    try:
        # Tạo payload chỉ với dữ liệu phòng, không bao gồm building_name hay rooms
        payload = {
            "building_id": building_id,
            "room_type_id": room_data.get("room_type_id"),
            "room_number": room_data.get("room_number"),
            "room_name": room_data.get("room_name"),
            "area": room_data.get("area"),
            "capacity": room_data.get("capacity"),
            "base_price": room_data.get("base_price"),
            "electricity_price": room_data.get("electricity_price"),
            "water_price_per_person": room_data.get("water_price_per_person"),
            "deposit_amount": room_data.get("deposit_amount"),
            "status": room_data.get("status", "AVAILABLE"),
            "description": room_data.get("description"),
            "utilities": room_data.get("utilities", []),
            "photos": room_data.get("photos", [])
        }
        print(payload)
        response = requests.post(API_URL, json=payload, headers=headers)
        
        if response.status_code == 200 or response.status_code == 201:
            return True, response.json()
        else:
            return False, response.text
    except Exception as e:
        return False, str(e)

def import_rooms():
    """Import tất cả phòng từ file JSON"""
    # Load dữ liệu
    buildings_data = load_room_data(JSON_FILE)
    if not buildings_data:
        return
    
    # Thống kê
    total_rooms = sum(len(building['rooms']) for building in buildings_data)
    success_count = 0
    fail_count = 0
    
    print(f"\n{'='*60}")
    print(f"Bắt đầu import {total_rooms} phòng từ {len(buildings_data)} tòa nhà")
    print(f"{'='*60}\n")
    
    # Duyệt qua từng tòa nhà
    for building_idx, building in enumerate(buildings_data, 1):
        building_name = building.get('building_name', 'Unknown')
        building_id = building.get('building_id')
        rooms = building.get('rooms', [])
        
        print(f"\n[{building_idx}/{len(buildings_data)}] Tòa nhà: {building_name}")
        print(f"Building ID: {building_id}")
        print(f"Số phòng: {len(rooms)}")
        print("-" * 60)
        
        # Import từng phòng
        for room_idx, room in enumerate(rooms, 1):
            room_number = room.get('room_number', 'N/A')
            room_name = room.get('room_name', 'N/A')
            
            print(f"  [{room_idx}/{len(rooms)}] {room_number} - {room_name}...", end=" ")
            
            success, result = create_room(room)
            
            if success:
                print("✓ Thành công")
                success_count += 1
            else:
                
                print(f"✗ Thất bại")
                print(f"      Lỗi: {result}")
                fail_count += 1
                break
            # Delay nhẹ để tránh quá tải API
            time.sleep(0.1)
    
    # Tổng kết
    print(f"\n{'='*60}")
    print(f"KẾT QUẢ IMPORT")
    print(f"{'='*60}")
    print(f"Tổng số phòng:     {total_rooms}")
    print(f"Thành công:        {success_count} ✓")
    print(f"Thất bại:          {fail_count} ✗")
    print(f"Tỷ lệ thành công:  {(success_count/total_rooms*100):.1f}%")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════╗
║           IMPORT DỮ LIỆU PHÒNG VÀO HỆ THỐNG             ║
╚══════════════════════════════════════════════════════════╝
    """)
    
    # Xác nhận trước khi chạy
    confirm = input("Bạn có chắc chắn muốn import dữ liệu? (yes/no): ")
    
    if confirm.lower() in ['yes', 'y']:
        import_rooms()
    else:
        print("Đã hủy import.")