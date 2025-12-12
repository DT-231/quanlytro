
from __future__ import annotations

from typing import Optional
from uuid import UUID
from app.core import response
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session


from app.infrastructure.db.session import get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/users", tags=["Users Management"])

@router("")
def get_list_user(db: Session = Depends(get_db)):

    try:
        service = user
        return response.success(data=result, message="Lấy danh sách phòng thành công")
    except ValueError as e:
        return response.bad_request(message=str(e))
    except Exception as e:
        return response.internal_error(message=f"Lỗi hệ thống: {str(e)}")
