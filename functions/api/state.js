// Cloudflare Pages Function: /api/state
// Multi-user serverless relational database sync via Cloudflare D1 (SQLite)

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const memberId = request.headers.get("x-member-id") || url.searchParams.get("member_id");

  if (!memberId) {
    return new Response(JSON.stringify({ error: "Missing x-member-id header" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }

  if (env && env.DB) {
    try {
      // 1. Fetch from fast state cache
      const row = await env.DB.prepare(
        "SELECT state_json FROM member_state WHERE id = ?1"
      ).bind(memberId).first();

      if (row && row.state_json) {
        return new Response(row.state_json, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }

      // New member on this device
      return new Response(JSON.stringify({ status: "new_member" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ status: "local_only" }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const memberId = request.headers.get("x-member-id") || url.searchParams.get("member_id") || "guest_" + Date.now();
    const body = await request.json();
    const stateJson = JSON.stringify(body);

    if (env && env.DB) {
      const { profile, stats, dimensionsRadar, readingLog, workoutLog, writingDrafts } = body;

      // Batch queries for relational consistency
      const statements = [];

      // 1. Upsert fast cache
      statements.push(
        env.DB.prepare(
          `INSERT INTO member_state (id, state_json, updated_at) 
           VALUES (?1, ?2, CURRENT_TIMESTAMP)
           ON CONFLICT(id) DO UPDATE SET state_json = ?2, updated_at = CURRENT_TIMESTAMP`
        ).bind(memberId, stateJson)
      );

      // 2. Upsert relational members table
      if (profile) {
        statements.push(
          env.DB.prepare(
            `INSERT INTO members (id, name, handle, title, tier, bio, avatar, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)
             ON CONFLICT(id) DO UPDATE SET 
               name = ?2, handle = ?3, title = ?4, tier = ?5, bio = ?6, avatar = ?7, updated_at = CURRENT_TIMESTAMP`
          ).bind(
            memberId,
            profile.name || "Candidate",
            profile.handle || "@member",
            profile.title || "Initiate",
            profile.tier || "Explorer",
            profile.bio || "",
            profile.avatar || ""
          )
        );
      }

      // 3. Upsert relational member_stats table
      if (stats) {
        statements.push(
          env.DB.prepare(
            `INSERT INTO member_stats (member_id, current_streak, longest_streak, completion_rate, total_objectives_done, hours_invested, unreal_points, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, CURRENT_TIMESTAMP)
             ON CONFLICT(member_id) DO UPDATE SET
               current_streak = ?2, longest_streak = ?3, completion_rate = ?4, total_objectives_done = ?5, hours_invested = ?6, unreal_points = ?7, updated_at = CURRENT_TIMESTAMP`
          ).bind(
            memberId,
            stats.currentStreak || 0,
            stats.longestStreak || 0,
            stats.completionRate || 0,
            stats.totalObjectivesDone || 0,
            stats.hoursInvested || 0,
            stats.unrealPoints || 0
          )
        );
      }

      // 4. Upsert relational member_radar table
      if (dimensionsRadar) {
        statements.push(
          env.DB.prepare(
            `INSERT INTO member_radar (member_id, physical, intellectual, emotional, psychological, social, financial, professional, creative, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, CURRENT_TIMESTAMP)
             ON CONFLICT(member_id) DO UPDATE SET
               physical = ?2, intellectual = ?3, emotional = ?4, psychological = ?5, social = ?6, financial = ?7, professional = ?8, creative = ?9, updated_at = CURRENT_TIMESTAMP`
          ).bind(
            memberId,
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

      // Execute batch statements in transaction
      await env.DB.batch(statements);

      return new Response(JSON.stringify({ success: true, memberId, edge: "cloudflare_d1_relational" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response(JSON.stringify({ success: true, memberId, edge: "client_fallback" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
