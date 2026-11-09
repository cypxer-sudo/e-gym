import http.server
import socketserver
import webbrowser
import os
import sys
import json
import sqlite3

PORT = 8000
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public") if os.path.exists(os.path.join(BASE_DIR, "public")) else BASE_DIR
DB_PATH = os.path.join(BASE_DIR, "egym.db")

class EGYMHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def end_headers(self):
        # Enable CORS for local testing
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, x-member-id, x-admin-key")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/ranks":
            self.handle_get_ranks()
        elif self.path == "/api/ranks/audit":
            self.handle_get_audit()
        elif self.path.startswith("/api/state"):
            self.handle_get_state()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/ranks":
            self.handle_post_ranks()
        elif self.path == "/api/state":
            self.handle_post_state()
        else:
            self.send_error(404, "Endpoint not found")

    def get_db(self):
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

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
        admin_key = self.headers.get("x-admin-key")
        if admin_key != "egym_admin_2026":
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b'{"error": "Unauthorized"}')
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
                "recentLedger": ledger
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
        admin_key = self.headers.get("x-admin-key")
        if admin_key != "egym_admin_2026":
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b'{"error": "Unauthorized"}')
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
                    INSERT OR IGNORE INTO rank_history (member_id, rank_id, trigger_reason, promoted_at)
                    VALUES (?, ?, ?, ?)
                """, (
                    member_id, h.get("rankId", "recruit"), h.get("triggerReason", ""),
                    h.get("promotedAt", "2026-11-09T00:00:00.000Z")
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

