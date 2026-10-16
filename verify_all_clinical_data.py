import sqlite3

def run_deep_clinical_audit():
    conn = sqlite3.connect('backend/pulselab.db')
    c = conn.cursor()

    tests = c.execute("SELECT id, code, name, specimen_type, is_panel FROM tests ORDER BY code").fetchall()
    total_tests = len(tests)
    print("=" * 80)
    print(f"DEEP CLINICAL ACCURACY AUDIT: {total_tests} TOTAL TESTS IN DATABASE")
    print("=" * 80)

    issues = []
    tests_without_params = []
    params_without_ranges = []
    numeric_params_without_unit = []
    dummy_ranges_found = []
    stats = {
        "total_tests": total_tests,
        "total_parameters": 0,
        "total_ranges": 0,
        "numeric_parameters": 0,
        "text_parameters": 0,
        "parameters_with_unit": 0,
        "parameters_with_range_text": 0
    }

    for t_id, t_code, t_name, spec, is_panel in tests:
        params = c.execute(
            """SELECT p.id, p.code, p.name, p.unit, p.value_type, p.display_order,
                      r.id, r.reference_low, r.reference_high, r.textual_reference
               FROM test_parameters p
               LEFT JOIN parameter_ranges r ON p.id = r.parameter_id
               WHERE p.test_id = ?
               ORDER BY p.display_order""",
            (t_id,)
        ).fetchall()

        if not params:
            tests_without_params.append((t_code, t_name))
            continue

        for p in params:
            stats["total_parameters"] += 1
            p_id, p_code, p_name, p_unit, p_type, p_order, r_id, r_low, r_high, r_text = p

            if p_type == "NUMERIC":
                stats["numeric_parameters"] += 1
                if not p_unit or p_unit.strip() == "":
                    # Some numeric values might be dimensionless (like Ratio, pH, specific gravity, index, titre)
                    # Let's check if it's one of those or an actual missing unit
                    if not any(k in p_name.upper() for k in ["RATIO", "PH", "INDEX", "TITRE", "SPECIFIC GRAVITY", "SP. GRAVITY"]):
                        numeric_params_without_unit.append((t_code, p_code, p_name))
                else:
                    stats["parameters_with_unit"] += 1
            else:
                stats["text_parameters"] += 1
                if p_unit and p_unit.strip() != "":
                    stats["parameters_with_unit"] += 1

            if not r_id:
                params_without_ranges.append((t_code, p_code, p_name))
            else:
                stats["total_ranges"] += 1
                if r_text and r_text.strip() != "":
                    stats["parameters_with_range_text"] += 1

                # Check for suspicious dummy placeholder values
                if r_low == 10 and r_high == 50 and "10.0" in str(r_text) and "50.0" in str(r_text):
                    dummy_ranges_found.append((t_code, p_code, p_name, r_text))

    print(f"Total Tests in Catalog:       {stats['total_tests']}")
    print(f"Total Parameters:             {stats['total_parameters']}")
    print(f"Total Ranges:                 {stats['total_ranges']}")
    print(f"Numeric Parameters:           {stats['numeric_parameters']}")
    print(f"Textual / Qualitative Params: {stats['text_parameters']}")
    print(f"Parameters with Unit:         {stats['parameters_with_unit']}")
    print(f"Parameters with Range Text:   {stats['parameters_with_range_text']}")
    print("-" * 80)

    print(f"Tests without parameters:         {len(tests_without_params)}")
    print(f"Parameters without ranges:        {len(params_without_ranges)}")
    print(f"Numeric params without unit:      {len(numeric_params_without_unit)}")
    print(f"Dummy 10-50 ranges found:         {len(dummy_ranges_found)}")

    if tests_without_params:
        print("\n[!] TESTS WITHOUT PARAMETERS:")
        for t in tests_without_params:
            print("  -", t)

    if params_without_ranges:
        print("\n[!] PARAMETERS WITHOUT RANGES:")
        for p in params_without_ranges:
            print("  -", p)

    if numeric_params_without_unit:
        print("\n[!] NUMERIC PARAMETERS WITHOUT UNIT:")
        for p in numeric_params_without_unit:
            print("  -", p)

    if dummy_ranges_found:
        print("\n[!] DUMMY 10-50 RANGES FOUND:")
        for d in dummy_ranges_found:
            print("  -", d)

    print("\n" + "=" * 80)
    print("CATEGORICAL BREAKDOWN AUDIT")
    print("=" * 80)
    categories = c.execute("SELECT tc.name, COUNT(t.id) FROM test_categories tc JOIN tests t ON tc.id = t.category_id GROUP BY tc.id ORDER BY tc.display_order").fetchall()
    for cat_name, cnt in categories:
        print(f"  {cat_name:<30}: {cnt} tests")

    conn.close()

if __name__ == "__main__":
    run_deep_clinical_audit()
