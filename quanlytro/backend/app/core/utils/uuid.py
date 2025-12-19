from __future__ import annotations

import datetime
from time import timezone
import uuid
from typing import Final


def create_uuid_v7():
    # Get current timestamp in milliseconds
    unix_ts_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

    # Generate random bits for the remaining fields
    random_uuid = uuid.uuid4()
    random_bytes = random_uuid.bytes

    # Construct the UUID fields
    time_low = (unix_ts_ms >> 16) & 0xFFFFFFFF
    time_mid = unix_ts_ms & 0xFFFF
    time_high_and_version = ((unix_ts_ms >> 48) & 0x0FFF) | (0x7 << 12)
    clock_seq_hi_and_reserved = (random_bytes[8] & 0x3F) | 0x80

    # Combine fields into a UUID
    final_bytes = (
    time_low.to_bytes(4, byteorder="big") +
    time_mid.to_bytes(2, byteorder="big") +
    time_high_and_version.to_bytes(2, byteorder="big") +
    bytes([clock_seq_hi_and_reserved]) +
    random_bytes[9:]
    )
    return uuid.UUID(bytes=final_bytes)

def generate_uuid7() -> uuid.UUID:
    """Generate a UUIDv7 value.

    Uses the stdlib uuid.uuid7() where available (Python 3.11+).
    If not available for some reason, falls back to uuid.uuid4().
    """
    try:
        return create_uuid_v7()
    except AttributeError:
        # Fallback: uuid4 provides uniqueness but not time-ordered semantics.
        return uuid.uuid4()


DEFAULT_UUID_FN: Final = generate_uuid7
