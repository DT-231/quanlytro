"""Script seed dữ liệu giả cho testing.

Tạo:
- 20 users (tenants)
- 5 buildings
- 50 rooms
"""

import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from sqlalchemy.orm import Session
from app.infrastructure.db.session import SessionLocal
from app.models.user import User
from app.models.building import Building
from app.models.room import Room
from app.models.address import Address
from app.models.role import Role
from app.core.utils.uuid import generate_uuid7
from app.core.security import get_password_hash
from app.core.Enum.userEnum import UserStatus, UserRole
from app.core.Enum.base_enum import StatusEnum
from app.core.Enum.roomEnum import RoomStatus
from decimal import Decimal
import random


def get_tenant_role(db: Session):
    """Lấy role TENANT."""
    return db.query(Role).filter(Role.role_code == UserRole.TENANT.value).first()


def seed_users(db: Session, count: int = 20):
    """Tạo users giả."""
    print(f"\n🔧 Tạo {count} users...")
    
    tenant_role = get_tenant_role(db)
    if not tenant_role:
        print("❌ Không tìm thấy TENANT role!")
        return []
    
    first_names = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng"]
    last_names = ["An", "Bình", "Cường", "Dũng", "Hải", "Khoa", "Linh", "Minh", "Nam", "Phúc", 
                  "Quân", "Sơn", "Tâm", "Thành", "Tuấn", "Văn", "Xuân", "Yến", "Hà", "Mai"]
    cities = ["Hà Nội", "TP.HCM", "Đà Nẵng", "Hải Phòng", "Cần Thơ", "Huế", "Nha Trang", "Vũng Tàu"]
    
    users = []
    for i in range(count):
        first = random.choice(first_names)
        last = random.choice(last_names)
        email = f"user{i+1}@test.com"
        
        # Kiểm tra email đã tồn tại chưa
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"⚠️  User {email} đã tồn tại, bỏ qua")
            users.append(existing)
            continue
        
        user = User(
            id=generate_uuid7(),
            first_name=first,
            last_name=last,
            email=email,
            phone=f"09{random.randint(10000000, 99999999)}",
            cccd=f"{random.randint(100000000000, 999999999999)}",
            password=get_password_hash("password123"),
            gender=random.choice(["Nam", "Nữ"]),
            hometown=random.choice(cities),
            role_id=tenant_role.id,
            status=UserStatus.ACTIVE.value,
            is_temporary_residence=False
        )
        
        db.add(user)
        users.append(user)
    
    db.commit()
    print(f"✅ Đã tạo {len(users)} users")
    return users


def seed_buildings(db: Session, count: int = 5):
    """Tạo buildings giả."""
    print(f"\n🔧 Tạo {count} buildings...")
    
    building_names = ["Sunrise Tower", "Moonlight Residence", "Green Valley", "Ocean View", "City Center"]
    districts = ["Quận 1", "Quận 3", "Quận 5", "Quận 7", "Quận Bình Thạnh"]
    
    buildings = []
    for i in range(count):
        # Tạo address trước
        ward = f"Phường {random.randint(1, 15)}"
        street = f"Đường {random.randint(1, 100)}"
        address_line = f"Số {random.randint(1, 500)}, {street}, {ward}, {districts[i % len(districts)]}"
        
        address = Address(
            id=generate_uuid7(),
            city="TP.HCM",
            ward=ward,
            address_line=address_line,
            full_address=f"{address_line}, TP.HCM"
        )
        db.add(address)
        db.flush()  # Để lấy address.id
        
        building = Building(
            id=generate_uuid7(),
            building_code=f"BLD{i+1:03d}",
            building_name=building_names[i % len(building_names)] + f" {i+1}",
            address_id=address.id,
            description=f"Tòa nhà hiện đại với đầy đủ tiện nghi",
            status=StatusEnum.ACTIVE.value
        )
        
        db.add(building)
        buildings.append(building)
    
    db.commit()
    print(f"✅ Đã tạo {len(buildings)} buildings")
    return buildings


def seed_rooms(db: Session, buildings: list, count: int = 50):
    """Tạo rooms giả cho các buildings."""
    print(f"\n🔧 Tạo {count} rooms...")
    
    rooms = []
    rooms_per_building = count // len(buildings)
    
    for building in buildings:
        for i in range(rooms_per_building):
            floor = random.randint(1, 10)
            room_num = random.randint(1, 20)
            room_number = f"{floor}{room_num:02d}"
            
            # Kiểm tra room_number đã tồn tại chưa
            existing = db.query(Room).filter(
                Room.building_id == building.id,
                Room.room_number == room_number
            ).first()
            
            if existing:
                continue
            
            room = Room(
                id=generate_uuid7(),
                building_id=building.id,
                room_number=room_number,
                room_name=f"Phòng {room_number}",
                area=float(random.randint(20, 50)),
                capacity=random.randint(2, 4),
                base_price=Decimal(random.randint(2000000, 8000000)),
                electricity_price=Decimal(3500),
                water_price_per_person=Decimal(80000),
                deposit_amount=Decimal(random.randint(4000000, 16000000)),
                status=RoomStatus.AVAILABLE.value,
                description=f"Phòng {room_number} tầng {floor}, diện tích rộng rãi, đầy đủ tiện nghi"
            )
            
            db.add(room)
            rooms.append(room)
    
    db.commit()
    print(f"✅ Đã tạo {len(rooms)} rooms")
    return rooms


def main():
    """Main function."""
    print("\n" + "="*60)
    print("🚀 SEED DỮ LIỆU GIẢ CHO HỆ THỐNG")
    print("="*60)
    
    db = SessionLocal()
    
    try:
        # Seed users
        users = seed_users(db, count=20)
        
        # Seed buildings
        buildings = seed_buildings(db, count=5)
        
        # Seed rooms
        rooms = seed_rooms(db, buildings=buildings, count=50)
        
        print("\n" + "="*60)
        print("✅ SEED DỮ LIỆU HOÀN TẤT!")
        print("="*60)
        print(f"\n📊 Tổng kết:")
        print(f"  - Users: {len(users)}")
        print(f"  - Buildings: {len(buildings)}")
        print(f"  - Rooms: {len(rooms)}")
        print(f"\n🔐 Thông tin đăng nhập test:")
        print(f"  - Email: user1@test.com -> user20@test.com")
        print(f"  - Password: password123")
        
    except Exception as e:
        print(f"\n❌ Lỗi: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
