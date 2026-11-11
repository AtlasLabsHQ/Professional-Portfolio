/* Platform explorer. The boxes are real buttons written by the generator; this file draws the connectors,
   highlights paths, runs "Follow the data", fills the inspector and opens each "Try it" in the stage below the map.
   The stages themselves live in stage.js and stages.js. Sections: 1 setup and graph, 2 connectors, 3 highlight,
   4 inspector and selection, 5 stage, 7 follow the data, 8 wiring. Everything shown here is invented. */
(function () {
  'use strict';
  const X = window.EXPLORE;
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
  let selected = null, collapsed = false, following = false, laneAgents = false;
  let followTimers = [], dotRaf = 0;
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
      const A = nodeBtn(e[0]), B = nodeBtn(e[1]); if (!A || !B || !A.offsetParent || !B.offsetParent) return; /* hidden boxes (the agent tools, by hand) draw no lines */
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
    platform: 'Open the platform demo', exec: 'Open the live demo', auto: 'Try the automations', qa: 'Ask the desk a question',
    apps: 'Open the mock order app', control: 'Run a project', suite: 'Run a change', workbook: 'Watch a rebuild'
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
    if (!measuring) syncTry();
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
    if ((id === 'suite' || id === 'control') && !laneAgents) setLane(true, false);
    selected = id; collapsed = false;
    allNodes().forEach(function (b) {
      const on = b.getAttribute('data-id') === id;
      b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on));
    });
    renderInspector(id); placeInspector(); paint(id, false); redraw();
    $('xstatus').textContent = 'Showing details for ' + n.label + '.';
  }

  /* ======================= 5. STAGE ======================= */
  /* Each "Try it" opens the shared stage (assets/stage.js, loaded on first use) inline, under the map.
     The same stage opens as an overlay on the Projects and Career pages. */
  const stageHost = $('xstage');
  let stageKind = null;
  function nodeOfKind(k) { return Object.keys(X.NODES).filter(function (id) { return X.NODES[id].kind === k; })[0]; }
  function syncTry() { const t = $('xp-try'); if (t) t.setAttribute('aria-expanded', String(!!stageKind && X.NODES[selected].kind === stageKind)); }
  function openStage(kind, opener, noScroll, state) {
    stageKind = kind; syncTry();
    return window.NN.loadStage(kind).then(function () {
      /* the inspector re-renders its Try it button, so find the current one when the stage closes */
      const back = function () { return $('xp-try') || (opener && opener.isConnected ? opener : nodeBtn(selected)); };
      window.NNStage.open(kind, { host: stageHost, opener: back, noScroll: noScroll, state: state,
        onClose: function () { stageKind = null; syncTry(); } });
    }, function () { stageKind = null; syncTry(); });
  }
  /* the palette (or anything else on this page) asks for a stage: show its box and open it here */
  window.NN.stageHost = function (kind, o) {
    o = o || {};
    const id = nodeOfKind(kind); if (!id) return Promise.resolve();
    if (selected !== id) select(id, false);
    return openStage(kind, o.opener, false, o.state);
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
    if (insp.classList.contains('inline') && insp.contains(document.activeElement)) { e.preventDefault(); collapsed = true; placeInspector(); redraw(); nodeBtn(selected).focus(); }
  });
  new ResizeObserver(redraw).observe(map);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { frameW = -1; redraw(); });
  /* "How it gets built": one delivery method, By hand (the default) or With agents. Same steps either way; the agent
     tools (the delivery suite and the control room) only appear with agents. ?lane=agents shares that view. */
  const lane = $('xlane'), laneBtns = [].slice.call(lane.querySelectorAll('.mode [data-mode]'));
  function setLane(on, user) {
    laneAgents = on; lane.classList.toggle('agents-on', on);
    laneBtns.forEach(function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-mode') === 'agents') === on)); });
    [].forEach.call(lane.querySelectorAll('.ph'), function (e) { e.hidden = on; });
    [].forEach.call(lane.querySelectorAll('.pa'), function (e) { e.hidden = !on; });
    $('xlane-ag').hidden = !on;
    if (!on && (selected === 'suite' || selected === 'control')) select('ready', false);
    if (user) {
      const u = new URL(location.href); if (on) u.searchParams.set('lane', 'agents'); else u.searchParams.delete('lane');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      $('xstatus').textContent = on ? 'How it gets built, with agents: the same steps, run through my agent suite, with me signing off.' : 'How it gets built, by hand: the work I do myself at each step.';
    }
    frameW = -1; redraw();
  }
  laneBtns.forEach(function (b, i) {
    b.addEventListener('click', function () { setLane(b.getAttribute('data-mode') === 'agents', true); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault(); const o = laneBtns[1 - i]; o.focus(); setLane(o.getAttribute('data-mode') === 'agents', true);
    });
  });
  if (new URLSearchParams(location.search).get('lane') === 'agents') setLane(true, false);

  /* deep links: ?node=<box> selects it (and opens its stage if it has one); ?stage=<kind>&tab=&sc=&step=&agents= restores a stage view */
  const q = new URLSearchParams(location.search), want = q.get('node'), st = q.get('stage');
  const kind = st && nodeOfKind(st) ? st : (want && X.NODES[want] && X.NODES[want].kind) || null;
  const start = want && X.NODES[want] ? want : (kind ? nodeOfKind(kind) : null);
  if (start) {
    select(start, false);
    if (kind) {
      const state = {}; ['tab', 'sc', 'step'].forEach(function (k) { if (q.has(k)) state[k] = k === 'step' ? +q.get(k) : q.get(k); });
      if (q.has('mode') || q.has('agents')) state.agents = q.get('mode') === 'agents' || q.get('agents') === '1' ? 1 : 0;
      openStage(kind, null, true, state).then(function () { stageHost.scrollIntoView({ block: 'start' }); });
    } else requestAnimationFrame(function () { nodeBtn(start).scrollIntoView({ block: 'center' }); });
  } else select('exec', false);
})();
