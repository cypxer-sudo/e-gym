import os
import sys
import json
import sqlite3

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(BASE_DIR, "public", "index.html")
APP_JS_PATH = os.path.join(BASE_DIR, "public", "js", "app.js")
DATA_JS_PATH = os.path.join(BASE_DIR, "public", "js", "data.js")
STORAGE_JS_PATH = os.path.join(BASE_DIR, "public", "js", "storage.js")
SERVER_PY_PATH = os.path.join(BASE_DIR, "server.py")
WORKER_JS_PATH = os.path.join(BASE_DIR, "worker.js")
DB_PATH = os.path.join(BASE_DIR, "egym.db")

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

print("\n=== E-GYM PHASE 2 COMPREHENSIVE VERIFICATION SUITE ===\n")

# 1. Database Table Verification
print("[1] Database Tables for Phase 2:")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = {row[0] for row in c.fetchall()}
test("Table 'member_assessments' exists", "member_assessments" in tables)
test("Table 'evening_reflections' exists", "evening_reflections" in tables)
test("Table 'daily_objectives' exists", "daily_objectives" in tables)
conn.close()

# 2. Data & Assessment Questions Verification
print("\n[2] Data Seed & Questions Verification:")
with open(DATA_JS_PATH, "r", encoding="utf-8") as f:
    data_js = f.read()

test("EGYM_DATA.assessmentQuestions defined", "assessmentQuestions:" in data_js)
dimensions = ["physical", "intellectual", "emotional", "psychological", "social", "financial", "professional", "creative"]
for d in dimensions:
    test(f"Assessment question for dimension '{d}' exists", f'dimensionId: "{d}"' in data_js)

test("INITIAL_MEMBER_STATE has 'assessmentCompleted: false'", "assessmentCompleted: false" in data_js)
test("INITIAL_MEMBER_STATE has 'eveningReflections: []'", "eveningReflections: []" in data_js)

# 3. HTML Elements for Onboarding & HQ
print("\n[3] Frontend Layout & Modals Verification:")
with open(INDEX_PATH, "r", encoding="utf-8") as f:
    html_content = f.read()

test("HQ Assessment banner exists", 'id="hq-assessment-banner"' in html_content)
test("HQ Evening reflection card exists", 'id="hq-evening-reflection-card"' in html_content)
test("Add Objective modal has priority selector", 'id="new-obj-priority"' in html_content)
test("Add Objective modal has due window input", 'id="new-obj-due"' in html_content)
test("Assessment modal '#assessment-modal' exists", 'id="assessment-modal"' in html_content)
test("Reflection modal '#reflection-modal' exists", 'id="reflection-modal"' in html_content)
test("Reflection modal has 3 reflection inputs", 'id="refl-win"' in html_content and 'id="refl-friction"' in html_content and 'id="refl-tomorrow"' in html_content)

# 4. Storage & State Logic
print("\n[4] Storage & State Logic Verification:")
with open(STORAGE_JS_PATH, "r", encoding="utf-8") as f:
    storage_js = f.read()

test("StorageManager.saveAssessment method exists", "saveAssessment(" in storage_js)
test("StorageManager.saveEveningReflection method exists", "saveEveningReflection(" in storage_js)
test("StorageManager.postponeObjective method exists", "postponeObjective(" in storage_js)
test("StorageManager.deleteTodayObjective method exists", "deleteTodayObjective(" in storage_js)
test("Priority XP weighting applied in updateTodayObjective", "priorityXP" in storage_js)

# 5. App Controllers & Flow
print("\n[5] Application Controller Verification:")
with open(APP_JS_PATH, "r", encoding="utf-8") as f:
    app_js = f.read()

test("App.openAssessmentModal method exists", "openAssessmentModal()" in app_js)
test("App.renderAssessmentWizard method exists", "renderAssessmentWizard()" in app_js)
test("App.selectAssessmentOption method exists", "selectAssessmentOption(" in app_js)
test("App.finalizeAssessment method exists", "finalizeAssessment()" in app_js)
test("App.openReflectionModal method exists", "openReflectionModal()" in app_js)
test("App.submitEveningReflection method exists", "submitEveningReflection()" in app_js)
test("App.postponeObjective method exists", "postponeObjective(" in app_js)
test("App.deleteObjective method exists", "deleteObjective(" in app_js)
test("App.renderHQ renders priority tags", "badge-priority" in app_js)
test("App.renderHQ toggles assessment banner", "hq-assessment-banner" in app_js)
test("App.renderHQ toggles evening reflection card", "hq-evening-reflection-card" in app_js or "hq-reflection-badge" in app_js)

# 6. Backend Synchronization Logic
print("\n[6] Backend Edge & Local Sync Verification:")
with open(SERVER_PY_PATH, "r", encoding="utf-8") as f:
    server_py = f.read()

test("server.py syncs member_assessments", "member_assessments" in server_py)
test("server.py syncs evening_reflections", "evening_reflections" in server_py)
test("server.py syncs daily_objectives priority & due_time", "due_time" in server_py and "priority" in server_py)

with open(WORKER_JS_PATH, "r", encoding="utf-8") as f:
    worker_js = f.read()

test("worker.js syncs member_assessments", "member_assessments" in worker_js)
test("worker.js syncs evening_reflections", "evening_reflections" in worker_js)
test("worker.js syncs daily_objectives priority & due_time", "due_time" in worker_js and "priority" in worker_js)

print(f"\n=======================================================")
print(f"PHASE 2 RESULTS: {passed} PASSED, {failed} FAILED")
print(f"=======================================================\n")

if failed > 0:
    sys.exit(1)
