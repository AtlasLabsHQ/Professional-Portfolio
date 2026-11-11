/* Platform explorer: the map's content. Generic and invented: no client, system or person names, no real data.
   Used by explore.js in the browser, and by the build (under Node) to write the static map and the text version. */
(function () {
  'use strict';
  const LAYERS = [
    { id: 'sources', title: 'Sources', sub: 'where data starts', nodes: ['src-dw', 'src-cube', 'src-sp', 'src-files'] },
    { id: 'platform', title: 'Data platform', sub: 'raw, cleaned, business-ready', nodes: ['raw', 'cleaned', 'ready', 'orch'] },
    { id: 'serving', title: 'Serving', sub: 'what apps and reports read', nodes: ['models', 'sqldb', 'agents'] },
    { id: 'exp', title: 'Experiences', sub: 'what people use', nodes: ['exec', 'apps', 'auto', 'qa'] },
    { id: 'people', title: 'People', sub: 'who it is for', nodes: ['csuite', 'leaders', 'ops', 'clients'] }
  ];
  const LANE = { id: 'build', title: 'How it gets built', sub: 'the delivery system behind all of the above', nodes: ['suite', 'control'] };

  /* kind: which mini interactive the panel shows. */
  const NODES = {
    'src-dw': { label: 'Cloud data warehouse', what: 'A cloud data warehouse that holds finance and client data.', changed: 'Read from, never changed. The platform adds the layers, the rules and the monitoring around it.', role: 'Architect and builder of how it is read.' },
    'src-cube': { label: 'On-premises sources', what: 'Sources that live on the company network, reached through a data gateway.', changed: 'Its figures flow into the same governed platform as everything else, instead of staying in a silo.', role: 'Architect and builder.' },
    'src-sp': { label: 'SharePoint and Dataverse', what: 'Lists, forms and business tables that people already work in.', changed: 'What teams capture by hand becomes data the platform can use, with checks on the way in.', role: 'Architect and builder.' },
    'src-files': { label: 'File stores', what: 'Files that arrive from partners and teams.', changed: 'Files land in the platform on a schedule instead of being opened and re-keyed by hand.', role: 'Architect and builder.' },
    raw: { label: 'Raw', what: 'Data lands exactly as it arrives, so there is always a trail back to the source.', changed: 'Nothing is lost or silently altered.', role: 'Architect and builder.' },
    cleaned: { label: 'Cleaned', what: 'Types fixed, duplicates and bad rows handled. Organised by subject area: finance, clients, operations and more.', changed: 'One tidy, consistent version of each subject area.', role: 'Architect and builder.' },
    ready: { label: 'Business-ready', what: 'Joined together and defined with the business’s own definitions, ready for models and apps.', changed: 'Every report and app starts from the same numbers.', role: 'Architect and builder.' },
    orch: { label: 'Orchestration pipeline', what: 'One pipeline runs the whole chain through the day, with explicit failure rules (what may carry on, what must stop) and an alert at each stage.', changed: 'Data refreshes through the day and tells you when something breaks.', role: 'Architect and builder.' },
    models: { label: 'Semantic models', what: 'Governed models with row-level security, so each leader sees their own figures.', changed: 'One definition of every measure, and the right people see the right rows.', role: 'Designed and built.' },
    sqldb: { label: 'SQL database for apps', what: 'A SQL database that apps can read and write, built on the same governed data.', changed: 'Apps get a proper shared record instead of spreadsheets.', role: 'Designed and built.' },
    agents: { label: 'Natural-language data agents', what: 'Ask a question in plain English and get an answer from the governed data.', changed: 'Leaders can ask their own questions without waiting for a new report.', role: 'Designed and built; the executive agent is being added.' },
    exec: { label: 'Executive reporting', badge: 'Try it', kind: 'exec', what: 'A governed view of actual, budget, latest estimate and prior-year performance for the C-suite, with each regional leader seeing their own figures. Now adding a natural-language data agent.', changed: 'One version of the truth for leadership, instead of separate packs.', role: 'Designed, built and run.' },
    apps: { label: 'Business apps', badge: 'Try it', kind: 'apps', what: 'A SQL database and web app on Fabric to replace manual, spreadsheet-based order tracking: shared editing with an audit log, saved views and dashboards.', changed: 'One shared, audited record the operations team can work on together. Status: built; rolling out.', role: 'Designed and built.' },
    auto: { label: 'Automations', badge: 'Try it', kind: 'auto', what: 'Solutions that take manual processes off people’s desks: a finance approval workflow, collecting data from external partners, and read-only health monitors that check every flow and data pipeline every day. Flows are defined in code and compared with what is live before any change.', changed: 'Processes that ran on email and spreadsheets now run themselves, with an audit trail and early warning.', role: 'Designed and built them; I own changes to production.' },
    qa: { label: 'Data Q&A desk', badge: 'Try it', kind: 'qa', what: 'A read-only service that answers ad hoc data questions from the governed data, using the business’s own definitions. Every answer is rechecked by a separate agent before it goes out, and arrives as a ready-to-send reply plus a spreadsheet with the data and notes.', changed: 'Fast, consistent answers without waiting for a new report.', role: 'Designed and built.' },
    csuite: { label: 'C-suite', what: 'The leadership team.', changed: 'One version of the truth instead of separate packs.', role: 'I design the reporting around how they actually read it.' },
    leaders: { label: 'Regional leaders', what: 'Leaders of each region.', changed: 'They see their own figures, from the same governed source as everyone else.', role: 'Row-level security designed and built.' },
    ops: { label: 'Operations', what: 'The teams who run orders and day-to-day processes.', changed: 'One shared, audited record to work on together, and fewer manual steps.', role: 'Apps and automations designed and built for them.' },
    clients: { label: 'Clients', what: 'The clients the group serves.', changed: 'KPI reporting taken from scoping to live service.', role: 'Client reporting designed and built.' },
    suite: { label: 'Agentic delivery suite', what: 'Toolkits for Power BI reports, Fabric apps and Power Platform, each with roles for requirements, build, independent review, testing and release, under an overseer with a state document and human sign-off.', changed: 'Many projects in parallel, each supervised, each with an audit trail.', role: 'Designed and built.', link: ['how-i-work.html#map', 'See the system map on How I work'] },
    control: { label: 'Agent control room', badge: 'Try it', kind: 'control', what: 'A small local dashboard to supervise many AI agent projects at once: a map of every project lead (overseer) by area, the specialist agents under each, a “needs you” stack of decisions waiting on a person, and a console to read and message each one. A policy decides which agents may message which. It runs on the laptop and uses no AI itself.', changed: 'One person can oversee many parallel workstreams without losing track or becoming the message bus.', role: 'Designed and built.', link: ['how-i-work.html#method', 'Read the method in full'] }
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
    ['ready', 'models'], ['ready', 'sqldb'], ['ready', 'agents'],
    ['models', 'exec'], ['agents', 'qa'], ['sqldb', 'apps'], ['sqldb', 'auto'],
    ['exec', 'csuite'], ['exec', 'leaders'], ['exec', 'clients'], ['qa', 'leaders'], ['apps', 'ops'], ['auto', 'ops'],
    ['control', 'suite', 'watches']
  ];

  const DATA = { LAYERS: LAYERS, LANE: LANE, NODES: NODES, FOLLOW: FOLLOW, EDGES: EDGES };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA; else window.EXPLORE = DATA;
})();
