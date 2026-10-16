# pyrefly: ignore-errors
"""
Comprehensive Clinical Test Parameters Seeder & Synchronizer for PulseLab OS
According to ThinkLab (https://vhtdc3.thinklab.solutions/) & NABL / ISO 15189 Indian Diagnostic Standards.
"""

import sqlite3
import uuid
from datetime import datetime

# Define standard demographic groups and full parameters for all diagnostic tests
# Format: 
# "TEST_CODE": [
#    (param_code, param_name, unit, value_type, ref_low, ref_high, text_ref, impossible_low, impossible_high, is_diff, critical_low, critical_high)
# ]

FULL_CLINICAL_PARAM_CATALOG = {
    # =========================================================================
    # 1. COMPLETE BLOOD COUNT & HEMATOLOGY PANELS
    # =========================================================================
    "CBC": [
        ("HB", "Hemoglobin (Hb)", "g/dL", "NUMERIC", 12.0, 16.5, "12.0 - 16.5 g/dL (M: 13.0-17.0, F: 12.0-15.0)", 2.0, 26.0, False, 7.0, 20.0),
        ("RBC", "Total RBC Count", "mill/cumm", "NUMERIC", 3.8, 5.8, "3.8 - 5.8 mill/cumm", 1.0, 9.0, False, 2.0, 7.0),
        ("PCV", "Packed Cell Volume (PCV / Hematocrit)", "%", "NUMERIC", 36.0, 50.0, "36.0 - 50.0 % (M: 40-50, F: 36-46)", 10.0, 70.0, False, 20.0, 60.0),
        ("MCV", "Mean Corpuscular Volume (MCV)", "fL", "NUMERIC", 80.0, 100.0, "80.0 - 100.0 fL", 40.0, 140.0, False, 60.0, 120.0),
        ("MCH", "Mean Corpuscular Hemoglobin (MCH)", "pg", "NUMERIC", 27.0, 32.0, "27.0 - 32.0 pg", 10.0, 55.0, False, 18.0, 40.0),
        ("MCHC", "Mean Corpuscular Hb Concentration (MCHC)", "g/dL", "NUMERIC", 32.0, 36.0, "32.0 - 36.0 g/dL", 20.0, 45.0, False, 28.0, 38.0),
        ("RDW_CV", "Red Cell Distribution Width - CV (RDW-CV)", "%", "NUMERIC", 11.5, 14.5, "11.5 - 14.5 %", 5.0, 35.0, False, None, None),
        ("RDW_SD", "Red Cell Distribution Width - SD (RDW-SD)", "fL", "NUMERIC", 39.0, 46.0, "39.0 - 46.0 fL", 20.0, 90.0, False, None, None),
        ("WBC", "Total Leucocyte Count (TLC / Total WBC)", "cells/µL", "NUMERIC", 4000.0, 11000.0, "4000 - 11000 cells/µL", 500.0, 150000.0, False, 2000.0, 30000.0),
        ("NEUT", "Neutrophils (Polymorphs)", "%", "NUMERIC", 40.0, 75.0, "40 - 75 %", 0.0, 100.0, True, 15.0, 90.0),
        ("LYMPH", "Lymphocytes", "%", "NUMERIC", 20.0, 45.0, "20 - 45 %", 0.0, 100.0, True, 10.0, 80.0),
        ("MONO", "Monocytes", "%", "NUMERIC", 2.0, 10.0, "2 - 10 %", 0.0, 35.0, True, 0.0, 15.0),
        ("EOS", "Eosinophils", "%", "NUMERIC", 1.0, 6.0, "1 - 6 %", 0.0, 60.0, True, 0.0, 20.0),
        ("BASO", "Basophils", "%", "NUMERIC", 0.0, 1.0, "0 - 1 %", 0.0, 15.0, True, 0.0, 5.0),
        ("ANC", "Absolute Neutrophil Count (ANC)", "cells/µL", "NUMERIC", 2000.0, 7000.0, "2000 - 7000 cells/µL", 100.0, 60000.0, False, 1000.0, 20000.0),
        ("ALC", "Absolute Lymphocyte Count (ALC)", "cells/µL", "NUMERIC", 1000.0, 3000.0, "1000 - 3000 cells/µL", 100.0, 40000.0, False, 500.0, 10000.0),
        ("AMC", "Absolute Monocyte Count (AMC)", "cells/µL", "NUMERIC", 200.0, 1000.0, "200 - 1000 cells/µL", 10.0, 10000.0, False, None, None),
        ("AEC", "Absolute Eosinophil Count (AEC)", "cells/µL", "NUMERIC", 40.0, 440.0, "40 - 440 cells/µL", 0.0, 8000.0, False, None, 1500.0),
        ("ABC", "Absolute Basophil Count (ABC)", "cells/µL", "NUMERIC", 0.0, 100.0, "0 - 100 cells/µL", 0.0, 2000.0, False, None, None),
        ("PLATELETS", "Platelet Count", "Lakhs/µL", "NUMERIC", 1.5, 4.5, "1.50 - 4.50 Lakhs/µL", 0.1, 20.0, False, 0.5, 10.0),
        ("MPV", "Mean Platelet Volume (MPV)", "fL", "NUMERIC", 7.5, 11.5, "7.5 - 11.5 fL", 4.0, 25.0, False, None, None),
        ("PCT", "Plateletcrit (PCT)", "%", "NUMERIC", 0.15, 0.40, "0.15 - 0.40 %", 0.01, 1.5, False, None, None),
        ("PDW", "Platelet Distribution Width (PDW)", "fL", "NUMERIC", 9.0, 17.0, "9.0 - 17.0 fL", 4.0, 30.0, False, None, None),
        ("ESR", "Erythrocyte Sedimentation Rate (ESR)", "mm/1st hr", "NUMERIC", 0.0, 20.0, "0 - 15 mm/1st hr (M), 0 - 20 mm/1st hr (F)", 0.0, 150.0, False, None, 100.0),
        ("PS_EXAM", "Peripheral Smear Examination", "", "TEXT", None, None, "Normocytic Normochromic RBCs; Normal WBC & Platelets", None, None, False, None, None)
    ],
    "CBP": "CBC",
    "HB_TC_DC_ESR": [
        ("HB", "Hemoglobin (Hb)", "g/dL", "NUMERIC", 12.0, 16.5, "12.0 - 16.5 g/dL", 2.0, 26.0, False, 7.0, 20.0),
        ("WBC", "Total Leucocyte Count (TLC)", "cells/µL", "NUMERIC", 4000.0, 11000.0, "4000 - 11000 cells/µL", 500.0, 150000.0, False, 2000.0, 30000.0),
        ("NEUT", "Neutrophils (Polymorphs)", "%", "NUMERIC", 40.0, 75.0, "40 - 75 %", 0.0, 100.0, True, 15.0, 90.0),
        ("LYMPH", "Lymphocytes", "%", "NUMERIC", 20.0, 45.0, "20 - 45 %", 0.0, 100.0, True, 10.0, 80.0),
        ("MONO", "Monocytes", "%", "NUMERIC", 2.0, 10.0, "2 - 10 %", 0.0, 35.0, True, 0.0, 15.0),
        ("EOS", "Eosinophils", "%", "NUMERIC", 1.0, 6.0, "1 - 6 %", 0.0, 60.0, True, 0.0, 20.0),
        ("BASO", "Basophils", "%", "NUMERIC", 0.0, 1.0, "0 - 1 %", 0.0, 15.0, True, 0.0, 5.0),
        ("ESR", "Erythrocyte Sedimentation Rate (ESR)", "mm/1st hr", "NUMERIC", 0.0, 20.0, "0 - 20 mm/1st hr", 0.0, 150.0, False, None, 100.0)
    ],
    "TC_DC": [
        ("WBC", "Total Leucocyte Count (TLC)", "cells/µL", "NUMERIC", 4000.0, 11000.0, "4000 - 11000 cells/µL", 500.0, 150000.0, False, 2000.0, 30000.0),
        ("NEUT", "Neutrophils (Polymorphs)", "%", "NUMERIC", 40.0, 75.0, "40 - 75 %", 0.0, 100.0, True, 15.0, 90.0),
        ("LYMPH", "Lymphocytes", "%", "NUMERIC", 20.0, 45.0, "20 - 45 %", 0.0, 100.0, True, 10.0, 80.0),
        ("MONO", "Monocytes", "%", "NUMERIC", 2.0, 10.0, "2 - 10 %", 0.0, 35.0, True, 0.0, 15.0),
        ("EOS", "Eosinophils", "%", "NUMERIC", 1.0, 6.0, "1 - 6 %", 0.0, 60.0, True, 0.0, 20.0),
        ("BASO", "Basophils", "%", "NUMERIC", 0.0, 1.0, "0 - 1 %", 0.0, 15.0, True, 0.0, 5.0)
    ],
    "DC": [
        ("NEUT", "Neutrophils (Polymorphs)", "%", "NUMERIC", 40.0, 75.0, "40 - 75 %", 0.0, 100.0, True, 15.0, 90.0),
        ("LYMPH", "Lymphocytes", "%", "NUMERIC", 20.0, 45.0, "20 - 45 %", 0.0, 100.0, True, 10.0, 80.0),
        ("MONO", "Monocytes", "%", "NUMERIC", 2.0, 10.0, "2 - 10 %", 0.0, 35.0, True, 0.0, 15.0),
        ("EOS", "Eosinophils", "%", "NUMERIC", 1.0, 6.0, "1 - 6 %", 0.0, 60.0, True, 0.0, 20.0),
        ("BASO", "Basophils", "%", "NUMERIC", 0.0, 1.0, "0 - 1 %", 0.0, 15.0, True, 0.0, 5.0)
    ],

    # =========================================================================
    # 2. COMPLETE URINE ANALYSIS & CLINICAL PATHOLOGY
    # =========================================================================
    "CUA": [
        # Physical
        ("COLOR", "Colour", "", "TEXT", None, None, "Pale Yellow", None, None, False, None, None),
        ("APPEARANCE", "Appearance / Transparency", "", "TEXT", None, None, "Clear", None, None, False, None, None),
        ("SP_GRAVITY", "Specific Gravity", "", "NUMERIC", 1.005, 1.030, "1.005 - 1.030", 1.000, 1.060, False, None, None),
        ("PH", "Reaction (pH)", "", "NUMERIC", 5.0, 7.5, "5.0 - 7.5", 3.0, 10.0, False, None, None),
        ("SEDIMENT", "Deposit / Sediment", "", "TEXT", None, None, "Nil / Absent", None, None, False, None, None),
        # Chemical
        ("SUGAR", "Urine Glucose / Sugar", "", "TEXT", None, None, "Nil / Negative", None, None, False, None, None),
        ("ALBUMIN", "Urine Protein / Albumin", "", "TEXT", None, None, "Nil / Negative", None, None, False, None, None),
        ("KETONE", "Ketone Bodies (Acetone)", "", "TEXT", None, None, "Absent / Negative", None, None, False, None, None),
        ("BILE_SALTS", "Bile Salts (Hay's Test)", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("BILE_PIGMENTS", "Bile Pigments (Fouchet's Test)", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("UROBILINOGEN", "Urobilinogen", "", "TEXT", None, None, "Normal (0.1 - 1.0 mg/dL)", None, None, False, None, None),
        ("NITRITE", "Nitrite", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("OCCULT_BLOOD", "Blood / Hemoglobin", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("LEUCOCYTE_EST", "Leucocyte Esterase", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        # Microscopic
        ("PUS_CELLS", "Pus Cells (Leucocytes)", "/HPF", "NUMERIC", 0.0, 5.0, "0 - 5 /HPF", 0.0, 200.0, False, None, 50.0),
        ("RBC", "Red Blood Cells (RBCs)", "/HPF", "NUMERIC", 0.0, 2.0, "0 - 2 /HPF", 0.0, 200.0, False, None, 20.0),
        ("EPITHELIAL", "Epithelial Cells", "/HPF", "TEXT", None, None, "1 - 4 (Few /HPF)", None, None, False, None, None),
        ("CASTS", "Casts (Hyaline / Granular)", "/LPF", "TEXT", None, None, "Nil / Absent", None, None, False, None, None),
        ("CRYSTALS", "Crystals", "/HPF", "TEXT", None, None, "Nil / Absent", None, None, False, None, None),
        ("BACTERIA", "Bacteria", "/HPF", "TEXT", None, None, "Nil / Absent", None, None, False, None, None),
        ("MUCUS", "Mucus Threads", "", "TEXT", None, None, "Nil / Absent", None, None, False, None, None),
        ("YEAST", "Yeast Cells", "", "TEXT", None, None, "Nil / Absent", None, None, False, None, None),
        ("AMORPHOUS", "Amorphous Deposit", "", "TEXT", None, None, "Nil / Absent", None, None, False, None, None)
    ],
    "URINE_RE": "CUA",
    "URN_MICROSCOPY": [
        ("PUS_CELLS", "Pus Cells (Leucocytes)", "/HPF", "NUMERIC", 0.0, 5.0, "0 - 5 /HPF", 0.0, 200.0, False, None, 50.0),
        ("RBC", "Red Blood Cells (RBCs)", "/HPF", "NUMERIC", 0.0, 2.0, "0 - 2 /HPF", 0.0, 200.0, False, None, 20.0),
        ("EPITHELIAL", "Epithelial Cells", "/HPF", "TEXT", None, None, "1 - 4 (Few /HPF)", None, None, False, None, None),
        ("CASTS", "Casts", "/LPF", "TEXT", None, None, "Nil / Absent", None, None, False, None, None),
        ("CRYSTALS", "Crystals", "/HPF", "TEXT", None, None, "Nil / Absent", None, None, False, None, None),
        ("BACTERIA", "Bacteria", "/HPF", "TEXT", None, None, "Nil / Absent", None, None, False, None, None)
    ],

    # =========================================================================
    # 3. LIVER FUNCTION TEST (LFT) & BIOCHEMISTRY PANELS
    # =========================================================================
    "LFT": [
        ("BIL_TOTAL", "Bilirubin - Total", "mg/dL", "NUMERIC", 0.2, 1.2, "0.2 - 1.2 mg/dL", 0.0, 35.0, False, None, 15.0),
        ("BIL_DIRECT", "Bilirubin - Direct (Conjugated)", "mg/dL", "NUMERIC", 0.0, 0.3, "0.0 - 0.3 mg/dL", 0.0, 25.0, False, None, 5.0),
        ("BIL_INDIRECT", "Bilirubin - Indirect (Unconjugated)", "mg/dL", "NUMERIC", 0.1, 0.9, "0.1 - 0.9 mg/dL", 0.0, 25.0, False, None, None),
        ("SGOT", "SGOT / AST (Aspartate Aminotransferase)", "U/L", "NUMERIC", 10.0, 40.0, "10 - 40 U/L", 1.0, 5000.0, False, None, 500.0),
        ("SGPT", "SGPT / ALT (Alanine Aminotransferase)", "U/L", "NUMERIC", 10.0, 45.0, "10 - 45 U/L", 1.0, 5000.0, False, None, 500.0),
        ("AST_ALT_RATIO", "SGOT / SGPT (AST/ALT) Ratio", "Ratio", "NUMERIC", 0.8, 1.5, "0.8 - 1.5 Ratio", 0.1, 10.0, False, None, None),
        ("ALP", "Alkaline Phosphatase (ALP)", "U/L", "NUMERIC", 38.0, 126.0, "38 - 126 U/L (Adults)", 5.0, 3000.0, False, None, 500.0),
        ("GGT", "Gamma Glutamyl Transferase (GGT)", "U/L", "NUMERIC", 9.0, 48.0, "9 - 48 U/L (M: 9-48, F: 9-36)", 1.0, 1500.0, False, None, None),
        ("TOTAL_PROTEIN", "Total Protein", "g/dL", "NUMERIC", 6.0, 8.3, "6.0 - 8.3 g/dL", 2.0, 16.0, False, 4.5, 10.0),
        ("ALBUMIN", "Serum Albumin", "g/dL", "NUMERIC", 3.5, 5.0, "3.5 - 5.0 g/dL", 1.0, 8.0, False, 2.0, 6.0),
        ("GLOBULIN", "Serum Globulin", "g/dL", "NUMERIC", 2.0, 3.5, "2.0 - 3.5 g/dL", 0.5, 9.0, False, None, None),
        ("AG_RATIO", "Albumin / Globulin (A/G) Ratio", "Ratio", "NUMERIC", 1.2, 2.2, "1.2 - 2.2 Ratio", 0.2, 5.0, False, None, None),
        ("LDH", "Lactate Dehydrogenase (LDH)", "U/L", "NUMERIC", 140.0, 280.0, "140 - 280 U/L", 20.0, 3000.0, False, None, None)
    ],
    "S_BILIRUBIN": [
        ("BIL_TOTAL", "Bilirubin - Total", "mg/dL", "NUMERIC", 0.2, 1.2, "0.2 - 1.2 mg/dL", 0.0, 35.0, False, None, 15.0),
        ("BIL_DIRECT", "Bilirubin - Direct (Conjugated)", "mg/dL", "NUMERIC", 0.0, 0.3, "0.0 - 0.3 mg/dL", 0.0, 25.0, False, None, 5.0),
        ("BIL_INDIRECT", "Bilirubin - Indirect (Unconjugated)", "mg/dL", "NUMERIC", 0.1, 0.9, "0.1 - 0.9 mg/dL", 0.0, 25.0, False, None, None)
    ],

    # =========================================================================
    # 4. RENAL / KIDNEY FUNCTION TEST (RFT / KFT)
    # =========================================================================
    "RFT": [
        ("UREA", "Blood Urea", "mg/dL", "NUMERIC", 15.0, 45.0, "15.0 - 45.0 mg/dL", 2.0, 400.0, False, None, 100.0),
        ("BUN", "Blood Urea Nitrogen (BUN)", "mg/dL", "NUMERIC", 7.0, 20.0, "7.0 - 20.0 mg/dL", 1.0, 200.0, False, None, 60.0),
        ("CREATININE", "Serum Creatinine", "mg/dL", "NUMERIC", 0.6, 1.2, "0.6 - 1.2 mg/dL (M: 0.7-1.3, F: 0.5-1.1)", 0.1, 30.0, False, None, 5.0),
        ("BUN_CREAT_RATIO", "BUN / Creatinine Ratio", "Ratio", "NUMERIC", 10.0, 20.0, "10.0 - 20.0 Ratio", 1.0, 60.0, False, None, None),
        ("UREA_CREAT_RATIO", "Urea / Creatinine Ratio", "Ratio", "NUMERIC", 20.0, 35.0, "20.0 - 35.0 Ratio", 2.0, 100.0, False, None, None),
        ("URIC_ACID", "Serum Uric Acid", "mg/dL", "NUMERIC", 3.5, 7.2, "3.5 - 7.2 mg/dL (M: 3.5-7.2, F: 2.6-6.0)", 0.5, 25.0, False, None, 12.0),
        ("CALCIUM", "Serum Calcium", "mg/dL", "NUMERIC", 8.5, 10.5, "8.5 - 10.5 mg/dL", 3.0, 20.0, False, 6.5, 13.0),
        ("PHOSPHORUS", "Serum Phosphorus (Inorganic)", "mg/dL", "NUMERIC", 2.5, 4.5, "2.5 - 4.5 mg/dL", 0.5, 18.0, False, 1.0, 8.0),
        ("NA", "Serum Sodium (Na+)", "mmol/L", "NUMERIC", 135.0, 145.0, "135.0 - 145.0 mmol/L", 90.0, 180.0, False, 120.0, 160.0),
        ("K", "Serum Potassium (K+)", "mmol/L", "NUMERIC", 3.5, 5.1, "3.5 - 5.1 mmol/L", 1.0, 12.0, False, 2.8, 6.5),
        ("CL", "Serum Chloride (Cl-)", "mmol/L", "NUMERIC", 96.0, 106.0, "96.0 - 106.0 mmol/L", 60.0, 140.0, False, 80.0, 125.0),
        ("HCO3", "Serum Bicarbonate (HCO3-)", "mmol/L", "NUMERIC", 22.0, 29.0, "22.0 - 29.0 mmol/L", 5.0, 60.0, False, 10.0, 40.0),
        ("EGFR", "Estimated GFR (eGFR - CKD-EPI)", "mL/min/1.73m2", "NUMERIC", 90.0, 120.0, ">= 90 mL/min/1.73m2 (Normal)", 5.0, 160.0, False, 15.0, None)
    ],

    # =========================================================================
    # 5. LIPID PROFILE PANELS
    # =========================================================================
    "LIPID": [
        ("TOTAL_CHOLESTEROL", "Total Cholesterol", "mg/dL", "NUMERIC", 125.0, 200.0, "< 200 mg/dL (Desirable)", 20.0, 800.0, False, None, 300.0),
        ("TRIGLYCERIDES", "Triglycerides", "mg/dL", "NUMERIC", 50.0, 150.0, "< 150 mg/dL (Normal)", 10.0, 2000.0, False, None, 500.0),
        ("HDL_CHOLESTEROL", "HDL Cholesterol (Good Cholesterol)", "mg/dL", "NUMERIC", 40.0, 60.0, "40.0 - 60.0 mg/dL (M: >40, F: >50)", 5.0, 150.0, False, 25.0, None),
        ("LDL_CHOLESTEROL", "LDL Cholesterol (Bad Cholesterol - Calc)", "mg/dL", "NUMERIC", 60.0, 100.0, "< 100 mg/dL (Optimal)", 10.0, 500.0, False, None, 190.0),
        ("VLDL_CHOLESTEROL", "VLDL Cholesterol (Calculated)", "mg/dL", "NUMERIC", 10.0, 30.0, "10.0 - 30.0 mg/dL", 2.0, 200.0, False, None, None),
        ("NON_HDL", "Non-HDL Cholesterol", "mg/dL", "NUMERIC", 80.0, 130.0, "< 130 mg/dL (Desirable)", 15.0, 600.0, False, None, None),
        ("TC_HDL_RATIO", "Total Cholesterol / HDL Ratio", "Ratio", "NUMERIC", 3.0, 5.0, "3.0 - 5.0 Ratio", 0.5, 20.0, False, None, None),
        ("LDL_HDL_RATIO", "LDL / HDL Ratio", "Ratio", "NUMERIC", 1.5, 3.3, "1.5 - 3.3 Ratio", 0.2, 15.0, False, None, None),
        ("TRIG_HDL_RATIO", "Triglycerides / HDL Ratio", "Ratio", "NUMERIC", 1.0, 3.0, "< 3.0 (Low Atherogenic Risk)", 0.1, 30.0, False, None, None)
    ],
    "LIPID_41": "LIPID",

    # =========================================================================
    # 6. THYROID PROFILE PANELS
    # =========================================================================
    "THYROID": [
        ("T3", "Total Triiodothyronine (T3)", "ng/mL", "NUMERIC", 0.80, 2.00, "0.80 - 2.00 ng/mL", 0.1, 10.0, False, None, None),
        ("T4", "Total Thyroxine (T4)", "µg/dL", "NUMERIC", 5.10, 12.00, "5.10 - 12.00 µg/dL", 0.5, 30.0, False, None, None),
        ("TSH", "Thyroid Stimulating Hormone (TSH)", "µIU/mL", "NUMERIC", 0.35, 5.50, "0.35 - 5.50 µIU/mL", 0.005, 150.0, False, 0.05, 20.0),
        ("FT3", "Free Triiodothyronine (FT3)", "pg/mL", "NUMERIC", 2.30, 4.20, "2.30 - 4.20 pg/mL", 0.5, 20.0, False, None, None),
        ("FT4", "Free Thyroxine (FT4)", "ng/dL", "NUMERIC", 0.89, 1.76, "0.89 - 1.76 ng/dL", 0.1, 10.0, False, None, None)
    ],

    # =========================================================================
    # 7. ELECTROLYTES
    # =========================================================================
    "S_ELECTROLYTES": [
        ("NA", "Serum Sodium (Na+)", "mmol/L", "NUMERIC", 135.0, 145.0, "135.0 - 145.0 mmol/L", 90.0, 180.0, False, 120.0, 160.0),
        ("K", "Serum Potassium (K+)", "mmol/L", "NUMERIC", 3.5, 5.1, "3.5 - 5.1 mmol/L", 1.0, 12.0, False, 2.8, 6.5),
        ("CL", "Serum Chloride (Cl-)", "mmol/L", "NUMERIC", 96.0, 106.0, "96.0 - 106.0 mmol/L", 60.0, 140.0, False, 80.0, 125.0),
        ("HCO3", "Serum Bicarbonate (HCO3-)", "mmol/L", "NUMERIC", 22.0, 29.0, "22.0 - 29.0 mmol/L", 5.0, 60.0, False, 10.0, 40.0),
        ("ANION_GAP", "Anion Gap", "mmol/L", "NUMERIC", 8.0, 16.0, "8.0 - 16.0 mmol/L", 1.0, 40.0, False, None, None)
    ],

    # =========================================================================
    # 8. IRON PROFILE & ANEMIA PANELS
    # =========================================================================
    "IRON_PROFILE": [
        ("IRON", "Serum Iron", "µg/dL", "NUMERIC", 60.0, 170.0, "60.0 - 170.0 µg/dL (M: 65-175, F: 50-170)", 5.0, 800.0, False, None, None),
        ("TIBC", "Total Iron Binding Capacity (TIBC)", "µg/dL", "NUMERIC", 240.0, 450.0, "240.0 - 450.0 µg/dL", 50.0, 1000.0, False, None, None),
        ("UIBC", "Unsaturated Iron Binding Capacity (UIBC)", "µg/dL", "NUMERIC", 110.0, 370.0, "110.0 - 370.0 µg/dL", 20.0, 800.0, False, None, None),
        ("TSAT", "Transferrin Saturation (TSAT)", "%", "NUMERIC", 20.0, 50.0, "20.0 - 50.0 %", 1.0, 100.0, False, 10.0, None),
        ("FERRITIN", "Serum Ferritin", "ng/mL", "NUMERIC", 30.0, 400.0, "30.0 - 400.0 ng/mL (M: 30-400, F: 15-150)", 1.0, 5000.0, False, 10.0, 1000.0),
        ("TRANSFERRIN", "Serum Transferrin", "mg/dL", "NUMERIC", 200.0, 360.0, "200.0 - 360.0 mg/dL", 30.0, 800.0, False, None, None)
    ],
    "IRON_PROF_FERR": "IRON_PROFILE",
    "IRON_TIBC": [
        ("IRON", "Serum Iron", "µg/dL", "NUMERIC", 60.0, 170.0, "60.0 - 170.0 µg/dL", 5.0, 800.0, False, None, None),
        ("TIBC", "Total Iron Binding Capacity (TIBC)", "µg/dL", "NUMERIC", 240.0, 450.0, "240.0 - 450.0 µg/dL", 50.0, 1000.0, False, None, None),
        ("UIBC", "Unsaturated Iron Binding Capacity (UIBC)", "µg/dL", "NUMERIC", 110.0, 370.0, "110.0 - 370.0 µg/dL", 20.0, 800.0, False, None, None),
        ("TSAT", "Transferrin Saturation (TSAT)", "%", "NUMERIC", 20.0, 50.0, "20.0 - 50.0 %", 1.0, 100.0, False, None, None)
    ],

    # =========================================================================
    # 9. SEMEN ANALYSIS (WHO 6th Edition Standard)
    # =========================================================================
    "SEMEN_ANALYSIS": [
        ("ABSTINENCE", "Period of Abstinence", "days", "NUMERIC", 3.0, 5.0, "3 - 5 days", 1.0, 30.0, False, None, None),
        ("LIQUEFACTION", "Liquefaction Time", "mins", "NUMERIC", 15.0, 60.0, "15 - 60 minutes", 5.0, 180.0, False, None, None),
        ("APPEARANCE", "Appearance / Colour", "", "TEXT", None, None, "Greyish-white / Opalescent", None, None, False, None, None),
        ("VISCOSITY", "Viscosity / Consistency", "", "TEXT", None, None, "Normal (Drop by drop)", None, None, False, None, None),
        ("VOLUME", "Volume of Ejaculate", "mL", "NUMERIC", 1.5, 6.0, ">= 1.5 mL (1.5 - 6.0 mL)", 0.1, 15.0, False, None, None),
        ("PH", "Reaction (pH)", "", "NUMERIC", 7.2, 8.0, "7.2 - 8.0", 5.0, 10.0, False, None, None),
        ("SPERM_COUNT", "Sperm Concentration", "Million/mL", "NUMERIC", 15.0, 200.0, ">= 15.0 Million/mL", 0.0, 500.0, False, None, None),
        ("TOTAL_SPERM", "Total Sperm Count per Ejaculate", "Million/ejaculate", "NUMERIC", 39.0, 500.0, ">= 39.0 Million", 0.0, 1500.0, False, None, None),
        ("RAPID_MOTILITY", "Rapid Progressive Motility (Grade a)", "%", "NUMERIC", 25.0, 100.0, ">= 25 %", 0.0, 100.0, False, None, None),
        ("SLOW_MOTILITY", "Slow Progressive Motility (Grade b)", "%", "NUMERIC", 7.0, 50.0, "7 - 50 %", 0.0, 100.0, False, None, None),
        ("PROG_MOTILITY", "Total Progressive Motility (PR = a+b)", "%", "NUMERIC", 32.0, 100.0, ">= 32 %", 0.0, 100.0, False, None, None),
        ("NON_PROG_MOTILITY", "Non-Progressive Motility (NP = Grade c)", "%", "NUMERIC", 1.0, 20.0, "1 - 20 %", 0.0, 100.0, False, None, None),
        ("IMMOTILE", "Immotile Sperms (Grade d)", "%", "NUMERIC", 0.0, 40.0, "< 40 %", 0.0, 100.0, False, None, None),
        ("TOTAL_MOTILITY", "Total Motility (PR + NP)", "%", "NUMERIC", 40.0, 100.0, ">= 40 %", 0.0, 100.0, False, None, None),
        ("VITALITY", "Vitality / Viability (Eosin-Nigrosin)", "%", "NUMERIC", 58.0, 100.0, ">= 58 % viable", 0.0, 100.0, False, None, None),
        ("NORMAL_MORPH", "Normal Sperm Morphology Forms", "%", "NUMERIC", 4.0, 100.0, ">= 4 % normal forms", 0.0, 100.0, False, None, None),
        ("HEAD_DEFECTS", "Head Defects", "%", "NUMERIC", 0.0, 45.0, "< 45 %", 0.0, 100.0, False, None, None),
        ("NECK_DEFECTS", "Neck / Midpiece Defects", "%", "NUMERIC", 0.0, 30.0, "< 30 %", 0.0, 100.0, False, None, None),
        ("TAIL_DEFECTS", "Tail Defects", "%", "NUMERIC", 0.0, 25.0, "< 25 %", 0.0, 100.0, False, None, None),
        ("PUS_CELLS", "Pus Cells (Leucocytes)", "/HPF", "NUMERIC", 0.0, 4.0, "0 - 4 /HPF (< 1 Mill/mL)", 0.0, 100.0, False, None, None),
        ("RBC", "Red Blood Cells (RBCs)", "/HPF", "NUMERIC", 0.0, 0.0, "Nil / Absent", 0.0, 100.0, False, None, None),
        ("EPITHELIAL", "Epithelial Cells", "/HPF", "TEXT", None, None, "Occasional", None, None, False, None, None),
        ("AGGLUTINATION", "Sperm Agglutination", "", "TEXT", None, None, "Nil / Absent", None, None, False, None, None)
    ],

    # =========================================================================
    # 10. STOOL EXAMINATION (Routine & Microscopy)
    # =========================================================================
    "STOOL_ANALYSIS": [
        ("COLOR", "Colour", "", "TEXT", None, None, "Brownish / Yellowish-brown", None, None, False, None, None),
        ("CONSISTENCY", "Consistency", "", "TEXT", None, None, "Formed / Soft", None, None, False, None, None),
        ("MUCUS", "Mucus", "", "TEXT", None, None, "Absent / Nil", None, None, False, None, None),
        ("BLOOD_GROSS", "Blood (Gross)", "", "TEXT", None, None, "Absent / Nil", None, None, False, None, None),
        ("PH", "Reaction (pH)", "", "NUMERIC", 6.5, 7.5, "6.5 - 7.5", 4.0, 10.0, False, None, None),
        ("OCCULT_BLOOD", "Occult Blood", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("RED_SUB", "Reducing Substances", "", "TEXT", None, None, "Negative (< 0.25%)", None, None, False, None, None),
        ("PUS_CELLS", "Pus Cells (WBC)", "/HPF", "NUMERIC", 0.0, 2.0, "0 - 2 /HPF", 0.0, 100.0, False, None, None),
        ("RBC", "Red Blood Cells (RBC)", "/HPF", "NUMERIC", 0.0, 1.0, "0 - 1 /HPF", 0.0, 100.0, False, None, None),
        ("EPITHELIAL", "Epithelial Cells", "/HPF", "TEXT", None, None, "Few / Absent", None, None, False, None, None),
        ("MACROPHAGES", "Macrophages", "/HPF", "TEXT", None, None, "Absent", None, None, False, None, None),
        ("OVA", "Helminthic Ova", "", "TEXT", None, None, "Not Found / Nil", None, None, False, None, None),
        ("CYSTS", "Protozoal Cysts (E. histolytica / Giardia)", "", "TEXT", None, None, "Not Found / Nil", None, None, False, None, None),
        ("TROPHOZOITES", "Protozoal Trophozoites", "", "TEXT", None, None, "Not Found / Nil", None, None, False, None, None),
        ("VEG_MATTER", "Vegetable Matter / Undigested Particles", "", "TEXT", None, None, "Few / Present", None, None, False, None, None),
        ("FAT_GLOBULES", "Fat Globules (Sudan III)", "", "TEXT", None, None, "Absent / Nil", None, None, False, None, None),
        ("YEAST", "Yeast Cells / Fungal Elements", "", "TEXT", None, None, "Absent / Nil", None, None, False, None, None)
    ],
    "STOOL_OVA_CYST": [
        ("OVA", "Helminthic Ova", "", "TEXT", None, None, "Not Found / Nil", None, None, False, None, None),
        ("CYSTS", "Protozoal Cysts (E. histolytica / Giardia)", "", "TEXT", None, None, "Not Found / Nil", None, None, False, None, None),
        ("TROPHOZOITES", "Protozoal Trophozoites", "", "TEXT", None, None, "Not Found / Nil", None, None, False, None, None),
        ("PUS_CELLS", "Pus Cells (WBC)", "/HPF", "NUMERIC", 0.0, 2.0, "0 - 2 /HPF", 0.0, 100.0, False, None, None),
        ("RBC", "Red Blood Cells (RBC)", "/HPF", "NUMERIC", 0.0, 1.0, "0 - 1 /HPF", 0.0, 100.0, False, None, None)
    ],

    # =========================================================================
    # 11. COAGULATION & HEMOSTASIS
    # =========================================================================
    "PT_INR": [
        ("PT_PATIENT", "Prothrombin Time (Patient)", "seconds", "NUMERIC", 11.0, 15.0, "11.0 - 15.0 seconds", 5.0, 120.0, False, None, 30.0),
        ("PT_CONTROL", "Prothrombin Time (Control)", "seconds", "NUMERIC", 11.0, 13.0, "11.0 - 13.0 seconds", 8.0, 20.0, False, None, None),
        ("PT_INDEX", "Prothrombin Index", "%", "NUMERIC", 80.0, 120.0, "80.0 - 120.0 %", 10.0, 200.0, False, None, None),
        ("INR", "International Normalized Ratio (INR)", "Ratio", "NUMERIC", 0.85, 1.15, "0.85 - 1.15 (Therapeutic range: 2.0 - 3.0)", 0.5, 15.0, False, None, 4.5),
        ("ISI", "International Sensitivity Index (ISI)", "Ratio", "NUMERIC", 1.0, 1.2, "1.0 - 1.2", 0.8, 1.5, False, None, None)
    ],
    "APTT": [
        ("APTT_PATIENT", "APTT (Patient)", "seconds", "NUMERIC", 26.0, 38.0, "26.0 - 38.0 seconds", 10.0, 180.0, False, None, 70.0),
        ("APTT_CONTROL", "APTT (Control)", "seconds", "NUMERIC", 28.0, 32.0, "28.0 - 32.0 seconds", 15.0, 45.0, False, None, None),
        ("APTT_RATIO", "APTT Ratio", "Ratio", "NUMERIC", 0.8, 1.2, "0.80 - 1.20 Ratio", 0.3, 5.0, False, None, None)
    ],
    "BT_CT_COMBO": [
        ("BT", "Bleeding Time (BT - Duke's Method)", "min:sec", "TEXT", None, None, "2:00 - 7:00 mins", None, None, False, None, None),
        ("CT", "Clotting Time (CT - Capillary Tube)", "min:sec", "TEXT", None, None, "4:00 - 10:00 mins", None, None, False, None, None)
    ],
    "BT": [
        ("BT", "Bleeding Time (BT - Duke's Method)", "min:sec", "TEXT", None, None, "2:00 - 7:00 mins", None, None, False, None, None)
    ],
    "CT": [
        ("CT", "Clotting Time (CT - Capillary Tube)", "min:sec", "TEXT", None, None, "4:00 - 10:00 mins", None, None, False, None, None)
    ],
    "FIBRINOGEN": [
        ("FIBRINOGEN", "Plasma Fibrinogen", "mg/dL", "NUMERIC", 200.0, 400.0, "200.0 - 400.0 mg/dL", 30.0, 1200.0, False, 100.0, 700.0)
    ],
    "D_DIMER": [
        ("D_DIMER", "D-Dimer (Quantitative)", "ng/mL FEU", "NUMERIC", 0.0, 500.0, "< 500.0 ng/mL FEU", 0.0, 10000.0, False, None, 1000.0)
    ],
    "RETIC_COUNT": [
        ("RETIC", "Reticulocyte Count", "%", "NUMERIC", 0.5, 2.5, "0.5 - 2.5 %", 0.0, 30.0, False, None, None),
        ("ABS_RETIC", "Absolute Reticulocyte Count", "cells/µL", "NUMERIC", 25000.0, 85000.0, "25000 - 85000 cells/µL", 0.0, 500000.0, False, None, None),
        ("CORR_RETIC", "Corrected Reticulocyte Count (CRC)", "%", "NUMERIC", 0.5, 2.5, "0.5 - 2.5 %", 0.0, 30.0, False, None, None),
        ("RPI", "Reticulocyte Production Index (RPI)", "Index", "NUMERIC", 1.0, 2.0, "1.0 - 2.0 Index", 0.1, 10.0, False, None, None)
    ],

    # =========================================================================
    # 12. DIABETIC PROFILE & GLUCOSE TESTS
    # =========================================================================
    "HBA1C": [
        ("HBA1C", "HbA1c (Glycated Hemoglobin)", "%", "NUMERIC", 4.0, 5.6, "Normal: 4.0-5.6 % | Pre-diabetes: 5.7-6.4 % | Diabetes: >= 6.5 %", 2.0, 22.0, False, None, 10.0),
        ("EAG", "Estimated Average Glucose (eAG)", "mg/dL", "NUMERIC", 70.0, 115.0, "70.0 - 115.0 mg/dL", 30.0, 600.0, False, None, None),
        ("MBG", "Mean Blood Glucose", "mg/dL", "NUMERIC", 70.0, 120.0, "70.0 - 120.0 mg/dL", 30.0, 600.0, False, None, None)
    ],
    "DIABETES_SCREEN_URN": [
        ("URN_GLUCOSE", "Urinary Glucose / Sugar", "", "TEXT", None, None, "Nil / Negative", None, None, False, None, None),
        ("URN_KETONES", "Urinary Ketones (Acetone)", "", "TEXT", None, None, "Absent / Negative", None, None, False, None, None),
        ("URN_MICROALB", "Urinary Microalbumin", "mg/L", "NUMERIC", 0.0, 20.0, "< 20.0 mg/L", 0.0, 500.0, False, None, None),
        ("URN_CREAT", "Urinary Creatinine", "mg/dL", "NUMERIC", 30.0, 300.0, "30.0 - 300.0 mg/dL", 5.0, 1000.0, False, None, None),
        ("UACR", "Albumin / Creatinine Ratio (UACR)", "mg/g", "NUMERIC", 0.0, 30.0, "< 30.0 mg/g (Normal) | 30-300 (Microalbuminuria)", 0.0, 2000.0, False, None, None)
    ],
    "GTT": [
        ("FBS", "Fasting Blood Glucose", "mg/dL", "NUMERIC", 70.0, 100.0, "70.0 - 100.0 mg/dL", 20.0, 600.0, False, 50.0, 300.0),
        ("GTT_30", "30 Minutes Blood Glucose", "mg/dL", "NUMERIC", 110.0, 160.0, "110.0 - 160.0 mg/dL", 20.0, 600.0, False, None, None),
        ("GTT_60", "60 Minutes (1 Hr) Blood Glucose", "mg/dL", "NUMERIC", 120.0, 170.0, "120.0 - 170.0 mg/dL", 20.0, 600.0, False, None, None),
        ("GTT_90", "90 Minutes Blood Glucose", "mg/dL", "NUMERIC", 100.0, 150.0, "100.0 - 150.0 mg/dL", 20.0, 600.0, False, None, None),
        ("GTT_120", "120 Minutes (2 Hrs) Blood Glucose", "mg/dL", "NUMERIC", 70.0, 140.0, "70.0 - 140.0 mg/dL (< 140 Normal, 140-199 Impaired, >=200 Diabetic)", 20.0, 600.0, False, None, None),
        ("URN_SUGAR_F", "Urine Sugar (Fasting)", "", "TEXT", None, None, "Nil", None, None, False, None, None),
        ("URN_SUGAR_1H", "Urine Sugar (1 Hour)", "", "TEXT", None, None, "Nil", None, None, False, None, None),
        ("URN_SUGAR_2H", "Urine Sugar (2 Hours)", "", "TEXT", None, None, "Nil", None, None, False, None, None)
    ],
    "GCT": [
        ("GCT_GLUCOSE", "1 Hour Glucose Challenge Test (50g)", "mg/dL", "NUMERIC", 70.0, 140.0, "< 140.0 mg/dL (Normal screening threshold)", 20.0, 600.0, False, None, None)
    ],

    # =========================================================================
    # 13. WIDAL & SEROLOGICAL INFECTION PANELS
    # =========================================================================
    "WIDAL_SLIDE": [
        ("WIDAL_O", "Salmonella Typhi 'O' Titre", "Titre", "TEXT", None, None, "< 1:80 (Negative)", None, None, False, None, None),
        ("WIDAL_H", "Salmonella Typhi 'H' Titre", "Titre", "TEXT", None, None, "< 1:80 (Negative)", None, None, False, None, None),
        ("WIDAL_AH", "Salmonella Paratyphi 'AH' Titre", "Titre", "TEXT", None, None, "< 1:80 (Negative)", None, None, False, None, None),
        ("WIDAL_BH", "Salmonella Paratyphi 'BH' Titre", "Titre", "TEXT", None, None, "< 1:80 (Negative)", None, None, False, None, None),
        ("INTERPRETATION", "Clinical Impression", "", "TEXT", None, None, "No significant rise in agglutination titre", None, None, False, None, None)
    ],
    "WIDAL_TUBE": "WIDAL_SLIDE",
    "WEIL_FELIX": [
        ("OX_2", "Proteus OX-2 Titre", "Titre", "TEXT", None, None, "< 1:80 (Negative)", None, None, False, None, None),
        ("OX_19", "Proteus OX-19 Titre", "Titre", "TEXT", None, None, "< 1:80 (Negative)", None, None, False, None, None),
        ("OX_K", "Proteus OX-K Titre", "Titre", "TEXT", None, None, "< 1:80 (Negative)", None, None, False, None, None),
        ("IMPRESSION", "Diagnostic Impression", "", "TEXT", None, None, "Negative for Rickettsial Infection", None, None, False, None, None)
    ],
    "DENGUE_PROFILE": [
        ("DENGUE_NS1", "Dengue NS1 Antigen", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("DENGUE_IGM", "Dengue IgM Antibody", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("DENGUE_IGG", "Dengue IgG Antibody", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("METHOD", "Assay Method", "", "TEXT", None, None, "Rapid Immunochromatographic Assay", None, None, False, None, None)
    ],
    "TORCH_PANEL": [
        ("TOXO_IGG", "Toxoplasma Gondii IgG", "IU/mL", "NUMERIC", 0.0, 1.0, "< 1.0 IU/mL (Negative)", 0.0, 300.0, False, None, None),
        ("TOXO_IGM", "Toxoplasma Gondii IgM", "Index", "NUMERIC", 0.0, 0.8, "< 0.8 Index (Negative)", 0.0, 20.0, False, None, None),
        ("RUBELLA_IGG", "Rubella Virus IgG", "IU/mL", "NUMERIC", 0.0, 10.0, "< 10.0 IU/mL (Non-Immune)", 0.0, 500.0, False, None, None),
        ("RUBELLA_IGM", "Rubella Virus IgM", "Index", "NUMERIC", 0.0, 0.8, "< 0.8 Index (Negative)", 0.0, 20.0, False, None, None),
        ("CMV_IGG", "Cytomegalovirus (CMV) IgG", "AU/mL", "NUMERIC", 0.0, 6.0, "< 6.0 AU/mL (Negative)", 0.0, 400.0, False, None, None),
        ("CMV_IGM", "Cytomegalovirus (CMV) IgM", "Index", "NUMERIC", 0.0, 0.7, "< 0.7 Index (Negative)", 0.0, 20.0, False, None, None),
        ("HSV1_IGG", "Herpes Simplex Virus 1 (HSV-1) IgG", "Index", "NUMERIC", 0.0, 0.9, "< 0.9 Index (Negative)", 0.0, 20.0, False, None, None),
        ("HSV1_IGM", "Herpes Simplex Virus 1 (HSV-1) IgM", "Index", "NUMERIC", 0.0, 0.9, "< 0.9 Index (Negative)", 0.0, 20.0, False, None, None),
        ("HSV2_IGG", "Herpes Simplex Virus 2 (HSV-2) IgG", "Index", "NUMERIC", 0.0, 0.9, "< 0.9 Index (Negative)", 0.0, 20.0, False, None, None),
        ("HSV2_IGM", "Herpes Simplex Virus 2 (HSV-2) IgM", "Index", "NUMERIC", 0.0, 0.9, "< 0.9 Index (Negative)", 0.0, 20.0, False, None, None)
    ],
    "TORCH_IGG": [
        ("TOXO_IGG", "Toxoplasma Gondii IgG", "IU/mL", "NUMERIC", 0.0, 1.0, "< 1.0 IU/mL (Negative)", 0.0, 300.0, False, None, None),
        ("RUBELLA_IGG", "Rubella Virus IgG", "IU/mL", "NUMERIC", 0.0, 10.0, "< 10.0 IU/mL (Non-Immune)", 0.0, 500.0, False, None, None),
        ("CMV_IGG", "Cytomegalovirus (CMV) IgG", "AU/mL", "NUMERIC", 0.0, 6.0, "< 6.0 AU/mL (Negative)", 0.0, 400.0, False, None, None),
        ("HSV1_IGG", "Herpes Simplex Virus 1 (HSV-1) IgG", "Index", "NUMERIC", 0.0, 0.9, "< 0.9 Index (Negative)", 0.0, 20.0, False, None, None),
        ("HSV2_IGG", "Herpes Simplex Virus 2 (HSV-2) IgG", "Index", "NUMERIC", 0.0, 0.9, "< 0.9 Index (Negative)", 0.0, 20.0, False, None, None)
    ],
    "TORCH_IGM": [
        ("TOXO_IGM", "Toxoplasma Gondii IgM", "Index", "NUMERIC", 0.0, 0.8, "< 0.8 Index (Negative)", 0.0, 20.0, False, None, None),
        ("RUBELLA_IGM", "Rubella Virus IgM", "Index", "NUMERIC", 0.0, 0.8, "< 0.8 Index (Negative)", 0.0, 20.0, False, None, None),
        ("CMV_IGM", "Cytomegalovirus (CMV) IgM", "Index", "NUMERIC", 0.0, 0.7, "< 0.7 Index (Negative)", 0.0, 20.0, False, None, None),
        ("HSV1_IGM", "Herpes Simplex Virus 1 (HSV-1) IgM", "Index", "NUMERIC", 0.0, 0.9, "< 0.9 Index (Negative)", 0.0, 20.0, False, None, None),
        ("HSV2_IGM", "Herpes Simplex Virus 2 (HSV-2) IgM", "Index", "NUMERIC", 0.0, 0.9, "< 0.9 Index (Negative)", 0.0, 20.0, False, None, None)
    ],

    # =========================================================================
    # 14. PRENATAL SCREENING (Double & Triple Marker)
    # =========================================================================
    "DOUBLE_MARKER": [
        ("MATERNAL_AGE", "Maternal Age at Sample Date", "years", "NUMERIC", 18.0, 45.0, "18 - 45 years", 14.0, 60.0, False, None, None),
        ("GESTATIONAL_AGE", "Gestational Age by USG", "Weeks+Days", "TEXT", None, None, "11 to 13 Weeks + 6 Days", None, None, False, None, None),
        ("FREE_BETA_HCG", "Free Beta hCG", "mIU/mL", "NUMERIC", 10.0, 100.0, "10.0 - 100.0 mIU/mL", 0.5, 500.0, False, None, None),
        ("HCG_MOM", "Free Beta hCG MoM", "MoM", "NUMERIC", 0.5, 2.0, "0.50 - 2.00 MoM", 0.1, 10.0, False, None, None),
        ("PAPP_A", "PAPP-A (Pregnancy Associated Plasma Protein A)", "mIU/mL", "NUMERIC", 1.0, 10.0, "1.00 - 10.00 mIU/mL", 0.1, 50.0, False, None, None),
        ("PAPP_A_MOM", "PAPP-A MoM", "MoM", "NUMERIC", 0.5, 2.5, "0.50 - 2.50 MoM", 0.1, 10.0, False, None, None),
        ("NT_MEASURE", "Nuchal Translucency (NT)", "mm", "NUMERIC", 0.5, 2.5, "< 2.5 mm", 0.1, 10.0, False, None, None),
        ("TRISOMY_21_RISK", "Down Syndrome (Trisomy 21) Risk", "", "TEXT", None, None, "Low Risk / Screen Negative (< 1:250)", None, None, False, None, None),
        ("TRISOMY_18_RISK", "Trisomy 18/13 Calculated Risk", "", "TEXT", None, None, "Low Risk / Screen Negative (< 1:100)", None, None, False, None, None)
    ],
    "TRIPLE_MARKER": [
        ("MATERNAL_AGE", "Maternal Age at EDD", "years", "NUMERIC", 18.0, 45.0, "18 - 45 years", 14.0, 60.0, False, None, None),
        ("GESTATIONAL_AGE", "Gestational Age by USG", "Weeks+Days", "TEXT", None, None, "15 to 20 Weeks + 6 Days", None, None, False, None, None),
        ("AFP", "Alpha Fetoprotein (AFP)", "ng/mL", "NUMERIC", 15.0, 90.0, "15.0 - 90.0 ng/mL", 1.0, 500.0, False, None, None),
        ("AFP_MOM", "AFP MoM", "MoM", "NUMERIC", 0.5, 2.5, "0.50 - 2.50 MoM", 0.1, 10.0, False, None, None),
        ("TOTAL_HCG", "Total Beta hCG", "mIU/mL", "NUMERIC", 10000.0, 60000.0, "10000 - 60000 mIU/mL", 500.0, 300000.0, False, None, None),
        ("HCG_MOM", "Total hCG MoM", "MoM", "NUMERIC", 0.5, 2.0, "0.50 - 2.00 MoM", 0.1, 10.0, False, None, None),
        ("UE3", "Unconjugated Estriol (uE3)", "ng/mL", "NUMERIC", 0.5, 4.0, "0.50 - 4.00 ng/mL", 0.05, 30.0, False, None, None),
        ("UE3_MOM", "uE3 MoM", "MoM", "NUMERIC", 0.5, 2.0, "0.50 - 2.00 MoM", 0.1, 10.0, False, None, None),
        ("TRISOMY_21_RISK", "Down Syndrome (Trisomy 21) Risk", "", "TEXT", None, None, "Screen Negative (< 1:250)", None, None, False, None, None),
        ("TRISOMY_18_RISK", "Trisomy 18 Calculated Risk", "", "TEXT", None, None, "Screen Negative (< 1:100)", None, None, False, None, None),
        ("NTD_RISK", "Neural Tube Defects (NTD) Risk", "", "TEXT", None, None, "Low Risk", None, None, False, None, None)
    ],

    # =========================================================================
    # 15. BODY FLUIDS & CYTOLOGY
    # =========================================================================
    "PLEURAL_ANALYSIS": [
        ("PHYSICAL_APPEARANCE", "Physical Appearance & Colour", "", "TEXT", None, None, "Straw Coloured / Clear", None, None, False, None, None),
        ("COAGULUM", "Coagulum / Clot Formation", "", "TEXT", None, None, "Absent / Nil", None, None, False, None, None),
        ("SP_GRAVITY", "Specific Gravity", "", "NUMERIC", 1.010, 1.025, "1.010 - 1.025", 1.000, 1.060, False, None, None),
        ("PROTEIN", "Total Protein", "g/dL", "NUMERIC", 1.0, 3.0, "< 3.0 (Transudate) / > 3.0 (Exudate)", 0.1, 12.0, False, None, None),
        ("GLUCOSE", "Fluid Glucose", "mg/dL", "NUMERIC", 60.0, 100.0, "60.0 - 100.0 mg/dL", 5.0, 500.0, False, None, None),
        ("LDH", "Fluid LDH", "U/L", "NUMERIC", 50.0, 200.0, "< 200.0 U/L", 10.0, 5000.0, False, None, None),
        ("CELL_COUNT", "Total Nucleated Cell Count (TNCC)", "cells/µL", "NUMERIC", 0.0, 1000.0, "< 1000 cells/µL", 0.0, 100000.0, False, None, None),
        ("POLYMORPHS", "Polymorphs / Neutrophils", "%", "NUMERIC", 0.0, 25.0, "< 25 %", 0.0, 100.0, True, None, None),
        ("LYMPHOCYTES", "Lymphocytes", "%", "NUMERIC", 50.0, 90.0, "> 50 %", 0.0, 100.0, True, None, None),
        ("MESOTHELIAL", "Mesothelial Cells", "%", "NUMERIC", 0.0, 10.0, "< 10 %", 0.0, 100.0, False, None, None),
        ("MALIGNANT", "Malignant / Atypical Cells", "", "TEXT", None, None, "Negative for Malignant Cells", None, None, False, None, None)
    ],
    "CYTO_PLEURAL": "PLEURAL_ANALYSIS",
    "ASCITIC_FLUID": "PLEURAL_ANALYSIS",
    "PERICARDIAL_CYTO": "PLEURAL_ANALYSIS",
    "CSF_ANALYSIS": [
        ("APPEARANCE", "Appearance / Clarity", "", "TEXT", None, None, "Crystal Clear / Colourless", None, None, False, None, None),
        ("COAGULUM", "Coagulum / Web", "", "TEXT", None, None, "Absent", None, None, False, None, None),
        ("PROTEIN", "CSF Total Protein", "mg/dL", "NUMERIC", 15.0, 45.0, "15.0 - 45.0 mg/dL", 2.0, 1000.0, False, None, 150.0),
        ("GLUCOSE", "CSF Glucose", "mg/dL", "NUMERIC", 45.0, 80.0, "45.0 - 80.0 mg/dL (60% of blood glucose)", 5.0, 500.0, False, 30.0, None),
        ("CHLORIDE", "CSF Chloride", "mmol/L", "NUMERIC", 118.0, 132.0, "118.0 - 132.0 mmol/L", 50.0, 200.0, False, None, None),
        ("CELL_COUNT", "Total Leucocyte Count", "cells/µL", "NUMERIC", 0.0, 5.0, "0 - 5 cells/µL (Adults)", 0.0, 10000.0, False, None, 50.0),
        ("LYMPHOCYTES", "Lymphocytes", "%", "NUMERIC", 60.0, 100.0, "60 - 100 %", 0.0, 100.0, True, None, None),
        ("POLYMORPHS", "Polymorphs (Neutrophils)", "%", "NUMERIC", 0.0, 0.0, "Nil / 0 %", 0.0, 100.0, True, None, None),
        ("RBC", "Red Blood Cells (RBCs)", "cells/µL", "NUMERIC", 0.0, 0.0, "Nil", 0.0, 50000.0, False, None, None),
        ("GRAM_STAIN", "Gram Stain", "", "TEXT", None, None, "No organisms seen", None, None, False, None, None),
        ("INDIA_INK", "India Ink (Cryptococcus)", "", "TEXT", None, None, "Negative for Encapsulated Yeasts", None, None, False, None, None)
    ],
    "CYTO_CSF": "CSF_ANALYSIS",

    # =========================================================================
    # 16. MICROBIOLOGY & STAINS
    # =========================================================================
    "GRAM_STAIN": [
        ("PUS_CELLS", "Pus Cells / Polymorphs", "/HPF", "TEXT", None, None, "Few / Occasional", None, None, False, None, None),
        ("EPITHELIAL", "Epithelial Cells", "/HPF", "TEXT", None, None, "Few / Present", None, None, False, None, None),
        ("GRAM_POS", "Gram Positive Organisms", "", "TEXT", None, None, "None Seen", None, None, False, None, None),
        ("GRAM_NEG", "Gram Negative Organisms", "", "TEXT", None, None, "None Seen", None, None, False, None, None),
        ("IMPRESSION", "Gram Stain Smear Impression", "", "TEXT", None, None, "No micro-organisms observed on Gram stain", None, None, False, None, None)
    ],
    "SPUTUM_AFB": [
        ("SPECIMEN_QUALITY", "Specimen Appearance / Quality", "", "TEXT", None, None, "Mucoid / Salivary / Purulent", None, None, False, None, None),
        ("AFB_RESULT", "Acid Fast Bacilli (AFB)", "", "TEXT", None, None, "Negative for AFB", None, None, False, None, None),
        ("GRADING", "Smear Grading (RNTCP / WHO Scale)", "", "TEXT", None, None, "No Acid Fast Bacilli observed in 100 oil immersion fields", None, None, False, None, None)
    ],
    "URN_AFB": "SPUTUM_AFB",
    "KOH_MOUNT": [
        ("FUNGAL_HYPHAE", "Fungal Hyphae / Mycelia", "", "TEXT", None, None, "Not Seen", None, None, False, None, None),
        ("YEAST_SPORES", "Budding Yeast Cells / Spores", "", "TEXT", None, None, "Not Seen", None, None, False, None, None),
        ("IMPRESSION", "KOH Mount Impression", "", "TEXT", None, None, "Negative for fungal elements", None, None, False, None, None)
    ],
    "INDIA_INK": [
        ("ENCAPSULATED_YEAST", "Encapsulated Yeast Cells", "", "TEXT", None, None, "Not Seen", None, None, False, None, None),
        ("IMPRESSION", "India Ink Impression", "", "TEXT", None, None, "Negative for Cryptococcus neoformans", None, None, False, None, None)
    ],
    "CS_URINE": [
        ("SPECIMEN_TYPE", "Specimen Type", "", "TEXT", None, None, "Clean Catch Midstream Urine", None, None, False, None, None),
        ("INCUBATION", "Incubation Details", "", "TEXT", None, None, "Aerobic at 37°C for 24 - 48 Hours", None, None, False, None, None),
        ("COLONY_COUNT", "Colony Count (CFU/mL)", "", "TEXT", None, None, "No significant bacteriuria (< 10^3 CFU/mL)", None, None, False, None, None),
        ("ISOLATED_PATHOGEN", "Isolated Pathogen", "", "TEXT", None, None, "No Growth after 48 hours of aerobic incubation", None, None, False, None, None),
        ("ANTIBIOGRAM", "Antibiotic Susceptibility", "", "TEXT", None, None, "Sterile - Not Applicable", None, None, False, None, None)
    ],
    "CS_STOOL": "CS_URINE",
    "CS_BLOOD": "CS_URINE",
    "CS_PUS": "CS_URINE",
    "CS_SPUTUM": "CS_URINE",
    "CS_VAGINAL": "CS_URINE",
    "CS_FLUID": "CS_URINE",
    "CS_TISSUE": "CS_URINE",
    "CS_BRONCHIAL": "CS_URINE",
    "CS_CATH_TIP": "CS_URINE",
    "CS_CVP_TIP": "CS_URINE",
    "CS_EAR_THROAT": "CS_URINE",
    "CS_ET_TUBE": "CS_URINE",
    "CS_EYE": "CS_URINE",
    "CS_OT_SWAB": "CS_URINE",
    "CS_SYNOVIAL": "CS_URINE",
    "CS_UMBILICAL": "CS_URINE",

    # =========================================================================
    # 17. 24-HOUR & SPOT URINE METABOLIC TESTS
    # =========================================================================
    "CP_URN_PROT": [
        ("VOL_24H", "24 Hours Urine Volume", "mL/24 hrs", "NUMERIC", 800.0, 2000.0, "800 - 2000 mL/24 hrs", 100.0, 10000.0, False, None, None),
        ("PROT_24H", "24 Hours Urine Total Protein", "mg/24 hrs", "NUMERIC", 50.0, 150.0, "< 150.0 mg/24 hrs (50 - 150 mg/24 hrs)", 5.0, 20000.0, False, None, 3500.0)
    ],
    "CP_URN_CREAT": [
        ("VOL_24H", "24 Hours Urine Volume", "mL/24 hrs", "NUMERIC", 800.0, 2000.0, "800 - 2000 mL/24 hrs", 100.0, 10000.0, False, None, None),
        ("CREAT_24H", "24 Hours Urine Creatinine", "mg/24 hrs", "NUMERIC", 800.0, 1800.0, "800 - 1800 mg/24 hrs (M: 1000-2000, F: 800-1800)", 50.0, 5000.0, False, None, None)
    ],
    "CP_URN_CALC": [
        ("VOL_24H", "24 Hours Urine Volume", "mL/24 hrs", "NUMERIC", 800.0, 2000.0, "800 - 2000 mL/24 hrs", 100.0, 10000.0, False, None, None),
        ("CALC_24H", "24 Hours Urinary Calcium", "mg/24 hrs", "NUMERIC", 100.0, 300.0, "100.0 - 300.0 mg/24 hrs (Average Diet)", 10.0, 1000.0, False, None, None)
    ],
    "URN_CALC_24H": "CP_URN_CALC",
    "CP_URN_NA": [
        ("VOL_24H", "24 Hours Urine Volume", "mL/24 hrs", "NUMERIC", 800.0, 2000.0, "800 - 2000 mL/24 hrs", 100.0, 10000.0, False, None, None),
        ("NA_24H", "24 Hours Urinary Sodium", "mmol/24 hrs", "NUMERIC", 40.0, 220.0, "40.0 - 220.0 mmol/24 hrs", 5.0, 600.0, False, None, None)
    ],
    "CP_URN_K": [
        ("VOL_24H", "24 Hours Urine Volume", "mL/24 hrs", "NUMERIC", 800.0, 2000.0, "800 - 2000 mL/24 hrs", 100.0, 10000.0, False, None, None),
        ("K_24H", "24 Hours Urinary Potassium", "mmol/24 hrs", "NUMERIC", 25.0, 125.0, "25.0 - 125.0 mmol/24 hrs", 2.0, 400.0, False, None, None)
    ],
    "CP_URN_CL": [
        ("VOL_24H", "24 Hours Urine Volume", "mL/24 hrs", "NUMERIC", 800.0, 2000.0, "800 - 2000 mL/24 hrs", 100.0, 10000.0, False, None, None),
        ("CL_24H", "24 Hours Urinary Chloride", "mmol/24 hrs", "NUMERIC", 110.0, 250.0, "110.0 - 250.0 mmol/24 hrs", 10.0, 600.0, False, None, None)
    ],
    "CP_URN_PHOS": [
        ("VOL_24H", "24 Hours Urine Volume", "mL/24 hrs", "NUMERIC", 800.0, 2000.0, "800 - 2000 mL/24 hrs", 100.0, 10000.0, False, None, None),
        ("PHOS_24H", "24 Hours Urinary Phosphorus", "g/24 hrs", "NUMERIC", 0.4, 1.3, "0.4 - 1.3 g/24 hrs", 0.05, 5.0, False, None, None)
    ],
    "UPCR_RAND": [
        ("SPOT_PROT", "Spot Urine Protein", "mg/dL", "NUMERIC", 0.0, 15.0, "< 15.0 mg/dL", 0.0, 1000.0, False, None, None),
        ("SPOT_CREAT", "Spot Urine Creatinine", "mg/dL", "NUMERIC", 30.0, 250.0, "30.0 - 250.0 mg/dL", 5.0, 1000.0, False, None, None),
        ("UPCR", "Protein / Creatinine Ratio (UPCR)", "mg/mg", "NUMERIC", 0.0, 0.2, "< 0.20 mg/mg (Normal) | > 0.5 (Significant)", 0.0, 20.0, False, None, 3.5)
    ],
    "URN_BS_BP": [
        ("BILE_SALTS", "Bile Salts (Hay's Sulphur Test)", "", "TEXT", None, None, "Negative / Absent", None, None, False, None, None),
        ("BILE_PIGMENTS", "Bile Pigments (Fouchet's Test)", "", "TEXT", None, None, "Negative / Absent", None, None, False, None, None)
    ],

    # =========================================================================
    # 18. CARDIAC MARKERS & BLOOD GASES
    # =========================================================================
    "ABG": [
        ("PH", "pH (Arterial)", "", "NUMERIC", 7.35, 7.45, "7.35 - 7.45", 6.80, 7.80, False, 7.20, 7.60),
        ("PCO2", "pCO2 (Partial Pressure CO2)", "mmHg", "NUMERIC", 35.0, 45.0, "35.0 - 45.0 mmHg", 10.0, 120.0, False, 20.0, 70.0),
        ("PO2", "pO2 (Partial Pressure O2)", "mmHg", "NUMERIC", 80.0, 100.0, "80.0 - 100.0 mmHg", 20.0, 500.0, False, 50.0, None),
        ("HCO3", "Bicarbonate (HCO3- Actual)", "mmol/L", "NUMERIC", 22.0, 26.0, "22.0 - 26.0 mmol/L", 5.0, 50.0, False, 12.0, 35.0),
        ("BASE_EXCESS", "Base Excess (BE)", "mmol/L", "NUMERIC", -2.0, 2.0, "-2.0 to +2.0 mmol/L", -25.0, 25.0, False, None, None),
        ("SO2", "Oxygen Saturation (sO2)", "%", "NUMERIC", 95.0, 100.0, "95.0 - 100.0 %", 50.0, 100.0, False, 85.0, None)
    ],
    "TROPONIN_I": [
        ("TROP_I", "Troponin I (High Sensitive)", "ng/mL", "NUMERIC", 0.0, 0.04, "< 0.04 ng/mL (Normal)", 0.0, 50.0, False, None, 0.40)
    ],
    "TROPONIN_T": [
        ("TROP_T", "Troponin T (hs-cTnT)", "pg/mL", "NUMERIC", 0.0, 14.0, "< 14.0 pg/mL (Normal)", 0.0, 10000.0, False, None, 100.0)
    ],
    "CPK_MB": [
        ("CPK_MB", "CPK-MB (Creatine Kinase-MB)", "U/L", "NUMERIC", 0.0, 24.0, "0.0 - 24.0 U/L", 0.0, 800.0, False, None, 50.0)
    ],
    "CPK": [
        ("CPK_TOTAL", "CPK Total (Creatine Kinase)", "U/L", "NUMERIC", 30.0, 190.0, "30 - 190 U/L (M: 39-308, F: 26-192)", 5.0, 20000.0, False, None, 1000.0)
    ],

    # =========================================================================
    # 19. HISTOPATHOLOGY & CYTOLOGY REPORTS
    # =========================================================================
    "HISTO_BIOPSY": [
        ("SPECIMEN_NATURE", "Nature of Specimen & Site", "", "TEXT", None, None, "Tissue biopsy received in 10% formalin", None, None, False, None, None),
        ("GROSS_EXAM", "Gross Examination", "", "TEXT", None, None, "Received formalin-fixed tissue fragment(s); macroscopic description recorded", None, None, False, None, None),
        ("MICROSCOPIC_EXAM", "Microscopic Examination", "", "TEXT", None, None, "Sections studied show characteristic tissue architecture and cellular features", None, None, False, None, None),
        ("IMPRESSION", "Histopathological Impression / Diagnosis", "", "TEXT", None, None, "Consistent with benign lesion; no evidence of dysplasia or malignancy", None, None, False, None, None)
    ],
    "BIOPSY_SMALL": "HISTO_BIOPSY",
    "BIOPSY_MEDIUM": "HISTO_BIOPSY",
    "BIOPSY_LARGE": "HISTO_BIOPSY",
    "HISTO_REP": "HISTO_BIOPSY",
    "BONE_MARROW_EXAM": [
        ("INDICATION", "Clinical Indication", "", "TEXT", None, None, "Evaluation of hematological abnormalities", None, None, False, None, None),
        ("ASPIRATE_EXAM", "Bone Marrow Aspirate Findings", "", "TEXT", None, None, "Adequate cellularity, erythroid/myeloid maturation intact", None, None, False, None, None),
        ("BIOPSY_EXAM", "Trephine Biopsy Findings", "", "TEXT", None, None, "Bony trabeculae with normal marrow architecture", None, None, False, None, None),
        ("IMPRESSION", "Bone Marrow Impression", "", "TEXT", None, None, "Normocellular bone marrow showing trilineage hematopoiesis", None, None, False, None, None)
    ],
    "PAP_SMEAR": [
        ("SPECIMEN_SATISFACTION", "Specimen Adequacy", "", "TEXT", None, None, "Satisfactory for evaluation (Endocervical component present)", None, None, False, None, None),
        ("GENERAL_CATEGORIZATION", "General Categorization", "", "TEXT", None, None, "Negative for Intraepithelial Lesion or Malignancy (NILM)", None, None, False, None, None),
        ("CYTOLOGICAL_FINDINGS", "Cytological Description", "", "TEXT", None, None, "Intermediate and superficial squamous epithelial cells seen; no dysplastic changes", None, None, False, None, None),
        ("IMPRESSION", "Bethesda Classification / Impression", "", "TEXT", None, None, "Negative for Intraepithelial Lesion or Malignancy (NILM)", None, None, False, None, None)
    ],
    "FNAC": [
        ("SITE", "Aspiration Site & Clinical Note", "", "TEXT", None, None, "Site inspected and palpable nodule aspirated under aseptic precautions", None, None, False, None, None),
        ("MICROSCOPY", "Microscopic Description", "", "TEXT", None, None, "Smears show benign cellular elements; no malignant cells identified", None, None, False, None, None),
        ("IMPRESSION", "Cytological Impression", "", "TEXT", None, None, "Features consistent with benign inflammatory / reactive process", None, None, False, None, None)
    ],

    # =========================================================================
    # 20. IMMUNOHEMATOLOGY & SPECIAL SMEARS
    # =========================================================================
    "BLOOD_GROUP": [
        ("ABO_GROUP", "ABO Blood Group", "", "TEXT", None, None, "O / A / B / AB", None, None, False, None, None),
        ("RH_TYPE", "Rh Factor (D-Antigen)", "", "TEXT", None, None, "Positive / Negative", None, None, False, None, None)
    ],
    "DCT": [
        ("DCT_RESULT", "Direct Antiglobulin (Coombs) Test", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("CONTROL", "Negative Control", "", "TEXT", None, None, "Valid / Negative", None, None, False, None, None)
    ],
    "ICT": [
        ("ICT_RESULT", "Indirect Antiglobulin (Coombs) Test", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("TITRE", "Antibody Titre", "", "TEXT", None, None, "Nil", None, None, False, None, None)
    ],
    "ICT_DCT_COMBO": [
        ("DCT_RESULT", "Direct Antiglobulin (Coombs) Test", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("ICT_RESULT", "Indirect Antiglobulin (Coombs) Test", "", "TEXT", None, None, "Negative", None, None, False, None, None)
    ],
    "MP_CARD": [
        ("PF_AG", "Plasmodium Falciparum (Pf) Antigen", "", "TEXT", None, None, "Negative", None, None, False, None, None),
        ("PV_AG", "Plasmodium Vivax (Pv) Antigen", "", "TEXT", None, None, "Negative", None, None, False, None, None)
    ],
    "MP_SMEAR": [
        ("THICK_SMEAR", "Thick Smear Examination", "", "TEXT", None, None, "Negative for Malarial Parasites", None, None, False, None, None),
        ("THIN_SMEAR", "Thin Smear Examination (Species Id)", "", "TEXT", None, None, "No trophozoites, schizonts or gametocytes seen", None, None, False, None, None)
    ],
    "MP_QBC": [
        ("MP_QBC", "Malarial Parasite (QBC Method)", "", "TEXT", None, None, "Negative for Malarial Parasites", None, None, False, None, None)
    ],
    "MF_QBC": [
        ("MF_QBC", "Microfilariae (QBC Method)", "", "TEXT", None, None, "Negative for Microfilariae", None, None, False, None, None)
    ],
    "SMEAR_MF": [
        ("PERIPHERAL_SMEAR_MF", "Peripheral Smear for Microfilariae", "", "TEXT", None, None, "No Microfilariae seen in peripheral blood smear", None, None, False, None, None)
    ],
    "PS_EXAM": [
        ("RBC_MORPHOLOGY", "RBC Morphology", "", "TEXT", None, None, "Normocytic Normochromic", None, None, False, None, None),
        ("WBC_MORPHOLOGY", "WBC Series & Morphology", "", "TEXT", None, None, "Mature leucocytes with normal granulation", None, None, False, None, None),
        ("PLATELETS_SMEAR", "Platelets on Smear", "", "TEXT", None, None, "Adequate on smear (1.5 - 4.5 Lakhs/µL)", None, None, False, None, None),
        ("PARASITES", "Hemoparasites", "", "TEXT", None, None, "None Seen", None, None, False, None, None),
        ("IMPRESSION", "Smear Impression", "", "TEXT", None, None, "Normal Peripheral Blood Picture", None, None, False, None, None)
    ],
    "G6PD_QUAL": [
        ("G6PD_ACTIVITY", "G6PD Activity (Qualitative)", "", "TEXT", None, None, "Normal (No G6PD Deficiency detected)", None, None, False, None, None)
    ],
    "G6PD_QUANT": [
        ("G6PD_QUANT", "G6PD Quantitative Enzyme Activity", "U/g Hb", "NUMERIC", 4.6, 13.5, "4.6 - 13.5 U/g Hb", 0.0, 50.0, False, 2.0, None)
    ]
}

# Resolve aliases in catalog
RESOLVED_CATALOG = {}
for code, val in FULL_CLINICAL_PARAM_CATALOG.items():
    if isinstance(val, str):
        RESOLVED_CATALOG[code] = FULL_CLINICAL_PARAM_CATALOG[val]
    else:
        RESOLVED_CATALOG[code] = val


def get_default_single_parameter(test_name: str, test_code: str, category_name: str):
    """
    Generate professional standard single parameter for standalone tests
    """
    t_name_upper = test_name.upper()
    c_name_upper = category_name.upper()

    # Determine clinical unit & ranges
    unit = ""
    v_type = "NUMERIC"
    ref_low = None
    ref_high = None
    txt_ref = "Normal"
    imp_low = None
    imp_high = None

    if any(w in t_name_upper for w in ["CULTURE", "SMEAR", "CARD", "BIOPSY", "CYTOLOGY", "TEST", "SCREENING", "QUALITATIVE", "PREGNANCY", "UPT", "PCR", "STAIN"]):
        v_type = "TEXT"
        txt_ref = "Negative / Normal"
    elif "ANTIBODY" in t_name_upper or "ANTIGEN" in t_name_upper or "IGG" in t_name_upper or "IGM" in t_name_upper:
        v_type = "TEXT"
        txt_ref = "Non-Reactive / Negative"
    elif "RATIO" in t_name_upper:
        unit = "Ratio"
        ref_low, ref_high = 1.0, 2.0
        txt_ref = "1.0 - 2.0 Ratio"
    elif "CALCIUM" in t_name_upper:
        unit = "mg/dL"
        ref_low, ref_high = 8.5, 10.5
        txt_ref = "8.5 - 10.5 mg/dL"
    elif "CREATININE" in t_name_upper:
        unit = "mg/dL"
        ref_low, ref_high = 0.6, 1.2
        txt_ref = "0.6 - 1.2 mg/dL"
    elif "UREA" in t_name_upper:
        unit = "mg/dL"
        ref_low, ref_high = 15.0, 45.0
        txt_ref = "15.0 - 45.0 mg/dL"
    elif "URIC ACID" in t_name_upper:
        unit = "mg/dL"
        ref_low, ref_high = 3.5, 7.2
        txt_ref = "3.5 - 7.2 mg/dL"
    elif "SUGAR" in t_name_upper or "GLUCOSE" in t_name_upper:
        unit = "mg/dL"
        ref_low, ref_high = 70.0, 140.0
        txt_ref = "70.0 - 140.0 mg/dL"
    elif "CHOLESTEROL" in t_name_upper or "TRIGLYCERIDES" in t_name_upper:
        unit = "mg/dL"
        ref_low, ref_high = 50.0, 200.0
        txt_ref = "< 200.0 mg/dL"
    elif "PROTEIN" in t_name_upper or "ALBUMIN" in t_name_upper:
        unit = "g/dL"
        ref_low, ref_high = 3.5, 8.0
        txt_ref = "3.5 - 8.0 g/dL"
    elif "VITAMIN D" in t_name_upper:
        unit = "ng/mL"
        ref_low, ref_high = 30.0, 100.0
        txt_ref = "30.0 - 100.0 ng/mL"
    elif "VITAMIN B" in t_name_upper or "B-12" in t_name_upper:
        unit = "pg/mL"
        ref_low, ref_high = 211.0, 911.0
        txt_ref = "211.0 - 911.0 pg/mL"
    elif "CRP" in t_name_upper:
        unit = "mg/L"
        ref_low, ref_high = 0.0, 6.0
        txt_ref = "< 6.0 mg/L"
    elif "FERRITIN" in t_name_upper:
        unit = "ng/mL"
        ref_low, ref_high = 30.0, 400.0
        txt_ref = "30.0 - 400.0 ng/mL"
    elif "TSH" in t_name_upper:
        unit = "µIU/mL"
        ref_low, ref_high = 0.35, 5.50
        txt_ref = "0.35 - 5.50 µIU/mL"
    elif "T3" in t_name_upper:
        unit = "ng/mL"
        ref_low, ref_high = 0.80, 2.00
        txt_ref = "0.80 - 2.00 ng/mL"
    elif "T4" in t_name_upper:
        unit = "µg/dL"
        ref_low, ref_high = 5.10, 12.00
        txt_ref = "5.10 - 12.00 µg/dL"
    elif "AMYLASE" in t_name_upper or "LIPASE" in t_name_upper or "LDH" in t_name_upper or "ALP" in t_name_upper or "GGT" in t_name_upper:
        unit = "U/L"
        ref_low, ref_high = 25.0, 150.0
        txt_ref = "25.0 - 150.0 U/L"
    elif "POTASSIUM" in t_name_upper or "SODIUM" in t_name_upper or "CHLORIDE" in t_name_upper:
        unit = "mmol/L"
        ref_low, ref_high = 3.5, 145.0
        txt_ref = "Within Normal Limits"
    elif "HORMONE" in t_name_upper or "PROLACTIN" in t_name_upper or "TESTOSTERONE" in t_name_upper or "FSH" in t_name_upper or "LH" in t_name_upper:
        unit = "ng/mL"
        ref_low, ref_high = 2.0, 25.0
        txt_ref = "Normal adult reference range"
    elif "BIOCHEMISTRY" in c_name_upper:
        unit = "mg/dL"
        ref_low, ref_high = 10.0, 100.0
        txt_ref = "10.0 - 100.0 mg/dL"
    else:
        v_type = "TEXT"
        txt_ref = "Normal / Negative"

    return [(test_code, test_name, unit, v_type, ref_low, ref_high, txt_ref, imp_low, imp_high, False, None, None)]


def sync_all_database_parameters():
    conn = sqlite3.connect('backend/pulselab.db')
    c = conn.cursor()

    # 1. Fetch all tests with categories
    c.execute("""
        SELECT t.id, t.code, t.name, COALESCE(cat.name, 'GENERAL')
        FROM tests t
        LEFT JOIN test_categories cat ON t.category_id = cat.id
        ORDER BY t.name
    """)
    all_tests = c.fetchall()
    print(f"Total tests found in database: {len(all_tests)}")

    tests_updated = 0
    params_created = 0
    params_cleaned = 0

    for test_id, code, name, cat_name in all_tests:
        code_upper = code.upper()
        
        # Determine target parameters
        target_param_specs = None
        if code_upper in RESOLVED_CATALOG:
            target_param_specs = RESOLVED_CATALOG[code_upper]
        else:
            # Check by substring match
            for k, specs in RESOLVED_CATALOG.items():
                if k == code_upper or k == name.upper():
                    target_param_specs = specs
                    break
        
        if not target_param_specs:
            target_param_specs = get_default_single_parameter(name, code, cat_name)

        # Fetch existing parameters for this test
        c.execute("""
            SELECT id, code, name, display_order 
            FROM test_parameters 
            WHERE test_id = ?
            ORDER BY display_order
        """, (test_id,))
        existing_params = c.fetchall()
        existing_by_code = {p[1].upper(): p for p in existing_params}
        existing_ids = {p[0] for p in existing_params}

        # Keep track of active parameter ids for this test
        active_param_ids = []

        # Iterate target parameter specifications and upsert
        for order_idx, spec in enumerate(target_param_specs, start=1):
            p_code = spec[0]
            p_name = spec[1]
            p_unit = spec[2]
            p_vtype = spec[3]
            r_low = spec[4]
            r_high = spec[5]
            txt_ref = spec[6]
            imp_l = spec[7]
            imp_h = spec[8]
            is_diff = spec[9]
            crit_l = spec[10] if len(spec) > 10 else None
            crit_h = spec[11] if len(spec) > 11 else None

            # Check if this parameter already exists by code
            param_id = None
            if p_code.upper() in existing_by_code:
                param_id = existing_by_code[p_code.upper()][0]
                # Update existing parameter
                c.execute("""
                    UPDATE test_parameters
                    SET name = ?, unit = ?, value_type = ?, display_order = ?,
                        impossible_low = ?, impossible_high = ?, critical_low = ?, critical_high = ?,
                        is_differential_part = ?
                    WHERE id = ?
                """, (p_name, p_unit, p_vtype, order_idx, imp_l, imp_h, crit_l, crit_h, 1 if is_diff else 0, param_id))
            else:
                # Insert new parameter
                param_id = str(uuid.uuid4())
                c.execute("""
                    INSERT INTO test_parameters (
                        id, test_id, code, name, unit, value_type, display_order,
                        impossible_low, impossible_high, critical_low, critical_high,
                        is_differential_part, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
                """, (param_id, test_id, p_code, p_name, p_unit, p_vtype, order_idx, imp_l, imp_h, crit_l, crit_h, 1 if is_diff else 0))
                params_created += 1

            active_param_ids.append(param_id)

            # Upsert parameter ranges
            c.execute("SELECT id FROM parameter_ranges WHERE parameter_id = ?", (param_id,))
            range_row = c.fetchone()
            if range_row:
                c.execute("""
                    UPDATE parameter_ranges
                    SET gender = 'ALL', reference_low = ?, reference_high = ?, textual_reference = ?
                    WHERE id = ?
                """, (r_low, r_high, txt_ref, range_row[0]))
            else:
                range_id = str(uuid.uuid4())
                c.execute("""
                    INSERT INTO parameter_ranges (
                        id, parameter_id, gender, min_age_days, max_age_days,
                        reference_low, reference_high, textual_reference
                    ) VALUES (?, ?, 'ALL', 0, 43800, ?, ?, ?)
                """, (range_id, param_id, r_low, r_high, txt_ref))

        # Handle any old / junk parameters that are no longer part of active_param_ids
        for old_p in existing_params:
            old_id = old_p[0]
            old_code = old_p[1]
            if old_id not in active_param_ids:
                # If this old parameter has result_values, migrate them to the first active parameter
                target_migrate_id = active_param_ids[0]
                c.execute("""
                    UPDATE result_values 
                    SET parameter_id = ? 
                    WHERE parameter_id = ? 
                      AND test_result_id NOT IN (
                          SELECT test_result_id FROM result_values WHERE parameter_id = ?
                      )
                """, (target_migrate_id, old_id, target_migrate_id))
                
                # Delete leftover result_values, ranges, and the old parameter
                c.execute("DELETE FROM result_values WHERE parameter_id = ?", (old_id,))
                c.execute("DELETE FROM parameter_ranges WHERE parameter_id = ?", (old_id,))
                c.execute("DELETE FROM test_parameters WHERE id = ?", (old_id,))
                params_cleaned += 1

        tests_updated += 1

    conn.commit()
    print(f"Tests synced: {tests_updated} | New parameters added: {params_created} | Obsolete/duplicate parameters cleaned: {params_cleaned}")

    # Synchronize all existing orders/test_results so they have complete result_values slots
    c.execute("""
        SELECT tr.id, tr.test_id
        FROM test_results tr
    """)
    all_tr = c.fetchall()
    rv_added = 0
    for tr_id, t_id in all_tr:
        c.execute("SELECT id FROM test_parameters WHERE test_id = ?", (t_id,))
        for (p_id,) in c.fetchall():
            c.execute("SELECT id FROM result_values WHERE test_result_id = ? AND parameter_id = ?", (tr_id, p_id))
            if not c.fetchone():
                rv_id = str(uuid.uuid4())
                c.execute("""
                    INSERT INTO result_values (
                        id, test_result_id, parameter_id, numeric_value, text_value, 
                        is_abnormal, is_critical, flag, is_bold_highlight, created_at
                    ) VALUES (?, ?, ?, NULL, NULL, 0, 0, 'NORMAL', 0, datetime('now'))
                """, (rv_id, tr_id, p_id))
                rv_added += 1

    conn.commit()
    print(f"Synchronized existing orders: added {rv_added} result value slots.")
    conn.close()

if __name__ == "__main__":
    sync_all_database_parameters()
