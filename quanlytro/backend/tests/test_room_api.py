"""Basic tests for Room API endpoints.

Để chạy test: pytest tests/test_room_api.py -v
"""

import pytest
from fastapi.testclient import TestClient
from uuid import uuid4

# TODO: Import main app và setup test database
# from main import app
# from app.infrastructure.db.session import Base, engine

# client = TestClient(app)


def test_placeholder():
    """Placeholder test - implement khi có test database setup."""
    assert True


# Sau khi setup test database, có thể thêm các test như:
# 
# def test_create_room():
#     """Test tạo phòng mới."""
#     payload = {
#         "building_id": str(uuid4()),
#         "room_number": "101",
#         "room_name": "Phòng đơn",
#         "area": 25.0,
#         "capacity": 2,
#         "base_price": "3000000.00",
#         "status": "AVAILABLE"
#     }
#     response = client.post("/api/v1/rooms", json=payload)
#     assert response.status_code == 201
#     data = response.json()
#     assert data["code"] == 201
#     assert data["data"]["room_number"] == "101"
#
# def test_list_rooms():
#     """Test lấy danh sách phòng."""
#     response = client.get("/api/v1/rooms")
#     assert response.status_code == 200
#     data = response.json()
#     assert "items" in data["data"]
#     assert "total" in data["data"]
#
# def test_get_room():
#     """Test xem chi tiết phòng."""
#     # Tạo room trước
#     # Sau đó get room
#     pass
#
# def test_update_room():
#     """Test cập nhật phòng."""
#     pass
#
# def test_delete_room():
#     """Test xóa phòng."""
#     pass
