/* Workflow Automation Assessment: shared questionnaire data and scoring.
   Loaded by the browser (window.WFA) and required by the serverless lead
   endpoint, so the server can recompute labels, score, priority and case URL
   from the raw answer codes instead of trusting the client. */
(function (root) {
const QUESTIONNAIRE_VERSION = 'v5.0';

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
    verifiedResults: "The published case reports earlier visibility into meaningful changes, fewer repetitive dashboard checks, and continued human control over every recommended action. These outcomes are qualitative; no numerical savings are claimed.",
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

const WFA = {
  QUESTIONNAIRE_VERSION, INDUSTRIES, Q1_BY_INDUSTRY, AGENCIES_INTRO, Q1_TEXT, Q3_OPTIONS,
  ANNUAL_UNMEASURED, q5Options, Q4_TEXT, Q4_HELPER, Q5_TEXT, ROUTES, Q4_MODULES,
  Q2_STARTING_POINT, Q4_ADDITIONAL_SENTENCE, computeInternalScore,
};
if (typeof module !== 'undefined' && module.exports) module.exports = WFA;
else root.WFA = WFA;
})(typeof window !== 'undefined' ? window : globalThis);
