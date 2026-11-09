// Cloudflare Pages Function: /api/reset
// Resets the calling member's state in Cloudflare D1

export async function onRequestPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const memberId = request.headers.get("x-member-id") || url.searchParams.get("member_id");

  if (env && env.DB && memberId) {
    try {
      await env.DB.prepare("DELETE FROM member_state WHERE id = ?1").bind(memberId).run();
      await env.DB.prepare("DELETE FROM check_ins WHERE member_id = ?1").bind(memberId).run();
      await env.DB.prepare("DELETE FROM reading_logs WHERE member_id = ?1").bind(memberId).run();
      await env.DB.prepare("DELETE FROM workout_logs WHERE member_id = ?1").bind(memberId).run();
      await env.DB.prepare("DELETE FROM writing_drafts WHERE member_id = ?1").bind(memberId).run();

      return new Response(JSON.stringify({ success: true, message: `Member ${memberId} reset successfully` }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  return new Response(JSON.stringify({ success: true, message: "Client reset complete" }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}
