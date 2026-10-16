import asyncio
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_api():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Health Check
        r_health = await client.get("/health")
        print("Health Check:", r_health.json())

        # 2. Login
        login_payload = {
            "username_or_phone": "sbdcrakesh",
            "password": "7899353535"
        }
        r_login = await client.post("/api/v1/auth/login", json=login_payload)
        assert r_login.status_code == 200, f"Login failed: {r_login.text}"
        data = r_login.json()
        print(f"Logged in as: {data['full_name']} | Role: {data['role']} | Lab: {data['laboratory_name']}")
        token = data["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Fetch Dashboard Stats
        r_stats = await client.get("/api/v1/dashboard/stats", headers=headers)
        print("Dashboard KPIs:", r_stats.json())

        # 4. Fetch Technician Worklist
        r_worklist = await client.get("/api/v1/results/worklist", headers=headers)
        worklist = r_worklist.json()
        assert isinstance(worklist, list), "Worklist must be a list"
        print(f"Worklist items: {len(worklist)}")

        if len(worklist) > 0:
            first_item = worklist[0]
            print(f"First Worklist Item: Patient={first_item['patient_name']}, Test={first_item['test_name']}")
            result_id = first_item["test_result_id"]
            r_detail = await client.get(f"/api/v1/results/{result_id}", headers=headers)
            assert r_detail.status_code == 200
            detail = r_detail.json()
            print(f"Fetched Parameter Rows count: {len(detail.get('parameters', []))}")

        print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(test_api())
