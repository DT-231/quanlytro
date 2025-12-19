from sqlalchemy import Column, DateTime, func
from app.infrastructure.db.session import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.utils.uuid import generate_uuid7


class BaseModel(Base):
    __abstract__ = True

    # Use UUIDv7 (time-ordered) where available for better index locality.
    id = Column(UUID(as_uuid=True), primary_key=True, default=generate_uuid7)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
