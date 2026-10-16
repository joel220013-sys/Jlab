import sqlite3

conn = sqlite3.connect('backend/pulselab.db')
c = conn.cursor()
c.execute("""
    SELECT t.code, t.name, cat.name 
    FROM tests t 
    LEFT JOIN test_categories cat ON t.category_id = cat.id 
    WHERE cat.name IN ('HEMATOLOGY', 'CLINICAL PATHOLOGY')
    ORDER BY t.name
""")
for r in c.fetchall():
    print(r)
