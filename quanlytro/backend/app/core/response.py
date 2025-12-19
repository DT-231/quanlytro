from __future__ import annotations

from typing import Any
from app.schemas.response_schema import Response


def _normalize_data(data: Any) -> Any:
    """Ensure data defaults to {} (object) when None.

    Call sites that explicitly want an array can pass [] as data.
    """
    if data is None:
        return {}
    return data


def success(data: Any = None, message: str = "success") -> Response[Any]:
    """Return successful response with HTTP 200."""
    return Response(success=True, message=message, data=_normalize_data(data))


def created(data: Any = None, message: str = "success") -> Response[Any]:
    """Return successful creation response with HTTP 201."""
    return Response(success=True, message=message, data=_normalize_data(data))


def bad_request(message: str = "bad request", data: Any = None) -> Response[Any]:
    """Return bad request error with HTTP 400."""
    return Response(success=False, message=message, data=_normalize_data(data))


def unauthorized(message: str = "unauthorized", data: Any = None) -> Response[Any]:
    """Return unauthorized error with HTTP 401."""
    return Response(success=False, message=message, data=_normalize_data(data))


def forbidden(message: str = "forbidden", data: Any = None) -> Response[Any]:
    """Return forbidden error with HTTP 403."""
    return Response(success=False, message=message, data=_normalize_data(data))


def not_found(message: str = "not found", data: Any = None) -> Response[Any]:
    """Return not found error with HTTP 404."""
    return Response(success=False, message=message, data=_normalize_data(data))


def conflict(message: str = "conflict", data: Any = None) -> Response[Any]:
    """Return conflict error with HTTP 409."""
    return Response(success=False, message=message, data=_normalize_data(data))


def unprocessable_entity(message: str = "unprocessable entity", data: Any = None) -> Response[Any]:
    """Return unprocessable entity error with HTTP 422."""
    return Response(success=False, message=message, data=_normalize_data(data))


def internal_error(message: str = "internal server error", data: Any = None) -> Response[Any]:
    """Return internal server error with HTTP 500."""
    return Response(success=False, message=message, data=_normalize_data(data))


def no_content(message: str = "no content") -> Response[Any]:
    """Response for successful deletion or operations with no content to return."""
    return Response(success=True, message=message, data={})


def custom(code: int, message: str = "custom", data: Any = None) -> Response[Any]:
    """Return custom response with specified code."""
    success = 200 <= code < 300
    return Response(success=success, message=message, data=_normalize_data(data))
