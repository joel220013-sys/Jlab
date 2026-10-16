import asyncio
import httpx
import sqlite3

BASE_URL = "http://127.0.0.1:8000"

async def test_workbench_results():
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        # Login
        r_login = await client.post("/api/v1/auth/login", json={
            "username_or_phone": "sbdcrakesh",
            "password": "7899353535"
        })
        assert r_login.status_code == 200, f"Login failed: {r_login.text}"
        token = r_login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Query test_results for manja
        conn = sqlite3.connect('backend/pulselab.db')
        c = conn.cursor()
        test_codes = ['ECG', 'D_DIMER', 'HBA1C', 'LITHIUM', 'GARDINAL', 'S_CALCIUM', 'URN_CALC_24H', 'GTT']
        
        print("=== VERIFYING WORKBENCH API RESULTS FOR PATIENT MANJA ===")
        for code in test_codes:
            row = c.execute("""
                SELECT tr.id, t.code, t.name 
                FROM test_results tr 
                JOIN tests t ON tr.test_id = t.id 
                JOIN orders o ON tr.order_id = o.id 
                JOIN patients p ON o.patient_id = p.id 
                WHERE p.full_name = 'manja' AND t.code = ?
            """, (code,)).fetchone()
            
            if not row:
                print(f"Test {code} not ordered for manja.")
                continue

            tr_id, t_code, t_name = row
            r = await client.get(f"/api/v1/results/{tr_id}", headers=headers)
            assert r.status_code == 200, f"Failed GET /api/v1/results/{tr_id}: {r.text}"
            data = r.json()
            print(f"\n[HTTP 200] Test: {data['test']['name']} ({data['test']['code']})")
            for param in data["parameters"]:
                print(f"  -> Param: {param['name']} ({param['code']}) | Unit: '{param['unit']}' | Type: {param['value_type']} | Range: [{param['reference_low']} - {param['reference_high']}] | Text: '{param['reference_text']}'")

        conn.close()

if __name__ == "__main__":
    asyncio.run(test_workbench_results())
