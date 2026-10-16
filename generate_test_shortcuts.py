import json
from match_shortcuts import user_table
from verify_map import EXPLICIT_MAP

def generate_ts():
    # Build list of shortcut objects
    entries = []
    
    # Track codes to avoid duplicate primary badge if multiple map to same code
    for short, full in user_table:
        target_code = EXPLICIT_MAP.get(short)
        if not target_code:
            continue
            
        # aliases
        aliases = set()
        aliases.add(short.lower())
        aliases.add(full.lower())
        
        # split by / or + or &
        for part in short.replace('/', ' ').replace('+', ' ').replace('&', ' ').replace(',', ' ').split():
            clean = part.strip().lower()
            if len(clean) >= 2:
                aliases.add(clean)
                
        for part in full.replace('/', ' ').replace('+', ' ').replace('&', ' ').replace(',', ' ').replace('(', ' ').replace(')', ' ').split():
            clean = part.strip().lower()
            if len(clean) >= 3 and clean not in ['and', 'for', 'the', 'test', 'profile', 'level', 'count']:
                aliases.add(clean)
                
        # Special extra aliases
        if short == "RFT / KFT":
            aliases.update(["kft", "rft", "kidney", "renal"])
        elif short == "ALT / SGPT":
            aliases.update(["sgpt", "alt"])
        elif short == "AST / SGOT":
            aliases.update(["sgot", "ast"])
        elif short == "LPT":
            aliases.update(["lpt", "lipid", "cholesterol"])
        elif short == "TFT":
            aliases.update(["tft", "thyroid", "tsh"])
        elif short == "SE":
            aliases.update(["se", "electrolytes", "electrolyte", "serum electrolytes"])
        elif short == "ABO & Rh":
            aliases.update(["blood group", "blood grouping", "abo", "rh"])
        elif short == "BT/CT":
            aliases.update(["bt/ct", "btct", "bt", "ct", "bleeding time", "clotting time"])
        elif short == "UR / RUE":
            aliases.update(["ur", "rue", "urine re", "urine routine"])
        elif short == "CUA":
            aliases.update(["cua", "complete urine analysis"])
        elif short == "MCH":
            aliases.update(["mch"])
        elif short == "MCV":
            aliases.update(["mcv"])
        elif short == "PCV":
            aliases.update(["pcv", "hct"])
        elif short == "MCHC":
            aliases.update(["mchc"])
        elif short == "TC":
            aliases.update(["tc", "total count", "tlc"])
        elif short == "DC":
            aliases.update(["dc", "differential count", "dlc"])
        elif short == "TC/DC":
            aliases.update(["tc/dc", "tc,dc", "tcdc"])
        elif short == "HB/TC/DC/ESR":
            aliases.update(["hb/tc/dc/esr", "hb,tc,dc,esr", "hbtcdcesr"])
        elif short == "Iron Profile":
            aliases.update(["iron profile", "iron studies"])
        elif short == "Vit D":
            aliases.update(["vit d", "vitamin d", "vit d3"])
        elif short == "Vit B12":
            aliases.update(["vit b12", "vitamin b12", "b12"])
            
        entries.append({
            "shortcut": short,
            "fullName": full,
            "targetCode": target_code,
            "aliases": sorted(list(aliases))
        })
        
    ts_code = """// Master Laboratory Test Shortcut Keys Mapping
// Generated from AyusLab & Clinical Diagnostic Standard

export interface TestShortcutDefinition {
  shortcut: string;
  fullName: string;
  targetCode: string;
  aliases: string[];
}

export const TEST_SHORTCUTS: TestShortcutDefinition[] = """ + json.dumps(entries, indent=2) + """;

// Fast lookup by target test code to find shortcut badge(s)
export const SHORTCUTS_BY_CODE: Record<string, string[]> = {};
for (const item of TEST_SHORTCUTS) {
  if (!SHORTCUTS_BY_CODE[item.targetCode]) {
    SHORTCUTS_BY_CODE[item.targetCode] = [];
  }
  if (!SHORTCUTS_BY_CODE[item.targetCode].includes(item.shortcut)) {
    SHORTCUTS_BY_CODE[item.targetCode].push(item.shortcut);
  }
}

// Popular high-throughput blood test shortcut chips for the Order Intake Ribbon
export const POPULAR_BLOOD_SHORTCUTS = [
  { label: "CBC", code: "CBC", desc: "Complete Blood Count", badge: "⚡ CBC" },
  { label: "LFT", code: "LFT", desc: "Liver Function Test", badge: "⚡ LFT" },
  { label: "KFT / RFT", code: "RFT", desc: "Kidney / Renal Panel", badge: "⚡ KFT" },
  { label: "Lipid / LPT", code: "LIPID", desc: "Lipid Profile Test", badge: "⚡ LPT" },
  { label: "FBS", code: "FBS", desc: "Fasting Blood Sugar", badge: "⚡ FBS" },
  { label: "PPBS", code: "PPBS", desc: "Post Prandial Sugar", badge: "⚡ PPBS" },
  { label: "HbA1c", code: "HBA1C", desc: "Glycated Hemoglobin", badge: "⚡ HbA1c" },
  { label: "Thyroid / TFT", code: "THYROID", desc: "Thyroid Profile (T3/T4/TSH)", badge: "⚡ TFT" },
  { label: "ESR", code: "ESR", desc: "Sedimentation Rate", badge: "⚡ ESR" },
  { label: "Hb", code: "HB", desc: "Hemoglobin", badge: "⚡ Hb" },
  { label: "Blood Group", code: "BLOOD_GROUP", desc: "ABO & Rh Factor", badge: "⚡ ABO" },
  { label: "BT / CT", code: "BT_CT_COMBO", desc: "Bleeding & Clotting Time", badge: "⚡ BT/CT" },
  { label: "Widal", code: "WIDAL_SLIDE", desc: "Typhoid Widal Slide", badge: "⚡ Widal" },
  { label: "CRP", code: "CRP", desc: "C-Reactive Protein", badge: "⚡ CRP" },
  { label: "SE", code: "S_ELECTROLYTES", desc: "Serum Electrolytes (Na/K/Cl)", badge: "⚡ SE" },
  { label: "Vit D", code: "VIT_D_TOTAL", desc: "Vitamin D (Total)", badge: "⚡ Vit D" },
  { label: "Vit B12", code: "VIT_B12", desc: "Vitamin B-12", badge: "⚡ Vit B12" },
  { label: "MCH", code: "MCH_STANDALONE", desc: "Mean Corpuscular Hb", badge: "⚡ MCH" },
  { label: "MCV", code: "MCV_STANDALONE", desc: "Mean Corpuscular Vol", badge: "⚡ MCV" },
  { label: "PCV", code: "PCV_STANDALONE", desc: "Packed Cell Volume (HCT)", badge: "⚡ PCV" },
  { label: "Urine RE", code: "URINE_RE", desc: "Urine Routine Examination", badge: "⚡ UR" },
  { label: "PT / INR", code: "PT_INR", desc: "Prothrombin Time", badge: "⚡ PT" },
  { label: "APTT", code: "APTT", desc: "Partial Thromboplastin Time", badge: "⚡ APTT" },
  { label: "D-Dimer", code: "D_DIMER", desc: "D-Dimer Coagulation", badge: "⚡ D-Dimer" }
];

// Helper to check if a test matches a search term via its name, code, category, or shortcuts
export function matchesTestShortcut(test: { code: string; name: string; category?: string }, query: string): boolean {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return true;

  // Direct code or name match
  if (test.code.toLowerCase().includes(cleanQ)) return true;
  if (test.name.toLowerCase().includes(cleanQ)) return true;
  if (test.category && test.category.toLowerCase().includes(cleanQ)) return true;

  // Check mapped shortcuts & aliases for this test code
  const shortcuts = SHORTCUTS_BY_CODE[test.code] || [];
  for (const sc of shortcuts) {
    if (sc.toLowerCase().includes(cleanQ)) return true;
  }

  // Check aliases from the master definitions
  for (const item of TEST_SHORTCUTS) {
    if (item.targetCode === test.code) {
      if (item.shortcut.toLowerCase().includes(cleanQ)) return true;
      if (item.fullName.toLowerCase().includes(cleanQ)) return true;
      for (const a of item.aliases) {
        if (a === cleanQ || a.includes(cleanQ) || (cleanQ.length >= 3 && cleanQ.includes(a))) {
          return true;
        }
      }
    }
  }

  // Cross-reference special blood panels
  // e.g. searching 'mch', 'mcv', 'pcv', 'wbc', 'platelet' should also highlight CBC
  const cbcSubs = ["mch", "mcv", "pcv", "mchc", "neutrophils", "lymphocytes", "eosinophils", "monocytes", "basophils", "platelet", "tlc", "dlc", "rbc"];
  if (test.code === "CBC" || test.code === "CBP") {
    if (cbcSubs.some(s => cleanQ === s || cleanQ.includes(s))) {
      return true;
    }
  }

  // e.g. searching 'sgpt', 'sgot', 'bilirubin', 'alp' also matches LFT
  const lftSubs = ["sgpt", "sgot", "alt", "ast", "bilirubin", "alp", "albumin", "globulin"];
  if (test.code === "LFT") {
    if (lftSubs.some(s => cleanQ === s || cleanQ.includes(s))) {
      return true;
    }
  }

  // e.g. searching 'urea', 'creatinine', 'bun', 'uric acid', 'sodium', 'potassium' also matches RFT / KFT
  const rftSubs = ["kft", "rft", "urea", "creatinine", "bun", "uric acid", "kidney", "renal"];
  if (test.code === "RFT") {
    if (rftSubs.some(s => cleanQ === s || cleanQ.includes(s))) {
      return true;
    }
  }

  // e.g. searching 'cholesterol', 'triglycerides', 'hdl', 'ldl', 'vldl' also matches LIPID
  const lipidSubs = ["lpt", "lipid", "cholesterol", "triglycerides", "tg", "hdl", "ldl", "vldl"];
  if (test.code === "LIPID") {
    if (lipidSubs.some(s => cleanQ === s || cleanQ.includes(s))) {
      return true;
    }
  }

  // e.g. searching 't3', 't4', 'tsh' also matches THYROID
  const thyroidSubs = ["tft", "thyroid", "t3", "t4", "tsh"];
  if (test.code === "THYROID") {
    if (thyroidSubs.some(s => cleanQ === s || cleanQ.includes(s))) {
      return true;
    }
  }

  return false;
}
"""

    with open("frontend/src/lib/testShortcuts.ts", "w", encoding="utf-8") as f:
        f.write(ts_code)
    print("Successfully wrote frontend/src/lib/testShortcuts.ts")

generate_ts()
