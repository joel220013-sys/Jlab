# pyrefly: ignore-errors
# type: ignore
import sys
from pathlib import Path

# Ensure backend root is in sys.path when run directly or analyzed by IDE
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.tenant import Laboratory
from app.models.test_catalog import TestCategory, Test
from app.seeds.test_catalog_data import ALL_DEPARTMENTS_TESTS

async def populate_all_tests():
    async with AsyncSessionLocal() as db:
        # Get primary lab
        res = await db.execute(select(Laboratory))
        lab = res.scalars().first()
        if not lab:
            print("[Error] No laboratory found. Run main seeder first.")
            return

        print(f"[PulseLab OS] Seeding 260+ catalog tests for lab: {lab.name}...")

        department_order = [
            "BIOCHEMISTRY",
            "CLINICAL PATHOLOGY",
            "CYTOLOGY",
            "HEMATOLOGY",
            "HISTOPATHOLOGY",
            "HORMONE ASSAYS",
            "MICROBIOLOGY",
            "MOLECULAR BIOLOGY",
            "PATHOLOGY",
            "SEROLOGY"
        ]

        # 1. Ensure all 10 categories exist
        category_map = {}
        for idx, dept_name in enumerate(department_order, start=1):
            stmt = select(TestCategory).where(
                TestCategory.laboratory_id == lab.id,
                TestCategory.name == dept_name
            )
            cat_res = await db.execute(stmt)
            cat = cat_res.scalars().first()
            if not cat:
                cat = TestCategory(
                    laboratory_id=lab.id,
                    name=dept_name,
                    display_order=idx
                )
                db.add(cat)
                await db.flush()
                print(f"Created category: {dept_name}")
            category_map[dept_name] = cat

        # 2. Query existing tests for this lab
        existing_res = await db.execute(select(Test).where(Test.laboratory_id == lab.id))
        existing_tests = existing_res.scalars().all()
        existing_names = {t.name.upper() for t in existing_tests}
        existing_codes = {t.code.upper() for t in existing_tests}

        added_count = 0
        skipped_count = 0

        # 3. Insert tests from ALL_DEPARTMENTS_TESTS
        for dept_name, test_list in ALL_DEPARTMENTS_TESTS.items():
            cat = category_map[dept_name]
            for t_data in test_list:
                name_clean = str(t_data["name"]).strip()
                code_clean = str(t_data["code"]).strip().upper()

                if name_clean.upper() in existing_names:
                    skipped_count += 1
                    continue
                
                # Make sure code is unique
                if code_clean in existing_codes:
                    code_clean = f"{code_clean}_{added_count}"
                existing_codes.add(code_clean)
                existing_names.add(name_clean.upper())

                new_test = Test(
                    laboratory_id=lab.id,
                    category_id=cat.id,
                    code=code_clean,
                    name=name_clean,
                    specimen_type=t_data["specimen"],
                    tube_color=t_data["tube"],
                    standard_price=t_data["price"],
                    expected_tat_minutes=120,
                    methodology="Standard Clinical Methodology"
                )
                db.add(new_test)
                added_count += 1

        await db.commit()
        print(f"Successfully populated tests! Added: {added_count}, Existing/Skipped: {skipped_count}")
        print(f"Total catalog tests now active: {added_count + skipped_count}")

if __name__ == "__main__":
    asyncio.run(populate_all_tests())
