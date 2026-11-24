/**
 * Cloudflare Worker — /request route for TeraFast Play movie requests.
 *
 * SETUP (token stays on Cloudflare, NOT in GitHub):
 * 1. Open Workers → movie-proxy → Settings → Variables and Secrets
 * 2. Add secret TG_BOT_TOKEN = <your BotFather token>
 * 3. Add secret TG_CHAT_ID   = -1003998959961
 * 4. Add secret PRACTICE_KEY = same value as config.js PRACTICE_KEY
 * 5. Wire handleRequest into your worker fetch() for path "/request"
 *
 * Example fetch branch:
 *   const url = new URL(request.url);
 *   if (url.pathname === "/request") return handleRequest(request, env);
 */

export async function handleRequest(request, env) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Practice-Key"
  };
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") {
    return Response.json({ ok: false, message: "POST only" }, { status: 405, headers: cors });
  }
  const practice = env.PRACTICE_KEY || "";
  if (practice && request.headers.get("X-Practice-Key") !== practice) {
    return Response.json({ ok: false, message: "Unauthorized" }, { status: 401, headers: cors });
  }
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ ok: false, message: "Invalid JSON" }, { status: 400, headers: cors });
  }
  const name = String(body.name || "").trim();
  const year = String(body.year || "").trim();
  const contact = String(body.contact || "").trim();
  const at = String(body.at || new Date().toISOString());
  if (name.length < 2 || !/^\d{4}$/.test(year) || contact.length < 3) {
    return Response.json({ ok: false, message: "Invalid fields" }, { status: 400, headers: cors });
  }
  const token = env.TG_BOT_TOKEN;
  const chatId = env.TG_CHAT_ID;
  if (!token || !chatId) {
    return Response.json({ ok: false, message: "Bot not configured on server" }, { status: 503, headers: cors });
  }
  const safe = (s) => s.replace(/[`_*\[\]()]/g, "");
  const text =
    "🎬 New request\n" +
    "• Title: " + safe(name) + "\n" +
    "• Year: " + safe(year) + "\n" +
    "• Contact: " + safe(contact) + "\n" +
    "• Time: " + safe(at);
  const tgRes = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  const tj = await tgRes.json().catch(() => ({}));
  if (!tgRes.ok || tj.ok === false) {
    return Response.json({ ok: false, message: tj.description || "Telegram send failed" }, { status: 502, headers: cors });
  }
  return Response.json({ ok: true }, { headers: cors });
}
