import json
import requests
from pathlib import Path

# ===== CONFIG =====
API_URL = "http://localhost:8000/api/v1/room-types"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjYzMzkwOTcsInR5cGUiOiJhY2Nlc3MiLCJzdWIiOiI2ZGZkZDUzNy1hODg2LTRjMDQtYTY3YS1jYTA3OGEwMTVjNzMifQ.q0e5IrsH1i01iDvPd-Bhp4MECLi4qcyrvL5u9u31B88"  # bearer token
JSON_FILE = Path("data/room_type.json")

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
}

# ===== LOAD JSON =====
# with open(JSON_FILE, "r", encoding="utf-8") as f:
#     room_types = json.load(f)
with open(JSON_FILE, "r", encoding="utf-8") as f:
    room_types = json.load(f)

print("DEBUG type:", type(room_types))
print("DEBUG content:", room_types)
exit()

print(f"📦 Loaded {len(room_types)} room types")

# ===== SEED DATA =====
for idx, room in enumerate(room_types, start=1):
    try:
        res = requests.post(API_URL, json=room, headers=headers)

        if res.status_code in (200, 201):
            print(f"✅ [{idx}] Created: {room['name']}")
        elif res.status_code == 409:
            print(f"⚠️ [{idx}] Duplicate: {room['name']}")
        else:
            print(
                f"❌ [{idx}] Failed: {room['name']} | "
                f"{res.status_code} | {res.text}"
            )

    except Exception as e:
        print(f"🔥 [{idx}] Error: {room['name']} | {e}")
