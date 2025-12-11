from __future__ import annotations

from pydantic import BaseModel, Field


class Token(BaseModel):
    access_token: str = Field(...)
    refresh_token: str | None = Field(None)
    token_type: str = Field(default="bearer")


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    """Schema for login response with user and token."""
    user: dict  # UserOut will be converted to dict
    token: Token

    model_config = {"from_attributes": True}
