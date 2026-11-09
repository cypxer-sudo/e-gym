// Cloudflare Pages Function: /api/state
// Multi-user serverless edge state management via Cloudflare D1

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

  // Fallback if D1 is not configured yet
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
      await env.DB.prepare(
        `INSERT INTO member_state (id, state_json, updated_at) 
         VALUES (?1, ?2, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET state_json = ?2, updated_at = CURRENT_TIMESTAMP`
      ).bind(memberId, stateJson).run();

      return new Response(JSON.stringify({ success: true, memberId, edge: "cloudflare_d1" }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    return new Response(JSON.stringify({ success: true, memberId, edge: "client_fallback" }), {
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
