# pyrefly: ignore-errors
# type: ignore
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import hashlib
from app.models.tenant import SubscriptionPlan, Laboratory, Branch
from app.models.user import User, LaboratoryStaff, UserRole
from app.models.patient import Patient, Doctor
from app.models.test_catalog import TestCategory, Test, TestParameter, ParameterRange
from app.models.order import Order, Sample, Invoice, SampleStatus, InvoiceStatus
from app.models.result import TestResult, ResultValue, Report, ReportStatus
from app.core.security import get_password_hash

async def seed_initial_data(db: AsyncSession):
    # Check if data already exists
    res = await db.execute(select(Laboratory))
    if res.scalars().first():
        return # Already seeded

    print("[PulseLab OS] Seeding initial database...")

    # 1. Subscription Plan
    plan = SubscriptionPlan(
        code="PROFESSIONAL",
        name="Professional Lab Tier",
        monthly_price_inr=4999.00,
        yearly_price_inr=49990.00,
        max_monthly_orders=2500,
        max_staff_accounts=20,
        max_branches=3
    )
    db.add(plan)
    await db.flush()

    # 2. Demo Laboratory (Sri Sai Balaji Diagnostics)
    lab = Laboratory(
        slug="saibalaji",
        name="Sri Sai Balaji Diagnostics",
        legal_name="Sri Sai Balaji Diagnostics & Imaging Pvt Ltd",
        email="info@saibalajilab.com",
        phone="9880016018",
        address="#42, 10th Main, Jayanagar 4th Block, Bangalore",
        city="Bangalore",
        state="Karnataka",
        pincode="560011",
        current_plan_id=plan.id,
        subscription_status="ACTIVE"
    )
    db.add(lab)
    await db.flush()

    # Main branch
    branch = Branch(
        laboratory_id=lab.id,
        name="Main Laboratory & Processing Hub",
        code="MAIN",
        is_main_lab=True,
        phone="080-26543210",
        address=lab.address
    )
    db.add(branch)
    await db.flush()

    # 3. Staff Users
    # Admin (using credentials provided by user: sbdcrakesh / 7899353535)
    admin_user = User(
        username="sbdcrakesh",
        phone="7899353535",
        email="rakesh@saibalajilab.com",
        full_name="Rakesh Kumar (Director)",
        hashed_password=get_password_hash("7899353535"),
        role=UserRole.LAB_ADMIN
    )
    db.add(admin_user)
    await db.flush()
    db.add(LaboratoryStaff(laboratory_id=lab.id, user_id=admin_user.id, branch_id=branch.id, role=UserRole.LAB_ADMIN, designation="Managing Director"))

    # Technician
    tech_user = User(
        username="tech_arun",
        phone="9876500001",
        email="arun@saibalajilab.com",
        full_name="Arun Sharma (Senior MLT)",
        hashed_password=get_password_hash("tech123"),
        role=UserRole.TECHNICIAN
    )
    db.add(tech_user)
    await db.flush()
    db.add(LaboratoryStaff(laboratory_id=lab.id, user_id=tech_user.id, branch_id=branch.id, role=UserRole.TECHNICIAN, designation="Medical Lab Technician"))

    # Pathologist
    patho_user = User(
        username="dr_bhat",
        phone="9876500002",
        email="drbhat@saibalajilab.com",
        full_name="Dr. Srinivas Bhat, MD (Pathology)",
        hashed_password=get_password_hash("patho123"),
        role=UserRole.PATHOLOGIST
    )
    db.add(patho_user)
    await db.flush()
    db.add(LaboratoryStaff(
        laboratory_id=lab.id, 
        user_id=patho_user.id, 
        branch_id=branch.id, 
        role=UserRole.PATHOLOGIST, 
        designation="Consultant Pathologist", 
        medical_license_number="KMC-48291", 
        is_signatory=True
    ))

    # Receptionist
    recep_user = User(
        username="reception_priya",
        phone="9876500003",
        email="priya@saibalajilab.com",
        full_name="Priya V (Front Desk)",
        hashed_password=get_password_hash("recep123"),
        role=UserRole.RECEPTIONIST
    )
    db.add(recep_user)
    await db.flush()
    db.add(LaboratoryStaff(laboratory_id=lab.id, user_id=recep_user.id, branch_id=branch.id, role=UserRole.RECEPTIONIST, designation="Front Office Executive"))

    # 4. Referring Doctor
    doctor = Doctor(
        laboratory_id=lab.id,
        full_name="Dr. Karthik Sasalu, MBBS, MD",
        clinic_hospital_name="Sasalu Specialty Clinic",
        phone="9845012345",
        email="drkarthik@gmail.com",
        commission_percentage=10.0
    )
    db.add(doctor)
    await db.flush()

    # 5. Categories
    cat_hema = TestCategory(laboratory_id=lab.id, name="HEMATOLOGY", display_order=1)
    cat_biochem = TestCategory(laboratory_id=lab.id, name="BIOCHEMISTRY", display_order=2)
    db.add_all([cat_hema, cat_biochem])
    await db.flush()

    # 6. Test: CBC
    test_cbc = Test(
        laboratory_id=lab.id,
        category_id=cat_hema.id,
        code="CBC",
        name="Complete Blood Count (CBC)",
        specimen_type="Whole Blood EDTA",
        tube_color="Lavender / EDTA",
        standard_price=350.00,
        expected_tat_minutes=90,
        methodology="Automated Cell Counter / Flow Cytometry"
    )
    db.add(test_cbc)
    await db.flush()

    cbc_params_meta = [
        ("HB", "Hemoglobin", "g/dL", 12.0, 16.0, 3.0, 25.0, 7.0, 20.0, False),
        ("RBC", "R.B.C Count", "mill/cumm", 3.5, 5.5, 1.0, 8.0, None, None, False),
        ("WBC", "Total WBC Count", "cells/cumm", 4000.0, 11000.0, 500.0, 100000.0, 2000.0, 30000.0, False),
        ("PLATELETS", "Platelet Count", "Lakhs/cumm", 1.5, 4.5, 0.1, 15.0, 0.5, 8.0, False),
        ("PCV", "Packed Cell Volume (PCV)", "%", 37.0, 47.0, 10.0, 65.0, None, None, False),
        ("MCV", "M.C.V", "fl", 80.0, 98.0, 40.0, 130.0, None, None, False),
        ("MCH", "M.C.H", "pg", 27.0, 32.0, 10.0, 50.0, None, None, False),
        ("MCHC", "M.C.H.C", "%", 31.0, 36.0, 20.0, 45.0, None, None, False),
        # Differential count
        ("NEUTROPHILS", "Neutrophils", "%", 40.0, 70.0, 0.0, 100.0, None, None, True),
        ("LYMPHOCYTES", "Lymphocytes", "%", 20.0, 45.0, 0.0, 100.0, None, None, True),
        ("EOSINOPHILS", "Eosinophils", "%", 2.0, 8.0, 0.0, 50.0, None, None, True),
        ("MONOCYTES", "Monocytes", "%", 1.0, 6.0, 0.0, 30.0, None, None, True),
        ("BASOPHILS", "Basophils", "%", 0.0, 1.0, 0.0, 10.0, None, None, True),
    ]

    for order_idx, (code, name, unit, r_low, r_high, imp_l, imp_h, crit_l, crit_h, is_diff) in enumerate(cbc_params_meta):
        param = TestParameter(
            test_id=test_cbc.id,
            code=code,
            name=name,
            unit=unit,
            value_type="NUMERIC",
            impossible_low=imp_l,
            impossible_high=imp_h,
            critical_low=crit_l,
            critical_high=crit_h,
            is_differential_part=is_diff,
            display_order=order_idx + 1
        )
        db.add(param)
        await db.flush()

        db.add(ParameterRange(
            parameter_id=param.id,
            gender="ALL",
            reference_low=r_low,
            reference_high=r_high,
            textual_reference=f"{r_low} - {r_high} {unit}"
        ))

    # 7. Test: Lipid Profile
    test_lipid = Test(
        laboratory_id=lab.id,
        category_id=cat_biochem.id,
        code="LIPID",
        name="Lipid Profile",
        specimen_type="Serum",
        tube_color="Yellow / Gel SST",
        standard_price=850.00,
        expected_tat_minutes=120,
        methodology="Photometric / Enzymatic"
    )
    db.add(test_lipid)
    await db.flush()

    lipid_params_meta = [
        ("TOTAL_CHOLESTEROL", "Total Cholesterol", "mg/dL", 125.0, 200.0, 30.0, 600.0, "NUMERIC", None),
        ("TRIGLYCERIDES", "Triglycerides", "mg/dL", 50.0, 150.0, 10.0, 1000.0, "NUMERIC", None),
        ("HDL_CHOLESTEROL", "HDL Cholesterol", "mg/dL", 40.0, 60.0, 5.0, 120.0, "NUMERIC", None),
        ("LDL_CHOLESTEROL", "LDL Cholesterol (Calculated)", "mg/dL", 60.0, 100.0, 0.0, 500.0, "CALCULATED", "{TOTAL_CHOLESTEROL} - ({HDL_CHOLESTEROL} + {VLDL_CHOLESTEROL})"),
        ("VLDL_CHOLESTEROL", "VLDL Cholesterol (Calculated)", "mg/dL", 10.0, 30.0, 0.0, 200.0, "CALCULATED", "{TRIGLYCERIDES} / 5"),
        ("TC_HDL_RATIO", "Total / HDL Ratio (Calculated)", "Ratio", 3.0, 5.0, 0.5, 20.0, "CALCULATED", "{TOTAL_CHOLESTEROL} / {HDL_CHOLESTEROL}")
    ]

    for order_idx, (code, name, unit, r_low, r_high, imp_l, imp_h, v_type, formula) in enumerate(lipid_params_meta):
        p_lip = TestParameter(
            test_id=test_lipid.id,
            code=code,
            name=name,
            unit=unit,
            value_type=v_type,
            formula_expression=formula,
            impossible_low=imp_l,
            impossible_high=imp_h,
            display_order=order_idx + 1
        )
        db.add(p_lip)
        await db.flush()

        db.add(ParameterRange(
            parameter_id=p_lip.id,
            gender="ALL",
            reference_low=r_low,
            reference_high=r_high,
            textual_reference=f"{r_low} - {r_high} {unit}"
        ))

    # 8. Seed Full 260+ Diagnostic Test Catalog Across 10 Departments
    from app.seeds.test_catalog_data import ALL_DEPARTMENTS_TESTS
    dept_order = [
        "BIOCHEMISTRY", "CLINICAL PATHOLOGY", "CYTOLOGY", "HEMATOLOGY", 
        "HISTOPATHOLOGY", "HORMONE ASSAYS", "MICROBIOLOGY", "MOLECULAR BIOLOGY", 
        "PATHOLOGY", "SEROLOGY"
    ]
    all_cats = {}
    for idx, d_name in enumerate(dept_order, start=1):
        c_res = await db.execute(select(TestCategory).where(TestCategory.laboratory_id == lab.id, TestCategory.name == d_name))
        c_obj = c_res.scalars().first()
        if not c_obj:
            c_obj = TestCategory(laboratory_id=lab.id, name=d_name, display_order=idx)
            db.add(c_obj)
            await db.flush()
        all_cats[d_name] = c_obj

    existing_tests_res = await db.execute(select(Test).where(Test.laboratory_id == lab.id))
    existing_tests_set = {t.name.upper() for t in existing_tests_res.scalars().all()}

    for dept, t_items in ALL_DEPARTMENTS_TESTS.items():
        cat = all_cats[dept]
        for item in t_items:
            test_name = str(item["name"]).strip()
            test_code = str(item["code"]).strip().upper()
            if test_name.upper() not in existing_tests_set:
                db.add(Test(
                    laboratory_id=lab.id,
                    category_id=cat.id,
                    code=test_code,
                    name=test_name,
                    specimen_type=str(item["specimen"]),
                    tube_color=str(item["tube"]),
                    standard_price=float(item["price"]),
                    expected_tat_minutes=120,
                    methodology="Standard Clinical Methodology"
                ))
                existing_tests_set.add(test_name.upper())

    await db.commit()

    # Populate and synchronize comprehensive clinical parameters for all tests
    from app.seeds.comprehensive_test_params import sync_all_database_parameters
    sync_all_database_parameters()

    print("[PulseLab OS] Database initialized successfully with Sri Sai Balaji Diagnostics, 260+ tests, all comprehensive parameters & staff accounts!")
