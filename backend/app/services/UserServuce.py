

from backend.app.repositories.user_repository import UserRepository
from sqlalchemy.orm import Session


class RoomService:
    """Service xử lý business logic cho Room.
    
    - Validate các quy tắc nghiệp vụ.
    - Điều phối CRUD operations qua Repository.
    
    Args:
        db: SQLAlchemy Session được inject từ FastAPI Depends.
    """
    
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def get_list_user(self):
        try:
            pass
        except:
            pass
