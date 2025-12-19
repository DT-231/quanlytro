# GitHub Copilot Instructions — FastAPI + PostgreSQL + REST (Schema‑Based Clean)

> **Mục tiêu**: Dùng **Pydantic Schemas** làm hợp nhất *input/output model* và *dữ liệu trao đổi* giữa các tầng; tách **Service (use case)** và **Repository**; tuân thủ **REST**; code **clean**, **có chú thích**, **type‑safe**; dùng **SQLAlchemy 2.x** + **Alembic** + **PostgreSQL**.

---

## 1 Kiến trúc (Schema‑Based Clean Architecture)

**Nguyên tắc cốt lõi**
- Router (FastAPI) mỏng → gọi **Service** → Service gọi **Repository** → Repository thao tác **ORM**.
- **Schemas (Pydantic)** làm hợp nhất *request/response models* + *data contracts* giữa các tầng.
- Không đưa business logic vào Router/ORM. Business logic gói trong **Service**.
- Dùng **Dependency Injection** (FastAPI `Depends`) cho session/Service/Repo.

**Sơ đồ thư mục chuẩn**
```
app/
  core/                 # config, security, logging, settings
  schemas/              # Pydantic models (In/Out/Base) — hợp nhất DTO
    room_schema.py
    user_schema.py
  services/             # business/application services (use cases)
    room_service.py
  repositories/         # data-access layer (SQLAlchemy)
    room_repo.py
  models/               # SQLAlchemy ORM models
    room_model.py
  api/                  # FastAPI routers (controllers)
    room_router.py
  infrastructure/db/    # (tuỳ chọn) session, migrations
    session.py
    migrations/
main.py
alembic.ini
.env.example
```

---

## 2 Chuẩn coding & comment

**Bắt buộc**
- Python ≥ 3.11, **type hints đầy đủ**; dùng `from __future__ import annotations` nếu cần.
- **Docstring** theo **Google style** cho class/hàm public. Comment tập trung **“tại sao”**.
- **Clean Code**: Hàm < 40 dòng; đặt tên rõ ràng; SRP; không side effects lạ.
- Không trộn business logic trong Router/ORM; **Service** là nơi chính.

**Công cụ style**
- **Black** (line length 100), **isort**, **ruff**, **mypy (strict)**, **pytest**.
- Có `pyproject.toml` cấu hình sẵn.

**Mẫu docstring**
```python
class RoomService:
    """Xử lý luồng nghiệp vụ cho Room (create/get/list/update/delete).

    Args:
        session: Async SQLAlchemy session được tiêm qua FastAPI Depends.
    """
```

---

## 3 REST với FastAPI

- Endpoint theo tài nguyên số nhiều: `/api/v1/rooms`, `/api/v1/users`.
- **HTTP methods**: GET (list/detail), POST (create), PUT/PATCH (update), DELETE (remove).
- **Status codes**: 200/201/204/400/401/403/404/409/422/500.
- **Validation** và **serialization** dùng **Pydantic Schemas**; bật `model_config`/`orm_mode` để convert từ ORM.
- Lỗi chuẩn hóa: `{ "detail": "...", "code": "...", "meta": {...} }`.
- **Pagination**: `?page & size` hoặc `?offset & limit`; trả `total/items/page/size` khi cần.
- Khai báo `tags`, `responses`, `summary`, `description` cho OpenAPI.

**Ví dụ Router (rút gọn, có comment)**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.room_schema import RoomCreate, RoomUpdate, RoomOut
from app.services.room_service import RoomService
from app.infrastructure.db.session import get_session

router = APIRouter(prefix="/api/v1/rooms", tags=["Rooms"])

@router.post("/", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
async def create_room(payload: RoomCreate, session: AsyncSession = Depends(get_session)):
    service = RoomService(session)
    try:
        return await service.create_room(payload)
    except ValueError as e:
        # map lỗi nghiệp vụ về HTTP 400
        raise HTTPException(status_code=400, detail=str(e))
```

---

## 4) PostgreSQL, SQLAlchemy 2.x, Alembic

- Dùng **SQLAlchemy 2.x** (Declarative + typed). **Async** với `asyncpg` nếu phù hợp.
- ORM models trong `app/models/` (không chứa business logic).
- **Alembic** cho migration. Mọi thay đổi schema phải có migration.
- Session quản lý qua dependency `get_session()` (async context manager), đảm bảo đóng/rollback đúng chuẩn.
- Index/constraint đặt tên có nghĩa: `uq_rooms_code`, `ix_rooms_status`.

**Ví dụ Session DI (async)**
```python
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.settings import settings

engine = create_async_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False, autoflush=False, autocommit=False)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
```

---

## 5 Schemas (Pydantic) — hợp nhất DTO

- `RoomBase`, `RoomCreate`, `RoomUpdate`, `RoomOut`.
- `RoomOut.model_config = { "from_attributes": True }` (Pydantic v2) để map từ ORM.
- Schema chỉ chứa **validate/shape**, **không** chứa truy cập DB hay side effects.

**Ví dụ** (`app/schemas/room_schema.py`):
```python
from pydantic import BaseModel, Field

class RoomBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    name: str
    price: int = Field(..., gt=0)
    status: str = "available"

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    name: str | None = None
    price: int | None = None
    status: str | None = None

class RoomOut(RoomBase):
    id: int

    model_config = {
        "from_attributes": True  # thay cho orm_mode ở Pydantic v1
    }
```

---

## 6 Service Layer (Use Cases)

- Chứa **luồng nghiệp vụ**: kiểm tra trùng mã, quy tắc giá, quyền…
- Chỉ gọi **Repository**, không chạm ORM trực tiếp ngoài repo.
- Trả về **ORM instance** hoặc **schema**; khuyến nghị trả ORM và để Router tự serialize bằng `response_model`.

**Ví dụ** (`app/services/room_service.py`):
```python
from sqlalchemy.ext.asyncio import AsyncSession
from app.repositories.room_repo import RoomRepository
from app.schemas.room_schema import RoomCreate, RoomUpdate

class RoomService:
    """Nghiệp vụ cho Room.

    - Validate quy tắc nghiệp vụ (ví dụ: code duy nhất, price > 0).
    - Điều phối CRUD qua Repository.
    """
    def __init__(self, session: AsyncSession):
        self.repo = RoomRepository(session)

    async def create_room(self, data: RoomCreate):
        if data.price <= 0:
            raise ValueError("Price must be positive")
        existed = await self.repo.get_by_code(data.code)
        if existed:
            raise ValueError("Room code already exists")
        return await self.repo.create(data)

    async def get_room(self, room_id: int):
        return await self.repo.require(room_id)

    async def list_rooms(self, offset: int = 0, limit: int = 20):
        return await self.repo.list(offset, limit)

    async def update_room(self, room_id: int, data: RoomUpdate):
        room = await self.repo.require(room_id)
        return await self.repo.update(room, data)

    async def delete_room(self, room_id: int) -> None:
        room = await self.repo.require(room_id)
        await self.repo.delete(room)
```

---

## 7 Repository (SQLAlchemy)

- Chỉ xử lý **truy vấn DB** + map kết quả; không chứa rule nghiệp vụ.
- Trả **ORM model** để Router có thể serialize sang Schema Out.

**Ví dụ** (`app/repositories/room_repo.py`):
```python
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.room_model import RoomModel
from app.schemas.room_schema import RoomCreate, RoomUpdate

class RoomRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def require(self, room_id: int) -> RoomModel:
        room = await self.get(room_id)
        if not room:
            raise ValueError("Room not found")
        return room

    async def get(self, room_id: int) -> RoomModel | None:
        res = await self.session.execute(select(RoomModel).where(RoomModel.id == room_id))
        return res.scalar_one_or_none()

    async def get_by_code(self, code: str) -> RoomModel | None:
        res = await self.session.execute(select(RoomModel).where(RoomModel.code == code))
        return res.scalar_one_or_none()

    async def list(self, offset: int = 0, limit: int = 20) -> list[RoomModel]:
        res = await self.session.execute(select(RoomModel).offset(offset).limit(limit))
        return list(res.scalars().all())

    async def create(self, data: RoomCreate) -> RoomModel:
        obj = RoomModel(**data.model_dump())
        self.session.add(obj)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def update(self, obj: RoomModel, data: RoomUpdate) -> RoomModel:
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(obj, k, v)
        await self.session.commit()
        await self.session.refresh(obj)
        return obj

    async def delete(self, obj: RoomModel) -> None:
        await self.session.delete(obj)
        await self.session.commit()
```

---

## 8 ORM Model (SQLAlchemy)

**Ví dụ** (`app/models/room_model.py`):
```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import Integer, String

class Base(DeclarativeBase):
    pass

class RoomModel(Base):
    __tablename__ = "rooms"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255))
    price: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(20), index=True)
```

---

## 9 API Router (Controller)

**Ví dụ** (`app/api/room_router.py`):
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.room_schema import RoomCreate, RoomUpdate, RoomOut
from app.services.room_service import RoomService
from app.infrastructure.db.session import get_session

router = APIRouter(prefix="/api/v1/rooms", tags=["Rooms"])

@router.post("/", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
async def create_room(payload: RoomCreate, session: AsyncSession = Depends(get_session)):
    service = RoomService(session)
    try:
        return await service.create_room(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{room_id}", response_model=RoomOut)
async def get_room(room_id: int, session: AsyncSession = Depends(get_session)):
    service = RoomService(session)
    try:
        return await service.get_room(room_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Room not found")
```

---

## 10 Bảo mật & Config

- Cấu hình qua **pydantic-settings** (`Settings(BaseSettings)`), không hard‑code secrets.
- JWT Auth: `passlib[bcrypt]` + `python-jose[cryptography]`.
- CORS whitelist rõ ràng.
- Logging chuẩn; **không log secrets**.

---

## 11 Testing

- **pytest**: unit cho Service (mock repo/session), integration cho Repo/Router (test DB thật hoặc Testcontainers/Docker Compose).
- Fixtures tạo session tạm; rollback giữa test cases.

---

## 12 Quy tắc sinh mã cho Copilot (Do/Don't)

**DO**
- Viết **type hints**, **docstrings**, **comments** ngắn gọn, rõ “tại sao”.
- Dùng **Schemas** cho input/output; Router chỉ nhận/trả schema.
- Service thực thi rule; Repo chỉ truy cập DB; Model chỉ mapping.
- Thêm **Alembic migration** khi đổi Models.
- Sinh **tests** cơ bản cho Service/Repo.

**DON'T**
- Đưa logic nghiệp vụ vào Router/Repo/Model.
- Trả kiểu `Any`/thiếu type hints.
- Truy cập env/secrets trong Service/Repo (đặt ở core/settings).

---

## 13 Mẫu cấu hình `pyproject.toml` (rút gọn)

```toml
[tool.black]
line-length = 100

[tool.isort]
profile = "black"

[tool.ruff]
line-length = 100
select = ["E","F","I","N","B","UP","ANN","C4"]
ignore = ["ANN101","ANN102"]

[tool.mypy]
python_version = "3.11"
strict = true
warn_unused_ignores = true
warn_redundant_casts = true
no_implicit_optional = true

[tool.pytest.ini_options]
addopts = "-q"
```

---

## 14 Quy ước commit & PR

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `test:`, `chore:`, `docs:`.
- PR phải có: mô tả ngắn, checklist test, migration note, ví dụ request/response.

---

## 15 Checklist Copilot khi sinh mã (Schema‑Based)

- [ ] Dùng **Schemas** cho input/output, `model_config.from_attributes = True` khi cần.
- [ ] Router mỏng, chỉ gọi **Service** và trả **response_model**.
- [ ] Service chứa rule; Repo chỉ DB; Model chỉ mapping.
- [ ] Có **Alembic migration** khi thay đổi Models.
- [ ] Viết **tests** tối thiểu cho Service/Repo.
- [ ] Tuân thủ **status codes** và format lỗi.
- [ ] Đảm bảo **type hints** và **docstrings/comments** súc tích.

---

> Đặt file này ở root repo với tên **`copilot-instructions.md`** để Copilot nắm bối cảnh và quy tắc sinh mã theo *schema‑based clean*. 

