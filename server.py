import http.server
import socketserver
import webbrowser
import os
import sys
import json
import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public") if os.path.exists(os.path.join(BASE_DIR, "public")) else BASE_DIR
DB_PATH = os.path.join(BASE_DIR, "egym.db")

def hash_password(password, salt):
    data = f"{salt}:{password}:egym_unreal_salt_2026".encode("utf-8")
    return hashlib.sha256(data).hexdigest()

class EGYMHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for local testing
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, x-member-id, x-admin-key, x-session-token, Authorization")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/auth/session":
            self.handle_get_session()
        elif self.path == "/api/ranks":
            self.handle_get_ranks()
        elif self.path == "/api/ranks/audit":
            self.handle_get_audit()
        elif self.path.startswith("/api/state"):
            self.handle_get_state()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/auth/register":
            self.handle_post_register()
        elif self.path == "/api/auth/login":
            self.handle_post_login()
        elif self.path == "/api/auth/logout":
            self.handle_post_logout()
        elif self.path == "/api/ranks":
            self.handle_post_ranks()
        elif self.path == "/api/state":
            self.handle_post_state()
        else:
            self.send_error(404, "Endpoint not found")

    def get_db(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def get_authenticated_member(self):
        token = self.headers.get("x-session-token") or self.headers.get("Authorization", "").replace("Bearer ", "")
        if not token:
            return None
        try:
            conn = self.get_db()
            c = conn.cursor()
            c.execute("""
                SELECT m.id, m.name, m.handle, m.current_rank_id, m.tier, m.is_admin, m.privacy_mode
                FROM member_sessions s
                JOIN members m ON s.member_id = m.id
                WHERE s.token = ? AND s.expires_at > datetime('now')
            """, (token,))
            row = c.fetchone()
            conn.close()
            return dict(row) if row else None
        except Exception:
            return None

    def handle_post_register(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            name = body.get("name", "").strip()
            handle = body.get("handle", "").strip().lower()
            password = body.get("password", "")
            focus = body.get("focus", "execution")

            if not name or not handle or not password:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error": "Missing required fields"}')
                return

            clean_handle = handle if handle.startswith("@") else f"@{handle}"
            conn = self.get_db()
            c = conn.cursor()

            # Check handle
            c.execute("SELECT id FROM members WHERE handle = ?", (clean_handle,))
            if c.fetchone():
                conn.close()
                self.send_response(409)
                self.end_headers()
                self.wfile.write(b'{"error": "Handle already claimed by another candidate"}')
                return

            salt = secrets.token_hex(8)
            pw_hash = f"{salt}${hash_password(password, salt)}"
            member_id = f"mem_{secrets.token_hex(8)}"
            is_admin = 1 if clean_handle in ("@admin", "@founder") else 0

            c.execute("""
                INSERT INTO members (id, name, handle, title, current_rank_id, tier, bio, password_hash, is_admin, privacy_mode)
                VALUES (?, ?, ?, 'Candidate', 'recruit', 'Explorer', ?, ?, ?, 'private')
            """, (member_id, name, clean_handle, f"Committed to developing every dimension. Focused on {focus}.", pw_hash, is_admin))

            token = f"egym_tok_{secrets.token_hex(16)}"
            expires_at = (datetime.now() + timedelta(days=30)).isoformat()
            c.execute("INSERT INTO member_sessions (token, member_id, expires_at) VALUES (?, ?, ?)", (token, member_id, expires_at))

            conn.commit()
            conn.close()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "token": token,
                "member": {
                    "id": member_id,
                    "name": name,
                    "handle": clean_handle,
                    "currentRankId": "recruit",
                    "tier": "Explorer",
                    "isAdmin": is_admin == 1
                }
            }).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def handle_post_login(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length).decode("utf-8"))
            identifier = body.get("identifier", "").strip().lower()
            password = body.get("password", "")

            clean_id = identifier if identifier.startswith("@") else f"@{identifier}"
            conn = self.get_db()
            c = conn.cursor()
            c.execute("""
                SELECT id, name, handle, current_rank_id, tier, password_hash, is_admin
                FROM members WHERE handle = ? OR id = ?
            """, (clean_id, identifier))
            row = c.fetchone()

            if not row:
                conn.close()
                self.send_response(401)
                self.end_headers()
                self.wfile.write(b'{"error": "Invalid credentials: Candidate not found"}')
                return

            member = dict(row)
            if member.get("password_hash"):
                parts = member["password_hash"].split("$")
                if len(parts) == 2:
                    salt, expected_hash = parts
                    if hash_password(password, salt) != expected_hash:
                        conn.close()
                        self.send_response(401)
                        self.end_headers()
                        self.wfile.write(b'{"error": "Invalid credentials: Passcode does not match"}')
                        return

            token = f"egym_tok_{secrets.token_hex(16)}"
            expires_at = (datetime.now() + timedelta(days=30)).isoformat()
            c.execute("INSERT INTO member_sessions (token, member_id, expires_at) VALUES (?, ?, ?)", (token, member["id"], expires_at))
            conn.commit()
            conn.close()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "success": True,
                "token": token,
                "member": {
                    "id": member["id"],
                    "name": member["name"],
                    "handle": member["handle"],
                    "currentRankId": member.get("current_rank_id", "recruit"),
                    "tier": member.get("tier", "Explorer"),
                    "isAdmin": member.get("is_admin") == 1
                }
            }).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def handle_get_session(self):
        auth_member = self.get_authenticated_member()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        if auth_member:
            self.wfile.write(json.dumps({"authenticated": True, "member": auth_member}).encode("utf-8"))
        else:
            self.wfile.write(b'{"authenticated": false}')

    def handle_post_logout(self):
        token = self.headers.get("x-session-token") or self.headers.get("Authorization", "").replace("Bearer ", "")
        if token:
            conn = self.get_db()
            c = conn.cursor()
            c.execute("DELETE FROM member_sessions WHERE token = ?", (token,))
            conn.commit()
            conn.close()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"success": true}')

    def handle_get_ranks(self):
        try:
            conn = self.get_db()
            c = conn.cursor()
            c.execute("SELECT * FROM ranks_config WHERE is_active = 1 ORDER BY rank_order ASC")
            ranks = [dict(row) for row in c.fetchall()]
            conn.close()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(ranks).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def handle_get_audit(self):
        auth_member = self.get_authenticated_member()
        is_admin = auth_member and auth_member.get("is_admin") == 1
        admin_key = self.headers.get("x-admin-key")
        is_secret = admin_key == "egym_admin_2026"

        if not is_admin and not is_secret:
            status_code = 403 if auth_member else 401
            self.send_response(status_code)
            self.end_headers()
            self.wfile.write(b'{"error": "Unauthorized: Admin privileges required"}')
            return

        try:
            conn = self.get_db()
            c = conn.cursor()
            c.execute("SELECT * FROM ranks_config ORDER BY rank_order ASC")
            ranks = [dict(r) for r in c.fetchall()]

            c.execute("SELECT m.id, m.name, m.handle, m.current_rank_id, s.unreal_points, s.current_streak, s.total_objectives_done FROM members m LEFT JOIN member_stats s ON m.id = s.member_id ORDER BY s.unreal_points DESC LIMIT 50")
            members = [dict(r) for r in c.fetchall()]

            c.execute("SELECT id, member_id, amount, source_type, description, verified, created_at FROM xp_ledger ORDER BY created_at DESC LIMIT 100")
            ledger = [dict(r) for r in c.fetchall()]
            conn.close()

            data = {
                "serverTime": "2026-11-09T00:00:00.000Z",
                "ranks": ranks,
                "members": members,
                "recentLedger": ledger,
                "ledger": ledger
            }
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(data).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def handle_get_state(self):
        member_id = self.headers.get("x-member-id")
        if not member_id:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'{"error": "Missing x-member-id header"}')
            return

        try:
            conn = self.get_db()
            c = conn.cursor()
            c.execute("SELECT state_json FROM members WHERE id = ?", (member_id,))
            row = c.fetchone()
            conn.close()

            if row and row["state_json"]:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(row["state_json"].encode("utf-8"))
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(b'{"error": "Member not found"}')
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def handle_post_ranks(self):
        auth_member = self.get_authenticated_member()
        is_admin = auth_member and auth_member.get("is_admin") == 1
        admin_key = self.headers.get("x-admin-key")
        is_secret = admin_key == "egym_admin_2026"

        if not is_admin and not is_secret:
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b'{"error": "Unauthorized: Admin privileges required"}')
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            payload = json.loads(body.decode("utf-8"))
            ranks_list = payload if isinstance(payload, list) else [payload]

            conn = self.get_db()
            c = conn.cursor()
            for r in ranks_list:
                c.execute("""
                    INSERT INTO ranks_config 
                    (id, rank_order, title, tagline, description, min_xp, min_challenges, min_streak, min_checkins, min_objectives, min_dimensions_count, min_dimension_score, special_criteria_desc, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                    ON CONFLICT(id) DO UPDATE SET
                        title=excluded.title,
                        tagline=excluded.tagline,
                        min_xp=excluded.min_xp,
                        min_challenges=excluded.min_challenges,
                        min_streak=excluded.min_streak,
                        min_objectives=excluded.min_objectives,
                        min_dimensions_count=excluded.min_dimensions_count,
                        min_dimension_score=excluded.min_dimension_score
                """, (
                    r["id"], r.get("rank_order", r.get("level", 1)), r["title"], r.get("tagline", ""),
                    r.get("description", ""), r.get("min_xp", 0), r.get("min_challenges", 0),
                    r.get("min_streak", 0), r.get("min_checkins", 0), r.get("min_objectives", 0),
                    r.get("min_dimensions_count", 0), r.get("min_dimension_score", 0),
                    r.get("special_criteria_desc", "")
                ))
            conn.commit()
            conn.close()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "count": len(ranks_list)}).encode("utf-8"))
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

    def handle_post_state(self):
        member_id = self.headers.get("x-member-id")
        if not member_id:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'{"error": "Missing x-member-id header"}')
            return

        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            state = json.loads(body.decode("utf-8"))

            profile = state.get("profile", {})
            stats = state.get("stats", {})
            current_rank_id = state.get("currentRankId", "recruit")

            conn = self.get_db()
            c = conn.cursor()

            # Upsert member
            c.execute("""
                INSERT INTO members (id, name, handle, bio, tier, current_rank_id, state_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name=excluded.name,
                    handle=excluded.handle,
                    bio=excluded.bio,
                    tier=excluded.tier,
                    current_rank_id=excluded.current_rank_id,
                    state_json=excluded.state_json,
                    updated_at=CURRENT_TIMESTAMP
            """, (
                member_id, profile.get("name", "New Member"), profile.get("handle", "@initiate"),
                profile.get("bio", ""), profile.get("tier", "Explorer"), current_rank_id,
                json.dumps(state)
            ))

            # Upsert stats
            c.execute("""
                INSERT INTO member_stats (member_id, unreal_points, current_streak, longest_streak, total_objectives_done, completion_rate)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(member_id) DO UPDATE SET
                    unreal_points=excluded.unreal_points,
                    current_streak=excluded.current_streak,
                    longest_streak=excluded.longest_streak,
                    total_objectives_done=excluded.total_objectives_done,
                    completion_rate=excluded.completion_rate,
                    updated_at=CURRENT_TIMESTAMP
            """, (
                member_id, stats.get("unrealPoints", 0), stats.get("currentStreak", 0),
                stats.get("longestStreak", 0), stats.get("totalObjectivesDone", 0),
                stats.get("completionRate", 0)
            ))

            # Batch ledger entries
            ledger = state.get("xpLedger", [])
            for entry in ledger[:25]:
                tx_id = entry.get("txId", f"tx_{member_id}_{os.urandom(4).hex()}")
                c.execute("""
                    INSERT OR IGNORE INTO xp_ledger (id, member_id, amount, source_type, source_id, description, verified)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    tx_id, member_id, entry.get("amount", 0), entry.get("sourceType", "system"),
                    entry.get("sourceId"), entry.get("desc", ""), 1 if entry.get("verified", True) else 0
                ))

            # Save rank history
            rank_history = state.get("rankHistory", [])
            for h in rank_history:
                c.execute("""
                    INSERT OR IGNORE INTO rank_history (id, member_id, rank_id, rank_title, unlocked_at, achieved_xp, notes)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    h.get("id", f"rh_{member_id}_{h.get('rankId', 'recruit')}"),
                    member_id, h.get("rankId", "recruit"), h.get("rankTitle", "Recruit"),
                    h.get("promotedAt", "2026-11-09T00:00:00.000Z"), h.get("achievedXp", 0),
                    h.get("notes", "Verified progression")
                ))

            # Save assessment if present
            assessment = state.get("assessment")
            if assessment and state.get("assessmentCompleted"):
                c.execute("""
                    INSERT INTO member_assessments (id, member_id, answers_json, baseline_radar_json, priority_dimensions, completed_at)
                    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(id) DO UPDATE SET
                        answers_json=excluded.answers_json,
                        baseline_radar_json=excluded.baseline_radar_json,
                        priority_dimensions=excluded.priority_dimensions,
                        completed_at=CURRENT_TIMESTAMP
                """, (
                    f"asmt_{member_id}", member_id,
                    json.dumps(assessment.get("answers", {})),
                    json.dumps(assessment.get("baselineRadar", {})),
                    json.dumps(assessment.get("priorityDimensions", []))
                ))

            # Save evening reflections
            evening_reflections = state.get("eveningReflections", [])
            for ref in evening_reflections[:7]:
                c.execute("""
                    INSERT INTO evening_reflections (id, member_id, reflection_date, win_summary, friction_summary, tomorrow_target, xp_awarded, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(member_id, reflection_date) DO UPDATE SET
                        win_summary=excluded.win_summary,
                        friction_summary=excluded.friction_summary,
                        tomorrow_target=excluded.tomorrow_target,
                        xp_awarded=excluded.xp_awarded
                """, (
                    ref.get("id", f"ref_{member_id}_{ref.get('reflectionDate')}"),
                    member_id, ref.get("reflectionDate", "2026-11-09"),
                    ref.get("winSummary", ""), ref.get("frictionSummary", ""),
                    ref.get("tomorrowTarget", ""), ref.get("xpAwarded", 25)
                ))

            # Save daily objectives
            today_objectives = state.get("todayObjectives", [])
            for obj in today_objectives[:15]:
                c.execute("""
                    INSERT INTO daily_objectives (id, member_id, title, dimension, priority, time_est, due_time, postponed_count, completed, objective_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        title=excluded.title,
                        dimension=excluded.dimension,
                        priority=excluded.priority,
                        time_est=excluded.time_est,
                        due_time=excluded.due_time,
                        postponed_count=excluded.postponed_count,
                        completed=excluded.completed
                """, (
                    obj.get("id"), member_id, obj.get("title", ""),
                    obj.get("dimension", "execution"), obj.get("priority", "medium"),
                    obj.get("timeEst", "15m"), obj.get("dueTime", "Today"),
                    obj.get("postponedCount", 0), 1 if obj.get("completed") else 0,
                    obj.get("date", "2026-11-09")
                ))

            conn.commit()
            conn.close()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"success": true}')
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))

def start_server():
    global PORT
    for attempt in range(5):
        try:
            with socketserver.TCPServer(("", PORT), EGYMHandler) as httpd:
                url = f"http://localhost:{PORT}"
                print("=" * 65)
                print("  E-GYM — Institutional Self-Development Platform")
                print("  BECOME UNREAL. TRAIN EVERY DIMENSION.")
                print("=" * 65)
                print(f"  * Serving at: {url}")
                print(f"  * Static files: {PUBLIC_DIR}")
                print(f"  * Local SQLite Edge DB: {DB_PATH}")
                print("  * Endpoints active:")
                print("    - GET  /api/ranks")
                print("    - POST /api/ranks")
                print("    - GET  /api/ranks/audit")
                print("    - GET  /api/state")
                print("    - POST /api/state")
                print("  * Press Ctrl+C in this terminal to stop the server.")
                print("=" * 65)
                
                try:
                    webbrowser.open(url)
                except Exception as e:
                    pass
                
                httpd.serve_forever()
        except OSError as e:
            if getattr(e, "winerror", None) == 10048 or getattr(e, "errno", None) == 98:
                PORT += 1
                continue
            raise

if __name__ == "__main__":
    try:
        start_server()
    except KeyboardInterrupt:
        print("\nE-GYM Server stopped safely.")
        sys.exit(0)

