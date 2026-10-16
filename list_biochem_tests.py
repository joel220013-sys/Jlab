import sqlite3

conn = sqlite3.connect('backend/pulselab.db')
c = conn.cursor()

c.execute("""
    SELECT cat.name, t.code, t.name, COUNT(tp.id)
    FROM tests t
    JOIN test_categories cat ON t.category_id = cat.id
    LEFT JOIN test_parameters tp ON tp.test_id = t.id
    WHERE cat.name IN ('BIOCHEMISTRY', 'CLINICAL PATHOLOGY', 'CYTOLOGY')
    GROUP BY t.id
    ORDER BY cat.name, t.name
""")
rows = c.fetchall()

current_cat = ""
for cat, code, name, p_count in rows:
    if cat != current_cat:
        current_cat = cat
        print(f"\n=== {current_cat} ===")
    print(f"  {code:<18} | {name:<50} | {p_count} params")
