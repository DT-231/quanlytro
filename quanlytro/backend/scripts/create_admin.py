#!/usr/bin/env python3
"""Script nhanh để tạo tài khoản admin.

Usage:
    python scripts/create_admin.py

Hoặc với thông tin tùy chỉnh:
    python scripts/create_admin.py --email myemail@example.com --password MyPass123 --firstname John --lastname Doe
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure project root is on sys.path
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from app.infrastructure.db.session import SessionLocal
from app.models.role import Role
from app.models.user import User
from app.core.security import get_password_hash
from app.core.Enum.userEnum import UserRole, UserStatus


def create_admin(
    email: str,
    password: str,
    first_name: str = "Admin",
    last_name: str = "System",
    phone: str = "0123456789"
) -> None:
    """Tạo tài khoản admin."""
    
    db = SessionLocal()
    try:
        print("\n" + "="*60)
        print("🔧 TẠO TÀI KHOẢN ADMIN")
        print("="*60)
        
        # Lấy ADMIN role
        admin_role = db.query(Role).filter(Role.role_code == UserRole.ADMIN.value).first()
        
        if not admin_role:
            print("❌ ADMIN role không tồn tại!")
            print("Vui lòng chạy: python scripts/seed_roles_and_admin.py")
            sys.exit(1)
        
        # Kiểm tra email đã tồn tại
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            print(f"⚠️  Email '{email}' đã tồn tại!")
            print(f"   User ID: {existing.id}")
            print(f"   Tên: {existing.first_name} {existing.last_name}")
            
            # Kiểm tra và update role nếu cần
            if existing.role_id != admin_role.id:
                print(f"   ⚠️  User này chưa phải ADMIN")
                response = input("   Bạn có muốn nâng cấp user này lên ADMIN? (y/n): ")
                if response.lower() == 'y':
                    existing.role_id = admin_role.id
                    db.commit()
                    print(f"   ✅ Đã nâng cấp lên ADMIN!")
                else:
                    print(f"   ⏭️  Bỏ qua")
            else:
                print(f"   ✅ User này đã là ADMIN")
            return
        
        # Tạo admin mới
        hashed_password = get_password_hash(password)
        
        admin_user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=hashed_password,
            phone=phone,
            role_id=admin_role.id,
            status=UserStatus.ACTIVE.value,
            is_temporary_residence=False
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("\n✅ Tạo tài khoản ADMIN thành công!")
        print("="*60)
        print(f"ID:       {admin_user.id}")
        print(f"Email:    {email}")
        print(f"Password: {password}")
        print(f"Tên:      {first_name} {last_name}")
        print(f"Phone:    {phone}")
        print(f"Role:     ADMIN")
        print(f"Status:   {admin_user.status}")
        print("="*60)
        print("\n📝 Thông tin đăng nhập:")
        print(f"   POST http://localhost:8000/api/v1/auth/login")
        print(f"   Body: {{'email': '{email}', 'password': '{password}'}}")
        print("\n⚠️  Vui lòng đổi password sau khi đăng nhập lần đầu!\n")
        
    except Exception as exc:
        db.rollback()
        print(f"\n❌ Lỗi: {exc}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Tạo tài khoản admin nhanh")
    parser.add_argument("--email", default="admin@rental.com", help="Email")
    parser.add_argument("--password", default="Admin@123456", help="Password")
    parser.add_argument("--firstname", default="Admin", help="First name")
    parser.add_argument("--lastname", default="System", help="Last name")
    parser.add_argument("--phone", default="0123456789", help="Phone number")
    
    args = parser.parse_args()
    
    create_admin(
        email=args.email,
        password=args.password,
        first_name=args.firstname,
        last_name=args.lastname,
        phone=args.phone
    )


if __name__ == "__main__":
    main()
