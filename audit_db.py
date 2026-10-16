import sqlite3

conn = sqlite3.connect('backend/pulselab.db')
c = conn.cursor()

dummy_ranges = c.execute("SELECT COUNT(*) FROM parameter_ranges WHERE reference_low = 10 AND reference_high = 50 AND textual_reference LIKE '%10.0%'").fetchone()[0]
print(f"Dummy 10-50 ranges remaining: {dummy_ranges}")

total_params = c.execute("SELECT COUNT(*) FROM test_parameters").fetchone()[0]
total_ranges = c.execute("SELECT COUNT(*) FROM parameter_ranges").fetchone()[0]
print(f"Total test_parameters: {total_params}")
print(f"Total parameter_ranges: {total_ranges}")

# Spot check key tests
spot_checks = ['ECG', 'D_DIMER', 'HBA1C', 'LITHIUM', 'GARDINAL', 'S_CALCIUM', 'URN_CALC_24H', 'GTT', 'BAL', 'UPT', 'CBC', 'LFT', 'RFT', 'LIPID']
print('\n=== SPOT CHECKS ===')
for code in spot_checks:
    t = c.execute("SELECT id, name FROM tests WHERE code = ?", (code,)).fetchone()
    if t:
        params = c.execute(
            "SELECT p.code, p.name, p.unit, p.value_type, r.reference_low, r.reference_high, r.textual_reference FROM test_parameters p LEFT JOIN parameter_ranges r ON p.id = r.parameter_id WHERE p.test_id = ? ORDER BY p.display_order",
            (t[0],)
        ).fetchall()
        print(f"\n[{code}] {t[1]}:")
        for p in params:
            print(f"   {p[0]}: {p[1]} | Unit: '{p[2]}' | Type: {p[3]} | Low: {p[4]} | High: {p[5]} | Text: '{p[6]}'")

# Check parameters with empty units
empty_unit_params = c.execute("SELECT t.code, p.code, p.name, p.value_type, r.textual_reference FROM test_parameters p JOIN tests t ON p.test_id = t.id LEFT JOIN parameter_ranges r ON p.id = r.parameter_id WHERE p.unit = '' OR p.unit IS NULL").fetchall()
print(f"\nTotal parameters with empty unit: {len(empty_unit_params)}")
print("Sample of empty unit parameters (should only be qualitative tests):")
for p in empty_unit_params[:10]:
    print(f"   {p[0]} / {p[1]} ({p[2]}): Type={p[3]}, Text='{p[4]}'")

conn.close()
