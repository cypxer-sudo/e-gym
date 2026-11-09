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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, x-member-id, x-admin-key"
        }
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
        const adminKey = request.headers.get("x-admin-key");
        if (adminKey !== "egym_admin_2026") {
          return new Response(JSON.stringify({ error: "Unauthorized: Invalid admin credentials" }), {
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
      const adminKey = request.headers.get("x-admin-key");
      if (adminKey !== "egym_admin_2026") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
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
