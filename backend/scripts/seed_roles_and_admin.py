#!/usr/bin/env python3
"""Seed roles và tạo tài khoản admin mặc định.

Script này sẽ:
1. Tạo các roles mặc định (ADMIN, TENANT, CUSTOMER)
2. Tạo tài khoản admin đầu tiên với thông tin mặc định

Usage:
    python scripts/seed_roles_and_admin.py

Hoặc với custom thông tin admin:
    python scripts/seed_roles_and_admin.py --email admin@example.com --password yourpassword

Script này là idempotent - có thể chạy nhiều lần mà không gây lỗi.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import List, Tuple

# Ensure project root is on sys.path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from app.infrastructure.db.session import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.core.security import get_password_hash
from app.core.Enum.userEnum import UserRole, UserStatus


# Danh sách roles mặc định
ROLES: List[Tuple[str, str, str]] = [
    ("ADMIN", "Administrator", "Quản trị viên/Chủ trọ - Toàn quyền hệ thống"),
    ("TENANT", "Tenant", "Người thuê phòng - Đã ký hợp đồng thuê"),
    ("CUSTOMER", "Customer", "Khách hàng tiềm năng - Có tài khoản nhưng chưa thuê")
]


def seed_roles(db) -> dict:
    """Seed các roles vào database.
    
    Returns:
        dict: Dictionary mapping role_code -> Role object
    """
    print("\n" + "="*60)
    print("BƯỚC 1: SEED ROLES")
    print("="*60)
    
    roles_map = {}
    added = 0
    
    for code, name, description in ROLES:
        existing = db.query(Role).filter(Role.role_code == code).first()
        if existing:
            print(f"✓ Role {code:10s} đã tồn tại (ID: {existing.id})")
            roles_map[code] = existing
            continue
        
        role = Role(role_code=code, role_name=name, description=description)
        db.add(role)
        db.flush()  # Flush để lấy ID ngay
        roles_map[code] = role
        added += 1
        print(f"✓ Đã thêm role {code:10s} (ID: {role.id})")
    
    if added:
        db.commit()
        print(f"\n✅ Đã thêm {added} role(s) mới")
    else:
        print(f"\n✅ Tất cả roles đã tồn tại")
    
    return roles_map


def create_admin_user(db, roles_map: dict, email: str, password: str) -> None:
    """Tạo tài khoản admin.
    
    Args:
        db: Database session
        roles_map: Dictionary chứa các role objects
        email: Email của admin
        password: Password của admin
    """
    print("\n" + "="*60)
    print("BƯỚC 2: TẠO TÀI KHOẢN ADMIN")
    print("="*60)
    
    # Kiểm tra email đã tồn tại chưa
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        print(f"⚠️  Tài khoản với email '{email}' đã tồn tại")
        print(f"   - ID: {existing_user.id}")
        print(f"   - Tên: {existing_user.first_name} {existing_user.last_name}")
        print(f"   - Role ID: {existing_user.role_id}")
        
        # Kiểm tra xem user này có phải là ADMIN không
        admin_role = roles_map.get(UserRole.ADMIN.value)
        if existing_user.role_id == admin_role.id:
            print(f"   - ✅ Đã là ADMIN")
        else:
            print(f"   - ⚠️  KHÔNG phải ADMIN, đang là role_id: {existing_user.role_id}")
            # Có thể tự động upgrade lên admin nếu muốn
            # existing_user.role_id = admin_role.id
            # db.commit()
            # print(f"   - ✅ Đã nâng cấp lên ADMIN")
        return
    
    # Lấy ADMIN role
    admin_role = roles_map.get(UserRole.ADMIN.value)
    if not admin_role:
        raise ValueError("ADMIN role không tồn tại. Vui lòng chạy seed_roles() trước.")
    
    # Hash password
    hashed_password = get_password_hash(password)
    
    # Tạo admin user
    admin_user = User(
        first_name="Admin",
        last_name="System",
        email=email,
        password=hashed_password,
        phone="0123456789",
        role_id=admin_role.id,
        status=UserStatus.ACTIVE.value,
        is_temporary_residence=False
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    print(f"✅ Đã tạo tài khoản ADMIN thành công!")
    print(f"   - ID: {admin_user.id}")
    print(f"   - Email: {admin_user.email}")
    print(f"   - Tên: {admin_user.first_name} {admin_user.last_name}")
    print(f"   - Role ID: {admin_user.role_id} (ADMIN)")
    print(f"   - Status: {admin_user.status}")
    print(f"\n⚠️  LƯU Ý: Vui lòng đổi password sau khi đăng nhập lần đầu!")


def main():
    """Main function."""
    parser = argparse.ArgumentParser(
        description="Seed roles và tạo tài khoản admin"
    )
    parser.add_argument(
        "--email",
        type=str,
        default="admin@rental.com",
        help="Email của tài khoản admin (mặc định: admin@gmail.com)"
    )
    parser.add_argument(
        "--password",
        type=str,
        default="Admin@123",
        help="Password của tài khoản admin (mặc định: Admin@123)"
    )
    
    args = parser.parse_args()
    
    print("\n" + "="*60)
    print("🚀 KHỞI ĐỘNG SCRIPT SEED ROLES & ADMIN")
    print("="*60)
    print(f"Email: {args.email}")
    print(f"Password: {'*' * len(args.password)}")
    
    db = SessionLocal()
    try:
        # Bước 1: Seed roles
        roles_map = seed_roles(db)
        
        # Bước 2: Tạo admin user
        create_admin_user(db, roles_map, args.email, args.password)
        
        print("\n" + "="*60)
        print("✅ HOÀN THÀNH!")
        print("="*60)
        print("\nThông tin đăng nhập:")
        print(f"  Email:    {args.email}")
        print(f"  Password: {args.password}")
        print(f"\nAPI Login: POST http://localhost:8000/api/v1/auth/login")
        print("="*60 + "\n")
        
    except Exception as exc:
        db.rollback()
        print("\n" + "="*60)
        print("❌ LỖI!")
        print("="*60)
        print(f"Error: {exc}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
