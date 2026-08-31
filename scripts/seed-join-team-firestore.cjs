#!/usr/bin/env node
'use strict';

/*
 * One-time migration for recruitment content.
 *
 * The source of truth after this migration is Firestore:
 *   joinTeamForms/{projectSlug}
 *
 * This script only fills missing/empty fields, so custom values already saved
 * by an administrator are preserved. It uses the locally authenticated
 * Firebase CLI token and never stores credentials in the repository.
 */

const fs = require('node:fs');
const path = require('node:path');

const projectId = process.env.FIREBASE_PROJECT_ID || 'bestcynixdev';
const rootDir = path.resolve(__dirname, '..');
const seedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'recruitment-seed-data.json'), 'utf8'));

function getFirebaseCliToken() {
  const configPath = path.join(process.env.USERPROFILE || '', '.config', 'configstore', 'firebase-tools.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const account = (config.additionalAccounts || []).find((item) => item.user?.email === 'bestcynix@gmail.com');
  const token = account?.tokens?.access_token || config.tokens?.access_token;
  if (!token) throw new Error('firebase_cli_token_not_found');
  return token;
}

function firestoreValue(value) {
  if (value === null) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Number.isInteger(value)) return { integerValue: String(value) };
  if (typeof value === 'number') return { doubleValue: value };
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (value && typeof value === 'object') {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, firestoreValue(item)])) } };
  }
  return { nullValue: null };
}

function storedFieldIsEmpty(field) {
  if (!field) return true;
  if (field.stringValue !== undefined) return field.stringValue === '';
  if (field.arrayValue) return !(field.arrayValue.values || []).length;
  if (field.mapValue) return !Object.keys(field.mapValue.fields || {}).length;
  return false;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok && response.status !== 404) {
    throw new Error(`firestore_${response.status}:${body.error?.message || 'request_failed'}`);
  }
  return { response, body };
}

async function main() {
  const token = getFirebaseCliToken();
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const headers = { Authorization: `Bearer ${token}`, 'content-type': 'application/json' };
  const result = [];

  for (const [slug, config] of Object.entries(seedData)) {
    const docUrl = `${base}/joinTeamForms/${encodeURIComponent(slug)}`;
    const current = await requestJson(docUrl, { headers });
    const existingFields = current.body.fields || {};
    const updates = {};

    for (const [key, value] of Object.entries(config)) {
      if (!(key in existingFields) || storedFieldIsEmpty(existingFields[key])) updates[key] = value;
    }
    if (!('formId' in existingFields)) updates.formId = slug;
    if (!('projectSlug' in existingFields)) updates.projectSlug = slug;

    if (!Object.keys(updates).length) {
      result.push({ slug, status: current.response.status === 404 ? 'missing_without_updates' : 'already_complete', fields: 0 });
      continue;
    }

    const url = new URL(docUrl);
    Object.keys(updates).forEach((key) => url.searchParams.append('updateMask.fieldPaths', key));
    await requestJson(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields: Object.fromEntries(Object.entries(updates).map(([key, value]) => [key, firestoreValue(value)])) })
    });
    result.push({ slug, status: current.response.status === 404 ? 'created' : 'filled', fields: Object.keys(updates).length });
  }

  console.log(JSON.stringify({ projectId, source: path.relative(rootDir, path.join(__dirname, 'recruitment-seed-data.json')), result }, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exitCode = 1;
});
