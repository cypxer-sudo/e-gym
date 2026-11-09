import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "egym.db")
SCHEMA_PATH = os.path.join(os.path.dirname(__file__), "schema.sql")

DEFAULT_RANKS = [
    ("recruit", 1, "Recruit", "Candidate of the First Step", "Starting rank for every new member. Setting the initial baseline.", "emblem_recruit", 0, 0, 0, 0, 0, 0, 0, "Initial enrollment"),
    ("initiate", 2, "Initiate", "First Flame of Consistency", "Demonstrates initial commitment, unbroken streaks, and deliberate action.", "emblem_initiate", 300, 0, 3, 3, 5, 2, 52, "5 objectives completed + 3-day streak"),
    ("aspirant", 3, "Aspirant", "Architect of Daily Rhythm", "Establishes daily habits, completes first flagship protocol, and logs reading or fitness work.", "emblem_aspirant", 750, 1, 7, 7, 10, 3, 55, "1 challenge completed + reading/workout log"),
    ("disciple", 4, "Disciple", "Multi-Dimensional Practitioner", "Demonstrates sustained discipline across at least four distinct dimensions.", "emblem_disciple", 1600, 1, 14, 14, 20, 4, 60, "1 focus session + 1 writing draft"),
    ("adept", 5, "Adept", "Mastery Under Resistance", "Measurable execution across five dimensions with proven consistency.", "emblem_adept", 3200, 2, 21, 28, 30, 5, 65, "2 challenges completed + 28 verified check-ins"),
    ("elite", 6, "Elite", "High-Performance Standard", "Consistently executes across physical, cognitive, and creative disciplines.", "emblem_elite", 6000, 3, 30, 45, 45, 6, 70, "3 challenges completed + 5 reading insights + 5 workouts"),
    ("master", 7, "Master", "The Unreal Crucible", "Advanced consistency and sustained high-leverage execution.", "emblem_master", 10500, 4, 45, 75, 60, 7, 75, "4 challenges completed + 75-Day standard cleared"),
    ("grandmaster", 8, "Grandmaster", "Holistic Human Apex", "Exceptional multi-year development across all eight human dimensions.", "emblem_grandmaster", 18000, 5, 60, 120, 80, 8, 80, "5 challenges completed + all 8 dimensions >= 80%"),
    ("legend", 9, "Legend", "The Living Benchmark", "Reserved for exceptional members demonstrating complete mastery.", "emblem_legend", 30000, 6, 75, 180, 100, 8, 85, "6 challenges completed + unbroken mastery across all departments")
]

def init_database():
    print(f"Creating local SQL database at: {DB_PATH}")
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.executescript(schema_sql)

    # Seed default ranks
    cursor.executemany("""
        INSERT OR REPLACE INTO ranks_config 
        (id, rank_order, title, tagline, description, emblem_key, min_xp, min_challenges, min_streak, min_checkins, min_objectives, min_dimensions_count, min_dimension_score, special_criteria_desc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, DEFAULT_RANKS)

    conn.commit()

    # Verify tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;")
    tables = [row[0] for row in cursor.fetchall()]
    print("\nSuccessfully initialized SQL database with tables:")
    for t in tables:
        print(f"  + {t}")

    cursor.execute("SELECT rank_order, title, min_xp FROM ranks_config ORDER BY rank_order;")
    print("\nConfigured Ranks Hierarchy:")
    for r in cursor.fetchall():
        print(f"  Rank #{r[0]}: {r[1]} ({r[2]} XP required)")

    conn.close()

if __name__ == "__main__":
    init_database()
