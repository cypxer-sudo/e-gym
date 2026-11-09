import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "egym.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

def init_database():
    print(f"Creating local SQL database at: {DB_PATH}")
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.executescript(schema_sql)
    conn.commit()

    # Verify tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall()]
    print("\nSuccessfully initialized SQL database with tables:")
    for t in tables:
        print(f"  + {t}")
    conn.close()

if __name__ == "__main__":
    init_database()
