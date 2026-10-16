import httpx
import asyncio

async def test_frontend_and_backend():
    print("=== Testing Frontend Order Intake Page ===")
    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get("http://localhost:3000/lab/orders/new")
        print(f"Frontend GET /lab/orders/new status: {r.status_code}")
        assert r.status_code == 200, "Frontend did not return 200"
        
        print("\n=== Testing Backend Test Search with Shortcuts ===")
        # Login
        r_login = await client.post("http://localhost:8000/api/v1/auth/login", json={
            "username_or_phone": "sbdcrakesh",
            "password": "7899353535"
        })
        token = r_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test queries
        test_queries = ["cbc", "mch", "lft", "kft", "fbs", "bt/ct", "tft", "se", "lipid", "esr"]
        for q in test_queries:
            r_search = await client.get(f"http://localhost:8000/api/v1/tests?search={q}", headers=headers)
            matches = r_search.json()
            codes = [m['code'] for m in matches]
            print(f"Query '{q}': {len(matches)} match(es) -> {codes[:5]}")
            assert len(matches) > 0, f"Query '{q}' returned 0 matches!"

    print("\nALL SHORTCUT TESTS PASSED WITH 100% SUCCESS!")

asyncio.run(test_frontend_and_backend())
