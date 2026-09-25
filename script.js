/* Workflow Automation Assessment — V3 (industry-branching, deterministic)
   No score, no live AI, no ROI estimates. Voting logic: Q1 sets the baseline
   vote, Q2 and Q5 each add one vote to a result family; highest tally wins,
   with the tie-break rules spelled out in computeResultFamily(). */

const QUESTIONNAIRE_VERSION = 'v3.0';
const LEAD_WEBHOOK_URL = 'https://hook.us2.make.com/rgnr1m57h2ipfopr7x9bibksc7puf15h';

const INDUSTRIES = [
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'hospitality', label: 'Hospitality' },
  { id: 'saas', label: 'SaaS / Software' },
  { id: 'other', label: 'Other / General Business' },
];

/* Every industry's Q1/Q2/Q5 options are ordered A-E to line up positionally
   with that industry's 5 result families (index 4 is always the
   "foundations" fallback family). Q1 alone also has an F option
   ("Other / I am not sure") that also maps to index 4 and flags the
   tie-break rule in computeResultFamily(). */
const INDUSTRY_DATA = {
  ecommerce: {
    q3Label: 'Reported effort',
    families: ['ppc_ads', 'inventory_visibility', 'sales_reporting', 'catalog_ops', 'foundations'],
    questions: [
      {
        id: 'q1',
        text: 'Which e-commerce workflow would you like help reviewing first?',
        options: [
          { value: 'A', label: 'Amazon or retail-media advertising and PPC' },
          { value: 'B', label: 'Inventory, FBA/inbound shipments, or stock availability' },
          { value: 'C', label: 'Sales and performance reporting across channels' },
          { value: 'D', label: 'Product listings, catalog, or content updates' },
          { value: 'E', label: 'Order fulfillment or customer-service handoffs' },
          { value: 'F', label: 'Other / I am not sure' },
        ],
      },
      {
        id: 'q2',
        text: 'What currently creates the most avoidable work in this workflow?',
        options: [
          { value: 'A', label: 'Campaign data is manually downloaded or combined' },
          { value: 'B', label: 'Stock, shipment, or receiving status must be checked manually' },
          { value: 'C', label: 'Sales data is consolidated across reports or spreadsheets' },
          { value: 'D', label: 'Product information is repeatedly updated in different places' },
          { value: 'E', label: 'People chase approvals, ownership, or status updates' },
        ],
      },
      {
        id: 'q3',
        text: 'Approximately how much team time does this workflow require each week?',
        options: [
          { value: 'A', label: 'Less than 2 hours' },
          { value: 'B', label: '2–5 hours' },
          { value: 'C', label: '6–10 hours' },
          { value: 'D', label: 'More than 10 hours' },
          { value: 'E', label: 'I am not sure' },
        ],
      },
      {
        id: 'q4',
        text: 'Which tools are currently involved in this workflow?',
        helper: 'Select all that apply.',
        multiSelect: true,
        options: [
          { value: 'A', label: 'Amazon Seller Central or Amazon Ads' },
          { value: 'B', label: 'Shopify or another marketplace/store platform' },
          { value: 'C', label: 'Google Sheets or Excel' },
          { value: 'D', label: 'ERP, WMS, or inventory software' },
          { value: 'E', label: 'BI or reporting platform' },
          { value: 'F', label: 'Project/task-management tool' },
          { value: 'G', label: 'Other / I am not sure' },
        ],
      },
      {
        id: 'q5',
        text: 'Which improvement would create the most value for your team?',
        options: [
          { value: 'A', label: 'Reduce PPC reporting and analysis time' },
          { value: 'B', label: 'Improve inventory and shipment visibility' },
          { value: 'C', label: 'Create one reliable performance-reporting view' },
          { value: 'D', label: 'Make product and catalog updates faster and more consistent' },
          { value: 'E', label: 'Reduce handoff delays and clarify ownership' },
        ],
      },
    ],
    results: {
      ppc_ads: {
        title: 'PPC Reporting & Ads Operations',
        conclusion: 'Your answers suggest that campaign reporting and analysis require repeated manual consolidation. The first opportunity is to standardize the reporting workflow and trusted inputs.',
        actions: ['Document report inputs', 'Define metric ownership', 'Test one repeatable reporting step before expanding automation'],
        proof: 'Home Pick — Amazon Ads Reporting Workflow Case',
      },
      inventory_visibility: {
        title: 'Inventory & Shipment Visibility',
        conclusion: 'Your answers suggest that inventory or shipment status is difficult to monitor consistently. A shared source of truth should be established before adding alerts or automation.',
        actions: ['Map status sources', 'Define delay/exception rules', 'Create one reliable operating view'],
        proof: 'FBA Shipment Tracking Workflow Case',
      },
      sales_reporting: {
        title: 'Sales & Performance Reporting',
        conclusion: 'Your answers suggest that performance information is fragmented across channels or spreadsheets. Reporting definitions and data ownership should be clarified first.',
        actions: ['List data sources', 'Align KPI definitions', 'Establish one reporting cadence and owner'],
        proof: 'Home Pick reporting case as a related example',
      },
      catalog_ops: {
        title: 'Catalog & Product Operations',
        conclusion: 'Your answers suggest that product information is maintained through repeated manual updates. The priority is to define the source record and update rules.',
        actions: ['Identify duplicate updates', 'Assign the source of truth', 'Standardize validation and exception handling'],
        proof: 'Workflow Cases overview',
      },
      foundations: {
        title: 'E-commerce Operations Foundations',
        conclusion: 'Your answers suggest that ownership, handoffs, or status visibility need clarification before selecting an automation opportunity.',
        actions: ['Map the workflow', 'Assign owners and escalation points', 'Identify one bottleneck to measure'],
        proof: 'Workflow Cases overview (Client Onboarding as a related cross-system example)',
      },
    },
  },

  hospitality: {
    q3Label: 'Operating scale',
    families: ['reservation_coordination', 'guest_communication', 'turnover_coordination', 'finance_reconciliation', 'multi_property_visibility'],
    questions: [
      {
        id: 'q1',
        text: 'Which hospitality workflow would you like help reviewing first?',
        options: [
          { value: 'A', label: 'Reservations and availability coordination' },
          { value: 'B', label: 'Guest communication and arrival experience' },
          { value: 'C', label: 'Housekeeping, maintenance, or turnover coordination' },
          { value: 'D', label: 'Property finance and reconciliation' },
          { value: 'E', label: 'Multi-property reporting and operational visibility' },
          { value: 'F', label: 'Other / I am not sure' },
        ],
      },
      {
        id: 'q2',
        text: 'Where does the team experience the most avoidable work?',
        options: [
          { value: 'A', label: 'Reservation details or availability require manual checking' },
          { value: 'B', label: 'Guest messages and follow-ups are repetitive or inconsistent' },
          { value: 'C', label: 'Cleaning, maintenance, or turnover tasks require repeated coordination' },
          { value: 'D', label: 'Financial information is manually extracted or reconciled' },
          { value: 'E', label: 'Managers cannot see a reliable status across properties' },
        ],
      },
      {
        id: 'q3',
        text: 'How many properties or locations are included in this workflow?',
        options: [
          { value: 'A', label: '1 property/location' },
          { value: 'B', label: '2–5' },
          { value: 'C', label: '6–20' },
          { value: 'D', label: 'More than 20' },
          { value: 'E', label: 'The number changes / I am not sure' },
        ],
      },
      {
        id: 'q4',
        text: 'Which tools are currently involved in this workflow?',
        helper: 'Select all that apply.',
        multiSelect: true,
        options: [
          { value: 'A', label: 'PMS such as Guesty or another property platform' },
          { value: 'B', label: 'Airbnb, Booking.com, VRBO, or another channel' },
          { value: 'C', label: 'Email, SMS, or guest-messaging tools' },
          { value: 'D', label: 'Cleaning, maintenance, or task-management tools' },
          { value: 'E', label: 'Accounting, spreadsheets, or BI tools' },
          { value: 'F', label: 'Other / I am not sure' },
        ],
      },
      {
        id: 'q5',
        text: 'Which improvement would create the most value for your operation?',
        options: [
          { value: 'A', label: 'More reliable reservation and availability coordination' },
          { value: 'B', label: 'Faster and more consistent guest communication' },
          { value: 'C', label: 'Better turnover and task coordination' },
          { value: 'D', label: 'Less manual finance and reconciliation work' },
          { value: 'E', label: 'Real-time visibility across properties' },
        ],
      },
    ],
    results: {
      reservation_coordination: {
        title: 'Reservation Coordination',
        conclusion: 'Your answers suggest that reservation and availability information requires repeated checking or coordination. The first step is to clarify system ownership and exception rules.',
        actions: ['Map reservation sources', 'Define the trusted availability record', 'Document conflict and exception handling'],
        proof: 'TAIMS is a related hospitality example, not a reservation-specific case',
      },
      guest_communication: {
        title: 'Guest Communication',
        conclusion: 'Your answers suggest that guest communication depends on repeated manual follow-up. Standardize triggers, message ownership, and escalation before automating communications.',
        actions: ['Map guest-message moments', 'Approve templates and owners', 'Define when a person must intervene'],
        proof: 'Workflow Cases overview; no dedicated guest-communication case currently',
      },
      turnover_coordination: {
        title: 'Turnover & Task Coordination',
        conclusion: 'Your answers suggest that turnover work is coordinated across people or tools without one reliable operational view.',
        actions: ['Define turnover stages', 'Assign owners and deadlines', 'Create an exception/escalation path'],
        proof: 'TAIMS as a related hospitality workflow example',
      },
      finance_reconciliation: {
        title: 'Finance & Reconciliation',
        conclusion: 'Your answers suggest that property financial information requires manual extraction or reconciliation. Data definitions and validation controls should be clarified first.',
        actions: ['List financial sources', 'Define reconciliation rules', 'Test a controlled automated update'],
        proof: 'TAIMS — Guesty Finance Workflow Case',
      },
      multi_property_visibility: {
        title: 'Multi-property Visibility',
        conclusion: 'Your answers suggest that managers lack a consistent view across properties. The priority is to define common statuses, owners, and reporting rules.',
        actions: ['Agree common status definitions', 'Identify source systems', 'Build one management view'],
        proof: 'TAIMS — Guesty Finance Workflow Case as a related visibility example',
      },
    },
  },

  saas: {
    q3Label: 'Reported effort',
    families: ['customer_onboarding', 'support_success', 'billing_renewals', 'revenue_ops_reporting', 'cross_functional_foundations'],
    questions: [
      {
        id: 'q1',
        text: 'Which SaaS workflow would you like help reviewing first?',
        options: [
          { value: 'A', label: 'Lead or customer onboarding' },
          { value: 'B', label: 'Customer support and success operations' },
          { value: 'C', label: 'Subscription billing, renewals, or collections' },
          { value: 'D', label: 'Revenue operations and performance reporting' },
          { value: 'E', label: 'Product, project, or internal-delivery handoffs' },
          { value: 'F', label: 'Other / I am not sure' },
        ],
      },
      {
        id: 'q2',
        text: 'What currently creates the most avoidable work in this workflow?',
        options: [
          { value: 'A', label: 'Customer information is repeatedly handed off or entered again' },
          { value: 'B', label: 'Requests, tickets, or follow-ups are difficult to coordinate' },
          { value: 'C', label: 'Billing or renewal steps require manual checking and follow-up' },
          { value: 'D', label: 'Teams build reports from disconnected data sources' },
          { value: 'E', label: 'Ownership and status are unclear across teams' },
        ],
      },
      {
        id: 'q3',
        text: 'Approximately how much team time does this workflow require each week?',
        options: [
          { value: 'A', label: 'Less than 2 hours' },
          { value: 'B', label: '2–5 hours' },
          { value: 'C', label: '6–10 hours' },
          { value: 'D', label: 'More than 10 hours' },
          { value: 'E', label: 'I am not sure' },
        ],
      },
      {
        id: 'q4',
        text: 'Which tools are currently involved in this workflow?',
        helper: 'Select all that apply.',
        multiSelect: true,
        options: [
          { value: 'A', label: 'CRM or marketing-automation platform' },
          { value: 'B', label: 'Customer-support or success platform' },
          { value: 'C', label: 'Subscription billing or accounting platform' },
          { value: 'D', label: 'Project, product, or engineering-management tool' },
          { value: 'E', label: 'Data warehouse, BI, spreadsheets, or reporting tools' },
          { value: 'F', label: 'Other / I am not sure' },
        ],
      },
      {
        id: 'q5',
        text: 'Which improvement would create the most value for your team?',
        options: [
          { value: 'A', label: 'Faster, more consistent customer onboarding' },
          { value: 'B', label: 'Better support visibility and response coordination' },
          { value: 'C', label: 'Fewer billing or renewal follow-ups' },
          { value: 'D', label: 'One reliable revenue and performance view' },
          { value: 'E', label: 'Clearer ownership across product and delivery teams' },
        ],
      },
    ],
    results: {
      customer_onboarding: {
        title: 'Customer Onboarding',
        conclusion: 'Your answers suggest that customer onboarding depends on repeated handoffs or duplicate entry. Clarify ownership and required information before connecting systems.',
        actions: ['Map onboarding stages', 'Define required data and owners', 'Automate one verified handoff'],
        proof: 'Client Onboarding & Project Delivery — related IT Services example, not a SaaS case',
      },
      support_success: {
        title: 'Support & Customer Success',
        conclusion: 'Your answers suggest that requests and follow-ups are difficult to coordinate consistently. The first priority is shared status and clear escalation.',
        actions: ['Define request categories', 'Establish ownership/SLA rules', 'Create one status view'],
        proof: 'Workflow Cases overview; no dedicated SaaS-support case currently',
      },
      billing_renewals: {
        title: 'Billing & Renewals',
        conclusion: 'Your answers suggest that billing or renewal activity requires repeated checking or follow-up. Standardize triggers, records, and exception ownership first.',
        actions: ['Map billing events', 'Define renewal/failure rules', 'Test one notification or handoff'],
        proof: 'Client Onboarding case is only a related invoicing example',
      },
      revenue_ops_reporting: {
        title: 'Revenue Operations & Reporting',
        conclusion: 'Your answers suggest that revenue information is fragmented across systems. Metric definitions and trusted sources should be aligned before automating reporting.',
        actions: ['List data sources', 'Agree lifecycle/KPI definitions', 'Establish one reporting owner and cadence'],
        proof: 'Workflow Cases overview; Home Pick as a related cross-industry reporting example',
      },
      cross_functional_foundations: {
        title: 'Cross-functional Workflow Foundations',
        conclusion: 'Your answers suggest that ownership and status across teams require clarification before introducing more tools or automation.',
        actions: ['Map cross-team handoffs', 'Assign owners', 'Define completion and escalation rules'],
        proof: 'Client Onboarding & Project Delivery as a related cross-functional example',
      },
    },
  },

  other: {
    q3Label: 'Reported effort',
    families: ['reporting_data_prep', 'onboarding_coordination', 'approval_workflow_clarity', 'finance_reconciliation', 'service_workflow_foundations'],
    questions: [
      {
        id: 'q1',
        text: 'Which business workflow would you like help reviewing first?',
        options: [
          { value: 'A', label: 'Reporting and data preparation' },
          { value: 'B', label: 'Client, employee, or vendor onboarding' },
          { value: 'C', label: 'Approvals and administrative requests' },
          { value: 'D', label: 'Finance, billing, or reconciliation' },
          { value: 'E', label: 'Service delivery and cross-team coordination' },
          { value: 'F', label: 'Other / I am not sure' },
        ],
      },
      {
        id: 'q2',
        text: 'What currently creates the most avoidable work in this workflow?',
        options: [
          { value: 'A', label: 'Reports are manually assembled from several sources' },
          { value: 'B', label: 'Information is repeatedly requested, handed off, or entered again' },
          { value: 'C', label: 'Work waits for approvals or unclear decisions' },
          { value: 'D', label: 'Financial information requires manual checking or reconciliation' },
          { value: 'E', label: 'People chase status, ownership, or next steps' },
        ],
      },
      {
        id: 'q3',
        text: 'Approximately how much team time does this workflow require each week?',
        options: [
          { value: 'A', label: 'Less than 2 hours' },
          { value: 'B', label: '2–5 hours' },
          { value: 'C', label: '6–10 hours' },
          { value: 'D', label: 'More than 10 hours' },
          { value: 'E', label: 'I am not sure' },
        ],
      },
      {
        id: 'q4',
        text: 'Which tools are currently involved in this workflow?',
        helper: 'Select all that apply.',
        multiSelect: true,
        options: [
          { value: 'A', label: 'CRM, forms, or marketing platform' },
          { value: 'B', label: 'Project or task-management platform' },
          { value: 'C', label: 'Accounting, billing, or finance platform' },
          { value: 'D', label: 'Google Sheets or Excel' },
          { value: 'E', label: 'Email, chat, or shared documents' },
          { value: 'F', label: 'BI or reporting platform' },
          { value: 'G', label: 'Other / I am not sure' },
        ],
      },
      {
        id: 'q5',
        text: 'Which improvement would create the most value for your team?',
        options: [
          { value: 'A', label: 'Faster and more reliable reporting' },
          { value: 'B', label: 'A more consistent onboarding experience' },
          { value: 'C', label: 'Faster approvals and clearer decisions' },
          { value: 'D', label: 'Less manual billing and reconciliation work' },
          { value: 'E', label: 'Clearer ownership, status, and service delivery' },
        ],
      },
    ],
    results: {
      reporting_data_prep: {
        title: 'Reporting & Data Preparation',
        conclusion: 'Your answers suggest that reporting depends on repeated collection or consolidation. The first step is to clarify definitions, sources, and ownership.',
        actions: ['List report inputs', 'Agree metric definitions', 'Establish one owner and reporting cadence'],
        proof: 'Home Pick as a related cross-industry reporting example',
      },
      onboarding_coordination: {
        title: 'Onboarding Coordination',
        conclusion: 'Your answers suggest that onboarding depends on repeated information requests or handoffs. Standardize required inputs and responsibility before automation.',
        actions: ['Map onboarding stages', 'Define required information', 'Automate one validated handoff'],
        proof: 'Client Onboarding & Project Delivery Workflow Case',
      },
      approval_workflow_clarity: {
        title: 'Approval Workflow Clarity',
        conclusion: 'Your answers suggest that work waits for approvals or unclear decisions. Approval criteria, ownership, and escalation should be documented first.',
        actions: ['List approval points', 'Remove duplicates', 'Define approver, response time, and escalation'],
        proof: 'Workflow Cases overview; no dedicated approval case currently',
      },
      finance_reconciliation: {
        title: 'Finance & Reconciliation',
        conclusion: 'Your answers suggest that finance work requires repeated checking or reconciliation. Define source records and controls before automating updates.',
        actions: ['Identify source records', 'Document validation rules', 'Test one controlled automated step'],
        proof: 'TAIMS finance case as a related cross-industry example',
      },
      service_workflow_foundations: {
        title: 'Service & Workflow Foundations',
        conclusion: 'Your answers suggest that ownership, status, or cross-team handoffs need clarification before additional tools or automation.',
        actions: ['Map the service workflow', 'Assign owners', 'Define handoff, completion, and escalation rules'],
        proof: 'Client Onboarding & Project Delivery as a related service-operations example',
      },
    },
  },
};

const STORAGE_KEY = 'wfAssessmentV3';

const state = {
  industry: null,
  answers: {}, // { q1: 'A', q2: 'A', q3: 'A', q4: ['A','B'], q5: 'A' }
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
    }));
  } catch (err) { /* storage unavailable — assessment still works, just won't survive a refresh */ }
}

function restoreState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    if (!saved || !saved.industry) return false;
    state.industry = saved.industry;
    state.answers = saved.answers || {};
    state.currentIndex = saved.currentIndex || 0;
    return saved.screen || 'industry';
  } catch (err) {
    return false;
  }
}

function industryLabelFor(id) {
  const ind = INDUSTRIES.find((i) => i.id === id);
  return ind ? ind.label : '';
}

function currentQuestions() {
  return INDUSTRY_DATA[state.industry].questions;
}

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

/* ---------- Question screen ---------- */
function renderQuestion() {
  const questions = currentQuestions();
  const q = questions[state.currentIndex];
  const total = questions.length;
  const step = state.currentIndex + 1;
  const answeredCount = questions.filter((qq) => {
    const a = state.answers[qq.id];
    return qq.multiSelect ? a && a.length : !!a;
  }).length;

  document.getElementById('progress-fill').style.width = `${(answeredCount / total) * 100}%`;
  document.getElementById('assessing-label').textContent = `Assessing: ${industryLabelFor(state.industry)}`;
  document.getElementById('step-label').textContent = `Question ${step} of ${total}`;
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
    btn.innerHTML = `<span class="dot"></span><span class="label">${opt.label}</span>`;
    btn.addEventListener('click', () => {
      if (q.multiSelect) {
        const arr = state.answers[q.id] ? state.answers[q.id].slice() : [];
        const idx = arr.indexOf(opt.value);
        if (idx > -1) arr.splice(idx, 1);
        else arr.push(opt.value);
        state.answers[q.id] = arr;
      } else {
        state.answers[q.id] = opt.value;
      }
      persistState();
      renderQuestion();
    });
    list.appendChild(btn);
  });

  document.getElementById('q-back').style.visibility = step === 1 ? 'hidden' : 'visible';
  const continueBtn = document.getElementById('q-continue');
  const answered = q.multiSelect ? currentAnswer && currentAnswer.length > 0 : !!currentAnswer;
  continueBtn.disabled = !answered;
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

/* ---------- Recommendation engine (deterministic voting, no score) ---------- */
function computeResultFamily() {
  const data = INDUSTRY_DATA[state.industry];
  const letterToIndex = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 4 };
  const q1Value = state.answers.q1;
  const q2Value = state.answers.q2;
  const q5Value = state.answers.q5;
  const q1Index = letterToIndex[q1Value];
  const q2Index = letterToIndex[q2Value];
  const q5Index = letterToIndex[q5Value];
  const q1IsOtherUnsure = q1Value === 'F';

  const tally = [0, 0, 0, 0, 0];
  tally[q1Index] += 1;
  tally[q2Index] += 1;
  tally[q5Index] += 1;

  const maxVotes = Math.max(...tally);
  const winners = [0, 1, 2, 3, 4].filter((i) => tally[i] === maxVotes);

  let winnerIndex;
  if (winners.length === 1) {
    winnerIndex = winners[0];
  } else if (!q1IsOtherUnsure && winners.includes(q1Index)) {
    winnerIndex = q1Index;
  } else if (winners.includes(q5Index)) {
    winnerIndex = q5Index;
  } else {
    winnerIndex = 4; // foundations fallback
  }

  return data.families[winnerIndex];
}

function computeResult() {
  const data = INDUSTRY_DATA[state.industry];
  const family = computeResultFamily();
  const result = data.results[family];
  const q1 = data.questions[0];
  const q3 = data.questions[2];
  const q4 = data.questions[3];

  const workflowAnswer = optionLabel(q1, state.answers.q1);
  const effortAnswer = optionLabel(q3, state.answers.q3);
  const toolsSelected = (state.answers.q4 || []).map((v) => optionLabel(q4, v));

  return {
    family,
    result,
    industryLabel: industryLabelFor(state.industry),
    workflowAnswer,
    q3Label: data.q3Label,
    effortAnswer,
    toolsSelected,
  };
}

function renderResult() {
  const r = computeResult();

  document.getElementById('result-industry-workflow').textContent = `${r.industryLabel} — ${r.workflowAnswer}`;
  document.getElementById('result-title').textContent = r.result.title;
  document.getElementById('result-conclusion').textContent = r.result.conclusion;

  document.getElementById('result-effort').textContent = `${r.q3Label}: ${r.effortAnswer}`;
  const toolsEl = document.getElementById('result-tools');
  if (r.toolsSelected.length) {
    toolsEl.textContent = `Tools involved: ${r.toolsSelected.join(', ')}`;
    toolsEl.hidden = false;
  } else {
    toolsEl.hidden = true;
  }

  const actionsList = document.getElementById('result-actions-list');
  actionsList.innerHTML = r.result.actions.map((a) => `<li>${a}</li>`).join('');

  document.getElementById('result-proof').textContent = r.result.proof;

  track('assessment_result_shown', {
    industry: state.industry,
    result_family: r.family,
    questionnaire_version: QUESTIONNAIRE_VERSION,
  });
}

/* ---------- Lead capture (gates the result; no auto-email in V3) ---------- */
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
  const payload = {
    industry: state.industry,
    industryLabel: r.industryLabel,
    answers: state.answers,
    answerLabels: {
      q1: optionLabel(q[0], state.answers.q1),
      q2: optionLabel(q[1], state.answers.q2),
      q3: optionLabel(q[2], state.answers.q3),
      q4: r.toolsSelected,
      q5: optionLabel(q[4], state.answers.q5),
    },
    resultFamily: r.family,
    resultTitle: r.result.title,
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    lead: state.lead,
    utm: state.utm,
    submitted_at: new Date().toISOString(),
  };

  /* V3: CRM write only — no automatic result email in this phase.
     TODO(Make.com): the Gmail step in this scenario must be disabled/removed
     so submissions here don't trigger the old V2 email send. */
  const res = await fetch(LEAD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Lead submission failed: ' + res.status);

  console.log('[lead submission] sent (redacted)', {
    industry: payload.industry,
    resultFamily: payload.resultFamily,
    questionnaireVersion: payload.questionnaireVersion,
  });

  track('lead_submitted', { industry: state.industry, result_family: r.family });
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
  showScreen('hero');
}

/* ---------- Wire up events ---------- */
document.addEventListener('DOMContentLoaded', () => {
  captureUTMs();
  renderIndustryGrid();

  const restoredScreen = restoreState();

  document.getElementById('start-assessment').addEventListener('click', () => {
    track('assessment_start', { utm: state.utm });
    showScreen('industry');
  });

  document.getElementById('industry-continue').addEventListener('click', () => {
    track('industry_selected', { industry: state.industry });
    goToQuestion(0);
  });

  document.getElementById('q-back').addEventListener('click', () => {
    if (state.currentIndex === 0) return;
    goToQuestion(state.currentIndex - 1);
  });
  document.getElementById('q-continue').addEventListener('click', () => {
    if (state.editingFromReview) {
      state.editingFromReview = false;
      showScreen('review');
      renderReview();
    } else if (state.currentIndex < currentQuestions().length - 1) {
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

  document.getElementById('final-cta').addEventListener('click', () => {
    track('final_cta_click', { industry: state.industry });
  });
  document.getElementById('assess-another').addEventListener('click', () => {
    track('assess_another_click', {});
    resetAssessment();
  });

  /* Resume mid-assessment after a refresh (non-personal state only) */
  if (restoredScreen && restoredScreen !== 'hero') {
    renderIndustryGrid();
    if (restoredScreen === 'question' && state.industry) {
      goToQuestion(Math.min(state.currentIndex, currentQuestions().length - 1));
    } else if (restoredScreen === 'review' && state.industry) {
      showScreen('review');
      renderReview();
    } else if (restoredScreen === 'lead' && state.industry) {
      showScreen('lead');
    } else if (state.industry) {
      showScreen('industry');
    }
  }
});
