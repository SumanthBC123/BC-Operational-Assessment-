/* Integration test for the lead endpoint with a mock storage webhook and an
   in-memory rate-limit store. Run: node tests/lead-endpoint.test.mjs */
import assert from 'node:assert';
import http from 'node:http';

const received = [];
let hookStatus = 200;
const hook = http.createServer((req, res) => {
  let data = '';
  req.on('data', (c) => (data += c));
  req.on('end', () => {
    received.push({ headers: req.headers, body: JSON.parse(data) });
    res.statusCode = hookStatus;
    res.end('Accepted');
  });
});
await new Promise((r) => hook.listen(0, r));

process.env.MAKE_WEBHOOK_URL = `http://127.0.0.1:${hook.address().port}/hook`;
process.env.MAKE_API_KEY = 'test-key';
process.env.ALLOWED_ORIGINS = 'https://www.bchanel.com';

const mem = new Map();
globalThis.__WFA_TEST_STORE = {
  async get(k) { return mem.has(k) ? JSON.parse(mem.get(k)) : null; },
  async setJSON(k, v) { mem.set(k, JSON.stringify(v)); },
};

const { default: handler } = await import('../netlify/functions/lead.mjs');

const good = (over = {}) => ({
  industry: 'hospitality',
  answers: { q1: 'guesty_finance', q2: 'A', q3: 'B', q4: ['A', 'C'], q5: 'A' },
  lead: { firstName: 'Pat', lastName: 'Example', email: `pat${Math.random().toString(36).slice(2, 8)}@example.com`, company: 'ExampleCo' },
  utm: { utm_source: 'test' },
  consent: { privacyPolicy: true, marketing: false, version: '2026-10-v1' },
  website: '', fillMs: 15000,
  ...over,
});
const call = (body, { origin = 'https://www.bchanel.com', method = 'POST', ip = '203.0.113.5', type = 'application/json', raw } = {}) =>
  handler(new Request('https://example.netlify.app/api/lead', {
    method,
    headers: { 'content-type': type, ...(origin ? { origin } : {}) },
    body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined,
  }), { ip });

let n = 0;
async function t(name, fn) { await fn(); n += 1; console.log('ok  - ' + name); }

await t('valid submission is forwarded with the API key and rebuilt payload', async () => {
  const res = await call(good());
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('access-control-allow-origin'), 'https://www.bchanel.com');
  assert.strictEqual(received.length, 1);
  assert.strictEqual(received[0].headers['x-make-apikey'], 'test-key');
  assert.strictEqual(received[0].body.workflow_result_id, 'guesty_finance');
  assert.strictEqual(received[0].body.consent_status, 'Given');
  assert.ok(received[0].body.internal_priority);
});

await t('preflight succeeds for the allowed origin only', async () => {
  const ok = await call(null, { method: 'OPTIONS' });
  assert.strictEqual(ok.status, 204);
  assert.strictEqual(ok.headers.get('access-control-allow-origin'), 'https://www.bchanel.com');
  const bad = await call(null, { method: 'OPTIONS', origin: 'https://evil.example' });
  assert.strictEqual(bad.headers.get('access-control-allow-origin'), null);
});

await t('disallowed or missing origin is rejected', async () => {
  const before = received.length;
  assert.strictEqual((await call(good(), { origin: 'https://evil.example', ip: '203.0.113.6' })).status, 403);
  assert.strictEqual((await call(good(), { origin: '', ip: '203.0.113.6' })).status, 403);
  assert.strictEqual(received.length, before);
});

await t('wrong method, content type and bad JSON are rejected', async () => {
  assert.strictEqual((await call(null, { method: 'GET' })).status, 405);
  assert.strictEqual((await call(good(), { type: 'text/plain', ip: '203.0.113.7' })).status, 415);
  assert.strictEqual((await call(null, { raw: '{nope', ip: '203.0.113.7' })).status, 400);
});

await t('honeypot returns success but stores nothing', async () => {
  const before = received.length;
  const res = await call(good({ website: 'http://spam.example' }), { ip: '203.0.113.8' });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(received.length, before);
});

await t('invalid and consent-less submissions are rejected before storage', async () => {
  const before = received.length;
  assert.strictEqual((await call(good({ consent: { privacyPolicy: false } }), { ip: '203.0.113.9' })).status, 400);
  assert.strictEqual((await call(good({ answers: { q1: 'amazon_ads', q2: 'A', q3: 'A', q4: ['A'], q5: 'A' } }), { ip: '203.0.113.9' })).status, 400); // amazon not offered to hospitality
  assert.strictEqual(received.length, before);
});

await t('per-IP rate limit returns 429 after five submissions in ten minutes', async () => {
  const ip = '198.51.100.20';
  const codes = [];
  for (let i = 0; i < 7; i++) codes.push((await call(good(), { ip })).status);
  assert.deepStrictEqual(codes, [200, 200, 200, 200, 200, 429, 429]);
});

await t('per-email limit returns 429 after three submissions', async () => {
  const lead = { firstName: 'Same', lastName: 'Person', email: 'same.person@example.com', company: 'Co' };
  const codes = [];
  for (let i = 0; i < 4; i++) codes.push((await call(good({ lead }), { ip: `192.0.2.${10 + i}` })).status);
  assert.deepStrictEqual(codes, [200, 200, 200, 429]);
});

await t('a failing storage webhook surfaces as 502 and does not count against limits', async () => {
  hookStatus = 500;
  const res = await call(good(), { ip: '192.0.2.99' });
  assert.strictEqual(res.status, 502);
  hookStatus = 200;
  const again = await call(good(), { ip: '192.0.2.99' });
  assert.strictEqual(again.status, 200);
});

console.log(`\n${n} endpoint tests passed`);
hook.close();
