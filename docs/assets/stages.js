/* The eight stages. Each one: a journey (the systems it touches, in order, and what runs each), a By hand and a
   With agents view (what I do myself; what agents take and what I still own), and one
   hero interaction worth about a minute. Mounted by stage.js. Every name, record and figure here is invented.
   Sections: 1 shared, 2 group data platform, 3 executive reporting, 4 automations, 5 agent control room,
   6 agentic delivery suite, 7 order-tracking app, 8 data Q&A desk, 9 workbook rebuilds. */
(function () {
  'use strict';
  const S = window.NNStage, Lb = S.lib, esc = Lb.esc, ICON = Lb.ICON, I = Lb.I, OK = Lb.OK, BAD = Lb.BAD, PLAY = Lb.PLAY, busy = Lb.busy, isBusy = Lb.isBusy;

  /* ======================= 1. SHARED ======================= */
  const nf = new Intl.NumberFormat('en-GB');
  function money(v) { const a = Math.abs(v); return (v < 0 ? '−' : '') + '£' + (a >= 10000 ? (a / 1000).toFixed(2) + 'm' : nf.format(Math.round(a)) + 'k'); }
  function smoney(v) { return (v < 0 ? '−' : '+') + money(Math.abs(v)); }
  /* a journey step: what happens there, what runs it, and (with agents) build help or a data agent beside it */
  function J(label, icon, what, runs, build, data) { return { label: label, icon: icon, what: what, runs: runs, build: build || '', data: data || '' }; }
  function range(a, b) { const o = []; for (let m = a; m <= b; m++) o.push(m); return o; }
  function kv(rows) {
    return '<table class="kv"><tbody>' + rows.map(function (r) {
      const tag = r[2] === 'chg' ? '<span class="chg c">changed here</span>' : r[2] === 'warn' ? '<span class="chg u">caught</span>' : r[2] === 'bad' ? '<span class="chg b">wrong</span>' : '';
      return '<tr' + (r[2] ? ' class="is-' + r[2] + '"' : '') + '><th scope="row">' + esc(r[0]) + '</th><td><span>' + esc(r[1]) + '</span>' + tag + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  /* one layer of a journey, as a card: what happened here on the left, the data at this point on the right */
  function layerCard(o) {
    return '<div class="lyr"><div class="lyr-main"><p class="eyebrow">' + o.eb + '</p><h3>' + esc(o.t) + '</h3><p>' + esc(o.d) + '</p>' +
      (o.rule ? '<p class="rule">' + ICON(I.loop, 14) + '<span>' + esc(o.rule) + '</span></p>' : '') +
      (o.value ? '<p class="lval"><span>' + esc(o.vl) + '</span><b>' + o.value + '</b></p>' : '') + '</div>' +
      '<div class="lyr-side"><h4>' + esc(o.st) + '</h4>' + o.side + '</div></div>';
  }
  /* "Where does this number come from?" The same figure at each layer, from the source to the report.
     The duplicates and the test order are invented, so the cleaning step has something to do. */
  const LDEF = {
    rev: { name: 'Revenue', model: 'Revenue = sum of net revenue', ready: 'Net of returns, with internal transfers left out.' },
    gm: { name: 'Gross margin', model: 'Gross margin = Revenue − Cost of sales', ready: 'Cost of sales comes from the finance ledger, matched to each order line.' },
    opex: { name: 'Operating expenses', model: 'Operating expenses = sum of operating cost lines', ready: 'Ledger accounts are mapped to cost centres with the business’s own chart of accounts.' },
    ebitda: { name: 'EBITDA', model: 'EBITDA = Gross margin − Operating expenses', ready: 'Built from the governed revenue, cost of sales and operating expense tables.' }
  };
  function lineage(key, sc) {
    const HP = window.HP, D = LDEF[key];
    const val = function (r, p) { const a = HP.aggregate(r, p, sc.months).a; return a[key]; };
    const v = val(sc.regions, sc.products);
    const parts = sc.regions.length > 1
      ? sc.regions.map(function (id) { return [HP.REGIONS.filter(function (r) { return r.id === id; })[0].name, val([id], sc.products)]; })
      : sc.products.map(function (id) { return [HP.PRODUCTS.filter(function (p) { return p.id === id; })[0].name, val(sc.regions, [id])]; });
    const d = Math.max(3, Math.round(Math.abs(v) * 0.0042)), t = 3;
    const sum = parts.reduce(function (s, p) { return s + p[1]; }, 0);
    const ptab = '<table class="kv parts"><tbody>' + parts.map(function (p) { return '<tr><th scope="row">' + esc(p[0]) + '</th><td>' + money(p[1]) + '</td></tr>'; }).join('') +
      '<tr class="sum"><th scope="row">Adds up to</th><td>' + money(sum) + '</td></tr></tbody></table>';
    return [
      { d: 'Order lines and ledger entries start in the cloud data warehouse. The platform reads them and never changes them.', side: kv([['System', 'Cloud data warehouse'], ['Access', 'Read-only'], ['Reached by', 'The scheduled load']]), st: 'At the source' },
      { d: 'As it arrived: the same order lines, plus duplicates from a re-sent file and a test order.', vl: 'Total as it arrived', value: money(v + d + t), side: kv([['Loaded as', 'Text, exactly as sent'], ['Duplicates', money(d) + ' from a re-sent file', 'warn'], ['Test order', money(t), 'warn']]), st: 'What arrived' },
      { d: 'Duplicates and the test order removed, amounts turned from text into numbers, filed under finance.', vl: 'After cleaning', value: money(v), side: kv([['Removed', '−' + money(d + t), 'chg'], ['Amounts', 'Numbers in £k, not text', 'chg'], ['Subject area', 'Finance, sales']]), st: 'What changed' },
      { d: D.ready + ' Broken down here, so you can see it adds up.', vl: 'Adds up to', value: money(v), side: ptab, st: 'The breakdown' },
      { d: 'One governed definition: ' + D.model + '. Row-level security decides which rows each person can see.', vl: 'Measure value', value: money(v), side: kv([['Measure', D.name], ['Definition', D.model], ['Security', sc.who]]), st: 'The measure' },
      { d: 'What a leader sees: ' + D.name + ', ' + sc.label + '.', vl: D.name, value: money(v), side: kv([['Tile', D.name], ['Filter', sc.label], ['Refresh', 'Through the day']]), st: 'On the report' }
    ];
  }
  /* reading-friendly position line for a stepper */
  function posLine(el, i, n, label) { el.innerHTML = '<span class="n">' + (i + 1) + ' / ' + n + '</span>' + esc(label); }

  /* ======================= 2. GROUP DATA PLATFORM ======================= */
  const J_PLATFORM = [
    J('Sources', 'db', 'Data starts in a cloud data warehouse, on-premises systems, SharePoint, Dataverse and file stores. Read, never changed.', 'Read-only'),
    J('Raw', 'raw', 'Lands exactly as it arrives, with a load time, so there is always a trail back.', 'Scheduled'),
    J('Cleaned', 'clean', 'Types fixed, duplicates removed, filed by subject area.', 'Scheduled', 'Cleaning logic can be drafted with agent help; I review it and sign it off.'),
    J('Business-ready', 'ready', 'Joined and defined with the business’s own definitions.', 'Scheduled', 'Changes here can be built with agent help; I review and sign them off.'),
    J('Semantic model', 'model', 'One governed definition of each measure, with row-level security. A governed layer of data that people and AI can both use.', 'Scheduled refresh', 'Model changes can be built with agent help, parity-checked figure by figure; I sign them off.', 'A data agent asks questions of this model, read-only. It reads the model; it is not part of it.'),
    J('Report', 'chart', 'The record counts towards a figure on the executive reporting.', 'Scheduled refresh', 'Report changes can be built with agent help; I review and sign them off.'),
    J('Leader', 'person', 'A leader reads it, and sees only the rows they are meant to.', 'Person')
  ];
  const P_LAYERS = [
    { t: 'Source', d: 'An order line is written to the cloud data warehouse when the order is placed.', rule: 'The platform only reads here. It never writes back to a source.', rows: [['order_ref', 'HP-1042'], ['line', '2'], ['product_code', 'TNT-02'], ['region_code', 'N'], ['amount', '4820.00'], ['order_date', '14/09/2024']] },
    { t: 'Raw', d: 'It lands exactly as it arrived, every field as text, with the time it was loaded. It arrived twice, because a file was re-sent.', rule: 'If a load fails, the pipeline stops here and alerts the owner. Nothing downstream is touched.', rows: [['order_ref', 'HP-1042'], ['amount', '"4820.00" (text)'], ['order_date', '"14/09/2024" (text)'], ['_loaded_at', '14 Sep 2024, 06:00'], ['_copies', '2: the file was sent twice', 'warn']] },
    { t: 'Cleaned', d: 'Types fixed and the duplicate removed. Filed under its subject area: finance, sales.', rule: 'If cleaning fails, later layers keep the last good data, so nothing half-done is ever published.', rows: [['order_ref', 'HP-1042'], ['amount', '£4,820.00 (number)', 'chg'], ['order_date', '2024-09-14 (date)', 'chg'], ['_copies', '1', 'chg'], ['subject_area', 'Finance, sales', 'chg']] },
    { t: 'Business-ready', d: 'Joined to products and regions, and defined with the business’s own definitions.', rule: 'May carry on with yesterday’s product list if that one source is late; must stop if the sales data itself fails.', rows: [['order_ref', 'HP-1042'], ['product_line', 'Tents & Shelters', 'chg'], ['region', 'North', 'chg'], ['net_revenue', '£4.82k', 'chg'], ['definition', 'Net of returns; transfers out', 'chg']] },
    { t: 'Semantic model', d: 'It counts towards the governed Revenue measure. Row-level security decides who can see it.', rows: [['measure', 'Revenue'], ['visible_to', 'C-suite, North leader', 'chg'], ['hidden_from', 'Midlands and South leaders', 'chg']] },
    { t: 'Report', d: 'It is part of North revenue on the executive reporting, refreshed through the day.', rows: [['tile', 'Revenue, North, year to date'], ['includes', 'HP-1042, line 2'], ['refreshed', 'Through the day']] },
    { t: 'Leader', d: 'The North leader reads the report and sees North’s figures, and nobody else’s.', rows: [['seen_by', 'North leader, C-suite'], ['as part of', 'Revenue, year to date'], ['not seen by', 'Other regions’ leaders']] }
  ];
  const TRACE_SCOPE = function () { return { regions: ['north'], products: window.HP.PRODUCTS.map(function (p) { return p.id; }), months: range(24, 32), label: 'North, all product lines, January to September 2024', who: 'North leader’s role: North rows only' }; };

  function pPlatform(host, ctx) {
    host.innerHTML = '<div class="sbar"><div class="meta"><span class="pill accent"><i></i>One record, every layer</span><span>An invented order line, followed from the source to a leader.</span></div>' +
      '<button type="button" class="btn primary small" id="p-follow">' + PLAY + '<span>Follow the data</span></button>' +
      '<button type="button" class="btn secondary small" id="p-trace">' + ICON(I.search, 15) + '<span>Where does this number come from?</span></button></div>' +
      '<div class="lyr-wrap" id="p-card"></div>' +
      '<div class="lyr-nav"><button type="button" class="btn secondary small" id="p-prev"><span aria-hidden="true">←</span><span class="t">Back</span></button><p class="lyr-pos" id="p-pos" aria-live="polite"></p>' +
      '<button type="button" class="btn secondary small" id="p-next"><span class="t">Next</span><span aria-hidden="true">→</span></button></div>' +
      '<div class="orch"><span class="ico" aria-hidden="true">' + ICON(I.loop, 18) + '</span><p><b>Orchestration pipeline.</b> One pipeline runs raw, cleaned and business-ready through the day, with explicit failure rules (what may carry on, what must stop) and an alert at each stage.</p>' +
      '<ul class="orch-st" aria-label="Last run (invented)"><li class="pill good"><i></i>Raw 06:00</li><li class="pill good"><i></i>Cleaned 06:04</li><li class="pill good"><i></i>Business-ready 06:09</li></ul></div>';
    const card = ctx.$('p-card'), pos = ctx.$('p-pos'), fb = ctx.$('p-follow'), tb = ctx.$('p-trace');
    let mode = ctx.state.sc === 'trace' ? 'trace' : 'follow', step = ctx.state.step != null ? ctx.state.step : -1, steps = null, playing = false;
    function traceSteps() { if (!steps) steps = lineage('rev', TRACE_SCOPE()); return steps; }
    function render(i, quiet) {
      step = i;
      if (mode === 'follow') {
        const L = P_LAYERS[i];
        card.innerHTML = layerCard({ eb: 'Following one record · layer ' + (i + 1) + ' of 7', t: L.t, d: L.d, rule: L.rule, st: 'The record here', side: kv(L.rows) });
        posLine(pos, i, 7, L.t);
      } else {
        const T = traceSteps()[i], n = 6 - i;
        card.innerHTML = layerCard({ eb: 'Tracing a number back · step ' + n + ' of 6', t: J_PLATFORM[i].label, d: T.d, vl: T.vl, value: T.value, st: T.st, side: T.side });
        posLine(pos, n - 1, 6, J_PLATFORM[i].label);
      }
      ctx.J.go(i);
      if (!quiet) ctx.set({ sc: mode === 'trace' ? 'trace' : null, step: i });
      const first = mode === 'follow' ? i <= 0 : i >= 5, last = mode === 'follow' ? i >= 6 : i <= 0;
      ctx.$('p-prev').setAttribute('aria-disabled', String(first)); ctx.$('p-next').setAttribute('aria-disabled', String(last));
      ctx.$('p-next').querySelector('.t').textContent = mode === 'follow' ? 'Next layer' : 'Towards the source';
      ctx.$('p-prev').querySelector('.t').textContent = mode === 'follow' ? 'Back a layer' : 'Towards the report';
    }
    function stop() { ctx.clear(); playing = false; busy(fb, false); busy(tb, false); fb.querySelector('span').textContent = 'Follow the data'; }
    function play(m) {
      stop(); mode = m; ctx.J.reset();
      const seq = m === 'follow' ? range(0, 6) : [5, 4, 3, 2, 1, 0];
      if (ctx.reduce) { render(seq[0]); ctx.live((m === 'follow' ? 'Layer 1 of 7. ' : 'Step 1 of 6. ') + 'Reduced motion is on: use Next to step through.'); return; }
      playing = true; busy(m === 'follow' ? fb : tb, true);
      if (m === 'follow') fb.querySelector('span').textContent = 'Following…';
      seq.forEach(function (s, k) { ctx.later(function () { render(s); if (k === seq.length - 1) { stop(); ctx.J.done(); if (m === 'follow') fb.querySelector('span').textContent = 'Follow it again'; } }, k * 1650); });
    }
    fb.addEventListener('click', function () { if (!isBusy(fb)) play('follow'); });
    tb.addEventListener('click', function () { if (!isBusy(tb)) play('trace'); });
    function move(d) {
      if (step < 0) return;
      stop();
      const n = mode === 'follow' ? step + d : step - d;
      if (n < 0 || n > (mode === 'follow' ? 6 : 5)) return;
      render(n);
    }
    ctx.$('p-prev').addEventListener('click', function () { if (!isBusy(this)) move(-1); });
    ctx.$('p-next').addEventListener('click', function () { if (!isBusy(this)) move(1); });
    if (step >= 0 && step <= (mode === 'trace' ? 5 : 6)) render(step); else render(0, true);
    return { follow: function () { play('follow'); }, trace: function () { play('trace'); } };
  }

  /* ======================= 3. EXECUTIVE REPORTING ======================= */
  const J_EXEC = [
    J('Sources', 'db', 'Finance and client data start in the source systems. Read, never changed.', 'Read-only'),
    J('Raw', 'raw', 'Lands as it arrived, so there is always a trail back.', 'Scheduled'),
    J('Cleaned', 'clean', 'Duplicates and test records removed, types fixed.', 'Scheduled'),
    J('Business-ready', 'ready', 'Joined and defined with the business’s own definitions.', 'Scheduled', 'Changes here can be built with agent help; I review and sign them off.'),
    J('Semantic model', 'model', 'Actual, budget, latest estimate and prior year, with row-level security so each leader sees their own figures.', 'Scheduled refresh', 'Model changes can be built with agent help and parity-checked figure by figure; I sign them off.', 'A data agent answers leaders’ questions from this model, read-only.'),
    J('Report', 'chart', 'One governed view for the C-suite instead of separate packs.', 'Scheduled refresh', 'Report changes can be built with agent help; I review and sign them off.'),
    J('Leaders', 'person', 'The C-suite and regional leaders, each seeing their own figures.', 'Person')
  ];
  function pExec(host, ctx) {
    host.innerHTML = '<p class="banner" role="note"><span class="flag">Invented data</span><span>Invented data for a fictional company. Select <b>Trace</b> on a figure to see where it comes from. <a class="link" href="demo.html">Open the full page</a></span></p>' +
      '<section class="lin" id="e-lin" aria-labelledby="e-lin-h" hidden></section><div id="xdemo-root"></div>';
    const lin = ctx.$('e-lin');
    let key = null, step = 5, steps = null, scope = null;
    function draw() {
      const T = steps[step], D = LDEF[key];
      lin.innerHTML = '<div class="lin-head"><div><p class="eyebrow">Where does this number come from?</p><h3 id="e-lin-h" tabindex="-1">' + esc(D.name) + ' · ' + esc(scope.label) + '</h3></div><button type="button" class="btn ghost small" id="e-lin-x">Close the trace</button></div>' +
        layerCard({ eb: 'Step ' + (6 - step) + ' of 6 · back towards the source', t: J_EXEC[step].label, d: T.d, vl: T.vl, value: T.value, st: T.st, side: T.side }) +
        '<div class="lyr-nav"><button type="button" class="btn secondary small" id="e-up"' + (step >= 5 ? ' aria-disabled="true"' : '') + '><span aria-hidden="true">←</span>Towards the report</button><p class="lyr-pos" aria-live="polite"><span class="n">' + (6 - step) + ' / 6</span>' + esc(J_EXEC[step].label) + '</p>' +
        '<button type="button" class="btn primary small" id="e-down"' + (step <= 0 ? ' aria-disabled="true"' : '') + '>Towards the source<span aria-hidden="true">→</span></button></div>';
      ctx.$('e-lin-x').addEventListener('click', closeLin);
      ctx.$('e-up').addEventListener('click', function () { if (step < 5) { step++; draw(); ctx.$('e-up').focus(); } });
      ctx.$('e-down').addEventListener('click', function () { if (step > 0) { step--; draw(); ctx.$('e-down').focus(); } });
      ctx.J.go(step);
      ctx.set({ sc: key, step: step });
    }
    function openLin(k, s, focus) {
      key = k; step = s; scope = demo.scope(); steps = lineage(k, scope);
      lin.hidden = false; draw();
      if (focus) { ctx.$('e-lin-h').focus({ preventScroll: true }); lin.scrollIntoView({ behavior: ctx.reduce ? 'auto' : 'smooth', block: 'nearest' }); }
    }
    function closeLin() { lin.hidden = true; lin.innerHTML = ''; ctx.J.reset(); ctx.set({ sc: null, step: null }); const b = host.querySelector('[data-trace="' + key + '"]'); key = null; if (b) b.focus(); }
    const demo = window.HPDemo.mount(ctx.$('xdemo-root'), { trace: function (k) { openLin(k, 5, true); }, change: function () { if (key) openLin(key, step, false); } });
    if (ctx.state.sc && LDEF[ctx.state.sc]) openLin(ctx.state.sc, Math.max(0, Math.min(5, ctx.state.step != null ? ctx.state.step : 5)), false);
    else ctx.J.go(5);
    return { destroy: function () { demo.destroy(); }, trace: function () { openLin('rev', 5, true); } };
  }

  /* ======================= 4. AUTOMATIONS ======================= */
  const J_APPROVAL = [
    J('Web form', 'form', 'Someone submits a payment request through a simple web form.', 'Person'),
    J('Tracked list', 'list', 'The request lands in a tracked list, so everyone can see where it is.', 'Flow', 'An agent can help write or change this flow in code; it never runs it. I review and approve the change.'),
    J('Approval chain', 'check', 'Approvers confirm in turn. Nothing moves until they have.', 'People'),
    J('Finance system', 'bank', 'Once approved, it is posted to the finance system with a reference.', 'Flow'),
    J('Audit log', 'log', 'Every step is written to an audit log.', 'Flow'),
    J('Daily monitor', 'eye', 'A read-only monitor checks every flow and data pipeline each day.', 'Automated'),
    J('Digest', 'mail', 'The owner gets a daily digest, and an alert straight away if a run fails.', 'Automated')
  ];
  const J_SYNC = [
    J('Dataflow', 'db', 'A dataflow prepares the governed data: the source of truth.', 'Scheduled', 'The dataflow can be changed with agent help; I review and approve it.'),
    J('Sync flows', 'swap', 'Three flows: create new items, update changed ones, archive what has gone.', 'Flow', 'An agent can help write or change these flows in code; it never runs them. I approve production.'),
    J('Working list', 'sheet', 'The SharePoint-style list the team already works in.', 'People'),
    J('People', 'team', 'They keep working in a familiar list while the data stays governed.', 'People')
  ];
  const A_STEPS = ['Submitted', 'Checked', 'Approved', 'Posted to finance', 'Logged'];
  const A_ICONS = ['<path d="M4 12 20 4l-5 16-3-7z"/><path d="m12 13 8-9"/>', I.list, I.check, I.bank, I.log];
  /* The run's script: [ms, action...]. 'st' step state, 'ev' feed event, 'pend' an event still in progress, 'res' it
     resolving, 'j' the journey chip to light. About eight seconds. */
  function approvalScript(fail) {
    const S = [
      [0, 'st', 0, 'active', 'Receiving…'], [0, 'j', 0],
      [400, 'ev', 'Request received from the web form'], [400, 'j', 1],
      [1100, 'ev', 'Details validated'],
      [1400, 'st', 0, 'done', 'Done'], [1400, 'st', 1, 'active', 'Routing…'],
      [1700, 'ev', 'Routed to Approver 1, Approver 2 and Approver 3'], [1700, 'st', 1, 'active', 'Awaiting approvers…'], [1700, 'j', 2],
      [2500, 'ev', 'Approver 1 confirmed'], [2500, 'st', 1, 'active', 'Approver 1 confirmed'],
      [3000, 'pend', 'Approver 2 reviewing…'], [3000, 'st', 1, 'active', 'Approver 2 reviewing…'],
      [4400, 'res', 'Approver 2 confirmed'], [4400, 'st', 1, 'active', 'Approver 2 confirmed'],
      [5000, 'ev', 'Approver 3 confirmed'], [5000, 'st', 1, 'active', 'Approver 3 confirmed'],
      [5300, 'st', 1, 'done', 'Done'], [5300, 'st', 2, 'active', 'Collecting…'],
      [5700, 'ev', 'All approvals in'],
      [6000, 'st', 2, 'done', 'Done'], [6000, 'st', 3, 'active', 'Posting…'], [6000, 'j', 3]
    ];
    if (fail) S.push([7000, 'bad', 'Posting to finance failed: system unavailable'], [7000, 'st', 3, 'bad', 'Failed'], [7000, 'jbad', 3],
      [7000, 'st', 4, '', 'Not run'], [7700, 'j', 5, 'bad'], [7700, 'bad', 'Monitor alert raised: the owner is told straight away'], [8200, 'j', 6, 'bad'], [8300, 'end', true]);
    else S.push([7000, 'ev', 'Posted to the finance system, ref PR-2048'], [7000, 'st', 3, 'done', 'Done'], [7000, 'st', 4, 'active', 'Writing…'],
      [7600, 'ev', 'Audit entry written'], [7600, 'j', 4], [7900, 'st', 4, 'done', 'Done'], [8300, 'j', 5], [8800, 'j', 6], [9000, 'end', false]);
    return S;
  }
  function clock(ms) { const s = Math.ceil(ms / 1000); return '00:' + (s < 10 ? '0' : '') + s; }

  function pieceApproval(root, ctx) {
    root.innerHTML = '<div class="sbar"><div class="meta"><span class="pill accent"><i></i>Payment approval</span><span>A simulated run of a payment approval. Invented request.</span></div>' +
      '<label class="switch"><input type="checkbox" id="x-auto-fail"' + (ctx.state.sc === 'fail' ? ' checked' : '') + '><span class="tr" aria-hidden="true"></span>What if a step fails?</label>' +
      '<button type="button" class="btn primary small" id="x-auto-run">' + PLAY + '<span>Run an approval</span></button></div>' +
      '<ol class="aflow" id="x-auto-steps" aria-label="Approval steps">' + A_STEPS.map(function (s, i) {
        return '<li><span class="dot"><span class="ic">' + ICON(A_ICONS[i]) + '</span><span class="ok">' + OK + '</span><span class="x">' + BAD + '</span></span><span class="name">' + s + '</span><span class="st">Waiting</span></li>';
      }).join('') + '</ol>' +
      '<div class="afeed-box"><h3 id="x-feed-h">Activity feed</h3><p class="afeed-none" id="x-feed-none">Events appear here as each step runs.</p>' +
      '<ol class="afeed" id="x-feed" aria-labelledby="x-feed-h" aria-live="polite" aria-relevant="additions text" hidden></ol></div>' +
      '<div id="x-auto-out"></div><p class="sr-only" id="x-auto-live" role="status" aria-live="polite"></p>';
    const $ = ctx.$, lis = [].slice.call($('x-auto-steps').children), feed = $('x-feed'), runBtn = $('x-auto-run');
    let pending = null;
    function setState(i, cls, txt) { lis[i].className = cls; lis[i].querySelector('.st').textContent = txt; }
    function addEvent(at, text, cls, isPending) {
      const li = document.createElement('li');
      li.className = cls || '';
      li.innerHTML = '<time>' + clock(at) + '</time><span class="evd" aria-hidden="true"></span><span class="evt"></span>';
      li.querySelector('.evt').textContent = text;
      if (isPending) { li.classList.add('pend'); li.querySelector('.evt').insertAdjacentHTML('beforeend', '<span class="typing" aria-hidden="true"><i></i><i></i><i></i></span>'); }
      feed.appendChild(li); feed.hidden = false; $('x-feed-none').hidden = true;
      return li;
    }
    function reset() {
      ctx.clear(); pending = null; ctx.J.reset();
      lis.forEach(function (l, i) { setState(i, '', 'Waiting'); });
      feed.replaceChildren(); feed.hidden = true; $('x-feed-none').hidden = false;
      $('x-auto-out').innerHTML = ''; $('x-auto-live').textContent = '';
    }
    function label() { runBtn.querySelector('span').textContent = 'Run an approval'; }
    function end(failed) {
      if (failed) {
        $('x-auto-out').innerHTML = '<div class="toast"><span class="ti">' + ICON('<path d="M12 4 21 19H3z"/><path d="M12 10v4M12 17h.01"/>') + '</span><b>Monitor alert</b><p>The payment approval flow failed at “Posted to finance”. The owner is told straight away, and the daily digest lists it too. Nothing is logged as paid.</p><small>Read-only health monitor, no AI · just now</small></div>';
        $('x-auto-live').textContent = 'Failed at Posted to finance. Monitor alert: the owner is told straight away, and the daily digest lists it too. Nothing is logged as paid.';
      } else {
        $('x-auto-out').innerHTML = '<div class="okcard">' + OK + 'Approved, posted to finance and logged. The daily monitor includes this run in tomorrow’s digest.</div>';
        $('x-auto-live').textContent = 'Approved, posted to finance and logged.';
      }
      busy(runBtn, false); runBtn.querySelector('span').textContent = 'Run it again';
    }
    function apply(a, instant) {
      const at = a[0], kind = a[1];
      if (kind === 'st') setState(a[2], a[3], a[4]);
      else if (kind === 'j') ctx.J.go(a[2], a[3]);
      else if (kind === 'jbad') ctx.J.bad(a[2]);
      else if (kind === 'ev') addEvent(at, a[2]);
      else if (kind === 'bad') addEvent(at, a[2], 'bad');
      else if (kind === 'pend') { if (!instant) pending = addEvent(at, a[2], '', true); }
      else if (kind === 'res') {
        if (pending) { pending.classList.remove('pend'); pending.querySelector('time').textContent = clock(at); pending.querySelector('.evt').textContent = a[2]; pending = null; }
        else addEvent(at, a[2]);
      } else if (kind === 'end') end(a[2]);
    }
    function run() {
      if (isBusy(runBtn)) return;
      reset();
      const script = approvalScript($('x-auto-fail').checked);
      if (ctx.reduce) { script.forEach(function (a) { apply(a, true); }); return; }
      busy(runBtn, true); runBtn.querySelector('span').textContent = 'Running…';
      script.forEach(function (a) { ctx.later(function () { apply(a, false); }, a[0]); });
    }
    runBtn.addEventListener('click', run);
    $('x-auto-fail').addEventListener('change', function () { reset(); busy(runBtn, false); label(); ctx.set({ sc: this.checked ? 'fail' : null }); });
    return { reset: function () { reset(); busy(runBtn, false); label(); }, run: run };
  }

  const GOVERNED = [
    { id: 1, name: 'Trail tent, 2 person', status: 'Active', stock: 120 }, { id: 2, name: 'Alpine daypack', status: 'Active', stock: 85 },
    { id: 3, name: 'Camp stove', status: 'Low stock', stock: 24 }, { id: 4, name: 'Waterproof shell', status: 'Active', stock: 210 },
    { id: 5, name: 'Insulated flask', status: 'Active', stock: 160 }, { id: 6, name: 'Headtorch', status: 'Low stock', stock: 18 }
  ];
  const WORKING = [
    { id: 1, name: 'Trail tent, 2 person', status: 'Active', stock: 120 }, { id: 2, name: 'Alpine daypack', status: 'Active', stock: 70 },
    { id: 3, name: 'Camp stove', status: 'Active', stock: 24 }, { id: 4, name: 'Waterproof shell', status: 'Active', stock: 180 },
    { id: 7, name: 'Fleece liner', status: 'Active', stock: 40 }
  ];
  function stPill(st) { return '<span class="ost' + (st === 'Active' ? ' shipped' : st === 'Low stock' ? ' packed' : '') + '">' + esc(st) + '</span>'; }
  function stTable(label, rows, withMarks) {
    return '<table class="stb" aria-label="' + esc(label) + '"><thead><tr><th scope="col">Item</th><th scope="col">Status</th><th scope="col">Stock</th></tr></thead><tbody>' + rows.map(function (r) {
      const cls = [r.mark === 'c' ? 'isnew' : '', r.fx === 'row' ? 'fresh' : '', r.grey ? 'grey' : ''].filter(Boolean).join(' ');
      const chip = withMarks && r.mark ? '<span class="chg ' + r.mark + '">' + (r.mark === 'c' ? 'New' : 'Updated') + '</span>' : '';
      return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td><span class="nm">' + esc(r.name) + '</span>' + chip + '</td><td class="stc' + (r.fx === 'status' ? ' upd' : '') + '">' + stPill(r.status) + '</td><td class="num' + (r.fx === 'stock' ? ' upd' : '') + '">' + r.stock + '</td></tr>';
    }).join('') + '</tbody></table>';
  }
  function pieceSync(root, ctx) {
    root.innerHTML = '<div class="sync"><div class="sbar"><div class="meta"><span class="pill accent"><i></i>Data sync</span><span>Flexible solutions for inflexible systems. Invented records.</span></div>' +
      '<button type="button" class="btn secondary small" id="x-sync-reset"><span>Reset</span></button>' +
      '<button type="button" class="btn primary small" id="x-sync-run">' + PLAY + '<span>Run sync</span></button></div>' +
      '<div class="spanes"><section class="otable spane" aria-labelledby="x-gov-h"><div class="ohead"><div><h3 id="x-gov-h">Governed data (dataflow output)</h3><small>The source of truth. Read-only.</small></div><span class="pill">Source</span></div><div id="x-gov"></div></section>' +
      '<section class="otable spane" aria-labelledby="x-wl-h"><div class="ohead"><div><h3 id="x-wl-h">Working list (SharePoint)</h3><small>What the team works in.</small></div><span class="pill warn" id="x-wl-pill"><i></i>Out of step</span></div><div id="x-wl"></div>' +
      '<div class="sarch"><h4 id="x-arch-h">Archived <span class="pill" id="x-arch-n">0</span></h4><p class="none" id="x-arch-none">Nothing archived yet.</p><div id="x-arch"></div></div></section></div>' +
      '<ol class="schips" id="x-sync-chips" aria-label="Sync steps">' + ['Create', 'Update', 'Archive'].map(function (n, i) {
        return '<li><span class="n"><span>' + (i + 1) + '</span>' + OK + '</span><span class="nm">' + n + '</span><span class="stt">Waiting</span></li>';
      }).join('') + '</ol>' +
      '<div class="slog-box"><h3 id="x-slog-h">Sync log</h3><p class="slog-none" id="x-slog-none">Changes are written here as each flow runs.</p><ol class="slog" id="x-slog" aria-labelledby="x-slog-h" aria-live="polite" hidden></ol></div>' +
      '<p class="ssum" id="x-ssum" role="status">Not synced yet.</p></div>';
    const $ = ctx.$, chips = [].slice.call($('x-sync-chips').children), runBtn = $('x-sync-run'), log = $('x-slog');
    let gov, list, arch, counts;
    function chip(i, cls, txt) { chips[i].className = cls; chips[i].querySelector('.stt').textContent = txt; }
    function paint() {
      $('x-gov').innerHTML = stTable('Governed data', gov, false);
      $('x-wl').innerHTML = stTable('Working list', list, true);
      $('x-arch').innerHTML = arch.length ? stTable('Archived items', arch, false) : '';
      $('x-arch-none').hidden = arch.length > 0; $('x-arch-n').textContent = arch.length;
      list.forEach(function (r) { delete r.fx; });
    }
    function entry(tag, cls, text) {
      const li = document.createElement('li');
      li.innerHTML = '<span class="chg ' + cls + '">' + tag + '</span><span></span>'; li.lastChild.textContent = text;
      log.appendChild(li); log.hidden = false; $('x-slog-none').hidden = true;
    }
    function reset() {
      ctx.clear(); ctx.J.reset();
      gov = GOVERNED.map(function (r) { return Object.assign({}, r); });
      list = WORKING.map(function (r) { return Object.assign({}, r); });
      arch = []; counts = { c: 0, u: 0, a: 0 };
      paint();
      chips.forEach(function (c, i) { chip(i, '', 'Waiting'); });
      log.replaceChildren(); log.hidden = true; $('x-slog-none').hidden = false;
      $('x-ssum').className = 'ssum'; $('x-ssum').textContent = 'Not synced yet.';
      const p = $('x-wl-pill'); p.className = 'pill warn'; p.innerHTML = '<i></i>Out of step';
      busy(runBtn, false); runBtn.querySelector('span').textContent = 'Run sync';
    }
    function plan() {
      const have = {}; list.forEach(function (r) { have[r.id] = true; });
      const want = {}; gov.forEach(function (g) { want[g.id] = g; });
      const creates = gov.filter(function (g) { return !have[g.id]; });
      const updates = list.filter(function (r) { const g = want[r.id]; return g && (g.status !== r.status || g.stock !== r.stock); });
      const gone = list.filter(function (r) { return !want[r.id]; });
      const A = []; let t = 0;
      A.push([t, function () { ctx.J.go(0); }]);
      A.push([t += 450, function () { chip(0, 'active', 'Running…'); ctx.J.go(1); }]);
      creates.forEach(function (g) {
        A.push([t += 550, function () {
          list.push({ id: g.id, name: g.name, status: g.status, stock: g.stock, mark: 'c', fx: 'row' }); counts.c++; paint(); ctx.J.go(2);
          entry('Created', 'c', g.name + ' · ' + g.status + ' · ' + g.stock + ' in stock');
        }]);
      });
      A.push([t += 500, function () { chip(0, 'done', counts.c + ' created'); chip(1, 'active', 'Running…'); }]);
      updates.forEach(function (r) {
        const g = want[r.id];
        A.push([t += 600, function () {
          const parts = [], row = list.filter(function (x) { return x.id === r.id; })[0];
          if (row.stock !== g.stock) { parts.push('stock ' + row.stock + ' to ' + g.stock); row.fx = 'stock'; }
          if (row.status !== g.status) { parts.push('status ' + row.status + ' to ' + g.status); row.fx = row.fx ? 'row' : 'status'; }
          row.stock = g.stock; row.status = g.status; row.mark = 'u'; counts.u++; paint();
          entry('Updated', 'u', row.name + ' · ' + parts.join(', '));
        }]);
      });
      A.push([t += 500, function () { chip(1, 'done', counts.u + ' updated'); chip(2, 'active', 'Running…'); }]);
      gone.forEach(function (r) {
        A.push([t += 600, function () { const row = list.filter(function (x) { return x.id === r.id; })[0]; row.grey = true; paint(); entry('Archived', '', row.name + ' · no longer in the governed data'); }]);
        A.push([t += 900, function () { list = list.filter(function (x) { return x.id !== r.id; }); arch.push({ id: r.id, name: r.name, status: 'Archived', stock: r.stock }); counts.a++; paint(); }]);
      });
      A.push([t += 500, function () { chip(2, 'done', counts.a + ' archived'); ctx.J.go(3); }]);
      A.push([t += 200, finish]);
      return A;
    }
    function finish() {
      const s = $('x-ssum'); s.className = 'ssum done'; s.textContent = counts.c + ' created · ' + counts.u + ' updated · ' + counts.a + ' archived';
      const p = $('x-wl-pill'); p.className = 'pill good'; p.innerHTML = '<i></i>In step';
      runBtn.querySelector('span').textContent = 'Synced'; busy(runBtn, true); ctx.J.done();
    }
    function run() {
      if (isBusy(runBtn)) return;
      busy(runBtn, true); runBtn.querySelector('span').textContent = 'Running…';
      const A = plan();
      if (ctx.reduce) { A.forEach(function (a) { a[1](); }); list.forEach(function (r) { delete r.fx; }); paint(); return; }
      A.forEach(function (a) { ctx.later(a[1], a[0]); });
    }
    runBtn.addEventListener('click', run);
    $('x-sync-reset').addEventListener('click', reset);
    reset();
    return { reset: reset, run: run };
  }

  function pAuto(host, ctx) {
    const TABS = [['approval', 'Approval run'], ['sync', 'Data sync']];
    host.innerHTML = '<div class="seg tabs" role="tablist" aria-label="Automation simulations">' + TABS.map(function (t) {
      return '<button type="button" role="tab" id="x-tab-' + t[0] + '" aria-controls="x-panel-' + t[0] + '" aria-selected="false" tabindex="-1">' + t[1] + '</button>';
    }).join('') + '</div>' + TABS.map(function (t) { return '<div role="tabpanel" id="x-panel-' + t[0] + '" aria-labelledby="x-tab-' + t[0] + '" hidden></div>'; }).join('');
    const pieces = { approval: pieceApproval(ctx.$('x-panel-approval'), ctx), sync: pieceSync(ctx.$('x-panel-sync'), ctx) };
    const tabs = [].slice.call(host.querySelectorAll('[role="tab"]'));
    let cur = -1;
    function show(i, focus) {
      if (i === cur) return;
      if (cur >= 0) { ctx.clear(); pieces[TABS[cur][0]].reset(); }
      cur = i;
      tabs.forEach(function (b, k) { b.setAttribute('aria-selected', String(k === i)); b.tabIndex = k === i ? 0 : -1; ctx.$('x-panel-' + TABS[k][0]).hidden = k !== i; });
      ctx.journey(i ? J_SYNC : J_APPROVAL);
      ctx.set({ tab: i ? 'sync' : null, sc: i ? null : (ctx.$('x-auto-fail').checked ? 'fail' : null) });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (b, i) {
      b.addEventListener('click', function () { show(i, false); });
      b.addEventListener('keydown', function (e) {
        const n = tabs.length; let k = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i + n - 1) % n;
        else if (e.key === 'Home') k = 0; else if (e.key === 'End') k = n - 1;
        if (k < 0) return;
        e.preventDefault(); show(k, true);
      });
    });
    show(ctx.state.tab === 'sync' ? 1 : 0, false);
    return { run: function () { show(0, false); pieces.approval.run(); } };
  }

  /* ======================= 5. AGENT CONTROL ROOM ======================= */
  /* A mock dashboard with invented project names. No agents were harmed in the making of it; none of them exist. */
  const J_CONTROL = [
    J('Request', 'inbox', 'A request arrives: what is needed, and what done looks like.', 'Person'),
    J('Project lead', 'lead', 'One lead agent (the overseer) plans the work and keeps a state document. This whole stage is the build track: how the work beside the pipeline gets done.', 'Agent'),
    J('Specialist agents', 'team', 'Analyst, builder, reviewer and tester, each with a scoped slice. None approves its own work.', 'Agents'),
    J('Repo or platform', 'repo', 'The work itself: one writer per file, backup and rollback ready.', 'Code'),
    J('Gates', 'gate', 'Parity check, independent review and a human sign-off.', 'Person'),
    J('Release', 'release', 'A dry run first, then release, then verify. Only after a person’s go for this change.', 'Person'),
    J('Monitor', 'eye', 'The control room keeps watching every project. It uses no AI itself.', 'Automated')
  ];
  function pControl(host, ctx) {
    const P = [
      { name: 'Orion', area: 'Analytics', ag: [['Analyst', 'done'], ['Builder', 'work'], ['Reviewer', 'idle'], ['Tester', 'idle'], ['Release', 'idle']] },
      { name: 'Juno', area: 'Analytics', ag: [['Analyst', 'done'], ['Builder', 'done'], ['Reviewer', 'done'], ['Tester', 'done'], ['Release', 'done']] },
      { name: 'Kestrel', area: 'Products', ag: [['Analyst', 'work'], ['Builder', 'idle'], ['Reviewer', 'idle'], ['Tester', 'idle'], ['Release', 'idle']] },
      { name: 'Lumen', area: 'Operations', ag: [['Analyst', 'done'], ['Builder', 'done'], ['Reviewer', 'work'], ['Tester', 'idle'], ['Release', 'idle']] }
    ];
    const LOG = [
      { who: 'Orion overseer', text: 'The builder has started the second slice. The reviewer is lined up next.' },
      { who: 'Juno overseer', text: 'Released and verified yesterday, after a person’s go.' },
      { who: 'Lumen overseer', text: 'Review started. I will report back with the findings.' }
    ];
    const STATE_TXT = { done: 'done', work: 'working', wait: 'waiting on you', idle: 'not started' };
    let need = null, lastNew = -1;
    host.innerHTML = '<div class="sbar"><div class="meta"><span class="pill accent"><i></i>Run a project</span><span>A request arrives, the lead plans it, agents work, and a gate asks a person: you.</span></div>' +
      '<button type="button" class="btn primary small" id="c-run">' + PLAY + '<span>Run a project</span></button></div>' +
      '<div class="cr"><div class="cr-head"><div class="ttl"><b>Control room <span class="live"><i></i>Live</span></b><p>A mock dashboard. Project names are invented. It uses no AI itself.</p></div><dl class="cr-stats" id="c-stats"></dl>' + Lb.chainMini() + '</div>' +
      '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute"><defs><linearGradient id="crg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:var(--accent-2)"/></linearGradient></defs></svg>' +
      '<div class="cr-main"><section class="cr-area" aria-labelledby="c-projs-h"><h4 id="c-projs-h" class="cr-label">Projects by area: Analytics, Products, Operations</h4><div class="cr-cards" id="c-projs"></div></section>' +
      '<aside class="cr-side" aria-labelledby="c-needs-h"><h4 id="c-needs-h" class="cr-label">Needs you <span class="pill good" id="c-needs-n">All clear</span></h4><ul class="needs-q" id="c-needs" aria-live="polite"></ul><div id="c-out"></div></aside></div>' +
      '<section class="cr-console" aria-labelledby="c-con-h"><div class="chead"><h4 id="c-con-h">Console</h4><small id="c-tick" aria-hidden="true">Updated just now</small></div>' +
      '<ol class="clog" id="c-console" aria-live="polite"></ol>' +
      '<div class="crow"><label class="sr-only" for="c-to">Recipient</label><select id="c-to"></select>' +
      '<label class="sr-only" for="c-msg">Message</label><input id="c-msg" class="tin" type="text" placeholder="Message a project lead" autocomplete="off"><button type="button" class="btn secondary small" id="c-send">Send</button></div>' +
      '<p class="fine">Policy: agents may only message their own overseer. Across projects, only a person can.</p></section></div>';
    const $ = ctx.$, C = 2 * Math.PI * 20, runBtn = $('c-run');
    function nowLine(p) {
      if (p.now) return p.now;
      const w = p.ag.filter(function (a) { return a[1] === 'wait'; })[0], k = p.ag.filter(function (a) { return a[1] === 'work'; })[0];
      if (w) return w[0] + ': waiting on you';
      if (k) return k[0] + ': working';
      return p.ag.every(function (a) { return a[1] === 'done'; }) ? 'Released and verified' : 'Planning';
    }
    function draw() {
      $('c-projs').innerHTML = P.map(function (p) {
        const done = p.ag.filter(function (x) { return x[1] === 'done'; }).length, waits = p.ag.some(function (x) { return x[1] === 'wait'; });
        return '<article class="pcard' + (waits ? ' needs' : '') + (p.fresh ? ' fresh' : '') + '" aria-label="' + p.name + '"><div class="ring" aria-hidden="true"><svg viewBox="0 0 48 48"><circle class="tr" cx="24" cy="24" r="20"/><circle class="pr" cx="24" cy="24" r="20" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - done / 5)).toFixed(1) + '"/></svg><b>' + done + '/5</b></div>' +
          '<div class="nm"><b>' + p.name + '</b><span class="pill">' + p.area + '</span><span class="sr-only">' + done + ' of 5 agents done.</span></div><p class="now">' + esc(nowLine(p)) + '</p>' +
          '<div class="tree"><p class="tree-ov">' + p.name + ' overseer</p><ul class="agents" aria-label="' + p.name + ' overseer’s specialist agents">' + p.ag.map(function (x) { return '<li class="ag ' + x[1] + '" title="' + x[0] + ': ' + STATE_TXT[x[1]] + '"><i aria-hidden="true"></i>' + x[0] + '<span class="sr-only">: ' + STATE_TXT[x[1]] + '</span>' + (x[1] === 'work' ? '<span class="subs">+2 sub-agents</span>' : '') + '</li>'; }).join('') + '</ul></div></article>';
      }).join('');
      const working = P.reduce(function (s, p) { return s + p.ag.filter(function (x) { return x[1] === 'work'; }).length; }, 0), open = need && !need.done ? 1 : 0;
      $('c-stats').innerHTML = '<div><dt>Projects</dt><dd>' + P.length + '</dd></div><div><dt>Agents working</dt><dd>' + working + '</dd></div><div class="' + (open ? 'warn' : '') + '"><dt>Needs you</dt><dd>' + open + '</dd></div>';
      $('c-needs-n').textContent = open ? '1 waiting' : 'All clear'; $('c-needs-n').className = 'pill ' + (open ? 'warn' : 'good');
      $('c-to').innerHTML = P.map(function (p) { return '<option>' + p.name + '</option>'; }).join('');
      if (!need) $('c-needs').innerHTML = '<li class="none">Nothing waiting on you. Run a project to see a decision arrive.</li>';
    }
    function log(who, text, you) { lastNew = LOG.length; LOG.push({ who: who, text: text, you: you }); drawLog(); }
    function drawLog() { $('c-console').innerHTML = LOG.map(function (l, i) { return '<li class="' + (l.you ? 'you' : '') + (i >= lastNew && lastNew >= 0 ? ' new' : '') + '"><span>' + esc(l.who) + ':</span> ' + esc(l.text) + '</li>'; }).join(''); }
    let since = 0;
    ctx.every(function () { since++; const t = $('c-tick'); if (t) t.textContent = 'Updated ' + since + 's ago'; }, 1000);
    function nova() { return P.filter(function (p) { return p.name === 'Nova'; })[0]; }
    function setAg(role, st) { nova().ag.forEach(function (a) { if (a[0] === role) a[1] = st; }); }
    function decide(yes) {
      need.done = true;
      $('c-needs').innerHTML = '<li class="done"><span class="who">' + OK.replace('width="18" height="18"', 'width="14" height="14"') + 'Nova overseer</span><span>' + (yes ? 'Approved by you. Release goes ahead, dry run first.' : 'Declined by you. The release is held.') + '</span></li>';
      since = 0;
      if (!yes) {
        setAg('Release', 'idle'); nova().now = 'Held: waiting for a new plan';
        log('Nova overseer', 'Held. Nothing reaches production without a person’s go. I have noted why in the state document.'); draw();
        $('c-out').innerHTML = '<div class="okcard neutral">' + OK + 'Held, as you asked. Nothing was released.</div>';
        busy(runBtn, false); runBtn.querySelector('span').textContent = 'Run it again'; runBtn.focus(); return;
      }
      ctx.J.go(5); setAg('Release', 'work'); nova().now = null; draw();
      log('Nova overseer', 'Your go is recorded. Dry run passed. Releasing.');
      const fin = function () {
        setAg('Release', 'done'); draw(); ctx.J.go(6);
        log('Control room', 'Nova released and verified. It joins the daily checks.');
        $('c-out').innerHTML = '<div class="okcard">' + OK + 'Released after your go, and logged in the state document.</div>';
        busy(runBtn, false); runBtn.querySelector('span').textContent = 'Run it again'; ctx.J.done();
        ctx.live('Released after your go, and logged in the state document.');
      };
      if (ctx.reduce) fin(); else ctx.later(fin, 1500);
      $('c-out').focus && runBtn.focus();
    }
    function run() {
      if (isBusy(runBtn)) return;
      ctx.clear(); ctx.every(function () { since++; const t = $('c-tick'); if (t) t.textContent = 'Updated ' + since + 's ago'; }, 1000);
      ctx.J.reset(); need = null; $('c-out').innerHTML = '';
      for (let i = P.length - 1; i >= 0; i--) if (P[i].name === 'Nova') P.splice(i, 1);
      busy(runBtn, true); runBtn.querySelector('span').textContent = 'Running…';
      const steps = [
        [0, function () { ctx.J.go(0); P.unshift({ name: 'Nova', area: 'Analytics', fresh: true, now: 'New request', ag: [['Analyst', 'idle'], ['Builder', 'idle'], ['Reviewer', 'idle'], ['Tester', 'idle'], ['Release', 'idle']] }); draw(); log('Request', 'A new regional margin report is needed, with a definition of done (invented).'); }],
        [1300, function () { ctx.J.go(1); nova().now = null; nova().fresh = false; setAg('Analyst', 'work'); draw(); log('Nova overseer', 'Plan written to the state document. Slices assigned: analyst first, then builder.'); }],
        [2700, function () { ctx.J.go(2); setAg('Analyst', 'done'); setAg('Builder', 'work'); draw(); log('Nova overseer', 'The analyst has profiled the data. The builder has started.'); }],
        [4100, function () { ctx.J.go(3); setAg('Builder', 'done'); setAg('Reviewer', 'work'); draw(); log('Nova overseer', 'Change made in its own slice, with backup and rollback. The reviewer is checking it.'); }],
        [5400, function () { setAg('Reviewer', 'done'); setAg('Tester', 'work'); draw(); log('Nova overseer', 'Review passed. The tester is using it as a user would.'); }],
        [6700, function () {
          ctx.J.go(4); setAg('Tester', 'done'); setAg('Release', 'wait'); need = { done: false }; draw();
          log('Nova overseer', 'Tests passed and every figure matches the baseline. Waiting on your go.');
          $('c-needs').innerHTML = '<li class="ask"><span class="who">Nova overseer · decision</span><span>Approve the release of the regional margin report? The parity check passed; backup and rollback are attached.</span>' +
            '<span class="nb"><button type="button" class="btn primary small" id="c-yes">Approve</button><button type="button" class="btn secondary small" id="c-no">Decline</button></span></li>';
          $('c-yes').addEventListener('click', function () { decide(true); });
          $('c-no').addEventListener('click', function () { decide(false); });
          runBtn.querySelector('span').textContent = 'Waiting on you';
          ctx.live('Needs you: approve the release of the regional margin report? Approve or Decline.');
          if (!ctx.reduce) $('c-yes').focus({ preventScroll: true });
        }]
      ];
      if (ctx.reduce) steps.forEach(function (s) { s[1](); }); else steps.forEach(function (s) { ctx.later(s[1], s[0]); });
    }
    runBtn.addEventListener('click', run);
    function send() {
      const t = $('c-msg').value.trim(), to = $('c-to').value; if (!t) { $('c-msg').focus(); return; }
      log('You to ' + to + ' overseer', t, true); $('c-msg').value = ''; $('c-msg').focus(); since = 0;
      const reply = function () { log(to + ' overseer', 'Noted. It goes in the state document, and I will confirm what changes.'); };
      if (ctx.reduce) reply(); else ctx.later(reply, 700);
    }
    $('c-send').addEventListener('click', send);
    $('c-msg').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } });
    draw(); drawLog();
    return { run: run, approve: function () { if (need && !need.done) decide(true); } };
  }

  /* ======================= 6. AGENTIC DELIVERY SUITE ======================= */
  const J_SUITE = [
    J('Brief', 'brief', 'The change, why it is needed and what done looks like.', 'Person'),
    J('Overseer', 'lead', 'The lead agent plans it, updates the state document and hands one scoped slice to the builder. This is the build track itself.', 'Agent'),
    J('Builder', 'wrench', 'Makes the change in its own slice, with backup and rollback.', 'Agent'),
    J('Reviewer', 'search', 'Checks the change. It did not write it, so it has no stake in it.', 'Agent'),
    J('Tester', 'check', 'Uses the result the way a user would and records the evidence.', 'Agent'),
    J('Parity check', 'gate', 'Key figures before and after are compared value by value. A moved number sends it back.', 'Agent, fixed rule'),
    J('Sign-off', 'person', 'A person approves this specific change, with the evidence in front of them.', 'Person'),
    J('Release', 'release', 'Dry run first, then release, then verify.', 'Agent, after my go')
  ];
  const U_STEPS = [['Build', I.wrench], ['Review', I.search], ['Test', I.check], ['Parity check', I.gate], ['Sign-off', I.person], ['Release', I.release]];
  const FIGS = [['Revenue, year to date', '£41.72m'], ['Gross margin %', '46.8%'], ['Operating expenses', '£12.36m'], ['EBITDA', '£7.16m'], ['Regions shown', 'North, Midlands, South']];
  function pSuite(host, ctx) {
    host.innerHTML = Lb.chainFull() + '<div class="sbar"><div class="meta"><span class="pill accent"><i></i>One change</span><span>Restyle the margin chart and rename a measure on a leadership report (an invented change).</span></div>' +
      '<label class="switch"><input type="checkbox" id="u-fail"' + (ctx.state.sc === 'fail' ? ' checked' : '') + '><span class="tr" aria-hidden="true"></span>What if the parity check fails?</label>' +
      '<button type="button" class="btn primary small" id="u-run">' + PLAY + '<span>Run a change</span></button></div>' +
      '<ol class="aflow six" id="u-steps" aria-label="Gates">' + U_STEPS.map(function (s) {
        return '<li><span class="dot"><span class="ic">' + ICON(s[1]) + '</span><span class="ok">' + OK + '</span><span class="x">' + BAD + '</span></span><span class="name">' + s[0] + '</span><span class="st">Waiting</span></li>';
      }).join('') + '</ol>' +
      '<div class="two"><div class="afeed-box"><h3 id="u-feed-h">What each agent reports</h3><p class="afeed-none" id="u-none">Reports appear here as the change moves.</p><ol class="afeed one" id="u-feed" aria-labelledby="u-feed-h" aria-live="polite" hidden></ol></div>' +
      '<section class="otable" aria-labelledby="u-par-h"><div class="ohead"><div><h3 id="u-par-h">Parity check</h3><small>Key figures before and after the change (invented).</small></div><span class="pill" id="u-par-pill">Not run</span></div>' +
      '<table class="ptab"><thead><tr><th scope="col">Figure</th><th scope="col">Baseline</th><th scope="col">After</th><th scope="col"><span class="sr-only">Match</span></th></tr></thead><tbody id="u-par"></tbody></table></section></div>' +
      '<div id="u-out"></div>';
    const $ = ctx.$, lis = [].slice.call($('u-steps').children), runBtn = $('u-run'), feed = $('u-feed');
    function st(i, cls, txt) { lis[i].className = cls; lis[i].querySelector('.st').textContent = txt; }
    function ev(who, text, cls) {
      const li = document.createElement('li'); li.className = cls || '';
      li.innerHTML = '<time></time><span class="evd" aria-hidden="true"></span><span class="evt"><b></b> </span>';
      li.querySelector('time').textContent = who.slice(0, 1); li.querySelector('time').setAttribute('aria-hidden', 'true');
      li.querySelector('b').textContent = who + ':'; li.querySelector('.evt').appendChild(document.createTextNode(text));
      feed.appendChild(li); feed.hidden = false; $('u-none').hidden = true;
    }
    function par(rows, pill) {
      $('u-par').innerHTML = FIGS.map(function (f, i) {
        const r = rows[i];
        if (!r) return '<tr><th scope="row">' + f[0] + '</th><td>' + f[1] + '</td><td class="dim">…</td><td></td></tr>';
        return '<tr class="' + (r.bad ? 'bad' : 'ok') + '"><th scope="row">' + f[0] + '</th><td>' + f[1] + '</td><td>' + (r.v || f[1]) + '</td><td>' + (r.bad ? '<span class="vchip no">' + BAD.replace(/18/g, '12') + 'Moved</span>' : '<span class="vchip">' + OK.replace(/18/g, '12') + 'Match</span>') + '</td></tr>';
      }).join('');
      const p = $('u-par-pill'); p.className = 'pill ' + (pill === 'pass' ? 'good' : pill === 'fail' ? 'bad' : ''); p.textContent = pill === 'pass' ? 'Every figure matches' : pill === 'fail' ? 'A figure moved' : pill === 'run' ? 'Comparing…' : 'Not run';
    }
    function reset() {
      ctx.clear(); ctx.J.reset(); lis.forEach(function (l, i) { st(i, '', 'Waiting'); });
      feed.replaceChildren(); feed.hidden = true; $('u-none').hidden = false; $('u-out').innerHTML = ''; par([], '');
      busy(runBtn, false); runBtn.querySelector('span').textContent = 'Run a change';
    }
    function script(fail) {
      const A = []; let t = 0;
      const at = function (ms, fn) { t += ms; A.push([t, fn]); };
      at(0, function () { ctx.J.go(0); ev('Brief', 'Restyle the margin chart and rename one measure. Done when it looks right and no figure moves.'); });
      at(900, function () { ctx.J.go(1); ev('Overseer', 'Plan and state document updated. One slice to the builder.'); });
      function pass(again) {
        at(900, function () { ctx.J.go(2); st(0, 'active', again ? 'Fixing…' : 'Building…'); });
        at(1000, function () { st(0, 'done', 'Done'); ev('Builder', again ? 'Fixed: the filter now keeps returns in cost of sales.' : 'Change made in its own slice, with backup and rollback.'); ctx.J.go(3); st(1, 'active', 'Reviewing…'); });
        at(1100, function () { st(1, 'done', 'Done'); ev('Reviewer', 'Checked independently. No blocking findings.'); ctx.J.go(4); st(2, 'active', 'Testing…'); });
        at(1100, function () { st(2, 'done', 'Done'); ev('Tester', 'Used it as a user would. Passed, with screenshots as evidence.'); ctx.J.go(5); st(3, 'active', 'Comparing…'); par([], 'run'); });
        const bad = fail && !again;
        FIGS.forEach(function (f, i) {
          at(260, function () { const rows = []; for (let k = 0; k <= i; k++) rows.push(bad && k === 1 ? { bad: true, v: '47.4%' } : {}); par(rows, i === FIGS.length - 1 ? (bad ? 'fail' : 'pass') : 'run'); });
        });
        if (bad) {
          at(500, function () { st(3, 'bad', 'Failed'); ctx.J.bad(5); ev('Parity check', 'Gross margin % moved from 46.8% to 47.4%. The change does not ship.', 'bad'); });
          at(1400, function () { lis.forEach(function (l, i) { if (i < 4) st(i, '', 'Again'); }); ev('Overseer', 'Back to the builder: a filter had dropped returns from cost of sales.', 'bad'); ctx.J.go(2); });
          pass(true);
          return;
        }
        at(500, function () { st(3, 'done', 'Passed'); ev('Parity check', 'Every key figure matches the baseline.'); ctx.J.go(6); st(4, 'active', 'Waiting on a person…'); });
        at(1300, function () { st(4, 'done', 'Signed off'); ev('Sign-off', 'A person approved this specific change, with the evidence in front of them.'); ctx.J.go(7); st(5, 'active', 'Dry run…'); });
        at(1100, function () { st(5, 'done', 'Released'); ev('Release manager', 'Dry run passed. Released, then verified.'); ctx.J.done(); end(); });
      }
      pass(false);
      return A;
    }
    function end() {
      const fail = $('u-fail').checked;
      $('u-out').innerHTML = '<div class="okcard">' + OK + (fail ? 'Released, but only after the parity check caught a moved figure and the builder fixed it.' : 'Released after review, test, a clean parity check and a person’s sign-off.') + '</div>';
      ctx.live(fail ? 'Released after the parity check caught a moved figure and it was fixed.' : 'Released after review, test, parity check and sign-off.');
      busy(runBtn, false); runBtn.querySelector('span').textContent = 'Run it again';
    }
    function run() {
      if (isBusy(runBtn)) return;
      reset();
      const A = script($('u-fail').checked);
      if (ctx.reduce) { A.forEach(function (a) { a[1](); }); return; }
      busy(runBtn, true); runBtn.querySelector('span').textContent = 'Running…';
      A.forEach(function (a) { ctx.later(a[1], a[0]); });
    }
    runBtn.addEventListener('click', run);
    $('u-fail').addEventListener('change', function () { reset(); ctx.set({ sc: this.checked ? 'fail' : null }); });
    Lb.chainRun(host, ctx);
    reset();
    return { run: run };
  }

  /* ======================= 7. ORDER-TRACKING APP ======================= */
  const J_APPS = [
    J('Governed data', 'platform', 'Customers and products come from the governed platform, so the app starts from the same facts as the reports.', 'Scheduled'),
    J('SQL database', 'db', 'Holds the orders the team works on. Every save is written here first, with a version number.', 'Database', 'Database scripts can be drafted with agent help; I read them and run them.'),
    J('Web app', 'app', 'Search, filter, open an order, edit it. Several people at once.', 'People', 'App changes can be built with agent help, then reviewed, tested and released on my go.'),
    J('Audit log', 'log', 'Who changed what, when, and from what to what.', 'Automatic'),
    J('Dashboards', 'chart', 'Saved views and tiles update from the same record.', 'Automatic'),
    J('Data platform', 'platform', 'Changes sync back to the platform, so reports see them too.', 'Scheduled sync')
  ];
  const ORD = [
    { ref: 'HP-1041', who: 'Fjordline Outfitters', st: 'Packed', due: '18 Sep', val: 12.4, notes: 'Awaiting a courier slot.' },
    { ref: 'HP-1042', who: 'Ridge & Row', st: 'Picking', due: '19 Sep', val: 8.9, notes: '' },
    { ref: 'HP-1043', who: 'Cairn Supply Co.', st: 'Shipped', due: '16 Sep', val: 21.0, notes: 'Delivered.' },
    { ref: 'HP-1044', who: 'Larch Hill Stores', st: 'New', due: '23 Sep', val: 5.6, notes: '' },
    { ref: 'HP-1045', who: 'Summit & Sound', st: 'Packed', due: '20 Sep', val: 15.2, notes: '' },
    { ref: 'HP-1046', who: 'Bramble Peak Co.', st: 'Picking', due: '21 Sep', val: 7.3, notes: 'Two lines on back order.' },
    { ref: 'HP-1047', who: 'Tarn Valley Trading', st: 'New', due: '25 Sep', val: 9.8, notes: '' },
    { ref: 'HP-1048', who: 'Coldwater Gear', st: 'Shipped', due: '15 Sep', val: 11.1, notes: '' }
  ];
  const STS = ['New', 'Picking', 'Packed', 'Shipped'];
  function pApps(host, ctx) {
    const O = ORD.map(function (o) { return Object.assign({ v: 3 }, o); });
    let sel = 'HP-1042', q = '', fs = 'All', audit = [], mode = ctx.state.sc === 'bulk' || ctx.state.sc === 'conflict' ? ctx.state.sc : '', picked = { 'HP-1041': 1, 'HP-1044': 1, 'HP-1045': 1 }, conflictSeen = false, prevTiles = null;
    const pill = function (s) { return '<span class="ost ' + s.toLowerCase() + '">' + s + '</span>'; };
    host.innerHTML = '<div class="app">' +
      '<div class="app-bar"><span class="app-dots" aria-hidden="true"><i></i><i></i><i></i></span><b>Orders</b><span class="pill">Harbour &amp; Pine · invented</span><span class="app-who">' + ICON(I.person, 14) + 'You (invented user)</span></div>' +
      '<div class="app-tools"><label class="sr-only" for="a-q">Search orders or customers</label><input id="a-q" class="tin" type="search" placeholder="Search order or customer" autocomplete="off">' +
      '<div class="fchips" role="group" aria-label="Filter by status">' + ['All'].concat(STS).map(function (s) { return '<button type="button" class="fchip" data-f="' + s + '" aria-pressed="' + (s === 'All') + '">' + s + '</button>'; }).join('') + '</div></div>' +
      '<div class="app-main"><div class="app-list"><table class="at"><caption class="sr-only">Orders (invented)</caption><thead><tr><th scope="col" class="ck"><span class="sr-only">Select</span></th><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Status</th></tr></thead><tbody id="a-rows"></tbody></table>' +
      '<p class="app-none" id="a-none" hidden>No orders match.</p><div class="bulkbar" id="a-bulk" hidden></div></div>' +
      '<section class="app-detail" id="a-detail" aria-labelledby="a-d-h"></section></div>' +
      '<div class="app-edge"><span class="lbl">Edge cases</span><button type="button" class="fchip" data-sc="bulk" aria-pressed="false">Bulk update</button><button type="button" class="fchip" data-sc="conflict" aria-pressed="false">Someone else changed this</button></div></div>' +
      '<div class="app-out"><section class="ocard" aria-labelledby="a-db-h"><h4 id="a-db-h">' + ICON(I.db, 15) + 'Database write</h4><div id="a-db"><p class="none">Save a change to see the row before and after.</p></div></section>' +
      '<section class="ocard" aria-labelledby="a-au-h"><h4 id="a-au-h">' + ICON(I.log, 15) + 'Audit log</h4><ol class="tl" id="a-audit"><li class="none">No edits yet.</li></ol></section>' +
      '<section class="ocard" aria-labelledby="a-da-h"><h4 id="a-da-h">' + ICON(I.chart, 15) + 'Dashboard</h4><div class="tiles" id="a-tiles"></div><p class="syncl" id="a-sync">' + ICON(I.platform, 14) + '<span>In step with the data platform.</span></p></section></div>' +
      '<p class="sr-only" id="a-live" role="status" aria-live="polite"></p>';
    const $ = ctx.$;
    function byRef(r) { return O.filter(function (o) { return o.ref === r; })[0]; }
    function tiles(flash) {
      const t = { open: O.filter(function (o) { return o.st !== 'Shipped'; }).length, ship: 9 + O.filter(function (o) { return o.st === 'Shipped'; }).length, val: O.filter(function (o) { return o.st !== 'Shipped'; }).reduce(function (s, o) { return s + o.val; }, 0) };
      const T = [['open', 'Open orders', t.open], ['ship', 'Shipped this week', t.ship], ['val', 'Value in flight', '£' + t.val.toFixed(1) + 'k']];
      $('a-tiles').innerHTML = T.map(function (x) { const ch = flash && prevTiles && prevTiles[x[0]] !== t[x[0]]; return '<div class="tile' + (ch ? ' chg' : '') + '"><span>' + x[1] + '</span><b>' + x[2] + '</b>' + (ch ? '<small>was ' + (x[0] === 'val' ? '£' + prevTiles.val.toFixed(1) + 'k' : prevTiles[x[0]]) + '</small>' : '') + '</div>'; }).join('');
      prevTiles = t;
    }
    function rows() {
      const list = O.filter(function (o) { return (fs === 'All' || o.st === fs) && (!q || (o.ref + ' ' + o.who).toLowerCase().indexOf(q) >= 0); });
      $('a-rows').innerHTML = list.map(function (o) {
        const ck = mode === 'bulk' ? '<td class="ck"><input type="checkbox" data-pick="' + o.ref + '" aria-label="Select ' + o.ref + '"' + (picked[o.ref] ? ' checked' : '') + '></td>' : '<td class="ck"></td>';
        return '<tr' + (o.ref === sel ? ' class="sel"' : '') + (o.flash ? ' data-flash="1"' : '') + '>' + ck + '<td class="ref"><button type="button" class="rbtn" data-open="' + o.ref + '"' + (o.ref === sel ? ' aria-current="true"' : '') + '>' + o.ref + '</button></td><td class="cust">' + esc(o.who) + '</td><td class="stc">' + pill(o.st) + '</td></tr>';
      }).join('');
      [].forEach.call($('a-rows').querySelectorAll('[data-flash]'), function (tr) { tr.classList.add('flash'); });
      O.forEach(function (o) { delete o.flash; });
      $('a-none').hidden = list.length > 0;
      host.querySelector('.app').classList.toggle('bulk', mode === 'bulk');
      bulkbar();
    }
    function bulkbar() {
      const b = $('a-bulk'); b.hidden = mode !== 'bulk';
      if (mode !== 'bulk') return;
      const n = Object.keys(picked).length;
      if (!b.querySelector('#a-bto')) {
        b.innerHTML = '<p id="a-bn"></p><label class="sr-only" for="a-bto">Set status for the selected orders</label><select id="a-bto">' + STS.map(function (s) { return '<option' + (s === 'Shipped' ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select><button type="button" class="btn primary small" id="a-bapply">Apply</button><p class="bres" id="a-bres" aria-live="polite"></p>';
        $('a-bapply').addEventListener('click', bulkApply);
      }
      $('a-bn').textContent = n + ' selected · set status to';
    }
    function detail() {
      const o = byRef(sel), d = $('a-detail');
      if (!o) { d.innerHTML = '<p class="none">Select an order.</p>'; return; }
      d.innerHTML = '<div class="dh"><h3 id="a-d-h">' + o.ref + '</h3>' + pill(o.st) + '</div><dl class="ddl"><div><dt>Customer</dt><dd>' + esc(o.who) + '</dd></div><div><dt>Due</dt><dd>' + o.due + '</dd></div><div><dt>Value</dt><dd>£' + o.val.toFixed(1) + 'k</dd></div><div><dt>Version</dt><dd>' + o.v + '</dd></div></dl>' +
        '<div class="field"><label class="lbl" for="a-st">Status</label><select id="a-st">' + STS.map(function (s) { return '<option' + (s === o.st ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label class="lbl" for="a-nt">Notes</label><textarea id="a-nt" class="tin" rows="2">' + esc(o.notes) + '</textarea></div>' +
        (mode === 'conflict' && !conflictSeen ? '<p class="edge-note">' + ICON(I.team, 14) + 'Edge case on: the next save meets a change someone else made a moment ago.</p>' : '') +
        '<p class="ferr" id="a-err" role="alert"></p><div id="a-cf"></div>' +
        '<div class="nb"><button type="button" class="btn primary small" id="a-save">Save</button><button type="button" class="btn secondary small" id="a-cancel">Cancel</button></div>';
      $('a-save').addEventListener('click', save);
      $('a-cancel').addEventListener('click', function () { detail(); $('a-st').focus(); });
    }
    function rowTable(before, after) {
      const F = [['status', 'st'], ['notes', 'notes'], ['version', 'v'], ['updated_by', 'by']];
      return '<table class="kv dbw"><thead><tr><th scope="col">Column</th><th scope="col">Before</th><th scope="col">After</th></tr></thead><tbody>' + F.map(function (f) {
        const a = before[f[1]] == null ? '' : before[f[1]], b = after[f[1]] == null ? '' : after[f[1]], ch = String(a) !== String(b);
        return '<tr' + (ch ? ' class="is-chg"' : '') + '><th scope="row">' + f[0] + '</th><td>' + (esc(a) || '<i>empty</i>') + '</td><td>' + (esc(b) || '<i>empty</i>') + '</td></tr>';
      }).join('') + '</tbody></table>';
    }
    /* the hero: edit, save, database write, audit log, dashboard, sync back */
    function commit(changes, sqlNote) {
      ctx.clear();
      const go = function () {
        ctx.J.go(1);
        $('a-db').innerHTML = '<pre class="sql"><code>' + esc(sqlNote) + '</code></pre>' + changes.map(function (c) { return rowTable(c.before, c.after); }).join('');
        const steps = [
          function () { ctx.J.go(3); audit = changes.map(function (c) { return { ref: c.ref, text: c.text }; }).concat(audit); $('a-audit').innerHTML = audit.map(function (a, i) { return '<li' + (i < changes.length ? ' class="new"' : '') + '><b>' + a.ref + '</b>: ' + esc(a.text) + ' <small>by you (invented user) · just now</small></li>'; }).join(''); },
          function () { ctx.J.go(4); tiles(true); },
          function () { ctx.J.go(5); $('a-sync').innerHTML = ICON(I.platform, 14) + '<span>Synced back to the data platform. Reports see the change at the next refresh.</span>'; $('a-sync').classList.add('on'); ctx.J.done(); $('a-live').textContent = 'Saved. Database row updated, audit entry written, dashboard updated, synced back to the platform.'; }
        ];
        if (ctx.reduce) steps.forEach(function (f) { f(); }); else steps.forEach(function (f, i) { ctx.later(f, 650 * (i + 1)); });
      };
      $('a-sync').classList.remove('on'); $('a-sync').innerHTML = ICON(I.platform, 14) + '<span>Waiting for the save…</span>';
      ctx.J.reset(); ctx.J.go(2);
      if (ctx.reduce) go(); else ctx.later(go, 450);
    }
    function snap(o) { return { st: o.st, notes: o.notes, v: o.v, by: o.by || 'ops user 3' }; }
    function save() {
      const o = byRef(sel), to = $('a-st').value, notes = $('a-nt').value.trim();
      $('a-err').textContent = '';
      if (to === o.st && notes === o.notes) { $('a-err').textContent = 'Nothing has changed, so there is nothing to save.'; return; }
      if (to === 'Shipped' && o.st === 'New') { $('a-err').textContent = 'This order is New. It must be picked and packed before it can ship.'; return; }
      if (mode === 'conflict' && !conflictSeen) { showConflict(o, to, notes); return; }
      write(o, to, notes, 'ops user 3');
    }
    function write(o, to, notes, prevBy) {
      const before = snap(o); before.by = prevBy;
      const parts = []; if (to !== o.st) parts.push('status ' + o.st + ' → ' + to); if (notes !== o.notes) parts.push('notes updated');
      o.st = to; o.notes = notes; o.v++; o.by = 'you'; o.flash = true;
      commit([{ ref: o.ref, before: before, after: snap(o), text: parts.join('; ') }], 'UPDATE orders\n   SET status = \'' + to + '\', notes = …, version = ' + o.v + '\n WHERE ref = \'' + o.ref + '\' AND version = ' + before.v + ';\n-- 1 row updated');
      rows(); detail(); $('a-save').focus();
    }
    function showConflict(o, to, notes) {
      conflictSeen = true;
      const theirs = { st: 'Packed', notes: 'Customer called: hold until Friday.' };
      $('a-cf').innerHTML = '<div class="conflict" role="alert"><p><b>Someone else changed this order a moment ago.</b> Operations user 2 saved it at 10:42 (version ' + (o.v + 1) + '). Your edit was based on version ' + o.v + '.</p>' +
        '<div class="nb"><button type="button" class="btn secondary small" data-cf="theirs">Keep theirs</button><button type="button" class="btn primary small" data-cf="mine">Keep mine</button><button type="button" class="btn ghost small" data-cf="cmp" aria-expanded="false">Compare</button></div><div class="cmp" hidden></div></div>';
      const box = $('a-cf');
      box.querySelector('[data-cf="theirs"]').focus();
      box.addEventListener('click', function (e) {
        const b = e.target.closest('[data-cf]'); if (!b) return;
        const k = b.getAttribute('data-cf');
        if (k === 'cmp') {
          const c = box.querySelector('.cmp'), open = c.hidden; c.hidden = !open; b.setAttribute('aria-expanded', String(open));
          c.innerHTML = '<table class="kv dbw"><thead><tr><th scope="col">Field</th><th scope="col">Theirs</th><th scope="col">Yours</th></tr></thead><tbody><tr class="is-chg"><th scope="row">status</th><td>' + theirs.st + '</td><td>' + to + '</td></tr><tr class="is-chg"><th scope="row">notes</th><td>' + esc(theirs.notes) + '</td><td>' + (esc(notes) || '<i>empty</i>') + '</td></tr></tbody></table>';
          return;
        }
        o.v++; o.by = 'ops user 2';
        if (k === 'theirs') {
          const before = snap(o); before.st = o.st; o.st = theirs.st; o.notes = theirs.notes; o.flash = true;
          audit.unshift({ ref: o.ref, text: 'kept the other person’s change; yours was discarded' });
          commit([{ ref: o.ref, before: before, after: snap(o), text: 'conflict resolved: kept theirs' }], '-- Kept theirs: nothing of yours was written.\nSELECT * FROM orders WHERE ref = \'' + o.ref + '\';  -- version ' + o.v);
          rows(); detail(); $('a-save').focus();
        } else { o.st = theirs.st; o.notes = theirs.notes; write(o, to, notes, 'ops user 2'); }
        ctx.set({ sc: null }); mode = ''; edgeChips();
      });
    }
    function bulkApply() {
      const to = $('a-bto').value, ok = [], bad = [];
      Object.keys(picked).forEach(function (r) { const o = byRef(r); if (to === 'Shipped' && o.st === 'New') bad.push(o); else if (o.st !== to) ok.push(o); });
      const changes = ok.map(function (o) { const before = snap(o), from = o.st; o.st = to; o.v++; o.by = 'you'; o.flash = true; return { ref: o.ref, before: before, after: snap(o), text: 'bulk update: status ' + from + ' → ' + to }; });
      $('a-bres').innerHTML = '<b>' + changes.length + ' updated</b>' + (bad.length ? ' · <span class="rej">' + bad.length + ' rejected: ' + bad.map(function (o) { return o.ref + ' is New, so it must be picked and packed before it can ship'; }).join('; ') + '.</span>' : '.');
      if (changes.length) commit(changes, 'UPDATE orders SET status = \'' + to + '\', version = version + 1\n WHERE ref IN (' + changes.map(function (c) { return '\'' + c.ref + '\''; }).join(', ') + ');\n-- ' + changes.length + ' rows updated' + (bad.length ? '\n-- ' + bad.map(function (o) { return o.ref; }).join(', ') + ' stopped by validation before the database' : ''));
      picked = {}; bad.forEach(function (o) { picked[o.ref] = 1; });
      rows(); detail();
      $('a-bapply').focus();
    }
    function edgeChips() { [].forEach.call(host.querySelectorAll('[data-sc]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-sc') === mode)); }); }
    host.querySelector('.app-edge').addEventListener('click', function (e) {
      const b = e.target.closest('[data-sc]'); if (!b) return;
      const k = b.getAttribute('data-sc'); mode = mode === k ? '' : k; conflictSeen = false;
      if (mode === 'bulk') picked = { 'HP-1041': 1, 'HP-1044': 1, 'HP-1045': 1 };
      ctx.set({ sc: mode || null }); edgeChips(); rows(); detail();
      $('a-live').textContent = mode === 'bulk' ? 'Bulk update on: three orders are selected. Choose a status and Apply.' : mode === 'conflict' ? 'Conflict case on: edit the order and save.' : 'Edge case off.';
    });
    $('a-rows').addEventListener('click', function (e) {
      const b = e.target.closest('[data-open]'); if (b) { sel = b.getAttribute('data-open'); rows(); detail(); $('a-st').focus(); return; }
    });
    $('a-rows').addEventListener('change', function (e) { const c = e.target.closest('[data-pick]'); if (!c) return; const r = c.getAttribute('data-pick'); if (c.checked) picked[r] = 1; else delete picked[r]; bulkbar(); });
    $('a-q').addEventListener('input', function () { q = this.value.trim().toLowerCase(); rows(); });
    host.querySelector('.fchips').addEventListener('click', function (e) {
      const b = e.target.closest('[data-f]'); if (!b) return; fs = b.getAttribute('data-f');
      [].forEach.call(this.querySelectorAll('[data-f]'), function (x) { x.setAttribute('aria-pressed', String(x === b)); }); rows();
    });
    edgeChips(); rows(); detail(); tiles(false); ctx.J.go(2);
    return {};
  }

  /* ======================= 8. DATA Q&A DESK ======================= */
  const J_QA = [
    J('Question', 'q', 'A question in plain English, by message or email.', 'Person'),
    J('Definitions', 'book', 'The business’s own definitions: what revenue, margin or year to date mean here.', 'Governed'),
    J('Governed data', 'platform', 'The governed tables, read-only. Nothing here can change them.', 'Read-only', '', 'An answering agent and a separate verifier agent read this data, read-only. They use it; they are not part of it.'),
    J('Answer', 'answer', 'Worked out from the data, with the query kept for the record.', 'Data agent'),
    J('Recheck', 'check', 'Worked out again, a different way, by something that did not produce the first answer.', 'Verifier agent'),
    J('Reply', 'mail', 'A ready-to-send reply plus a spreadsheet with the data and notes.', 'Person')
  ];
  function qaSet() {
    const HP = window.HP, all = HP.REGIONS.map(function (r) { return r.id; }), allP = HP.PRODUCTS.map(function (p) { return p.id; }), ytd = range(24, 32);
    const C = HP.CELLS;
    /* q1: the fastest-growing product line, year to date */
    const g = allP.map(function (p) { const s = HP.aggregate(all, [p], ytd); return { id: p, name: HP.PRODUCTS.filter(function (x) { return x.id === p; })[0].name, cur: s.a.rev, pr: s.p.rev, g: (s.a.rev - s.p.rev) / s.p.rev * 100 }; }).sort(function (a, b) { return b.g - a.g; });
    const b1 = g[0];
    let c1 = 0, p1 = 0; all.forEach(function (r) { ytd.forEach(function (m) { c1 += C[r][b1.id].rev.a[m]; p1 += C[r][b1.id].rev.a[m - 12]; }); });
    const r1 = (c1 - p1) / p1 * 100;
    /* q2: gross margin % in the South, Q3 2024 */
    const s2 = HP.aggregate(['south'], allP, [30, 31, 32]), a2 = s2.a.gm / s2.a.rev * 100;
    let rv = 0, cg = 0; allP.forEach(function (p) { [30, 31, 32].forEach(function (m) { rv += C.south[p].rev.a[m]; cg += C.south[p].cogs.a[m]; }); });
    const r2 = (rv - cg) / rv * 100;
    /* q3: EBITDA against budget, year to date */
    const s3 = HP.aggregate(all, allP, ytd), a3 = s3.a.ebitda - s3.b.ebitda;
    const per = all.map(function (r) { let ea = 0, eb = 0; allP.forEach(function (p) { ytd.forEach(function (m) { const c = C[r][p]; ea += c.rev.a[m] - c.cogs.a[m] - c.opex.a[m]; eb += c.rev.b[m] - c.cogs.b[m] - c.opex.b[m]; }); }); return { r: HP.REGIONS.filter(function (x) { return x.id === r; })[0].name, d: ea - eb }; });
    const r3 = per.reduce(function (s, x) { return s + x.d; }, 0);
    return [
      { id: 'q1', q: 'Which product line grew fastest against last year, year to date?',
        defs: [['Revenue', 'Net of returns; internal transfers left out.'], ['Year to date', 'January to September 2024, the latest closed month.'], ['Growth', 'Against the same months last year.']],
        sql: 'SELECT product_line,\n       SUM(CASE WHEN month BETWEEN \'2024-01\' AND \'2024-09\' THEN revenue END) AS ytd,\n       SUM(CASE WHEN month BETWEEN \'2023-01\' AND \'2023-09\' THEN revenue END) AS ytd_last_year\n  FROM sales_ready\n GROUP BY product_line\n ORDER BY ytd / ytd_last_year DESC;',
        ans: b1.name + ': ' + money(b1.cur) + ' year to date, ' + b1.g.toFixed(1) + '% above the same months last year.', big: '+' + b1.g.toFixed(1) + '%', bigl: b1.name,
        how: 'Adds up the monthly cells for that product line region by region, for both years, then compares. No shared query, no shared totals.',
        code: 'for each region in North, Midlands, South:\n    this_year += revenue[line][Jan..Sep 2024]\n    last_year += revenue[line][Jan..Sep 2023]\ngrowth = (this_year − last_year) / last_year',
        chk: '+' + r1.toFixed(1) + '%', match: Math.abs(r1 - b1.g) < 1e-9 && c1 === b1.cur,
        sheet: [['Product line', 'YTD', 'vs last year']].concat(g.slice(0, 4).map(function (x) { return [x.name, money(x.cur), '+' + x.g.toFixed(1) + '%']; })) },
      { id: 'q2', q: 'What was gross margin % in the South last quarter?',
        defs: [['Gross margin', 'Revenue less cost of sales.'], ['Gross margin %', 'Gross margin as a share of revenue.'], ['Last quarter', 'July to September 2024.']],
        sql: 'SELECT 100.0 * (SUM(revenue) - SUM(cost_of_sales)) / SUM(revenue) AS gm_pct\n  FROM sales_ready\n WHERE region = \'South\'\n   AND month BETWEEN \'2024-07\' AND \'2024-09\';',
        ans: 'Gross margin was ' + a2.toFixed(1) + '% of revenue in the South, July to September 2024 (' + money(s2.a.gm) + ' on ' + money(s2.a.rev) + ').', big: a2.toFixed(1) + '%', bigl: 'South, Q3 2024',
        how: 'Adds revenue and cost of sales product line by product line, month by month, straight from the cells, then divides.',
        code: 'for each product line, for Jul, Aug, Sep 2024:\n    revenue += cell.revenue\n    cost    += cell.cost_of_sales\ngm_pct = (revenue − cost) / revenue',
        chk: r2.toFixed(1) + '%', match: Math.abs(r2 - a2) < 1e-9,
        sheet: [['Month', 'Revenue', 'GM %']].concat([30, 31, 32].map(function (m) { const s = HP.aggregate(['south'], allP, [m]); return [HP.MON[m % 12] + ' 2024', money(s.a.rev), (s.a.gm / s.a.rev * 100).toFixed(1) + '%']; })) },
      { id: 'q3', q: 'How far is EBITDA from budget, year to date, across all regions?',
        defs: [['EBITDA', 'Gross margin less operating expenses.'], ['Budget', 'The approved budget for 2024.'], ['Year to date', 'January to September 2024.']],
        sql: 'SELECT SUM(ebitda_actual) - SUM(ebitda_budget) AS vs_budget\n  FROM pnl_ready\n WHERE month BETWEEN \'2024-01\' AND \'2024-09\';',
        ans: 'EBITDA is ' + smoney(a3) + ' against budget year to date (' + money(s3.a.ebitda) + ' actual, ' + money(s3.b.ebitda) + ' budget).', big: smoney(a3), bigl: 'EBITDA vs budget, YTD',
        how: 'Works out the gap region by region from revenue, cost of sales and operating expenses, then adds the three gaps up.',
        code: 'for each region:\n    gap += (revenue − cost − opex)[actual] − (revenue − cost − opex)[budget]\nvs_budget = gap(North) + gap(Midlands) + gap(South)',
        chk: smoney(r3), match: r3 === a3,
        sheet: [['Region', 'EBITDA vs budget']].concat(per.map(function (x) { return [x.r, smoney(x.d)]; })) }
    ];
  }
  function pQA(host, ctx) {
    const Q = qaSet();
    let pick = Q.filter(function (x) { return x.id === ctx.state.sc; })[0] || Q[0];
    host.innerHTML = '<fieldset class="qpick"><legend>Pick a question about Harbour &amp; Pine (invented)</legend><div class="qcards">' + Q.map(function (x) {
      return '<label class="qcard"><input type="radio" name="qa-q" value="' + x.id + '"' + (x === pick ? ' checked' : '') + '><span>' + esc(x.q) + '</span></label>';
    }).join('') + '</div></fieldset>' +
      '<div class="sbar qa-bar"><div class="meta"><span class="pill"><i></i>Read-only</span><span>Answers come from the governed data, using the business’s own definitions.</span></div><button type="button" class="btn primary small" id="q-ask">' + PLAY + '<span>Ask the desk</span></button></div>' +
      '<ol class="qsteps" id="q-steps"><li class="qempty">Pick a question and ask. Each step appears as the desk works: definitions, the query, the answer, an independent recheck, and the reply.</li></ol>';
    const $ = ctx.$, ask = $('q-ask'), out = $('q-steps');
    host.querySelector('.qcards').addEventListener('change', function (e) {
      pick = Q.filter(function (x) { return x.id === e.target.value; })[0]; ctx.set({ sc: pick.id === 'q1' ? null : pick.id });
      ctx.clear(); ctx.J.reset(); busy(ask, false); ask.querySelector('span').textContent = 'Ask the desk';
      out.innerHTML = '<li class="qempty">Ready. Press <b>Ask the desk</b>.</li>';
    });
    function card(n, t, body, cls) { return '<li class="qs' + (cls ? ' ' + cls : '') + '"><span class="qn" aria-hidden="true">' + n + '</span><div><h4>' + t + '</h4>' + body + '</div></li>'; }
    function run() {
      if (isBusy(ask)) return;
      ctx.clear(); ctx.J.reset(); out.innerHTML = '';
      const x = pick;
      const steps = [
        function () { ctx.J.go(0); ctx.J.go(1); out.insertAdjacentHTML('beforeend', card(1, 'Definitions used', '<dl class="defs">' + x.defs.map(function (d) { return '<div><dt>' + esc(d[0]) + '</dt><dd>' + esc(d[1]) + '</dd></div>'; }).join('') + '</dl>')); },
        function () { ctx.J.go(2); out.insertAdjacentHTML('beforeend', card(2, 'The query, simplified, on invented tables', '<pre class="sql"><code>' + esc(x.sql) + '</code></pre><p class="fine">Read-only. The desk can query the governed tables; it cannot change them.</p>')); },
        function () { ctx.J.go(3); out.insertAdjacentHTML('beforeend', card(3, 'The answer', '<p class="qbig"><b>' + esc(x.big) + '</b><span>' + esc(x.bigl) + '</span></p><p>' + esc(x.ans) + '</p>')); },
        function () { ctx.J.go(4); out.insertAdjacentHTML('beforeend', card(4, 'Independent recheck', '<p>' + esc(x.how) + '</p><pre class="sql"><code>' + esc(x.code) + '</code></pre><p class="match">' + (x.match ? '<span class="vchip">' + OK.replace(/18/g, '12') + 'Match</span>' : '<span class="vchip no">Differs</span>') + 'Second path: <b>' + esc(x.chk) + '</b>. First answer: <b>' + esc(x.big) + '</b>. ' + (x.match ? 'They agree, so it can go out.' : 'They differ, so nothing is sent.') + '</p>', 'chk')); },
        function () {
          ctx.J.go(5);
          out.insertAdjacentHTML('beforeend', card(5, 'Reply plus spreadsheet, ready for a person to send', '<div class="reply"><p>Hi,</p><p>' + esc(x.ans) + '</p><p>The definitions used and the data behind it are in the attached spreadsheet. The figure was checked a second, independent way and matches.</p></div>' +
            '<div class="xls" aria-label="Attached spreadsheet preview"><div class="xls-h">' + ICON(I.sheet, 14) + 'answer.xlsx <span>Data</span><span class="off">Notes</span></div><table class="kv">' + x.sheet.map(function (r, i) { return '<tr>' + r.map(function (c) { return i ? '<td>' + esc(c) + '</td>' : '<th scope="col">' + esc(c) + '</th>'; }).join('') + '</tr>'; }).join('') + '</table></div>'));
          ctx.J.done(); busy(ask, false); ask.querySelector('span').textContent = 'Ask again';
          ctx.live('Answer: ' + x.ans + ' Rechecked a second way: ' + (x.match ? 'they match.' : 'they differ.') + ' Reply and spreadsheet ready for a person to send.');
        }
      ];
      if (ctx.reduce) { steps.forEach(function (s) { s(); }); return; }
      busy(ask, true); ask.querySelector('span').textContent = 'Working…';
      steps.forEach(function (s, i) { ctx.later(s, 200 + i * 1250); });
    }
    ask.addEventListener('click', run);
    return { run: run };
  }

  /* ======================= 9. WORKBOOK REBUILDS ======================= */
  const J_WB = [
    J('Legacy workbook', 'sheet', 'A workbook that grew over years: copied sheets, typed-in numbers, formulas that differ row to row.', 'Excel'),
    J('Understand', 'search', 'Work out what it really does: every sheet, formula and hard-coded number, mapped.', 'Person', 'An agent can map it for me; I check the map against how the team uses it.'),
    J('Redesign', 'pen', 'A clean model: inputs once, named assumptions, one formula per column, the same outputs.', 'Person'),
    J('Rebuild', 'wrench', 'Built again from the design, with a checks sheet.', 'Person', 'The rebuild can be done with agent help; I review it.'),
    J('Parity test', 'gate', 'Old and new outputs compared side by side. Every difference is explained.', 'Person', 'An agent can run the comparison; I explain each difference to its owner.'),
    J('Drop-in', 'swap', 'Same inputs, same output layout: it replaces the old one where it sits.', 'Person')
  ];
  /* invented workbook: £k by product line (rows 4 to 9) and region (columns B to D) */
  const WB = { lines: ['Tents & Shelters', 'Packs & Bags', 'Apparel', 'Footwear', 'Cook & Camp', 'Climbing & Safety'], N: [480, 300, 610, 350, 200, 150], M: [440, 280, 560, 330, 190, 130], S: [410, 260, 520, 300, 180, 140] };
  const sum = function (a, n) { return a.slice(0, n == null ? a.length : n).reduce(function (s, v) { return s + v; }, 0); };
  function pWorkbook(host, ctx) {
    const NAMES = ['Legacy workbook', 'Understand', 'Redesign', 'Rebuild', 'Parity test', 'Drop-in'];
    host.innerHTML = '<div class="sbar"><div class="meta"><span class="pill accent"><i></i>One rebuild</span><span>A tangled, invented workbook, rebuilt and tested as a drop-in replacement.</span></div>' +
      '<button type="button" class="btn primary small" id="w-run">' + PLAY + '<span>Run the rebuild</span></button></div>' +
      '<ol class="wsteps" id="w-steps" aria-label="Phases">' + NAMES.map(function (n, i) { return '<li><button type="button" data-w="' + i + '" aria-pressed="false"><span class="n">' + (i + 1) + '</span>' + n + '</button></li>'; }).join('') + '</ol>' +
      '<div class="wpanel" id="w-panel" tabindex="-1"></div>' +
      '<div class="lyr-nav"><button type="button" class="btn secondary small" id="w-prev"><span aria-hidden="true">←</span>Back</button><p class="lyr-pos" id="w-pos" aria-live="polite"></p><button type="button" class="btn secondary small" id="w-next">Next<span aria-hidden="true">→</span></button></div>';
    const $ = ctx.$, panel = $('w-panel'), runBtn = $('w-run');
    let step = ctx.state.step != null ? Math.max(0, Math.min(5, ctx.state.step)) : 0, cell = 'B6';
    const FORM = {
      B4: ['=SUM(Calc!B4:B9)', 'North revenue'], B5: ['=SUM(Calc!C4:C9)', 'Midlands revenue'], B6: ['=SUM(Calc!D4:D8)', 'South revenue'], B7: ['=SUM(B4:B6)', 'Total'],
      C4: ['=B4*Calc!F2', 'North with uplift'], C5: ['=B5*1.035', 'Midlands with uplift'], C6: ['=B6*Calc!F2', 'South with uplift'], C7: ['=Old!B2+SUM(C4:C6)-Old!B2', 'Total with uplift']
    };
    const legacyS = sum(WB.S, 5);
    function grid() {
      const rows = [['4', 'North', sum(WB.N)], ['5', 'Midlands', sum(WB.M)], ['6', 'South', legacyS], ['7', 'Total', sum(WB.N) + sum(WB.M) + legacyS]];
      return '<div class="wx"><div class="wx-top">' + ICON(I.sheet, 14) + '<b>Regional margin tracker v7 FINAL (2).xlsx</b><span>invented</span></div>' +
        '<div class="wx-fx"><span class="ref" id="w-ref">' + cell + '</span><code id="w-fx">' + esc(FORM[cell][0]) + '</code></div>' +
        '<table class="wx-g"><caption class="sr-only">Summary sheet. Select a cell to see its formula.</caption><thead><tr><th scope="col"></th><th scope="col">A</th><th scope="col">B · Revenue £k</th><th scope="col">C · With uplift</th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><th scope="row">' + r[0] + '</th><td>' + r[1] + '</td>' + ['B', 'C'].map(function (c) {
            const id = c + r[0], v = c === 'B' ? r[2] : Math.round(r[2] * 1.035);
            return '<td><button type="button" class="xc' + (id === cell ? ' on' : '') + (id === 'C5' ? ' hard' : '') + '" data-c="' + id + '" aria-pressed="' + (id === cell) + '" aria-label="Cell ' + id + ', ' + nf.format(v) + '">' + nf.format(v) + '</button></td>';
          }).join('') + '</tr>';
        }).join('') + '</tbody></table>' +
        '<div class="wx-tabs" aria-label="Sheets"><span class="on">Summary</span><span>Calc</span><span>Calc (2)</span><span>Lookup</span><span>Input</span><span>Old</span></div></div>' +
        '<p class="fine">Select a cell to read its formula. The orange corner marks a number typed into a formula. Nothing looks wrong at a glance, which is the problem.</p>';
    }
    const MAP = '<svg class="wmap" viewBox="0 0 560 210" role="img" aria-labelledby="w-map-t"><title id="w-map-t">Sheet map: Input and Lookup feed Calc, Calc feeds Summary; Old is still read by one Summary cell; Calc (2) is read by nothing.</title>' +
      '<defs><marker id="wah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1 1 9 5 1 9z" class="ah"/></marker></defs>' +
      '<path class="e" d="M112 52H212" marker-end="url(#wah)"/><path class="e" d="M112 150C160 150 170 80 212 66" marker-end="url(#wah)"/><path class="e" d="M318 60H418" marker-end="url(#wah)"/><path class="e warn" d="M470 160V92" marker-end="url(#wah)"/>' +
      '<g class="nd"><rect x="12" y="30" width="100" height="44" rx="10"/><text x="62" y="57">Input</text></g><g class="nd"><rect x="12" y="128" width="100" height="44" rx="10"/><text x="62" y="155">Lookup</text></g>' +
      '<g class="nd"><rect x="214" y="38" width="104" height="44" rx="10"/><text x="266" y="65">Calc</text></g><g class="nd main"><rect x="420" y="38" width="104" height="54" rx="10"/><text x="472" y="62">Summary</text><text x="472" y="78" class="s">what people read</text></g>' +
      '<g class="nd dead"><rect x="214" y="140" width="104" height="44" rx="10"/><text x="266" y="167">Calc (2)</text></g><g class="nd warn"><rect x="420" y="160" width="104" height="40" rx="10"/><text x="472" y="185">Old</text></g></svg>';
    const PH = [
      function () { return { t: 'A legacy workbook', d: 'Six sheets that grew over years. People trust the Summary sheet because it has always been there.', body: grid() }; },
      function () {
        return { t: 'Understand: what it really does', d: 'An analyst agent maps every sheet and formula. A person checks the map against how the team uses it.',
          body: '<div class="wgrid"><div>' + MAP + '</div><ul class="finds"><li><b>Typed-in uplift.</b> 1.035 is typed into one formula (Summary!C5) and held in a cell (Calc!F2) for the others.</li><li><b>A dead copy.</b> “Calc (2)” is read by nothing.</li><li><b>A ghost sheet.</b> “Old” is still read by one total, then cancelled out.</li><li><b>Formulas differ row to row</b>, so nobody can check them by eye.</li></ul></div>' };
      },
      function () {
        return { t: 'Redesign: a clean model', d: 'Same inputs, same outputs, nothing hidden in between.',
          body: '<ol class="wflow"><li><b>Inputs</b><span>One table, typed once</span></li><li><b>Assumptions</b><span>Uplift 1.035, named, with an owner</span></li><li><b>Model</b><span>One formula per column</span></li><li><b>Outputs</b><span>The old Summary layout, unchanged</span></li><li><b>Checks</b><span>Totals that must tie out</span></li></ol>' };
      },
      function () {
        return { t: 'Rebuild', d: 'A builder agent builds it from the design. Each sheet has one job.',
          body: '<ul class="wbuild" id="w-build">' + [['Read me', 'what it does and who owns it'], ['Inputs', 'one table'], ['Assumptions', 'named values'], ['Model', 'one formula per column'], ['Outputs', 'same layout as before'], ['Checks', 'totals tie out']].map(function (s) { return '<li><span class="ok">' + OK.replace(/18/g, '14') + '</span><b>' + s[0] + '</b><span>' + s[1] + '</span></li>'; }).join('') + '</ul>' };
      },
      function () {
        const R = [['North', sum(WB.N), sum(WB.N)], ['Midlands', sum(WB.M), sum(WB.M)], ['South', legacyS, sum(WB.S)], ['Total', sum(WB.N) + sum(WB.M) + legacyS, sum(WB.N) + sum(WB.M) + sum(WB.S)]];
        return { t: 'Parity test: old and new, side by side', d: 'A tester agent runs both on the same inputs and compares every output.',
          body: '<table class="ptab wpar"><caption class="sr-only">Revenue £k, old workbook against the rebuild</caption><thead><tr><th scope="col">Revenue £k</th><th scope="col">Old</th><th scope="col">New</th><th scope="col"><span class="sr-only">Result</span></th></tr></thead><tbody>' +
            R.map(function (r) { const m = r[1] === r[2]; return '<tr class="' + (m ? 'ok' : 'bad') + '"><th scope="row">' + r[0] + '</th><td>' + nf.format(r[1]) + '</td><td>' + nf.format(r[2]) + '</td><td>' + (m ? '<span class="vchip">' + OK.replace(/18/g, '12') + 'Match</span>' : '<span class="vchip no">' + BAD.replace(/18/g, '12') + 'Differs</span>') + '</td></tr>'; }).join('') + '</tbody></table>' +
            '<div class="found"><b>Found: a hidden formula error in the old workbook.</b><p>The old South total reads <code>Calc!D4:D8</code>: one row short. Climbing &amp; Safety (row 9, ' + nf.format(WB.S[5]) + ') was added later and the range was never extended, so the South never counted it. North and Midlands read rows 4 to 9. The rebuild uses one formula for every region, so it cannot drift.</p><p>A person checked the source figures and confirmed: the new number is right and the old one was wrong.</p></div>' };
      },
      function () {
        return { t: 'Drop-in replacement', d: 'Same inputs, same output layout. It replaces the old workbook where it sits.',
          body: '<ul class="finds ok"><li><b>Same place, same layout.</b> Anything that read the old Summary reads the new one.</li><li><b>Checks sheet.</b> Every total ties out, and it says so on the sheet.</li><li><b>One known difference</b>, explained and signed off: South now includes Climbing &amp; Safety.</li></ul><div class="okcard">' + OK + 'Signed off by a person and dropped in.</div>' };
      }
    ];
    function show(i, focus) {
      step = i; const p = PH[i]();
      panel.innerHTML = '<h3>' + esc(p.t) + '</h3><p class="wd">' + esc(p.d) + '</p>' + p.body;
      [].forEach.call($('w-steps').querySelectorAll('button'), function (b, k) { b.setAttribute('aria-pressed', String(k === i)); b.parentNode.className = k < i ? 'done' : k === i ? 'on' : ''; });
      posLine($('w-pos'), i, 6, NAMES[i]);
      $('w-prev').setAttribute('aria-disabled', String(i === 0)); $('w-next').setAttribute('aria-disabled', String(i === 5));
      ctx.J.go(i); if (i === 4) ctx.J.bad(4);
      ctx.set({ step: i || null });
      if (i === 0) panel.querySelector('.wx-g').addEventListener('click', function (e) {
        const b = e.target.closest('[data-c]'); if (!b) return; cell = b.getAttribute('data-c');
        $('w-ref').textContent = cell; $('w-fx').textContent = FORM[cell][0];
        [].forEach.call(panel.querySelectorAll('.xc'), function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
        ctx.live('Cell ' + cell + ', ' + FORM[cell][1] + ': ' + FORM[cell][0]);
      });
      if (i === 3 && !ctx.reduce) [].forEach.call(panel.querySelectorAll('#w-build li'), function (li, k) { li.style.animationDelay = (k * 160) + 'ms'; });
      if (focus) panel.focus({ preventScroll: true });
    }
    function stop() { ctx.clear(); busy(runBtn, false); runBtn.querySelector('span').textContent = 'Run the rebuild'; }
    function run() {
      if (isBusy(runBtn)) return;
      stop(); ctx.J.reset();
      if (ctx.reduce) { show(0); ctx.live('Reduced motion is on: use Next to step through the rebuild.'); return; }
      busy(runBtn, true); runBtn.querySelector('span').textContent = 'Rebuilding…';
      [0, 1, 2, 3, 4, 5].forEach(function (i) { ctx.later(function () { show(i); if (i === 5) { stop(); runBtn.querySelector('span').textContent = 'Run it again'; ctx.J.done(); } }, i * 2300); });
    }
    runBtn.addEventListener('click', run);
    $('w-steps').addEventListener('click', function (e) { const b = e.target.closest('[data-w]'); if (b) { stop(); show(+b.getAttribute('data-w')); } });
    $('w-prev').addEventListener('click', function () { if (step > 0) { stop(); show(step - 1); } });
    $('w-next').addEventListener('click', function () { if (step < 5) { stop(); show(step + 1); } });
    show(step);
    return { run: run };
  }

  /* ======================= REGISTER ======================= */
  /* hand: what I do myself at a step, by journey label. agents: [kind, what agents (or automation) take, what I still own].
     kind is build (helps build or change a step), data (reads governed data), auto (scheduled, no AI) or person. */
  S.define('platform', { title: 'Group data platform', eyebrow: 'Simulation · invented data', icon: 'platform', journey: J_PLATFORM, mount: pPlatform,
    hand: [['Raw', 'I build the loads in pipelines and notebooks, with a failure rule at each stage.'], ['Cleaned', 'I write the cleaning in SQL, notebooks and Power Query.'], ['Business-ready', 'I model the data: the keys, the joins and the business’s own definitions.'], ['Semantic model', 'I write the measures in DAX, set up row-level security and check every figure against the source.'], ['Report', 'I build the report and test it with the people who read it.']],
    agents: [['build', 'Drafting changes to cleaning logic, a model or a report, for me to review.', 'The design, the definitions, and the sign-off before production.'],
      ['auto', 'Running the chain through the day and alerting at the stage that failed. No AI.', 'Deciding what may carry on and what must stop.'],
      ['data', 'Answering ad hoc questions by reading the governed model, read-only.', 'The model and the definitions it answers from.']] });
  S.define('exec', { title: 'Executive reporting', eyebrow: 'Live demo · invented data', icon: 'chart', journey: J_EXEC, mount: pExec,
    hand: [['Business-ready', 'I agree each definition with finance before it goes in.'], ['Semantic model', 'I write the measures in DAX, from actual and budget to latest estimate and prior year, and set the row-level security.'], ['Report', 'I design the pages around how leaders read them, and check every figure against the source.'], ['Leaders', 'I take their questions and build the common ones into the report.']],
    agents: [['build', 'Drafting a report or model change, with a separate review of it.', 'What the page should say and how leaders read it, and the sign-off.'],
      ['build', 'Comparing every key figure before and after a change, value by value.', 'The baseline, and the call when a number moves.'],
      ['data', 'Answering leaders’ own questions from the model, read-only.', 'The governed model it reads.']] });
  S.define('auto', { title: 'Automation suite', eyebrow: 'Simulations · invented data', icon: 'bolt', journey: J_APPROVAL, mount: pAuto,
    hand: [['Tracked list', 'I build the flows in Power Automate, with SharePoint and Dataverse behind them.'], ['Approval chain', 'I design the routing and the reminders with the people who approve.'], ['Daily monitor', 'I built the read-only health checks and the daily digest.'], ['Sync flows', 'I build the dataflow and the create, update and archive flows.']],
    agents: [['build', 'Drafting a flow change in code and comparing it with what is live. It never runs a flow.', 'Approving the change before it reaches production.'],
      ['auto', 'Running the flows, checking them daily, the digest and the failure alerts. No AI.', 'Acting on what the monitor finds.']] });
  S.define('control', { title: 'Agent control room', eyebrow: 'Mock dashboard · invented projects', icon: 'lead', journey: J_CONTROL, mount: pControl,
    hand: [['Project lead', 'I ran projects this way by hand first: a plan, a state document and gates.'], ['Gates', 'I decide, with the parity, review and test evidence in front of me.'], ['Monitor', 'I built the control room itself: a small local dashboard with no AI in it.']],
    agents: [['build', 'Holding each project’s plan and state, and handing slices to specialist agents.', 'The goal, the scope and the gates.'],
      ['build', 'Building, reviewing and testing, each by a separate agent.', 'Each decision that reaches production, one at a time.'],
      ['auto', 'Showing every project and what needs me. The control room has no AI in it.', 'The policy on who may message whom.']] });
  S.define('suite', { title: 'Agentic delivery suite', eyebrow: 'Simulation · an invented change', icon: 'gate', journey: J_SUITE, mount: pSuite,
    hand: [['Builder', 'I can build every slice myself: SQL, Power Query, DAX, flows and apps.'], ['Parity check', 'I designed the parity method: every key figure, before and after, value by value.'], ['Sign-off', 'I sign off each change myself, with the evidence in front of me.']],
    agents: [['build', 'Build, review and test, each by a separate agent; none approves its own work.', 'The method itself, and the scope of each slice.'],
      ['build', 'Running the parity check against the baseline.', 'The baseline, and what must not move.'],
      ['person', 'The evidence and a dry run, ready for a decision.', 'The sign-off for each specific change.']] });
  S.define('apps', { title: 'Order-tracking app', eyebrow: 'Mock app · invented orders', icon: 'app', journey: J_APPS, mount: pApps,
    hand: [['SQL database', 'I designed the tables, keys and audit columns, and I write the SQL.'], ['Web app', 'I build the app: search, edit, a save with a version check, the audit log.'], ['Dashboards', 'I build the saved views and the dashboard tiles.'], ['Data platform', 'I set up the sync back, so reports see each change.']],
    agents: [['build', 'Drafting app changes through builder, reviewer and tester agents.', 'The design, and the go for each release.'],
      ['build', 'Drafting the database scripts.', 'Reading them and running them.'],
      ['auto', 'Writing the audit log on every save and syncing back on a schedule. No AI.', 'What gets audited, and why.']] });
  S.define('qa', { title: 'Data Q&A desk', eyebrow: 'Simulation · invented data', icon: 'answer', journey: J_QA, mount: pQA,
    hand: [['Definitions', 'I keep the business definitions, agreed with the people who own each figure.'], ['Answer', 'I write the query against the governed tables.'], ['Recheck', 'I work it out a second way before anything goes out.'], ['Reply', 'I write the reply and attach the data with notes.']],
    agents: [['data', 'Working out the answer by reading the governed data, read-only.', 'The definitions it uses.'],
      ['data', 'Rechecking it a separate way. If the two disagree, nothing is sent.', 'Reading the reply and sending it.']] });
  S.define('workbook', { title: 'Workbook rebuilds', eyebrow: 'Simulation · an invented workbook', icon: 'sheet', journey: J_WB, mount: pWorkbook,
    hand: [['Understand', 'I trace every sheet, formula and typed-in number.'], ['Redesign', 'I design the clean model: inputs once, named assumptions, one formula per column.'], ['Rebuild', 'I rebuild it in Excel and Power Query.'], ['Parity test', 'I run old and new side by side and explain every difference.']],
    agents: [['build', 'Mapping every sheet, formula and typed-in number.', 'Checking the map against how the team uses it.'],
      ['build', 'Rebuilding it, and comparing old and new outputs figure by figure.', 'Explaining each difference, and the sign-off.']] });
})();
