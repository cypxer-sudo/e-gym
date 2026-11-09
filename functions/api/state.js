// Cloudflare Pages Function: /api/state
// Interacts with Cloudflare D1 database binding (env.DB)

export async function onRequestGet(context) {
  const { env } = context;

  // If D1 is bound as env.DB
  if (env && env.DB) {
    try {
      const row = await env.DB.prepare(
        "SELECT state_json FROM member_state WHERE id = 'current_member'"
      ).first();

      if (row && row.state_json) {
        return new Response(row.state_json, {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Fallback if D1 is not yet bound
  return new Response(JSON.stringify({ status: "d1_not_configured" }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const stateJson = JSON.stringify(body);

    if (env && env.DB) {
      await env.DB.prepare(
        `INSERT INTO member_state (id, state_json, updated_at) 
         VALUES ('current_member', ?1, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET state_json = ?1, updated_at = CURRENT_TIMESTAMP`
      ).bind(stateJson).run();

      return new Response(JSON.stringify({ success: true, edge: "cloudflare_d1" }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response(JSON.stringify({ success: true, edge: "client_fallback" }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
