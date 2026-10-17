# pyrefly: ignore-errors
# type: ignore
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import List, Optional
from pydantic import BaseModel
import re
from app.database import get_db
from app.models.test_catalog import Test, TestCategory, TestParameter, ParameterRange
from app.api.deps import get_current_tenant_context

class TestCreate(BaseModel):
    name: str
    code: Optional[str] = None
    category_name: str = "BIOCHEMISTRY"
    specimen_type: Optional[str] = "Serum"
    tube_color: Optional[str] = "Yellow / Gel SST"
    standard_price: float = 350.0
    expected_tat_minutes: Optional[int] = 120
    methodology: Optional[str] = None
    unit: Optional[str] = ""
    reference_range: Optional[str] = None

router = APIRouter(prefix="/tests", tags=["Test Catalog"])

COMMON_SHORTCUT_ALIASES = {
    "kft": ["RFT"],
    "rft": ["RFT"],
    "lpt": ["LIPID"],
    "lipid": ["LIPID"],
    "tft": ["THYROID", "TSH"],
    "thyroid": ["THYROID"],
    "mch": ["MCH_STANDALONE", "CBC", "CBP"],
    "mcv": ["MCV_STANDALONE", "CBC", "CBP"],
    "pcv": ["PCV_STANDALONE", "CBC", "CBP"],
    "mchc": ["MCHC_STANDALONE", "CBC", "CBP"],
    "bt/ct": ["BT_CT_COMBO"],
    "btct": ["BT_CT_COMBO"],
    "abo": ["BLOOD_GROUP"],
    "blood group": ["BLOOD_GROUP"],
    "ur": ["URINE_RE", "CUA"],
    "rue": ["URINE_RE", "CUA"],
    "cua": ["CUA", "URINE_RE"],
    "sgpt": ["SGPT_ALT", "LFT"],
    "alt": ["SGPT_ALT", "LFT"],
    "sgot": ["SGOT_AST", "LFT"],
    "ast": ["SGOT_AST", "LFT"],
    "se": ["S_ELECTROLYTES"],
    "electrolytes": ["S_ELECTROLYTES"],
    "fbs": ["FBS"],
    "fbg": ["FBS"],
    "ppbs": ["PPBS"],
    "ppbg": ["PPBS"],
    "rbs": ["RBS"],
    "rpg": ["RBS"],
    "esr": ["ESR", "CBC", "CBP"],
    "tc": ["TC", "CBC", "CBP"],
    "dc": ["DC", "CBC", "CBP"],
    "tc/dc": ["TC_DC"],
    "tcdc": ["TC_DC"],
    "hb/tc/dc/esr": ["HB_TC_DC_ESR"],
    "widal": ["WIDAL_SLIDE", "WIDAL_TUBE"],
    "crp": ["CRP", "HS_CRP"],
}

@router.get("")
async def list_tests(
    category: Optional[str] = Query(None, description="Department category name"),
    search: Optional[str] = Query(None, description="Search test name or code"),
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    stmt = (
        select(Test, TestCategory)
        .join(TestCategory, Test.category_id == TestCategory.id)
        .where(
            Test.laboratory_id == lab_id, 
            Test.is_active == True,
            Test.code != "CBC_141",
            ~Test.code.ilike("%CBC_141%")
        )
    )

    if category and category.upper() != "ALL":
        stmt = stmt.where(TestCategory.name == category.upper())

    if search:
        clean_q = search.strip().lower()
        search_filter = f"%{clean_q}%"
        conditions = [Test.name.ilike(search_filter), Test.code.ilike(search_filter)]
        if clean_q in COMMON_SHORTCUT_ALIASES:
            for extra_code in COMMON_SHORTCUT_ALIASES[clean_q]:
                conditions.append(Test.code == extra_code)
        stmt = stmt.where(or_(*conditions))

    stmt = stmt.order_by(TestCategory.display_order, Test.name)
    res = await db.execute(stmt)
    rows = res.all()

    return [{
        "id": t.id,
        "code": t.code,
        "name": t.name,
        "category_name": cat.name,
        "specimen_type": t.specimen_type,
        "tube_color": t.tube_color,
        "standard_price": float(t.standard_price),
        "expected_tat_minutes": t.expected_tat_minutes,
        "methodology": t.methodology
    } for t, cat in rows]

@router.get("/categories")
async def list_test_categories(
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    stmt = select(TestCategory).where(TestCategory.laboratory_id == lab_id).order_by(TestCategory.display_order)
    res = await db.execute(stmt)
    categories = res.scalars().all()
    return [{"id": c.id, "name": c.name, "display_order": c.display_order} for c in categories]

@router.get("/{test_id}/parameters")
async def get_test_parameters(
    test_id: str,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(TestParameter, ParameterRange)
        .outerjoin(ParameterRange, ParameterRange.parameter_id == TestParameter.id)
        .where(TestParameter.test_id == test_id)
        .order_by(TestParameter.display_order)
    )
    res = await db.execute(stmt)
    rows = res.all()
    
    seen_params = {}
    for p, rng in rows:
        if p.id not in seen_params:
            seen_params[p.id] = {
                "id": p.id,
                "code": p.code,
                "name": p.name,
                "unit": p.unit or "",
                "value_type": p.value_type,
                "display_order": p.display_order,
                "is_differential_part": bool(p.is_differential_part),
                "reference_low": float(rng.reference_low) if rng and rng.reference_low is not None else None,
                "reference_high": float(rng.reference_high) if rng and rng.reference_high is not None else None,
                "textual_reference": rng.textual_reference if rng else None
            }
    return list(seen_params.values())

@router.post("")
async def create_custom_test(
    req: TestCreate,
    user_context = Depends(get_current_tenant_context),
    db: AsyncSession = Depends(get_db)
):
    _, lab_id = user_context
    name = req.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Test name cannot be empty")

    cat_name = (req.category_name or "BIOCHEMISTRY").strip().upper()
    
    # 1. Find or create category
    stmt_cat = select(TestCategory).where(
        TestCategory.laboratory_id == lab_id,
        func.upper(TestCategory.name) == cat_name
    )
    cat = (await db.execute(stmt_cat)).scalar_one_or_none()
    if not cat:
        cat = TestCategory(
            laboratory_id=lab_id,
            name=cat_name,
            display_order=50
        )
        db.add(cat)
        await db.flush()

    # 2. Determine unique code
    if req.code and req.code.strip():
        base_code = re.sub(r'[^A-Z0-9_]', '', req.code.strip().upper())
    else:
        clean_name = re.sub(r'[^A-Z0-9\s]', '', name.upper()).split()
        if len(clean_name) >= 2:
            base_code = "".join(w[:3] for w in clean_name[:3])
        else:
            base_code = clean_name[0][:8] if clean_name else "TEST"
    
    if not base_code:
        base_code = "TEST"

    code = base_code
    seq = 1
    while True:
        chk = select(Test.id).where(Test.laboratory_id == lab_id, Test.code == code)
        if not (await db.execute(chk)).scalar_one_or_none():
            break
        code = f"{base_code}_{seq}"
        seq += 1

    # 3. Create Test
    test = Test(
        laboratory_id=lab_id,
        category_id=cat.id,
        code=code,
        name=name,
        specimen_type=req.specimen_type or "Serum",
        tube_color=req.tube_color or "Yellow / Gel SST",
        standard_price=req.standard_price if req.standard_price is not None else 350.0,
        expected_tat_minutes=req.expected_tat_minutes or 120,
        methodology=req.methodology or "Photometric / Immunoassay",
        is_active=True
    )
    db.add(test)
    await db.flush()

    # 4. Automatically create primary test parameter
    param = TestParameter(
        test_id=test.id,
        code=code,
        name=name,
        unit=req.unit.strip() if req.unit else "",
        value_type="TEXT" if any(w in name.upper() for w in ["SMEAR", "CULTURE", "BIOPSY", "GROUP", "CARD", "RAPID", "SCREEN"]) else "NUMERIC",
        display_order=1
    )
    db.add(param)
    await db.flush()

    # 5. Optionally create biological reference range
    if req.reference_range and req.reference_range.strip():
        rng = ParameterRange(
            parameter_id=param.id,
            gender="ALL",
            textual_reference=req.reference_range.strip()
        )
        db.add(rng)

    await db.commit()
    await db.refresh(test)

    return {
        "id": test.id,
        "code": test.code,
        "name": test.name,
        "category_name": cat.name,
        "specimen_type": test.specimen_type,
        "tube_color": test.tube_color,
        "standard_price": float(test.standard_price),
        "expected_tat_minutes": test.expected_tat_minutes,
        "methodology": test.methodology
    }
