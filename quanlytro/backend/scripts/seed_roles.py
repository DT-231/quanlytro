#!/usr/bin/env python3
"""Seed the `roles` table with default roles.

This script is idempotent: it will skip roles that already exist.

Usage:
    python scripts/seed_roles.py

It uses the project's SQLAlchemy SessionLocal (so ensure your environment
variables / settings are configured, e.g. DATABASE_URL).
"""
from __future__ import annotations

from typing import List, Tuple
import sys
from pathlib import Path

# Ensure project root is on sys.path so `import app.*` works when running
# this script directly (e.g. `python scripts/seed_roles.py`).
project_root = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(project_root))

from app.infrastructure.db.session import SessionLocal
from app.models.role import Role


ROLES: List[Tuple[str, str, str]] = [
    ("ADMIN", "Administrator", "Toàn quyền hệ thống"),
    ("TENANT", "Tenant", "Người thuê"),
    ("CUSTOMER", "Customer", "Khách hàng tiềm năng (Người có tài khoản nhưng chưa thuê nhà)")
]


def seed_roles() -> None:
    db = SessionLocal()
    try:
        added = 0
        for code, name, description in ROLES:
            existing = db.query(Role).filter(Role.role_code == code).first()
            if existing:
                print(f"[SKIP] role {code} already exists")
                continue

            role = Role(role_code=code, role_name=name, description=description)
            db.add(role)
            added += 1

        if added:
            db.commit()
            print(f"Inserted {added} new role(s)")
        else:
            print("No new roles to insert")

    except Exception as exc:  # keep broad handling for a simple utility script
        db.rollback()
        print("Error while seeding roles:", exc, file=sys.stderr)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_roles()
