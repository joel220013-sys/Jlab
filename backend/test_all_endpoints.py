import asyncio
import httpx

BASE_URL = "http://127.0.0.1:8000"

async def run_comprehensive_api_check():
    print("=" * 70)
    print(" PULSELAB OS - COMPREHENSIVE ENDPOINT AUDIT & VERIFICATION")
    print("=" * 70)

    results = []

    def record(name, method, endpoint, status_code, passed, details=""):
        results.append({
            "name": name,
            "method": method,
            "endpoint": endpoint,
            "status": status_code,
            "passed": passed,
            "details": details
        })
        mark = "PASS" if passed else "FAIL"
        print(f"[{mark:4}] {method:4} {endpoint:<45} (HTTP {status_code}) {details}")

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        # 1. Health
        try:
            r = await client.get("/health")
            record("System Health", "GET", "/health", r.status_code, r.status_code == 200, r.json().get("status", ""))
        except Exception as e:
            record("System Health", "GET", "/health", 0, False, str(e))

        # 2. Login (Admin)
        token = ""
        try:
            r = await client.post("/api/v1/auth/login", json={
                "username_or_phone": "sbdcrakesh",
                "password": "7899353535"
            })
            passed = r.status_code == 200 and "access_token" in r.json()
            if passed:
                token = r.json()["access_token"]
                role = r.json().get("role")
                record("Admin Login", "POST", "/api/v1/auth/login", r.status_code, True, f"Role: {role}")
            else:
                record("Admin Login", "POST", "/api/v1/auth/login", r.status_code, False, r.text)
        except Exception as e:
            record("Admin Login", "POST", "/api/v1/auth/login", 0, False, str(e))

        headers = {"Authorization": f"Bearer {token}"} if token else {}

        # 3. Auth Me
        try:
            r = await client.get("/api/v1/auth/me", headers=headers)
            record("Current User Info", "GET", "/api/v1/auth/me", r.status_code, r.status_code == 200, r.json().get("email", ""))
        except Exception as e:
            record("Current User Info", "GET", "/api/v1/auth/me", 0, False, str(e))

        # 4. Dashboard Stats
        try:
            r = await client.get("/api/v1/dashboard/stats", headers=headers)
            passed = r.status_code == 200 and "today_orders" in r.json()
            d = r.json()
            record("Dashboard KPIs", "GET", "/api/v1/dashboard/stats", r.status_code, passed, f"Orders: {d.get('today_orders')}, Rev: INR {d.get('revenue_today')}")
        except Exception as e:
            record("Dashboard KPIs", "GET", "/api/v1/dashboard/stats", 0, False, str(e))

        # 5. Tests Catalog (All)
        test_ids = []
        try:
            r = await client.get("/api/v1/tests", headers=headers)
            tests = r.json()
            passed = r.status_code == 200 and len(tests) >= 200
            test_ids = [t["id"] for t in tests[:3]]
            record("Full Test Catalog", "GET", "/api/v1/tests", r.status_code, passed, f"Count: {len(tests)} tests active")
        except Exception as e:
            record("Full Test Catalog", "GET", "/api/v1/tests", 0, False, str(e))

        # 6. Tests Catalog Filter (Biochemistry)
        try:
            r = await client.get("/api/v1/tests?category=BIOCHEMISTRY", headers=headers)
            tests = r.json()
            passed = r.status_code == 200 and len(tests) > 0 and all(t["category_name"] == "BIOCHEMISTRY" for t in tests)
            record("Test Catalog (Biochemistry)", "GET", "/api/v1/tests?category=BIOCHEMISTRY", r.status_code, passed, f"Count: {len(tests)}")
        except Exception as e:
            record("Test Catalog (Biochemistry)", "GET", "/api/v1/tests?category=BIOCHEMISTRY", 0, False, str(e))

        # 7. Tests Search (glucose)
        try:
            r = await client.get("/api/v1/tests?search=glucose", headers=headers)
            tests = r.json()
            passed = r.status_code == 200 and len(tests) > 0
            record("Test Search (glucose)", "GET", "/api/v1/tests?search=glucose", r.status_code, passed, f"Matches: {len(tests)}")
        except Exception as e:
            record("Test Search (glucose)", "GET", "/api/v1/tests?search=glucose", 0, False, str(e))

        # 8. Patients List
        patient_id = ""
        try:
            r = await client.get("/api/v1/patients", headers=headers)
            patients = r.json()
            passed = r.status_code == 200 and len(patients) > 0
            if passed:
                patient_id = patients[0]["id"]
            record("Patients List", "GET", "/api/v1/patients", r.status_code, passed, f"Found: {len(patients)} patients")
        except Exception as e:
            record("Patients List", "GET", "/api/v1/patients", 0, False, str(e))

        # 9. Doctors List
        doctor_id = ""
        try:
            r = await client.get("/api/v1/patients/doctors", headers=headers)
            docs = r.json()
            passed = r.status_code == 200
            if passed and len(docs) > 0:
                doctor_id = docs[0]["id"]
            record("Doctors Directory", "GET", "/api/v1/patients/doctors", r.status_code, passed, f"Doctors: {len(docs)}")
        except Exception as e:
            record("Doctors Directory", "GET", "/api/v1/patients/doctors", 0, False, str(e))

        # 10. Create New Patient
        new_patient_id = ""
        try:
            p_payload = {
                "full_name": "Test Audit Patient",
                "phone": "9998887771",
                "gender": "MALE",
                "age_years": 38,
                "blood_group": "O_POS"
            }
            r = await client.post("/api/v1/patients", json=p_payload, headers=headers)
            passed = r.status_code == 200 and "id" in r.json()
            if passed:
                new_patient_id = r.json()["id"]
            record("Create Patient", "POST", "/api/v1/patients", r.status_code, passed, f"UHID: {r.json().get('uhid', '')}")
        except Exception as e:
            record("Create Patient", "POST", "/api/v1/patients", 0, False, str(e))

        # 11. Orders List
        try:
            r = await client.get("/api/v1/orders", headers=headers)
            orders = r.json()
            passed = r.status_code == 200
            record("Orders List", "GET", "/api/v1/orders", r.status_code, passed, f"Orders: {len(orders)}")
        except Exception as e:
            record("Orders List", "GET", "/api/v1/orders", 0, False, str(e))

        # 12. Create Order
        created_order_id = ""
        created_order_num = ""
        try:
            order_payload = {
                "patient_id": new_patient_id or patient_id,
                "doctor_id": doctor_id or None,
                "test_ids": test_ids[:2] if test_ids else [],
                "discount_amount": 50.0,
                "payment_mode": "UPI",
                "paid_amount": 200.0
            }
            r = await client.post("/api/v1/orders", json=order_payload, headers=headers)
            passed = r.status_code == 200 and "id" in r.json()
            if passed:
                created_order_id = r.json()["id"]
                created_order_num = r.json().get("order_number", "")
            record("Create Unified Order", "POST", "/api/v1/orders", r.status_code, passed, f"Order: {created_order_num}")
        except Exception as e:
            record("Create Unified Order", "POST", "/api/v1/orders", 0, False, str(e))

        # 13. Results Worklist
        worklist_item_id = ""
        try:
            r = await client.get("/api/v1/results/worklist", headers=headers)
            items = r.json()
            passed = r.status_code == 200 and len(items) > 0
            if passed:
                worklist_item_id = items[0]["test_result_id"]
            record("Technician Worklist", "GET", "/api/v1/results/worklist", r.status_code, passed, f"Worklist items: {len(items)}")
        except Exception as e:
            record("Technician Worklist", "GET", "/api/v1/results/worklist", 0, False, str(e))

        # 14. Result Detail
        if worklist_item_id:
            try:
                r = await client.get(f"/api/v1/results/{worklist_item_id}", headers=headers)
                passed = r.status_code == 200 and "parameters" in r.json()
                params = r.json().get("parameters", [])
                record("Result Parameter Entry Form", "GET", f"/api/v1/results/{worklist_item_id}", r.status_code, passed, f"Params: {len(params)}")
            except Exception as e:
                record("Result Parameter Entry Form", "GET", f"/api/v1/results/{worklist_item_id}", 0, False, str(e))

        # 15. Result Entry Direct (POST /results/entry)
        try:
            r = await client.post("/api/v1/results/entry", json={
                "test_result_id": worklist_item_id,
                "values": [{"code": "HB", "numeric_value": 13.5}],
                "technician_notes": "Sample clear, no hemolysis",
                "is_draft": False
            }, headers=headers)
            passed = r.status_code == 200 and r.json().get("status") == "SUCCESS"
            record("Workbench Direct Entry", "POST", "/api/v1/results/entry", r.status_code, passed, r.json().get("message", ""))
        except Exception as e:
            record("Workbench Direct Entry", "POST", "/api/v1/results/entry", 0, False, str(e))

        # 16. Approvals Queue
        approval_item_id = ""
        try:
            r = await client.get("/api/v1/approvals/queue", headers=headers)
            queue = r.json()
            passed = r.status_code == 200
            if passed and len(queue) > 0:
                approval_item_id = queue[0]["test_result_id"]
            record("Pathologist Queue", "GET", "/api/v1/approvals/queue", r.status_code, passed, f"Pending: {len(queue)}")
        except Exception as e:
            record("Pathologist Queue", "GET", "/api/v1/approvals/queue", 0, False, str(e))

        # 17. Pathologist Approve
        target_approve_id = approval_item_id or worklist_item_id
        if target_approve_id:
            try:
                r = await client.post(f"/api/v1/approvals/{target_approve_id}/approve", json={
                    "remarks": "Clinically correlated. Verified and digitally signed."
                }, headers=headers)
                passed = r.status_code == 200 and r.json().get("status") == "SUCCESS"
                record("Pathologist Sign-off", "POST", f"/api/v1/approvals/{target_approve_id}/approve", r.status_code, passed, r.json().get("message", ""))
            except Exception as e:
                record("Pathologist Sign-off", "POST", f"/api/v1/approvals/{target_approve_id}/approve", 0, False, str(e))

        # 18. Billing Invoices List
        invoice_id = ""
        try:
            r = await client.get("/api/v1/billing/invoices", headers=headers)
            invs = r.json()
            passed = r.status_code == 200 and len(invs) > 0
            if passed:
                invoice_id = invs[0]["id"]
            record("Invoices List", "GET", "/api/v1/billing/invoices", r.status_code, passed, f"Invoices: {len(invs)}")
        except Exception as e:
            record("Invoices List", "GET", "/api/v1/billing/invoices", 0, False, str(e))

        # 19. Record Payment
        if invoice_id:
            try:
                r = await client.post(f"/api/v1/billing/invoices/{invoice_id}/pay", json={
                    "amount": 50.0,
                    "payment_method": "UPI"
                }, headers=headers)
                passed = r.status_code == 200 and r.json().get("status") == "SUCCESS"
                record("Record Payment", "POST", f"/api/v1/billing/invoices/{invoice_id}/pay", r.status_code, passed, f"Balance: INR {r.json().get('balance', 0)}")
            except Exception as e:
                record("Record Payment", "POST", f"/api/v1/billing/invoices/{invoice_id}/pay", 0, False, str(e))

        # 20. Reports List
        report_order_id = ""
        pub_hash = ""
        try:
            r = await client.get("/api/v1/reports", headers=headers)
            reports = r.json()
            passed = r.status_code == 200 and len(reports) > 0
            if passed:
                report_order_id = reports[0]["order_id"]
                pub_hash = reports[0]["public_verification_hash"]
            record("Reports Catalog", "GET", "/api/v1/reports", r.status_code, passed, f"Reports: {len(reports)}")
        except Exception as e:
            record("Reports Catalog", "GET", "/api/v1/reports", 0, False, str(e))

        # 21. Report Detail
        if report_order_id:
            try:
                r = await client.get(f"/api/v1/reports/{report_order_id}", headers=headers)
                passed = r.status_code == 200 and "tests" in r.json() and "verified_by" in r.json()
                data = r.json()
                vby = data.get("verified_by", {}).get("name", "N/A")
                record("Report Details & Letterhead", "GET", f"/api/v1/reports/{report_order_id}", r.status_code, passed, f"Signatory: {vby}")
            except Exception as e:
                record("Report Details & Letterhead", "GET", f"/api/v1/reports/{report_order_id}", 0, False, str(e))

        # 22. Override Billing Lock
        if report_order_id:
            try:
                r = await client.post(f"/api/v1/reports/{report_order_id}/override-billing-lock", headers=headers)
                passed = r.status_code == 200 and r.json().get("status") == "SUCCESS"
                record("Override Billing Lock", "POST", f"/api/v1/reports/{report_order_id}/override-billing-lock", r.status_code, passed, r.json().get("message", ""))
            except Exception as e:
                record("Override Billing Lock", "POST", f"/api/v1/reports/{report_order_id}/override-billing-lock", 0, False, str(e))

        # 23. Public QR Verification (No Login required)
        if pub_hash:
            try:
                r = await client.get(f"/api/v1/reports/verify/{pub_hash}")
                passed = r.status_code == 200 and r.json().get("verified") is True
                p_name = r.json().get("patient", {}).get("name", "")
                record("Public QR Report Verification", "GET", f"/api/v1/reports/verify/{pub_hash[:16]}...", r.status_code, passed, f"Verified Patient: {p_name}")
            except Exception as e:
                record("Public QR Report Verification", "GET", f"/api/v1/reports/verify/...", 0, False, str(e))

    print("=" * 70)
    total = len(results)
    passed_count = sum(1 for x in results if x["passed"])
    failed_count = total - passed_count
    print(f" TOTAL ENDPOINTS AUDITED: {total} | PASSED: {passed_count} | FAILED: {failed_count}")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(run_comprehensive_api_check())
