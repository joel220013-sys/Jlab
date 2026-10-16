import sqlite3
import uuid

conn = sqlite3.connect('pulselab.db')
c = conn.cursor()

# Known clinical parameter profiles
CLINICAL_PARAM_PROFILES = {
    # Standalone Hematology
    "MCH_STANDALONE": [
        ("MCH", "MCH (Mean Corpuscular Hemoglobin)", "pg", 26.0, 32.0, 10.0, 50.0, "NUMERIC", False)
    ],
    "MCHC_STANDALONE": [
        ("MCHC", "MCHC (Mean Corpuscular Hemoglobin Concentration)", "g/dL", 31.0, 36.0, 20.0, 45.0, "NUMERIC", False)
    ],
    "MCV_STANDALONE": [
        ("MCV", "MCV (Mean Corpuscular Volume)", "fL", 80.0, 99.0, 40.0, 130.0, "NUMERIC", False)
    ],
    "PCV_STANDALONE": [
        ("PCV", "Packed Cell Volume (PCV)", "%", 36.0, 48.0, 10.0, 65.0, "NUMERIC", False)
    ],
    "HB": [
        ("HB", "Hemoglobin (Hb)", "g/dL", 12.0, 16.0, 3.0, 25.0, "NUMERIC", False)
    ],
    "RBC_COUNT": [
        ("RBC", "Total RBC Count", "mill/cumm", 3.5, 5.5, 1.0, 8.0, "NUMERIC", False)
    ],
    "PLT_COUNT": [
        ("PLATELETS", "Platelet Count", "Lakhs/µL", 1.5, 4.5, 0.1, 15.0, "NUMERIC", False)
    ],
    "TC": [
        ("WBC", "Total Leucocyte Count (TLC)", "cells/µL", 4000.0, 11000.0, 500.0, 100000.0, "NUMERIC", False)
    ],
    "ESR": [
        ("ESR", "Erythrocyte Sedimentation Rate (ESR)", "mm/1st hr", 0.0, 20.0, 0.0, 150.0, "NUMERIC", False)
    ],
    "BLOOD_GROUP": [
        ("BLOOD_GROUP", "ABO Blood Group", "", None, None, None, None, "TEXT", False),
        ("RH_FACTOR", "Rh Factor (D Antigen)", "", None, None, None, None, "TEXT", False)
    ],
    "BT": [
        ("BT", "Bleeding Time (BT)", "min:sec", None, None, None, None, "TEXT", False)
    ],
    "CT": [
        ("CT", "Clotting Time (CT)", "min:sec", None, None, None, None, "TEXT", False)
    ],
    "BT_CT_COMBO": [
        ("BT", "Bleeding Time (BT)", "min:sec", None, None, None, None, "TEXT", False),
        ("CT", "Clotting Time (CT)", "min:sec", None, None, None, None, "TEXT", False)
    ],
    "AEC": [
        ("AEC", "Absolute Eosinophil Count (AEC)", "cells/cumm", 40.0, 440.0, 0.0, 5000.0, "NUMERIC", False)
    ],
    "ANC": [
        ("ANC", "Absolute Neutrophil Count (ANC)", "cells/cumm", 2000.0, 7000.0, 100.0, 50000.0, "NUMERIC", False)
    ],
    "ALC": [
        ("ALC", "Absolute Lymphocyte Count (ALC)", "cells/cumm", 1000.0, 3000.0, 100.0, 30000.0, "NUMERIC", False)
    ],
    "RETIC_COUNT": [
        ("RETIC", "Reticulocyte Count", "%", 0.5, 2.5, 0.0, 20.0, "NUMERIC", False)
    ],
    "PT_INR": [
        ("PT_PATIENT", "Prothrombin Time (Patient)", "seconds", 11.0, 15.0, 5.0, 100.0, "NUMERIC", False),
        ("PT_CONTROL", "Control Time (Mean Normal)", "seconds", 12.0, 14.0, 8.0, 20.0, "NUMERIC", False),
        ("INR", "International Normalized Ratio (INR)", "Ratio", 0.85, 1.15, 0.5, 10.0, "NUMERIC", False)
    ],
    "APTT": [
        ("APTT_PATIENT", "APTT (Patient)", "seconds", 26.0, 38.0, 10.0, 150.0, "NUMERIC", False),
        ("APTT_CONTROL", "APTT Control Time", "seconds", 28.0, 32.0, 20.0, 45.0, "NUMERIC", False)
    ],
    "FIBRINOGEN": [
        ("FIBRINOGEN", "Plasma Fibrinogen", "mg/dL", 200.0, 400.0, 50.0, 1000.0, "NUMERIC", False)
    ],
    "DC": [
        ("NEUT", "Neutrophils (Polymorphs)", "%", 40.0, 75.0, 0.0, 100.0, "NUMERIC", True),
        ("LYMPH", "Lymphocytes", "%", 20.0, 45.0, 0.0, 100.0, "NUMERIC", True),
        ("EOS", "Eosinophils", "%", 1.0, 6.0, 0.0, 50.0, "NUMERIC", True),
        ("MONO", "Monocytes", "%", 2.0, 10.0, 0.0, 30.0, "NUMERIC", True),
        ("BASO", "Basophils", "%", 0.0, 1.0, 0.0, 10.0, "NUMERIC", True)
    ],
    "TC_DC": [
        ("WBC", "Total Leucocyte Count (TLC)", "cells/µL", 4000.0, 11000.0, 500.0, 100000.0, "NUMERIC", False),
        ("NEUT", "Neutrophils (Polymorphs)", "%", 40.0, 75.0, 0.0, 100.0, "NUMERIC", True),
        ("LYMPH", "Lymphocytes", "%", 20.0, 45.0, 0.0, 100.0, "NUMERIC", True),
        ("EOS", "Eosinophils", "%", 1.0, 6.0, 0.0, 50.0, "NUMERIC", True),
        ("MONO", "Monocytes", "%", 2.0, 10.0, 0.0, 30.0, "NUMERIC", True),
        ("BASO", "Basophils", "%", 0.0, 1.0, 0.0, 10.0, "NUMERIC", True)
    ],
    "HB_TC_DC_ESR": [
        ("HB", "Hemoglobin (Hb)", "g/dL", 12.0, 16.0, 3.0, 25.0, "NUMERIC", False),
        ("WBC", "Total Leucocyte Count (TLC)", "cells/µL", 4000.0, 11000.0, 500.0, 100000.0, "NUMERIC", False),
        ("NEUT", "Neutrophils (Polymorphs)", "%", 40.0, 75.0, 0.0, 100.0, "NUMERIC", True),
        ("LYMPH", "Lymphocytes", "%", 20.0, 45.0, 0.0, 100.0, "NUMERIC", True),
        ("EOS", "Eosinophils", "%", 1.0, 6.0, 0.0, 50.0, "NUMERIC", True),
        ("MONO", "Monocytes", "%", 2.0, 10.0, 0.0, 30.0, "NUMERIC", True),
        ("BASO", "Basophils", "%", 0.0, 1.0, 0.0, 10.0, "NUMERIC", True),
        ("ESR", "Erythrocyte Sedimentation Rate (ESR)", "mm/1st hr", 0.0, 20.0, 0.0, 150.0, "NUMERIC", False)
    ],

    # Routine Biochemistry
    "GLUCOSE_FASTING": [
        ("FBS", "Fasting Blood Glucose", "mg/dL", 70.0, 100.0, 20.0, 600.0, "NUMERIC", False)
    ],
    "GLUCOSE_PP": [
        ("PPBS", "Post Prandial Blood Glucose", "mg/dL", 70.0, 140.0, 20.0, 600.0, "NUMERIC", False)
    ],
    "GLUCOSE_RANDOM": [
        ("RBS", "Random Blood Glucose", "mg/dL", 70.0, 140.0, 20.0, 600.0, "NUMERIC", False)
    ],
    "HBA1C": [
        ("HBA1C", "HbA1c (Glycated Hemoglobin)", "%", 4.0, 5.6, 2.0, 20.0, "NUMERIC", False),
        ("EAG", "Estimated Average Glucose (eAG)", "mg/dL", 70.0, 115.0, 30.0, 500.0, "NUMERIC", False)
    ],
    "UREA": [
        ("UREA", "Blood Urea", "mg/dL", 15.0, 45.0, 5.0, 300.0, "NUMERIC", False)
    ],
    "CREATININE": [
        ("CREAT", "Serum Creatinine", "mg/dL", 0.6, 1.2, 0.1, 20.0, "NUMERIC", False)
    ],
    "URIC_ACID": [
        ("URIC", "Serum Uric Acid", "mg/dL", 3.5, 7.2, 1.0, 25.0, "NUMERIC", False)
    ],
    "CALCIUM": [
        ("CALCIUM", "Serum Calcium", "mg/dL", 8.5, 10.5, 4.0, 20.0, "NUMERIC", False)
    ],
    "PHOSPHORUS": [
        ("PHOS", "Serum Phosphorus", "mg/dL", 2.5, 4.5, 0.5, 15.0, "NUMERIC", False)
    ],
    "ELECTROLYTES": [
        ("NA", "Serum Sodium (Na+)", "mmol/L", 135.0, 145.0, 100.0, 180.0, "NUMERIC", False),
        ("K", "Serum Potassium (K+)", "mmol/L", 3.5, 5.0, 1.5, 10.0, "NUMERIC", False),
        ("CL", "Serum Chloride (Cl-)", "mmol/L", 98.0, 107.0, 60.0, 140.0, "NUMERIC", False)
    ],
    "CRP": [
        ("CRP", "C-Reactive Protein (CRP Quantitative)", "mg/L", 0.0, 6.0, 0.0, 300.0, "NUMERIC", False)
    ],
    "HS_CRP": [
        ("HS_CRP", "High Sensitive CRP (hsCRP)", "mg/L", 0.0, 3.0, 0.0, 100.0, "NUMERIC", False)
    ],
    "TSH": [
        ("TSH", "Thyroid Stimulating Hormone (TSH)", "µIU/mL", 0.35, 5.50, 0.01, 150.0, "NUMERIC", False)
    ],
    "VIT_D_25": [
        ("VIT_D", "25-Hydroxy Vitamin D", "ng/mL", 30.0, 100.0, 2.0, 200.0, "NUMERIC", False)
    ],
    "VIT_B12": [
        ("VIT_B12", "Vitamin B12", "pg/mL", 211.0, 911.0, 50.0, 2500.0, "NUMERIC", False)
    ],
}

# Fetch all tests
c.execute("SELECT id, name, code, specimen_type, category_id FROM tests")
all_tests = c.fetchall()

seeded_count = 0
for test_id, name, code, spec, cat_id in all_tests:
    # Check if parameters already exist
    c.execute("SELECT count(*) FROM test_parameters WHERE test_id = ?", (test_id,))
    existing_cnt = c.fetchone()[0]
    if existing_cnt > 0:
        continue

    # Determine parameters
    code_upper = code.upper()
    name_upper = name.upper()
    
    matched_params = None
    if code_upper in CLINICAL_PARAM_PROFILES:
        matched_params = CLINICAL_PARAM_PROFILES[code_upper]
    else:
        # Check by name substring
        for k, prof in CLINICAL_PARAM_PROFILES.items():
            if k in code_upper or k in name_upper:
                matched_params = prof
                break

    if not matched_params:
        # Generate default primary parameter for this standalone test
        is_textual = any(w in name_upper for w in ["SMEAR", "CULTURE", "BIOPSY", "CYTOLOGY", "GROUP", "CARD", "EXAM", "DUO", "SCREENING"])
        val_type = "TEXT" if is_textual else "NUMERIC"
        unit = "mg/dL" if "SERUM" in name_upper or "BIOCHEMISTRY" in name_upper else ("U/L" if "ENZYME" in name_upper else "")
        ref_low = 10.0 if val_type == "NUMERIC" else None
        ref_high = 50.0 if val_type == "NUMERIC" else None
        
        matched_params = [
            (code_upper, name, unit, ref_low, ref_high, None, None, val_type, False)
        ]

    # Insert parameters into test_parameters and parameter_ranges
    for idx, (p_code, p_name, p_unit, r_low, r_high, imp_l, imp_h, v_type, is_diff) in enumerate(matched_params, start=1):
        param_id = str(uuid.uuid4())
        c.execute("""
            INSERT INTO test_parameters (
                id, test_id, code, name, unit, value_type, display_order, 
                impossible_low, impossible_high, is_differential_part, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        """, (param_id, test_id, p_code, p_name, p_unit, v_type, idx, imp_l, imp_h, 1 if is_diff else 0))

        # Add parameter range
        range_id = str(uuid.uuid4())
        txt_ref = f"{r_low} - {r_high} {p_unit}".strip() if (r_low is not None and r_high is not None) else ("Normal / Negative" if v_type == "TEXT" else "Normal")
        c.execute("""
            UPDATE parameter_ranges 
            SET textual_reference = ?
            WHERE parameter_id = ?
        """, (txt_ref, param_id))

    seeded_count += 1

conn.commit()
print(f"Successfully populated parameters for {seeded_count} tests!")

# Also ensure any existing test_results in DB have result_values initialized
c.execute("""
    SELECT tr.id, tr.test_id 
    FROM test_results tr
    WHERE NOT EXISTS (SELECT 1 FROM result_values rv WHERE rv.test_result_id = tr.id)
""")
missing_rv = c.fetchall()
print(f"Found {len(missing_rv)} test_results with missing result_values. Initializing now...")
for tr_id, t_id in missing_rv:
    c.execute("SELECT id FROM test_parameters WHERE test_id = ?", (t_id,))
    params = c.fetchall()
    for (p_id,) in params:
        rv_id = str(uuid.uuid4())
        c.execute("""
            INSERT INTO result_values (id, test_result_id, parameter_id, flag)
            VALUES (?, ?, ?, 'NORMAL')
        """, (rv_id, tr_id, p_id))

conn.commit()
print("Updated all test_result slots!")

# Check MCH test and demo5
c.execute("SELECT id, name, code FROM tests WHERE code = 'MCH_STANDALONE'")
mch_test = c.fetchone()
print("\nMCH Test in DB:", mch_test)
c.execute("SELECT id, name, code, unit, is_differential_part FROM test_parameters WHERE test_id = ?", (mch_test[0],))
print("MCH Parameters:", c.fetchall())

c.execute("""
    SELECT o.lab_number, p.full_name, t.name, count(rv.id) 
    FROM orders o 
    JOIN patients p ON o.patient_id = p.id
    JOIN test_results tr ON tr.order_id = o.id
    JOIN tests t ON tr.test_id = t.id
    LEFT JOIN result_values rv ON rv.test_result_id = tr.id
    WHERE o.lab_number = '30934'
    GROUP BY o.lab_number, p.full_name, t.name
""")
print("Demo5 Lab #30934 Status:", c.fetchall())

conn.close()
