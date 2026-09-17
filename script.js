/* Workflow Automation Assessment — front-end prototype
   Scoring + flow logic run entirely client-side.
   CRM/email/analytics calls are stubbed — see TODO markers. */

const WORKFLOWS = [
  { id: 'reporting', label: 'Reporting' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'approvals', label: 'Approvals' },
  { id: 'fulfillment', label: 'Fulfillment / Inventory' },
  { id: 'service', label: 'Service Delivery' },
  { id: 'finance', label: 'Finance / Billing' },
  { id: 'other', label: 'Other' },
];

const QUESTIONS = [
  {
    id: 'handoffs',
    name: 'Manual handoffs',
    text: 'How often does this workflow require someone to manually hand it off to the next person, rather than it moving forward on its own?',
    action: 'Map the handoff points in this workflow and assign clear ownership at each one before introducing any new tooling.',
  },
  {
    id: 'duplicate_entry',
    name: 'Duplicate data entry',
    text: 'How often does the same piece of information get typed or re-entered into more than one system or spreadsheet?',
    action: 'Identify exactly where the same data is entered more than once and connect those systems before anything else.',
  },
  {
    id: 'status_chasing',
    name: 'Status chasing',
    text: 'How often does someone have to chase colleagues or vendors just to find out where a task currently stands?',
    action: 'Introduce a single shared status view so people stop chasing each other for updates.',
  },
  {
    id: 'unclear_ownership',
    name: 'Unclear ownership',
    text: 'How often is it unclear exactly who owns the next step when something in this workflow stalls or breaks?',
    action: 'Clarify who owns each step of this workflow before changing any part of the underlying process.',
  },
  {
    id: 'scattered_info',
    name: 'Scattered information',
    text: 'How often do people need to check multiple tools, inboxes, or spreadsheets to get the full picture of this workflow?',
    action: 'Consolidate this workflow’s sources of truth into one place before adding new systems.',
  },
  {
    id: 'manual_reporting',
    name: 'Manual reporting',
    text: 'How often does someone have to manually pull together numbers or status updates to report on this workflow?',
    action: 'Automate the reporting rollup itself before touching the process that feeds it.',
  },
  {
    id: 'approvals',
    name: 'Approval delays',
    text: 'How often do approvals sit and wait on one specific person, slowing the whole process down?',
    action: 'Redesign the approval path to remove unnecessary waiting points and single points of delay.',
  },
  {
    id: 'visibility',
    name: 'Limited visibility',
    text: 'How often do stakeholders lack real-time visibility into where things actually stand in this workflow?',
    action: 'Build a simple, shared visibility layer so stakeholders can see status without asking.',
  },
  {
    id: 'exceptions',
    name: 'Frequent exceptions',
    text: 'How often does an exception or edge case break the normal process and require special handling?',
    action: 'Document the recurring exceptions so they’re handled consistently instead of case by case.',
  },
  {
    id: 'key_person',
    name: 'Key-person dependency',
    text: 'How often does this workflow depend on one specific person, such that their absence would create a real problem?',
    action: 'Document this workflow end to end and cross-train a backup before layering on more tooling.',
  },
];

const OPTIONS = [
  { value: 0, label: 'Rarely', hint: 'This rarely happens' },
  { value: 1, label: 'Sometimes', hint: 'This happens sometimes' },
  { value: 2, label: 'Frequently', hint: 'This happens frequently' },
];

const RESULT_TIERS = [
  { key: 'limited', min: 0, max: 5, label: 'Limited Friction', tagClass: 'tag-limited',
    summary: 'This workflow runs fairly smoothly today. Automation here would likely deliver marginal returns — it’s worth focusing attention elsewhere first.' },
  { key: 'emerging', min: 6, max: 10, label: 'Emerging Friction', tagClass: 'tag-emerging',
    summary: 'Early friction is showing up in this workflow. Small clarifications now can prevent it from becoming a bigger bottleneck later.' },
  { key: 'significant', min: 11, max: 15, label: 'Significant Friction', tagClass: 'tag-significant',
    summary: 'This workflow has real, recurring friction. It’s a strong candidate for a closer look — likely a mix of clarification and targeted automation.' },
  { key: 'structural', min: 16, max: 20, label: 'Structural Friction', tagClass: 'tag-structural',
    summary: 'Friction is deeply embedded in how this workflow operates today. It’s worth reviewing ownership, process design, and tooling before automating anything.' },
];

const state = {
  workflow: null,
  answers: new Array(QUESTIONS.length).fill(null),
  currentQuestion: 0,
  lead: {},
  utm: {},
};

const screens = {
  hero: document.getElementById('screen-hero'),
  workflow: document.getElementById('screen-workflow'),
  question: document.getElementById('screen-question'),
  lead: document.getElementById('screen-lead'),
  result: document.getElementById('screen-result'),
};

function showScreen(name) {
  Object.values(screens).forEach((el) => el.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Analytics stub ----------
   TODO: confirm GTM container / GA4 property, then replace these
   dataLayer.push calls with the agreed event schema. */
function track(eventName, params) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
  console.log('[track]', eventName, params || {});
}

/* ---------- UTM capture ---------- */
function captureUTMs() {
  const params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
    if (params.get(key)) state.utm[key] = params.get(key);
  });
}

/* ---------- Workflow select screen ---------- */
function renderWorkflowGrid() {
  const grid = document.getElementById('workflow-grid');
  grid.innerHTML = '';
  WORKFLOWS.forEach((wf) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'workflow-card';
    btn.innerHTML = `<span class="label">${wf.label}</span>`;
    btn.addEventListener('click', () => {
      state.workflow = wf.id;
      document.querySelectorAll('.workflow-card').forEach((c) => c.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('workflow-continue').disabled = false;
    });
    grid.appendChild(btn);
  });
}

/* ---------- Question screen ---------- */
function renderQuestion() {
  const q = QUESTIONS[state.currentQuestion];
  const total = QUESTIONS.length;
  const step = state.currentQuestion + 1;

  document.getElementById('progress-fill').style.width = `${(step / total) * 100}%`;
  document.getElementById('step-label').textContent = `Question ${step} of ${total}`;
  document.getElementById('q-title').textContent = q.text;

  const list = document.getElementById('option-list');
  list.innerHTML = '';
  OPTIONS.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option';
    if (state.answers[state.currentQuestion] === opt.value) btn.classList.add('selected');
    btn.innerHTML = `
      <span class="dot"></span>
      <span>
        <span class="label">${opt.label}</span>
        <span class="hint">${opt.hint}</span>
      </span>`;
    btn.addEventListener('click', () => {
      state.answers[state.currentQuestion] = opt.value;
      renderQuestion();
    });
    list.appendChild(btn);
  });

  document.getElementById('q-back').style.visibility = step === 1 ? 'hidden' : 'visible';
  const continueBtn = document.getElementById('q-continue');
  continueBtn.disabled = state.answers[state.currentQuestion] === null;
  continueBtn.textContent = step === total ? 'See My Result' : 'Continue';
}

function goToQuestion(index) {
  state.currentQuestion = index;
  showScreen('question');
  renderQuestion();
}

/* ---------- Lead capture ---------- */
function validateLeadForm() {
  const form = document.getElementById('lead-form');
  const email = form.email.value.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const workEmailOk = emailOk; // TODO: optionally block common free-mail domains if BChanel wants "work email" enforced
  const ok = form.firstName.value.trim().length > 0
    && workEmailOk
    && form.company.value.trim().length > 0
    && form.role.value.trim().length > 0
    && form.consent.checked;
  document.getElementById('lead-error').style.display = ok ? 'none' : 'block';
  return ok;
}

/* ---------- Scoring + result ---------- */
function computeResult() {
  const total = state.answers.reduce((sum, v) => sum + v, 0);
  const tier = RESULT_TIERS.find((t) => total >= t.min && total <= t.max);

  const ranked = QUESTIONS
    .map((q, i) => ({ ...q, score: state.answers[i] }))
    .sort((a, b) => b.score - a.score);

  const topSignals = ranked.slice(0, 3);
  const topAction = ranked[0];

  return { total, tier, topSignals, topAction };
}

function renderResult() {
  const { total, tier, topSignals, topAction } = computeResult();

  document.getElementById('result-tag').textContent = tier.label;
  document.getElementById('result-tag').className = `result-tag ${tier.tagClass}`;
  document.getElementById('score-num').textContent = total;
  document.getElementById('result-summary').textContent = tier.summary;

  const list = document.getElementById('signals-list');
  list.innerHTML = '';
  topSignals.forEach((sig, i) => {
    const row = document.createElement('div');
    row.className = 'signal-row';
    row.innerHTML = `<span class="signal-badge">${i + 1}</span><span class="signal-name">${sig.name}</span>`;
    list.appendChild(row);
  });

  document.getElementById('action-text').textContent = topAction.action;

  track('assessment_result_shown', {
    workflow: state.workflow,
    score: total,
    tier: tier.key,
    top_signal: topAction.id,
  });
}

/* ---------- Submission stub ---------- */
async function submitLead() {
  const payload = {
    workflow: state.workflow,
    answers: state.answers,
    score: state.answers.reduce((s, v) => s + v, 0),
    lead: state.lead,
    utm: state.utm,
    submitted_at: new Date().toISOString(),
  };

  console.log('[lead submission payload]', payload);

  /* TODO: replace with the real CRM/database + email-trigger endpoint once confirmed.
     Expected shape: POST JSON `payload` to a webhook (e.g. Make.com scenario) that
     (a) writes the row to the agreed CRM/sheet, and
     (b) triggers the result + PDF-link email to lead.email.
  const res = await fetch('REPLACE_WITH_WEBHOOK_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Lead submission failed');
  */

  track('lead_submitted', { workflow: state.workflow, company: state.lead.company });
  return true;
}

/* ---------- Wire up events ---------- */
document.addEventListener('DOMContentLoaded', () => {
  captureUTMs();

  document.getElementById('start-assessment').addEventListener('click', () => {
    track('assessment_start', { utm: state.utm });
    showScreen('workflow');
  });

  renderWorkflowGrid();
  document.getElementById('workflow-continue').addEventListener('click', () => {
    track('workflow_selected', { workflow: state.workflow });
    goToQuestion(0);
  });

  document.getElementById('q-back').addEventListener('click', () => {
    if (state.currentQuestion === 0) return;
    goToQuestion(state.currentQuestion - 1);
  });
  document.getElementById('q-continue').addEventListener('click', () => {
    if (state.currentQuestion < QUESTIONS.length - 1) {
      goToQuestion(state.currentQuestion + 1);
    } else {
      track('assessment_complete', { workflow: state.workflow });
      showScreen('lead');
    }
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
    };

    const submitBtn = document.getElementById('lead-submit');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Calculating your result…';

    try {
      await submitLead();
      showScreen('result');
      renderResult();
    } catch (err) {
      console.error(err);
      document.getElementById('lead-error').textContent = 'Something went wrong submitting your info. Please try again.';
      document.getElementById('lead-error').style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Show My Result';
    }
  });

  document.getElementById('final-cta').addEventListener('click', () => {
    track('final_cta_click', { workflow: state.workflow });
    /* TODO: point at the confirmed booking/Calendly URL */
  });
  document.getElementById('pdf-download').addEventListener('click', () => {
    track('pdf_download_click', { workflow: state.workflow });
    /* TODO: point at the hosted Operational Friction Diagnostic PDF URL */
  });
});
