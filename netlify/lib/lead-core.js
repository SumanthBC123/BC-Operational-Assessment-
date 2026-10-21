/* Server-side validation and payload building for the Workflow Assessment lead
   endpoint. Pure functions only (no network, no storage) so they can be unit
   tested. The browser sends raw answer codes; everything stored is rebuilt here
   from the shared questionnaire data, so labels, score, priority and case URL
   cannot be spoofed from the client. */

const WFA = require('../../assessment-data.js');

const MAX_BODY_BYTES = 10 * 1024;
const MIN_FILL_MS = 1200;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const EMAIL_RE = /^[^\s@<>"'()\\,;:]+@[^\s@<>"'()\\,;:]+\.[^\s@<>"'()\\,;:]+$/;

/* Values that start with = + - @ (or tab/CR) are read as formulas when the
   storage sheet uses USER_ENTERED, so prefix them with an apostrophe. */
function neutralize(value) {
  const v = String(value);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function cleanText(value, max) {
  if (typeof value !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const v = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!v || v.length > max) return null;
  if (/[<>]/.test(v)) return null;
  return v;
}

function fail(code, message) {
  return { ok: false, status: code, error: message };
}

function validateAndBuild(body, rawLength, nowMs) {
  if (rawLength > MAX_BODY_BYTES) return fail(413, 'payload_too_large');
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail(400, 'invalid_body');

  // Bot traps: silently accept so the bot learns nothing, but store nothing.
  if (typeof body.website === 'string' && body.website.trim() !== '') return { ok: true, silent: true, reason: 'honeypot' };
  if (typeof body.fillMs === 'number' && body.fillMs >= 0 && body.fillMs < MIN_FILL_MS) return { ok: true, silent: true, reason: 'too_fast' };

  // Consent must be given for the privacy policy; marketing consent is never assumed.
  const consent = body.consent;
  if (!consent || consent.privacyPolicy !== true) return fail(400, 'consent_required');

  // Lead details
  const lead = body.lead || {};
  const firstName = cleanText(lead.firstName, 100);
  const lastName = cleanText(lead.lastName, 100);
  const company = cleanText(lead.company, 150);
  const email = typeof lead.email === 'string' ? lead.email.trim().toLowerCase() : '';
  if (!firstName || !lastName || !company) return fail(400, 'invalid_lead');
  if (email.length > 254 || !EMAIL_RE.test(email)) return fail(400, 'invalid_email');

  // Answers, validated against the real questionnaire for the selected route
  const industryId = body.industry;
  const industry = WFA.INDUSTRIES.find((i) => i.id === industryId);
  if (!industry) return fail(400, 'invalid_industry');

  const answers = body.answers || {};
  const q1Options = WFA.Q1_BY_INDUSTRY[industryId];
  const q1Option = q1Options.find((o) => o.value === answers.q1);
  if (!q1Option) return fail(400, 'invalid_q1');
  const routeId = q1Option.value;
  const route = WFA.ROUTES[routeId];

  const q2Option = route.q2.options.find((o) => o.value === answers.q2);
  const q3Option = WFA.Q3_OPTIONS.find((o) => o.value === answers.q3);
  const q5Option = WFA.q5Options(route.q5First).find((o) => o.value === answers.q5);
  if (!q2Option || !q3Option || !q5Option) return fail(400, 'invalid_answers');

  const q4Raw = answers.q4;
  if (!Array.isArray(q4Raw) || q4Raw.length < 1 || q4Raw.length > route.q4.length) return fail(400, 'invalid_q4');
  const q4Unique = Array.from(new Set(q4Raw));
  const q4Options = [];
  for (const v of q4Unique) {
    const opt = route.q4.find((o) => o.value === v);
    if (!opt) return fail(400, 'invalid_q4');
    q4Options.push(opt);
  }
  if (q4Options.some((o) => o.exclusive) && q4Options.length > 1) return fail(400, 'invalid_q4');
  // keep the route's own option order
  q4Options.sort((a, b) => route.q4.indexOf(a) - route.q4.indexOf(b));

  const conditionCount = q4Options.filter((o) => !o.exclusive).length;
  const scoring = WFA.computeInternalScore(answers.q2, answers.q3, conditionCount, answers.q5);

  // UTMs: known keys only, short strings only
  const utm = {};
  const utmIn = body.utm && typeof body.utm === 'object' ? body.utm : {};
  UTM_KEYS.forEach((k) => {
    const v = cleanText(typeof utmIn[k] === 'string' ? utmIn[k] : '', 200);
    if (v) utm[k] = v;
  });

  const submittedAt = new Date(nowMs).toISOString();
  const q4Labels = q4Options.map((o) => o.label);
  const annual = q3Option.annual || WFA.ANNUAL_UNMEASURED;

  const payload = {
    // Fields the existing Make.com / Google Sheet mapping already reads
    industry: industryId,
    industryLabel: industry.label,
    answers: { q1: answers.q1, q2: answers.q2, q3: answers.q3, q4: q4Options.map((o) => o.value), q5: answers.q5 },
    answerLabels: {
      q1: q1Option.label,
      q2: q2Option.label,
      q3: q3Option.label,
      q4: q4Labels,
      q5: q5Option.label,
    },
    resultFamily: routeId,
    resultTitle: route.title,
    questionnaireVersion: WFA.QUESTIONNAIRE_VERSION,
    lead: {
      firstName: neutralize(firstName),
      lastName: neutralize(lastName),
      email: neutralize(email),
      company: neutralize(company),
    },
    utm: Object.fromEntries(Object.entries(utm).map(([k, v]) => [k, neutralize(v)])),
    submitted_at: submittedAt,

    // Case-led fields
    workflow_result_id: routeId,
    q2_current_method: q2Option.label,
    q3_effort: q3Option.label,
    annual_effort_label: annual,
    q4_complexity: q4Labels,
    q5_urgency: q5Option.label,
    internal_score: scoring.score,
    internal_priority: scoring.priority,
    direct_case_url: route.caseUrl,

    // Consent record
    consent_status: 'Given',
    consent_privacy_policy: true,
    consent_marketing: false,
    consent_version: typeof consent.version === 'string' ? consent.version.slice(0, 40) : '',
  };

  return { ok: true, payload, emailKey: email };
}

module.exports = { validateAndBuild, neutralize, MAX_BODY_BYTES };
