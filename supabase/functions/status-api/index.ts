import { createSupabaseContext } from "npm:@supabase/server";

const SKYLINE = "https://skylinebot.xyz/api/public/public-summary";
const LANYARD = "https://api.lanyard.rest/v1/users/1350901490805637202";
const API_KEY = "AIzaSyA20pomQmBi9122UZ5WLGADoLwYIw8rxpU";
const CMS = "https://firestore.googleapis.com/v1/projects/bestcynixdev/databases/(default)/documents/site_cms?key=" + API_KEY + "&pageSize=1";
const CHATS = "https://firestore.googleapis.com/v1/projects/bestcynixdev/databases/(default)/documents/chats?key=" + API_KEY + "&pageSize=1";
const ORIGINS = new Set(["https://bestcynix.web.app", "https://bestcynix.firebaseapp.com", "https://web-bestcynixdev.vercel.app"]);
const now = () => new Date().toISOString();

function headers(req: Request) {
  const h = new Headers({ "Cache-Control": "no-store, max-age=0", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization" });
  const origin = req.headers.get("origin");
  if (ORIGINS.has(origin || "")) h.set("Access-Control-Allow-Origin", origin!);
  return h;
}

async function probe(url: string) {
  const started = Date.now();
  const c = new AbortController();
  const timer = setTimeout(() => c.abort(), 8000);
  try {
    const r = await fetch(url, { headers: { accept: "application/json,text/html;q=0.9" }, signal: c.signal });
    let data = null;
    try { data = await r.json(); } catch (_) {}
    return { ok: r.ok, statusCode: r.status, latencyMs: Date.now() - started, data };
  } catch (e: any) {
    return { ok: false, statusCode: 0, latencyMs: Date.now() - started, error: e.name === "AbortError" ? "timeout" : "request_failed" };
  } finally { clearTimeout(timer); }
}

const state = (p: { ok: boolean }, healthy = p.ok) => !p.ok ? (healthy ? "operational" : "outage") : healthy ? "operational" : "degraded";

async function freshReport() {
  const checkedAt = now();
  const [skyline, discord, hosting, cms, chats] = await Promise.all([probe(SKYLINE), probe(LANYARD), probe("https://bestcynix.web.app/?status_probe=" + encodeURIComponent(checkedAt)), probe(CMS), probe(CHATS)]);
  const sky: any = skyline.data || {};
  const presence: any = discord.data?.data || {};
  const online = skyline.ok && (sky.status_state === "online" || sky.available === true);
  const protectedChats = chats.ok || chats.statusCode === 403;
  const services: any = {
    skylinebot: { status: state(skyline, online), label: online ? "ONLINE" : skyline.ok ? "DEGRADED" : "OFFLINE", latencyMs: skyline.latencyMs, detail: skyline.ok ? "SkylineBOT API " + (sky.status_state || "responded") : "SkylineBOT API " + (skyline.error || "unreachable"), metrics: { botName: sky.bot_name || "SkyLineBOT", botId: sky.bot_id || null, guildsCount: Number(sky.guilds_count ?? sky.guild_count ?? 0), usersCount: Number(sky.users_count ?? sky.user_count ?? 0) } },
    discord: { status: state(discord), label: discord.ok ? "API " + String(presence.discord_status || "reachable").toUpperCase() : "OFFLINE", latencyMs: discord.latencyMs, detail: discord.ok ? "Lanyard presence API reachable • " + (presence.discord_status || "no presence") : "Lanyard presence API unreachable", metrics: { userId: "1350901490805637202", presence: presence.discord_status || null } },
    web: { status: state(hosting), label: hosting.ok ? "OPERATIONAL" : "OFFLINE", latencyMs: hosting.latencyMs, detail: hosting.ok ? "Firebase Hosting response passed" : "Firebase Hosting probe failed" },
    database: { status: state(cms), label: cms.ok ? "OPERATIONAL" : "OFFLINE", latencyMs: cms.latencyMs, detail: cms.ok ? "Cloud Firestore site_cms read passed" : "Cloud Firestore site_cms read failed" },
    chat: { status: state(chats, protectedChats), label: protectedChats ? "PROTECTED" : "OFFLINE", latencyMs: chats.latencyMs, detail: chats.statusCode === 403 ? "Cloud Firestore chats endpoint reachable; access protected by rules" : chats.ok ? "Cloud Firestore chats read passed" : "Cloud Firestore chats endpoint failed" }
  };
  const values = Object.values(services) as any[];
  const overall = values.every(s => s.status === "operational") ? "operational" : values.some(s => s.status === "outage") ? "outage" : "degraded";
  return { checkedAt, overall, services, source: "supabase-edge-server-probe", endpoint: SKYLINE };
}

function daily(history: any[]) {
  const map = new Map<string, any>();
  for (const item of history) {
    const dayKey = item.checkedAt.slice(0, 10);
    const d = map.get(dayKey) || { dayKey, totalChecks: 0, passedChecks: 0, latencyTotalMs: 0, lastCheckedAt: item.checkedAt, lastOverall: item.overall };
    d.totalChecks++; if (item.overall === "operational") d.passedChecks++;
    const ls = Object.values(item.services || {}).map((s: any) => Number(s.latencyMs) || 0);
    d.latencyTotalMs += Math.round(ls.reduce((a: number, b: number) => a + b, 0) / Math.max(ls.length, 1));
    if (item.checkedAt > d.lastCheckedAt) { d.lastCheckedAt = item.checkedAt; d.lastOverall = item.overall; }
    map.set(dayKey, d);
  }
  return [...map.values()].sort((a, b) => b.dayKey.localeCompare(a.dayKey)).slice(0, 90);
}

export default { fetch: async (req: Request) => {
  const h = headers(req);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "GET") return Response.json({ error: "method_not_allowed" }, { status: 405, headers: h });
  try {
    const context = await createSupabaseContext(req, { auth: "none" });
    if (context.error) return Response.json({ error: "supabase_context_unavailable" }, { status: 503, headers: h });
    const db = context.data.supabaseAdmin;
    const { data: rows, error: readError } = await db.from("status_reports").select("id,checked_at,overall,report").order("checked_at", { ascending: false }).limit(300);
    if (readError) throw readError;
    let history = (rows || []).map((r: any) => ({ id: String(r.id), ...(r.report || {}), checkedAt: r.checked_at, overall: r.overall }));
    const current = history[0];
    const run = new URL(req.url).searchParams.get("run") === "1";
    if (run || !current || Date.now() - Date.parse(current.checkedAt) > 5 * 60 * 1000) {
      const report = await freshReport();
      const { error: insertError } = await db.from("status_reports").insert({ checked_at: report.checkedAt, overall: report.overall, report });
      if (insertError) throw insertError;
      history = [{ id: "live-" + Date.now(), ...report }, ...history];
    }
    return Response.json({ current: history[0] || null, history, daily: daily(history), generatedAt: now() }, { headers: h });
  } catch (e) {
    console.error("status-api failed", e);
    return Response.json({ error: "status_probe_unavailable", checkedAt: now() }, { status: 503, headers: h });
  }
}};
