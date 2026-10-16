import sqlite3

conn = sqlite3.connect('backend/pulselab.db')
c = conn.cursor()

cats = c.execute('SELECT id, name FROM test_categories ORDER BY display_order').fetchall()
for cat_id, cat_name in cats:
    print(f"\n==============================")
    print(f"CATEGORY: {cat_name}")
    print(f"==============================")
    tests = c.execute('SELECT id, code, name FROM tests WHERE category_id = ? ORDER BY code LIMIT 3', (cat_id,)).fetchall()
    for t_id, t_code, t_name in tests:
        params = c.execute(
            'SELECT p.code, p.name, p.unit, p.value_type, r.reference_low, r.reference_high, r.textual_reference '
            'FROM test_parameters p LEFT JOIN parameter_ranges r ON p.id = r.parameter_id '
            'WHERE p.test_id = ? ORDER BY p.display_order',
            (t_id,)
        ).fetchall()
        print(f"  Test [{t_code}] {t_name}:")
        for p in params:
            print(f"    - {p[0]}: {p[1]} | Unit: '{p[2]}' | Range: [{p[4]} - {p[5]}] | Text: '{p[6]}'")

conn.close()
