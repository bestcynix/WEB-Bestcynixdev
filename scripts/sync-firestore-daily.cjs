#!/usr/bin/env node
'use strict';

/*
 * Daily bridge: Supabase -> one Firestore aggregate document.
 *
 * Default mode is dry-run. Use --commit only in a scheduled, reviewed job.
 * The payload is deliberately aggregate-only and is rejected if a likely PII
 * field is introduced. Do not add member IDs, names, account numbers, tax IDs,
 * storage paths, document URLs, or raw notes to this payload.
 */

const crypto = require('node:crypto');

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const PII_KEYS = /^(name|display_name|email|phone|address|uid|firebase_uid|account|account_name|account_number|bank|bank_name|tax|tax_id|id_card|identity|document|storage_path|slip|slip_storage_path|receipt|receipt_storage_path|url|token|secret|private|note)/i;

function b64url(input) {
  return Buffer.from(input).toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`missing_${name}`);
  return value;
}

function dateValue(value) {
  const date = value || new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  if (!DAY_RE.test(date)) throw new Error('invalid_sync_date');
  return date;
}

async function supabaseGet(table, query) {
  const base = required('SUPABASE_URL').replace(/\/$/, '');
  const key = required('SUPABASE_SERVICE_ROLE_KEY');
  const response = await fetch(`${base}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`supabase_${table}_${response.status}`);
  return response.json();
}

function addTeam(map, team) {
  const key = team || 'unassigned';
  if (!map[key]) map[key] = { attendanceEntries: 0, attendanceHours: 0, payrollRecords: 0, payrollNetPaid: 0 };
  return map[key];
}

function assertNoPii(value, path = 'payload') {
  if (Array.isArray(value)) return value.forEach((item, index) => assertNoPii(item, `${path}[${index}]`));
  if (!value || typeof value !== 'object') return;
  for (const [key, item] of Object.entries(value)) {
    if (PII_KEYS.test(key)) throw new Error(`blocked_possible_pii_key:${path}.${key}`);
    assertNoPii(item, `${path}.${key}`);
  }
}

function firestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === 'number') return { doubleValue: value };
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, firestoreValue(item)])) } };
}

function pemToDer(pem) {
  return Buffer.from(pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, ''), 'base64');
}

async function googleAccessToken(serviceAccountJson) {
  const account = JSON.parse(serviceAccountJson);
  if (!account.client_email || !account.private_key) throw new Error('invalid_google_service_account');
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${header}.${claim}`);
  signer.end();
  const signature = signer.sign({ key: pemToDer(account.private_key), format: 'der', type: 'pkcs8' });
  const assertion = `${header}.${claim}.${b64url(signature)}`;
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  if (!response.ok) throw new Error(`google_token_${response.status}`);
  const body = await response.json();
  if (!body.access_token) throw new Error('google_token_missing');
  return body.access_token;
}

async function writeFirestore(date, payload) {
  const projectId = required('FIREBASE_PROJECT_ID');
  const token = await googleAccessToken(required('GOOGLE_SERVICE_ACCOUNT_JSON'));
  const document = `projects/${projectId}/databases/(default)/documents/dailyTeamSummaries/${date}`;
  const response = await fetch(`https://firestore.googleapis.com/v1/${document}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ fields: firestoreValue(payload).mapValue.fields })
  });
  if (!response.ok) throw new Error(`firestore_write_${response.status}`);
  return response.json();
}

async function main() {
  const date = dateValue(process.env.SYNC_DATE);
  const attendance = await supabaseGet('attendance_entries', new URLSearchParams({ select: 'team_slug,hours,work_date', work_date: `eq.${date}`, limit: '5000' }));
  const monthStart = `${date.slice(0, 7)}-01`;
  const nextMonth = new Date(`${monthStart}T00:00:00Z`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const nextMonthValue = nextMonth.toISOString().slice(0, 10);
  const payrollQuery = new URLSearchParams({ select: 'team_slug,net_amount,payment_status,period_month', limit: '5000' });
  payrollQuery.append('period_month', `gte.${monthStart}`);
  payrollQuery.append('period_month', `lt.${nextMonthValue}`);
  const payroll = await supabaseGet('payroll_records', payrollQuery);
  const teams = {};
  for (const row of attendance) {
    const item = addTeam(teams, row.team_slug);
    item.attendanceEntries += 1;
    item.attendanceHours = Number((item.attendanceHours + Number(row.hours || 0)).toFixed(2));
  }
  for (const row of payroll) {
    const item = addTeam(teams, row.team_slug);
    item.payrollRecords += 1;
    if (row.payment_status === 'paid') item.payrollNetPaid = Number((item.payrollNetPaid + Number(row.net_amount || 0)).toFixed(2));
  }
  const payload = {
    schemaVersion: 1,
    day: date,
    payrollMonth: monthStart,
    source: 'supabase-private-workforce',
    containsPII: false,
    generatedAt: new Date().toISOString(),
    teams
  };
  assertNoPii(payload);
  const commit = process.argv.includes('--commit');
  if (!commit) {
    console.log(JSON.stringify({ mode: 'dry-run', payload }, null, 2));
    return;
  }
  await writeFirestore(date, payload);
  console.log(JSON.stringify({ mode: 'committed', document: `dailyTeamSummaries/${date}`, containsPII: false }));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
