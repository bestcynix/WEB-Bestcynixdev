const { initializeApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { setGlobalOptions } = require('firebase-functions/v2');

initializeApp();
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 2, timeoutSeconds: 20, memory: '256MiB' });

const db = getFirestore();
const SKYLINE_ENDPOINT = 'https://skylinebot.xyz/api/public/public-summary';
const LANYARD_ENDPOINT = 'https://api.lanyard.rest/v1/users/1350901490805637202';
const SITE_ORIGINS = new Set(['https://bestcynixdev.web.app', 'https://bestcynixdev.firebaseapp.com']);

const nowIso = () => new Date().toISOString();
const statusFromProbe = (probe, online = probe.ok) => {
  if (!probe.ok) return 'outage';
  return online ? 'operational' : 'degraded';
};

async function httpProbe(url, parseJson = false) {
  const started = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json,text/html;q=0.9' },
      redirect: 'follow',
      signal: controller.signal
    });
    const body = parseJson ? await response.json() : null;
    return { ok: response.ok, statusCode: response.status, latencyMs: Date.now() - started, data: body };
  } catch (error) {
    return { ok: false, statusCode: 0, latencyMs: Date.now() - started, error: error.name === 'AbortError' ? 'timeout' : 'request_failed' };
  } finally {
    clearTimeout(timer);
  }
}

async function firestoreProbe(collection, label) {
  const started = Date.now();
  try {
    await db.collection(collection).limit(1).get();
    return { status: 'operational', label, latencyMs: Date.now() - started, detail: 'Firestore query passed' };
  } catch (error) {
    return { status: 'outage', label, latencyMs: Date.now() - started, detail: 'Firestore query failed' };
  }
}

async function runProbes() {
  const checkedAt = nowIso();
  const [skylineProbe, discordProbe, webProbe, database, chat] = await Promise.all([
    httpProbe(SKYLINE_ENDPOINT, true),
    httpProbe(LANYARD_ENDPOINT, true),
    httpProbe('https://bestcynixdev.web.app/', false),
    firestoreProbe('site_cms', 'Cloud Firestore'),
    firestoreProbe('chats', 'Live Support Chat')
  ]);

  const skyline = skylineProbe.data || {};
  const skylineOnline = skylineProbe.ok && (skyline.status_state === 'online' || skyline.available === true);
  const discordData = discordProbe.data?.data || {};
  const services = {
    skylinebot: {
      status: statusFromProbe(skylineProbe, skylineOnline),
      label: skylineOnline ? 'ONLINE' : (skylineProbe.ok ? 'DEGRADED' : 'OFFLINE'),
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
      status: statusFromProbe(discordProbe, discordProbe.ok),
      label: discordProbe.ok ? `API ${String(discordData.discord_status || 'reachable').toUpperCase()}` : 'OFFLINE',
      latencyMs: discordProbe.latencyMs,
      detail: discordProbe.ok ? `Presence API reachable • ${discordData.discord_status || 'no presence'}` : 'Presence API unreachable',
      metrics: { userId: '1350901490805637202', presence: discordData.discord_status || null }
    },
    web: {
      status: statusFromProbe(webProbe, webProbe.ok),
      label: webProbe.ok ? 'OPERATIONAL' : 'OFFLINE',
      latencyMs: webProbe.latencyMs,
      detail: webProbe.ok ? 'Firebase Hosting response passed' : 'Firebase Hosting probe failed'
    },
    database,
    chat
  };

  const serviceValues = Object.values(services);
  const overall = serviceValues.every(s => s.status === 'operational')
    ? 'operational'
    : serviceValues.some(s => s.status === 'outage') ? 'outage' : 'degraded';

  return {
    checkedAt,
    overall,
    services,
    source: 'server-probe',
    endpoint: SKYLINE_ENDPOINT
  };
}

async function persistReport(report) {
  const checkedDate = new Date(report.checkedAt);
  const dayKey = report.checkedAt.slice(0, 10);
  const historyId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const currentRef = db.doc('site_status/current');
  const historyRef = db.doc(`site_status_history/${historyId}`);
  const dailyRef = db.doc(`site_status_daily/${dayKey}`);
  const allOperational = report.overall === 'operational';
  const latencies = Object.values(report.services).map(service => Number(service.latencyMs) || 0);
  const averageLatencyMs = Math.round(latencies.reduce((sum, value) => sum + value, 0) / Math.max(latencies.length, 1));

  await Promise.all([
    currentRef.set({ ...report, updatedAt: FieldValue.serverTimestamp() }),
    historyRef.set({ ...report, createdAt: FieldValue.serverTimestamp() }),
    dailyRef.set({
      dayKey,
      lastCheckedAt: report.checkedAt,
      lastOverall: report.overall,
      totalChecks: FieldValue.increment(1),
      passedChecks: FieldValue.increment(allOperational ? 1 : 0),
      latencyTotalMs: FieldValue.increment(averageLatencyMs)
    }, { merge: true })
  ]);
  return report;
}

async function getStatusPayload(forceRun = false) {
  const currentSnapshot = await db.doc('site_status/current').get();
  let current = currentSnapshot.exists ? currentSnapshot.data() : null;
  const ageMs = current?.checkedAt ? Date.now() - Date.parse(current.checkedAt) : Infinity;
  if (forceRun || !current || ageMs > 5 * 60 * 1000) current = await persistReport(await runProbes());

  const [historySnapshot, dailySnapshot] = await Promise.all([
    db.collection('site_status_history').orderBy('checkedAt', 'desc').limit(300).get(),
    db.collection('site_status_daily').orderBy('dayKey', 'desc').limit(90).get()
  ]);
  return {
    current,
    history: historySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
    daily: dailySnapshot.docs.map(doc => doc.data()),
    generatedAt: nowIso()
  };
}

exports.statusApi = onRequest(async (request, response) => {
  const origin = request.get('origin');
  if (origin && SITE_ORIGINS.has(origin)) response.set('Access-Control-Allow-Origin', origin);
  response.set('Vary', 'Origin');
  response.set('Cache-Control', 'no-store, max-age=0');
  if (request.method === 'OPTIONS') return response.status(204).send('');
  if (request.method !== 'GET') return response.status(405).json({ error: 'method_not_allowed' });
  try {
    const payload = await getStatusPayload(request.query.run === '1');
    return response.status(200).json(payload);
  } catch (error) {
    console.error('statusApi failed', error);
    return response.status(503).json({ error: 'status_probe_unavailable', checkedAt: nowIso() });
  }
});

exports.statusMonitor = onSchedule('every 5 minutes', async () => {
  await persistReport(await runProbes());
});
