# pyrefly: ignore-errors
# type: ignore
from typing import Dict, Any, List, Tuple, Optional
from decimal import Decimal

def validate_wbc_differential(parameters_dict: Dict[str, float]) -> Tuple[bool, float, str]:
    """
    Validates that WBC differential percentages sum to 100%.
    Expects keys: NEUTROPHILS, LYMPHOCYTES, EOSINOPHILS, MONOCYTES, BASOPHILS.
    """
    diff_keys = ["NEUTROPHILS", "LYMPHOCYTES", "EOSINOPHILS", "MONOCYTES", "BASOPHILS"]
    present_values = [parameters_dict[k] for k in diff_keys if k in parameters_dict and parameters_dict[k] is not None]
    
    if len(present_values) == 5:
        total = sum(present_values)
        if round(total, 1) != 100.0:
            return False, total, f"Differential count sum is {total}%. Total must be exactly 100%."
        return True, total, "WBC differential count is balanced (100%)."
    
    return True, sum(present_values), "Partial differential entered."

def check_impossible_and_critical_bounds(
    param_code: str, 
    value: float, 
    impossible_low: Optional[float] = None, 
    impossible_high: Optional[float] = None,
    critical_low: Optional[float] = None, 
    critical_high: Optional[float] = None,
    ref_low: Optional[float] = None,
    ref_high: Optional[float] = None
) -> Dict[str, Any]:
    """
    Evaluates a single parameter value against clinical guardrails:
    1. Impossible typo check
    2. Critical/Panic alert
    3. Normal reference range flag (LOW, HIGH, NORMAL)
    """
    result: Dict[str, Any] = {
        "is_impossible": False,
        "is_critical": False,
        "flag": "NORMAL",
        "warning": None
    }

    # 1. Extreme typo / Impossible biological bounds
    if impossible_low is not None and value < impossible_low:
        result["is_impossible"] = True
        result["warning"] = f"Physiologically impossible low value ({value}). Verify input or decimal placement."
    elif impossible_high is not None and value > impossible_high:
        result["is_impossible"] = True
        result["warning"] = f"Physiologically impossible high value ({value}). Verify input or decimal placement."

    # 2. Critical / Panic bounds
    if critical_low is not None and value <= critical_low:
        result["is_critical"] = True
        result["flag"] = "CRITICAL_LOW"
    elif critical_high is not None and value >= critical_high:
        result["is_critical"] = True
        result["flag"] = "CRITICAL_HIGH"
    # 3. Standard reference intervals
    elif ref_low is not None and value < ref_low:
        result["flag"] = "LOW"
    elif ref_high is not None and value > ref_high:
        result["flag"] = "HIGH"

    return result

def calculate_derived_formulas(params: Dict[str, float]) -> Dict[str, float]:
    """
    Auto-computes standard laboratory formulas:
    - Lipid Panel: VLDL, LDL, TC/HDL Ratio
    - Protein: Globulin, A/G Ratio
    """
    derived = {}
    
    # Lipid Calculations (Friedewald equation)
    trig = params.get("TRIGLYCERIDES")
    tc = params.get("TOTAL_CHOLESTEROL")
    hdl = params.get("HDL_CHOLESTEROL")
    
    if trig is not None:
        vldl = round(trig / 5.0, 1)
        derived["VLDL_CHOLESTEROL"] = vldl
        if tc is not None and hdl is not None:
            ldl = round(tc - (hdl + vldl), 1)
            derived["LDL_CHOLESTEROL"] = max(0.0, ldl)
            if hdl > 0:
                derived["TC_HDL_RATIO"] = round(tc / hdl, 2)

    # Liver Function (Proteins)
    tp = params.get("TOTAL_PROTEIN")
    alb = params.get("ALBUMIN")
    if tp is not None and alb is not None:
        glob = round(tp - alb, 1)
        derived["GLOBULIN"] = max(0.0, glob)
        if glob > 0:
            derived["AG_RATIO"] = round(alb / glob, 2)

    return derived
