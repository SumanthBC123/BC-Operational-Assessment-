/* Workflow Review — front-end prototype (v2)
   Rule-based recommendation engine runs entirely client-side, no score shown.
   CRM/email/analytics calls are stubbed — see TODO markers. */

const QUESTIONNAIRE_VERSION = 'v2.0';

const WORKFLOWS = [
  { id: 'reporting', label: 'Reporting', description: 'Preparing recurring reports and performance updates' },
  { id: 'onboarding', label: 'Onboarding', description: 'Getting customers, employees, or vendors ready to start' },
  { id: 'approvals', label: 'Approvals', description: 'Reviewing requests and authorizing the next step' },
  { id: 'fulfillment', label: 'Fulfillment / Inventory', description: 'Managing orders, stock, and fulfillment activities' },
  { id: 'service', label: 'Service Delivery', description: 'Coordinating the work required to deliver a service' },
  { id: 'finance', label: 'Finance / Billing', description: 'Preparing invoices, reconciling information, or managing payments' },
  { id: 'other', label: 'Other', description: 'Another recurring process in your business' },
];

const SECTION_LABELS = {
  1: 'Workload & Impact',
  2: 'How Work Moves',
  3: 'Consistency & Continuity',
};

const QUESTIONS = [
  {
    id: 'frequency',
    section: 1,
    shortLabel: 'Workflow frequency',
    text: 'How often does this workflow run?',
    helper: 'Think about the specific process you selected, rather than the department as a whole.',
    confirmLabel: 'How often this workflow actually runs',
    options: [
      { value: 'several_daily', label: 'Several times a day' },
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly or less often' },
      { value: 'unsure', label: 'I’m not sure', unsure: true },
    ],
  },
  {
    id: 'effort',
    section: 1,
    shortLabel: 'Manual effort',
    text: 'In a typical week, how much team time goes into manual work within this workflow?',
    helper: 'Include copying information, preparing updates, coordinating handoffs, and following up. Estimate the combined time across the team, averaged over the past four weeks.',
    confirmLabel: 'How much manual effort this workflow takes each week',
    options: [
      { value: 'lt1', label: 'Less than 1 hour per week' },
      { value: '1to3', label: '1–3 hours per week' },
      { value: '4to8', label: '4–8 hours per week' },
      { value: 'gt8', label: 'More than 8 hours per week' },
      { value: 'unsure', label: 'I’m not sure', unsure: true },
    ],
  },
  {
    id: 'impact',
    section: 1,
    shortLabel: 'Business impact',
    text: 'When this workflow does not go as planned, what is the main consequence?',
    helper: 'Choose the most significant consequence your business actually experiences, not a hypothetical worst case.',
    confirmLabel: 'What happens when this workflow does not go as planned',
    options: [
      { value: 'minor', label: 'Minor inconvenience, with little effect on delivery' },
      { value: 'extra_work', label: 'Extra work or internal delays' },
      { value: 'customer_facing', label: 'Customer-facing delays or service problems' },
      { value: 'serious', label: 'Financial, compliance, or other serious business consequences' },
      { value: 'none', label: 'We have not experienced a meaningful problem' },
      { value: 'unsure', label: 'I’m not sure', unsure: true },
    ],
  },
  {
    id: 'ownership',
    section: 2,
    shortLabel: 'Ownership',
    text: 'How clear is ownership when the next step needs attention?',
    helper: 'Think about who is responsible for moving the work forward or resolving a problem.',
    confirmLabel: 'Who owns the next step in this workflow',
    options: [
      { value: 'clear', label: 'The responsible person is clear' },
      { value: 'b', label: 'Ownership is usually clear, but some situations need discussion', finding: 'moderate' },
      { value: 'c', label: 'The team often needs to decide who should act', finding: 'strong' },
      { value: 'unsure', label: 'I’m not sure', unsure: true },
    ],
  },
  {
    id: 'info_transfer',
    section: 2,
    shortLabel: 'Information transfer',
    text: 'How does information move between the tools used in this workflow?',
    helper: 'Consider spreadsheets, email, business software, and any other places where the same information is recorded.',
    confirmLabel: 'How information moves between the tools used',
    options: [
      { value: 'clean', label: 'Information transfers without manual re-entry' },
      { value: 'b', label: 'Some information is copied or entered again', finding: 'moderate' },
      { value: 'c', label: 'The same information is repeatedly entered in several places', finding: 'strong' },
      { value: 'single_tool', label: 'This workflow uses only one tool or information source', na: true },
      { value: 'unsure', label: 'I’m not sure', unsure: true },
    ],
  },
  {
    id: 'status_visibility',
    section: 2,
    shortLabel: 'Status visibility',
    text: 'How do people find the current status and next step?',
    helper: 'Think about how someone involved in the workflow checks progress without interrupting another person.',
    confirmLabel: 'Where to find the current status and next step',
    options: [
      { value: 'reliable', label: 'They can check a reliable shared source' },
      { value: 'b', label: 'They check several places to put the picture together', finding: 'moderate' },
      { value: 'c', label: 'They usually need to ask someone or chase an update', finding: 'strong' },
      { value: 'unsure', label: 'I’m not sure', unsure: true },
    ],
  },
  {
    id: 'approvals',
    section: 2,
    shortLabel: 'Approvals',
    text: 'What usually happens when this workflow needs approval?',
    helper: 'Consider whether people know who should approve, what information is needed, and when a response is expected.',
    confirmLabel: 'What happens when this workflow needs approval',
    options: [
      { value: 'clear', label: 'The approval is clear and arrives within the expected time' },
      { value: 'b', label: 'Some approvals require reminders or cause delays', finding: 'moderate' },
      { value: 'c', label: 'Work regularly waits because the approval path or timing is unclear', finding: 'strong' },
      { value: 'not_required', label: 'This workflow does not require approval', na: true },
      { value: 'unsure', label: 'I’m not sure', unsure: true },
    ],
  },
  {
    id: 'exceptions',
    section: 3,
    shortLabel: 'Exception handling',
    text: 'What happens when a case falls outside the normal process?',
    helper: 'An exception might involve missing information, an unusual request, a mismatch, or a case that needs escalation.',
    confirmLabel: 'How exceptions are handled in this workflow',
    options: [
      { value: 'clear', label: 'There is a clear way to handle or escalate it' },
      { value: 'b', label: 'The team can resolve it, but the approach varies', finding: 'moderate' },
      { value: 'c', label: 'People improvise or wait because there is no clear approach', finding: 'strong' },
      { value: 'not_relevant', label: 'Exceptions are not relevant to this workflow', na: true },
      { value: 'unsure', label: 'I’m not sure', unsure: true },
    ],
  },
  {
    id: 'consistency',
    section: 3,
    shortLabel: 'Process consistency',
    text: 'How consistent are the steps and decision rules?',
    helper: 'Think about whether different people can follow the same approach and understand how decisions should be made.',
    confirmLabel: 'How consistent the steps and decision rules are',
    options: [
      { value: 'clear', label: 'The steps and rules are clear and repeatable' },
      { value: 'b', label: 'There is a usual approach, but some decisions are informal', finding: 'moderate' },
      { value: 'c', label: 'The approach depends heavily on who is doing the work', finding: 'strong' },
      { value: 'unsure', label: 'I’m not sure', unsure: true },
    ],
  },
  {
    id: 'continuity',
    section: 3,
    shortLabel: 'Workflow continuity',
    text: 'What happens if the person who knows this workflow best is unavailable?',
    helper: 'Consider whether another person can continue the important work using the instructions and information already available.',
    confirmLabel: 'What happens if the person who knows this workflow best is unavailable',
    options: [
      { value: 'clear', label: 'Someone else can continue using the available instructions' },
      { value: 'b', label: 'Work continues, but needs extra help or takes longer', finding: 'moderate' },
      { value: 'c', label: 'Important work stops or decisions wait for that person', finding: 'strong' },
      { value: 'unsure', label: 'I’m not sure', unsure: true },
    ],
  },
];

const QUESTIONS_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
const ALL_QUESTION_IDS = QUESTIONS.map((q) => q.id);
const TIER1_IDS = ['ownership', 'exceptions', 'consistency', 'continuity']; // Q4, Q8, Q9, Q10
const TIER2_IDS = ['info_transfer', 'status_visibility', 'approvals']; // Q5, Q6, Q7

const FINDING_TEXT = {
  ownership: {
    moderate: 'Some responsibilities need clarification.',
    strong: 'Work regularly waits while the team decides who should act.',
  },
  info_transfer: {
    moderate: 'Information is manually copied or entered again.',
    strong: 'The same information is repeatedly entered in several places, creating rework and mismatch risk.',
  },
  status_visibility: {
    moderate: 'The current status is difficult to find in one reliable place.',
    strong: 'People usually have to chase someone just to find the current status.',
  },
  approvals: {
    moderate: 'Approvals sometimes delay the workflow.',
    strong: 'Work regularly waits because the approval path or timing is unclear.',
  },
  exceptions: {
    moderate: 'Exception handling is not fully consistent.',
    strong: 'People improvise or wait because there is no clear way to handle exceptions.',
  },
  consistency: {
    moderate: 'Some steps or decision rules are informal.',
    strong: 'The approach depends heavily on who is doing the work.',
  },
  continuity: {
    moderate: 'The workflow needs stronger backup coverage.',
    strong: 'Important work stops or decisions wait on one specific person.',
  },
};

const FREQ_LABELS = {
  several_daily: 'several times a day',
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly or less often',
};
const EFFORT_LABELS = {
  lt1: 'requires less than 1 hour of manual work per week',
  '1to3': 'requires approximately 1–3 hours of manual work per week',
  '4to8': 'requires approximately 4–8 hours of manual work per week',
  gt8: 'requires more than 8 hours of manual work per week',
};

const CLARIFY_SUMMARY = 'Your answers suggest that some responsibilities, operating rules, exception paths, or continuity arrangements need clarification before introducing automation.';
const COORDINATION_SUMMARY = 'Your answers suggest that information flow, status visibility, or approvals are creating avoidable coordination work.';
const RISK_WARNING_TEXT = 'You reported that problems in this workflow may create financial, compliance, or other serious business consequences. Review the relevant controls, requirements, and failure points with the responsible team before introducing changes.';
const IMPACT_LABELS = {
  minor: 'a minor inconvenience',
  extra_work: 'extra work or internal delays',
  customer_facing: 'customer-facing delays or service problems',
  serious: 'financial, compliance, or other serious business consequences',
  none: 'no meaningful problem so far',
};

const RECOMMENDATIONS = {
  clarify: {
    title: 'Clarify the Workflow First',
    firstStep: 'Write down the main steps, responsible people, and decision rules. Address the unclear responsibilities, exceptions, or backup arrangements highlighted in your answers.',
  },
  coordination: {
    title: 'Improve Workflow Coordination',
    firstStep: 'Review where information is copied, how status is tracked, and where approvals wait. Start with the issues highlighted in your answers.',
  },
  confirm_details: {
    title: 'Confirm the Missing Details',
    firstStep: 'Review the unanswered details with someone who operates this workflow before deciding what to change.',
  },
  automation: {
    title: 'Explore a Targeted Automation Opportunity',
    firstStep: 'Identify one repeatable manual step. Confirm its inputs, rules, exceptions, and expected benefit before selecting a tool.',
  },
  baseline: {
    title: 'Establish a Baseline Before Making Changes',
    firstStep: 'Track the workflow’s manual effort, delays, and errors before deciding whether a change is needed.',
  },
  review_risks: {
    title: 'Review the Risks Before Making Changes',
    firstStep: 'Review the workflow’s controls, failure points, and business requirements with the responsible team before introducing changes.',
  },
};

const STORAGE_KEY = 'wfAssessmentV2';

const state = {
  workflow: null,
  workflowName: '',
  answers: {},
  currentIndex: 0,
  editingFromReview: false,
  lead: {},
  utm: {},
};

const screens = {
  hero: document.getElementById('screen-hero'),
  workflow: document.getElementById('screen-workflow'),
  question: document.getElementById('screen-question'),
  review: document.getElementById('screen-review'),
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

/* ---------- Analytics stub ----------
   TODO: confirm GTM container / GA4 property, then replace these
   dataLayer.push calls with the agreed event schema.
   Personal details (name/email/company) must never be passed here. */
function track(eventName, params) {
  if (typeof window.gtag === 'function') window.gtag('event', eventName, params || {});
  console.log('[track]', eventName, params || {});
}

/* ---------- Pending-link placeholder ----------
   Shown when a button's real destination (booking link, hosted PDF)
   hasn't been confirmed yet, so clicking it doesn't look broken. */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

/* ---------- Confirm modal ---------- */
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

/* ---------- UTM capture ---------- */
function captureUTMs() {
  const params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
    if (params.get(key)) state.utm[key] = params.get(key);
  });
}

/* ---------- Session persistence (non-personal fields only) ---------- */
function persistState() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      workflow: state.workflow,
      workflowName: state.workflowName,
      answers: state.answers,
      currentIndex: state.currentIndex,
      screen: currentScreenName,
    }));
  } catch (err) { /* storage unavailable — assessment still works, just won't survive a refresh */ }
}

function restoreState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || !saved.workflow) return false;
    state.workflow = saved.workflow;
    state.workflowName = saved.workflowName || '';
    state.answers = saved.answers || {};
    state.currentIndex = saved.currentIndex || 0;
    return saved.screen || 'workflow';
  } catch (err) {
    return false;
  }
}

function workflowLabelFor(id) {
  const wf = WORKFLOWS.find((w) => w.id === id);
  return wf ? wf.label : '';
}

function workflowDisplayName() {
  return (state.workflowName && state.workflowName.trim()) || workflowLabelFor(state.workflow);
}

/* ---------- Workflow select screen ---------- */
function updateWorkflowContinueState() {
  const btn = document.getElementById('workflow-continue');
  const input = document.getElementById('workflowName');
  if (!state.workflow) { btn.disabled = true; return; }
  btn.disabled = state.workflow === 'other' && input.value.trim().length === 0;
}

function renderWorkflowGrid() {
  const grid = document.getElementById('workflow-grid');
  grid.innerHTML = '';
  WORKFLOWS.forEach((wf) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'workflow-card';
    if (state.workflow === wf.id) btn.classList.add('selected');
    btn.innerHTML = `<span class="label">${wf.label}</span><span class="wf-desc">${wf.description}</span>`;
    btn.addEventListener('click', () => selectWorkflow(wf, btn));
    grid.appendChild(btn);
  });

  const wrap = document.getElementById('workflow-name-wrap');
  const nameInput = document.getElementById('workflowName');
  if (state.workflow) {
    wrap.hidden = false;
    nameInput.value = state.workflowName || '';
    updateWorkflowNameLabel();
  } else {
    wrap.hidden = true;
  }
  updateWorkflowContinueState();
}

function updateWorkflowNameLabel() {
  const label = document.getElementById('workflow-name-label');
  const input = document.getElementById('workflowName');
  if (state.workflow === 'other') {
    label.textContent = 'Briefly describe this workflow';
    input.placeholder = 'For example: Vendor compliance checks';
  } else {
    label.textContent = 'What do you call this workflow?';
    input.placeholder = 'For example: Weekly sales reporting';
  }
}

function selectWorkflow(wf, btn) {
  state.workflow = wf.id;
  document.querySelectorAll('.workflow-card').forEach((c) => c.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('workflow-name-wrap').hidden = false;
  updateWorkflowNameLabel();
  updateWorkflowContinueState();
  persistState();
}

function requestChangeWorkflow() {
  const hasAnswers = Object.keys(state.answers).length > 0;
  const doChange = () => {
    state.workflow = null;
    state.workflowName = '';
    state.answers = {};
    state.currentIndex = 0;
    state.editingFromReview = false;
    document.getElementById('workflowName').value = '';
    showScreen('workflow');
    renderWorkflowGrid();
  };
  if (hasAnswers) {
    showConfirm('Changing your workflow will clear your current answers. Continue?', doChange);
  } else {
    doChange();
  }
}

/* ---------- Question screen ---------- */
function renderQuestion() {
  const q = QUESTIONS[state.currentIndex];
  const total = QUESTIONS.length;
  const step = state.currentIndex + 1;
  const answeredCount = Object.keys(state.answers).length;

  document.getElementById('progress-fill').style.width = `${(answeredCount / total) * 100}%`;
  document.getElementById('assessing-label').textContent = `Assessing: ${workflowDisplayName()}`;
  document.getElementById('step-label').textContent = `Question ${step} of ${total}`;
  document.getElementById('section-label').textContent = SECTION_LABELS[q.section];
  document.getElementById('q-title').textContent = q.text;
  document.getElementById('q-helper').textContent = q.helper;

  const list = document.getElementById('option-list');
  list.innerHTML = '';
  q.options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option';
    if (state.answers[q.id] === opt.value) btn.classList.add('selected');
    btn.innerHTML = `<span class="dot"></span><span class="label">${opt.label}</span>`;
    btn.addEventListener('click', () => {
      state.answers[q.id] = opt.value;
      persistState();
      renderQuestion();
    });
    list.appendChild(btn);
  });

  document.getElementById('q-back').style.visibility = step === 1 ? 'hidden' : 'visible';
  const continueBtn = document.getElementById('q-continue');
  continueBtn.disabled = state.answers[q.id] === undefined;
  if (state.editingFromReview) {
    continueBtn.textContent = 'Save & Return to Review';
  } else if (step === total) {
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
  QUESTIONS.forEach((q, i) => {
    const val = state.answers[q.id];
    const opt = q.options.find((o) => o.value === val);
    const row = document.createElement('div');
    row.className = 'review-row';
    row.innerHTML = `
      <div class="review-text">
        <span class="review-q">${q.shortLabel}</span>
        <span class="review-a">${opt ? opt.label : 'Not answered'}</span>
      </div>
      <button type="button" class="btn btn-ghost btn-small review-edit">Edit</button>`;
    row.querySelector('.review-edit').addEventListener('click', () => {
      state.editingFromReview = true;
      goToQuestion(i);
    });
    list.appendChild(row);
  });
}

/* ---------- Recommendation engine ---------- */
function findingFor(qid) {
  const q = QUESTIONS_BY_ID[qid];
  const opt = q.options.find((o) => o.value === state.answers[qid]);
  if (opt && opt.finding) {
    return { qid, shortLabel: q.shortLabel, tier: opt.finding, text: FINDING_TEXT[qid][opt.finding] };
  }
  return null;
}

function computeResult() {
  const freq = state.answers.frequency;
  const effort = state.answers.effort;
  const impact = state.answers.impact;

  const tier1Findings = TIER1_IDS.map(findingFor).filter(Boolean);
  const tier2Findings = TIER2_IDS.map(findingFor).filter(Boolean);
  const unsureIds = ALL_QUESTION_IDS.filter((qid) => state.answers[qid] === 'unsure');

  const impactSerious = impact === 'serious';

  let outcome;
  if (tier1Findings.length) outcome = 'clarify';
  else if (tier2Findings.length) outcome = 'coordination';
  else if (impactSerious) outcome = 'review_risks';
  else if (unsureIds.length) outcome = 'confirm_details';
  else {
    const effortHigh = effort === '4to8' || effort === 'gt8';
    outcome = effortHigh ? 'automation' : 'baseline';
  }

  // Serious consequences always warrant a warning, even when clarify/coordination
  // already covers the underlying process problem (never applies to automation/
  // baseline, since impactSerious routes to review_risks before either is reached).
  const riskWarning = impactSerious && (outcome === 'clarify' || outcome === 'coordination');

  // All supported findings, shown as a flat list rather than forced into prose.
  const areasToReview = (outcome === 'clarify' || outcome === 'coordination')
    ? tier1Findings.concat(tier2Findings)
    : [];

  let contextSentence = '';
  const freqPart = freq && freq !== 'unsure' ? `runs ${FREQ_LABELS[freq]}` : null;
  const effortPart = effort && effort !== 'unsure' ? EFFORT_LABELS[effort] : null;
  if (freqPart && effortPart) contextSentence = `This workflow ${freqPart} and ${effortPart}.`;
  else if (freqPart) contextSentence = `This workflow ${freqPart}.`;
  else if (effortPart) contextSentence = `This workflow ${effortPart}.`;
  if (impact && impact !== 'unsure' && impact !== 'none') {
    contextSentence += `${contextSentence ? ' ' : ''}When it doesn’t go as planned, the main reported consequence is ${IMPACT_LABELS[impact]}.`;
  }

  let explanation;
  if (outcome === 'clarify') {
    explanation = CLARIFY_SUMMARY;
  } else if (outcome === 'coordination') {
    explanation = COORDINATION_SUMMARY;
  } else if (outcome === 'confirm_details') {
    explanation = unsureIds.length <= 2
      ? 'A few details still need to be confirmed. Review the items below before making a final decision.'
      : 'Several important details about this workflow are still unclear. Confirm the items below with someone who operates the process day to day before deciding what to change.';
  } else if (outcome === 'automation') {
    explanation = `Your answers did not highlight a clear coordination or process-definition problem. ${contextSentence} This does not establish whether automation would be worthwhile.`.trim();
  } else if (outcome === 'baseline') {
    explanation = `Your answers did not highlight a clear coordination or process-definition problem, and reported manual effort is relatively low. ${contextSentence} Track this workflow’s effort, delays, and errors before deciding whether a change is needed.`.trim();
  } else {
    explanation = `Your answers did not highlight a coordination or process-definition problem, but this workflow’s consequences when things go wrong are serious. ${contextSentence} Review the controls and requirements before considering any change.`.trim();
  }

  const beforeAutomate = `Confirm the process rules, exceptions, and trusted data sources for ${workflowDisplayName()} before automating any part of it.`;

  return {
    outcome,
    recommendation: RECOMMENDATIONS[outcome],
    explanation,
    areasToReview,
    unsureIds,
    riskWarning,
    beforeAutomate,
  };
}

function renderResult() {
  const result = computeResult();
  state.lastOutcome = result.outcome;

  document.getElementById('result-workflow').textContent = state.workflowName
    ? `${workflowLabelFor(state.workflow)} — ${state.workflowName}`
    : workflowLabelFor(state.workflow);

  document.getElementById('result-recommendation').textContent = result.recommendation.title;
  document.getElementById('result-explanation').textContent = result.explanation;
  document.getElementById('result-first-step').textContent = result.recommendation.firstStep;
  document.getElementById('result-before-automate').textContent = result.beforeAutomate;

  const otherBlock = document.getElementById('other-areas-block');
  const otherList = document.getElementById('other-areas-list');
  if (result.areasToReview.length) {
    otherList.innerHTML = result.areasToReview.map((f) => `<div class="finding-row">${f.text}</div>`).join('');
    otherBlock.hidden = false;
  } else {
    otherBlock.hidden = true;
  }

  const confirmBlock = document.getElementById('confirm-details-block');
  const confirmList = document.getElementById('confirm-details-list');
  if (result.unsureIds.length) {
    confirmList.innerHTML = result.unsureIds
      .map((qid) => `<div class="finding-row">${QUESTIONS_BY_ID[qid].confirmLabel}</div>`)
      .join('');
    confirmBlock.hidden = false;
  } else {
    confirmBlock.hidden = true;
  }

  document.getElementById('risk-block').hidden = !result.riskWarning;

  track('assessment_result_shown', {
    workflow: state.workflow,
    recommendation: result.outcome,
    risk_warning: result.riskWarning,
    questionnaire_version: QUESTIONNAIRE_VERSION,
  });
}

/* ---------- Lead capture ---------- */
function validateLeadForm() {
  const form = document.getElementById('lead-form');
  const email = form.email.value.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const ok = form.firstName.value.trim().length > 0
    && emailOk
    && form.company.value.trim().length > 0
    && form.consent.checked;
  document.getElementById('lead-error').style.display = ok ? 'none' : 'block';
  return ok;
}

/* ---------- Submission stub ---------- */
async function submitLead() {
  const result = computeResult();
  const payload = {
    workflow: state.workflow,
    workflowName: state.workflowName,
    answers: state.answers,
    recommendation: result.outcome,
    recommendationTitle: result.recommendation.title,
    firstStep: result.recommendation.firstStep,
    areasToReview: result.areasToReview.map((f) => f.text),
    detailsToConfirm: result.unsureIds.map((qid) => QUESTIONS_BY_ID[qid].confirmLabel),
    riskWarning: result.riskWarning ? RISK_WARNING_TEXT : null,
    beforeAutomate: result.beforeAutomate,
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    lead: state.lead,
    marketingOptIn: state.lead.marketingOptIn,
    utm: state.utm,
    submitted_at: new Date().toISOString(),
  };

  /* Personal details are intentionally kept out of the console and analytics.
     TODO: replace with the real CRM/database + email-trigger endpoint once confirmed.
     Expected shape: POST JSON `payload` to a webhook (e.g. Make.com scenario) that
     (a) writes the row to the agreed CRM/sheet, and
     (b) sends `lead.email` a results email containing: selected workflow + custom
         name, all submitted answers, the suggested starting point, supported
         findings (areasToReview), the first recommended action, details requiring
         confirmation, the risk warning when present, a link to the printable
         diagnostic, and the BChanel consultation CTA. Do not mark the request as
         delivered in the UI until this webhook/email service reports success.
  const res = await fetch('REPLACE_WITH_WEBHOOK_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Lead submission failed');
  */
  console.log('[lead submission] prepared (redacted)', {
    workflow: payload.workflow,
    recommendation: payload.recommendation,
    questionnaireVersion: payload.questionnaireVersion,
  });

  track('lead_submitted', { workflow: state.workflow, recommendation: result.outcome });
  return true;
}

/* ---------- Full reset ---------- */
function resetAssessment() {
  state.workflow = null;
  state.workflowName = '';
  state.answers = {};
  state.currentIndex = 0;
  state.editingFromReview = false;
  state.lead = {};
  try { sessionStorage.removeItem(STORAGE_KEY); } catch (err) { /* ignore */ }
  showScreen('hero');
}

/* ---------- Wire up events ---------- */
document.addEventListener('DOMContentLoaded', () => {
  captureUTMs();
  renderWorkflowGrid();

  const restoredScreen = restoreState();

  document.getElementById('start-assessment').addEventListener('click', () => {
    track('assessment_start', { utm: state.utm });
    showScreen('workflow');
  });

  document.getElementById('workflowName').addEventListener('input', (e) => {
    state.workflowName = e.target.value;
    updateWorkflowContinueState();
    persistState();
  });

  document.getElementById('workflow-continue').addEventListener('click', () => {
    track('workflow_selected', { workflow: state.workflow });
    goToQuestion(0);
  });

  document.getElementById('change-workflow-link').addEventListener('click', requestChangeWorkflow);
  document.getElementById('review-change-workflow').addEventListener('click', requestChangeWorkflow);

  document.getElementById('q-back').addEventListener('click', () => {
    if (state.currentIndex === 0) return;
    goToQuestion(state.currentIndex - 1);
  });
  document.getElementById('q-continue').addEventListener('click', () => {
    if (state.editingFromReview) {
      state.editingFromReview = false;
      showScreen('review');
      renderReview();
    } else if (state.currentIndex < QUESTIONS.length - 1) {
      goToQuestion(state.currentIndex + 1);
    } else {
      track('assessment_complete', { workflow: state.workflow, questionnaire_version: QUESTIONNAIRE_VERSION });
      showScreen('review');
      renderReview();
    }
  });

  document.getElementById('review-continue').addEventListener('click', () => {
    showScreen('result');
    renderResult();
  });

  const leadForm = document.getElementById('lead-form');
  leadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateLeadForm()) return;

    state.lead = {
      firstName: leadForm.firstName.value.trim(),
      email: leadForm.email.value.trim(),
      company: leadForm.company.value.trim(),
      role: leadForm.role.value.trim(),
      marketingOptIn: leadForm.marketing.checked,
    };

    const submitBtn = document.getElementById('lead-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      await submitLead();
      submitBtn.textContent = 'Request Sent';
      document.getElementById('lead-success').hidden = false;
      Array.from(leadForm.elements).forEach((el) => { el.disabled = true; });
    } catch (err) {
      console.error('[lead submission] failed');
      document.getElementById('lead-error').textContent = 'Something went wrong submitting your info. Please try again.';
      document.getElementById('lead-error').style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Email My Summary';
    }
  });

  document.getElementById('final-cta').addEventListener('click', () => {
    track('final_cta_click', { workflow: state.workflow });
  });
  document.getElementById('pdf-download').addEventListener('click', () => {
    track('pdf_download_click', { workflow: state.workflow });
    /* TODO: point at the hosted Operational Friction Diagnostic PDF URL */
    showToast('PDF not hosted yet — this will download the diagnostic once it’s ready.');
  });
  document.getElementById('assess-another').addEventListener('click', () => {
    track('assess_another_click', {});
    resetAssessment();
  });

  /* Resume mid-assessment after a refresh (non-personal state only) */
  if (restoredScreen && restoredScreen !== 'hero') {
    renderWorkflowGrid();
    if (restoredScreen === 'question') {
      goToQuestion(Math.min(state.currentIndex, QUESTIONS.length - 1));
    } else if (restoredScreen === 'review') {
      showScreen('review');
      renderReview();
    } else if (restoredScreen === 'result') {
      showScreen('result');
      renderResult();
    } else {
      showScreen('workflow');
    }
  }
});
