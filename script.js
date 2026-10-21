/* Workflow Automation Assessment — production (case-led, deterministic)
   Industry filters the Q1 workflow choices. Q1 alone sets the result route
   (amazon_ads, fba_tracking, guesty_finance or revenue_signals) and the exact
   matching case URL. Q2-Q5 are loaded from the selected route; they only
   personalize the preview and feed an internal priority score that is stored
   with the lead and never shown as the recommendation.
   No live AI, no ROI or savings claims, no generic/unsupported result. */


const DATA = window.WFA;
const {
  QUESTIONNAIRE_VERSION, INDUSTRIES, Q1_BY_INDUSTRY, AGENCIES_INTRO, Q1_TEXT, Q3_OPTIONS,
  ANNUAL_UNMEASURED, q5Options, Q4_TEXT, Q4_HELPER, Q5_TEXT, ROUTES, Q4_MODULES,
  Q2_STARTING_POINT, Q4_ADDITIONAL_SENTENCE, computeInternalScore,
} = DATA;

/* Submissions go to a server-side endpoint that validates them and forwards
   them to storage; no storage URL or secret is exposed in this file. */
const LEAD_ENDPOINT = window.WFA_LEAD_ENDPOINT || '/api/lead';
const PRIVACY_URL = 'https://www.bchanel.com/privacy-policy';
const CONSENT_VERSION = '2026-10-v1';

/* Booking page used by the result CTA and by the "My workflow is different"
   exit link. */
const BOOKING_URL = 'https://calendly.com/lsmiriglia-bchanel';
const OPERATIONAL_ASSESSMENT_URL = BOOKING_URL;

const STORAGE_KEY = 'wfAssessmentV5';

const state = {
  industry: null,
  answers: {}, // { q1: 'amazon_ads', q2: 'A', q3: 'B', q4: ['A','C'], q5: 'A' }
  currentIndex: 0,
  editingFromReview: false,
  lead: {},
  utm: {},
};

const screens = {
  hero: document.getElementById('screen-hero'),
  industry: document.getElementById('screen-industry'),
  question: document.getElementById('screen-question'),
  review: document.getElementById('screen-review'),
  lead: document.getElementById('screen-lead'),
  result: document.getElementById('screen-result'),
};

let currentScreenName = 'hero';

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove('active'));
  screens[name].classList.add('active');
  currentScreenName = name;
  persistState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function track(eventName, params) {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, params || {});
}

function showConfirm(message, onConfirm) {
  const overlay = document.getElementById('confirm-overlay');
  document.getElementById('confirm-message').textContent = message;
  overlay.hidden = false;
  const okBtn = document.getElementById('confirm-ok');
  const cancelBtn = document.getElementById('confirm-cancel');
  function cleanup() {
    overlay.hidden = true;
    okBtn.removeEventListener('click', onOk);
    cancelBtn.removeEventListener('click', onCancel);
  }
  function onOk() { cleanup(); onConfirm(); }
  function onCancel() { cleanup(); }
  okBtn.addEventListener('click', onOk);
  cancelBtn.addEventListener('click', onCancel);
}

function captureUTMs() {
  const params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
    if (params.get(key)) state.utm[key] = params.get(key);
  });
}

function persistState() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      industry: state.industry,
      answers: state.answers,
      currentIndex: state.currentIndex,
      screen: currentScreenName,
      utm: state.utm,
    }));
  } catch (err) { /* storage unavailable — assessment still works, just won't survive a refresh */ }
}

function restoreState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || !saved.industry || !Q1_BY_INDUSTRY[saved.industry]) return false;
    state.industry = saved.industry;
    state.answers = saved.answers || {};
    state.currentIndex = saved.currentIndex || 0;
    // Landing-URL UTMs win; otherwise keep the ones captured earlier in this session.
    state.utm = Object.assign({}, saved.utm || {}, state.utm);
    return saved.screen || 'industry';
  } catch (err) {
    return false;
  }
}

function industryLabelFor(id) {
  const ind = INDUSTRIES.find((i) => i.id === id);
  return ind ? ind.label : '';
}

/* ---------- Question model: Q1 from the industry, Q2-Q5 from the route ---------- */
function currentRouteId() {
  const v = state.answers.q1;
  return v && ROUTES[v] ? v : null;
}

function buildQuestions(industry, routeId) {
  const q1 = { id: 'q1', text: Q1_TEXT, options: Q1_BY_INDUSTRY[industry] || [], allowDifferentLink: true };
  if (!routeId) return [q1];
  const route = ROUTES[routeId];
  return [
    q1,
    { id: 'q2', text: route.q2.text, options: route.q2.options },
    { id: 'q3', text: route.q3Text, options: Q3_OPTIONS },
    { id: 'q4', text: Q4_TEXT, helper: Q4_HELPER, multiSelect: true, options: route.q4 },
    { id: 'q5', text: Q5_TEXT, options: q5Options(route.q5First) },
  ];
}

function currentQuestions() {
  return buildQuestions(state.industry, currentRouteId());
}

const TOTAL_QUESTIONS = 5;

function optionLabel(question, value) {
  const opt = question.options.find((o) => o.value === value);
  return opt ? opt.label : '';
}

function answerDisplay(question) {
  const val = state.answers[question.id];
  if (question.multiSelect) {
    if (!val || !val.length) return 'Not answered';
    return val.map((v) => optionLabel(question, v)).join(', ');
  }
  return val ? optionLabel(question, val) : 'Not answered';
}

function isAnswered(question) {
  const a = state.answers[question.id];
  return question.multiSelect ? !!(a && a.length) : !!a;
}

/* ---------- Industry select screen ---------- */
function renderIndustryGrid() {
  const grid = document.getElementById('industry-grid');
  grid.innerHTML = '';
  INDUSTRIES.forEach((ind) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'industry-card';
    if (state.industry === ind.id) btn.classList.add('selected');
    btn.innerHTML = `<span class="label">${ind.label}</span>`;
    btn.addEventListener('click', () => selectIndustry(ind.id, btn));
    grid.appendChild(btn);
  });
  document.getElementById('industry-continue').disabled = !state.industry;
}

function selectIndustry(id, btn) {
  if (state.industry && state.industry !== id && Object.keys(state.answers).length) {
    showConfirm('Changing your business type will clear your current answers. Continue?', () => {
      state.industry = id;
      state.answers = {};
      state.currentIndex = 0;
      persistState();
      renderIndustryGrid();
    });
    return;
  }
  state.industry = id;
  document.querySelectorAll('.industry-card').forEach((c) => c.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('industry-continue').disabled = false;
  persistState();
}

function requestBackToIndustry() {
  const hasAnswers = Object.keys(state.answers).length > 0;
  const doGoBack = () => {
    state.industry = null;
    state.answers = {};
    state.currentIndex = 0;
    state.editingFromReview = false;
    persistState();
    showScreen('industry');
    renderIndustryGrid();
  };
  if (hasAnswers) {
    showConfirm('Going back to business type will clear your current answers. Continue?', doGoBack);
  } else {
    doGoBack();
  }
}

/* ---------- Question screen ---------- */
function setAnswer(q, opt) {
  if (q.multiSelect) {
    const arr = state.answers[q.id] ? state.answers[q.id].slice() : [];
    if (opt.exclusive) {
      // Exclusive: selecting "None of these / I am not sure" clears everything else.
      // Clicking it again while it's the only selection deselects it.
      if (arr.length === 1 && arr[0] === opt.value) arr.length = 0;
      else { arr.length = 0; arr.push(opt.value); }
    } else {
      // Selecting any real condition removes the exclusive option if present.
      const exclusiveIdx = arr.findIndex((v) => {
        const o = q.options.find((oo) => oo.value === v);
        return o && o.exclusive;
      });
      if (exclusiveIdx > -1) arr.splice(exclusiveIdx, 1);
      const idx = arr.indexOf(opt.value);
      if (idx > -1) arr.splice(idx, 1);
      else arr.push(opt.value);
    }
    state.answers[q.id] = arr;
  } else {
    state.answers[q.id] = opt.value;
  }
  persistState();
  renderQuestion();
}

function renderQuestion() {
  const questions = currentQuestions();
  // A refresh can land on a later question with no Q1 saved; fall back to Q1.
  if (state.currentIndex >= questions.length) state.currentIndex = 0;
  const q = questions[state.currentIndex];
  const step = state.currentIndex + 1;
  const answeredCount = questions.filter(isAnswered).length;

  document.getElementById('progress-fill').style.width = `${(answeredCount / TOTAL_QUESTIONS) * 100}%`;
  document.getElementById('assessing-label').textContent = `Assessing: ${industryLabelFor(state.industry)}`;
  document.getElementById('step-label').textContent = `Question ${step} of ${TOTAL_QUESTIONS}`;
  document.getElementById('q-title').textContent = q.text;
  document.getElementById('q-helper').textContent = q.helper || '';
  document.getElementById('q-helper').style.display = q.helper ? '' : 'none';

  const list = document.getElementById('option-list');
  list.innerHTML = '';
  const currentAnswer = state.answers[q.id];

  q.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = q.multiSelect ? 'option option-check' : 'option';
    const isSelected = q.multiSelect
      ? currentAnswer && currentAnswer.includes(opt.value)
      : currentAnswer === opt.value;
    if (isSelected) btn.classList.add('selected');
    btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    btn.innerHTML = `<span class="dot"></span><span class="label">${opt.label}</span>`;
    btn.addEventListener('click', () => {
      // Q1 decides the route, so changing it invalidates Q2-Q5 (different options).
      if (q.id === 'q1' && currentAnswer && currentAnswer !== opt.value
          && Object.keys(state.answers).some((k) => k !== 'q1')) {
        showConfirm('Changing your workflow will clear your answers to the next questions. Continue?', () => {
          state.answers = { q1: opt.value };
          state.editingFromReview = false;
          persistState();
          renderQuestion();
        });
        return;
      }
      setAnswer(q, opt);
    });
    list.appendChild(btn);
  });

  const intro = document.getElementById('q-intro');
  const showIntro = q.id === 'q1' && state.industry === 'agencies';
  intro.textContent = showIntro ? AGENCIES_INTRO : '';
  intro.style.display = showIntro ? '' : 'none';

  document.getElementById('different-workflow-wrap').style.display = q.allowDifferentLink ? '' : 'none';

  const isFirstStep = step === 1;
  document.getElementById('q-back').style.display = isFirstStep ? 'none' : '';
  document.getElementById('back-to-industry').style.display = isFirstStep ? '' : 'none';

  const continueBtn = document.getElementById('q-continue');
  continueBtn.disabled = !isAnswered(q);
  if (state.editingFromReview) {
    continueBtn.textContent = 'Save & Return to Review';
  } else if (step === TOTAL_QUESTIONS) {
    continueBtn.textContent = 'Review Your Answers';
  } else {
    continueBtn.textContent = 'Continue';
  }
}

function goToQuestion(index) {
  state.currentIndex = index;
  showScreen('question');
  renderQuestion();
}

/* ---------- Review screen ---------- */
function renderReview() {
  const list = document.getElementById('review-list');
  list.innerHTML = '';
  currentQuestions().forEach((q, i) => {
    const row = document.createElement('div');
    row.className = 'review-row';
    row.innerHTML = `
      <div class="review-text">
        <span class="review-q">${q.text}</span>
        <span class="review-a">${answerDisplay(q)}</span>
      </div>
      <button type="button" class="btn btn-ghost btn-small review-edit">Edit</button>`;
    row.querySelector('.review-edit').addEventListener('click', () => {
      state.editingFromReview = true;
      goToQuestion(i);
    });
    list.appendChild(row);
  });
}

/* ---------- Result: route comes from Q1 only ---------- */
function selectedConditions(q4Question, values) {
  return (values || [])
    .map((v) => q4Question.options.find((o) => o.value === v))
    .filter((o) => o && !o.exclusive);
}


function computeResult() {
  const routeId = state.answers.q1;
  const route = ROUTES[routeId];
  const q = currentQuestions();
  const q2Opt = q[1].options.find((o) => o.value === state.answers.q2);
  const q3Opt = Q3_OPTIONS.find((o) => o.value === state.answers.q3);
  const conditions = selectedConditions(q[3], state.answers.q4);
  const scoring = computeInternalScore(state.answers.q2, state.answers.q3, conditions.length, state.answers.q5);

  const picked = state.answers.q4 || [];
  const modules = route.q4
    .filter((o) => picked.includes(o.value) && !o.exclusive)
    .slice(0, 2)
    .map((o) => Q4_MODULES[routeId][o.value]);
  const q2Value = state.answers.q2;
  const startingPoint = (q2Value === 'A' || q2Value === 'B') ? Q2_STARTING_POINT.manual
    : (q2Value === 'C' || q2Value === 'D') ? Q2_STARTING_POINT.partial
    : Q2_STARTING_POINT.unclear;

  return {
    routeId,
    route,
    startingPoint,
    modules,
    hasAdditionalConditions: conditions.length >= 3,
    industryLabel: industryLabelFor(state.industry),
    methodPhrase: q2Opt ? q2Opt.phrase : '',
    methodLabel: q2Opt ? q2Opt.label : '',
    effortLabel: q3Opt ? q3Opt.label : '',
    effortMeasured: !!(q3Opt && q3Opt.annual),
    annualLabel: q3Opt && q3Opt.annual ? q3Opt.annual : ANNUAL_UNMEASURED,
    conditions,
    urgencyLabel: optionLabel(q[4], state.answers.q5),
    score: scoring.score,
    priority: scoring.priority,
  };
}

/* Show at most two selected conditions; add "and additional complexity" for 3+. */
function conditionSummary(conditions) {
  if (!conditions.length) return 'No specific conditions selected';
  const shown = conditions.slice(0, 2).map((c) => c.label);
  if (conditions.length >= 3) shown.push('and additional complexity');
  return shown.join('; ');
}

function bookingUrlWithUtm() {
  const url = new URL(BOOKING_URL);
  Object.keys(state.utm).forEach((k) => url.searchParams.set(k, state.utm[k]));
  return url.toString();
}

function renderResult() {
  const r = computeResult();
  const setText = (id, text) => { document.getElementById(id).textContent = text; };

  // 1. Workflow title (internal score / priority are never displayed)
  setText('result-title', r.route.title);

  // 2. A comparable workflow BChanel has solved (verified case evidence)
  setText('result-built', r.route.built);
  setText('result-verified', r.route.verifiedResults);

  // 3. What a comparable workflow could include for this team
  setText('result-base', r.route.comparable);
  setText('result-start', r.startingPoint);
  const modulesEl = document.getElementById('result-modules');
  modulesEl.innerHTML = r.modules.map((m) => `<li>${m}</li>`).join('');
  modulesEl.hidden = !r.modules.length;
  const extra = document.getElementById('result-additional');
  extra.textContent = Q4_ADDITIONAL_SENTENCE;
  extra.hidden = !r.hasAdditionalConditions;

  // 4. Reported operational context (reported effort only)
  const rows = [
    ['Current workflow method', r.methodLabel],
    ['Reported weekly effort', r.effortMeasured ? r.effortLabel : 'Not currently measured'],
    ['Reported annual effort', r.annualLabel],
    ['Complexity conditions', conditionSummary(r.conditions)],
  ];
  document.getElementById('result-context-list').innerHTML = rows
    .map(([k, v]) => `<div class="context-row"><dt>${k}</dt><dd>${v}</dd></div>`)
    .join('');
  setText('result-effort-note', r.effortMeasured
    ? 'This represents effort reported by you, not projected time savings or automation ROI.'
    : 'Your team does not currently measure the effort required by this workflow.');

  // 6. CTAs
  document.getElementById('case-cta').href = r.route.caseUrl;
  document.getElementById('final-cta').href = bookingUrlWithUtm();

  track('assessment_result_shown', {
    industry: state.industry,
    workflow_result_id: r.routeId,
    internal_priority: r.priority,
    questionnaire_version: QUESTIONNAIRE_VERSION,
  });
}

/* ---------- Lead capture (gates the result; no auto-email) ---------- */
function validateLeadForm() {
  const form = document.getElementById('lead-form');
  const email = form.email.value.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const ok = form.firstName.value.trim().length > 0
    && form.lastName.value.trim().length > 0
    && emailOk
    && form.company.value.trim().length > 0
    && form.consent.checked;
  const errEl = document.getElementById('lead-error');
  errEl.textContent = 'Please fill in every field with a valid work email and check the consent box.';
  errEl.style.display = ok ? 'none' : 'block';
  return ok;
}

let leadShownAt = 0;

/* The browser sends only raw answer codes plus the lead details. The server
   re-validates them and recomputes labels, score, priority and case URL, so
   none of those values are trusted from the client. */
async function submitLead(honeypotValue) {
  const r = computeResult();
  const payload = {
    industry: state.industry,
    answers: state.answers,
    lead: state.lead,
    utm: state.utm,
    consent: { privacyPolicy: true, marketing: false, version: CONSENT_VERSION },
    website: honeypotValue || '',
    fillMs: leadShownAt ? Date.now() - leadShownAt : 0,
    clientVersion: QUESTIONNAIRE_VERSION,
  };

  const res = await fetch(LEAD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (res.status === 429) {
    const err = new Error('rate_limited');
    err.code = 429;
    throw err;
  }
  if (!res.ok) throw new Error('submission_failed');

  track('lead_submitted', { industry: state.industry, workflow_result_id: r.routeId, internal_priority: r.priority });
  return true;
}

/* ---------- Full reset ---------- */
function resetAssessment() {
  state.industry = null;
  state.answers = {};
  state.currentIndex = 0;
  state.editingFromReview = false;
  state.lead = {};
  try { sessionStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
  renderIndustryGrid();
  showScreen('hero');
}

/* ---------- Wire up events ---------- */
document.addEventListener('DOMContentLoaded', () => {
  captureUTMs();
  renderIndustryGrid();

  const restoredScreen = restoreState();

  document.getElementById('start-assessment').addEventListener('click', () => {
    track('assessment_start', { utm_source: state.utm.utm_source || '', utm_campaign: state.utm.utm_campaign || '' });
    showScreen('industry');
  });

  document.getElementById('industry-continue').addEventListener('click', () => {
    track('industry_selected', { industry: state.industry });
    goToQuestion(0);
  });

  document.getElementById('back-to-industry').addEventListener('click', requestBackToIndustry);

  const differentLink = document.getElementById('different-workflow');
  differentLink.href = OPERATIONAL_ASSESSMENT_URL;
  differentLink.addEventListener('click', () => {
    track('workflow_different_click', { industry: state.industry });
  });

  document.getElementById('q-back').addEventListener('click', () => {
    if (state.currentIndex === 0) return;
    goToQuestion(state.currentIndex - 1);
  });
  document.getElementById('q-continue').addEventListener('click', () => {
    const questions = currentQuestions();
    if (state.currentIndex === 0 && !state.editingFromReview) {
      track('workflow_selected', { industry: state.industry, workflow_result_id: state.answers.q1 });
    }
    if (state.editingFromReview && questions.length === TOTAL_QUESTIONS) {
      state.editingFromReview = false;
      showScreen('review');
      renderReview();
    } else if (state.currentIndex < questions.length - 1) {
      goToQuestion(state.currentIndex + 1);
    } else {
      track('assessment_complete', { industry: state.industry, questionnaire_version: QUESTIONNAIRE_VERSION });
      showScreen('review');
      renderReview();
    }
  });

  document.getElementById('review-continue').addEventListener('click', () => {
    leadShownAt = Date.now();
    showScreen('lead');
  });

  document.getElementById('lead-back-to-review').addEventListener('click', () => {
    showScreen('review');
    renderReview();
  });

  const leadForm = document.getElementById('lead-form');
  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateLeadForm()) return;

    state.lead = {
      firstName: leadForm.firstName.value.trim(),
      lastName: leadForm.lastName.value.trim(),
      email: leadForm.email.value.trim(),
      company: leadForm.company.value.trim(),
    };

    const submitBtn = document.getElementById('lead-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Preparing your results…';

    try {
      await submitLead(leadForm.website ? leadForm.website.value : '');
      showScreen('result');
      renderResult();
    } catch (err) {
      document.getElementById('lead-error').textContent = err && err.code === 429
        ? 'Too many submissions from this connection. Please wait a few minutes and try again.'
        : 'Something went wrong submitting your info. Please try again.';
      document.getElementById('lead-error').style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'See My Results';
    }
  });

  document.getElementById('case-cta').addEventListener('click', () => {
    track('case_cta_click', { industry: state.industry, workflow_result_id: state.answers.q1 });
  });
  document.getElementById('final-cta').addEventListener('click', () => {
    track('final_cta_click', { industry: state.industry, workflow_result_id: state.answers.q1 });
  });
  document.getElementById('assess-another').addEventListener('click', () => {
    track('assess_another_click', {});
    resetAssessment();
  });

  /* Resume mid-assessment after a refresh (non-personal state only).
     The result screen is never restored: the lead form must be completed again. */
  if (restoredScreen && restoredScreen !== 'hero') {
    renderIndustryGrid();
    const complete = currentQuestions().length === TOTAL_QUESTIONS
      && currentQuestions().every(isAnswered);
    if (restoredScreen === 'question' && state.industry) {
      goToQuestion(Math.min(state.currentIndex, currentQuestions().length - 1));
    } else if ((restoredScreen === 'review' || restoredScreen === 'lead' || restoredScreen === 'result') && state.industry && complete) {
      if (restoredScreen === 'lead') {
        leadShownAt = Date.now();
        showScreen('lead');
      } else {
        showScreen('review');
        renderReview();
      }
    } else if (state.industry) {
      goToQuestion(0);
    }
  }
});
