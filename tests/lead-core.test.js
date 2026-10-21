/* Unit tests for the server-side lead validation. Run: node tests/lead-core.test.js */
const assert = require('assert');
const { validateAndBuild } = require('../netlify/lib/lead-core.js');

const NOW = Date.parse('2026-10-21T12:00:00Z');
const base = () => ({
  industry: 'ecommerce',
  answers: { q1: 'fba_tracking', q2: 'C', q3: 'D', q4: ['E', 'A', 'B'], q5: 'A' },
  lead: { firstName: 'Pat', lastName: 'Example', email: 'Pat@Example.com', company: 'ExampleCo' },
  utm: { utm_source: 'newsletter', utm_medium: 'email', utm_campaign: 'launch', evil: 'x' },
  consent: { privacyPolicy: true, marketing: false, version: '2026-10-v1' },
  website: '',
  fillMs: 20000,
});
const run = (mutate) => { const b = base(); if (mutate) mutate(b); return validateAndBuild(b, JSON.stringify(b).length, NOW); };

let passed = 0;
function t(name, fn) { fn(); passed += 1; console.log('ok  - ' + name); }

t('valid submission builds the full payload', () => {
  const r = run();
  assert.ok(r.ok && !r.silent);
  const p = r.payload;
  assert.strictEqual(p.workflow_result_id, 'fba_tracking');
  assert.strictEqual(p.resultTitle, 'FBA Shipment Tracking Workflow');
  assert.strictEqual(p.direct_case_url, 'https://www.bchanel.com/workflow-cases/fba-shipment-tracking-automation');
  assert.strictEqual(p.annual_effort_label, 'More than 520 hours per year');
  // Q2 C = 1, Q3 D = 3, three conditions = 2, Q5 A = 2  => 8 High
  assert.strictEqual(p.internal_score, 8);
  assert.strictEqual(p.internal_priority, 'High');
  assert.deepStrictEqual(p.answers.q4, ['A', 'B', 'E']); // route order, not click order
  assert.strictEqual(p.answerLabels.q4.length, 3);
  assert.strictEqual(p.lead.email, 'pat@example.com');
  assert.deepStrictEqual(Object.keys(p.utm).sort(), ['utm_campaign', 'utm_medium', 'utm_source']);
  assert.strictEqual(p.consent_status, 'Given');
  assert.strictEqual(p.consent_marketing, false);
  assert.strictEqual(p.submitted_at, '2026-10-21T12:00:00.000Z');
});

t('client-supplied labels, score and URL are ignored', () => {
  const r = run((b) => { b.internal_score = 99; b.internal_priority = 'High'; b.direct_case_url = 'https://evil.example'; b.resultTitle = 'x'; });
  assert.strictEqual(r.payload.internal_score, 8);
  assert.strictEqual(r.payload.direct_case_url.startsWith('https://www.bchanel.com/'), true);
  assert.strictEqual(r.payload.resultTitle, 'FBA Shipment Tracking Workflow');
});

t('honeypot is silently dropped', () => {
  const r = run((b) => { b.website = 'http://spam.example'; });
  assert.ok(r.ok && r.silent && r.reason === 'honeypot');
});

t('too-fast submissions are silently dropped', () => {
  const r = run((b) => { b.fillMs = 300; });
  assert.ok(r.ok && r.silent && r.reason === 'too_fast');
});

t('missing consent is rejected', () => {
  assert.strictEqual(run((b) => { b.consent = { privacyPolicy: false }; }).status, 400);
  assert.strictEqual(run((b) => { delete b.consent; }).error, 'consent_required');
});

t('invalid email and empty fields are rejected', () => {
  assert.strictEqual(run((b) => { b.lead.email = 'not-an-email'; }).error, 'invalid_email');
  assert.strictEqual(run((b) => { b.lead.company = '   '; }).error, 'invalid_lead');
  assert.strictEqual(run((b) => { b.lead.firstName = '<script>'; }).error, 'invalid_lead');
});

t('spreadsheet formula injection is neutralized', () => {
  const r = run((b) => { b.lead.company = '=HYPERLINK("http://x","y")'; b.lead.firstName = '+cmd'; b.utm.utm_source = '@SUM(1)'; });
  assert.strictEqual(r.payload.lead.company[0], "'");
  assert.strictEqual(r.payload.lead.firstName[0], "'");
  assert.strictEqual(r.payload.utm.utm_source[0], "'");
});

t('route and answers must be valid for the industry', () => {
  assert.strictEqual(run((b) => { b.industry = 'saas'; }).error, 'invalid_industry');
  assert.strictEqual(run((b) => { b.industry = 'agencies'; }).error, 'invalid_q1'); // fba not offered to agencies
  assert.strictEqual(run((b) => { b.answers.q2 = 'Z'; }).error, 'invalid_answers');
  assert.strictEqual(run((b) => { b.answers.q4 = ['A', 'Z']; }).error, 'invalid_q4');
  assert.strictEqual(run((b) => { b.answers.q4 = []; }).error, 'invalid_q4');
});

t('exclusive Q4 option cannot be combined', () => {
  assert.strictEqual(run((b) => { b.answers.q4 = ['G', 'A']; }).error, 'invalid_q4');
  const only = run((b) => { b.answers.q4 = ['G']; });
  assert.ok(only.ok);
  // Q2 C = 1, Q3 D = 3, no conditions = 0, Q5 A = 2 => 6 Medium
  assert.strictEqual(only.payload.internal_score, 6);
  assert.strictEqual(only.payload.internal_priority, 'Medium');
});

t('agencies and hospitality revenue routes validate', () => {
  const ag = run((b) => { b.industry = 'agencies'; b.answers = { q1: 'revenue_signals', q2: 'E', q3: 'E', q4: ['G'], q5: 'E' }; });
  assert.ok(ag.ok);
  assert.strictEqual(ag.payload.internal_priority, 'Low');
  assert.strictEqual(ag.payload.annual_effort_label, 'Your current annual effort is not yet measured');
  const hos = run((b) => { b.industry = 'hospitality'; b.answers = { q1: 'guesty_finance', q2: 'A', q3: 'B', q4: ['A'], q5: 'B' }; });
  assert.ok(hos.ok);
  assert.strictEqual(hos.payload.direct_case_url.endsWith('guesty-finance-automation'), true);
});

t('oversized payloads are rejected', () => {
  const b = base();
  assert.strictEqual(validateAndBuild(b, 50000, NOW).status, 413);
});

console.log('\n' + passed + ' tests passed');
