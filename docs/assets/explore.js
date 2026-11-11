/* Platform explorer. The boxes are real buttons written by the generator; this file draws the connectors,
   highlights paths, runs "Follow the data", fills the inspector and opens each "Try it" in the stage below the map.
   Sections: 1 setup and graph, 2 connectors, 3 highlight, 4 inspector and selection, 5 stage, 6 stage pieces,
   7 follow the data, 8 wiring. Everything shown here is invented. */
(function () {
  'use strict';
  const X = window.EXPLORE, HP = window.HP;
  const $ = function (id) { return document.getElementById(id); };
  const map = $('xmap');
  if (!map || !X) return;

  /* ======================= 1. SETUP AND GRAPH ======================= */
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const svg = $('xedges'), cols = map.querySelector('.xcols'), insp = $('xpanel'), inspHome = insp.parentNode;
  const nodeBtn = function (id) { return map.querySelector('.xnode[data-id="' + id + '"]'); };
  const allNodes = function () { return [].slice.call(map.querySelectorAll('.xnode')); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function smooth() { return reduce.matches ? 'auto' : 'smooth'; }
  const LAYER = {};
  X.LAYERS.forEach(function (L, k) { L.nodes.forEach(function (n) { LAYER[n] = { title: L.title, n: '0' + (k + 1) }; }); });
  X.LANE.nodes.forEach(function (n) { LAYER[n] = { title: X.LANE.title, n: '+' }; });
  const OUT = {}, IN = {};
  X.EDGES.forEach(function (e) { (OUT[e[0]] = OUT[e[0]] || []).push(e[1]); (IN[e[1]] = IN[e[1]] || []).push(e[0]); });
  const key = function (a, b) { return a + '>' + b; };

  const sideMode = window.matchMedia('(min-width: 1360px)');
  let selected = null, collapsed = false, following = false;
  let followTimers = [], stageTimers = [], dotRaf = 0;
  let stageKind = null, stageOpener = null, demo = null;
  /* busy buttons keep focus (a disabled button drops it to the page), so use aria-disabled */
  function busy(btn, on) { btn.setAttribute('aria-disabled', String(on)); btn.classList.toggle('is-busy', on); }
  function isBusy(btn) { return btn.getAttribute('aria-disabled') === 'true'; }
  function later(list, fn, ms) { const t = setTimeout(fn, ms); list.push(t); return t; }
  function clear(list) { list.forEach(function (t) { clearTimeout(t); clearInterval(t); }); list.length = 0; }

  /* ======================= 2. CONNECTORS ======================= */
  let EDGE = {}, dot = null;
  function mode() { return (getComputedStyle(cols).getPropertyValue('--mode') || 'flow').trim(); }
  function box(el) {
    const r = el.getBoundingClientRect(), m = map.getBoundingClientRect();
    const l = r.left - m.left, t = r.top - m.top;
    return { l: l, t: t, r: l + r.width, b: t + r.height, cx: l + r.width / 2, cy: t + r.height / 2 };
  }
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const f = function (n) { return Math.round(n * 10) / 10; };
  /* One edge's geometry. Flow mode: curves between columns, short drops within a column.
     Rail mode (narrow): every box sits in one column, so edges become arcs in the left gutter. */
  function geometry(a, b, rail) {
    if (rail) {
      const x1 = a.l, x2 = b.l, y1 = a.cy, y2 = b.cy, bend = Math.min(30, 8 + Math.abs(y2 - y1) * 0.09);
      return { d: 'M' + f(x1) + ' ' + f(y1) + 'C' + f(x1 - bend) + ' ' + f(y1) + ' ' + f(x2 - bend) + ' ' + f(y2) + ' ' + f(x2) + ' ' + f(y2), p: [[x1, y1], [x2, y2]] };
    }
    if (b.l >= a.r - 1 || b.r <= a.l + 1) {
      const fwd = b.l >= a.r - 1, x1 = fwd ? a.r : a.l, x2 = fwd ? b.l : b.r, y1 = a.cy, y2 = b.cy, dx = (x2 - x1) / 2;
      return { d: 'M' + f(x1) + ' ' + f(y1) + 'C' + f(x1 + dx) + ' ' + f(y1) + ' ' + f(x2 - dx) + ' ' + f(y2) + ' ' + f(x2) + ' ' + f(y2), p: [[x1, y1], [x2, y2]] };
    }
    const down = b.t >= a.b - 1, y1 = down ? a.b : a.t, y2 = down ? b.t : b.b, x = (a.cx + b.cx) / 2;
    return { d: 'M' + f(x) + ' ' + f(y1) + 'V' + f(y2), p: [[x, y1], [x, y2]] };
  }
  function drawEdges() {
    const rail = mode() === 'rail';
    svg.setAttribute('width', map.offsetWidth); svg.setAttribute('height', map.offsetHeight);
    svg.replaceChildren(); EDGE = {};
    const gG = el('g', {}, svg), gE = el('g', {}, svg), gF = el('g', {}, svg), gP = el('g', {}, svg), ports = {};
    X.EDGES.forEach(function (e) {
      const A = nodeBtn(e[0]), B = nodeBtn(e[1]); if (!A || !B) return;
      const g = geometry(box(A), box(B), rail), k = key(e[0], e[1]);
      const rec = { g: el('path', { d: g.d, 'class': 'g' }, gG), e: el('path', { d: g.d, 'class': 'e' + (e[2] ? ' dash' : '') }, gE), fl: el('path', { d: g.d, 'class': 'fl' }, gF), ports: [] };
      g.p.forEach(function (pt) {
        const pk = Math.round(pt[0]) + ',' + Math.round(pt[1]);
        if (!ports[pk]) ports[pk] = el('circle', { cx: f(pt[0]), cy: f(pt[1]), r: 2.6, 'class': 'port' }, gP);
        rec.ports.push(ports[pk]);
      });
      EDGE[k] = rec;
    });
    dot = el('g', { 'class': 'xdot' }, svg);
    el('circle', { r: 11, 'class': 'halo' }, dot); el('circle', { r: 5, 'class': 'core' }, dot);
    paint(following ? null : selected, false);
    if (following) repaintFollow();
  }
  /* A steady frame: with the inspector at the side, the map is given the height of the tallest inspector,
     measured once per width, so selecting a box never makes the card jump and no dead canvas opens up. */
  let frameW = -1;
  function sizeFrame() {
    const w = map.offsetWidth;
    if (w === frameW) return;
    frameW = w;
    if (!sideMode.matches || !selected) { map.style.minHeight = ''; return; }
    map.style.minHeight = ''; insp.style.alignSelf = 'start';
    let max = 0;
    Object.keys(X.NODES).forEach(function (id) { renderInspector(id, true); max = Math.max(max, insp.offsetHeight); });
    insp.style.alignSelf = ''; renderInspector(selected);
    map.style.minHeight = max + 'px';
  }
  let raf = 0;
  function redraw() { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { placeInspector(); sizeFrame(); drawEdges(); }); }

  /* ======================= 3. HIGHLIGHT ======================= */
  function reach(id, G) {
    const seen = {}, stack = [id];
    while (stack.length) { const c = stack.pop(); (G[c] || []).forEach(function (n) { if (!seen[n]) { seen[n] = 1; stack.push(n); } }); }
    return seen;
  }
  /* Everything upstream and downstream of a box, and only the edges on those paths. */
  function pathOf(id) {
    const up = reach(id, IN), down = reach(id, OUT), nodes = {}, edges = {};
    up[id] = down[id] = 1;
    Object.keys(up).concat(Object.keys(down)).forEach(function (n) { nodes[n] = 1; });
    X.EDGES.forEach(function (e) {
      if ((up[e[0]] && up[e[1]]) || (down[e[0]] && down[e[1]])) edges[key(e[0], e[1])] = 1;
    });
    return { nodes: nodes, edges: edges };
  }
  function setHot(nodes, edges) {
    allNodes().forEach(function (b) { b.classList.toggle('hot', !!nodes[b.getAttribute('data-id')]); });
    Object.keys(EDGE).forEach(function (k) {
      const on = !!edges[k], r = EDGE[k];
      r.e.classList.toggle('hot', on); r.g.classList.toggle('hot', on); r.fl.classList.toggle('hot', on);
      r.ports.forEach(function (p) { p.classList.remove('hot'); });
    });
    Object.keys(edges).forEach(function (k) { if (EDGE[k]) EDGE[k].ports.forEach(function (p) { p.classList.add('hot'); }); });
  }
  function paint(id, preview) {
    if (following) return;
    map.classList.toggle('preview', !!preview && id !== selected);
    if (!id) { setHot({}, {}); return; }
    const p = pathOf(id); setHot(p.nodes, p.edges);
  }

  /* ======================= 4. INSPECTOR AND SELECTION ======================= */
  const TRY = {
    exec: 'Open the live demo', auto: 'Run a simulated approval', qa: 'Ask the desk a question',
    apps: 'Open the mock order list', control: 'Open the mock control room'
  };
  const PLAY = '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1.5v7l6-3.5z" fill="currentColor"/></svg>';
  function iconOf(id) { const s = nodeBtn(id).querySelector('.xi svg'); return s ? s.cloneNode(true) : document.createTextNode(''); }
  function renderInspector(id, measuring) {
    const n = X.NODES[id], L = LAYER[id];
    $('xp-layer').innerHTML = '<span class="n">' + L.n + '</span>' + esc(L.title);
    $('xp-ico').replaceChildren(iconOf(id));
    $('xp-title').textContent = n.label;
    $('xp-body').innerHTML = '<dl><div><dt>What it is</dt><dd>' + esc(n.what) + '</dd></div><div><dt>What it changed</dt><dd>' + esc(n.changed) + '</dd></div><div><dt>My role</dt><dd>' + esc(n.role) + '</dd></div></dl>';
    if (!measuring) placeFlow(true);
    let cta = '';
    if (n.kind) cta += '<button type="button" class="btn primary small" id="xp-try" aria-controls="xstage" aria-expanded="' + (stageKind === n.kind) + '">' + PLAY + '<span>' + TRY[n.kind] + '</span></button>';
    if (n.kind === 'exec') cta += '<a class="link" href="demo.html">Open the full page</a>';
    if (n.link) cta += '<a class="link" href="' + n.link[0] + '">' + esc(n.link[1]) + '</a>';
    $('xp-extra').innerHTML = cta ? '<div class="xinsp-cta">' + cta + '</div>' : '';
    const t = $('xp-try'); if (t && !measuring) t.addEventListener('click', function () { openStage(n.kind, t); });
  }
  /* "How it works": with the inspector at the side it runs full width along the bottom of the map card;
     otherwise it sits inside the inspector (a compact chain when the inspector opens inline on narrow screens). */
  let flowWhere = '';
  function placeFlow(force) {
    const flow = selected && window.FLOWS && window.FLOWS[selected], band = $('xp-flowband');
    const where = !flow ? 'none' : sideMode.matches ? 'band' : (mode() === 'rail' ? 'inline' : 'insp');
    if (!force && where === flowWhere) return;
    flowWhere = where;
    const old = $('xp-body').querySelector('.xflow'); if (old) old.remove();
    band.replaceChildren(); band.hidden = where !== 'band';
    if (where === 'none') return;
    const html = '<div class="xflow"><h3>How it works: ' + esc(X.NODES[selected].label) + '</h3>' + (where === 'inline' ? flow.replace('class="flowd"', 'class="flowd compact"') : flow) + '</div>';
    (where === 'band' ? band : $('xp-body')).insertAdjacentHTML('beforeend', html);
    const fd = (where === 'band' ? band : $('xp-body')).querySelector('.flowd');
    requestAnimationFrame(function () { requestAnimationFrame(function () { fd.classList.add('in'); }); });
  }
  function placeInspector() {
    const rail = mode() === 'rail';
    insp.hidden = rail && (collapsed || !selected);
    placeFlow(false);
    if (rail && selected) {
      const li = nodeBtn(selected).parentNode;
      if (insp.parentNode !== li) li.appendChild(insp);
      insp.classList.add('inline');
    } else {
      if (insp.parentNode !== inspHome) inspHome.appendChild(insp);
      insp.classList.remove('inline');
    }
    allNodes().forEach(function (b) { b.setAttribute('aria-expanded', String(rail && b.getAttribute('data-id') === selected && !collapsed)); });
  }
  function select(id, user) {
    const n = X.NODES[id]; if (!n) return;
    if (following) stopFollow(true);
    if (user && id === selected && mode() === 'rail') { collapsed = !collapsed; placeInspector(); redraw(); return; }
    selected = id; collapsed = false;
    allNodes().forEach(function (b) {
      const on = b.getAttribute('data-id') === id;
      b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on));
    });
    renderInspector(id); placeInspector(); paint(id, false); redraw();
    $('xstatus').textContent = 'Showing details for ' + n.label + '.';
  }

  /* ======================= 5. STAGE ======================= */
  const STAGES = {
    exec: { eb: 'Live demo · invented data', t: 'Executive reporting', node: 'exec' },
    auto: { eb: 'Simulation · invented request', t: 'Automations: an approval run', node: 'auto' },
    qa: { eb: 'Simulation · invented data', t: 'Data Q&A desk', node: 'qa' },
    apps: { eb: 'Mock app · invented orders', t: 'Business apps: the order list', node: 'apps' },
    control: { eb: 'Mock dashboard · invented projects', t: 'Agent control room', node: 'control' }
  };
  function openStage(kind, opener, noScroll) {
    const S = STAGES[kind], st = $('xstage'), body = $('xstage-body');
    clear(stageTimers); if (demo) { demo.destroy(); demo = null; }
    stageKind = kind; stageOpener = opener || null;
    $('xstage-eb').textContent = S.eb; $('xstage-t').textContent = S.t;
    $('xstage-ico').replaceChildren(iconOf(S.node));
    body.replaceChildren(); PIECE[kind](body);
    st.hidden = false; st.classList.remove('enter'); void st.offsetWidth; st.classList.add('enter');
    const t = $('xp-try'); if (t) t.setAttribute('aria-expanded', String(X.NODES[selected].kind === kind));
    if (!noScroll) st.scrollIntoView({ behavior: smooth(), block: 'start' });
    $('xstage-t').focus({ preventScroll: true });
  }
  function closeStage() {
    if (!stageKind) return;
    clear(stageTimers); if (demo) { demo.destroy(); demo = null; }
    $('xstage').hidden = true; $('xstage-body').replaceChildren(); stageKind = null;
    const t = $('xp-try'); if (t) t.setAttribute('aria-expanded', 'false');
    const o = stageOpener && document.contains(stageOpener) && stageOpener.offsetParent !== null ? stageOpener : nodeBtn(selected);
    stageOpener = null;
    if (o) { o.focus({ preventScroll: true }); o.scrollIntoView({ behavior: smooth(), block: 'center' }); }
  }
  $('xstage-close').addEventListener('click', closeStage);
  $('xstage').addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (e.target.closest && e.target.closest('.chart')) return; /* the demo's chart uses Escape to clear its reading */
    e.preventDefault(); closeStage();
  });

  /* ======================= 6. STAGE PIECES ======================= */
  const PIECE = {};
  const ICON = function (p, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; };
  const OK = ICON('<path d="m5 12.5 4.5 4.5L19 7.5"/>'), BAD = ICON('<path d="M7 7l10 10M17 7 7 17"/>');

  /* Executive reporting: the real demo, mounted in the stage */
  PIECE.exec = function (body) {
    body.innerHTML = '<p class="banner" role="note"><span class="flag">Invented data</span><span>Invented data for a fictional company. Built to show how I design executive reporting. <a class="link" href="demo.html">Open the full page</a></span></p><div id="xdemo-root"></div>';
    demo = window.HPDemo.mount($('xdemo-root'));
  };

  /* Automations: a simulated approval run, with a failure switch that shows the monitor's alert */
  const A_STEPS = ['Submitted', 'Checked', 'Approved', 'Posted to finance', 'Logged'];
  const A_ICONS = ['<path d="M4 12 20 4l-5 16-3-7z"/><path d="m12 13 8-9"/>', '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>',
    '<path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6z"/><path d="m9 12 2 2 4-4"/>', '<path d="M4 10h16M5 10V19M19 10V19M9.5 10v9M14.5 10v9M3 19h18"/><path d="m12 3.5 8 4.5H4z"/>',
    '<path d="M6 4h10l3 3v13H6z"/><path d="M9 11h7M9 15h5"/>'];
  PIECE.auto = function (body) {
    body.innerHTML = '<div class="sbar"><div class="meta"><span class="pill accent"><i></i>Payment approval</span><span>A simulated run of a payment approval. Invented request.</span></div>' +
      '<label class="switch"><input type="checkbox" id="x-auto-fail"><span class="tr" aria-hidden="true"></span>What if a step fails?</label>' +
      '<button type="button" class="btn primary small" id="x-auto-run">' + PLAY + '<span>Run an approval</span></button></div>' +
      '<ol class="aflow" id="x-auto-steps" aria-label="Approval steps">' + A_STEPS.map(function (s, i) {
        return '<li><span class="dot"><span class="ic">' + ICON(A_ICONS[i]) + '</span><span class="ok">' + OK + '</span><span class="x">' + BAD + '</span></span><span class="name">' + s + '</span><span class="st">Waiting</span></li>';
      }).join('') + '</ol><div id="x-auto-out"></div><p class="sr-only" id="x-auto-live" role="status" aria-live="polite"></p>';
    const lis = [].slice.call($('x-auto-steps').children);
    function setState(i, cls, txt) { lis[i].className = cls; lis[i].querySelector('.st').textContent = txt; }
    function reset() { clear(stageTimers); lis.forEach(function (l, i) { setState(i, '', 'Waiting'); }); $('x-auto-out').innerHTML = ''; $('x-auto-live').textContent = ''; }
    function end(failed) {
      if (failed) {
        $('x-auto-out').innerHTML = '<div class="toast"><span class="ti">' + ICON('<path d="M12 4 21 19H3z"/><path d="M12 10v4M12 17h.01"/>') + '</span><b>Monitor alert</b><p>The payment approval flow failed at “Posted to finance”. The owner is told straight away, and the daily digest lists it too. Nothing is logged as paid.</p><small>Read-only health monitor · just now</small></div>';
        $('x-auto-live').textContent = 'Failed at Posted to finance. Monitor alert: the owner is told straight away, and the daily digest lists it too. Nothing is logged as paid.';
      } else {
        $('x-auto-out').innerHTML = '<div class="okcard">' + OK + 'Approved, posted to finance and logged.</div>';
        $('x-auto-live').textContent = 'Approved, posted to finance and logged.';
      }
      busy($('x-auto-run'), false); $('x-auto-run').querySelector('span').textContent = 'Run it again';
    }
    $('x-auto-run').addEventListener('click', function () {
      if (isBusy(this)) return;
      reset();
      const failAt = $('x-auto-fail').checked ? 3 : -1;
      if (reduce.matches) {
        for (let i = 0; i < A_STEPS.length; i++) {
          if (i === failAt) { setState(i, 'bad', 'Failed'); for (let j = i + 1; j < A_STEPS.length; j++) setState(j, '', 'Not run'); break; }
          setState(i, 'done', 'Done');
        }
        end(failAt >= 0); return;
      }
      busy(this, true); this.querySelector('span').textContent = 'Running…';
      let i = 0;
      (function next() {
        if (i >= A_STEPS.length) { end(false); return; }
        setState(i, 'active', 'Running…'); $('x-auto-live').textContent = A_STEPS[i] + ': running.';
        later(stageTimers, function () {
          if (i === failAt) { setState(i, 'bad', 'Failed'); for (let j = i + 1; j < A_STEPS.length; j++) setState(j, '', 'Not run'); end(true); return; }
          setState(i, 'done', 'Done'); i++; next();
        }, 750);
      })();
    });
    $('x-auto-fail').addEventListener('change', function () { reset(); busy($('x-auto-run'), false); $('x-auto-run').querySelector('span').textContent = 'Run an approval'; });
  };

  /* Data Q&A: a question about the fictional company, the answer, and the independent recheck */
  function money(v) { const a = Math.abs(v); return '£' + (a >= 10000 ? (a / 1000).toFixed(2) + 'm' : Math.round(a).toLocaleString('en-GB') + 'k'); }
  const QUESTION = 'Which product line grew fastest against last year, year to date, at Harbour & Pine Outdoor Co. (invented)?';
  PIECE.qa = function (body) {
    body.innerHTML = '<div class="chat"><div class="chat-head"><b><span class="av" aria-hidden="true">' + ICON('<path d="M4.5 5.5h15v10h-8l-4.5 4v-4h-2.5z"/>', 15) + '</span>Data Q&amp;A desk</b><span class="pill"><i></i>Read-only</span><span class="pill accent"><i></i>Invented data</span></div>' +
      '<div class="chat-log" id="x-qa-log"><p class="sysnote">Ask in plain English. Answers come from the governed data, using the business’s own definitions.</p></div>' +
      '<div class="composer"><div class="q" id="x-qa-q">' + esc(QUESTION) + '</div><button type="button" class="btn primary small" id="x-qa-ask">Ask the question</button></div></div>' +
      '<p class="sr-only" id="x-qa-live" role="status" aria-live="polite"></p>';
    function compute() {
      const months = []; for (let m = 24; m <= 32; m++) months.push(m);
      const all = HP.REGIONS.map(function (r) { return r.id; });
      return HP.PRODUCTS.map(function (p) {
        const s = HP.aggregate(all, [p.id], months);
        return { name: p.name, id: p.id, rev: s.a.rev, g: (s.a.rev - s.p.rev) / s.p.rev * 100 };
      }).sort(function (a, b) { return b.g - a.g; })[0];
    }
    function recheck(best) { /* a separate route to the same figure: straight from the cells, no aggregate() */
      let cur = 0, prior = 0;
      HP.REGIONS.forEach(function (r) { const c = HP.CELLS[r.id][best.id].rev.a; for (let m = 24; m <= 32; m++) { cur += c[m]; prior += c[m - 12]; } });
      return { rev: cur, g: (cur - prior) / prior * 100 };
    }
    const log = $('x-qa-log'), live = $('x-qa-live'), ask = $('x-qa-ask');
    function add(html) { log.insertAdjacentHTML('beforeend', html); return log.lastElementChild; }
    ask.addEventListener('click', function () {
      if (isBusy(ask)) return;
      clear(stageTimers);
      log.innerHTML = ''; $('x-qa-q').classList.add('sent');
      const best = compute(), chk = recheck(best), ok = chk.rev === best.rev && Math.abs(chk.g - best.g) < 1e-9;
      const answer = 'Answer: ' + best.name + '. Revenue ' + money(best.rev) + ' year to date, ' + best.g.toFixed(1) + '% above the same period last year.';
      const recheckTxt = 'Independent recheck: a separate agent worked it out its own way and ' + (ok ? 'the figures match' : 'the figures differ, so it would not be sent') + '. Sent as a ready-to-send reply plus a spreadsheet with the data and notes.';
      const steps = [
        function () { add('<div class="msg me"><span class="av me" aria-hidden="true">You</span><div class="bubble">' + esc(QUESTION) + '</div></div>'); },
        function () { add('<p class="sysnote">Question received. This service is read-only: it cannot change anything.</p>'); live.textContent = 'Question received. This service is read-only: it cannot change anything.'; },
        function () { add('<div class="msg" id="x-qa-typing"><span class="av" aria-hidden="true">Q</span><div class="bubble typing" aria-label="Working on it"><i></i><i></i><i></i></div></div>'); },
        function () {
          const t = $('x-qa-typing'); if (t) t.remove();
          add('<div class="msg"><span class="av" aria-hidden="true">Q</span><div class="bubble" id="x-qa-ans">' + esc(answer) + '</div></div>'); live.textContent = answer;
        },
        function () {
          $('x-qa-ans').insertAdjacentHTML('beforeend', '<div class="verify"><span class="vchip' + (ok ? '' : ' no') + '">' + (ok ? 'Rechecked ✓' : 'Recheck failed ✗') + '</span><span class="att">Reply, ready to send</span><span class="att">Spreadsheet: data and notes</span><p>' + esc(recheckTxt) + '</p></div>');
          live.textContent = (ok ? 'Rechecked. ' : 'Recheck failed. ') + recheckTxt;
          busy(ask, false); ask.textContent = 'Ask again';
        }
      ];
      if (reduce.matches) { steps.forEach(function (s, i) { if (i !== 2) s(); }); ask.textContent = 'Ask again'; return; }
      busy(ask, true);
      const gaps = [0, 500, 450, 1100, 900]; let at = 0;
      steps.forEach(function (s, i) { at += gaps[i]; later(stageTimers, s, at); });
    });
  };

  /* Business apps: a mock order list, an edit, and its audit-log entry */
  const orders = [
    { ref: 'HP-1041', who: 'Fjordline Outfitters', status: 'Packed' }, { ref: 'HP-1042', who: 'Ridge & Row', status: 'Picking' },
    { ref: 'HP-1043', who: 'Cairn Supply Co.', status: 'Shipped' }, { ref: 'HP-1044', who: 'Larch Hill Stores', status: 'New' }
  ];
  const audit = [];
  const STATUSES = ['New', 'Picking', 'Packed', 'Shipped'];
  PIECE.apps = function (body) {
    body.innerHTML = '<div class="sbar"><div class="meta"><span>A mock order list, with invented orders. Edit a status and the change is written to an audit log.</span></div></div>' +
      '<div class="apps"><div class="otable"><div class="ohead"><h3>Orders</h3><span class="pill accent"><i></i>Shared, audited record</span></div>' +
      '<table class="ot"><caption class="sr-only">Mock order list (invented)</caption><thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody id="x-orders"></tbody></table></div>' +
      '<section class="audit" aria-labelledby="x-audit-h"><h3 id="x-audit-h">Audit log</h3><ol class="tl" id="x-audit" aria-live="polite"></ol></section></div>';
    let editing = null, flash = null;
    function pillOf(s) { return '<span class="ost ' + s.toLowerCase() + '">' + s + '</span>'; }
    function draw() {
      $('x-orders').innerHTML = orders.map(function (o) {
        if (editing === o.ref) {
          return '<tr class="editing"><td class="ref">' + o.ref + '</td><td class="cust">' + esc(o.who) + '</td><td class="stc"><label class="sr-only" for="x-st">Status for ' + o.ref + '</label><select id="x-st">' +
            STATUSES.map(function (s) { return '<option' + (s === o.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td>' +
            '<td class="act"><button type="button" class="btn primary small" data-save="' + o.ref + '">Save</button><button type="button" class="btn secondary small" data-cancel="1">Cancel</button></td></tr>';
        }
        return '<tr' + (flash === o.ref ? ' class="flash"' : '') + '><td class="ref">' + o.ref + '</td><td class="cust">' + esc(o.who) + '</td><td class="stc">' + pillOf(o.status) + '</td><td class="act"><button type="button" class="btn secondary small" data-edit="' + o.ref + '" aria-label="Edit ' + o.ref + '">Edit</button></td></tr>';
      }).join('');
      $('x-audit').innerHTML = audit.length ? audit.map(function (a, i) {
        return '<li' + (i === 0 && flash ? ' class="new"' : '') + '><b>' + a.ref + '</b>: status ' + a.from + ' → ' + a.to + ' <small>by you (invented user) · just now</small></li>';
      }).join('') : '<li class="none">No edits yet.</li>';
      flash = null;
    }
    function refocus(r) { const b = document.querySelector('[data-edit="' + r + '"]'); if (b) b.focus(); }
    $('x-orders').addEventListener('click', function (e) {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-edit')) { editing = b.getAttribute('data-edit'); draw(); $('x-st').focus(); }
      else if (b.hasAttribute('data-cancel')) { const r = editing; editing = null; draw(); refocus(r); }
      else if (b.hasAttribute('data-save')) {
        const o = orders.filter(function (x) { return x.ref === editing; })[0], to = $('x-st').value;
        if (o.status !== to) { audit.unshift({ ref: o.ref, from: o.status, to: to }); o.status = to; flash = o.ref; }
        const r = editing; editing = null; draw(); refocus(r);
      }
    });
    $('x-orders').addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && editing) { e.preventDefault(); e.stopPropagation(); const r = editing; editing = null; draw(); refocus(r); }
    });
    draw();
  };

  /* Agent control room: a mock dashboard with invented project names.
     No agents were harmed in the making of this dashboard. None of them exist. */
  const PROJECTS = [
    { name: 'Orion', area: 'Analytics', agents: [['Analyst', 'done'], ['Builder', 'work'], ['Reviewer', 'idle'], ['Tester', 'idle'], ['Release', 'idle']] },
    { name: 'Juno', area: 'Analytics', agents: [['Analyst', 'done'], ['Builder', 'done'], ['Reviewer', 'done'], ['Tester', 'done'], ['Release', 'wait']] },
    { name: 'Kestrel', area: 'Products', agents: [['Analyst', 'done'], ['Builder', 'wait'], ['Reviewer', 'idle'], ['Tester', 'idle'], ['Release', 'idle']] },
    { name: 'Lumen', area: 'Operations', agents: [['Analyst', 'done'], ['Builder', 'done'], ['Reviewer', 'work'], ['Tester', 'idle'], ['Release', 'idle']] }
  ];
  const STATE_TXT = { done: 'done', work: 'working', wait: 'waiting on you', idle: 'not started' };
  const needs = [
    { id: 'n1', p: 'Juno', role: 'Release', text: 'Juno: approve the release of the monthly pack. Backup and rollback are attached.', yes: 'Approve', no: 'Decline', reply: 'Recorded. Juno’s overseer will run a dry run first.', no2: 'Recorded. Juno’s overseer holds the release.', yesState: 'work', noState: 'idle' },
    { id: 'n2', p: 'Kestrel', role: 'Builder', text: 'Kestrel: choose a layout for the order list.', yes: 'Option A', no: 'Option B', reply: 'Recorded: Option A. Kestrel’s overseer passes it to the builder.', no2: 'Recorded: Option B. Kestrel’s overseer passes it to the builder.', yesState: 'work', noState: 'work' }
  ];
  const resolved = {};
  const consoleLog = [
    { who: 'Orion overseer', text: 'The builder has started the second slice. The reviewer is lined up next.' },
    { who: 'Juno overseer', text: 'Tests passed and the figures match the baseline. The release is waiting on your go.' },
    { who: 'Kestrel overseer', text: 'Two layouts for the order list are ready for you to choose from.' },
    { who: 'Lumen overseer', text: 'Review started. I will report back with the findings.' }
  ];
  PIECE.control = function (body) {
    const areas = ['Analytics', 'Products', 'Operations'];
    body.innerHTML = '<div class="cr">' +
      '<div class="cr-head"><div class="ttl"><b>Control room <span class="live"><i></i>Live</span></b><p>A mock dashboard. Project names are invented.</p></div><dl class="cr-stats" id="x-cr-stats"></dl></div>' +
      '<svg width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute"><defs><linearGradient id="crg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--accent)"/><stop offset="1" style="stop-color:var(--accent-2)"/></linearGradient></defs></svg>' +
      '<div class="cr-main"><section class="cr-area" aria-labelledby="x-projs-h"><h4 id="x-projs-h" class="cr-label">Projects by area: ' + areas.join(', ') + '</h4><div class="cr-cards" id="x-projs"></div></section>' +
      '<aside class="cr-side" aria-labelledby="x-needs-h"><h4 id="x-needs-h" class="cr-label">Needs you <span class="pill warn" id="x-needs-n"></span></h4><ul class="needs-q" id="x-needs"></ul></aside></div>' +
      '<section class="cr-console" aria-labelledby="x-con-h"><div class="chead"><h4 id="x-con-h">Message a project lead</h4><small id="x-tick" aria-hidden="true">Updated just now</small></div>' +
      '<ol class="clog" id="x-console" aria-live="polite"></ol>' +
      '<div class="crow"><label class="sr-only" for="x-to">Recipient</label><select id="x-to">' + PROJECTS.map(function (p) { return '<option>' + p.name + '</option>'; }).join('') + '</select>' +
      '<label class="sr-only" for="x-msg">Message</label><input id="x-msg" class="tin" type="text" placeholder="Type a message" autocomplete="off"><button type="button" class="btn primary small" id="x-send">Send</button></div>' +
      '<p class="fine">Policy: agents may only message their own overseer. Across projects, only a person can.</p></section></div>';
    const C = 2 * Math.PI * 20;
    function nowLine(p) {
      const w = p.agents.filter(function (a) { return a[1] === 'wait'; })[0], k = p.agents.filter(function (a) { return a[1] === 'work'; })[0];
      if (w) return w[0] + ': waiting on you';
      if (k) return k[0] + ': working';
      return 'All agents idle';
    }
    function drawProjects() {
      $('x-projs').innerHTML = PROJECTS.map(function (p) {
          const done = p.agents.filter(function (x) { return x[1] === 'done'; }).length, waits = p.agents.some(function (x) { return x[1] === 'wait'; });
          return '<article class="pcard' + (waits ? ' needs' : '') + '" aria-label="' + p.name + '"><div class="ring" aria-hidden="true"><svg viewBox="0 0 48 48"><circle class="tr" cx="24" cy="24" r="20"/><circle class="pr" cx="24" cy="24" r="20" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - done / 5)).toFixed(1) + '"/></svg><b>' + done + '/5</b></div>' +
            '<div class="nm"><b>' + p.name + '</b><span class="pill">' + p.area + '</span><span class="sr-only">' + done + ' of 5 agents done.</span></div><p class="now">' + nowLine(p) + '</p>' +
            '<ul class="agents" aria-label="' + p.name + ' agents">' + p.agents.map(function (x) { return '<li class="ag ' + x[1] + '" title="' + x[0] + ': ' + STATE_TXT[x[1]] + '"><i aria-hidden="true"></i>' + x[0] + '<span class="sr-only">: ' + STATE_TXT[x[1]] + '</span></li>'; }).join('') + '</ul></article>';
      }).join('');
      const working = PROJECTS.reduce(function (s, p) { return s + p.agents.filter(function (x) { return x[1] === 'work'; }).length; }, 0);
      const open = needs.filter(function (n) { return !resolved[n.id]; }).length;
      $('x-cr-stats').innerHTML = '<div><dt>Projects</dt><dd>' + PROJECTS.length + '</dd></div><div><dt>Areas</dt><dd>' + areas.length + '</dd></div><div><dt>Agents working</dt><dd>' + working + '</dd></div><div class="' + (open ? 'warn' : '') + '"><dt>Needs you</dt><dd>' + open + '</dd></div>';
      $('x-needs-n').textContent = open ? open + ' waiting' : 'All clear'; $('x-needs-n').className = 'pill ' + (open ? 'warn' : 'good');
    }
    function drawNeeds() {
      $('x-needs').innerHTML = needs.map(function (n) {
        if (resolved[n.id]) return '<li class="done"><span class="who">' + OK.replace('width="18" height="18"', 'width="14" height="14"') + n.p + ' overseer</span><span>' + esc(resolved[n.id]) + '</span></li>';
        return '<li><span class="who">' + n.p + ' overseer · decision</span><span>' + esc(n.text) + '</span><span class="nb"><button type="button" class="btn primary small" data-n="' + n.id + '" data-v="y">' + n.yes + '</button><button type="button" class="btn secondary small" data-n="' + n.id + '" data-v="n">' + n.no + '</button></span></li>';
      }).join('');
    }
    let lastNew = -1;
    function drawLog() {
      $('x-console').innerHTML = consoleLog.map(function (l, i) { return '<li class="' + (l.you ? 'you' : '') + (i >= lastNew && lastNew >= 0 ? ' new' : '') + '"><span>' + esc(l.who) + ':</span> ' + esc(l.text) + '</li>'; }).join('');
    }
    let since = 0;
    stageTimers.push(setInterval(function () { since++; const t = $('x-tick'); if (t) t.textContent = 'Updated ' + since + 's ago'; }, 1000));
    $('x-needs').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-n]'); if (!b) return;
      const n = needs.filter(function (x) { return x.id === b.getAttribute('data-n'); })[0], yes = b.getAttribute('data-v') === 'y';
      resolved[n.id] = yes ? n.reply : n.no2;
      const p = PROJECTS.filter(function (x) { return x.name === n.p; })[0];
      p.agents.forEach(function (a) { if (a[0] === n.role) a[1] = yes ? n.yesState : n.noState; });
      drawNeeds(); drawProjects(); since = 0;
      const nx = $('x-needs').querySelector('button'); (nx || $('x-msg')).focus();
    });
    function send() {
      const t = $('x-msg').value.trim(), to = $('x-to').value; if (!t) { $('x-msg').focus(); return; }
      lastNew = consoleLog.length;
      consoleLog.push({ who: 'You to ' + to + ' overseer', text: t, you: true });
      $('x-msg').value = ''; drawLog(); $('x-msg').focus(); since = 0;
      const reply = function () { lastNew = consoleLog.length; consoleLog.push({ who: to + ' overseer', text: 'Noted. It goes in the state document, and I will confirm what changes.' }); drawLog(); };
      if (reduce.matches) reply(); else later(stageTimers, reply, 700);
    }
    $('x-send').addEventListener('click', send);
    $('x-msg').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } });
    drawProjects(); drawNeeds(); drawLog();
  };

  /* ======================= 7. FOLLOW THE DATA ======================= */
  const F = X.FOLLOW;
  let fIdx = -1;
  function setDot(x, y) { if (dot) dot.setAttribute('transform', 'translate(' + f(x) + ' ' + f(y) + ')'); }
  function repaintFollow() {
    const nodes = {}, edges = {};
    allNodes().forEach(function (b) { b.classList.remove('follow', 'trail'); });
    F.forEach(function (s, i) {
      if (i > fIdx) return;
      nodeBtn(s.node).classList.add(i === fIdx ? 'follow' : 'trail'); nodes[s.node] = 1;
      if (i > 0) edges[key(F[i - 1].node, s.node)] = 1;
    });
    setHot({}, edges);
  }
  function stepsUI() { [].forEach.call($('xfsteps').children, function (li, i) { li.classList.toggle('active', i === fIdx); li.classList.toggle('done', i < fIdx); }); }
  function stopFollow(silent) {
    clear(followTimers); cancelAnimationFrame(dotRaf);
    following = false; fIdx = -1; map.classList.remove('following');
    allNodes().forEach(function (b) { b.classList.remove('follow', 'trail'); });
    if (dot) dot.classList.remove('on');
    const b = $('xfollow'); busy(b, false); b.querySelector('span').textContent = 'Follow the data';
    if (silent) [].forEach.call($('xfsteps').children, function (li) { li.classList.remove('active', 'done'); });
    paint(selected, false);
  }
  function along(from, to, ms, done) {
    const r = EDGE[key(from, to)]; if (!r) { done(); return; }
    const path = r.e, L = path.getTotalLength(), t0 = performance.now();
    dot.classList.add('on');
    (function frame(t) {
      const k = Math.min(1, (t - t0) / ms), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      const p = (EDGE[key(from, to)] ? EDGE[key(from, to)].e : path).getPointAtLength(L * e);
      setDot(p.x, p.y);
      if (k < 1) dotRaf = requestAnimationFrame(frame); else done();
    })(t0);
  }
  function followStep() {
    fIdx++;
    if (fIdx >= F.length) {
      $('xfstatus').textContent = 'Done. One record, from a source to a person, through every layer.';
      [].forEach.call($('xfsteps').children, function (li) { li.classList.remove('active'); li.classList.add('done'); });
      later(followTimers, function () {
        following = false; map.classList.remove('following'); if (dot) dot.classList.remove('on');
        allNodes().forEach(function (b) { b.classList.remove('follow', 'trail'); });
        busy($('xfollow'), false); $('xfollow').querySelector('span').textContent = 'Follow it again';
        paint(selected, false);
      }, 1600);
      return;
    }
    const s = F[fIdx], b = nodeBtn(s.node);
    repaintFollow(); stepsUI();
    if (fIdx === 0 && F[1] && EDGE[key(s.node, F[1].node)]) { const p0 = EDGE[key(s.node, F[1].node)].e.getPointAtLength(0); setDot(p0.x, p0.y); }
    dot.classList.remove('on');
    $('xfstatus').textContent = 'Step ' + (fIdx + 1) + ' of ' + F.length + ': ' + s.text;
    const r = b.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 20) b.scrollIntoView({ block: 'center', behavior: smooth() });
    later(followTimers, function () {
      if (fIdx + 1 < F.length) along(s.node, F[fIdx + 1].node, 850, followStep); else followStep();
    }, 1000);
  }
  $('xfollow').addEventListener('click', function () {
    if (isBusy(this)) return;
    stopFollow(true);
    if (reduce.matches) {
      fIdx = F.length - 1; following = true; repaintFollow(); following = false;
      allNodes().forEach(function (b) { if (b.classList.contains('follow')) { b.classList.remove('follow'); b.classList.add('trail'); } });
      [].forEach.call($('xfsteps').children, function (li) { li.classList.add('done'); });
      $('xfstatus').textContent = 'Reduced motion is on, so the steps are shown without animation: ' + F.map(function (s) { return s.text; }).join(' ');
      fIdx = -1; return;
    }
    following = true; map.classList.add('following'); map.classList.remove('preview');
    busy(this, true); this.querySelector('span').textContent = 'Following…';
    followStep();
  });

  /* ======================= 8. WIRING ======================= */
  allNodes().forEach(function (b) {
    const id = b.getAttribute('data-id');
    b.addEventListener('click', function () { select(id, true); });
    b.addEventListener('pointerenter', function () { paint(id, true); });
    b.addEventListener('pointerleave', function () { paint(selected, false); });
    b.addEventListener('focus', function () { if (b.matches(':focus-visible')) paint(id, true); });
    b.addEventListener('blur', function () { paint(selected, false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (stageKind && (document.activeElement === document.body || !document.activeElement)) { e.preventDefault(); closeStage(); return; }
    if (insp.classList.contains('inline') && insp.contains(document.activeElement)) { e.preventDefault(); collapsed = true; placeInspector(); redraw(); nodeBtn(selected).focus(); }
  });
  new ResizeObserver(redraw).observe(map);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { frameW = -1; redraw(); });
  const want = new URLSearchParams(location.search).get('node');
  if (want && X.NODES[want]) {
    select(want, false);
    const k = X.NODES[want].kind;
    if (k) openStage(k, null, true);
    requestAnimationFrame(function () { (k ? $('xstage') : nodeBtn(want)).scrollIntoView({ block: k ? 'start' : 'center' }); });
  } else select('exec', false);
})();
