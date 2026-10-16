import sqlite3
import shutil
import uuid
from datetime import datetime
from clinical_defs import CLINICAL_TEST_DEFINITIONS

DB_PATH = 'backend/pulselab.db'
BACKUP_PATH = 'backend/pulselab.db.bak'

# 1. Create a safe backup of the database
print(f"Creating backup from {DB_PATH} to {BACKUP_PATH}...")
shutil.copyfile(DB_PATH, BACKUP_PATH)
print("Backup created successfully.")

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Get all tests from database
tests = c.execute("SELECT id, code, name FROM tests").fetchall()
print(f"Total tests in catalog to process: {len(tests)}")

total_params_updated = 0
total_params_inserted = 0
total_ranges_updated = 0
total_ranges_inserted = 0
tests_processed = 0

now_iso = datetime.utcnow().isoformat()

for t_id, t_code, t_name in tests:
    defs = CLINICAL_TEST_DEFINITIONS.get(t_code)
    if not defs:
        print(f"WARNING: No clinical definition found for test {t_code} ({t_name})")
        continue

    # Fetch existing parameters for this test
    existing_params = c.execute(
        "SELECT id, code, name, unit, value_type, display_order FROM test_parameters WHERE test_id = ? ORDER BY display_order",
        (t_id,)
    ).fetchall()
    
    # Map by code if possible
    existing_by_code = {p[1]: p for p in existing_params}
    used_param_ids = set()

    for idx, def_item in enumerate(defs):
        param_code = def_item["code"]
        param_name = def_item["name"]
        param_unit = def_item.get("unit", "")
        param_type = def_item.get("value_type", "NUMERIC")
        is_diff = 1 if def_item.get("is_diff") else 0
        display_order = idx + 1

        ref_low = def_item.get("low")
        ref_high = def_item.get("high")
        ref_text = def_item.get("text", "")

        param_id = None
        # Try matching by exact parameter code first
        if param_code in existing_by_code and existing_by_code[param_code][0] not in used_param_ids:
            param_id = existing_by_code[param_code][0]
        else:
            # Otherwise match by unused positional parameter if available
            for p in existing_params:
                if p[0] not in used_param_ids:
                    param_id = p[0]
                    break

        if param_id:
            # Update existing parameter
            used_param_ids.add(param_id)
            c.execute(
                """UPDATE test_parameters 
                   SET code = ?, name = ?, unit = ?, value_type = ?, is_differential_part = ?, display_order = ?
                   WHERE id = ?""",
                (param_code, param_name, param_unit, param_type, is_diff, display_order, param_id)
            )
            total_params_updated += 1
        else:
            # Insert new parameter
            param_id = str(uuid.uuid4())
            used_param_ids.add(param_id)
            c.execute(
                """INSERT INTO test_parameters 
                   (id, test_id, code, name, unit, value_type, formula_expression, options_json, display_order, 
                    impossible_low, impossible_high, critical_low, critical_high, is_differential_part, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, NULL, NULL, NULL, NULL, ?, ?)""",
                (param_id, t_id, param_code, param_name, param_unit, param_type, display_order, is_diff, now_iso)
            )
            total_params_inserted += 1

        # Now update or insert the parameter range
        existing_range = c.execute(
            "SELECT id FROM parameter_ranges WHERE parameter_id = ?",
            (param_id,)
        ).fetchone()

        if existing_range:
            c.execute(
                """UPDATE parameter_ranges 
                   SET gender = 'ALL', min_age_days = 0, max_age_days = 36500,
                       reference_low = ?, reference_high = ?, textual_reference = ?
                   WHERE id = ?""",
                (ref_low, ref_high, ref_text, existing_range[0])
            )
            total_ranges_updated += 1
        else:
            range_id = str(uuid.uuid4())
            c.execute(
                """INSERT INTO parameter_ranges
                   (id, parameter_id, gender, min_age_days, max_age_days, reference_low, reference_high, textual_reference)
                   VALUES (?, ?, 'ALL', 0, 36500, ?, ?, ?)""",
                (range_id, param_id, ref_low, ref_high, ref_text)
            )
            total_ranges_inserted += 1

    # Clean up any obsolete parameters for this test that weren't in defs
    for p in existing_params:
        if p[0] not in used_param_ids:
            obsolete_id = p[0]
            # Delete associated result_values if any
            c.execute("DELETE FROM result_values WHERE parameter_id = ?", (obsolete_id,))
            # Delete associated ranges
            c.execute("DELETE FROM parameter_ranges WHERE parameter_id = ?", (obsolete_id,))
            # Delete parameter
            c.execute("DELETE FROM test_parameters WHERE id = ?", (obsolete_id,))

    tests_processed += 1

# Reconcile result_values for all existing test_results in orders
# Ensure each test_result has result_values rows for each parameter of the test
active_test_results = c.execute("SELECT id, test_id FROM test_results").fetchall()
synced_rv_count = 0

for tr_id, test_id in active_test_results:
    # Get all active parameters for this test
    params = c.execute("SELECT id FROM test_parameters WHERE test_id = ?", (test_id,)).fetchall()
    for (p_id,) in params:
        rv = c.execute(
            "SELECT id FROM result_values WHERE test_result_id = ? AND parameter_id = ?",
            (tr_id, p_id)
        ).fetchone()
        if not rv:
            rv_id = str(uuid.uuid4())
            c.execute(
                """INSERT INTO result_values 
                   (id, test_result_id, parameter_id, numeric_value, text_value, is_abnormal, is_critical, flag, delta_previous_value, delta_previous_date, is_bold_highlight, created_at)
                   VALUES (?, ?, ?, NULL, NULL, 0, 0, 'NORMAL', NULL, NULL, 0, ?)""",
                (rv_id, tr_id, p_id, now_iso)
            )
            synced_rv_count += 1

conn.commit()
conn.close()

print(f"=== MIGRATION COMPLETE ===")
print(f"Tests processed: {tests_processed}")
print(f"Parameters updated: {total_params_updated}")
print(f"Parameters inserted: {total_params_inserted}")
print(f"Ranges updated: {total_ranges_updated}")
print(f"Ranges inserted: {total_ranges_inserted}")
print(f"Result values synchronized: {synced_rv_count}")
