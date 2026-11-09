import os
import sys
import json
import io
import time
import sqlite3

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

print("\n=== E-GYM PHASE 1 HANDLER & AUTH UNIT TESTS ===\n")

class CaseInsensitiveDict(dict):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._lower_map = {k.lower(): k for k in self.keys()}

    def get(self, key, default=None):
        lower_key = key.lower()
        if lower_key in self._lower_map:
            return self[self._lower_map[lower_key]]
        return default

    def __getitem__(self, key):
        return super().__getitem__(self._lower_map[key.lower()])

    def __setitem__(self, key, value):
        super().__setitem__(key, value)
        self._lower_map[key.lower()] = key

class MockServer:
    pass

class MockHandler(EGYMHandler):
    def __init__(self, method, path, headers=None, body=None):
        self.command = method
        self.path = path
        self.request_version = "HTTP/1.1"
        self.headers = CaseInsensitiveDict(headers or {})
        self.rfile = io.BytesIO(body if body else b"")
        self.wfile = io.BytesIO()
        self.server = MockServer()
        self.status_code = None
        self.response_headers = {}

    def send_response(self, code, message=None):
        self.status_code = code

    def send_header(self, keyword, value):
        self.response_headers[keyword.lower()] = value

    def end_headers(self):
        pass

    def send_error(self, code, message=None, explain=None):
        self.status_code = code
        if message:
            self.wfile.write(json.dumps({"error": message}).encode())

    def get_response_json(self):
        self.wfile.seek(0)
        content = self.wfile.read().decode("utf-8")
        try:
            return json.loads(content)
        except Exception:
            return content

# 1. Test GET /api/ranks
handler = MockHandler("GET", "/api/ranks")
handler.handle_get_ranks()
test("GET /api/ranks status is 200", handler.status_code == 200)
ranks = handler.get_response_json()
test("GET /api/ranks returns 9 ranks", isinstance(ranks, list) and len(ranks) == 9, f"Got {len(ranks) if isinstance(ranks, list) else ranks}")

# 2. Test Registration: /api/auth/register with unique handle
unique_id = int(time.time())
test_handle = f"marcus_{unique_id}"
reg_body = json.dumps({
    "name": "Marcus Aurelius",
    "handle": test_handle,
    "password": "StoicDiscipline2026!",
    "focus": "mind"
}).encode("utf-8")
handler = MockHandler("POST", "/api/auth/register", {"content-length": str(len(reg_body))}, reg_body)
handler.handle_post_register()
test("POST /api/auth/register status is 200", handler.status_code == 200, f"Status: {handler.status_code}")
reg_res = handler.get_response_json()
test("Registration returns session token", "token" in reg_res)
test("Registration returns member object", "member" in reg_res and reg_res["member"]["handle"] == f"@{test_handle}")
session_token = reg_res.get("token")

# Verify database row has hashed password (not plain text)
conn = sqlite3.connect(os.path.join(BASE_DIR, "egym.db"))
c = conn.cursor()
c.execute("SELECT password_hash, is_admin FROM members WHERE handle = ?", (f"@{test_handle}",))
row = c.fetchone()
conn.close()
test("Member password is saved as hash (not plaintext)", row is not None and row[0] != "StoicDiscipline2026!" and len(row[0]) >= 64)
test("Standard member has is_admin = 0", row is not None and row[1] == 0)

# 3. Test Login: Correct password
login_body = json.dumps({
    "identifier": test_handle,
    "password": "StoicDiscipline2026!"
}).encode("utf-8")
handler = MockHandler("POST", "/api/auth/login", {"content-length": str(len(login_body))}, login_body)
handler.handle_post_login()
test("POST /api/auth/login valid password status is 200", handler.status_code == 200)
login_res = handler.get_response_json()
test("Login returns valid session token", "token" in login_res and len(login_res["token"]) > 10)
active_token = login_res.get("token")

# 4. Test Login: Incorrect password
bad_login_body = json.dumps({
    "identifier": test_handle,
    "password": "WrongPassword!"
}).encode("utf-8")
handler = MockHandler("POST", "/api/auth/login", {"content-length": str(len(bad_login_body))}, bad_login_body)
handler.handle_post_login()
test("POST /api/auth/login bad password status is 401", handler.status_code == 401)

# 5. Test Active Session: GET /api/auth/session
handler = MockHandler("GET", "/api/auth/session", {"x-session-token": active_token})
handler.handle_get_session()
test("GET /api/auth/session status is 200", handler.status_code == 200)
sess_res = handler.get_response_json()
test("Active session returns member profile", "member" in sess_res and sess_res["member"].get("handle") == f"@{test_handle}")

# 6. Test Admin Audit: Non-admin candidate denied
handler = MockHandler("GET", "/api/ranks/audit", {"x-session-token": active_token})
handler.handle_get_audit()
test("Non-admin candidate accessing audit returns 403 Forbidden", handler.status_code == 403)

# 7. Test Admin Audit: Authorized with admin key
handler = MockHandler("GET", "/api/ranks/audit", {"x-admin-key": "egym_admin_2026"})
handler.handle_get_audit()
test("Admin audit accessible with authorized key returns 200", handler.status_code == 200)
audit_res = handler.get_response_json()
test("Admin audit payload contains ranks config and XP ledger", "ranks" in audit_res and "recentLedger" in audit_res)

# 8. Test Logout: POST /api/auth/logout
logout_body = b"{}"
handler = MockHandler("POST", "/api/auth/logout", {"x-session-token": active_token, "content-length": "2"}, logout_body)
handler.handle_post_logout()
test("POST /api/auth/logout status is 200", handler.status_code == 200)

# Verify session destroyed in DB
conn = sqlite3.connect(os.path.join(BASE_DIR, "egym.db"))
c = conn.cursor()
c.execute("SELECT COUNT(*) FROM member_sessions WHERE token = ?", (active_token,))
session_exists = c.fetchone()[0]
conn.close()
test("Session token is deleted from member_sessions upon logout", session_exists == 0)

print(f"\n=======================================================")
print(f"HANDLER RESULTS: {passed} PASSED, {failed} FAILED")
print(f"=======================================================\n")

if failed > 0:
    sys.exit(1)
