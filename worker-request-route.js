/**
 * Add this route to movie-proxy worker (Cloudflare).
 * Set secrets (Dashboard → Worker → Settings → Variables):
 *   TG_BOT_TOKEN = (bot token from BotFather)
 *   TG_CHAT_ID   = -1003998959961
 * Optional: PRACTICE_KEY must match config.js PRACTICE_KEY
 *
 * Client calls: POST /request  with JSON { name, year, contact, at }
 * Header: X-Practice-Key: <same as site>
 */
export async function handleRequestRoute(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }
  if (request.method !== "POST") {
    return json({ ok: false, message: "POST only" }, 405);
  }
  const key = request.headers.get("X-Practice-Key") || "";
  if (env.PRACTICE_KEY && key !== env.PRACTICE_KEY) {
    return json({ ok: false, message: "Unauthorized" }, 401);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "Invalid JSON" }, 400);
  }
  const name = String(body.name || "").trim();
  const year = String(body.year || "").trim();
  const contact = String(body.contact || "").trim();
  const at = String(body.at || new Date().toISOString());
  if (name.length < 2 || !/^\d{4}$/.test(year) || contact.length < 3) {
    return json({ ok: false, message: "Invalid fields" }, 400);
  }
  const token = env.TG_BOT_TOKEN;
  const chatId = env.TG_CHAT_ID;
  if (!token || !chatId) {
    return json({ ok: false, message: "Bot not configured on server" }, 503);
  }
  const safe = (s) => s.replace(/[`_*\[\]()]/g, "");
  const text =
    "🎬 New request\\n" +
    "• Title: " + safe(name) + "\\n" +
    "• Year: " + safe(year) + "\\n" +
    "• Contact: " + safe(contact) + "\\n" +
    "• Time: " + safe(at);
  const tg = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text })
  });
  const tj = await tg.json().catch(() => ({}));
  if (!tg.ok || tj.ok === false) {
    return json({ ok: false, message: tj.description || "Telegram send failed" }, 502);
  }
  return json({ ok: true });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Practice-Key"
  };
}
function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
}
