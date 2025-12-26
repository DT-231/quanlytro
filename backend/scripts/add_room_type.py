import json
import requests
from pathlib import Path

# ===== CONFIG =====
API_URL = "http://localhost:8000/api/v1/room-types"
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjY2Nzk4NzQsInR5cGUiOiJhY2Nlc3MiLCJzdWIiOiI0NTg0MWRjYS05NzE3LTQzMzgtOWNlOC04NDdiN2FkNTQ2YzAifQ.KA21v5LgnbjxroWbrJClsN3Yre7gRPelhYGFT_znSdw"  # bearer token
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
