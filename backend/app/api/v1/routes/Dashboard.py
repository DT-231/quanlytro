"""
Dashboard API Routes
Endpoint tổng hợp cho admin dashboard - trả về tất cả thống kê cần thiết trong 1 request
"""

from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.infrastructure.db.session import get_db
from app.core import response
from app.core.security import get_current_user
from app.services.DashboardService import DashboardService
from app.models.user import User


def is_admin(user: User) -> bool:
    """Kiểm tra user có role admin không"""
    return user.role and user.role.role_code.upper() == "ADMIN"


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", status_code=status.HTTP_200_OK)
def get_dashboard_stats(
    building_id: Optional[str] = Query(None, description="Filter theo tòa nhà"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lấy toàn bộ thống kê cho Dashboard Admin trong 1 request
    
    Trả về:
    - Room stats (tổng phòng, phòng trống, doanh thu)
    - Maintenance stats (tổng sự cố, pending, in_progress)
    - Contract stats (tổng HĐ, sắp hết hạn, active)
    - Recent activities (thanh toán, yêu cầu hủy HĐ, sự cố mới)
    - Pending appointments
    """
    try:
        # Chỉ admin mới được truy cập
        if not is_admin(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Chỉ admin mới có quyền truy cập dashboard"
            )
        
        # Parse building_id to UUID if provided
        building_uuid = None
        if building_id:
            try:
                building_uuid = UUID(building_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="building_id không hợp lệ"
                )
        
        # Sử dụng DashboardService để lấy toàn bộ dữ liệu
        dashboard_service = DashboardService(session)
        dashboard_data = dashboard_service.get_dashboard_stats(
            user_id=current_user.id,
            building_id=building_uuid
        )
        
        return response.success(
            data=dashboard_data,
            message="Lấy dữ liệu dashboard thành công"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi lấy dữ liệu dashboard: {str(e)}"
        )
