"""Script thêm 10 phòng vào các tòa nhà có sẵn."""

import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
from app.infrastructure.db.session import SessionLocal
from app.models.building import Building
from app.models.room import Room
from app.core.utils.uuid import generate_uuid7
from app.core.Enum.roomEnum import RoomStatus
from decimal import Decimal
import random


def add_rooms(db: Session, count: int = 10):
    """Thêm rooms mới vào các buildings."""
    print(f"\n🔧 Thêm {count} phòng mới...")
    
    # Lấy tất cả buildings
    buildings = db.query(Building).all()
    if not buildings:
        print("❌ Không có building nào!")
        return []
    
    print(f"📍 Tìm thấy {len(buildings)} buildings")
    
    rooms = []
    for i in range(count):
        building = random.choice(buildings)
        
        # Tạo room number unique
        while True:
            floor = random.randint(1, 15)
            room_num = random.randint(1, 25)
            room_number = f"{floor}{room_num:02d}"
            
            # Kiểm tra đã tồn tại chưa
            existing = db.query(Room).filter(
                Room.building_id == building.id,
                Room.room_number == room_number
            ).first()
            
            if not existing:
                break
        
        room = Room(
            id=generate_uuid7(),
            building_id=building.id,
            room_number=room_number,
            room_name=f"Phòng {room_number}",
            area=float(random.randint(20, 60)),
            capacity=random.randint(2, 5),
            base_price=Decimal(random.randint(2000000, 10000000)),
            electricity_price=Decimal(3500),
            water_price_per_person=Decimal(80000),
            deposit_amount=Decimal(random.randint(4000000, 20000000)),
            status=RoomStatus.AVAILABLE.value,
            description=f"Phòng {room_number} tại {building.building_name}, diện tích {random.randint(20, 60)}m², đầy đủ tiện nghi"
        )
        
        db.add(room)
        rooms.append(room)
        print(f"  ✅ Tạo phòng {room_number} tại {building.building_name}")
    
    db.commit()
    print(f"\n✅ Đã thêm {len(rooms)} phòng mới!")
    return rooms


def main():
    print("\n" + "="*60)
    print("🚀 THÊM PHÒNG MỚI")
    print("="*60)
    
    db = SessionLocal()
    
    try:
        rooms = add_rooms(db, count=10)
        
        print("\n" + "="*60)
        print("✅ HOÀN TẤT!")
        print("="*60)
        print(f"\n📊 Đã thêm: {len(rooms)} phòng")
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
