from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from passlib.context import CryptContext
from jose import jwt

from sqlalchemy.orm import Session

from app.core.settings import settings
from app.infrastructure.db.session import get_db
from app.repositories.user_repository import UserRepository


# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
	return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
	return pwd_context.verify(plain_password, hashed_password)


# HTTPBearer scheme for JWT token authentication
security = HTTPBearer()


def _get_int_env(value: str | None, default: int) -> int:
	try:
		return int(value)  # type: ignore[arg-type]
	except Exception:
		return default


def create_access_token(subject: str | dict[str, Any], expires_minutes: int | None = None) -> str:
	"""Create a JWT access token. """
	expire_minutes = (
		_get_int_env(settings.ACCESS_TOKEN_EXPIRE, 60) if expires_minutes is None else expires_minutes
	)
	expire = datetime.utcnow() + timedelta(minutes=expire_minutes)
	payload = {"exp": expire, "type": "access"}
	if isinstance(subject, str):
		payload.update({"sub": subject})
	else:
		payload.update(subject)
		if "sub" not in payload:
			raise ValueError("subject must contain 'sub'")

	token = jwt.encode(payload, settings.SECRET_KEY or "", algorithm=settings.ALGORITHM)
	return token


def create_refresh_token(subject: str | dict[str, Any], expires_days: int | None = None) -> str:
	"""Create a JWT refresh token."""
	expire_days = (
		_get_int_env(settings.REFRESH_TOKEN_EXPIRE_DAY, 7) if expires_days is None else expires_days
	)
	expire = datetime.utcnow() + timedelta(days=expire_days)
	payload = {"exp": expire, "type": "refresh"}
	if isinstance(subject, str):
		payload.update({"sub": subject})
	else:
		payload.update(subject)
		if "sub" not in payload:
			raise ValueError("subject must contain 'sub'")

	token = jwt.encode(payload, settings.SECRET_KEY or "", algorithm=settings.ALGORITHM)
	return token


def decode_token(token: str) -> dict[str, Any]:
	try:
		payload = jwt.decode(token, settings.SECRET_KEY or "", algorithms=[settings.ALGORITHM])
		return payload
	except jwt.ExpiredSignatureError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
	except jwt.InvalidTokenError:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
	"""FastAPI dependency that returns current user (or raises 401)."""
	token = credentials.credentials
	payload = decode_token(token)
	if payload.get("type") != "access":
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

	sub = payload.get("sub")
	if not sub:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

	repo = UserRepository(db)
	user = repo.get_by_id(sub)
	if not user:
		raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
	return user

