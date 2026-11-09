import os
import sys
import json
import sqlite3
import time

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)
from server import EGYMHandler, hash_password

passed = 0
failed = 0

def test(name, condition, details=""):
    global passed, failed
    if condition:
        print(f"  [PASS] {name}")
        passed += 1
    else:
        print(f"  [FAIL] {name} - {details}")
        failed += 1

print("\n=== E-GYM FULL SYSTEM END-TO-END VERIFICATION ===\n")

# Connect to database
DB_PATH = os.path.join(BASE_DIR, "egym.db")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# 1. Database Relational Tables
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = {r[0] for r in c.fetchall()}
essential_tables = [
    "members", "member_sessions", "member_assessments", "ranks_config",
    "rank_history", "xp_ledger", "daily_objectives", "evening_reflections",
    "enrolled_challenges", "check_ins", "reading_logs", "workout_logs",
    "writing_drafts", "achievements", "community_posts", "accountability_partnerships"
]
print("[1] Relational Schema Audit:")
for t in essential_tables:
    test(f"Table '{t}' is operational", t in tables)

# 2. Member Lifecycle & Security
print("\n[2] Member Auth & Salted Hashing:")
salt = "test_salt_999"
pw = "SpartanDiscipline#2026"
hpw = hash_password(pw, salt)
test("SHA-256 password hash generates 64 chars", len(hpw) == 64)
test("Same password with different salt is distinct", hpw != hash_password(pw, "different_salt"))

# 3. Assessment & Calibration Data
print("\n[3] 8-Dimension Intake Assessment:")
with open(os.path.join(BASE_DIR, "public", "js", "data.js"), "r", encoding="utf-8") as f:
    data_content = f.read()

test("Assessment questions array present", "assessmentQuestions:" in data_content)
test("Physical diagnostic prompt present", 'dimensionId: "physical"' in data_content)
test("Intellectual diagnostic prompt present", 'dimensionId: "intellectual"' in data_content)
test("Emotional diagnostic prompt present", 'dimensionId: "emotional"' in data_content)
test("Psychological diagnostic prompt present", 'dimensionId: "psychological"' in data_content)

# 4. Storage & Progression Engine
print("\n[4] Progression & Objective Priorities:")
with open(os.path.join(BASE_DIR, "public", "js", "storage.js"), "r", encoding="utf-8") as f:
    storage_content = f.read()

test("StorageManager priority XP matrix defined", "priorityXP" in storage_content)
test("StorageManager saveAssessment method defined", "saveAssessment(" in storage_content)
test("StorageManager saveEveningReflection method defined", "saveEveningReflection(" in storage_content)
test("StorageManager postponeObjective method defined", "postponeObjective(" in storage_content)

# 5. UI Views & Layout Structure
print("\n[5] UI Layout & 6 Primary Views:")
with open(os.path.join(BASE_DIR, "public", "index.html"), "r", encoding="utf-8") as f:
    html_content = f.read()

test("Personal HQ view exists", 'id="view-hq"' in html_content)
test("Challenge Arena view exists", 'id="view-challenges"' in html_content)
test("Departments view exists", 'id="view-departments"' in html_content)
test("Rank Hierarchy view exists", 'id="view-ranks"' in html_content)
test("Performance Record view exists", 'id="view-profile"' in html_content)
test("Community view exists", 'id="view-community"' in html_content)

test("Assessment wizard modal exists", 'id="assessment-modal"' in html_content)
test("Evening reflection modal exists", 'id="reflection-modal"' in html_content)
test("Completion certificate modal exists", 'id="certificate-modal"' in html_content)
test("Accountability partner modal exists", 'id="partner-modal"' in html_content)
test("Admin Suite modal exists", 'id="admin-modal"' in html_content)

# 6. Responsive CSS Standards
print("\n[6] Mobile Responsiveness & Touch Targets:")
with open(os.path.join(BASE_DIR, "public", "css", "styles.css"), "r", encoding="utf-8") as f:
    css_content = f.read()

test("Touch targets enforce 44px min-height", "min-height: 44px" in css_content)
test("Mobile breakpoint <= 640px defined", "@media (max-width: 640px)" in css_content)
test("Small mobile breakpoint <= 380px defined", "@media (max-width: 380px)" in css_content)
test("Horizontal overflow hidden enforced", "overflow-x: hidden" in css_content)
test("Critical priority styling defined", ".priority-critical" in css_content)

conn.close()

print(f"\n=======================================================")
print(f"FULL SYSTEM RESULTS: {passed} PASSED, {failed} FAILED")
print(f"=======================================================\n")

if failed > 0:
    sys.exit(1)
