// Cloudflare Pages Function: /api/reset
// Resets the Cloudflare D1 database

export async function onRequestPost(context) {
  const { env } = context;

  if (env && env.DB) {
    try {
      await env.DB.prepare("DELETE FROM member_state").run();
      await env.DB.prepare("DELETE FROM check_ins").run();
      await env.DB.prepare("DELETE FROM reading_logs").run();
      await env.DB.prepare("DELETE FROM workout_logs").run();
      await env.DB.prepare("DELETE FROM writing_drafts").run();

      return new Response(JSON.stringify({ success: true, message: "D1 database reset successfully" }), {
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

  return new Response(JSON.stringify({ success: true, message: "Reset complete (client only)" }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
