import sqlite3
import uuid

conn = sqlite3.connect('backend/pulselab.db')
c = conn.cursor()

# Master Clinical Reference Dictionary
# Key: test_code -> list of dicts with parameter definition
# {
#   "code": param_code,
#   "name": param_name,
#   "unit": unit,
#   "value_type": "NUMERIC" | "TEXT",
#   "low": float or None,
#   "high": float or None,
#   "text": reference_text,
#   "is_diff": bool
# }

CLINICAL_TEST_DEFINITIONS = {
    # === BIOCHEMISTRY ===
    "FBS": [
        {"code": "FBS", "name": "FASTING BLOOD SUGAR (FBS)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 70.0, "high": 100.0, "text": "70.0 - 100.0 mg/dL (Pre-diabetic: 101 - 125, Diabetic: >= 126)", "is_diff": False}
    ],
    "PPBS": [
        {"code": "PPBS", "name": "POST PRANDIAL BLOOD SUGAR (PPBS)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 70.0, "high": 140.0, "text": "< 140.0 mg/dL (Pre-diabetic: 141 - 199, Diabetic: >= 200)", "is_diff": False}
    ],
    "RBS": [
        {"code": "RBS", "name": "RANDOM BLOOD SUGAR (RBS)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 70.0, "high": 140.0, "text": "70.0 - 140.0 mg/dL", "is_diff": False}
    ],
    "GCT": [
        {"code": "GCT", "name": "GLUCOSE CHALLENGE TEST (GCT)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 70.0, "high": 140.0, "text": "< 140.0 mg/dL (1 hour post 50g glucose)", "is_diff": False}
    ],
    "GTT": [
        {"code": "GTT_FAST", "name": "GLUCOSE TOLERANCE - FASTING", "unit": "mg/dL", "value_type": "NUMERIC", "low": 70.0, "high": 100.0, "text": "70.0 - 100.0 mg/dL", "is_diff": False},
        {"code": "GTT_1HR", "name": "GLUCOSE TOLERANCE - 1 HOUR", "unit": "mg/dL", "value_type": "NUMERIC", "low": 70.0, "high": 180.0, "text": "< 180.0 mg/dL", "is_diff": False},
        {"code": "GTT_2HR", "name": "GLUCOSE TOLERANCE - 2 HOUR", "unit": "mg/dL", "value_type": "NUMERIC", "low": 70.0, "high": 140.0, "text": "< 140.0 mg/dL", "is_diff": False}
    ],
    "HBA1C": [
        {"code": "HBA1C", "name": "HbA1c (GLYCATED HEMOGLOBIN)", "unit": "%", "value_type": "NUMERIC", "low": 4.0, "high": 5.6, "text": "4.0 - 5.6 % (Pre-diabetic: 5.7 - 6.4 %, Diabetic: >= 6.5 %)", "is_diff": False},
        {"code": "EAG", "name": "ESTIMATED AVERAGE GLUCOSE (eAG)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 70.0, "high": 115.0, "text": "70 - 115 mg/dL", "is_diff": False}
    ],
    "B_UREA": [
        {"code": "UREA", "name": "BLOOD UREA", "unit": "mg/dL", "value_type": "NUMERIC", "low": 15.0, "high": 45.0, "text": "15.0 - 45.0 mg/dL", "is_diff": False}
    ],
    "BUN": [
        {"code": "BUN", "name": "BLOOD UREA NITROGEN (BUN)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 7.0, "high": 20.0, "text": "7.0 - 20.0 mg/dL", "is_diff": False}
    ],
    "S_CREATININE": [
        {"code": "CREATININE", "name": "SERUM CREATININE", "unit": "mg/dL", "value_type": "NUMERIC", "low": 0.6, "high": 1.2, "text": "0.6 - 1.2 mg/dL (Male: 0.7 - 1.3, Female: 0.6 - 1.1)", "is_diff": False}
    ],
    "S_URIC_ACID": [
        {"code": "URIC_ACID", "name": "SERUM URIC ACID", "unit": "mg/dL", "value_type": "NUMERIC", "low": 3.5, "high": 7.2, "text": "3.5 - 7.2 mg/dL (Male: 3.5 - 7.2, Female: 2.6 - 6.0)", "is_diff": False}
    ],
    "S_CALCIUM": [
        {"code": "CALCIUM", "name": "SERUM CALCIUM (TOTAL)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 8.5, "high": 10.5, "text": "8.5 - 10.5 mg/dL", "is_diff": False}
    ],
    "ION_CALC": [
        {"code": "ION_CALC", "name": "IONIZED CALCIUM", "unit": "mmol/L", "value_type": "NUMERIC", "low": 1.12, "high": 1.32, "text": "1.12 - 1.32 mmol/L (4.5 - 5.3 mg/dL)", "is_diff": False}
    ],
    "S_PHOSPHORUS": [
        {"code": "PHOSPHORUS", "name": "SERUM PHOSPHORUS", "unit": "mg/dL", "value_type": "NUMERIC", "low": 2.5, "high": 4.5, "text": "2.5 - 4.5 mg/dL", "is_diff": False}
    ],
    "S_MAGNESIUM": [
        {"code": "MAGNESIUM", "name": "SERUM MAGNESIUM", "unit": "mg/dL", "value_type": "NUMERIC", "low": 1.7, "high": 2.4, "text": "1.7 - 2.4 mg/dL", "is_diff": False}
    ],
    "S_SODIUM": [
        {"code": "SODIUM", "name": "SERUM SODIUM (Na+)", "unit": "mmol/L", "value_type": "NUMERIC", "low": 135.0, "high": 145.0, "text": "135.0 - 145.0 mmol/L", "is_diff": False}
    ],
    "S_POTASSIUM": [
        {"code": "POTASSIUM", "name": "SERUM POTASSIUM (K+)", "unit": "mmol/L", "value_type": "NUMERIC", "low": 3.5, "high": 5.1, "text": "3.5 - 5.1 mmol/L", "is_diff": False}
    ],
    "S_CHLORIDE": [
        {"code": "CHLORIDE", "name": "SERUM CHLORIDE (Cl-)", "unit": "mmol/L", "value_type": "NUMERIC", "low": 96.0, "high": 106.0, "text": "96.0 - 106.0 mmol/L", "is_diff": False}
    ],
    "BICARB": [
        {"code": "BICARB", "name": "BICARBONATE (HCO3-)", "unit": "mmol/L", "value_type": "NUMERIC", "low": 22.0, "high": 29.0, "text": "22.0 - 29.0 mmol/L", "is_diff": False}
    ],
    "SGPT_ALT": [
        {"code": "SGPT", "name": "SGPT / ALT (ALANINE AMINOTRANSFERASE)", "unit": "U/L", "value_type": "NUMERIC", "low": 0.0, "high": 45.0, "text": "0.0 - 45.0 U/L (Male: 0 - 50, Female: 0 - 35)", "is_diff": False}
    ],
    "SGOT_AST": [
        {"code": "SGOT", "name": "SGOT / AST (ASPARTATE AMINOTRANSFERASE)", "unit": "U/L", "value_type": "NUMERIC", "low": 0.0, "high": 40.0, "text": "0.0 - 40.0 U/L (Male: 0 - 40, Female: 0 - 32)", "is_diff": False}
    ],
    "ALP": [
        {"code": "ALP", "name": "ALKALINE PHOSPHATASE (ALP)", "unit": "U/L", "value_type": "NUMERIC", "low": 30.0, "high": 120.0, "text": "30.0 - 120.0 U/L (Adults: 44 - 147 U/L)", "is_diff": False}
    ],
    "GGT": [
        {"code": "GGT", "name": "GAMMA GLUTAMYL TRANSFERASE (GGT)", "unit": "U/L", "value_type": "NUMERIC", "low": 9.0, "high": 48.0, "text": "9.0 - 48.0 U/L", "is_diff": False}
    ],
    "S_BILIRUBIN": [
        {"code": "BIL_TOTAL", "name": "SERUM BILIRUBIN TOTAL", "unit": "mg/dL", "value_type": "NUMERIC", "low": 0.2, "high": 1.2, "text": "0.2 - 1.2 mg/dL", "is_diff": False},
        {"code": "BIL_DIRECT", "name": "SERUM BILIRUBIN DIRECT", "unit": "mg/dL", "value_type": "NUMERIC", "low": 0.0, "high": 0.3, "text": "0.0 - 0.3 mg/dL", "is_diff": False},
        {"code": "BIL_INDIRECT", "name": "SERUM BILIRUBIN INDIRECT", "unit": "mg/dL", "value_type": "NUMERIC", "low": 0.1, "high": 0.9, "text": "0.1 - 0.9 mg/dL", "is_diff": False}
    ],
    "TOTAL_PROTEIN": [
        {"code": "TOTAL_PROTEIN", "name": "TOTAL PROTEIN", "unit": "g/dL", "value_type": "NUMERIC", "low": 6.0, "high": 8.3, "text": "6.0 - 8.3 g/dL", "is_diff": False}
    ],
    "S_ALBUMIN": [
        {"code": "ALBUMIN", "name": "SERUM ALBUMIN", "unit": "g/dL", "value_type": "NUMERIC", "low": 3.5, "high": 5.0, "text": "3.5 - 5.0 g/dL", "is_diff": False}
    ],
    "S_GLOBULIN": [
        {"code": "GLOBULIN", "name": "SERUM GLOBULIN", "unit": "g/dL", "value_type": "NUMERIC", "low": 2.0, "high": 3.5, "text": "2.0 - 3.5 g/dL", "is_diff": False}
    ],
    "AG_RATIO": [
        {"code": "AG_RATIO", "name": "A/G RATIO", "unit": "Ratio", "value_type": "NUMERIC", "low": 1.0, "high": 2.2, "text": "1.0 - 2.2 Ratio", "is_diff": False}
    ],
    "S_AMYLASE": [
        {"code": "AMYLASE", "name": "SERUM AMYLASE", "unit": "U/L", "value_type": "NUMERIC", "low": 28.0, "high": 100.0, "text": "28.0 - 100.0 U/L", "is_diff": False}
    ],
    "LIPASE": [
        {"code": "LIPASE", "name": "SERUM LIPASE", "unit": "U/L", "value_type": "NUMERIC", "low": 13.0, "high": 60.0, "text": "13.0 - 60.0 U/L", "is_diff": False}
    ],
    "CPK": [
        {"code": "CPK", "name": "CREATINE KINASE (CPK / CK)", "unit": "U/L", "value_type": "NUMERIC", "low": 24.0, "high": 195.0, "text": "24.0 - 195.0 U/L (Male: 38 - 174, Female: 26 - 140)", "is_diff": False}
    ],
    "CPK_MB": [
        {"code": "CPK_MB", "name": "CREATINE KINASE - MB (CK-MB)", "unit": "U/L", "value_type": "NUMERIC", "low": 0.0, "high": 24.0, "text": "< 25.0 U/L (0.0 - 24.0 U/L)", "is_diff": False}
    ],
    "LDH": [
        {"code": "LDH", "name": "LACTATE DEHYDROGENASE (LDH)", "unit": "U/L", "value_type": "NUMERIC", "low": 140.0, "high": 280.0, "text": "140.0 - 280.0 U/L", "is_diff": False}
    ],
    "TOTAL_CHOL": [
        {"code": "TOTAL_CHOL", "name": "TOTAL CHOLESTEROL", "unit": "mg/dL", "value_type": "NUMERIC", "low": 125.0, "high": 200.0, "text": "Desirable: < 200 mg/dL, Borderline: 200-239, High: >= 240", "is_diff": False}
    ],
    "S_TRIGLY": [
        {"code": "TRIGLYCERIDES", "name": "SERUM TRIGLYCERIDES", "unit": "mg/dL", "value_type": "NUMERIC", "low": 50.0, "high": 150.0, "text": "Normal: < 150 mg/dL, Borderline: 150-199, High: >= 200", "is_diff": False}
    ],
    "HDL_DIR": [
        {"code": "HDL", "name": "HDL CHOLESTEROL - DIRECT", "unit": "mg/dL", "value_type": "NUMERIC", "low": 40.0, "high": 60.0, "text": "Major risk factor: < 40, Optimal: >= 60 mg/dL", "is_diff": False}
    ],
    "LDL_DIR": [
        {"code": "LDL", "name": "LDL CHOLESTEROL - DIRECT", "unit": "mg/dL", "value_type": "NUMERIC", "low": 60.0, "high": 100.0, "text": "Optimal: < 100 mg/dL, Near Optimal: 100-129, High: >= 160", "is_diff": False}
    ],
    "VLDL": [
        {"code": "VLDL", "name": "VLDL CHOLESTEROL", "unit": "mg/dL", "value_type": "NUMERIC", "low": 10.0, "high": 30.0, "text": "10.0 - 30.0 mg/dL", "is_diff": False}
    ],
    "TC_HDL_RATIO": [
        {"code": "TC_HDL_RATIO", "name": "TOTAL CHOLESTEROL / HDL RATIO", "unit": "Ratio", "value_type": "NUMERIC", "low": 3.0, "high": 5.0, "text": "Low Risk: 3.3 - 4.4, Average: 4.5 - 5.0, High Risk: > 5.0", "is_diff": False}
    ],
    "LDL_HDL_RATIO": [
        {"code": "LDL_HDL_RATIO", "name": "LDL / HDL RATIO", "unit": "Ratio", "value_type": "NUMERIC", "low": 1.5, "high": 3.5, "text": "Optimal: < 3.0 Ratio", "is_diff": False}
    ],
    "LIPID_41": [
        {"code": "CHOL", "name": "TOTAL CHOLESTEROL", "unit": "mg/dL", "value_type": "NUMERIC", "low": 125.0, "high": 200.0, "text": "125.0 - 200.0 mg/dL", "is_diff": False},
        {"code": "TRIG", "name": "TRIGLYCERIDES", "unit": "mg/dL", "value_type": "NUMERIC", "low": 50.0, "high": 150.0, "text": "50.0 - 150.0 mg/dL", "is_diff": False},
        {"code": "HDL", "name": "HDL CHOLESTEROL", "unit": "mg/dL", "value_type": "NUMERIC", "low": 40.0, "high": 60.0, "text": "40.0 - 60.0 mg/dL", "is_diff": False},
        {"code": "LDL", "name": "LDL CHOLESTEROL", "unit": "mg/dL", "value_type": "NUMERIC", "low": 60.0, "high": 100.0, "text": "60.0 - 100.0 mg/dL", "is_diff": False},
        {"code": "VLDL", "name": "VLDL CHOLESTEROL", "unit": "mg/dL", "value_type": "NUMERIC", "low": 10.0, "high": 30.0, "text": "10.0 - 30.0 mg/dL", "is_diff": False},
        {"code": "RATIO", "name": "TC / HDL RATIO", "unit": "Ratio", "value_type": "NUMERIC", "low": 3.0, "high": 5.0, "text": "3.0 - 5.0 Ratio", "is_diff": False}
    ],
    "AMMONIA": [
        {"code": "AMMONIA", "name": "PLASMA AMMONIA", "unit": "umol/L", "value_type": "NUMERIC", "low": 15.0, "high": 45.0, "text": "15.0 - 45.0 umol/L", "is_diff": False}
    ],
    "ABG": [
        {"code": "ABG_PH", "name": "ARTERIAL pH", "unit": "pH", "value_type": "NUMERIC", "low": 7.35, "high": 7.45, "text": "7.35 - 7.45", "is_diff": False},
        {"code": "ABG_PCO2", "name": "pCO2", "unit": "mmHg", "value_type": "NUMERIC", "low": 35.0, "high": 45.0, "text": "35.0 - 45.0 mmHg", "is_diff": False},
        {"code": "ABG_PO2", "name": "pO2", "unit": "mmHg", "value_type": "NUMERIC", "low": 80.0, "high": 100.0, "text": "80.0 - 100.0 mmHg", "is_diff": False},
        {"code": "ABG_HCO3", "name": "ACTUAL BICARBONATE", "unit": "mmol/L", "value_type": "NUMERIC", "low": 22.0, "high": 26.0, "text": "22.0 - 26.0 mmol/L", "is_diff": False},
        {"code": "ABG_SO2", "name": "OXYGEN SATURATION (sO2)", "unit": "%", "value_type": "NUMERIC", "low": 95.0, "high": 99.0, "text": "95.0 - 99.0 %", "is_diff": False}
    ],
    "BAL": [
        {"code": "BAL", "name": "BLOOD ALCOHOL LEVEL", "unit": "mg/dL", "value_type": "NUMERIC", "low": 0.0, "high": 10.0, "text": "Negative (< 10.0 mg/dL)", "is_diff": False}
    ],
    "CARBAMAZ": [
        {"code": "CARBAMAZEPINE", "name": "CARBAMAZEPINE LEVEL", "unit": "ug/mL", "value_type": "NUMERIC", "low": 4.0, "high": 12.0, "text": "Therapeutic Range: 4.0 - 12.0 ug/mL", "is_diff": False}
    ],
    "CERULOPLASMIN": [
        {"code": "CERULOPLASMIN", "name": "SERUM CERULOPLASMIN", "unit": "mg/dL", "value_type": "NUMERIC", "low": 20.0, "high": 60.0, "text": "20.0 - 60.0 mg/dL", "is_diff": False}
    ],
    "COLD_AGGLUT": [
        {"code": "COLD_AGGLUT", "name": "COLD AGGLUTINATION TEST", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (Titre < 1:32)", "is_diff": False}
    ],
    "DOUBLE_MARKER": [
        {"code": "FREE_B_HCG", "name": "FREE BETA HCG", "unit": "mIU/mL", "value_type": "NUMERIC", "low": 10.0, "high": 50.0, "text": "Calculated Gestational MoM", "is_diff": False},
        {"code": "PAPP_A", "name": "PAPP-A (PREGNANCY ASSOCIATED PLASMA PROTEIN)", "unit": "mIU/L", "value_type": "NUMERIC", "low": 0.5, "high": 2.5, "text": "Calculated Gestational MoM", "is_diff": False},
        {"code": "RISK_SCORE", "name": "TRISOMY 21 / 18 RISK ASSESSMENT", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Screen Negative / Low Risk", "is_diff": False}
    ],
    "FAST_INSULIN": [
        {"code": "FAST_INSULIN", "name": "FASTING SERUM INSULIN", "unit": "uIU/mL", "value_type": "NUMERIC", "low": 2.6, "high": 24.9, "text": "2.6 - 24.9 uIU/mL", "is_diff": False}
    ],
    "GARDINAL": [
        {"code": "PHENOBARBITAL", "name": "PHENOBARBITAL (GARDINAL)", "unit": "ug/mL", "value_type": "NUMERIC", "low": 15.0, "high": 40.0, "text": "Therapeutic Range: 15.0 - 40.0 ug/mL (Toxic > 40)", "is_diff": False}
    ],
    "GH_BIO": [
        {"code": "GROWTH_HORMONE", "name": "GROWTH HORMONE (GH)", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.05, "high": 5.0, "text": "Fasting Adult: 0.05 - 5.0 ng/mL", "is_diff": False}
    ],
    "IGG_IGM_BIO": [
        {"code": "IGG", "name": "IMMUNOGLOBULIN G (IgG)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 700.0, "high": 1600.0, "text": "700.0 - 1600.0 mg/dL", "is_diff": False},
        {"code": "IGM", "name": "IMMUNOGLOBULIN M (IgM)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 40.0, "high": 230.0, "text": "40.0 - 230.0 mg/dL", "is_diff": False}
    ],
    "IRON": [
        {"code": "IRON", "name": "SERUM IRON", "unit": "ug/dL", "value_type": "NUMERIC", "low": 60.0, "high": 170.0, "text": "60.0 - 170.0 ug/dL (Male: 65-175, Female: 50-170)", "is_diff": False}
    ],
    "IRON_TIBC": [
        {"code": "IRON", "name": "SERUM IRON", "unit": "ug/dL", "value_type": "NUMERIC", "low": 60.0, "high": 170.0, "text": "60.0 - 170.0 ug/dL", "is_diff": False},
        {"code": "TIBC", "name": "TOTAL IRON BINDING CAPACITY", "unit": "ug/dL", "value_type": "NUMERIC", "low": 240.0, "high": 450.0, "text": "240.0 - 450.0 ug/dL", "is_diff": False},
        {"code": "TSAT", "name": "TRANSFERRIN SATURATION", "unit": "%", "value_type": "NUMERIC", "low": 20.0, "high": 50.0, "text": "20.0 - 50.0 %", "is_diff": False}
    ],
    "LACTATE": [
        {"code": "LACTATE", "name": "LACTATE LEVEL", "unit": "mmol/L", "value_type": "NUMERIC", "low": 0.5, "high": 2.2, "text": "Venous: 0.5 - 2.2 mmol/L (4.5 - 19.8 mg/dL)", "is_diff": False}
    ],
    "LITHIUM": [
        {"code": "LITHIUM", "name": "SERUM LITHIUM", "unit": "mmol/L", "value_type": "NUMERIC", "low": 0.6, "high": 1.2, "text": "Therapeutic: 0.6 - 1.2 mmol/L (Toxic > 1.5 mmol/L)", "is_diff": False}
    ],
    "PLASMA_OSMO": [
        {"code": "OSMOLARITY", "name": "PLASMA OSMOLARITY", "unit": "mOsm/kg", "value_type": "NUMERIC", "low": 275.0, "high": 295.0, "text": "275.0 - 295.0 mOsm/kg", "is_diff": False}
    ],
    "UPCR_RAND": [
        {"code": "UPCR", "name": "URINE PROTEIN / CREATININE RATIO", "unit": "mg/mg", "value_type": "NUMERIC", "low": 0.0, "high": 0.2, "text": "< 0.20 mg/mg (Normal), 0.2 - 2.0 (Moderate), > 2.0 (Nephrotic)", "is_diff": False}
    ],
    "RA_FACTOR": [
        {"code": "RA_FACTOR", "name": "RHEUMATOID FACTOR (RA)", "unit": "IU/mL", "value_type": "NUMERIC", "low": 0.0, "high": 20.0, "text": "< 20.0 IU/mL (Negative)", "is_diff": False}
    ],
    "S_FERRITIN": [
        {"code": "FERRITIN", "name": "SERUM FERRITIN", "unit": "ng/mL", "value_type": "NUMERIC", "low": 30.0, "high": 400.0, "text": "Male: 30 - 400 ng/mL, Female: 13 - 150 ng/mL", "is_diff": False}
    ],
    "SPEP": [
        {"code": "SPEP_INTERP", "name": "PROTEIN ELECTROPHORESIS PATTERN", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Normal Albumin & Globulin Band Distribution, No Monoclonal (M) Band Detected", "is_diff": False}
    ],
    "TIBC": [
        {"code": "TIBC", "name": "TOTAL IRON BINDING CAPACITY (TIBC)", "unit": "ug/dL", "value_type": "NUMERIC", "low": 240.0, "high": 450.0, "text": "240.0 - 450.0 ug/dL", "is_diff": False}
    ],
    "TRANSFERRIN": [
        {"code": "TRANSFERRIN", "name": "SERUM TRANSFERRIN", "unit": "mg/dL", "value_type": "NUMERIC", "low": 200.0, "high": 360.0, "text": "200.0 - 360.0 mg/dL", "is_diff": False}
    ],
    "TRANSFERRIN_SAT": [
        {"code": "TSAT", "name": "TRANSFERRIN SATURATION", "unit": "%", "value_type": "NUMERIC", "low": 20.0, "high": 50.0, "text": "20.0 - 50.0 %", "is_diff": False}
    ],
    "TROPONIN_T": [
        {"code": "TROPONIN_T", "name": "CARDIAC TROPONIN T (hs-cTnT)", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.0, "high": 0.014, "text": "Negative: < 0.014 ng/mL (< 14 pg/mL)", "is_diff": False}
    ],
    "UIBC": [
        {"code": "UIBC", "name": "UNSATURATED IRON BINDING CAPACITY", "unit": "ug/dL", "value_type": "NUMERIC", "low": 110.0, "high": 370.0, "text": "110.0 - 370.0 ug/dL", "is_diff": False}
    ],
    "D_DIMER": [
        {"code": "D_DIMER", "name": "D-DIMER (QUANTITATIVE)", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.0, "high": 500.0, "text": "< 500.0 ng/mL FEU (< 0.5 ug/mL)", "is_diff": False}
    ],
    "ECG": [
        {"code": "ECG_RHYTHM", "name": "HEART RHYTHM", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Normal Sinus Rhythm", "is_diff": False},
        {"code": "ECG_RATE", "name": "VENTRICULAR HEART RATE", "unit": "bpm", "value_type": "NUMERIC", "low": 60.0, "high": 100.0, "text": "60 - 100 bpm", "is_diff": False},
        {"code": "ECG_INTERP", "name": "12-LEAD ECG INTERPRETATION", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Normal PR (120-200ms) & QRS (80-100ms) intervals. No ST-segment elevation or depression.", "is_diff": False}
    ],
    "EGFR": [
        {"code": "EGFR", "name": "ESTIMATED GFR (CKD-EPI)", "unit": "mL/min/1.73m2", "value_type": "NUMERIC", "low": 90.0, "high": 120.0, "text": ">= 90 mL/min/1.73m2 (Normal GFR)", "is_diff": False}
    ],
    "DIABETES_SCREEN_URN": [
        {"code": "URN_GLUCOSE_SCR", "name": "URINARY GLUCOSE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil / Negative", "is_diff": False},
        {"code": "URN_PROTEIN_SCR", "name": "URINARY PROTEIN", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil / Negative", "is_diff": False}
    ],
    "17_OHP_BIO": [
        {"code": "17_OHP", "name": "17-HYDROXYPROGESTERONE", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.5, "high": 2.5, "text": "Follicular: 0.2 - 1.0, Luteal: 0.5 - 3.5, Male: 0.5 - 2.5 ng/mL", "is_diff": False}
    ],
    "17_OHCS_URN": [
        {"code": "17_OHCS", "name": "17-HYDROXYCORTICOSTEROIDS (URINE)", "unit": "mg/24hr", "value_type": "NUMERIC", "low": 3.0, "high": 10.0, "text": "Male: 3.0 - 10.0 mg/24hr, Female: 2.0 - 8.0 mg/24hr", "is_diff": False}
    ],
    "17_KGS_URN": [
        {"code": "17_KGS", "name": "17-KETOGENIC STEROIDS (URINE)", "unit": "mg/24hr", "value_type": "NUMERIC", "low": 5.0, "high": 15.0, "text": "Male: 5.0 - 15.0 mg/24hr, Female: 4.0 - 12.0 mg/24hr", "is_diff": False}
    ],
    "ANTI_CCP": [
        {"code": "ANTI_CCP", "name": "ANTI-CYCLIC CITRULLINATED PEPTIDE", "unit": "U/mL", "value_type": "NUMERIC", "low": 0.0, "high": 17.0, "text": "Negative: < 17.0 U/mL, Equivocal: 17 - 20, Positive: > 20", "is_diff": False}
    ],

    # === HEMATOLOGY ===
    "HB": [
        {"code": "HB", "name": "HEMOGLOBIN (Hb)", "unit": "gm/dl", "value_type": "NUMERIC", "low": 12.0, "high": 16.0, "text": "12.0 - 16.0 gm/dl (Male: 13.0 - 17.0, Female: 12.0 - 15.0)", "is_diff": False}
    ],
    "TC": [
        {"code": "WBC", "name": "TOTAL LEUCOCYTE COUNT (TLC / TC)", "unit": "cells/cumm", "value_type": "NUMERIC", "low": 4000.0, "high": 11000.0, "text": "4000 - 11000 cells/cumm", "is_diff": False}
    ],
    "ESR": [
        {"code": "ESR", "name": "ERYTHROCYTE SEDIMENTATION RATE (ESR)", "unit": "mm/1hr", "value_type": "NUMERIC", "low": 0.0, "high": 20.0, "text": "Male: 0 - 15 mm/1hr, Female: 0 - 20 mm/1hr", "is_diff": False}
    ],
    "PLT_COUNT": [
        {"code": "PLATELETS", "name": "PLATELET COUNT", "unit": "Lakhs/cumm", "value_type": "NUMERIC", "low": 1.5, "high": 4.5, "text": "1.5 - 4.5 Lakhs/cumm (150,000 - 450,000 /uL)", "is_diff": False}
    ],
    "RBC_COUNT": [
        {"code": "RBC", "name": "TOTAL R.B.C COUNT", "unit": "mill/cumm", "value_type": "NUMERIC", "low": 3.5, "high": 5.5, "text": "Male: 4.5 - 5.5, Female: 3.5 - 5.0 mill/cumm", "is_diff": False}
    ],
    "PCV_STANDALONE": [
        {"code": "PCV", "name": "PACKED CELL VOLUME (PCV / HEMATOCRIT)", "unit": "%", "value_type": "NUMERIC", "low": 37.0, "high": 47.0, "text": "Male: 40.0 - 50.0 %, Female: 37.0 - 47.0 %", "is_diff": False}
    ],
    "MCV_STANDALONE": [
        {"code": "MCV", "name": "MEAN CORPUSCULAR VOLUME (MCV)", "unit": "fl", "value_type": "NUMERIC", "low": 80.0, "high": 98.0, "text": "80.0 - 98.0 fl", "is_diff": False}
    ],
    "MCH_STANDALONE": [
        {"code": "MCH", "name": "MEAN CORPUSCULAR HEMOGLOBIN (MCH)", "unit": "pg", "value_type": "NUMERIC", "low": 27.0, "high": 32.0, "text": "27.0 - 32.0 pg", "is_diff": False}
    ],
    "MCHC_STANDALONE": [
        {"code": "MCHC", "name": "MEAN CORPUSCULAR HB CONCENTRATION (MCHC)", "unit": "%", "value_type": "NUMERIC", "low": 31.0, "high": 36.0, "text": "31.0 - 36.0 %", "is_diff": False}
    ],
    "BT": [
        {"code": "BT", "name": "BLEEDING TIME (BT)", "unit": "min:sec", "value_type": "NUMERIC", "low": 1.0, "high": 5.0, "text": "1:00 - 5:00 min (Duke method)", "is_diff": False}
    ],
    "CT": [
        {"code": "CT", "name": "CLOTTING TIME (CT)", "unit": "min:sec", "value_type": "NUMERIC", "low": 4.0, "high": 10.0, "text": "4:00 - 10:00 min (Lee-White method)", "is_diff": False}
    ],
    "BT_CT_COMBO": [
        {"code": "BT", "name": "BLEEDING TIME (BT)", "unit": "min:sec", "value_type": "NUMERIC", "low": 1.0, "high": 5.0, "text": "1:00 - 5:00 min", "is_diff": False},
        {"code": "CT", "name": "CLOTTING TIME (CT)", "unit": "min:sec", "value_type": "NUMERIC", "low": 4.0, "high": 10.0, "text": "4:00 - 10:00 min", "is_diff": False}
    ],
    "BLOOD_GROUP": [
        {"code": "ABO", "name": "ABO BLOOD GROUP", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "A / B / AB / O", "is_diff": False},
        {"code": "RH", "name": "Rh (D) FACTOR", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Positive / Negative", "is_diff": False}
    ],
    "PT_INR": [
        {"code": "PT_PATIENT", "name": "PROTHROMBIN TIME (PATIENT)", "unit": "sec", "value_type": "NUMERIC", "low": 11.0, "high": 15.0, "text": "11.0 - 15.0 sec", "is_diff": False},
        {"code": "PT_CONTROL", "name": "PROTHROMBIN TIME (CONTROL)", "unit": "sec", "value_type": "NUMERIC", "low": 11.0, "high": 13.0, "text": "12.0 sec", "is_diff": False},
        {"code": "INR", "name": "INTERNATIONAL NORMALIZED RATIO (INR)", "unit": "Ratio", "value_type": "NUMERIC", "low": 0.85, "high": 1.15, "text": "Normal: 0.85 - 1.15, Warfarin Therapy: 2.0 - 3.0", "is_diff": False}
    ],
    "APTT": [
        {"code": "APTT_PATIENT", "name": "APTT (PATIENT)", "unit": "sec", "value_type": "NUMERIC", "low": 26.0, "high": 38.0, "text": "26.0 - 38.0 sec", "is_diff": False},
        {"code": "APTT_CONTROL", "name": "APTT (CONTROL)", "unit": "sec", "value_type": "NUMERIC", "low": 28.0, "high": 32.0, "text": "30.0 sec", "is_diff": False}
    ],
    "ALC": [
        {"code": "ALC", "name": "ABSOLUTE LYMPHOCYTE COUNT", "unit": "cells/cumm", "value_type": "NUMERIC", "low": 1000.0, "high": 3000.0, "text": "1000 - 3000 cells/cumm", "is_diff": False}
    ],
    "ANC": [
        {"code": "ANC", "name": "ABSOLUTE NEUTROPHIL COUNT", "unit": "cells/cumm", "value_type": "NUMERIC", "low": 2000.0, "high": 7000.0, "text": "2000 - 7000 cells/cumm", "is_diff": False}
    ],
    "AEC": [
        {"code": "AEC", "name": "ABSOLUTE EOSINOPHIL COUNT", "unit": "cells/cumm", "value_type": "NUMERIC", "low": 40.0, "high": 440.0, "text": "40 - 440 cells/cumm", "is_diff": False}
    ],
    "AMH": [
        {"code": "AMH", "name": "ANTI-MULLERIAN HORMONE (AMH)", "unit": "ng/mL", "value_type": "NUMERIC", "low": 1.0, "high": 4.0, "text": "Normal Fertility: 1.0 - 4.0 ng/mL, Low: < 1.0, High (PCOS): > 4.0", "is_diff": False}
    ],
    "CA_19_9": [
        {"code": "CA_19_9", "name": "CANCER ANTIGEN 19-9", "unit": "U/mL", "value_type": "NUMERIC", "low": 0.0, "high": 37.0, "text": "< 37.0 U/mL (Normal)", "is_diff": False}
    ],
    "DENGUE_PROFILE": [
        {"code": "DENGUE_NS1", "name": "DENGUE NS1 ANTIGEN", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (Non-Reactive)", "is_diff": False},
        {"code": "DENGUE_IGM", "name": "DENGUE IgM ANTIBODY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (Non-Reactive)", "is_diff": False},
        {"code": "DENGUE_IGG", "name": "DENGUE IgG ANTIBODY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (Non-Reactive)", "is_diff": False}
    ],
    "G6PD_QUAL": [
        {"code": "G6PD_QUAL", "name": "G6PD (QUALITATIVE SCREEN)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Normal / Present (No deficiency detected)", "is_diff": False}
    ],
    "G6PD_QUANT": [
        {"code": "G6PD_QUANT", "name": "G6PD (QUANTITATIVE ENZYME)", "unit": "U/g Hb", "value_type": "NUMERIC", "low": 4.6, "high": 13.5, "text": "4.6 - 13.5 U/g Hb", "is_diff": False}
    ],
    "HS_CRP": [
        {"code": "HS_CRP", "name": "HIGH SENSITIVITY C-REACTIVE PROTEIN", "unit": "mg/L", "value_type": "NUMERIC", "low": 0.0, "high": 3.0, "text": "Low Risk: < 1.0, Average Risk: 1.0 - 3.0, High Risk: > 3.0 mg/L", "is_diff": False}
    ],
    "LE_CELL": [
        {"code": "LE_CELL", "name": "LE CELL PHENOMENON", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Not Seen / Negative", "is_diff": False}
    ],
    "LEPTO_IGG_IGM": [
        {"code": "LEPTO_IGM", "name": "LEPTOSPIRA IgM", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False},
        {"code": "LEPTO_IGG", "name": "LEPTOSPIRA IgG", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "LEPTOSPIRA_IGM": [
        {"code": "LEPTO_IGM", "name": "LEPTOSPIRA IgM", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "MP_CARD": [
        {"code": "MP_PV", "name": "PLASMODIUM VIVAX (Pv-LDH)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False},
        {"code": "MP_PF", "name": "PLASMODIUM FALCIPARUM (Pf-HRP2)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "MP_SMEAR": [
        {"code": "MP_SMEAR", "name": "MALARIAL PARASITES (MP SMEAR)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No Malarial Parasites (MP) seen on examination", "is_diff": False}
    ],
    "MANTOUX": [
        {"code": "MANTOUX_INDUR", "name": "MANTOUX (PPD) INDURATION", "unit": "mm", "value_type": "NUMERIC", "low": 0.0, "high": 5.0, "text": "< 5 mm Negative, 5-9 mm Equivocal, >= 10 mm Positive", "is_diff": False}
    ],
    "MF_QBC": [
        {"code": "MF_QBC", "name": "MICROFILARIAE (QBC)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative for Microfilariae", "is_diff": False}
    ],
    "MP_QBC": [
        {"code": "MP_QBC", "name": "MALARIAL PARASITE (QBC)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative for Malarial Parasites", "is_diff": False}
    ],
    "PS_EXAM": [
        {"code": "PS_RBC", "name": "RED BLOOD CELLS (RBC MORPHOLOGY)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Normocytic Normochromic", "is_diff": False},
        {"code": "PS_WBC", "name": "WHITE BLOOD CELLS (WBC SERIES)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Normal in number and mature in morphology", "is_diff": False},
        {"code": "PS_PLT", "name": "PLATELETS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Adequate on smear (No clumps/bizarre forms)", "is_diff": False},
        {"code": "PS_PARASITES", "name": "HEMOPARASITES", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No hemoparasites seen", "is_diff": False}
    ],
    "FIBRINOGEN": [
        {"code": "FIBRINOGEN", "name": "PLASMA FIBRINOGEN LEVEL", "unit": "mg/dL", "value_type": "NUMERIC", "low": 200.0, "high": 400.0, "text": "200.0 - 400.0 mg/dL", "is_diff": False}
    ],
    "RETIC_COUNT": [
        {"code": "RETIC", "name": "RETICULOCYTE COUNT", "unit": "%", "value_type": "NUMERIC", "low": 0.5, "high": 2.0, "text": "0.5 - 2.0 %", "is_diff": False}
    ],
    "SMEAR_MF": [
        {"code": "SMEAR_MF", "name": "PERIPHERAL SMEAR FOR MICROFILARIAE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No Microfilariae seen on nocturnal blood examination", "is_diff": False}
    ],
    "CROSS_MATCH": [
        {"code": "COMPATIBILITY", "name": "COMPATIBILITY RESULT", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Compatible with Recipient Blood", "is_diff": False}
    ],

    # === HORMONE ASSAYS ===
    "TSH": [
        {"code": "TSH", "name": "THYROID STIMULATING HORMONE (TSH)", "unit": "uIU/mL", "value_type": "NUMERIC", "low": 0.35, "high": 4.94, "text": "0.35 - 4.94 uIU/mL (Pregnant 1st Tri: 0.1-2.5)", "is_diff": False}
    ],
    "T3": [
        {"code": "T3", "name": "TOTAL TRIIODOTHYRONINE (T3)", "unit": "ng/dL", "value_type": "NUMERIC", "low": 60.0, "high": 200.0, "text": "60.0 - 200.0 ng/dL (0.8 - 2.0 ng/mL)", "is_diff": False}
    ],
    "T4": [
        {"code": "T4", "name": "TOTAL THYROXINE (T4)", "unit": "ug/dL", "value_type": "NUMERIC", "low": 4.5, "high": 12.0, "text": "4.5 - 12.0 ug/dL", "is_diff": False}
    ],
    "FT3": [
        {"code": "FT3", "name": "FREE TRIIODOTHYRONINE (FT3)", "unit": "pg/mL", "value_type": "NUMERIC", "low": 2.0, "high": 4.4, "text": "2.0 - 4.4 pg/mL", "is_diff": False}
    ],
    "FT4": [
        {"code": "FT4", "name": "FREE THYROXINE (FT4)", "unit": "ng/dL", "value_type": "NUMERIC", "low": 0.8, "high": 1.8, "text": "0.8 - 1.8 ng/dL", "is_diff": False}
    ],
    "VIT_D_TOTAL": [
        {"code": "VIT_D", "name": "25-HYDROXY VITAMIN D (TOTAL)", "unit": "ng/mL", "value_type": "NUMERIC", "low": 30.0, "high": 100.0, "text": "Deficiency: < 20, Insufficiency: 20-30, Sufficiency: 30-100 ng/mL", "is_diff": False}
    ],
    "VIT_D_25": [
        {"code": "VIT_D", "name": "25-HYDROXY VITAMIN D", "unit": "ng/mL", "value_type": "NUMERIC", "low": 30.0, "high": 100.0, "text": "30.0 - 100.0 ng/mL", "is_diff": False}
    ],
    "VIT_D3_125": [
        {"code": "VIT_D3_125", "name": "1,25-DIHYDROXY VITAMIN D3", "unit": "pg/mL", "value_type": "NUMERIC", "low": 20.0, "high": 60.0, "text": "20.0 - 60.0 pg/mL", "is_diff": False}
    ],
    "VIT_B12": [
        {"code": "VIT_B12", "name": "VITAMIN B-12 (CYANOCOBALAMIN)", "unit": "pg/mL", "value_type": "NUMERIC", "low": 211.0, "high": 911.0, "text": "211.0 - 911.0 pg/mL", "is_diff": False}
    ],
    "PSA": [
        {"code": "PSA", "name": "TOTAL PROSTATE SPECIFIC ANTIGEN", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.0, "high": 4.0, "text": "< 4.0 ng/mL (Normal)", "is_diff": False}
    ],
    "PROLACTIN": [
        {"code": "PROLACTIN", "name": "SERUM PROLACTIN", "unit": "ng/mL", "value_type": "NUMERIC", "low": 4.8, "high": 23.3, "text": "Male: 4.0 - 15.2 ng/mL, Female: 4.8 - 23.3 ng/mL", "is_diff": False}
    ],
    "LH": [
        {"code": "LH", "name": "LUTEINIZING HORMONE (LH)", "unit": "mIU/mL", "value_type": "NUMERIC", "low": 1.7, "high": 8.6, "text": "Male: 1.7 - 8.6 mIU/mL, Female Follicular: 2.4 - 12.6", "is_diff": False}
    ],
    "FSH": [
        {"code": "FSH", "name": "FOLLICLE STIMULATING HORMONE (FSH)", "unit": "mIU/mL", "value_type": "NUMERIC", "low": 1.5, "high": 12.4, "text": "Male: 1.5 - 12.4 mIU/mL, Female Follicular: 3.5 - 12.5", "is_diff": False}
    ],
    "TESTOSTERONE": [
        {"code": "TESTOSTERONE", "name": "TOTAL TESTOSTERONE", "unit": "ng/dL", "value_type": "NUMERIC", "low": 300.0, "high": 1000.0, "text": "Male: 300 - 1000 ng/dL, Female: 15 - 70 ng/dL", "is_diff": False}
    ],
    "ESTRADIOL_E2": [
        {"code": "ESTRADIOL", "name": "ESTRADIOL (E2)", "unit": "pg/mL", "value_type": "NUMERIC", "low": 15.0, "high": 350.0, "text": "Male: 10 - 40 pg/mL, Female: 15 - 350 pg/mL", "is_diff": False}
    ],
    "PROGESTERONE": [
        {"code": "PROGESTERONE", "name": "SERUM PROGESTERONE", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.2, "high": 20.0, "text": "Follicular: 0.2 - 1.5 ng/mL, Luteal: 1.7 - 27.0 ng/mL", "is_diff": False}
    ],
    "BETA_HCG": [
        {"code": "BETA_HCG", "name": "TOTAL BETA hCG", "unit": "mIU/mL", "value_type": "NUMERIC", "low": 0.0, "high": 5.0, "text": "Non-pregnant: < 5.0 mIU/mL", "is_diff": False}
    ],
    "AFP": [
        {"code": "AFP", "name": "ALPHA FETOPROTEIN (AFP)", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.0, "high": 8.5, "text": "< 8.5 ng/mL", "is_diff": False}
    ],
    "CEA": [
        {"code": "CEA", "name": "CARCINOEMBRYONIC ANTIGEN (CEA)", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.0, "high": 3.8, "text": "Non-Smoker: < 3.8 ng/mL, Smoker: < 5.5 ng/mL", "is_diff": False}
    ],
    "CA_125": [
        {"code": "CA_125", "name": "CANCER ANTIGEN 125", "unit": "U/mL", "value_type": "NUMERIC", "low": 0.0, "high": 35.0, "text": "< 35.0 U/mL", "is_diff": False}
    ],
    "CORTISOL_AM": [
        {"code": "CORTISOL_AM", "name": "SERUM CORTISOL (8 AM)", "unit": "ug/dL", "value_type": "NUMERIC", "low": 6.2, "high": 19.4, "text": "Morning (8 AM): 6.2 - 19.4 ug/dL", "is_diff": False}
    ],
    "CORTISOL_PM": [
        {"code": "CORTISOL_PM", "name": "SERUM CORTISOL (4 PM)", "unit": "ug/dL", "value_type": "NUMERIC", "low": 2.3, "high": 11.9, "text": "Evening (4 PM): 2.3 - 11.9 ug/dL", "is_diff": False}
    ],
    "CORTISOL_RANDOM": [
        {"code": "CORTISOL_RAND", "name": "SERUM CORTISOL (RANDOM)", "unit": "ug/dL", "value_type": "NUMERIC", "low": 3.0, "high": 15.0, "text": "3.0 - 15.0 ug/dL", "is_diff": False}
    ],
    "S_CORTISOL": [
        {"code": "CORTISOL", "name": "SERUM CORTISOL", "unit": "ug/dL", "value_type": "NUMERIC", "low": 6.0, "high": 19.0, "text": "6.0 - 19.0 ug/dL", "is_diff": False}
    ],
    "ANTI_TPO": [
        {"code": "ANTI_TPO", "name": "ANTI-THYROID PEROXIDASE (TPO)", "unit": "IU/mL", "value_type": "NUMERIC", "low": 0.0, "high": 34.0, "text": "< 34.0 IU/mL (Negative)", "is_diff": False}
    ],
    "ANTI_DSDNA": [
        {"code": "ANTI_DSDNA", "name": "ANTI-dsDNA ANTIBODY", "unit": "IU/mL", "value_type": "NUMERIC", "low": 0.0, "high": 30.0, "text": "< 30.0 IU/mL (Negative)", "is_diff": False}
    ],
    "ANA": [
        {"code": "ANA", "name": "ANTINUCLEAR ANTIBODIES (ANA - IFA)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (Titre < 1:80 / Ratio < 1.0)", "is_diff": False}
    ],
    "HLA_B27": [
        {"code": "HLA_B27", "name": "HLA-B27 ANTIGEN", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (Non-Reactive)", "is_diff": False}
    ],
    "TPHA": [
        {"code": "TPHA", "name": "TREPONEMA PALLIDUM HEMAGGLUTINATION", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive (Negative)", "is_diff": False}
    ],
    "TRIPLE_MARKER": [
        {"code": "TRIPLE_RISK", "name": "TRIPLE MARKER RISK ESTIMATE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Screen Negative / Low Risk for Down Syndrome & NTD", "is_diff": False}
    ],
    "TROPONIN_I": [
        {"code": "TROPONIN_I", "name": "CARDIAC TROPONIN I (cTnI)", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.0, "high": 0.04, "text": "< 0.04 ng/mL (Normal)", "is_diff": False}
    ],
    "TORCH_PANEL": [
        {"code": "TOXO_IGG", "name": "TOXOPLASMA IgG", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive", "is_diff": False},
        {"code": "TOXO_IGM", "name": "TOXOPLASMA IgM", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive", "is_diff": False},
        {"code": "RUBELLA_IGG", "name": "RUBELLA IgG", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Reactive (Immune >= 10 IU/mL)", "is_diff": False},
        {"code": "RUBELLA_IGM", "name": "RUBELLA IgM", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive", "is_diff": False},
        {"code": "CMV_IGG", "name": "CYTOMEGALOVIRUS (CMV) IgG", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive", "is_diff": False},
        {"code": "CMV_IGM", "name": "CYTOMEGALOVIRUS (CMV) IgM", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive", "is_diff": False},
        {"code": "HSV1_IGG", "name": "HERPES SIMPLEX 1/2 IgG", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive", "is_diff": False},
        {"code": "HSV1_IGM", "name": "HERPES SIMPLEX 1/2 IgM", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive", "is_diff": False}
    ],
    "TORCH_IGG": [
        {"code": "TORCH_IGG", "name": "TORCH IgG PROFILE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive", "is_diff": False}
    ],
    "TORCH_IGM": [
        {"code": "TORCH_IGM", "name": "TORCH IgM PROFILE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive", "is_diff": False}
    ],

    # === SEROLOGY ===
    "CRP": [
        {"code": "CRP", "name": "C-REACTIVE PROTEIN (CRP)", "unit": "mg/L", "value_type": "NUMERIC", "low": 0.0, "high": 6.0, "text": "< 6.0 mg/L (Normal / Negative)", "is_diff": False}
    ],
    "HS_CRP_SERO": [
        {"code": "HS_CRP", "name": "HIGH SENSITIVITY CRP", "unit": "mg/L", "value_type": "NUMERIC", "low": 0.0, "high": 3.0, "text": "< 3.0 mg/L", "is_diff": False}
    ],
    "ASO_TITRE": [
        {"code": "ASO", "name": "ANTISTREPTOLYSIN-O (ASO TITRE)", "unit": "IU/mL", "value_type": "NUMERIC", "low": 0.0, "high": 200.0, "text": "< 200.0 IU/mL (Negative)", "is_diff": False}
    ],
    "CD4_COUNT": [
        {"code": "CD4", "name": "CD4 ABSOLUTE COUNT", "unit": "cells/uL", "value_type": "NUMERIC", "low": 500.0, "high": 1500.0, "text": "500 - 1500 cells/uL", "is_diff": False}
    ],
    "CHIK_IGM": [
        {"code": "CHIK_IGM", "name": "CHIKUNGUNYA IgM", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (Non-Reactive)", "is_diff": False}
    ],
    "COVID_NAAT": [
        {"code": "COVID_NAAT", "name": "SARS-CoV-2 NAAT", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative for SARS-CoV-2 RNA", "is_diff": False}
    ],
    "HBSAG_CLIA": [
        {"code": "HBSAG_CLIA", "name": "HBsAg (CLIA CHEMI)", "unit": "S/CO", "value_type": "NUMERIC", "low": 0.0, "high": 0.9, "text": "Non-Reactive (< 0.9 S/CO)", "is_diff": False}
    ],
    "HCV_CARD": [
        {"code": "HCV_CARD", "name": "HCV ANTIBODIES (RAPID CARD)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive (Negative)", "is_diff": False}
    ],
    "HCV_CLIA": [
        {"code": "HCV_CLIA", "name": "HCV (CLIA CHEMI)", "unit": "S/CO", "value_type": "NUMERIC", "low": 0.0, "high": 0.9, "text": "Non-Reactive (< 0.9 S/CO)", "is_diff": False}
    ],
    "HBSAG_CARD": [
        {"code": "HBSAG_CARD", "name": "HBsAg (RAPID CARD)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive (Negative)", "is_diff": False}
    ],
    "HIV_CARD": [
        {"code": "HIV_CARD", "name": "HIV 1 & 2 (RAPID CARD)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive for HIV 1 & 2", "is_diff": False}
    ],
    "HIV_1_2_ELISA": [
        {"code": "HIV_ELISA", "name": "HIV 1 & 2 ANTIBODIES (ELISA)", "unit": "Index", "value_type": "NUMERIC", "low": 0.0, "high": 0.9, "text": "Non-Reactive (Index < 0.9)", "is_diff": False}
    ],
    "HIV_CLIA": [
        {"code": "HIV_CLIA", "name": "HIV 1 & 2 (CLIA)", "unit": "Index", "value_type": "NUMERIC", "low": 0.0, "high": 0.9, "text": "Non-Reactive (Index < 0.9)", "is_diff": False}
    ],
    "HIV_ELISA": [
        {"code": "HIV_ELISA", "name": "HIV 1 & 2 ANTIBODIES (ELISA)", "unit": "Index", "value_type": "NUMERIC", "low": 0.0, "high": 0.9, "text": "Non-Reactive (Index < 0.9)", "is_diff": False}
    ],
    "HBSAG_ELISA": [
        {"code": "HBSAG_ELISA", "name": "HBsAg (ELISA)", "unit": "Index", "value_type": "NUMERIC", "low": 0.0, "high": 0.9, "text": "Non-Reactive (Index < 0.9)", "is_diff": False}
    ],
    "HCV_ELISA": [
        {"code": "HCV_ELISA", "name": "HCV ANTIBODIES (ELISA)", "unit": "Index", "value_type": "NUMERIC", "low": 0.0, "high": 0.9, "text": "Non-Reactive (Index < 0.9)", "is_diff": False}
    ],
    "IGE_TOTAL": [
        {"code": "IGE", "name": "TOTAL SERUM IgE", "unit": "IU/mL", "value_type": "NUMERIC", "low": 0.0, "high": 100.0, "text": "< 100.0 IU/mL (Normal)", "is_diff": False}
    ],
    "PROCALCITONIN": [
        {"code": "PCT", "name": "PROCALCITONIN (PCT)", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.0, "high": 0.5, "text": "< 0.5 ng/mL (Low risk of severe systemic sepsis)", "is_diff": False}
    ],
    "VDRL": [
        {"code": "VDRL", "name": "VDRL / RPR TEST", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Non-Reactive", "is_diff": False}
    ],
    "WEIL_FELIX": [
        {"code": "WEIL_OX2", "name": "PROTEUS OX2 TITRE", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "< 1:80 (Negative)", "is_diff": False},
        {"code": "WEIL_OX19", "name": "PROTEUS OX19 TITRE", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "< 1:80 (Negative)", "is_diff": False},
        {"code": "WEIL_OXK", "name": "PROTEUS OXK TITRE", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "< 1:80 (Negative)", "is_diff": False}
    ],

    # === CLINICAL PATHOLOGY ===
    "CP_URN_CALC": [
        {"code": "URN_CALC_24H", "name": "24 HOURS URINARY CALCIUM", "unit": "mg/24hr", "value_type": "NUMERIC", "low": 100.0, "high": 300.0, "text": "100.0 - 300.0 mg/24hr (Average Diet)", "is_diff": False}
    ],
    "CP_URN_CL": [
        {"code": "URN_CL_24H", "name": "24 HOURS URINARY CHLORIDE", "unit": "mmol/24hr", "value_type": "NUMERIC", "low": 110.0, "high": 250.0, "text": "110.0 - 250.0 mmol/24hr", "is_diff": False}
    ],
    "CP_URN_CREAT": [
        {"code": "URN_CREAT_24H", "name": "24 HOURS URINARY CREATININE", "unit": "g/24hr", "value_type": "NUMERIC", "low": 1.0, "high": 2.0, "text": "1.0 - 2.0 g/24hr (15 - 25 mg/kg/day)", "is_diff": False}
    ],
    "CP_URN_PHOS": [
        {"code": "URN_PHOS_24H", "name": "24 HOURS URINARY PHOSPHORUS", "unit": "g/24hr", "value_type": "NUMERIC", "low": 0.4, "high": 1.3, "text": "0.4 - 1.3 g/24hr", "is_diff": False}
    ],
    "CP_URN_K": [
        {"code": "URN_K_24H", "name": "24 HOURS URINARY POTASSIUM", "unit": "mmol/24hr", "value_type": "NUMERIC", "low": 25.0, "high": 125.0, "text": "25.0 - 125.0 mmol/24hr", "is_diff": False}
    ],
    "CP_URN_NA": [
        {"code": "URN_NA_24H", "name": "24 HOURS URINARY SODIUM", "unit": "mmol/24hr", "value_type": "NUMERIC", "low": 40.0, "high": 220.0, "text": "40.0 - 220.0 mmol/24hr", "is_diff": False}
    ],
    "CP_URN_PROT": [
        {"code": "URN_PROT_24H", "name": "24 HOURS URINE PROTEIN", "unit": "mg/24hr", "value_type": "NUMERIC", "low": 0.0, "high": 150.0, "text": "< 150.0 mg/24hr", "is_diff": False}
    ],
    "SPOT_URN_CALC": [
        {"code": "SPOT_CALC", "name": "SPOT URINE CALCIUM", "unit": "mg/dL", "value_type": "NUMERIC", "low": 2.5, "high": 20.0, "text": "2.5 - 20.0 mg/dL", "is_diff": False}
    ],
    "SPOT_URN_CREAT": [
        {"code": "SPOT_CREAT", "name": "SPOT URINE CREATININE", "unit": "mg/dL", "value_type": "NUMERIC", "low": 20.0, "high": 275.0, "text": "20.0 - 275.0 mg/dL", "is_diff": False}
    ],
    "SPOT_URN_PROT": [
        {"code": "SPOT_PROT", "name": "SPOT URINE PROTEIN", "unit": "mg/dL", "value_type": "NUMERIC", "low": 0.0, "high": 14.0, "text": "< 14.0 mg/dL", "is_diff": False}
    ],
    "FUS": [
        {"code": "FUS", "name": "FASTING URINE SUGAR (FUS)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil / Negative", "is_diff": False}
    ],
    "PPUS": [
        {"code": "PPUS", "name": "POST PRANDIAL URINE SUGAR (PPUS)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil / Negative", "is_diff": False}
    ],
    "RUS": [
        {"code": "RUS", "name": "RANDOM URINE SUGAR (RUS)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil / Negative", "is_diff": False}
    ],
    "URN_SUGAR": [
        {"code": "URN_SUGAR", "name": "URINE SUGAR", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil / Negative", "is_diff": False}
    ],
    "URN_ALBUMIN": [
        {"code": "URN_ALBUMIN", "name": "URINE ALBUMIN", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil / Negative", "is_diff": False}
    ],
    "URN_ACETONE": [
        {"code": "URN_ACETONE", "name": "URINE ACETONE (KETONE BODIES)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "URN_KETONES": [
        {"code": "URN_KETONES", "name": "URINE KETONE BODIES", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "URN_BP": [
        {"code": "URN_BP", "name": "URINE BILE PIGMENTS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "URN_BS": [
        {"code": "URN_BS", "name": "URINE BILE SALTS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "URN_BS_BP": [
        {"code": "URN_BS", "name": "BILE SALTS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False},
        {"code": "URN_BP", "name": "BILE PIGMENTS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "URN_AFB": [
        {"code": "URN_AFB", "name": "URINE FOR AFB (ACID-FAST BACILLI)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No Acid Fast Bacilli seen (Negative)", "is_diff": False}
    ],
    "URN_PBG": [
        {"code": "URN_PBG", "name": "URINE FOR PORPHOBILINOGEN", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "URN_MICROALB": [
        {"code": "URN_MICROALB", "name": "URINE MICROALBUMIN", "unit": "mg/L", "value_type": "NUMERIC", "low": 0.0, "high": 30.0, "text": "< 30.0 mg/L Normal, 30-300 Microalbuminuria", "is_diff": False}
    ],
    "URN_MICROSCOPY": [
        {"code": "URN_PUS", "name": "PUS CELLS", "unit": "/HPF", "value_type": "TEXT", "low": None, "high": None, "text": "1 - 3 / HPF", "is_diff": False},
        {"code": "URN_RBC", "name": "RED BLOOD CELLS (RBCs)", "unit": "/HPF", "value_type": "TEXT", "low": None, "high": None, "text": "Nil / HPF", "is_diff": False},
        {"code": "URN_EPITH", "name": "EPITHELIAL CELLS", "unit": "/HPF", "value_type": "TEXT", "low": None, "high": None, "text": "1 - 2 / HPF", "is_diff": False},
        {"code": "URN_CASTS", "name": "CASTS", "unit": "/LPF", "value_type": "TEXT", "low": None, "high": None, "text": "Nil / LPF", "is_diff": False},
        {"code": "URN_CRYSTALS", "name": "CRYSTALS", "unit": "/HPF", "value_type": "TEXT", "low": None, "high": None, "text": "Nil / HPF", "is_diff": False}
    ],
    "URN_NICOTINE": [
        {"code": "URN_NICOTINE", "name": "URINE NICOTINE / COTININE", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.0, "high": 200.0, "text": "< 200 ng/mL (Non-smoker / Negative)", "is_diff": False}
    ],
    "URN_OCCULT_BLOOD": [
        {"code": "URN_OB", "name": "URINE OCCULT BLOOD", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "UPT": [
        {"code": "UPT", "name": "URINE PREGNANCY TEST (UPT)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (Non-Reactive for hCG)", "is_diff": False}
    ],
    "BENCE_JONES": [
        {"code": "BENCE_JONES", "name": "BENCE-JONES PROTEIN (URINE)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (No precipitation observed)", "is_diff": False}
    ],
    "DCT": [
        {"code": "DCT", "name": "DIRECT COOMB'S TEST (DCT)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "ICT": [
        {"code": "ICT", "name": "INDIRECT COOMB'S TEST (ICT)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "ICT_DCT_COMBO": [
        {"code": "DCT", "name": "DIRECT COOMB'S TEST (DCT)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False},
        {"code": "ICT", "name": "INDIRECT COOMB'S TEST (ICT)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "HCT_CP": [
        {"code": "HCT", "name": "HEMATOCRIT (HCT)", "unit": "%", "value_type": "NUMERIC", "low": 37.0, "high": 47.0, "text": "37.0 - 47.0 %", "is_diff": False}
    ],
    "SEMEN_ANALYSIS": [
        {"code": "SEMEN_VOL", "name": "VOLUME", "unit": "mL", "value_type": "NUMERIC", "low": 1.5, "high": 5.0, "text": ">= 1.5 mL", "is_diff": False},
        {"code": "SEMEN_COUNT", "name": "SPERM CONCENTRATION", "unit": "Million/mL", "value_type": "NUMERIC", "low": 15.0, "high": 200.0, "text": ">= 15 Million/mL", "is_diff": False},
        {"code": "SEMEN_MOTILITY", "name": "TOTAL MOTILITY (PR + NP)", "unit": "%", "value_type": "NUMERIC", "low": 40.0, "high": 100.0, "text": ">= 40 %", "is_diff": False},
        {"code": "SEMEN_PROG_MOT", "name": "PROGRESSIVE MOTILITY (PR)", "unit": "%", "value_type": "NUMERIC", "low": 32.0, "high": 100.0, "text": ">= 32 %", "is_diff": False},
        {"code": "SEMEN_MORPH", "name": "NORMAL FORMS", "unit": "%", "value_type": "NUMERIC", "low": 4.0, "high": 100.0, "text": ">= 4 % Normal", "is_diff": False}
    ],
    "STOOL_ANALYSIS": [
        {"code": "STOOL_COLOR", "name": "COLOR", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Brownish", "is_diff": False},
        {"code": "STOOL_CONSIST", "name": "CONSISTENCY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Formed / Soft", "is_diff": False},
        {"code": "STOOL_MUCUS", "name": "MUCUS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil / Absent", "is_diff": False},
        {"code": "STOOL_BLOOD", "name": "OCCULT BLOOD", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False},
        {"code": "STOOL_OVA", "name": "OVA / CYSTS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "None detected", "is_diff": False}
    ],
    "STOOL_HANGING_DROP": [
        {"code": "HANGING_DROP", "name": "HANGING DROP EXAMINATION", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No darting motility seen (Negative for V. cholerae)", "is_diff": False}
    ],
    "STOOL_OB": [
        {"code": "STOOL_OB", "name": "STOOL FOR OCCULT BLOOD", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False}
    ],
    "STOOL_PH": [
        {"code": "STOOL_PH", "name": "STOOL pH", "unit": "pH", "value_type": "NUMERIC", "low": 6.0, "high": 7.5, "text": "6.0 - 7.5", "is_diff": False}
    ],
    "STOOL_RED_SUB": [
        {"code": "STOOL_RED_SUB", "name": "STOOL REDUCING SUBSTANCES", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (< 0.25 g/dL)", "is_diff": False}
    ],
    "STOOL_OVA_CYST": [
        {"code": "STOOL_OVA_CYST", "name": "STOOL OVA & CYST EXAMINATION", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No helmintic ova or protozoal cysts seen", "is_diff": False}
    ],
    "CSF_ANALYSIS": [
        {"code": "CSF_APPEAR", "name": "APPEARANCE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Clear, Colorless", "is_diff": False},
        {"code": "CSF_PROTEIN", "name": "CSF PROTEIN", "unit": "mg/dL", "value_type": "NUMERIC", "low": 15.0, "high": 45.0, "text": "15.0 - 45.0 mg/dL", "is_diff": False},
        {"code": "CSF_SUGAR", "name": "CSF GLUCOSE", "unit": "mg/dL", "value_type": "NUMERIC", "low": 45.0, "high": 80.0, "text": "45.0 - 80.0 mg/dL (60% of plasma glucose)", "is_diff": False},
        {"code": "CSF_CELLS", "name": "TOTAL CELL COUNT (TLC)", "unit": "cells/cumm", "value_type": "NUMERIC", "low": 0.0, "high": 5.0, "text": "0 - 5 cells/cumm (Mononuclear)", "is_diff": False}
    ],
    "ASCITIC_FLUID": [
        {"code": "ASCITIC_APPEAR", "name": "APPEARANCE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Clear, Pale Yellow", "is_diff": False},
        {"code": "ASCITIC_PROT", "name": "PROTEIN", "unit": "g/dL", "value_type": "NUMERIC", "low": 0.5, "high": 2.5, "text": "Transudate: < 2.5 g/dL, Exudate: > 3.0 g/dL", "is_diff": False},
        {"code": "ASCITIC_CELLS", "name": "TOTAL CELLS (TLC)", "unit": "cells/cumm", "value_type": "NUMERIC", "low": 0.0, "high": 300.0, "text": "< 300 cells/cumm", "is_diff": False}
    ],
    "PLEURAL_ANALYSIS": [
        {"code": "PLEURAL_APPEAR", "name": "APPEARANCE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Straw colored, Clear", "is_diff": False},
        {"code": "PLEURAL_PROT", "name": "PROTEIN", "unit": "g/dL", "value_type": "NUMERIC", "low": 0.5, "high": 3.0, "text": "Transudate: < 3.0 g/dL, Exudate: > 3.0 g/dL", "is_diff": False},
        {"code": "PLEURAL_GLUC", "name": "GLUCOSE", "unit": "mg/dL", "value_type": "NUMERIC", "low": 60.0, "high": 100.0, "text": "60.0 - 100.0 mg/dL", "is_diff": False}
    ],
    "PERICARDIAL_CYTO": [
        {"code": "PERICARD_CYTO", "name": "PERICARDIAL FLUID CYTOLOGY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative for malignant cells. Benign mesothelial cells seen.", "is_diff": False}
    ],
    "FNAC": [
        {"code": "FNAC_REPORT", "name": "FINE NEEDLE ASPIRATION CYTOLOGY (FNAC)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Adequate cellularity. No atypical or malignant cells identified.", "is_diff": False}
    ],
    "HISTO_REP": [
        {"code": "HISTO_REPORT", "name": "HISTOPATHOLOGICAL EXAMINATION (HPE)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Microscopic examination findings and diagnostic impression.", "is_diff": False}
    ],

    # === CYTOLOGY ===
    "CYTO_CSF": [
        {"code": "CYTO_CSF", "name": "CSF CYTOLOGY EXAMINATION", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No malignant cells seen. Few mature lymphocytes present.", "is_diff": False}
    ],
    "PAP_SMEAR": [
        {"code": "PAP_SMEAR", "name": "PAP SMEAR (BETHESDA SYSTEM)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative for Intraepithelial Lesion or Malignancy (NILM)", "is_diff": False}
    ],
    "CYTO_PLEURAL": [
        {"code": "CYTO_PLEURAL", "name": "PLEURAL FLUID CYTOLOGY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative for malignant cells", "is_diff": False}
    ],
    "CYTO_SPUTUM": [
        {"code": "CYTO_SPUTUM", "name": "SPUTUM CYTOLOGY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative for malignant cells. Alveolar macrophages present.", "is_diff": False}
    ],
    "CYTO_URINE": [
        {"code": "CYTO_URINE", "name": "URINE CYTOLOGY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative for high-grade urothelial carcinoma", "is_diff": False}
    ],

    # === HISTOPATHOLOGY ===
    "HISTO_BIOPSY": [
        {"code": "BIOPSY_REPORT", "name": "TISSUE BIOPSY EXAMINATION", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Representative sections examined. Histological impression recorded.", "is_diff": False}
    ],
    "BIOPSY_LARGE": [
        {"code": "BIOPSY_LARGE", "name": "LARGE SPECIMEN BIOPSY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Surgical margin clear. Pathological evaluation recorded.", "is_diff": False}
    ],
    "BIOPSY_MEDIUM": [
        {"code": "BIOPSY_MEDIUM", "name": "MEDIUM SPECIMEN BIOPSY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Excisional biopsy report.", "is_diff": False}
    ],
    "BIOPSY_SMALL": [
        {"code": "BIOPSY_SMALL", "name": "SMALL SPECIMEN BIOPSY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Punch/Needle biopsy report.", "is_diff": False}
    ],
    "BONE_MARROW_EXAM": [
        {"code": "BM_ASPIRATE", "name": "BONE MARROW ASPIRATE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Normocellular marrow with trilineage hematopoiesis.", "is_diff": False},
        {"code": "BM_BIOPSY", "name": "TREPHINE BIOPSY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Bony trabeculae with normal marrow cellularity.", "is_diff": False}
    ],

    # === MICROBIOLOGY ===
    "CS_BLOOD": [
        {"code": "CULTURE_RES", "name": "BLOOD CULTURE & SENSITIVITY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No growth of aerobic organisms after 48 hours of incubation at 37°C.", "is_diff": False}
    ],
    "CS_URINE": [
        {"code": "CULTURE_RES", "name": "URINE CULTURE & SENSITIVITY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No significant bacteriuria (< 10,000 CFU/mL).", "is_diff": False}
    ],
    "CS_PUS": [
        {"code": "CULTURE_RES", "name": "PUS CULTURE & SENSITIVITY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No organism isolated after 48 hours.", "is_diff": False}
    ],
    "CS_SPUTUM": [
        {"code": "CULTURE_RES", "name": "SPUTUM CULTURE & SENSITIVITY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Normal upper respiratory tract flora. No pathogens isolated.", "is_diff": False}
    ],
    "CS_STOOL": [
        {"code": "CULTURE_RES", "name": "STOOL CULTURE & SENSITIVITY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Normal fecal flora. No Salmonella, Shigella, or Vibrio isolated.", "is_diff": False}
    ],
    "CS_SWAB": [
        {"code": "CULTURE_RES", "name": "SWAB CULTURE & SENSITIVITY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No pathogenic bacterial growth.", "is_diff": False}
    ],
    "CS_BRONCHIAL": [
        {"code": "CULTURE_RES", "name": "BRONCHIAL WASH CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No pathogenic organisms isolated.", "is_diff": False}
    ],
    "CS_CATH_TIP": [
        {"code": "CULTURE_RES", "name": "CATHETER TIP CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No bacterial growth (< 15 CFU / Maki roll plate).", "is_diff": False}
    ],
    "CS_CVP_TIP": [
        {"code": "CULTURE_RES", "name": "CVP TIP CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No bacterial growth.", "is_diff": False}
    ],
    "CS_EAR_THROAT": [
        {"code": "CULTURE_RES", "name": "EAR/THROAT SWAB CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Commensal flora. No pathogenic beta-hemolytic streptococci.", "is_diff": False}
    ],
    "CS_ET_TUBE": [
        {"code": "CULTURE_RES", "name": "ET TUBE TIP CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No pathogenic growth.", "is_diff": False}
    ],
    "CS_EYE": [
        {"code": "CULTURE_RES", "name": "EYE SWAB CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No pathogenic bacterial growth.", "is_diff": False}
    ],
    "CS_FLUID": [
        {"code": "CULTURE_RES", "name": "BODY FLUID CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No bacterial or fungal growth after 48 hours.", "is_diff": False}
    ],
    "CS_OT_SWAB": [
        {"code": "CULTURE_RES", "name": "OPERATION THEATRE (OT) SWAB CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Sterile. No environmental bacterial or fungal growth.", "is_diff": False}
    ],
    "CS_SYNOVIAL": [
        {"code": "CULTURE_RES", "name": "SYNOVIAL FLUID CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No bacterial growth after 48 hours.", "is_diff": False}
    ],
    "CS_TISSUE": [
        {"code": "CULTURE_RES", "name": "TISSUE CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No bacterial growth.", "is_diff": False}
    ],
    "CS_VAGINAL": [
        {"code": "CULTURE_RES", "name": "VAGINAL SWAB CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Normal lactobacilli flora. No Trichomonas, Candida, or clue cells.", "is_diff": False}
    ],
    "CS_UMBILICAL": [
        {"code": "CULTURE_RES", "name": "UMBILICAL TIP CULTURE", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No bacterial growth.", "is_diff": False}
    ],
    "GRAM_STAIN": [
        {"code": "GRAM_STAIN", "name": "GRAM'S STAIN EXAMINATION", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No pus cells or microorganisms observed in smear.", "is_diff": False}
    ],
    "INDIA_INK": [
        {"code": "INDIA_INK", "name": "INDIA INK PREPARATION", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No encapsulated yeast cells (Cryptococcus) seen.", "is_diff": False}
    ],
    "ALLERGY_INHAL": [
        {"code": "INHAL_ALLERGY", "name": "INHALATION ALLERGY SCREEN", "unit": "kU/L", "value_type": "NUMERIC", "low": 0.0, "high": 0.35, "text": "< 0.35 kU/L (Class 0 - Negative)", "is_diff": False}
    ],
    "KOH_MOUNT": [
        {"code": "KOH_MOUNT", "name": "KOH MOUNT EXAMINATION", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No fungal hyphae or spores detected.", "is_diff": False}
    ],
    "SPUTUM_AFB": [
        {"code": "SPUTUM_AFB", "name": "SPUTUM FOR AFB (ZN STAIN)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "No Acid Fast Bacilli observed in 100 oil immersion fields.", "is_diff": False}
    ],

    # === MOLECULAR BIOLOGY ===
    "COVID_RTPCR": [
        {"code": "COVID_RTPCR", "name": "SARS-CoV-2 (COVID-19) RT-PCR", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "NEGATIVE (Target genes E, N & RdRp not detected).", "is_diff": False}
    ],
    "COVID_DUO": [
        {"code": "COVID_DUO", "name": "COVID-19 IgG & IgM ANTIBODIES", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "IgG: Non-Reactive, IgM: Non-Reactive", "is_diff": False}
    ],

    # === COMPOSITE PROFILES & PANELS ===
    "CBC": [
        {"code": "HB", "name": "HEMOGLOBIN", "unit": "g/dL", "value_type": "NUMERIC", "low": 12.0, "high": 16.0, "text": "12.0 - 16.0 g/dL (Male: 13.0 - 17.0, Female: 12.0 - 15.0)", "is_diff": False},
        {"code": "WBC", "name": "TOTAL LEUCOCYTE COUNT (TLC)", "unit": "cells/cumm", "value_type": "NUMERIC", "low": 4000.0, "high": 11000.0, "text": "4000 - 11000 cells/cumm", "is_diff": False},
        {"code": "NEUTROPHILS", "name": "NEUTROPHILS", "unit": "%", "value_type": "NUMERIC", "low": 40.0, "high": 70.0, "text": "40 - 70 %", "is_diff": True},
        {"code": "LYMPHOCYTES", "name": "LYMPHOCYTES", "unit": "%", "value_type": "NUMERIC", "low": 20.0, "high": 45.0, "text": "20 - 45 %", "is_diff": True},
        {"code": "EOSINOPHILS", "name": "EOSINOPHILS", "unit": "%", "value_type": "NUMERIC", "low": 1.0, "high": 6.0, "text": "1 - 6 %", "is_diff": True},
        {"code": "MONOCYTES", "name": "MONOCYTES", "unit": "%", "value_type": "NUMERIC", "low": 2.0, "high": 8.0, "text": "2 - 8 %", "is_diff": True},
        {"code": "BASOPHILS", "name": "BASOPHILS", "unit": "%", "value_type": "NUMERIC", "low": 0.0, "high": 1.0, "text": "0 - 1 %", "is_diff": True},
        {"code": "PLATELETS", "name": "PLATELET COUNT", "unit": "lakhs/cumm", "value_type": "NUMERIC", "low": 1.5, "high": 4.5, "text": "1.5 - 4.5 lakhs/cumm", "is_diff": False},
        {"code": "RBC", "name": "RED BLOOD CELL COUNT (RBC)", "unit": "mil/cumm", "value_type": "NUMERIC", "low": 3.8, "high": 5.5, "text": "3.8 - 5.5 mil/cumm", "is_diff": False},
        {"code": "PCV", "name": "PACKED CELL VOLUME (PCV / HEMATOCRIT)", "unit": "%", "value_type": "NUMERIC", "low": 36.0, "high": 48.0, "text": "36.0 - 48.0 %", "is_diff": False},
        {"code": "MCV", "name": "MEAN CORPUSCULAR VOLUME (MCV)", "unit": "fL", "value_type": "NUMERIC", "low": 80.0, "high": 98.0, "text": "80.0 - 98.0 fL", "is_diff": False},
        {"code": "MCH", "name": "MEAN CORPUSCULAR HEMOGLOBIN (MCH)", "unit": "pg", "value_type": "NUMERIC", "low": 27.0, "high": 32.0, "text": "27.0 - 32.0 pg", "is_diff": False},
        {"code": "MCHC", "name": "MEAN CORPUSCULAR HB CONCENTRATION (MCHC)", "unit": "g/dL", "value_type": "NUMERIC", "low": 31.0, "high": 36.0, "text": "31.0 - 36.0 g/dL", "is_diff": False},
        {"code": "ESR", "name": "ERYTHROCYTE SEDIMENTATION RATE (ESR)", "unit": "mm/1hr", "value_type": "NUMERIC", "low": 0.0, "high": 20.0, "text": "0 - 20 mm/1hr (Male: 0 - 15, Female: 0 - 20)", "is_diff": False}
    ],
    "CBP": [
        {"code": "HB", "name": "HEMOGLOBIN", "unit": "g/dL", "value_type": "NUMERIC", "low": 12.0, "high": 16.0, "text": "12.0 - 16.0 g/dL", "is_diff": False},
        {"code": "WBC", "name": "TOTAL LEUCOCYTE COUNT (TLC)", "unit": "cells/cumm", "value_type": "NUMERIC", "low": 4000.0, "high": 11000.0, "text": "4000 - 11000 cells/cumm", "is_diff": False},
        {"code": "NEUTROPHILS", "name": "NEUTROPHILS", "unit": "%", "value_type": "NUMERIC", "low": 40.0, "high": 70.0, "text": "40 - 70 %", "is_diff": True},
        {"code": "LYMPHOCYTES", "name": "LYMPHOCYTES", "unit": "%", "value_type": "NUMERIC", "low": 20.0, "high": 45.0, "text": "20 - 45 %", "is_diff": True},
        {"code": "EOSINOPHILS", "name": "EOSINOPHILS", "unit": "%", "value_type": "NUMERIC", "low": 1.0, "high": 6.0, "text": "1 - 6 %", "is_diff": True},
        {"code": "MONOCYTES", "name": "MONOCYTES", "unit": "%", "value_type": "NUMERIC", "low": 2.0, "high": 8.0, "text": "2 - 8 %", "is_diff": True},
        {"code": "BASOPHILS", "name": "BASOPHILS", "unit": "%", "value_type": "NUMERIC", "low": 0.0, "high": 1.0, "text": "0 - 1 %", "is_diff": True},
        {"code": "PLATELETS", "name": "PLATELET COUNT", "unit": "lakhs/cumm", "value_type": "NUMERIC", "low": 1.5, "high": 4.5, "text": "1.5 - 4.5 lakhs/cumm", "is_diff": False},
        {"code": "RBC", "name": "RED BLOOD CELL COUNT (RBC)", "unit": "mil/cumm", "value_type": "NUMERIC", "low": 3.8, "high": 5.5, "text": "3.8 - 5.5 mil/cumm", "is_diff": False},
        {"code": "PCV", "name": "PACKED CELL VOLUME (PCV / HEMATOCRIT)", "unit": "%", "value_type": "NUMERIC", "low": 36.0, "high": 48.0, "text": "36.0 - 48.0 %", "is_diff": False},
        {"code": "MCV", "name": "MEAN CORPUSCULAR VOLUME (MCV)", "unit": "fL", "value_type": "NUMERIC", "low": 80.0, "high": 98.0, "text": "80.0 - 98.0 fL", "is_diff": False},
        {"code": "MCH", "name": "MEAN CORPUSCULAR HEMOGLOBIN (MCH)", "unit": "pg", "value_type": "NUMERIC", "low": 27.0, "high": 32.0, "text": "27.0 - 32.0 pg", "is_diff": False},
        {"code": "MCHC", "name": "MEAN CORPUSCULAR HB CONCENTRATION (MCHC)", "unit": "g/dL", "value_type": "NUMERIC", "low": 31.0, "high": 36.0, "text": "31.0 - 36.0 g/dL", "is_diff": False},
        {"code": "ESR", "name": "ERYTHROCYTE SEDIMENTATION RATE (ESR)", "unit": "mm/1hr", "value_type": "NUMERIC", "low": 0.0, "high": 20.0, "text": "0 - 20 mm/1hr", "is_diff": False}
    ],
    "HB_TC_DC_ESR": [
        {"code": "HB", "name": "HEMOGLOBIN", "unit": "g/dL", "value_type": "NUMERIC", "low": 12.0, "high": 16.0, "text": "12.0 - 16.0 g/dL", "is_diff": False},
        {"code": "WBC", "name": "TOTAL LEUCOCYTE COUNT (TLC)", "unit": "cells/cumm", "value_type": "NUMERIC", "low": 4000.0, "high": 11000.0, "text": "4000 - 11000 cells/cumm", "is_diff": False},
        {"code": "NEUTROPHILS", "name": "NEUTROPHILS", "unit": "%", "value_type": "NUMERIC", "low": 40.0, "high": 70.0, "text": "40 - 70 %", "is_diff": True},
        {"code": "LYMPHOCYTES", "name": "LYMPHOCYTES", "unit": "%", "value_type": "NUMERIC", "low": 20.0, "high": 45.0, "text": "20 - 45 %", "is_diff": True},
        {"code": "EOSINOPHILS", "name": "EOSINOPHILS", "unit": "%", "value_type": "NUMERIC", "low": 1.0, "high": 6.0, "text": "1 - 6 %", "is_diff": True},
        {"code": "MONOCYTES", "name": "MONOCYTES", "unit": "%", "value_type": "NUMERIC", "low": 2.0, "high": 8.0, "text": "2 - 8 %", "is_diff": True},
        {"code": "BASOPHILS", "name": "BASOPHILS", "unit": "%", "value_type": "NUMERIC", "low": 0.0, "high": 1.0, "text": "0 - 1 %", "is_diff": True},
        {"code": "ESR", "name": "ERYTHROCYTE SEDIMENTATION RATE (ESR)", "unit": "mm/1hr", "value_type": "NUMERIC", "low": 0.0, "high": 20.0, "text": "0 - 20 mm/1hr", "is_diff": False}
    ],
    "TC_DC": [
        {"code": "WBC", "name": "TOTAL LEUCOCYTE COUNT (TLC)", "unit": "cells/cumm", "value_type": "NUMERIC", "low": 4000.0, "high": 11000.0, "text": "4000 - 11000 cells/cumm", "is_diff": False},
        {"code": "NEUTROPHILS", "name": "NEUTROPHILS", "unit": "%", "value_type": "NUMERIC", "low": 40.0, "high": 70.0, "text": "40 - 70 %", "is_diff": True},
        {"code": "LYMPHOCYTES", "name": "LYMPHOCYTES", "unit": "%", "value_type": "NUMERIC", "low": 20.0, "high": 45.0, "text": "20 - 45 %", "is_diff": True},
        {"code": "EOSINOPHILS", "name": "EOSINOPHILS", "unit": "%", "value_type": "NUMERIC", "low": 1.0, "high": 6.0, "text": "1 - 6 %", "is_diff": True},
        {"code": "MONOCYTES", "name": "MONOCYTES", "unit": "%", "value_type": "NUMERIC", "low": 2.0, "high": 8.0, "text": "2 - 8 %", "is_diff": True},
        {"code": "BASOPHILS", "name": "BASOPHILS", "unit": "%", "value_type": "NUMERIC", "low": 0.0, "high": 1.0, "text": "0 - 1 %", "is_diff": True}
    ],
    "DC": [
        {"code": "NEUTROPHILS", "name": "NEUTROPHILS", "unit": "%", "value_type": "NUMERIC", "low": 40.0, "high": 70.0, "text": "40 - 70 %", "is_diff": True},
        {"code": "LYMPHOCYTES", "name": "LYMPHOCYTES", "unit": "%", "value_type": "NUMERIC", "low": 20.0, "high": 45.0, "text": "20 - 45 %", "is_diff": True},
        {"code": "EOSINOPHILS", "name": "EOSINOPHILS", "unit": "%", "value_type": "NUMERIC", "low": 1.0, "high": 6.0, "text": "1 - 6 %", "is_diff": True},
        {"code": "MONOCYTES", "name": "MONOCYTES", "unit": "%", "value_type": "NUMERIC", "low": 2.0, "high": 8.0, "text": "2 - 8 %", "is_diff": True},
        {"code": "BASOPHILS", "name": "BASOPHILS", "unit": "%", "value_type": "NUMERIC", "low": 0.0, "high": 1.0, "text": "0 - 1 %", "is_diff": True}
    ],
    "LFT": [
        {"code": "BIL_TOTAL", "name": "SERUM BILIRUBIN TOTAL", "unit": "mg/dL", "value_type": "NUMERIC", "low": 0.2, "high": 1.2, "text": "0.2 - 1.2 mg/dL", "is_diff": False},
        {"code": "BIL_DIRECT", "name": "SERUM BILIRUBIN DIRECT", "unit": "mg/dL", "value_type": "NUMERIC", "low": 0.0, "high": 0.3, "text": "0.0 - 0.3 mg/dL", "is_diff": False},
        {"code": "BIL_INDIRECT", "name": "SERUM BILIRUBIN INDIRECT", "unit": "mg/dL", "value_type": "NUMERIC", "low": 0.1, "high": 0.9, "text": "0.1 - 0.9 mg/dL", "is_diff": False},
        {"code": "SGOT", "name": "SGOT / AST (ASPARTATE AMINOTRANSFERASE)", "unit": "U/L", "value_type": "NUMERIC", "low": 0.0, "high": 40.0, "text": "0 - 40 U/L (Male: 0 - 40, Female: 0 - 32)", "is_diff": False},
        {"code": "SGPT", "name": "SGPT / ALT (ALANINE AMINOTRANSFERASE)", "unit": "U/L", "value_type": "NUMERIC", "low": 0.0, "high": 45.0, "text": "0 - 45 U/L (Male: 0 - 50, Female: 0 - 35)", "is_diff": False},
        {"code": "ALP", "name": "ALKALINE PHOSPHATASE (ALP)", "unit": "U/L", "value_type": "NUMERIC", "low": 30.0, "high": 120.0, "text": "30 - 120 U/L", "is_diff": False},
        {"code": "TOTAL_PROTEIN", "name": "TOTAL PROTEIN", "unit": "g/dL", "value_type": "NUMERIC", "low": 6.0, "high": 8.3, "text": "6.0 - 8.3 g/dL", "is_diff": False},
        {"code": "ALBUMIN", "name": "SERUM ALBUMIN", "unit": "g/dL", "value_type": "NUMERIC", "low": 3.5, "high": 5.0, "text": "3.5 - 5.0 g/dL", "is_diff": False},
        {"code": "GLOBULIN", "name": "SERUM GLOBULIN", "unit": "g/dL", "value_type": "NUMERIC", "low": 2.0, "high": 3.5, "text": "2.0 - 3.5 g/dL", "is_diff": False},
        {"code": "AG_RATIO", "name": "A/G RATIO", "unit": "Ratio", "value_type": "NUMERIC", "low": 1.2, "high": 2.2, "text": "1.2 - 2.2 Ratio", "is_diff": False}
    ],
    "RFT": [
        {"code": "UREA", "name": "BLOOD UREA", "unit": "mg/dL", "value_type": "NUMERIC", "low": 15.0, "high": 45.0, "text": "15.0 - 45.0 mg/dL", "is_diff": False},
        {"code": "BUN", "name": "BLOOD UREA NITROGEN (BUN)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 7.0, "high": 20.0, "text": "7.0 - 20.0 mg/dL", "is_diff": False},
        {"code": "CREATININE", "name": "SERUM CREATININE", "unit": "mg/dL", "value_type": "NUMERIC", "low": 0.6, "high": 1.2, "text": "0.6 - 1.2 mg/dL", "is_diff": False},
        {"code": "URIC_ACID", "name": "SERUM URIC ACID", "unit": "mg/dL", "value_type": "NUMERIC", "low": 3.5, "high": 7.2, "text": "3.5 - 7.2 mg/dL", "is_diff": False},
        {"code": "CALCIUM", "name": "SERUM CALCIUM", "unit": "mg/dL", "value_type": "NUMERIC", "low": 8.5, "high": 10.5, "text": "8.5 - 10.5 mg/dL", "is_diff": False},
        {"code": "PHOSPHORUS", "name": "SERUM PHOSPHORUS", "unit": "mg/dL", "value_type": "NUMERIC", "low": 2.5, "high": 4.5, "text": "2.5 - 4.5 mg/dL", "is_diff": False},
        {"code": "NA", "name": "SERUM SODIUM (Na+)", "unit": "mmol/L", "value_type": "NUMERIC", "low": 135.0, "high": 145.0, "text": "135.0 - 145.0 mmol/L", "is_diff": False},
        {"code": "K", "name": "SERUM POTASSIUM (K+)", "unit": "mmol/L", "value_type": "NUMERIC", "low": 3.5, "high": 5.0, "text": "3.5 - 5.0 mmol/L", "is_diff": False},
        {"code": "CL", "name": "SERUM CHLORIDE (Cl-)", "unit": "mmol/L", "value_type": "NUMERIC", "low": 96.0, "high": 106.0, "text": "96.0 - 106.0 mmol/L", "is_diff": False}
    ],
    "LIPID": [
        {"code": "TOTAL_CHOLESTEROL", "name": "TOTAL CHOLESTEROL", "unit": "mg/dL", "value_type": "NUMERIC", "low": 125.0, "high": 200.0, "text": "125.0 - 200.0 mg/dL (Desirable: < 200)", "is_diff": False},
        {"code": "TRIGLYCERIDES", "name": "TRIGLYCERIDES", "unit": "mg/dL", "value_type": "NUMERIC", "low": 50.0, "high": 150.0, "text": "50.0 - 150.0 mg/dL (Normal: < 150)", "is_diff": False},
        {"code": "HDL_CHOLESTEROL", "name": "HDL CHOLESTEROL (GOOD)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 40.0, "high": 60.0, "text": "40.0 - 60.0 mg/dL (Optimal: >= 40 M, >= 50 F)", "is_diff": False},
        {"code": "LDL_CHOLESTEROL", "name": "LDL CHOLESTEROL (BAD - CALCULATED)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 60.0, "high": 100.0, "text": "60.0 - 100.0 mg/dL (Optimal: < 100)", "is_diff": False},
        {"code": "VLDL_CHOLESTEROL", "name": "VLDL CHOLESTEROL (CALCULATED)", "unit": "mg/dL", "value_type": "NUMERIC", "low": 10.0, "high": 30.0, "text": "10.0 - 30.0 mg/dL", "is_diff": False},
        {"code": "TC_HDL_RATIO", "name": "TOTAL CHOLESTEROL / HDL RATIO", "unit": "Ratio", "value_type": "NUMERIC", "low": 3.0, "high": 5.0, "text": "3.0 - 5.0 Ratio", "is_diff": False}
    ],
    "S_ELECTROLYTES": [
        {"code": "NA", "name": "SERUM SODIUM (Na+)", "unit": "mmol/L", "value_type": "NUMERIC", "low": 135.0, "high": 145.0, "text": "135.0 - 145.0 mmol/L", "is_diff": False},
        {"code": "K", "name": "SERUM POTASSIUM (K+)", "unit": "mmol/L", "value_type": "NUMERIC", "low": 3.5, "high": 5.1, "text": "3.5 - 5.1 mmol/L", "is_diff": False},
        {"code": "CL", "name": "SERUM CHLORIDE (Cl-)", "unit": "mmol/L", "value_type": "NUMERIC", "low": 96.0, "high": 106.0, "text": "96.0 - 106.0 mmol/L", "is_diff": False},
        {"code": "HCO3", "name": "SERUM BICARBONATE (HCO3-)", "unit": "mmol/L", "value_type": "NUMERIC", "low": 22.0, "high": 29.0, "text": "22.0 - 29.0 mmol/L", "is_diff": False}
    ],
    "THYROID": [
        {"code": "T3", "name": "TOTAL TRIIODOTHYRONINE (T3)", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.8, "high": 2.0, "text": "0.8 - 2.0 ng/mL", "is_diff": False},
        {"code": "T4", "name": "TOTAL THYROXINE (T4)", "unit": "ug/dL", "value_type": "NUMERIC", "low": 5.0, "high": 12.0, "text": "5.0 - 12.0 ug/dL", "is_diff": False},
        {"code": "TSH", "name": "THYROID STIMULATING HORMONE (TSH)", "unit": "uIU/mL", "value_type": "NUMERIC", "low": 0.35, "high": 5.5, "text": "0.35 - 5.50 uIU/mL", "is_diff": False}
    ],
    "URINE_RE": [
        {"code": "COLOR", "name": "COLOR", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Pale Yellow", "is_diff": False},
        {"code": "APPEARANCE", "name": "APPEARANCE / TRANSPARENCY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Clear", "is_diff": False},
        {"code": "PH", "name": "REACTION / pH", "unit": "", "value_type": "NUMERIC", "low": 5.0, "high": 8.0, "text": "5.0 - 8.0", "is_diff": False},
        {"code": "SP_GRAVITY", "name": "SPECIFIC GRAVITY", "unit": "", "value_type": "NUMERIC", "low": 1.005, "high": 1.030, "text": "1.005 - 1.030", "is_diff": False},
        {"code": "SUGAR", "name": "URINE SUGAR (GLUCOSE)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil", "is_diff": False},
        {"code": "ALBUMIN", "name": "URINE ALBUMIN (PROTEIN)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil", "is_diff": False},
        {"code": "KETONE", "name": "URINE KETONE BODIES", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False},
        {"code": "BILE_SALTS", "name": "BILE SALTS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False},
        {"code": "BILE_PIGMENTS", "name": "BILE PIGMENTS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False},
        {"code": "PUS_CELLS", "name": "PUS CELLS", "unit": "/HPF", "value_type": "NUMERIC", "low": 0.0, "high": 5.0, "text": "0 - 5 /HPF", "is_diff": False},
        {"code": "RBC", "name": "RED BLOOD CELLS (RBCs)", "unit": "/HPF", "value_type": "NUMERIC", "low": 0.0, "high": 0.0, "text": "Nil /HPF", "is_diff": False},
        {"code": "EPITHELIAL", "name": "EPITHELIAL CELLS", "unit": "/HPF", "value_type": "TEXT", "low": None, "high": None, "text": "Few /HPF", "is_diff": False},
        {"code": "CASTS", "name": "CASTS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil", "is_diff": False},
        {"code": "CRYSTALS", "name": "CRYSTALS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil", "is_diff": False}
    ],
    "CUA": [
        {"code": "COLOR", "name": "COLOR", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Pale Yellow", "is_diff": False},
        {"code": "APPEARANCE", "name": "APPEARANCE / TRANSPARENCY", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Clear", "is_diff": False},
        {"code": "PH", "name": "REACTION / pH", "unit": "", "value_type": "NUMERIC", "low": 5.0, "high": 8.0, "text": "5.0 - 8.0", "is_diff": False},
        {"code": "SP_GRAVITY", "name": "SPECIFIC GRAVITY", "unit": "", "value_type": "NUMERIC", "low": 1.005, "high": 1.030, "text": "1.005 - 1.030", "is_diff": False},
        {"code": "SUGAR", "name": "URINE SUGAR (GLUCOSE)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil", "is_diff": False},
        {"code": "ALBUMIN", "name": "URINE ALBUMIN (PROTEIN)", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil", "is_diff": False},
        {"code": "KETONE", "name": "URINE KETONE BODIES", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False},
        {"code": "BILE_SALTS", "name": "BILE SALTS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False},
        {"code": "BILE_PIGMENTS", "name": "BILE PIGMENTS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Negative", "is_diff": False},
        {"code": "PUS_CELLS", "name": "PUS CELLS", "unit": "/HPF", "value_type": "NUMERIC", "low": 0.0, "high": 5.0, "text": "0 - 5 /HPF", "is_diff": False},
        {"code": "RBC", "name": "RED BLOOD CELLS (RBCs)", "unit": "/HPF", "value_type": "NUMERIC", "low": 0.0, "high": 0.0, "text": "Nil /HPF", "is_diff": False},
        {"code": "EPITHELIAL", "name": "EPITHELIAL CELLS", "unit": "/HPF", "value_type": "TEXT", "low": None, "high": None, "text": "Few /HPF", "is_diff": False},
        {"code": "CASTS", "name": "CASTS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil", "is_diff": False},
        {"code": "CRYSTALS", "name": "CRYSTALS", "unit": "", "value_type": "TEXT", "low": None, "high": None, "text": "Nil", "is_diff": False}
    ],
    "IRON_PROFILE": [
        {"code": "IRON", "name": "SERUM IRON", "unit": "ug/dL", "value_type": "NUMERIC", "low": 60.0, "high": 170.0, "text": "60 - 170 ug/dL", "is_diff": False},
        {"code": "TIBC", "name": "TOTAL IRON BINDING CAPACITY (TIBC)", "unit": "ug/dL", "value_type": "NUMERIC", "low": 240.0, "high": 450.0, "text": "240 - 450 ug/dL", "is_diff": False},
        {"code": "UIBC", "name": "UNSATURATED IRON BINDING CAPACITY (UIBC)", "unit": "ug/dL", "value_type": "NUMERIC", "low": 120.0, "high": 370.0, "text": "120 - 370 ug/dL", "is_diff": False},
        {"code": "TSAT", "name": "TRANSFERRIN SATURATION (TSAT)", "unit": "%", "value_type": "NUMERIC", "low": 20.0, "high": 50.0, "text": "20 - 50 %", "is_diff": False},
        {"code": "FERRITIN", "name": "SERUM FERRITIN", "unit": "ng/mL", "value_type": "NUMERIC", "low": 30.0, "high": 400.0, "text": "30 - 400 ng/mL (Male: 30 - 400, Female: 13 - 150)", "is_diff": False}
    ],
    "IRON_PROF_FERR": [
        {"code": "IRON", "name": "SERUM IRON", "unit": "ug/dL", "value_type": "NUMERIC", "low": 60.0, "high": 170.0, "text": "60 - 170 ug/dL", "is_diff": False},
        {"code": "TIBC", "name": "TOTAL IRON BINDING CAPACITY (TIBC)", "unit": "ug/dL", "value_type": "NUMERIC", "low": 240.0, "high": 450.0, "text": "240 - 450 ug/dL", "is_diff": False},
        {"code": "UIBC", "name": "UNSATURATED IRON BINDING CAPACITY (UIBC)", "unit": "ug/dL", "value_type": "NUMERIC", "low": 120.0, "high": 370.0, "text": "120 - 370 ug/dL", "is_diff": False},
        {"code": "TSAT", "name": "TRANSFERRIN SATURATION (TSAT)", "unit": "%", "value_type": "NUMERIC", "low": 20.0, "high": 50.0, "text": "20 - 50 %", "is_diff": False},
        {"code": "FERRITIN", "name": "SERUM FERRITIN", "unit": "ng/mL", "value_type": "NUMERIC", "low": 30.0, "high": 400.0, "text": "30 - 400 ng/mL", "is_diff": False}
    ],
    "WIDAL_SLIDE": [
        {"code": "WIDAL_O", "name": "S. TYPHI 'O'", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (< 1:80)", "is_diff": False},
        {"code": "WIDAL_H", "name": "S. TYPHI 'H'", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (< 1:80)", "is_diff": False},
        {"code": "WIDAL_AH", "name": "S. PARATYPHI 'AH'", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (< 1:80)", "is_diff": False},
        {"code": "WIDAL_BH", "name": "S. PARATYPHI 'BH'", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (< 1:80)", "is_diff": False}
    ],
    "WIDAL_TUBE": [
        {"code": "WIDAL_O", "name": "S. TYPHI 'O'", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (< 1:80)", "is_diff": False},
        {"code": "WIDAL_H", "name": "S. TYPHI 'H'", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (< 1:80)", "is_diff": False},
        {"code": "WIDAL_AH", "name": "S. PARATYPHI 'AH'", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (< 1:80)", "is_diff": False},
        {"code": "WIDAL_BH", "name": "S. PARATYPHI 'BH'", "unit": "Titre", "value_type": "TEXT", "low": None, "high": None, "text": "Negative (< 1:80)", "is_diff": False}
    ],
    "URN_CALC_24H": [
        {"code": "24H_URINE_CALCIUM", "name": "24-HOUR URINARY CALCIUM", "unit": "mg/24h", "value_type": "NUMERIC", "low": 100.0, "high": 300.0, "text": "100.0 - 300.0 mg/24h (Average diet: 100 - 300 mg/day)", "is_diff": False}
    ],
    "17_OHP_HORM": [
        {"code": "17_OHP", "name": "17-HYDROXYPROGESTERONE (17-OHP)", "unit": "ng/mL", "value_type": "NUMERIC", "low": 0.2, "high": 1.3, "text": "0.2 - 1.3 ng/mL (Follicular: 0.2 - 1.3, Luteal: 1.0 - 4.5)", "is_diff": False}
    ],
    "ACCP_HORM": [
        {"code": "ACCP", "name": "ANTI-CCP (ANTI-CYCLIC CITRULLINATED PEPTIDE)", "unit": "U/mL", "value_type": "NUMERIC", "low": 0.0, "high": 20.0, "text": "< 20.0 U/mL (Negative: < 20, Positive: >= 20)", "is_diff": False}
    ],
    "HAV_IGM": [
        {"code": "HAV_IGM", "name": "ANTI HAV IgM", "unit": "Index", "value_type": "NUMERIC", "low": 0.0, "high": 0.8, "text": "Non-Reactive (< 0.8: Non-Reactive, 0.8 - 1.0: Borderline, > 1.0: Reactive)", "is_diff": False}
    ]
}

print(f"Total clinical test definitions prepared: {len(CLINICAL_TEST_DEFINITIONS)}")
