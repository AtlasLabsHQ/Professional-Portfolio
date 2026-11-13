/* Platform explorer: the map's content. Generic and invented: no client, system or person names, no real data.
   Used by explore.js in the browser, and by the build (under Node) to write the static map and the text version. */
(function () {
  'use strict';
  const LAYERS = [
    { id: 'sources', title: 'Sources', sub: 'where data starts', nodes: ['src-dw', 'src-cube', 'src-sp', 'src-files'] },
    { id: 'platform', title: 'Data platform', sub: 'raw, cleaned, business-ready', nodes: ['raw', 'cleaned', 'ready', 'orch'] },
    { id: 'serving', title: 'Serving', sub: 'what apps and reports read', nodes: ['models', 'sqldb', 'agents'] },
    { id: 'exp', title: 'Experiences', sub: 'what people use', nodes: ['exec', 'apps', 'auto', 'qa', 'workbook'] },
    { id: 'people', title: 'People', sub: 'who it is for', nodes: ['csuite', 'leaders', 'ops', 'clients'] }
  ];
  const LANE = { id: 'build', title: 'How it gets built', sub: 'One delivery method behind all of the above. I can run every step by hand; now my agents help run it, with me reviewing and signing off.', nodes: ['control', 'suite'] };
  /* The same steps in both modes, so the point lands: the agents follow the method I built by hand.
     kind: who runs the step with agents (build: an agent does it and I review; person: me; auto: automated, no AI). */
  const PIPE = [
    { t: 'Plan', hand: 'Requirements, scope and what done looks like, agreed with the people who will use it.', agents: 'The overseer agent drafts the plan and keeps the state document. I set the scope and the gates.', kind: 'build' },
    { t: 'Model the data', hand: 'Data modelling: the layers, the keys and the business definitions.', agents: 'An analyst agent profiles the data and drafts the model. I check it against how the business works.', kind: 'build' },
    { t: 'Build', hand: 'SQL and notebooks, Power Query, DAX and semantic models, flows and apps.', agents: 'A builder agent takes one scoped slice at a time, one writer per file.', kind: 'build' },
    { t: 'Test against the numbers', hand: 'Parity checks: every key figure compared with the source and the baseline.', agents: 'A tester agent runs the parity check and the user tests, with evidence.', kind: 'build' },
    { t: 'Review', hand: 'A review of the logic, the measures and the edge cases.', agents: 'A separate reviewer agent checks the change. I read what it found.', kind: 'build' },
    { t: 'Release', hand: 'Backup, a dry run, the release, then verify.', agents: 'Nothing ships without my sign-off. A release agent rehearses it first.', kind: 'person' },
    { t: 'Monitor', hand: 'Alerts and daily health checks, so I hear first when something breaks.', agents: 'Automated monitors, no AI, watch it. The control room shows me what needs me.', kind: 'auto' }
  ];

  /* kind: which mini interactive the panel shows. */
  const NODES = {
    'src-dw': { label: 'Cloud data warehouse', what: 'A cloud data warehouse that holds finance and client data.', changed: 'Read from, never changed. The platform adds the layers, the rules and the monitoring around it.', role: 'Architect and builder of how it is read.' },
    'src-cube': { label: 'On-premises sources', what: 'Sources that live on the company network, reached through a data gateway.', changed: 'Its figures flow into the same governed platform as everything else, instead of staying in a silo.', role: 'Architect and builder.' },
    'src-sp': { label: 'SharePoint and Dataverse', what: 'Lists, forms and business tables that people already work in.', changed: 'What teams capture by hand becomes data the platform can use, with checks on the way in.', role: 'Architect and builder.' },
    'src-files': { label: 'File stores', what: 'Files that arrive from partners and teams.', changed: 'Files land in the platform on a schedule instead of being opened and re-keyed by hand.', role: 'Architect and builder.' },
    raw: { label: 'Raw', what: 'Data lands exactly as it arrives, so there is always a trail back to the source.', changed: 'Nothing is lost or silently altered.', role: 'Architect and builder.' },
    cleaned: { label: 'Cleaned', what: 'Types fixed, duplicates and bad rows handled. Organised by subject area: finance, clients, operations and more.', changed: 'One tidy, consistent version of each subject area.', role: 'Architect and builder.' },
    ready: { label: 'Business-ready', badge: 'Try it', kind: 'platform', what: 'Joined together and defined with the business’s own definitions, ready for models and apps.', changed: 'Every report and app starts from the same numbers.', role: 'Architect and builder.' },
    orch: { label: 'Orchestration pipeline', what: 'One pipeline runs the whole chain through the day, with explicit failure rules (what may carry on, what must stop) and an alert at each stage.', changed: 'Data refreshes through the day and tells you when something breaks.', role: 'Architect and builder.' },
    models: { label: 'Semantic models', what: 'Governed models with row-level security, so each leader sees their own figures.', changed: 'One definition of every measure, and the right people see the right rows.', role: 'Designed and built.' },
    sqldb: { label: 'SQL database for apps', what: 'A SQL database that apps can read and write, built on the same governed data.', changed: 'Apps get a proper shared record instead of spreadsheets.', role: 'Designed and built.' },
    agents: { label: 'Natural-language data agents', what: 'Ask a question in plain English and a data agent answers it by reading the governed models, read-only. It uses the platform’s data; it is not a step in it.', changed: 'People can ask their own questions without waiting for a new report.', role: 'Designed and built, across all my workloads: executive, finance, operations and client reporting.' },
    exec: { label: 'Executive reporting', badge: 'Try it', kind: 'exec', what: 'A governed view of actual, budget, latest estimate and prior-year performance for the C-suite, with each regional leader seeing their own figures. With a natural-language data agent built on the model.', changed: 'One version of the truth for leadership, instead of separate packs.', role: 'Designed, built and run.' },
    apps: { label: 'Business apps', badge: 'Try it', kind: 'apps', what: 'A SQL database and web app on Fabric to replace manual, spreadsheet-based order tracking: shared editing with an audit log, saved views and dashboards.', changed: 'One shared, audited record the operations team can work on together. Status: built; rolling out.', role: 'Designed and built.' },
    auto: { label: 'Automations', badge: 'Try it', kind: 'auto', what: 'Solutions that take manual processes off people’s desks: a finance approval workflow, collecting data from external partners, data-sync solutions that keep a working SharePoint list in step with governed data, and read-only health monitors that check every flow and data pipeline every day. Flows are defined in code and compared with what is live before any change.', changed: 'Processes that ran on email and spreadsheets now run themselves, with an audit trail and early warning.', role: 'Designed and built them; I own changes to production.' },
    qa: { label: 'Data Q&A desk', badge: 'Try it', kind: 'qa', what: 'A read-only service that answers ad hoc data questions from the governed data, using the business’s own definitions. Every answer is rechecked by a separate agent before it goes out, and arrives as a ready-to-send reply plus a spreadsheet with the data and notes.', changed: 'Fast, consistent answers without waiting for a new report.', role: 'Designed and built.' },
    csuite: { label: 'C-suite', what: 'The leadership team.', changed: 'One version of the truth instead of separate packs.', role: 'I design the reporting around how they actually read it.' },
    leaders: { label: 'Regional leaders', what: 'Leaders of each region.', changed: 'They see their own figures, from the same governed source as everyone else.', role: 'Row-level security designed and built.' },
    ops: { label: 'Operations', what: 'The teams who run orders and day-to-day processes.', changed: 'One shared, audited record to work on together, and fewer manual steps.', role: 'Apps and automations designed and built for them.' },
    clients: { label: 'Clients', what: 'The clients the group serves.', changed: 'KPI reporting taken from scoping to live service.', role: 'Client reporting designed and built.' },
    suite: { label: 'Agentic delivery suite', badge: 'Try it', kind: 'suite', what: 'Toolkits for Power BI reports, Fabric apps and Power Platform, each with roles for requirements, build, independent review, testing and release, under an overseer with a state document and human sign-off.', changed: 'Many projects in parallel, each supervised, each with an audit trail.', role: 'Designed and built.', link: ['how-i-work.html#map', 'See the system map on How I work'] },
    control: { label: 'Agent control room', badge: 'Try it', kind: 'control', what: 'A small local dashboard to supervise many AI agent projects at once: a map of every project lead (overseer) by area, the specialist agents under each, a “needs you” stack of decisions waiting on a person, and a console to read and message each one. A policy decides which agents may message which. It runs on the laptop and uses no AI itself.', changed: 'One person can oversee many parallel workstreams without losing track or becoming the message bus.', role: 'Designed and built.', link: ['how-i-work.html#method', 'Read the method in full'] },
    workbook: { label: 'Workbook rebuilds', badge: 'Try it', kind: 'workbook', what: 'Takes complex legacy Excel workbooks, works out what they really do, then redesigns, rebuilds and tests them as drop-in replacements.', changed: 'Fragile spreadsheets become tested, maintainable tools.', role: 'Designed and built.' }
  };

  /* One record's journey, highlighted by "Follow the data". */
  const FOLLOW = [
    { node: 'src-dw', text: 'A record starts in a source: here, an order line in the cloud data warehouse.' },
    { node: 'raw', text: 'It lands in raw exactly as it arrived.' },
    { node: 'cleaned', text: 'It is cleaned: types fixed, duplicates removed, filed under its subject area.' },
    { node: 'ready', text: 'It is joined and defined with the business’s own definitions.' },
    { node: 'models', text: 'The governed model applies row-level security, so only the right people can see it.' },
    { node: 'exec', text: 'It appears in the executive report.' },
    { node: 'csuite', text: 'A leader reads it, and sees only the figures they are meant to.' }
  ];

  /* How data moves between the boxes: [from, to, style]. style 'runs' or 'watches' draws a dashed line. */
  const EDGES = [
    ['src-dw', 'raw'], ['src-cube', 'raw'], ['src-sp', 'raw'], ['src-files', 'raw'],
    ['raw', 'cleaned'], ['cleaned', 'ready'], ['orch', 'ready', 'runs'],
    ['ready', 'models'], ['ready', 'sqldb'], ['models', 'agents'],
    ['models', 'exec'], ['agents', 'qa'], ['sqldb', 'apps'], ['sqldb', 'auto'],
    ['exec', 'csuite'], ['exec', 'leaders'], ['exec', 'clients'], ['qa', 'leaders'], ['apps', 'ops'], ['auto', 'ops'],
    ['control', 'suite', 'watches'], ['workbook', 'ops']
  ];

  const DATA = { LAYERS: LAYERS, LANE: LANE, PIPE: PIPE, NODES: NODES, FOLLOW: FOLLOW, EDGES: EDGES };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA; else window.EXPLORE = DATA;
})();
