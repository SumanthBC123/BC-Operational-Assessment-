/* POST /api/lead: secure lead submission endpoint for the Workflow Assessment.
   Validates the request, applies spam and rate limits, then forwards a rebuilt
   payload to the Make.com webhook. The webhook URL and API key live only in
   Netlify environment variables (MAKE_WEBHOOK_URL, MAKE_API_KEY). */
import { createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import core from '../lib/lead-core.js';

const { validateAndBuild, MAX_BODY_BYTES } = core;

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://www.bchanel.com,https://bchanel.com')
  .split(',').map((s) => s.trim()).filter(Boolean);

const LIMITS = {
  ipPer10Min: 5,
  ipPerHour: 15,
  emailPerDay: 3,
};

export const config = { path: '/api/lead' };

function corsHeaders(origin) {
  const h = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...corsHeaders(origin) },
  });
}

const hash = (value) => createHash('sha256').update((process.env.RATE_SALT || 'wfa') + '|' + value).digest('hex').slice(0, 32);

/* Sliding-window counters kept as arrays of timestamps in Netlify Blobs.
   Keys are hashed so no raw IP or email is stored. Soft limit (not atomic),
   which is fine for abuse control on a low-volume form. */
async function overLimit(store, key, windows, now) {
  let times = [];
  try {
    const existing = await store.get(key, { type: 'json' });
    if (Array.isArray(existing)) times = existing;
  } catch (e) { /* treat as empty */ }
  const dayAgo = now - 24 * 60 * 60 * 1000;
  times = times.filter((t) => t > dayAgo);
  const exceeded = windows.some(({ ms, max }) => times.filter((t) => t > now - ms).length >= max);
  return { exceeded, times };
}

async function record(store, key, times, now) {
  try { await store.setJSON(key, [...times, now].slice(-50)); } catch (e) { /* best effort */ }
}

export default async (req, context) => {
  const origin = req.headers.get('origin') || '';

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method_not_allowed' }, origin);

  // Browsers always send Origin on cross-origin POSTs; reject anything else.
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return json(403, { ok: false, error: 'origin_not_allowed' }, origin);

  const type = (req.headers.get('content-type') || '').toLowerCase();
  if (!type.includes('application/json')) return json(415, { ok: false, error: 'unsupported_media_type' }, origin);

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { ok: false, error: 'payload_too_large' }, origin);

  let body;
  try { body = JSON.parse(raw); } catch (e) { return json(400, { ok: false, error: 'invalid_json' }, origin); }

  const now = Date.now();
  const result = validateAndBuild(body, raw.length, now);
  if (!result.ok) return json(result.status, { ok: false, error: result.error }, origin);
  if (result.silent) return json(200, { ok: true }, origin);

  // Rate limits (per IP and per email)
  let store = null;
  try { store = globalThis.__WFA_TEST_STORE || getStore('wfa-rate-limits'); } catch (e) { store = null; }
  const ip = context.ip || req.headers.get('x-nf-client-connection-ip') || 'unknown';
  const ipKey = 'ip-' + hash(ip);
  const emailKey = 'em-' + hash(result.emailKey);
  let ipState = { exceeded: false, times: [] };
  let emailState = { exceeded: false, times: [] };
  if (store) {
    ipState = await overLimit(store, ipKey, [
      { ms: 10 * 60 * 1000, max: LIMITS.ipPer10Min },
      { ms: 60 * 60 * 1000, max: LIMITS.ipPerHour },
    ], now);
    emailState = await overLimit(store, emailKey, [{ ms: 24 * 60 * 60 * 1000, max: LIMITS.emailPerDay }], now);
    if (ipState.exceeded || emailState.exceeded) {
      return new Response(JSON.stringify({ ok: false, error: 'rate_limited' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '600', 'Cache-Control': 'no-store', ...corsHeaders(origin) },
      });
    }
  }

  const webhook = process.env.MAKE_WEBHOOK_URL;
  if (!webhook) {
    console.error('lead endpoint: MAKE_WEBHOOK_URL is not configured');
    return json(500, { ok: false, error: 'not_configured' }, origin);
  }

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.MAKE_API_KEY) headers['x-make-apikey'] = process.env.MAKE_API_KEY;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(webhook, { method: 'POST', headers, body: JSON.stringify(result.payload), signal: controller.signal });
    if (!res.ok) {
      console.error('lead endpoint: storage webhook responded ' + res.status);
      return json(502, { ok: false, error: 'storage_failed' }, origin);
    }
  } catch (e) {
    console.error('lead endpoint: storage webhook unreachable');
    return json(502, { ok: false, error: 'storage_failed' }, origin);
  } finally {
    clearTimeout(timer);
  }

  if (store) {
    await Promise.all([record(store, ipKey, ipState.times, now), record(store, emailKey, emailState.times, now)]);
  }
  return json(200, { ok: true }, origin);
};
