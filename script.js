/* Workflow Automation Assessment — V4 (case-led, deterministic)
   Industry filters the Q1 workflow choices. Q1 alone sets the result route
   (amazon_ads, fba_tracking, guesty_finance or revenue_signals) and the exact
   matching case URL. Q2-Q5 are loaded from the selected route; they only
   personalize the preview and feed an internal priority score that is stored
   with the lead and never shown as the recommendation.
   No live AI, no ROI or savings claims, no generic/unsupported result. */

const QUESTIONNAIRE_VERSION = 'v4.1';
const LEAD_WEBHOOK_URL = 'https://hook.us2.make.com/rgnr1m57h2ipfopr7x9bibksc7puf15h';

/* Booking page used by the result CTA and by the "My workflow is different"
   exit link. Swap OPERATIONAL_ASSESSMENT_URL if a dedicated page is published. */
const BOOKING_URL = 'https://calendly.com/lsmiriglia-bchanel';
const OPERATIONAL_ASSESSMENT_URL = BOOKING_URL;

const INDUSTRIES = [
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'hospitality', label: 'Hospitality' },
  { id: 'agencies', label: 'Agencies / Service Businesses' },
];

/* Q1 is the only question that differs by industry. Each option carries the
   route (result ID) it selects. */
const Q1_BY_INDUSTRY = {
  ecommerce: [
    { value: 'amazon_ads', label: 'Amazon or retail-media advertising reporting' },
    { value: 'fba_tracking', label: 'FBA inbound shipment monitoring and delay alerts' },
    { value: 'revenue_signals', label: 'Revenue and performance monitoring across dashboards or spreadsheets' },
  ],
  hospitality: [
    { value: 'guesty_finance', label: 'Reservation finance and reconciliation across properties' },
    { value: 'revenue_signals', label: 'Revenue and performance monitoring across dashboards or spreadsheets' },
  ],
  agencies: [
    { value: 'revenue_signals', label: 'Revenue and performance monitoring across dashboards or spreadsheets' },
  ],
};

const AGENCIES_INTRO = 'Select the currently available workflow review, or choose “My workflow is different” to discuss another operational process.';
const Q1_TEXT = 'Which workflow would you like help reviewing first?';

/* Q3 / Q5 answer sets are identical across routes; only the Q3 question text
   and the first Q5 option change. */
const Q3_OPTIONS = [
  { value: 'A', label: 'Less than 2 hours', annual: 'Up to approximately 100 hours per year' },
  { value: 'B', label: '2–5 hours', annual: 'Approximately 100–260 hours per year' },
  { value: 'C', label: '6–10 hours', annual: 'Approximately 300–520 hours per year' },
  { value: 'D', label: 'More than 10 hours', annual: 'More than 520 hours per year' },
  { value: 'E', label: 'We do not currently measure it', annual: null },
];
const ANNUAL_UNMEASURED = 'Your current annual effort is not yet measured';

function q5Options(firstLabel) {
  return [
    { value: 'A', label: firstLabel },
    { value: 'B', label: 'Within 1–3 months' },
    { value: 'C', label: 'Within 3–6 months' },
    { value: 'D', label: 'We are exploring improvements for a later stage' },
    { value: 'E', label: 'I am not sure' },
  ];
}

const Q4_TEXT = 'Which conditions make this workflow difficult to operate?';
const Q4_HELPER = 'Select all that apply.';
const Q5_TEXT = 'When does your team realistically need this workflow to improve?';

/* Each route: Q2-Q5 content, plus the case-backed result copy. Q2 options
   carry `phrase` (inserted into the result) and `score`; Q4 options carry
   `exclusive` for the final "None / not sure" choice. */
const ROUTES = {
  amazon_ads: {
    title: 'Amazon Ads Reporting Workflow',
    selected: 'Amazon advertising reporting',
    caseUrl: 'https://www.bchanel.com/workflow-cases/amazon-ads-reporting-automation',
    q2: {
      text: 'How is your Amazon or retail-media reporting workflow handled today?',
      options: [
        { value: 'A', label: 'Reports are downloaded manually and PPC metrics are calculated in Excel or Google Sheets', phrase: 'reporting is prepared through manual downloads and spreadsheet calculations' },
        { value: 'B', label: 'Scheduled reports arrive by email, but someone still extracts and consolidates the data', phrase: 'scheduled reports still require manual extraction and consolidation' },
        { value: 'C', label: 'Several tools or connectors collect data, but the final report is assembled manually', phrase: 'multiple tools collect data, but the final report is still assembled manually' },
        { value: 'D', label: 'The workflow is partly automated, but formulas, mappings or data checks frequently need correction', phrase: 'the workflow is partially automated but still requires frequent correction' },
        { value: 'E', label: 'I am not sure how the reporting workflow is currently assembled', phrase: 'the current reporting method is not yet fully documented' },
      ],
    },
    q3Text: 'How much total team time is currently spent collecting, calculating, checking or distributing these reports each week?',
    q4: [
      { value: 'A', label: 'Multiple brands, seller accounts or advertising profiles are involved' },
      { value: 'B', label: 'Business reports, campaign reports and other sources must be combined' },
      { value: 'C', label: 'ACOS, TACOS, ROAS, CTR, CVR or other KPIs are calculated manually' },
      { value: 'D', label: 'Spreadsheet formulas, mappings or filters require repeated maintenance' },
      { value: 'E', label: 'Metric definitions or reporting ownership differ across the team' },
      { value: 'F', label: 'The report requires human review before it can be distributed' },
      { value: 'G', label: 'None of these / I am not sure', exclusive: true },
    ],
    q5First: 'Before the next reporting, client or brand-review cycle (within 30 days)',
    comparable: 'A comparable workflow could include automated Amazon SP-API and scheduled-report collection, brand-level data structuring, consistent KPI calculations and a consolidated Google Sheets report ready for review.',
    built: "BChanel connected Amazon SP-API and scheduled reports, structured brand-level performance data, automated PPC calculations, and delivered a consolidated Google Sheets report every Monday.",
    verifiedResults: "The published case reports 4–8 hours saved each week across eight brands, with zero manual PPC calculation errors. These are results from that case, not a forecast for your business.",
  },

  fba_tracking: {
    title: 'FBA Shipment Tracking Workflow',
    selected: 'FBA shipment monitoring',
    caseUrl: 'https://www.bchanel.com/workflow-cases/fba-shipment-tracking-automation',
    q2: {
      text: 'How is your inbound FBA shipment status currently monitored?',
      options: [
        { value: 'A', label: 'Someone checks active shipments manually in Amazon Seller Central', phrase: 'active shipments are checked manually in Seller Central' },
        { value: 'B', label: 'Shipment data is exported or copied into a spreadsheet that the team updates manually', phrase: 'shipment status is maintained through manual exports or spreadsheet updates' },
        { value: 'C', label: 'A dashboard exists, but delay thresholds and alerts are not applied consistently', phrase: 'a dashboard exists but exception thresholds and alerts are inconsistent' },
        { value: 'D', label: 'Part of the workflow uses an API or automation, but exceptions still require repeated manual checking', phrase: 'the workflow is partially automated but exceptions still require repeated checks' },
        { value: 'E', label: 'I am not sure how shipment status is currently monitored', phrase: 'the current shipment-monitoring method is not yet fully documented' },
      ],
    },
    q3Text: 'How much total team time is currently spent checking shipment status, updating trackers or following up on delays each week?',
    q4: [
      { value: 'A', label: 'Multiple brands, seller accounts or warehouses are involved' },
      { value: 'B', label: 'A high number of active inbound shipments must be checked' },
      { value: 'C', label: 'Delay thresholds or exception rules are not documented' },
      { value: 'D', label: 'Different team members check or classify shipment status differently' },
      { value: 'E', label: 'The team discovers delays only after inventory risk appears' },
      { value: 'F', label: 'Shipment information must be moved between Seller Central, spreadsheets or messaging tools' },
      { value: 'G', label: 'None of these / I am not sure', exclusive: true },
    ],
    q5First: 'Before the next major inbound shipment or inventory-planning cycle (within 30 days)',
    comparable: 'A comparable workflow could include Amazon SP-API data collection, defined delay thresholds, a live shipment dashboard and alerts that send the relevant shipment context to the responsible team when an exception appears.',
    built: "BChanel connected Amazon SP-API data to a live shipment dashboard, applied defined delay thresholds, and created alerts that notify the responsible team when an exception appears.",
    verifiedResults: "The published case reports 40–60 inbound shipments monitored automatically, delays identified 7+ days earlier, and zero manual Seller Central status checks. These are results from that case, not a forecast for your business.",
  },

  guesty_finance: {
    title: 'Guesty Finance and Reconciliation Workflow',
    selected: 'reservation finance and reconciliation',
    caseUrl: 'https://www.bchanel.com/workflow-cases/guesty-finance-automation',
    q2: {
      text: 'How is reservation finance data currently prepared and reconciled?',
      options: [
        { value: 'A', label: 'Reservation and invoice data is extracted and reconciled manually for each property', phrase: 'reservation and invoice data is extracted and reconciled manually by property' },
        { value: 'B', label: 'Financial details are copied from Guesty into Google Sheets or another reporting file', phrase: 'financial details are copied from Guesty into a separate reporting file' },
        { value: 'C', label: 'Some events or exports are automated, but validation and categorization remain manual', phrase: 'data capture is partially automated but validation and categorization remain manual' },
        { value: 'D', label: 'A dashboard exists, but it is not updated in real time or does not cover all properties', phrase: 'a dashboard exists but does not provide real-time visibility across all properties' },
        { value: 'E', label: 'I am not sure how reservation finance data currently reaches the report', phrase: 'the current reservation-finance workflow is not yet fully documented' },
      ],
    },
    q3Text: 'How much total team time is currently spent extracting, validating, reconciling or reporting reservation finance data each week?',
    q4: [
      { value: 'A', label: 'Multiple properties, entities or locations are involved' },
      { value: 'B', label: 'New, updated and cancelled reservations must be treated differently' },
      { value: 'C', label: 'Invoice items or financial fields require manual validation or categorization' },
      { value: 'D', label: 'Guesty, spreadsheets, accounting or reporting tools must stay aligned' },
      { value: 'E', label: 'The team completes reconciliation on a nightly or repeated schedule' },
      { value: 'F', label: 'There is no consolidated real-time view across properties' },
      { value: 'G', label: 'None of these / I am not sure', exclusive: true },
    ],
    q5First: 'Before the next financial close, owner-reporting or peak operating cycle (within 30 days)',
    comparable: 'A comparable workflow could include real-time reservation-event capture, structured financial extraction, validation and categorization, and a live reporting view across approved properties.',
    built: "BChanel created a workflow that captures Guesty reservation events in real time, extracts and validates financial information, and updates a consolidated reporting view across the included properties.",
    verifiedResults: "The published case reports real-time financial visibility across properties, elimination of manual nightly reconciliation, and automated tracking across all included properties. These are results from that case, not a forecast for your business.",
  },

  revenue_signals: {
    title: 'Revenue and Performance Signal Monitoring',
    selected: 'revenue and performance monitoring',
    caseUrl: 'https://www.bchanel.com/workflow-cases/revenue-performance-signal-monitoring',
    q2: {
      text: 'How does your team currently identify revenue or performance changes that require attention?',
      options: [
        { value: 'A', label: 'Team members repeatedly check multiple dashboards or spreadsheets on a fixed schedule', phrase: 'the team repeatedly checks dashboards or spreadsheets on a fixed schedule' },
        { value: 'B', label: 'Someone collects or prepares the metrics manually before each review', phrase: 'metrics are collected or prepared manually before each review' },
        { value: 'C', label: 'Alerts exist, but they repeat unchanged conditions or create too much noise', phrase: 'existing alerts repeat unchanged conditions or create excessive noise' },
        { value: 'D', label: 'Monitoring is partly automated, but thresholds, ownership or escalation rules are inconsistent', phrase: 'monitoring is partially automated but thresholds, ownership or escalation rules are inconsistent' },
        { value: 'E', label: 'There is no consistent monitoring process, or I am not sure how it works', phrase: 'the current monitoring process is not yet consistently defined' },
      ],
    },
    q3Text: 'How much total team time is currently spent checking dashboards, collecting metrics or deciding what deserves attention each week?',
    q4: [
      { value: 'A', label: 'Metrics come from several dashboards, spreadsheets or connected systems' },
      { value: 'B', label: 'Benchmarks, thresholds or metric definitions are not consistently documented' },
      { value: 'C', label: 'The same checks are repeated even when nothing meaningful has changed' },
      { value: 'D', label: 'Important risks, anomalies or opportunities are discovered too late' },
      { value: 'E', label: 'It is unclear who owns each signal or who should respond' },
      { value: 'F', label: 'Every recommendation requires human review before action' },
      { value: 'G', label: 'None of these / I am not sure', exclusive: true },
    ],
    q5First: 'Before the next planning, reporting or performance-review cycle (within 30 days)',
    comparable: 'A comparable workflow could include scheduled collection of approved metrics, comparison against defined thresholds and owners, change-only signals, signal history, and human approval before any next action.',
    built: "BChanel created a workflow that reviews approved metrics on a defined schedule, compares them against agreed thresholds, and generates signals only when a new or changed condition requires attention.",
    verifiedResults: "The published case reports earlier visibility into meaningful changes, fewer repetitive dashboard checks, and continued human control over every recommended action. The case provides qualitative outcomes, so no numerical savings should be added.",
  },
};

/* Deterministic solution module for each non-exclusive Q4 condition (route -> Q4 value).
   Shown in the route's original option order, at most two. */
const Q4_MODULES = {
  "amazon_ads": {
    "A": "The workflow would need brand- and account-level data separation while maintaining one consolidated reporting view.",
    "B": "The design should include an approved source map and collection schedule for the business, campaign and supporting reports.",
    "C": "A governed calculation layer could apply the agreed definitions for ACOS, TACOS, ROAS, CTR, CVR and other approved KPIs.",
    "D": "The workflow should centralize transformation and validation rules to reduce dependency on manually maintained spreadsheet formulas.",
    "E": "Metric definitions, report ownership and review responsibilities should be agreed before the reporting workflow is automated.",
    "F": "The workflow should preserve a clear human review and approval checkpoint before the report is distributed."
  },
  "fba_tracking": {
    "A": "The dashboard would need consistent shipment records with filters and ownership separated by brand, account or warehouse.",
    "B": "The workflow could prioritize exception-based monitoring so the team reviews delayed shipments instead of checking every active shipment.",
    "C": "Approved delay thresholds and exception rules should be defined before alerts are introduced.",
    "D": "Shipment statuses, delay classifications and ownership rules should be standardized across the team.",
    "E": "The workflow could include early-warning signals and an escalation path before shipment delays create inventory risk.",
    "F": "Shipment information could be synchronized from Amazon into a controlled dashboard and relevant communication channel without repeated copying."
  },
  "guesty_finance": {
    "A": "The reporting structure should preserve property- and entity-level separation while providing one consolidated financial view.",
    "B": "The workflow would need clear rules for new, updated and cancelled reservation events.",
    "C": "A validation and categorization layer should be applied before financial information reaches the reporting view.",
    "D": "The design should define the trusted source for each field and the rules used to synchronize Guesty with the approved reporting systems.",
    "E": "An event-driven update process could reduce dependence on a repeated nightly extraction and reconciliation cycle.",
    "F": "The workflow could provide a live multi-property view using consistent financial fields, statuses and filters."
  },
  "revenue_signals": {
    "A": "The workflow should begin with an approved source map and a defined collection schedule for each metric.",
    "B": "KPI definitions, benchmarks and alert thresholds should be agreed before automated monitoring begins.",
    "C": "Change-only signals could suppress unchanged conditions and reduce unnecessary dashboard reviews.",
    "D": "The workflow could surface exceptions, anomalies or meaningful changes before the next scheduled manual review.",
    "E": "Each signal should have a defined owner, response expectation and escalation path.",
    "F": "Every signal should remain subject to human review before any recommendation or operational action is taken."
  }
};

/* Q2 only changes the starting-point sentence, never the selected case. */
const Q2_STARTING_POINT = {
  manual: 'The starting point would be to document the current manual steps, confirm the approved inputs and systems, and define ownership before designing the future workflow.',
  partial: 'The starting point would be to review the existing dashboard, connector, or automation, identify where manual checks and exceptions remain, and preserve the components that already work.',
  unclear: 'The starting point would be to map how the workflow currently operates and confirm how information moves between people and systems before recommending any implementation.',
};
const Q4_ADDITIONAL_SENTENCE = 'Additional operating conditions should be validated during workflow design.';

const STORAGE_KEY = 'wfAssessmentV4';

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
  console.log('[track]', eventName, params || {});
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

/* Internal lead-qualification score. Stored with the lead, never displayed. */
function computeInternalScore(q2Value, q3Value, conditionCount, q5Value) {
  const q2Points = { A: 2, B: 2, C: 1, D: 1, E: 0 }[q2Value] || 0;
  const q3Points = { A: 0, B: 1, C: 2, D: 3, E: 0 }[q3Value] || 0;
  const complexityPoints = conditionCount >= 3 ? 2 : conditionCount === 2 ? 1 : 0;
  const urgencyPoints = q5Value === 'A' ? 2 : q5Value === 'B' ? 1 : 0;
  const score = q2Points + q3Points + complexityPoints + urgencyPoints;
  const priority = score >= 7 ? 'High' : score >= 4 ? 'Medium' : 'Low';
  return { score, priority };
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
  document.getElementById('lead-error').style.display = ok ? 'none' : 'block';
  return ok;
}

async function submitLead() {
  const r = computeResult();
  const q = currentQuestions();
  const q4Labels = (state.answers.q4 || []).map((v) => optionLabel(q[3], v));
  const payload = {
    // Fields the existing Make.com / Google Sheet mapping already reads
    industry: state.industry,
    industryLabel: r.industryLabel,
    answers: state.answers,
    answerLabels: {
      q1: optionLabel(q[0], state.answers.q1),
      q2: optionLabel(q[1], state.answers.q2),
      q3: optionLabel(q[2], state.answers.q3),
      q4: q4Labels,
      q5: optionLabel(q[4], state.answers.q5),
    },
    resultFamily: r.routeId,
    resultTitle: r.route.title,
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    lead: state.lead,
    utm: state.utm,
    submitted_at: new Date().toISOString(),

    // V4 case-led fields
    workflow_result_id: r.routeId,
    q2_current_method: optionLabel(q[1], state.answers.q2),
    q3_effort: optionLabel(q[2], state.answers.q3),
    annual_effort_label: r.annualLabel,
    q4_complexity: q4Labels,
    q5_urgency: optionLabel(q[4], state.answers.q5),
    internal_score: r.score,
    internal_priority: r.priority,
    direct_case_url: r.route.caseUrl,
  };

  /* CRM write only — no automatic result email or PDF in this phase. */
  const res = await fetch(LEAD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Lead submission failed: ' + res.status);

  console.log('[lead submission] sent (redacted)', {
    industry: payload.industry,
    workflow_result_id: payload.workflow_result_id,
    internal_priority: payload.internal_priority,
    questionnaireVersion: payload.questionnaireVersion,
  });

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
      await submitLead();
      showScreen('result');
      renderResult();
    } catch (err) {
      console.error('[lead submission] failed');
      document.getElementById('lead-error').textContent = 'Something went wrong submitting your info. Please try again.';
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
