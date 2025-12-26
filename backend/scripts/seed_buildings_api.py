import json
import requests
import os

# Configuration
API_URL = "http://localhost:8000/api/v1/buildings"
SEED_DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'buildings_seed.json'))
TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjY2Nzk4NzQsInR5cGUiOiJhY2Nlc3MiLCJzdWIiOiI0NTg0MWRjYS05NzE3LTQzMzgtOWNlOC04NDdiN2FkNTQ2YzAifQ.KA21v5LgnbjxroWbrJClsN3Yre7gRPelhYGFT_znSdw"

def seed_buildings():
    if not os.path.exists(SEED_DATA_PATH):
        print(f"Seed data file not found: {SEED_DATA_PATH}")
        print("Please run generate_buildings_data.py first.")
        return

    with open(SEED_DATA_PATH, 'r', encoding='utf-8') as f:
        buildings = json.load(f)

    print(f"Starting to seed {len(buildings)} buildings to {API_URL}...")
    
    success_count = 0
    fail_count = 0
    headers = {
        "Authorization": f"Bearer {TOKEN}"
    }

    for building in buildings:
        try:
            response = requests.post(API_URL, json=building, headers=headers, timeout=10)
            if response.status_code in [200, 201]:
                print(f"Successfully created: {building['building_name']} ({building['building_code']})")
                success_count += 1
            else:
                print(f"Failed to create: {building['building_name']}. Status: {response.status_code}, Error: {response.text}")
                fail_count += 1
        except requests.exceptions.ConnectionError:
            print("Error: Could not connect to the API server. Is it running on http://localhost:8000?")
            return
        except Exception as e:
            print(f"Error creating building {building['building_name']}: {e}")
            fail_count += 1

    print(f"\nSeeding completed!")
    print(f"Total: {len(buildings)}")
    print(f"Success: {success_count}")
    print(f"Failed: {fail_count}")

if __name__ == "__main__":
    seed_buildings()
