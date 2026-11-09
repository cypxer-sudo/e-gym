// E-GYM Cloudflare Unified Edge Worker
// Handles serverless D1 SQL database API routes, Rank Progression Engine & serves static frontend assets

const DEFAULT_RANKS = [
  { id: "recruit", rank_order: 1, title: "Recruit", tagline: "Candidate of the First Step", description: "Starting rank for every new member. Setting the initial baseline.", emblem_key: "emblem_recruit", min_xp: 0, min_challenges: 0, min_streak: 0, min_checkins: 0, min_objectives: 0, min_dimensions_count: 0, min_dimension_score: 0, special_criteria_desc: "Initial enrollment" },
  { id: "initiate", rank_order: 2, title: "Initiate", tagline: "First Flame of Consistency", description: "Demonstrates initial commitment, unbroken streaks, and deliberate action.", emblem_key: "emblem_initiate", min_xp: 300, min_challenges: 0, min_streak: 3, min_checkins: 3, min_objectives: 5, min_dimensions_count: 2, min_dimension_score: 52, special_criteria_desc: "5 objectives completed + 3-day streak" },
  { id: "aspirant", rank_order: 3, title: "Aspirant", tagline: "Architect of Daily Rhythm", description: "Establishes daily habits, completes first flagship protocol, and logs reading or fitness work.", emblem_key: "emblem_aspirant", min_xp: 750, min_challenges: 1, min_streak: 7, min_checkins: 7, min_objectives: 10, min_dimensions_count: 3, min_dimension_score: 55, special_criteria_desc: "1 challenge completed + reading/workout log" },
  { id: "disciple", rank_order: 4, title: "Disciple", tagline: "Multi-Dimensional Practitioner", description: "Demonstrates sustained discipline across at least four distinct dimensions.", emblem_key: "emblem_disciple", min_xp: 1600, min_challenges: 1, min_streak: 14, min_checkins: 14, min_objectives: 20, min_dimensions_count: 4, min_dimension_score: 60, special_criteria_desc: "1 focus session + 1 writing draft" },
  { id: "adept", rank_order: 5, title: "Adept", tagline: "Mastery Under Resistance", description: "Measurable execution across five dimensions with proven consistency.", emblem_key: "emblem_adept", min_xp: 3200, min_challenges: 2, min_streak: 21, min_checkins: 28, min_objectives: 30, min_dimensions_count: 5, min_dimension_score: 65, special_criteria_desc: "2 challenges completed + 28 verified check-ins" },
  { id: "elite", rank_order: 6, title: "Elite", tagline: "High-Performance Standard", description: "Consistently executes across physical, cognitive, and creative disciplines.", emblem_key: "emblem_elite", min_xp: 6000, min_challenges: 3, min_streak: 30, min_checkins: 45, min_objectives: 45, min_dimensions_count: 6, min_dimension_score: 70, special_criteria_desc: "3 challenges completed + 5 reading insights + 5 workouts" },
  { id: "master", rank_order: 7, title: "Master", tagline: "The Unreal Crucible", description: "Advanced consistency and sustained high-leverage execution.", emblem_key: "emblem_master", min_xp: 10500, min_challenges: 4, min_streak: 45, min_checkins: 75, min_objectives: 60, min_dimensions_count: 7, min_dimension_score: 75, special_criteria_desc: "4 challenges completed + 75-Day standard cleared" },
  { id: "grandmaster", rank_order: 8, title: "Grandmaster", tagline: "Holistic Human Apex", description: "Exceptional multi-year development across all eight human dimensions.", emblem_key: "emblem_grandmaster", min_xp: 18000, min_challenges: 5, min_streak: 60, min_checkins: 120, min_objectives: 80, min_dimensions_count: 8, min_dimension_score: 80, special_criteria_desc: "5 challenges completed + all 8 dimensions >= 80%" },
  { id: "legend", rank_order: 9, title: "Legend", tagline: "The Living Benchmark", description: "Reserved for exceptional members demonstrating complete mastery.", emblem_key: "emblem_legend", min_xp: 30000, min_challenges: 6, min_streak: 75, min_checkins: 180, min_objectives: 100, min_dimensions_count: 8, min_dimension_score: 85, special_criteria_desc: "6 challenges completed + unbroken mastery across all departments" }
];

// Cryptographic Edge Auth Helpers
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}:egym_unreal_salt_2026`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const hashArr = Array.from(new Uint8Array(digest));
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return "egym_tok_" + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getAuthenticatedMember(request, env) {
  const token = request.headers.get("x-session-token") || 
    (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  
  if (!token || !env || !env.DB) return null;

  try {
    const row = await env.DB.prepare(`
      SELECT m.id, m.name, m.handle, m.current_rank_id, m.tier, m.is_admin, m.privacy_mode
      FROM member_sessions s
      JOIN members m ON s.member_id = m.id
      WHERE s.token = ?1 AND s.expires_at > CURRENT_TIMESTAMP
    `).bind(token).first();

    return row || null;
  } catch (e) {
    return null;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, x-member-id, x-admin-key, x-session-token, Authorization"
        }
      });
    }

    // -----------------------------------------------------------
    // Route: /api/auth/register (POST)
    // -----------------------------------------------------------
    if (url.pathname === "/api/auth/register" && request.method === "POST") {
      try {
        const body = await request.json();
        const { name, handle, email, password, focus } = body;

        if (!name || !handle || !password) {
          return new Response(JSON.stringify({ error: "Missing required fields (name, handle, password)" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        const cleanHandle = handle.startsWith("@") ? handle.trim().toLowerCase() : "@" + handle.trim().toLowerCase();

        if (env && env.DB) {
          // Check if handle already exists
          const existing = await env.DB.prepare("SELECT id FROM members WHERE handle = ?1").bind(cleanHandle).first();
          if (existing) {
            return new Response(JSON.stringify({ error: "Handle already claimed by another candidate" }), {
              status: 409,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }

          const salt = generateSalt();
          const hash = await hashPassword(password, salt);
          const passwordHash = `${salt}$${hash}`;
          const memberId = "mem_" + generateSalt().substring(0, 16);
          const isAdmin = (cleanHandle === "@admin" || cleanHandle === "@founder") ? 1 : 0;

          // Insert member record
          await env.DB.prepare(`
            INSERT INTO members (id, name, handle, title, current_rank_id, tier, bio, password_hash, is_admin, privacy_mode)
            VALUES (?1, ?2, ?3, 'Candidate', 'recruit', 'Explorer', ?4, ?5, ?6, 'private')
          `).bind(
            memberId, name.trim(), cleanHandle,
            `Committed to developing every dimension. Focused on ${focus || 'execution'}.`,
            passwordHash, isAdmin
          ).run();

          // Initialize stats
          await env.DB.prepare(`
            INSERT OR IGNORE INTO member_stats (member_id, current_streak, longest_streak, completion_rate, total_objectives_done, hours_invested, unreal_points)
            VALUES (?1, 0, 0, 0, 0, 0, 0)
          `).bind(memberId).run();

          // Initialize radar
          const defaultScore = focus ? 60 : 50;
          await env.DB.prepare(`
            INSERT OR IGNORE INTO member_radar (member_id, physical, intellectual, emotional, psychological, social, financial, professional, creative)
            VALUES (?1, 50, 50, 50, 50, 50, 50, 50, 50)
          `).bind(memberId).run();

          // Generate session token (valid for 30 days)
          const token = generateToken();
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          await env.DB.prepare(`
            INSERT INTO member_sessions (token, member_id, expires_at)
            VALUES (?1, ?2, ?3)
          `).bind(token, memberId, expiresAt).run();

          return new Response(JSON.stringify({
            success: true,
            token,
            member: {
              id: memberId,
              name: name.trim(),
              handle: cleanHandle,
              currentRankId: "recruit",
              tier: "Explorer",
              isAdmin: isAdmin === 1
            }
          }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        // Local fallback
        const token = "mock_tok_" + Date.now();
        return new Response(JSON.stringify({
          success: true,
          token,
          member: { id: "mem_local", name, handle: cleanHandle, currentRankId: "recruit", tier: "Explorer", isAdmin: false }
        }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // -----------------------------------------------------------
    // Route: /api/auth/login (POST)
    // -----------------------------------------------------------
    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      try {
        const body = await request.json();
        const { identifier, password } = body;

        if (!identifier || !password) {
          return new Response(JSON.stringify({ error: "Missing identifier or password" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        const cleanId = identifier.trim().toLowerCase();
        const handleSearch = cleanId.startsWith("@") ? cleanId : "@" + cleanId;

        if (env && env.DB) {
          const member = await env.DB.prepare(`
            SELECT id, name, handle, current_rank_id, tier, password_hash, is_admin
            FROM members
            WHERE handle = ?1 OR id = ?2
          `).bind(handleSearch, cleanId).first();

          if (!member) {
            return new Response(JSON.stringify({ error: "Invalid credentials: Candidate not found" }), {
              status: 401,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }

          if (member.password_hash) {
            const parts = member.password_hash.split("$");
            if (parts.length === 2) {
              const [salt, expectedHash] = parts;
              const testHash = await hashPassword(password, salt);
              if (testHash !== expectedHash) {
                return new Response(JSON.stringify({ error: "Invalid credentials: Passcode does not match" }), {
                  status: 401,
                  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
                });
              }
            }
          }

          // Generate session token (valid 30 days)
          const token = generateToken();
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          await env.DB.prepare(`
            INSERT INTO member_sessions (token, member_id, expires_at)
            VALUES (?1, ?2, ?3)
          `).bind(token, member.id, expiresAt).run();

          return new Response(JSON.stringify({
            success: true,
            token,
            member: {
              id: member.id,
              name: member.name,
              handle: member.handle,
              currentRankId: member.current_rank_id || "recruit",
              tier: member.tier || "Explorer",
              isAdmin: member.is_admin === 1
            }
          }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        // Local fallback
        return new Response(JSON.stringify({
          success: true,
          token: "mock_tok_" + Date.now(),
          member: { id: "mem_local", name: identifier, handle: handleSearch, currentRankId: "recruit", tier: "Explorer", isAdmin: true }
        }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
    }

    // -----------------------------------------------------------
    // Route: /api/auth/session (GET)
    // -----------------------------------------------------------
    if (url.pathname === "/api/auth/session" && request.method === "GET") {
      const authMember = await getAuthenticatedMember(request, env);
      if (authMember) {
        return new Response(JSON.stringify({
          authenticated: true,
          member: {
            id: authMember.id,
            name: authMember.name,
            handle: authMember.handle,
            currentRankId: authMember.current_rank_id,
            tier: authMember.tier,
            isAdmin: authMember.is_admin === 1,
            privacyMode: authMember.privacy_mode
          }
        }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }
      return new Response(JSON.stringify({ authenticated: false }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // -----------------------------------------------------------
    // Route: /api/auth/logout (POST)
    // -----------------------------------------------------------
    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      const token = request.headers.get("x-session-token") || 
        (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (env && env.DB && token) {
        await env.DB.prepare("DELETE FROM member_sessions WHERE token = ?1").bind(token).run();
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // -----------------------------------------------------------
    // Route: /api/ranks (GET & POST) - Ranks Configuration
    // -----------------------------------------------------------
    if (url.pathname === "/api/ranks") {
      if (request.method === "GET") {
        if (env && env.DB) {
          try {
            const { results } = await env.DB.prepare(
              "SELECT * FROM ranks_config WHERE is_active = 1 ORDER BY rank_order ASC"
            ).all();

            if (results && results.length > 0) {
              return new Response(JSON.stringify(results), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
              });
            }
          } catch (e) {
            console.error("D1 ranks_config fetch error:", e);
          }
        }
        return new Response(JSON.stringify(DEFAULT_RANKS), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // Admin Update Ranks: POST /api/ranks
      if (request.method === "POST") {
        const authMember = await getAuthenticatedMember(request, env);
        const isAdmin = authMember && authMember.is_admin === 1;
        const adminKey = request.headers.get("x-admin-key");
        const isSecretKey = adminKey && (adminKey === (env?.ADMIN_SECRET || "egym_admin_2026"));

        if (!isAdmin && !isSecretKey) {
          return new Response(JSON.stringify({ error: "Unauthorized: Admin privileges required" }), {
            status: 401,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        try {
          const ranks = await request.json();
          const ranksArray = Array.isArray(ranks) ? ranks : [ranks];
          if (env && env.DB && ranksArray.length > 0) {
            const stmts = ranksArray.map(r => env.DB.prepare(`
              INSERT INTO ranks_config 
              (id, rank_order, title, tagline, description, emblem_key, min_xp, min_challenges, min_streak, min_checkins, min_objectives, min_dimensions_count, min_dimension_score, special_criteria_desc, is_active, updated_at)
              VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, 1, CURRENT_TIMESTAMP)
              ON CONFLICT(id) DO UPDATE SET
                title=?3, tagline=?4, description=?5, min_xp=?7, min_challenges=?8, min_streak=?9, min_checkins=?10, min_objectives=?11, min_dimensions_count=?12, min_dimension_score=?13, special_criteria_desc=?14, updated_at=CURRENT_TIMESTAMP
            `).bind(
              r.id, r.rank_order || r.level || 1, r.title, r.tagline || "", r.description || "", r.emblem_key || ("emblem_" + r.id),
              r.min_xp || 0, r.min_challenges || 0, r.min_streak || 0, r.min_checkins || 0, r.min_objectives || 0,
              r.min_dimensions_count || 0, r.min_dimension_score || 0, r.special_criteria_desc || ""
            ));

            await env.DB.batch(stmts);
            return new Response(JSON.stringify({ success: true, count: ranksArray.length }), {
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }
          return new Response(JSON.stringify({ success: true, mode: "client_fallback" }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
      }
    }

    // -----------------------------------------------------------
    // Route: /api/ranks/audit - Admin XP & Progression Audit Trail
    // -----------------------------------------------------------
    if (url.pathname === "/api/ranks/audit" && request.method === "GET") {
      const authMember = await getAuthenticatedMember(request, env);
      const isAdmin = authMember && authMember.is_admin === 1;
      const adminKey = request.headers.get("x-admin-key");
      const isSecretKey = adminKey && (adminKey === (env?.ADMIN_SECRET || "egym_admin_2026"));

      if (!isAdmin && !isSecretKey) {
        const statusCode = authMember ? 403 : 401;
        return new Response(JSON.stringify({ error: authMember ? "Forbidden: Admin privileges required" : "Unauthorized: Authentication required" }), {
          status: statusCode,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      if (env && env.DB) {
        try {
          const membersList = await env.DB.prepare(
            `SELECT m.id, m.name, m.handle, m.current_rank_id, s.unreal_points, s.current_streak, s.total_objectives_done 
             FROM members m LEFT JOIN member_stats s ON m.id = s.member_id 
             ORDER BY s.unreal_points DESC LIMIT 50`
          ).all();

          const recentLedger = await env.DB.prepare(
            `SELECT id, member_id, amount, source_type, description, verified, created_at 
             FROM xp_ledger ORDER BY created_at DESC LIMIT 100`
          ).all();

          return new Response(JSON.stringify({
            members: membersList.results || [],
            ledger: recentLedger.results || []
          }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
      }

      return new Response(JSON.stringify({ members: [], ledger: [] }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // -----------------------------------------------------------
    // Route: /api/state (GET & POST) - Member State Sync
    // -----------------------------------------------------------
    if (url.pathname === "/api/state") {
      const memberId = request.headers.get("x-member-id") || url.searchParams.get("member_id");

      // GET /api/state
      if (request.method === "GET") {
        if (!memberId) {
          return new Response(JSON.stringify({ error: "Missing x-member-id header" }), {
            status: 400,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }

        if (env && env.DB) {
          try {
            const row = await env.DB.prepare(
              "SELECT state_json FROM member_state WHERE id = ?1"
            ).bind(memberId).first();

            if (row && row.state_json) {
              return new Response(row.state_json, {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
              });
            }

            return new Response(JSON.stringify({ status: "new_member" }), {
              status: 404,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          } catch (err) {
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }
        }

        return new Response(JSON.stringify({ status: "local_only" }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
      }

      // POST /api/state
      if (request.method === "POST") {
        try {
          const body = await request.json();
          const targetMemberId = memberId || body.memberId || "guest_" + Date.now();
          const stateJson = JSON.stringify(body);

          if (env && env.DB) {
            const { profile, stats, dimensionsRadar, xpLedger, rankHistory } = body;
            const statements = [];

            // 1. Fast Edge Document Cache
            statements.push(
              env.DB.prepare(
                `INSERT INTO member_state (id, state_json, updated_at)
                 VALUES (?1, ?2, CURRENT_TIMESTAMP)
                 ON CONFLICT(id) DO UPDATE SET state_json = ?2, updated_at = CURRENT_TIMESTAMP`
              ).bind(targetMemberId, stateJson)
            );

            // 2. Relational: members table
            if (profile) {
              statements.push(
                env.DB.prepare(
                  `INSERT INTO members (id, name, handle, title, current_rank_id, tier, bio, avatar, updated_at)
                   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, CURRENT_TIMESTAMP)
                   ON CONFLICT(id) DO UPDATE SET 
                     name = ?2, handle = ?3, title = ?4, current_rank_id = ?5, tier = ?6, bio = ?7, avatar = ?8, updated_at = CURRENT_TIMESTAMP`
                ).bind(
                  targetMemberId,
                  profile.name || "Candidate",
                  profile.handle || "@member",
                  profile.title || "Initiate",
                  profile.currentRankId || profile.rank || "recruit",
                  profile.tier || "Explorer",
                  profile.bio || "",
                  profile.avatar || ""
                )
              );
            }

            // 3. Relational: member_stats table
            if (stats) {
              statements.push(
                env.DB.prepare(
                  `INSERT INTO member_stats (member_id, current_streak, longest_streak, completion_rate, total_objectives_done, hours_invested, unreal_points, updated_at)
                   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)
                   ON CONFLICT(member_id) DO UPDATE SET
                     current_streak = ?2, longest_streak = ?3, completion_rate = ?4, total_objectives_done = ?5, hours_invested = ?6, unreal_points = ?7, updated_at = CURRENT_TIMESTAMP`
                ).bind(
                  targetMemberId,
                  stats.currentStreak || 0,
                  stats.longestStreak || 0,
                  stats.completionRate || 0,
                  stats.totalObjectivesDone || 0,
                  stats.hoursInvested || 0,
                  stats.unrealPoints || 0
                )
              );
            }

            // 4. Relational: member_radar table
            if (dimensionsRadar) {
              statements.push(
                env.DB.prepare(
                  `INSERT INTO member_radar (member_id, physical, intellectual, emotional, psychological, social, financial, professional, creative, updated_at)
                   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, CURRENT_TIMESTAMP)
                   ON CONFLICT(member_id) DO UPDATE SET
                     physical = ?2, intellectual = ?3, emotional = ?4, psychological = ?5, social = ?6, financial = ?7, professional = ?8, creative = ?9, updated_at = CURRENT_TIMESTAMP`
                ).bind(
                  targetMemberId,
                  dimensionsRadar.physical || 50,
                  dimensionsRadar.intellectual || 50,
                  dimensionsRadar.emotional || 50,
                  dimensionsRadar.psychological || 50,
                  dimensionsRadar.social || 50,
                  dimensionsRadar.financial || 50,
                  dimensionsRadar.professional || 50,
                  dimensionsRadar.creative || 50
                )
              );
            }

            // 5. Relational: xp_ledger (Deduplicated insert)
            if (Array.isArray(xpLedger) && xpLedger.length > 0) {
              for (const entry of xpLedger.slice(0, 15)) { // batch latest transactions
                statements.push(
                  env.DB.prepare(
                    `INSERT OR IGNORE INTO xp_ledger (id, member_id, amount, source_type, source_id, description, verified, created_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)`
                  ).bind(
                    entry.id || ("tx_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4)),
                    targetMemberId,
                    entry.amount || 0,
                    entry.sourceType || "activity",
                    entry.sourceId || ("src_" + Date.now()),
                    entry.description || "Earned Unreal XP",
                    entry.verified ? 1 : 0
                  )
                );
              }
            }

            // 6. Relational: rank_history (Audit log)
            if (Array.isArray(rankHistory) && rankHistory.length > 0) {
              for (const rh of rankHistory.slice(0, 5)) {
                statements.push(
                  env.DB.prepare(
                    `INSERT OR IGNORE INTO rank_history (id, member_id, rank_id, rank_title, unlocked_at, achieved_xp, notes)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
                  ).bind(
                    rh.id || ("rh_" + targetMemberId + "_" + (rh.rankId || "recruit")),
                    targetMemberId,
                    rh.rankId || "recruit",
                    rh.rankTitle || "Recruit",
                    rh.unlockedAt || new Date().toISOString(),
                    rh.achievedXp || 0,
                    rh.notes || "Promoted through verified criteria"
                  )
                );
              }
            }

            // 7. Relational: member_assessments
            if (body.assessment && body.assessmentCompleted) {
              statements.push(
                env.DB.prepare(
                  `INSERT INTO member_assessments (id, member_id, answers_json, baseline_radar_json, priority_dimensions, completed_at)
                   VALUES (?1, ?2, ?3, ?4, ?5, CURRENT_TIMESTAMP)
                   ON CONFLICT(id) DO UPDATE SET answers_json=?3, baseline_radar_json=?4, priority_dimensions=?5, completed_at=CURRENT_TIMESTAMP`
                ).bind(
                  "asmt_" + targetMemberId,
                  targetMemberId,
                  JSON.stringify(body.assessment.answers || {}),
                  JSON.stringify(body.assessment.baselineRadar || {}),
                  JSON.stringify(body.assessment.priorityDimensions || [])
                )
              );
            }

            // 8. Relational: evening_reflections
            if (Array.isArray(body.eveningReflections)) {
              for (const ref of body.eveningReflections.slice(0, 5)) {
                statements.push(
                  env.DB.prepare(
                    `INSERT INTO evening_reflections (id, member_id, reflection_date, win_summary, friction_summary, tomorrow_target, xp_awarded, created_at)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)
                     ON CONFLICT(member_id, reflection_date) DO UPDATE SET
                       win_summary=?4, friction_summary=?5, tomorrow_target=?6, xp_awarded=?7`
                  ).bind(
                    ref.id || ("ref_" + targetMemberId + "_" + (ref.reflectionDate || "today")),
                    targetMemberId,
                    ref.reflectionDate || new Date().toISOString().split("T")[0],
                    ref.winSummary || "",
                    ref.frictionSummary || "",
                    ref.tomorrowTarget || "",
                    ref.xpAwarded || 25
                  )
                );
              }
            }

            // 9. Relational: daily_objectives
            if (Array.isArray(body.todayObjectives)) {
              const todayDate = new Date().toISOString().split("T")[0];
              for (const obj of body.todayObjectives.slice(0, 10)) {
                statements.push(
                  env.DB.prepare(
                    `INSERT INTO daily_objectives (id, member_id, title, dimension, priority, time_est, due_time, postponed_count, completed, objective_date)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)
                     ON CONFLICT(id) DO UPDATE SET
                       title=?3, dimension=?4, priority=?5, time_est=?6, due_time=?7, postponed_count=?8, completed=?9`
                  ).bind(
                    obj.id,
                    targetMemberId,
                    obj.title || "",
                    obj.dimension || "execution",
                    obj.priority || "medium",
                    obj.timeEst || "15m",
                    obj.dueTime || "Today",
                    obj.postponedCount || 0,
                    obj.completed ? 1 : 0,
                    obj.date || todayDate
                  )
                );
              }
            }

            await env.DB.batch(statements);

            return new Response(JSON.stringify({ 
              success: true, 
              memberId: targetMemberId, 
              storage: "cloudflare_d1_relational" 
            }), {
              headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
          }

          return new Response(JSON.stringify({ success: true, storage: "client_fallback" }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
      }
    }

    // -----------------------------------------------------------
    // Route: /api/reset (POST)
    // -----------------------------------------------------------
    if (url.pathname === "/api/reset" && request.method === "POST") {
      const memberId = request.headers.get("x-member-id") || url.searchParams.get("member_id");
      if (env && env.DB && memberId) {
        try {
          await env.DB.prepare("DELETE FROM member_state WHERE id = ?1").bind(memberId).run();
          await env.DB.prepare("DELETE FROM check_ins WHERE member_id = ?1").bind(memberId).run();
          await env.DB.prepare("DELETE FROM reading_logs WHERE member_id = ?1").bind(memberId).run();
          await env.DB.prepare("DELETE FROM workout_logs WHERE member_id = ?1").bind(memberId).run();
          await env.DB.prepare("DELETE FROM writing_drafts WHERE member_id = ?1").bind(memberId).run();
          await env.DB.prepare("DELETE FROM xp_ledger WHERE member_id = ?1").bind(memberId).run();
          await env.DB.prepare("DELETE FROM rank_history WHERE member_id = ?1").bind(memberId).run();
          return new Response(JSON.stringify({ success: true, message: `Member ${memberId} reset` }), {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
          });
        }
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    // -----------------------------------------------------------
    // Fallback: Static Assets from ./public
    // -----------------------------------------------------------
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
