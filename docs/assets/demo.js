/* Harbour & Pine Outdoor Co.: executive P&L demo.
   Every number here is INVENTED. Data is generated from a fixed seed, so it is identical on every load.
   Plain SVG, no libraries. Sections: 1 data, 2 maths and formatting, 3 state, 4 KPI cards,
   5 trend chart, 6 variance bridge, 7 drill-down table, 8 wiring. */
(function () {
  'use strict';

  /* ======================= 1. DATA (shared with the home-page teaser: assets/hp-data.js) ======================= */
  const HP = window.HP;
  const MON = HP.MON, REGIONS = HP.REGIONS, PRODUCTS = HP.PRODUCTS, CELLS = HP.CELLS, FIRST = HP.FIRST, LAST = HP.LAST, aggregate = HP.aggregate, niceStep = HP.niceStep;

  /* ======================= 2. MATHS AND FORMATTING ======================= */
  const nf = new Intl.NumberFormat('en-GB');
  function money(v) {
    const a = Math.abs(v), s = a >= 10000 ? '£' + (a / 1000).toFixed(2) + 'm' : '£' + nf.format(Math.round(a)) + 'k';
    return (v < 0 ? '−' : '') + s;
  }
  function smoney(v) { return (v < 0 ? '−' : '+') + money(Math.abs(v)); }
  function pct(v, d) { return (v < 0 ? '−' : '+') + Math.abs(v).toFixed(d == null ? 1 : d) + '%'; }
  function ratio(n, d) { return d ? n / d * 100 : 0; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  const monthLabel = function (i) { return MON[i % 12] + ' ' + (2022 + Math.floor(i / 12)); };

  /* Variance of an actual against a base. higherIsGood = false for costs. */
  function variance(act, base, higherIsGood) {
    const d = act - base, p = ratio(d, Math.abs(base));
    if (Math.abs(p) < 0.05) return { d: d, p: 0, cls: 'flat', arrow: '▬', up: null };
    const up = d > 0;
    return { d: d, p: p, cls: (up === higherIsGood) ? 'good' : 'bad', arrow: up ? '▲' : '▼', up: up };
  }
  function words(v, basis, higherIsGood) {
    if (v.up === null) return 'on ' + basis;
    if (higherIsGood) return (v.up ? 'above ' : 'below ') + basis;
    return (v.up ? 'over ' : 'under ') + basis;
  }
  /* The demo's markup. mount() puts it into any container, so the same code runs on demo.html and inside the explorer. */
  const TEMPLATE = `<p id="status" class="sr-only" role="status" aria-live="polite"></p>

    <form class="filters" id="filters" aria-label="Report filters" onsubmit="return false">
      <fieldset class="field"><legend>Region</legend>
        <div class="seg wrap-m"><input type="radio" name="region" id="region-all" value="all" checked><label for="region-all">All</label><input type="radio" name="region" id="region-north" value="north"><label for="region-north">North</label><input type="radio" name="region" id="region-midlands" value="midlands"><label for="region-midlands">Midlands</label><input type="radio" name="region" id="region-south" value="south"><label for="region-south">South</label></div>
      </fieldset>
      <div class="field"><label class="lbl" for="product">Product line</label><select id="product"></select></div>
      <fieldset class="field"><legend>Period</legend>
        <div class="seg "><input type="radio" name="period" id="period-month" value="month"><label for="period-month">Month</label><input type="radio" name="period" id="period-quarter" value="quarter"><label for="period-quarter">Quarter</label><input type="radio" name="period" id="period-ytd" value="ytd" checked><label for="period-ytd">YTD</label></div>
      </fieldset>
      <div class="field"><label class="lbl" for="asat">As at month</label><select id="asat"></select></div>
      <div class="filter-foot">
        <p id="scope">Showing: </p>
        <button class="btn secondary small" type="button" id="reset">Reset filters</button>
      </div>
    </form>

    <h2 class="sr-only">Key figures</h2>
    <div class="kpi-grid" id="kpis"></div>
    <section class="mdef" id="mdef" aria-labelledby="mdef-h" hidden></section>
    <section class="whatif" aria-labelledby="wi-h">
      <div class="wi-l"><h2 id="wi-h">What if the budget were different?</h2><p>Move the budget for this selection up or down and watch the revenue variance follow.</p>
        <label class="lbl" for="wi">Budget change: <b id="wi-v">0%</b></label><input type="range" id="wi" min="-10" max="10" step="1" value="0" aria-describedby="wi-f"></div>
      <div class="wi-r" aria-live="polite"><div class="wi-tile"><span>Revenue against the adjusted budget</span><b id="wi-out"></b><em id="wi-pct"></em></div><p class="wi-f" id="wi-f"></p></div>
    </section>

    <div class="charts">
      <section class="cbox" aria-labelledby="trend-h">
        <div class="cbox-head">
          <div><h2 id="trend-h">Monthly trend</h2><p>Twelve months ending at the chosen month. Columns are actual; the solid line is budget and the dotted line is prior year. Months outside the chosen period are lighter.</p></div>
          <fieldset class="field" style="min-width:0"><legend class="sr-only">Measure</legend>
            <div class="seg mini"><input type="radio" name="measure" id="measure-rev" value="rev" checked><label for="measure-rev">Revenue</label><input type="radio" name="measure" id="measure-gm" value="gm"><label for="measure-gm">Gross margin</label><input type="radio" name="measure" id="measure-ebitda" value="ebitda"><label for="measure-ebitda">EBITDA</label></div>
          </fieldset>
        </div>
        <div class="cwrap" id="trend-wrap">
          <svg class="chart" id="trend" role="img" tabindex="0" aria-labelledby="trend-title" aria-describedby="trend-sum trend-keys">
            <title id="trend-title">Monthly trend</title>
          </svg>
          <div class="tip" id="trend-tip" hidden></div>
        </div>
        <p id="trend-sum" class="sr-only"></p>
        <p id="trend-keys" class="sr-only">Use the left and right arrow keys to move between months, Home and End to jump, Escape to clear.</p>
        <div class="legend" aria-hidden="true"><span><i></i>Actual</span><span><i class="b"></i>Budget</span><span><i class="p"></i>Prior year</span><span>£ thousands or millions as labelled</span></div>
        <p class="readout" id="trend-read" aria-live="off">Hover, tap or use the arrow keys on the chart to read a month.</p>
      </section>

      <section class="cbox" aria-labelledby="bridge-h">
        <div class="cbox-head">
          <div><h2 id="bridge-h">EBITDA variance bridge</h2><p id="bridge-lead"></p></div>
          <fieldset class="field" style="min-width:0"><legend class="sr-only">Bridge from</legend>
            <div class="seg mini"><input type="radio" name="basis" id="basis-b" value="b" checked><label for="basis-b">Budget</label><input type="radio" name="basis" id="basis-p" value="p"><label for="basis-p">Prior year</label></div>
          </fieldset>
        </div>
        <div class="cwrap" id="bridge-wrap">
          <svg class="chart" id="bridge" role="group" aria-labelledby="bridge-title" aria-describedby="bridge-sum">
            <title id="bridge-title">EBITDA variance bridge</title>
          </svg>
          <div class="tip" id="bridge-tip" hidden></div>
        </div>
        <p id="bridge-sum" class="sr-only"></p>
        <div class="legend" aria-hidden="true"><span><i class="k"></i><span id="bridge-leg-base">Budget EBITDA</span></span><span><i class="g"></i>▲ Favourable</span><span><i class="r"></i>▼ Adverse</span><span><i></i>Actual EBITDA</span></div>
        <p class="fine" id="bridge-note" hidden>The value axis does not start at zero, so the movements stay visible. Compare the steps, not the bar heights of the two totals.</p>
      </section>
    </div>

    <section class="table-box" aria-labelledby="table-h">
      <div class="cbox-head">
        <div><h2 id="table-h">Drill-down: region to product line</h2><p>Select a region to open its product lines. Select a column heading to sort; sorting applies within each level.</p></div>
        <div class="table-actions"><button class="btn secondary small" type="button" id="exp-all">Expand all</button><button class="btn secondary small" type="button" id="csv">Export CSV</button></div>
      </div>
      <div class="tscroll" tabindex="0" role="region" aria-label="Drill-down table, scrolls sideways on small screens">
        <table class="dt">
          <caption class="sr-only" id="dt-cap"></caption>
          <thead id="dt-head"></thead>
          <tbody id="dt-body"></tbody>
        </table>
      </div>
      <p class="fine">Variances are against budget or prior year for the chosen period. ▲ and ▼ show direction; green is favourable and red is adverse, and the +/− sign always carries the meaning. Gross margin is revenue less cost of sales; EBITDA is gross margin less operating expenses. All figures are invented.</p>
    </section>`;

  /* What each figure means. Invented, but the shape is the one I use: definition, grain, owner, refresh, caveat. */
  const DEFS = {
    rev: ['Revenue', 'Net sales after returns, with internal transfers left out.', 'Order line, by month, region and product line.', 'Finance (head of reporting role).', 'Through the day; a month closes on working day three.', 'The current month is open, so it can still move until close.'],
    gm: ['Gross margin', 'Revenue less cost of sales.', 'Order line, by month, region and product line.', 'Finance (head of reporting role).', 'Through the day.', 'Cost of sales for an open month is an estimate until close.'],
    opex: ['Operating expenses', 'Operating costs from the ledger, mapped to cost centres.', 'Ledger line by month and cost centre, allocated to region and product line.', 'Finance (management accounts role).', 'Daily.', 'Product-line allocations use a fixed key agreed each year.'],
    ebitda: ['EBITDA', 'Gross margin less operating expenses.', 'Derived from the two measures above.', 'Finance (head of reporting role).', 'Follows its inputs.', 'One-off items are not adjusted out.']
  };

  function mount(root, opts) {
    opts = opts || {};
    root.innerHTML = TEMPLATE;
    /* ======================= 3. STATE ======================= */
    const DEFAULTS = function () {
      return { region: 'all', product: 'all', period: 'ytd', asat: 32, measure: 'rev', basis: 'b',
        sortKey: 'rev', sortDir: -1, expanded: { north: true }, active: -1 };
    };
    let S = DEFAULTS();
    const $ = function (id) { return document.getElementById(id); };
    const NS = 'http://www.w3.org/2000/svg';
    const MEASURES = { rev: 'Revenue', gm: 'Gross margin', ebitda: 'EBITDA' };

    function selRegions() { return S.region === 'all' ? REGIONS.map(function (r) { return r.id; }) : [S.region]; }
    function selProducts() { return S.product === 'all' ? PRODUCTS.map(function (p) { return p.id; }) : [S.product]; }
    function selMonths() {
      const i = S.asat, base = i - (i % 12);
      if (S.period === 'month') return [i];
      if (S.period === 'quarter') { const q = base + Math.floor((i % 12) / 3) * 3; return [q, q + 1, q + 2]; }
      const out = []; for (let m = base; m <= i; m++) out.push(m); return out;
    }
    function periodLabel() {
      const i = S.asat, y = 2022 + Math.floor(i / 12);
      if (S.period === 'month') return monthLabel(i);
      if (S.period === 'quarter') return 'Q' + (Math.floor((i % 12) / 3) + 1) + ' ' + y;
      return 'Jan to ' + MON[i % 12] + ' ' + y + ' (year to date)';
    }
    function regionName() { return S.region === 'all' ? 'All regions' : REGIONS.filter(function (r) { return r.id === S.region; })[0].name; }
    function productName() { return S.product === 'all' ? 'All product lines' : PRODUCTS.filter(function (p) { return p.id === S.product; })[0].name; }

    /* ======================= 4. KPI CARDS ======================= */
    function varLine(v, basis, higherIsGood) {
      return '<div class="var ' + v.cls + '"><span class="num"><i aria-hidden="true">' + v.arrow + '</i>' +
        smoney(v.d) + ' (' + pct(v.p) + ')</span><span>' + words(v, basis, higherIsGood) + '</span></div>';
    }
    const INFO = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="M8 7.2v4M8 4.9v.1" stroke-linecap="round"/></svg>';
    const TRACE = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="3.5" cy="12.5" r="1.8"/><circle cx="12.5" cy="3.5" r="1.8"/><path d="M5 11 11 5"/></svg>';
    function card(title, a, b, p, sub, higherIsGood, key) {
      const tools = '<span class="kt"><button type="button" class="kbtn" data-def="' + key + '" aria-expanded="' + (openDef === key) + '" aria-controls="mdef" aria-label="What ' + title + ' means">' + INFO + '</button>' +
        (opts.trace ? '<button type="button" class="kbtn tr" data-trace="' + key + '" aria-label="Trace: where does this ' + title + ' figure come from?">' + TRACE + '<span>Trace</span></button>' : '') + '</span>';
      return '<div class="kpi"><div class="kh"><h3>' + title + '</h3>' + tools + '</div><div class="val">' + money(a) + '</div><div class="sub">' + sub + '</div>' +
        '<div class="cmp">' + varLine(variance(a, b, higherIsGood), 'budget', higherIsGood) +
        varLine(variance(a, p, higherIsGood), 'prior year', higherIsGood) + '</div></div>';
    }
    function renderKpis(s) {
      const A = s.a;
      $('kpis').innerHTML =
        card('Revenue', A.rev, s.b.rev, s.p.rev, periodLabel(), true, 'rev') +
        card('Gross margin', A.gm, s.b.gm, s.p.gm, ratio(A.gm, A.rev).toFixed(1) + '% of revenue (' + pct(ratio(A.gm, A.rev) - ratio(s.b.gm, s.b.rev), 1).replace('%', '') + ' pts vs budget)', true, 'gm') +
        card('Operating expenses', A.opex, s.b.opex, s.p.opex, ratio(A.opex, A.rev).toFixed(1) + '% of revenue', false, 'opex') +
        card('EBITDA', A.ebitda, s.b.ebitda, s.p.ebitda, ratio(A.ebitda, A.rev).toFixed(1) + '% margin (' + pct(ratio(A.ebitda, A.rev) - ratio(s.b.ebitda, s.b.rev), 1).replace('%', '') + ' pts vs budget)', true, 'ebitda');
      const vr = variance(A.rev, s.b.rev, true), ve = variance(A.ebitda, s.b.ebitda, true);
      $('status').textContent = regionName() + ', ' + productName() + ', ' + periodLabel() + '. Revenue ' + money(A.rev) + ', ' +
        pct(vr.p).slice(1) + ' ' + words(vr, 'budget', true) + '. EBITDA ' + money(A.ebitda) + ', ' + pct(ve.p).slice(1) + ' ' + words(ve, 'budget', true) + '.';
      $('scope').innerHTML = '<strong>' + esc(regionName()) + '</strong> · <strong>' + esc(productName()) + '</strong> · <strong>' + esc(periodLabel()) + '</strong>';
    }

    /* metric definitions: one drawer under the cards, opened by the info button on each card */
    let openDef = null;
    function drawDef() {
      const m = $('mdef');
      if (!openDef) { m.hidden = true; m.innerHTML = ''; return; }
      const d = DEFS[openDef];
      m.hidden = false;
      m.innerHTML = '<div class="mdef-h"><h3 id="mdef-h">' + d[0] + ': what it means</h3><button type="button" class="btn ghost small" id="mdef-x">Close</button></div><dl>' +
        ['Definition', 'Grain', 'Owner', 'Refresh', 'Caveat'].map(function (t, i) { return '<div><dt>' + t + '</dt><dd>' + esc(d[i + 1]) + '</dd></div>'; }).join('') + '</dl><p class="fine">Invented for the demo, in the shape I use for real metric definitions.</p>';
      $('mdef-x').addEventListener('click', function () { const k = openDef; openDef = null; renderKpis(cur); drawDef(); const b = root.querySelector('[data-def="' + k + '"]'); if (b) b.focus(); });
    }
    /* one what-if: change the budget for this selection and recompute the revenue variance, formula shown */
    function drawWhatIf() {
      const p = +$('wi').value, A = cur.a.rev, B = cur.b.rev * (1 + p / 100), d = A - B;
      $('wi-v').textContent = (p > 0 ? '+' : p < 0 ? '−' : '') + Math.abs(p) + '%';
      $('wi-out').textContent = smoney(d); $('wi-out').className = d >= 0 ? 'good' : 'bad';
      $('wi-pct').textContent = pct(ratio(d, B)).replace(/^[+−]/, '') + ' ' + (d >= 0 ? 'above' : 'below') + ' the adjusted budget';
      $('wi-f').innerHTML = '<span>Variance = Actual − Budget × (1 ' + (p < 0 ? '−' : '+') + ' ' + Math.abs(p) + '%)</span><span>= ' + money(A) + ' − ' + money(B) + '</span><span>= <b>' + smoney(d) + '</b></span>';
    }
    /* the drill-down table as CSV: what is on screen, raw figures in £k, invented data */
    function csv() {
      const months = selMonths(), prods = selProducts(), lines = [['Level', 'Region', 'Product line'].concat(COLS.slice(1).map(function (c) { return c.label.replace('£', '(£k)'); }))];
      const row = function (lvl, reg, prod, r) { return [lvl, reg, prod, r.rev, r.vb, r.vbp.toFixed(1), r.vp.toFixed(1), r.gmp.toFixed(1), r.ebitda, r.ebv]; };
      REGIONS.filter(function (r) { return selRegions().indexOf(r.id) >= 0; }).forEach(function (r) {
        lines.push(row('Region', r.name, 'All', stats(r.name, r.id, [r.id], prods, months)));
        if (S.expanded[r.id]) PRODUCTS.filter(function (p) { return prods.indexOf(p.id) >= 0; }).forEach(function (p) { lines.push(row('Product line', r.name, p.name, stats(p.name, p.id, [r.id], [p.id], months))); });
      });
      lines.push(row('Total', 'Selection', 'All', stats('Total', 'tot', selRegions(), prods, months)));
      return lines.map(function (l) { return l.map(function (v) { v = String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n') + '\r\n';
    }
    function download() {
      const blob = new Blob(['﻿' + csv()], { type: 'text/csv;charset=utf-8' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'harbour-and-pine-drilldown-invented.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      $('status').textContent = 'Exported the table as a CSV file. Invented data.';
    }

    /* ======================= 5. TREND CHART ======================= */
    function el(name, attrs, parent) {
      const e = document.createElementNS(NS, name);
      for (const k in attrs) e.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(e);
      return e;
    }
    /* replaceChildren() wipes the <title> that names the chart, so put it back each draw */
    function svgTitle(svg, id, text) { const t = el('title', { id: id }); t.textContent = text; svg.prepend(t); }
    function tipShow(tip, wrapW, x, y, html) {
      tip.innerHTML = html; tip.hidden = false;
      const w = tip.offsetWidth;
      let left = x + 14; if (left + w > wrapW) left = x - w - 14;
      tip.style.left = Math.max(0, left) + 'px'; tip.style.top = Math.max(0, y - 10) + 'px';
    }
    function tickFmt(v, unit) { return unit === 'm' ? String(+(v / 1000).toFixed(1)) : nf.format(v); }

    const trend = { svg: $('trend'), wrap: $('trend-wrap'), tip: $('trend-tip'), rows: [], x: null, slot: 0, W: 0, L: 46, R: 10, T: 24, B: 40, inPeriod: [] };

    function drawTrend() {
      const t = trend, svg = t.svg, W = t.W = Math.max(280, Math.round(t.wrap.clientWidth)), H = W < 520 ? 270 : 320;
      const R = selRegions(), P = selProducts(), per = selMonths();
      const start = Math.min(Math.max(FIRST, S.asat - 11), LAST - 11);
      t.rows = [];
      for (let m = start; m < start + 12; m++) {
        const s = aggregate(R, P, [m]);
        t.rows.push({ m: m, a: s.a[S.measure], b: s.b[S.measure], p: s.p[S.measure], inP: per.indexOf(m) >= 0 });
      }
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('height', H);
      svg.replaceChildren();
      const max = Math.max.apply(null, t.rows.map(function (r) { return Math.max(r.a, r.b, r.p); }));
      const step = niceStep(max / 4), top = Math.ceil(max * 1.04 / step) * step, unit = top >= 2000 ? 'm' : 'k';
      const L = t.L, Rr = t.R, T = t.T, B = t.B, slot = t.slot = (W - L - Rr) / 12;
      const x = t.x = function (i) { return L + slot * i + slot / 2; };
      const y = function (v) { return T + (H - T - B) * (1 - v / top); };
      const bw = Math.min(slot * 0.58, 38);

      el('text', { x: 0, y: 10 }, svg).textContent = '£' + unit;
      for (let v = 0; v <= top + 1e-9; v += step) {
        el('line', { x1: L, x2: W - Rr, y1: y(v), y2: y(v), 'class': v === 0 ? 'axis' : 'grid' }, svg);
        el('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end' }, svg).textContent = tickFmt(v, unit);
      }
      t.sel = el('rect', { x: 0, y: T, width: slot, height: H - T - B, 'class': 'sel', visibility: 'hidden' }, svg);
      t.rows.forEach(function (r, i) {
        const b = el('rect', { x: x(i) - bw / 2, y: y(r.a), width: bw, height: Math.max(0, y(0) - y(r.a)), rx: 3, 'class': 'bar' + (r.inP ? '' : ' dim') }, svg);
        b.setAttribute('data-i', i);
        const lab = el('text', { x: x(i), y: H - B + 16, 'text-anchor': 'middle' }, svg);
        lab.textContent = slot < 34 ? MON[r.m % 12][0] : MON[r.m % 12];
        if (i === 0 || r.m % 12 === 0) el('text', { x: x(i), y: H - B + 30, 'text-anchor': 'middle' }, svg).textContent = String(2022 + Math.floor(r.m / 12));
      });
      /* prior year (dotted) and budget (solid) lines on top of the columns */
      el('path', { 'class': 'pyl', d: t.rows.map(function (r, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(r.p); }).join('') }, svg);
      el('path', { 'class': 'budl', d: t.rows.map(function (r, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(r.b); }).join('') }, svg);
      t.rows.forEach(function (r, i) { el('circle', { cx: x(i), cy: y(r.b), r: 3.5, 'class': 'budp' }, svg); });
      t.y = y; t.top = top;
      /* text alternative */
      const tot = t.rows.reduce(function (s, r) { return { a: s.a + r.a, b: s.b + r.b, p: s.p + r.p }; }, { a: 0, b: 0, p: 0 });
      const vb = variance(tot.a, tot.b, true);
      const hi = t.rows.reduce(function (h, r) { return r.a > h.a ? r : h; }, t.rows[0]);
      const lo = t.rows.reduce(function (h, r) { return r.a < h.a ? r : h; }, t.rows[0]);
      $('trend-sum').textContent = MEASURES[S.measure] + ' by month, ' + monthLabel(t.rows[0].m) + ' to ' + monthLabel(t.rows[11].m) + ', ' + regionName() + ', ' + productName() +
        '. Twelve-month actual ' + money(tot.a) + ' against budget ' + money(tot.b) + ' (' + pct(vb.p).slice(1) + ' ' + words(vb, 'budget', true) + ') and prior year ' + money(tot.p) +
        '. Highest month ' + monthLabel(hi.m) + ' at ' + money(hi.a) + ', lowest ' + monthLabel(lo.m) + ' at ' + money(lo.a) + '. Use the left and right arrow keys to read each month.';
      svgTitle(svg, 'trend-title', MEASURES[S.measure] + ' by month: actual, budget and prior year');
      if (t.rows[S.active]) trendActive(S.active, false); else trendClear();
    }
    function trendActive(i, announce) {
      const t = trend, r = t.rows[i]; if (!r) return;
      S.active = i;
      t.sel.setAttribute('x', t.x(i) - t.slot / 2); t.sel.setAttribute('visibility', 'visible');
      const vb = variance(r.a, r.b, true), vp = variance(r.a, r.p, true);
      const html = '<b>' + monthLabel(r.m) + '</b><span><em>Actual</em>' + money(r.a) + '</span><span><em>Budget</em>' + money(r.b) + '</span><span><em>Prior year</em>' + money(r.p) + '</span>';
      tipShow(t.tip, t.W, t.x(i), t.y(Math.max(r.a, r.b)), html.replace(/<em>/g, '<em style="font-style:normal;opacity:.75">'));
      $('trend-read').setAttribute('aria-live', announce === 'key' ? 'polite' : 'off'); /* announce keyboard moves only, never hover */
      if (announce !== false) {
        $('trend-read').textContent = monthLabel(r.m) + ': actual ' + money(r.a) + ', budget ' + money(r.b) + ' (' + pct(vb.p).slice(1) + ' ' + words(vb, 'budget', true) + '), prior year ' + money(r.p) + ' (' + pct(vp.p).slice(1) + ' ' + words(vp, 'prior year', true) + ').';
      }
    }
    function trendClear() { S.active = -1; trend.sel.setAttribute('visibility', 'hidden'); trend.tip.hidden = true; }
    function trendIndexAt(e) {
      const r = trend.svg.getBoundingClientRect();
      return Math.max(0, Math.min(11, Math.floor(((e.clientX - r.left) / r.width * trend.W - trend.L) / trend.slot)));
    }

    /* ======================= 6. VARIANCE BRIDGE (waterfall) ======================= */
    const bridge = { svg: $('bridge'), wrap: $('bridge-wrap'), tip: $('bridge-tip'), W: 0 };

    function wrapLabel(text, max) {
      const words_ = text.split(' '), lines = []; let cur = '';
      words_.forEach(function (w) { if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); });
      lines.push(cur); return lines;
    }

    function drawBridge() {
      const svg = bridge.svg, W = bridge.W = Math.max(280, Math.round(bridge.wrap.clientWidth)), H = W < 520 ? 300 : 340;
      const s = aggregate(selRegions(), selProducts(), selMonths()), baseKey = S.basis, base = s[baseKey], A = s.a;
      const baseName = baseKey === 'b' ? 'Budget' : 'Prior year';
      const items = [
        { name: baseName + ' EBITDA', kind: 'base', v: base.ebitda },
        { name: 'Revenue', kind: 'delta', v: A.rev - base.rev },
        { name: 'Cost of sales', kind: 'delta', v: -(A.cogs - base.cogs) },
        { name: 'Operating expenses', kind: 'delta', v: -(A.opex - base.opex) },
        { name: 'Actual EBITDA', kind: 'total', v: A.ebitda }
      ];
      /* running levels */
      let run = base.ebitda; const levels = [{ from: 0, to: base.ebitda }];
      items.slice(1, 4).forEach(function (it) { levels.push({ from: run, to: run + it.v }); run += it.v; });
      levels.push({ from: 0, to: A.ebitda });
      const all = []; levels.forEach(function (l) { all.push(l.from, l.to); });
      const hi = Math.max.apply(null, all), loRun = Math.min(base.ebitda, run, levels[1].to, levels[2].to, levels[3].to);
      const span = hi - loRun;
      let lo = Math.min(0, Math.min.apply(null, all)), cut = false;
      if (loRun > 0 && span < 0.4 * hi) { lo = loRun - span * 0.9; cut = true; } /* zoom so small movements stay visible */
      const step = niceStep((hi - lo) / 4);
      lo = cut ? Math.floor(lo / step) * step : (lo < 0 ? Math.floor(lo / step) * step : 0);
      const top = Math.ceil(hi * 1.06 / step) * step, unit = top >= 2000 ? 'm' : 'k';
      const L = 46, R = 10, T = 28, B = W < 520 ? 62 : 50, slot = (W - L - R) / 5, bw = Math.min(slot * 0.6, 64);
      const x = function (i) { return L + slot * i + slot / 2; };
      const y = function (v) { return T + (H - T - B) * (1 - (v - lo) / (top - lo)); };
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('height', H);
      svg.replaceChildren();
      svgTitle(svg, 'bridge-title', 'EBITDA variance bridge');
      el('text', { x: 0, y: 12 }, svg).textContent = '£' + unit;
      for (let v = lo; v <= top + 1e-9; v += step) {
        el('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), 'class': v === 0 ? 'axis' : 'grid' }, svg);
        el('text', { x: L - 8, y: y(v) + 4, 'text-anchor': 'end' }, svg).textContent = tickFmt(v, unit);
      }
      const parts = [];
      items.forEach(function (it, i) {
        const l = levels[i], yTop = y(Math.max(l.from, l.to)), yBot = y(Math.max(lo, Math.min(l.from, l.to))), h = Math.max(2, yBot - yTop);
        const fav = it.v >= 0, cls = it.kind === 'base' ? 'wf-base' : it.kind === 'total' ? 'wf-tot' : (fav ? 'wf-pos' : 'wf-neg');
        const g = el('g', { 'class': 'wf', tabindex: 0, role: 'img' }, svg);
        let valTxt, desc;
        if (it.kind === 'delta') {
          valTxt = (fav ? '▲ ' : '▼ ') + smoney(it.v);
          desc = it.name + ': ' + smoney(it.v) + ', ' + (fav ? 'favourable' : 'adverse') + ' to EBITDA against ' + baseName.toLowerCase() + '. EBITDA after this step ' + money(l.to) + '.';
        } else {
          valTxt = money(it.v); desc = it.name + ': ' + money(it.v) + '.';
        }
        parts.push(desc);
        g.setAttribute('aria-label', desc);
        el('rect', { x: x(i) - bw / 2, y: yTop, width: bw, height: h, rx: 3, 'class': cls }, g);
        el('rect', { x: x(i) - bw / 2 - 3, y: yTop - 3, width: bw + 6, height: h + 6, rx: 5, 'class': 'focusring' }, g);
        el('text', { x: x(i), y: yTop - 7, 'text-anchor': 'middle', 'class': 'val' }, g).textContent = valTxt;
        const lines = wrapLabel(it.name, Math.max(7, Math.floor(slot / 6.4)));
        lines.forEach(function (ln, k) { el('text', { x: x(i), y: H - B + 18 + k * 13, 'text-anchor': 'middle', 'class': 'cat' }, svg).textContent = ln; });
        if (i < items.length - 1) {
          const lvl = it.kind === 'delta' ? l.to : (i === 0 ? l.to : l.to);
          el('line', { x1: x(i) + bw / 2, x2: x(i + 1) - bw / 2, y1: y(lvl), y2: y(lvl), 'class': 'conn' }, svg);
        }
        const tipHtml = '<b>' + esc(it.name) + '</b>' + (it.kind === 'delta'
          ? '<span><em>Effect on EBITDA</em>' + smoney(it.v) + '</span><span><em>Result</em>' + (fav ? 'Favourable' : 'Adverse') + '</span><span><em>EBITDA after</em>' + money(l.to) + '</span>'
          : '<span><em>EBITDA</em>' + money(it.v) + '</span>');
        const show = function () { tipShow(bridge.tip, W, x(i), yTop, tipHtml.replace(/<em>/g, '<em style="font-style:normal;opacity:.75">')); };
        g.addEventListener('mouseenter', show); g.addEventListener('focus', show);
        g.addEventListener('mouseleave', function () { bridge.tip.hidden = true; }); g.addEventListener('blur', function () { bridge.tip.hidden = true; });
        g.addEventListener('click', show);
      });
      $('bridge-note').hidden = !cut;
      $('bridge-sum').textContent = 'EBITDA bridge from ' + baseName.toLowerCase() + ' to actual, ' + regionName() + ', ' + productName() + ', ' + periodLabel() + '. ' + parts.join(' ') + (cut ? ' The value axis does not start at zero.' : '');
      $('bridge-lead').textContent = 'From ' + baseName.toLowerCase() + ' EBITDA of ' + money(base.ebitda) + ' to actual ' + money(A.ebitda) + ': ' + smoney(A.ebitda - base.ebitda) + ' overall.';
      $('bridge-leg-base').textContent = baseName + ' EBITDA';
    }

    /* ======================= 7. DRILL-DOWN TABLE ======================= */
    const COLS = [
      { key: 'name', label: 'Region / product line' }, { key: 'rev', label: 'Revenue' },
      { key: 'vb', label: 'vs budget £' }, { key: 'vbp', label: 'vs budget %' }, { key: 'vp', label: 'vs prior year %' },
      { key: 'gmp', label: 'Gross margin %' }, { key: 'ebitda', label: 'EBITDA' }, { key: 'ebv', label: 'EBITDA vs budget £' }
    ];
    function stats(name, id, regionIds, productIds, months) {
      const s = aggregate(regionIds, productIds, months);
      return { name: name, id: id, rev: s.a.rev, vb: s.a.rev - s.b.rev, vbp: ratio(s.a.rev - s.b.rev, s.b.rev), vp: ratio(s.a.rev - s.p.rev, s.p.rev),
        gmp: ratio(s.a.gm, s.a.rev), ebitda: s.a.ebitda, ebv: s.a.ebitda - s.b.ebitda };
    }
    function sorter() {
      const k = S.sortKey, d = S.sortDir;
      return function (a, b) { return k === 'name' ? d * a.name.localeCompare(b.name) : d * (a[k] - b[k]); };
    }
    function pv(value, text) {
      const flat = Math.abs(value) < 1e-9, cls = flat ? 'flat' : value > 0 ? 'good' : 'bad';
      return '<span class="pv ' + cls + '"><i aria-hidden="true">' + (flat ? '▬' : value > 0 ? '▲' : '▼') + '</i>' + text + '</span>';
    }
    function cells(r) {
      return '<td>' + money(r.rev) + '</td><td>' + pv(r.vb, smoney(r.vb)) + '</td><td>' + pv(r.vbp, pct(r.vbp)) + '</td><td>' + pv(r.vp, pct(r.vp)) +
        '</td><td>' + r.gmp.toFixed(1) + '%</td><td>' + money(r.ebitda) + '</td><td>' + pv(r.ebv, smoney(r.ebv)) + '</td>';
    }
    let focusKey = null;
    function drawTable() {
      const months = selMonths(), regs = REGIONS.filter(function (r) { return selRegions().indexOf(r.id) >= 0; }), prods = selProducts();
      const rows = regs.map(function (r) { return stats(r.name, r.id, [r.id], prods, months); }).sort(sorter());
      let html = '';
      rows.forEach(function (r) {
        const open = !!S.expanded[r.id];
        html += '<tr class="reg"><td><button type="button" class="exp" data-reg="' + r.id + '" data-f="reg-' + r.id + '" aria-expanded="' + open + '"><span class="chev" aria-hidden="true">▶</span>' + esc(r.name) + '</button></td>' + cells(r) + '</tr>';
        if (open) {
          PRODUCTS.filter(function (p) { return prods.indexOf(p.id) >= 0; })
            .map(function (p) { return stats(p.name, p.id, [r.id], [p.id], months); }).sort(sorter())
            .forEach(function (c) { html += '<tr class="prod"><td>' + esc(c.name) + '</td>' + cells(c) + '</tr>'; });
        }
      });
      const tot = stats('Total', 'tot', regs.map(function (r) { return r.id; }), prods, months);
      html += '<tr class="tot"><td>Total (selection)</td>' + cells(tot) + '</tr>';
      $('dt-body').innerHTML = html;
      $('dt-head').innerHTML = '<tr>' + COLS.map(function (c) {
        const on = S.sortKey === c.key, sort = on ? (S.sortDir > 0 ? 'ascending' : 'descending') : 'none';
        return '<th scope="col" aria-sort="' + sort + '"><button type="button" data-sort="' + c.key + '" data-f="sort-' + c.key + '">' + c.label +
          '<span class="arr" aria-hidden="true">' + (on ? (S.sortDir > 0 ? '▲' : '▼') : '↕') + '</span></button></th>';
      }).join('') + '</tr>';
      const col = COLS.filter(function (c) { return c.key === S.sortKey; })[0].label;
      $('dt-cap').textContent = 'Revenue, margin and EBITDA by region and product line, ' + periodLabel() + ', sorted by ' + col + ' ' + (S.sortDir > 0 ? 'ascending' : 'descending') + '. Sorting applies within each level.';
      const allOpen = rows.every(function (r) { return S.expanded[r.id]; });
      $('exp-all').textContent = allOpen ? 'Collapse all' : 'Expand all';
      if (focusKey) { const f = document.querySelector('[data-f="' + focusKey + '"]'); if (f) f.focus(); focusKey = null; }
    }

    /* ======================= 8. WIRING ======================= */
    let cur = null;
    function renderAll() {
      cur = aggregate(selRegions(), selProducts(), selMonths());
      renderKpis(cur); drawDef(); drawWhatIf();
      drawTrend(); drawBridge(); drawTable();
      if (opts.change) opts.change();
    }
    function scope() {
      const label = regionName() + ', ' + productName().replace('All product lines', 'all product lines') + ', ' + periodLabel();
      return { regions: selRegions(), products: selProducts(), months: selMonths(), label: label,
        who: S.region === 'all' ? 'C-suite role: every region' : regionName() + ' leader’s role: ' + regionName() + ' rows only' };
    }
    function readControls() {
      const val = function (name) { const c = document.querySelector('input[name="' + name + '"]:checked'); return c ? c.value : null; };
      S.region = val('region'); S.product = $('product').value; S.period = val('period');
      S.asat = +$('asat').value; S.measure = val('measure'); S.basis = val('basis');
    }
    function setControls() {
      ['region', 'period', 'measure', 'basis'].forEach(function (n) {
        const c = document.querySelector('input[name="' + n + '"][value="' + S[n] + '"]'); if (c) c.checked = true;
      });
      $('product').value = S.product; $('asat').value = S.asat;
    }
    let ro = null;
    function init() {
      if (!$('trend')) return;
      $('product').innerHTML = '<option value="all">All product lines</option>' + PRODUCTS.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join('');
      let o = ''; for (let m = LAST; m >= FIRST; m--) o += '<option value="' + m + '">' + monthLabel(m) + '</option>';
      $('asat').innerHTML = o;
      setControls();

      root.addEventListener('change', function (e) { if (!e.target.matches('input, select') || e.target.id === 'wi') return; S.active = -1; readControls(); renderAll(); });
      $('wi').addEventListener('input', drawWhatIf);
      $('csv').addEventListener('click', download);
      $('kpis').addEventListener('click', function (e) {
        const d = e.target.closest('[data-def]'), t = e.target.closest('[data-trace]');
        if (d) { const k = d.getAttribute('data-def'); openDef = openDef === k ? null : k; renderKpis(cur); drawDef(); const b = root.querySelector('[data-def="' + k + '"]'); if (b) b.focus(); }
        else if (t && opts.trace) opts.trace(t.getAttribute('data-trace'), t);
      }); /* radios for measure and basis sit outside the filter form, so listen on the root */
      $('reset').addEventListener('click', function () { S = DEFAULTS(); setControls(); renderAll(); });

      /* trend interaction: pointer + keyboard (arrow keys, Home, End, Escape) */
      const tsvg = trend.svg;
      ['pointermove', 'pointerdown'].forEach(function (ev) { tsvg.addEventListener(ev, function (e) { trendActive(trendIndexAt(e), 'pointer'); }); });
      tsvg.addEventListener('pointerleave', function () { if (document.activeElement !== tsvg) trendClear(); });
      tsvg.addEventListener('keydown', function (e) {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (e.key === 'Escape') { trendClear(); return; }
        if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); trendActive(e.key === 'Home' ? 0 : 11, 'key'); return; }
        if (!step) return;
        e.preventDefault();
        trendActive(Math.max(0, Math.min(11, (S.active < 0 ? (step > 0 ? -1 : 12) : S.active) + step)), 'key');
      });
      tsvg.addEventListener('focus', function () { if (S.active < 0) trendActive(11, 'key'); });
      tsvg.addEventListener('blur', trendClear);

      /* table: sort and expand */
      $('dt-head').addEventListener('click', function (e) {
        const b = e.target.closest('button[data-sort]'); if (!b) return;
        const k = b.getAttribute('data-sort');
        if (S.sortKey === k) S.sortDir = -S.sortDir; else { S.sortKey = k; S.sortDir = k === 'name' ? 1 : -1; }
        focusKey = 'sort-' + k; drawTable();
      });
      $('dt-body').addEventListener('click', function (e) {
        const b = e.target.closest('button[data-reg]'); if (!b) return;
        const id = b.getAttribute('data-reg'); S.expanded[id] = !S.expanded[id];
        focusKey = 'reg-' + id; drawTable();
      });
      $('exp-all').addEventListener('click', function () {
        const regs = selRegions(), allOpen = regs.every(function (r) { return S.expanded[r]; });
        regs.forEach(function (r) { S.expanded[r] = !allOpen; });
        focusKey = null; drawTable(); $('exp-all').focus();
      });

      /* redraw charts to the new width */
      let lastW = [0, 0], raf = 0;
      ro = new ResizeObserver(function () {
        const w = [trend.wrap.clientWidth, bridge.wrap.clientWidth];
        if (Math.abs(w[0] - lastW[0]) < 1 && Math.abs(w[1] - lastW[1]) < 1) return;
        lastW = w; cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () { drawTrend(); drawBridge(); });
      });
      ro.observe(trend.wrap); ro.observe(bridge.wrap);
      renderAll();
      lastW = [trend.wrap.clientWidth, bridge.wrap.clientWidth];
    }

    init();
    return { destroy: function () { if (ro) ro.disconnect(); root.innerHTML = ''; }, scope: scope, csv: csv };
  }

  window.HPDemo = { mount: mount };
  const auto = document.getElementById('demo-root');
  if (auto) mount(auto);
})();
