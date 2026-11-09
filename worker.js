// E-GYM Cloudflare Unified Edge Worker
// Handles serverless D1 SQL database API routes & serves static frontend assets

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, x-member-id"
        }
      });
    }

    // -----------------------------------------------------------
    // Route 1: /api/state (GET & POST)
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
            const { profile, stats, dimensionsRadar } = body;
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
                  `INSERT INTO members (id, name, handle, title, tier, bio, avatar, updated_at)
                   VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)
                   ON CONFLICT(id) DO UPDATE SET 
                     name = ?2, handle = ?3, title = ?4, tier = ?5, bio = ?6, avatar = ?7, updated_at = CURRENT_TIMESTAMP`
                ).bind(
                  targetMemberId,
                  profile.name || "Candidate",
                  profile.handle || "@member",
                  profile.title || "Initiate",
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
    // Route 2: /api/reset (POST)
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
    // Fallback: Static Assets
    // -----------------------------------------------------------
    if (env && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response("Not Found", { status: 404 });
  }
};
