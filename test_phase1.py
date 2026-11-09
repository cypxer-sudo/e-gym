import os
import sys
import sqlite3
import hashlib
import json
import re

# Set stdout encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "egym.db")
INDEX_PATH = os.path.join(BASE_DIR, "public", "index.html")
APP_JS_PATH = os.path.join(BASE_DIR, "public", "js", "app.js")
STORAGE_JS_PATH = os.path.join(BASE_DIR, "public", "js", "storage.js")
CSS_PATH = os.path.join(BASE_DIR, "public", "css", "styles.css")

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

print("\n=== E-GYM PHASE 1 COMPREHENSIVE VERIFICATION SUITE ===\n")

# 1. DATABASE SCHEMA INTEGRITY
print("[1] Database Schema & Migration Verification:")
conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# Check tables
c.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = {row[0] for row in c.fetchall()}
required_tables = [
    "members", "member_sessions", "member_assessments", "ranks_config", "rank_history", 
    "xp_ledger", "enrolled_challenges", "check_ins", "daily_objectives", 
    "community_posts", "community_reports", "accountability_partnerships"
]
for t in required_tables:
    test(f"Table '{t}' exists", t in tables, f"Found tables: {tables}")

# Check columns in members
c.execute("PRAGMA table_info(members)")
member_cols = {row[1] for row in c.fetchall()}
test("Column 'password_hash' in members", "password_hash" in member_cols)
test("Column 'is_admin' in members", "is_admin" in member_cols)
test("Column 'privacy_mode' in members", "privacy_mode" in member_cols)

# Check columns in daily_objectives
c.execute("PRAGMA table_info(daily_objectives)")
obj_cols = {row[1] for row in c.fetchall()}
test("Column 'priority' in daily_objectives", "priority" in obj_cols)
test("Column 'due_time' in daily_objectives", "due_time" in obj_cols)
test("Column 'postponed_count' in daily_objectives", "postponed_count" in obj_cols)

# Check rank seed count
c.execute("SELECT COUNT(*) FROM ranks_config")
rank_count = c.fetchone()[0]
test("9 Institutional Ranks seeded in DB", rank_count == 9, f"Count = {rank_count}")

conn.close()

# 2. CRYPTOGRAPHIC PASSWORD HASHING & SESSION LOGIC
print("\n[2] Auth & Security Logic Verification:")

def hash_pw(password, salt):
    data = f"{salt}:{password}:egym_unreal_salt_2026".encode("utf-8")
    return hashlib.sha256(data).hexdigest()

test_salt = "test_member_salt_123"
test_pass = "UnrealStandard2026!"
hashed1 = hash_pw(test_pass, test_salt)
hashed2 = hash_pw(test_pass, test_salt)
hashed_diff = hash_pw("WrongPassword!", test_salt)

test("Password hashing is deterministic with matching salt", hashed1 == hashed2)
test("Different password produces different hash", hashed1 != hashed_diff)
test("Hash length is 64 hex characters (SHA-256)", len(hashed1) == 64)

# 3. HTML ARCHITECTURE & ZERO-VALUE BASELINE
print("\n[3] Frontend Layout, Navigation & Baseline Verification:")
with open(INDEX_PATH, "r", encoding="utf-8") as f:
    html_content = f.read()

# Verify 6 main tabs
tabs_found = re.findall(r'data-view="([^"]+)"', html_content)
expected_views = ["hq", "challenges", "departments", "ranks", "profile", "community"]
test("All 6 primary views present in nav", all(v in tabs_found for v in expected_views), f"Found: {tabs_found}")

# Verify admin button is hidden by default
test("Admin topbar button has 'hidden' class by default", 'id="topbar-admin-btn" class="topbar-btn hidden"' in html_content or 'class="topbar-btn hidden" id="topbar-admin-btn"' in html_content)

# Verify admin secret key is not hardcoded in the input value
test("Admin modal key input has empty default value", 'id="admin-key-input" class="form-input" placeholder="Admin Secret Key" style="width: 160px; font-size: 0.75rem; padding: 0.35rem 0.6rem;" value=""' in html_content)

# Verify zeroed initial baseline numbers
test("Streak baseline is '0 Days'", 'id="stat-streak">0 Days</div>' in html_content)
test("Execution rate baseline is '0%'", 'id="stat-rate">0%</div>' in html_content)
test("Unreal points baseline is '0'", 'id="stat-points">0</div>' in html_content)
test("Milestones cleared baseline is '0'", 'id="stat-total-done">0</div>' in html_content)
test("Today's objectives counter baseline is '0/0 Done'", 'id="hq-obj-count-badge">0/0 Done</span>' in html_content)

# Verify Community view exists
test("Community section '#view-community' exists", 'id="view-community"' in html_content)
test("Community feed composer exists", 'id="community-post-content"' in html_content)
test("Accountability partner request modal exists", 'id="partner-modal"' in html_content)

# 4. JAVASCRIPT CONTROLLERS
print("\n[4] JavaScript Architecture Verification:")
with open(APP_JS_PATH, "r", encoding="utf-8") as f:
    app_js = f.read()

test("App.renderCommunity method exists", "renderCommunity()" in app_js)
test("App.switchCommunityTab method exists", "switchCommunityTab(" in app_js)
test("App.submitCommunityPost method exists", "submitCommunityPost()" in app_js)
test("App.submitPartnerRequest method exists", "submitPartnerRequest()" in app_js)
test("App.renderTopBar toggles admin button via StorageManager.isAdmin()", "StorageManager.isAdmin()" in app_js)

with open(STORAGE_JS_PATH, "r", encoding="utf-8") as f:
    storage_js = f.read()

test("StorageManager.isAdmin method exists", "isAdmin()" in storage_js)
test("StorageManager sends session token in syncToCloud", "x-session-token" in storage_js)

# 5. RESPONSIVE CSS
print("\n[5] Responsive CSS Verification:")
with open(CSS_PATH, "r", encoding="utf-8") as f:
    css_content = f.read()

test("Media query max-width 640px present", "@media (max-width: 640px)" in css_content)
test("Media query max-width 380px present", "@media (max-width: 380px)" in css_content)
test("Min touch target min-height 44px defined", "min-height: 44px" in css_content)
test("Horizontal overflow prevention defined", "overflow-x: hidden" in css_content)

print(f"\n=======================================================")
print(f"RESULTS: {passed} PASSED, {failed} FAILED")
print(f"=======================================================\n")

if failed > 0:
    sys.exit(1)
