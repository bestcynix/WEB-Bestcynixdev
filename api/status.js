const SKYLINE_ENDPOINT = 'https://skylinebot.xyz/api/public/public-summary';
const LANYARD_ENDPOINT = 'https://api.lanyard.rest/v1/users/1350901490805637202';
const FIREBASE_PROJECT_ID = 'bestcynixdev';
const FIREBASE_WEB_API_KEY = 'AIzaSyA20pomQmBi9122UZ5WLGADoLwYIw8rxpU';
const FIREBASE_SITE_CMS = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/site_cms?key=${FIREBASE_WEB_API_KEY}&pageSize=1`;
const FIREBASE_CHATS = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/chats?key=${FIREBASE_WEB_API_KEY}&pageSize=1`;
const ALLOWED_ORIGINS = new Set([
  'https://bestcynix.web.app',
  'https://bestcynix.firebaseapp.com',
  'https://web-bestcynixdev.vercel.app'
]);
const SUPABASE_EDGE_ENDPOINT = 'https://eujnhvfgraunjqgymslr.supabase.co/functions/v1/status-api';

const isoNow = () => new Date().toISOString();

function setHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function requestJson(url, timeoutMs = 8000) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json,text/plain;q=0.9' },
      redirect: 'follow',
      signal: controller.signal
    });
    let data = null;
    try { data = await response.json(); } catch (_) {}
    return { ok: response.ok, statusCode: response.status, latencyMs: Date.now() - started, data };
  } catch (error) {
    return {
      ok: false,
      statusCode: 0,
      latencyMs: Date.now() - started,
      error: error.name === 'AbortError' ? 'timeout' : 'request_failed'
    };
  } finally {
    clearTimeout(timer);
  }
}

function serviceStatus(probe, isHealthy = probe.ok) {
  if (!probe.ok) return isHealthy ? 'operational' : 'outage';
  return isHealthy ? 'operational' : 'degraded';
}

async function runProbes() {
  const checkedAt = isoNow();
  const [skylineProbe, discordProbe, hostingProbe, cmsProbe, chatsProbe] = await Promise.all([
    requestJson(SKYLINE_ENDPOINT),
    requestJson(LANYARD_ENDPOINT),
    requestJson(`https://bestcynix.web.app/?status_probe=${encodeURIComponent(checkedAt)}`),
    requestJson(FIREBASE_SITE_CMS),
    requestJson(FIREBASE_CHATS)
  ]);

  const skyline = skylineProbe.data || {};
  const skylineOnline = skylineProbe.ok && (skyline.status_state === 'online' || skyline.available === true);
  const discord = discordProbe.data?.data || {};
  const chatsReachable = chatsProbe.ok || chatsProbe.statusCode === 403;

  const services = {
    skylinebot: {
      status: serviceStatus(skylineProbe, skylineOnline),
      label: skylineOnline ? 'ONLINE' : skylineProbe.ok ? 'DEGRADED' : 'OFFLINE',
      latencyMs: skylineProbe.latencyMs,
      detail: skylineProbe.ok ? `SkylineBOT API ${skyline.status_state || 'responded'}` : `SkylineBOT API ${skylineProbe.error || 'unreachable'}`,
      metrics: {
        botName: skyline.bot_name || 'SkyLineBOT',
        botId: skyline.bot_id || null,
        guildsCount: Number(skyline.guilds_count ?? skyline.guild_count ?? 0),
        usersCount: Number(skyline.users_count ?? skyline.user_count ?? 0)
      }
    },
    discord: {
      status: serviceStatus(discordProbe),
      label: discordProbe.ok ? `API ${String(discord.discord_status || 'reachable').toUpperCase()}` : 'OFFLINE',
      latencyMs: discordProbe.latencyMs,
      detail: discordProbe.ok ? `Lanyard presence API reachable • ${discord.discord_status || 'no presence'}` : 'Lanyard presence API unreachable',
      metrics: { userId: '1350901490805637202', presence: discord.discord_status || null }
    },
    web: {
      status: serviceStatus(hostingProbe),
      label: hostingProbe.ok ? 'OPERATIONAL' : 'OFFLINE',
      latencyMs: hostingProbe.latencyMs,
      detail: hostingProbe.ok ? 'Firebase Hosting response passed' : 'Firebase Hosting probe failed'
    },
    database: {
      status: serviceStatus(cmsProbe),
      label: cmsProbe.ok ? 'OPERATIONAL' : 'OFFLINE',
      latencyMs: cmsProbe.latencyMs,
      detail: cmsProbe.ok ? 'Cloud Firestore site_cms read passed' : 'Cloud Firestore site_cms read failed'
    },
    chat: {
      status: serviceStatus(chatsProbe, chatsReachable),
      label: chatsReachable ? 'PROTECTED' : 'OFFLINE',
      latencyMs: chatsProbe.latencyMs,
      detail: chatsProbe.statusCode === 403
        ? 'Cloud Firestore chats endpoint reachable; access protected by rules'
        : chatsProbe.ok ? 'Cloud Firestore chats read passed' : 'Cloud Firestore chats endpoint failed'
    }
  };

  const values = Object.values(services);
  const overall = values.every(service => service.status === 'operational')
    ? 'operational'
    : values.some(service => service.status === 'outage') ? 'outage' : 'degraded';

  return { checkedAt, overall, services, source: 'vercel-server-probe', endpoint: SKYLINE_ENDPOINT };
}

function supabaseConfig() {
  return {
    url: process.env.SUPABASE_URL || 'https://eujnhvfgraunjqgymslr.supabase.co',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  };
}

async function supabaseRequest(path, options = {}) {
  const { url, key } = supabaseConfig();
  if (!key) throw new Error('supabase_service_key_missing');
  const response = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`supabase_http_${response.status}`);
  return response.status === 204 ? null : response.json();
}

async function persist(report) {
  await supabaseRequest('/rest/v1/status_reports', {
    method: 'POST',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({ checked_at: report.checkedAt, overall: report.overall, report })
  });
  return report;
}

function dailyFromHistory(history) {
  const days = new Map();
  for (const item of history) {
    const dayKey = item.checkedAt.slice(0, 10);
    const day = days.get(dayKey) || { dayKey, totalChecks: 0, passedChecks: 0, latencyTotalMs: 0, lastCheckedAt: item.checkedAt, lastOverall: item.overall };
    day.totalChecks += 1;
    if (item.overall === 'operational') day.passedChecks += 1;
    const latencies = Object.values(item.services || {}).map(service => Number(service.latencyMs) || 0);
    day.latencyTotalMs += Math.round(latencies.reduce((sum, value) => sum + value, 0) / Math.max(latencies.length, 1));
    if (item.checkedAt > day.lastCheckedAt) {
      day.lastCheckedAt = item.checkedAt;
      day.lastOverall = item.overall;
    }
    days.set(dayKey, day);
  }
  return [...days.values()].sort((a, b) => b.dayKey.localeCompare(a.dayKey)).slice(0, 90);
}

async function getPayload(forceRun) {
  const rows = await supabaseRequest('/rest/v1/status_reports?select=id,checked_at,overall,report&order=checked_at.desc&limit=300');
  let history = (rows || []).map(row => ({ id: String(row.id), ...(row.report || {}), checkedAt: row.checked_at, overall: row.overall }));
  const current = history[0] || null;
  const stale = !current || Date.now() - Date.parse(current.checkedAt) > 5 * 60 * 1000;
  if (forceRun || stale) {
    const fresh = await persist(await runProbes());
    history = [{ id: `live-${Date.now()}`, ...fresh }, ...history];
  }
  return { current: history[0] || null, history, daily: dailyFromHistory(history), generatedAt: isoNow() };
}

module.exports = async (req, res) => {
  setHeaders(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'method_not_allowed' });
  try {
    // Keep the legacy Vercel route useful without requiring a paid/server secret.
    // Supabase owns persistence and privileged database access for the free path.
    const edgeUrl = `${SUPABASE_EDGE_ENDPOINT}${req.query?.run === '1' ? '?run=1' : ''}`;
    const edgeResponse = await fetch(edgeUrl, { headers: { accept: 'application/json' } });
    const edgePayload = await edgeResponse.json();
    if (edgeResponse.ok || edgeResponse.status !== 503) return res.status(edgeResponse.status).json(edgePayload);
    const payload = await getPayload(req.query?.run === '1');
    return res.status(200).json(payload);
  } catch (error) {
    console.error('status api failed', error.message);
    return res.status(503).json({ error: 'status_probe_unavailable', checkedAt: isoNow() });
  }
};
