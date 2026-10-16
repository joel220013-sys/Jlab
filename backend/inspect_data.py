import sqlite3

conn = sqlite3.connect('c:/Users/User/Downloads/blood/backend/pulselab.db')
cur = conn.cursor()
print("--- PATIENTS ---")
for row in cur.execute("SELECT id, uhid, full_name, phone FROM patients").fetchall():
    print(row)

print("--- ORDERS ---")
for row in cur.execute("SELECT id, order_number, lab_number, total_amount FROM orders").fetchall():
    print(row)
