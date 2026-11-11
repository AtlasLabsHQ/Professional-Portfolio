/* Interactive system map for "How I work with AI".
   Generic by design: it describes a method, not any project it was used on.
   Sections: 1 content, 2 layouts, 3 drawing, 4 cards, 5 run-a-change animation, 6 wiring. */
(function () {
  'use strict';
  const $ = function (id) { return document.getElementById(id); };
  const host = $('sysmap');
  if (!host) return;
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ======================= 1. CONTENT ======================= */
  /* kind: box or gate. sub: small second line. cls: styling hook. */
  const NODES = {
    me: { kind: 'box', lines: ['Me'], sub: 'human, approves', cls: 'me' },
    overseer: { kind: 'box', lines: ['Overseer'], sub: 'plan + state doc', cls: 'lead' },
    control: { kind: 'box', lines: ['Control room'], sub: 'watches all', cls: 'ctl' },
    analyst: { kind: 'box', lines: ['Analyst'], sub: 'read-only' },
    'g-proposal': { kind: 'gate', lines: ['Proposal'], sub: 'backup + rollback' },
    builder: { kind: 'box', lines: ['Builder'], sub: 'one writer per file' },
    reviewer: { kind: 'box', lines: ['Reviewer'], sub: 'independent' },
    tester: { kind: 'box', lines: ['Tester'], sub: 'as a user would' },
    'g-parity': { kind: 'gate', lines: ['Parity', 'check'], flat: 'Parity check' },
    'g-signoff': { kind: 'gate', lines: ['Human', 'sign-off'], flat: 'Human sign-off' },
    release: { kind: 'box', lines: ['Release', 'manager'], flat: 'Release manager', sub: 'dry-run first' },
    subs: { kind: 'box', lines: ['Sub-agents'], sub: 'one slice each', cls: 'subs' }
  };

  const CARDS = {
    me: { t: 'Me (the human)', does: 'Sets the goal, answers the overseer’s questions and approves.', may: 'Say go or no-go on each specific change that would reach production.', not: 'Delegate that approval. A general “carry on” is never a go.' },
    overseer: { t: 'Overseer', does: 'One lead agent per project. It holds the plan and the state document, talks to me, hands scoped slices to the specialists and checks what comes back before anything reaches me.', may: 'Assign work, read everything, keep the state document current.', not: 'Approve production changes itself, let two agents write the same file, or pass on unchecked work.' },
    control: { t: 'Control room', does: 'A small local dashboard that shows every overseer and its agents at once, what needs me, and lets me message them under a policy on who may talk to whom.', may: 'Show status, surface what is waiting on me, route messages the policy allows.', not: 'Approve anything. It watches; it does not decide.' },
    analyst: { t: 'Analyst', does: 'Turns the ask into requirements and profiles the data, so the builder starts from facts.', may: 'Read and profile, write findings and open questions.', not: 'Change anything. It is read-only.' },
    'g-proposal': { t: 'Gate: proposal', does: 'Before a change is applied it is proposed: what, why, impact, backup and rollback.', may: 'Let the change move to the builder once the proposal is complete.', not: 'Pass a change with no backup or no way back.' },
    builder: { t: 'Builder', does: 'Makes one scoped change in its own slice.', may: 'Write, but only its slice, and only one writer per file at a time.', not: 'Approve its own work or touch production.' },
    reviewer: { t: 'Reviewer (independent)', does: 'Checks the change. It did not write it, so it has no stake in it.', may: 'Read, find problems and rank them.', not: 'Fix things itself, or sign off work it produced.' },
    tester: { t: 'Tester', does: 'Uses the result the way a user would and records pass or fail with evidence.', may: 'Run it and make clearly marked test changes, then remove them.', not: 'Change the build, or test against live.' },
    'g-parity': { t: 'Gate: parity check', does: 'Before and after every change to a report or model, the key figures are compared value by value against a baseline.', may: 'Let the change through when every figure that should not move has not moved.', not: 'Ship a change where a number moved that should not have. It goes back to the builder.' },
    'g-signoff': { t: 'Gate: human sign-off', does: 'The point where I decide, for this specific change.', may: 'Approve or refuse, with the evidence in front of me.', not: 'Be skipped, or stand in for a later change.' },
    subs: { t: 'Sub-agents', does: 'Short-lived workers a specialist starts for one slice: one page, one measure, one check. They report back up and are gone.', may: 'Work on that one slice and report back to the specialist that started them.', not: 'Approve anything, talk to me, or touch anything outside their slice.' },
    release: { t: 'Release manager', does: 'Plans the release, rehearses it as a dry run, releases, then verifies.', may: 'Release only on my explicit go for that change, then check the result.', not: 'Release without that go, or skip the dry run.' }
  };

  const STAGES = [
    { node: 'builder', title: 'Build', text: 'The builder makes the change in its own slice, after a proposal with backup and rollback.' },
    { node: 'subs', title: 'Down to sub-agents', text: 'The builder hands pieces of its slice to short-lived sub-agents: one page or one check each.' },
    { node: 'builder', title: 'Results back up', text: 'The sub-agents report back and are gone; the builder assembles the pieces.' },
    { node: 'reviewer', title: 'Review', text: 'An independent reviewer, which did not write it, checks it.' },
    { node: 'tester', title: 'Test', text: 'The tester uses it the way a user would and records the result.' },
    { node: 'g-parity', title: 'Parity check', text: 'Key figures are compared value by value against the baseline.' },
    { node: 'g-signoff', title: 'Sign-off', text: 'I approve this specific change, or I do not.' },
    { node: 'release', title: 'Release', text: 'Dry run first, then release, then verify.' }
  ];

  function sequence(fail) {
    const out = STAGES.map(function (s) { return Object.assign({}, s); });
    if (!fail) return out;
    const pi = out.map(function (s) { return s.node; }).indexOf('g-parity'), seq = out.slice(0, pi + 1);
    seq[pi] = Object.assign({}, seq[pi], { fail: true, text: 'A figure moved that should not have. The change does not ship.' });
    seq.push({ node: 'builder', title: 'Back to the builder', text: 'The builder fixes it, then it goes through review, test and the parity check again.', back: true });
    STAGES.forEach(function (s) { seq.push(Object.assign({}, s, { title: s.title + ' (again)' })); });
    return seq;
  }

  /* ======================= 2. LAYOUTS ======================= */
  function size(n) { return n.kind === 'gate' ? { hw: 24, hh: 24 } : { hw: 52, hh: 29 }; }

  function desktopLayout() {
    const W = 1000, H = 412, rowA = 58, rowB = 280, pad = 12;
    const order = ['analyst', 'g-proposal', 'builder', 'reviewer', 'tester', 'g-parity', 'g-signoff', 'release'];
    const total = order.reduce(function (s, id) { return s + size(NODES[id]).hw * 2; }, 0);
    const gap = (W - pad * 2 - total) / (order.length - 1);
    const pos = {}; let x = pad;
    order.forEach(function (id) { const hw = size(NODES[id]).hw; pos[id] = { x: x + hw, y: rowB }; x += hw * 2 + gap; });
    pos.overseer = { x: W / 2, y: rowA }; pos.control = { x: 130, y: rowA }; pos.me = { x: pos['g-signoff'].x, y: rowA };
    pos.subs = { x: pos.reviewer.x, y: 378 };
    const paths = [];
    for (let i = 0; i < order.length - 1; i++) {
      const a = pos[order[i]], b = pos[order[i + 1]];
      paths.push({ d: 'M' + (a.x + size(NODES[order[i]]).hw + 2) + ' ' + rowB + 'H' + (b.x - size(NODES[order[i + 1]]).hw - 3), cls: 'flow', arrow: true });
    }
    const top = rowB - 29 - 3, busY = 170;
    paths.push({ d: 'M' + pos.overseer.x + ' ' + (rowA + 29) + 'V' + busY + 'M' + pos.analyst.x + ' ' + busY + 'H' + pos.release.x, cls: 'bus' });
    ['analyst', 'builder', 'reviewer', 'tester', 'release'].forEach(function (id) { paths.push({ d: 'M' + pos[id].x + ' ' + busY + 'V' + top, cls: 'bus', arrow: true }); });
    paths.push({ d: 'M' + (pos.me.x - 55) + ' ' + rowA + 'H' + (pos.overseer.x + 55), cls: 'flow', arrow: true });
    paths.push({ d: 'M' + pos.me.x + ' ' + (rowA + 31) + 'V' + (rowB - 27), cls: 'flow', arrow: true });
    paths.push({ d: 'M' + (pos.control.x + 55) + ' ' + rowA + 'H' + (pos.overseer.x - 55), cls: 'watch', arrow: true });
    /* sub-agents hang under the specialists: one short-lived worker per slice */
    paths.push({ d: 'M' + pos.builder.x + ' ' + (rowB + 31) + 'V330H' + pos.tester.x + 'V' + (rowB + 31) + 'M' + pos.subs.x + ' 330V' + (pos.subs.y - 31), cls: 'bus' });
    const fx = pos['g-parity'].x, bx = pos.builder.x + 24;
    paths.push({ d: 'M' + fx + ' ' + (rowB - 27) + 'V212H' + bx + 'V' + (rowB - 31), cls: 'failpath', arrow: true, fail: true });
    const texts = [
      { x: (pos.control.x + pos.overseer.x) / 2, y: rowA - 8, t: 'watches' },
      { x: (pos.me.x + pos.overseer.x) / 2, y: rowA - 8, t: 'brief, questions, go' },
      { x: pos.me.x + 8, y: 225, t: 'approves', start: true },
      { x: (fx + bx) / 2, y: 204, t: 'fails: back to builder', cls: 'failtext', fail: true },
      { x: pos.overseer.x + 8, y: 134, t: 'scoped slices, one writer per file', start: true, cls: 'busnote' }
    ];
    return { W: W, H: H, pos: pos, paths: paths, texts: texts, labels: 'below' };
  }

  function verticalLayout() {
    const W = 370, H = 830, sx = 215;
    const ys = { me: 40, overseer: 118, analyst: 212, 'g-proposal': 290, builder: 368, reviewer: 452, tester: 536, 'g-parity': 614, 'g-signoff': 690, release: 780 };
    const pos = {};
    Object.keys(ys).forEach(function (id) { pos[id] = { x: sx, y: ys[id] }; });
    pos.control = { x: 62, y: 118 }; pos.subs = { x: 62, y: 452 };
    const seq = ['me', 'overseer', 'analyst', 'g-proposal', 'builder', 'reviewer', 'tester', 'g-parity', 'g-signoff', 'release'];
    const hh = function (id) { return NODES[id].kind === 'gate' ? 24 : 27; };
    const paths = [];
    for (let i = 0; i < seq.length - 1; i++) {
      const a = seq[i], b = seq[i + 1];
      paths.push({ d: 'M' + sx + ' ' + (pos[a].y + hh(a) + 2) + 'V' + (pos[b].y - hh(b) - 3), cls: i < 2 ? (i === 0 ? 'flow' : 'bus') : 'flow', arrow: true });
    }
    paths.push({ d: 'M' + (62 + 52) + ' 118H' + (sx - 77), cls: 'watch', arrow: true });
    paths.push({ d: 'M62 423V368H' + (sx - 79) + 'M62 481V536H' + (sx - 79) + 'M114 452H' + (sx - 79), cls: 'bus' });
    paths.push({ d: 'M' + (sx + 77) + ' 40H352V690H' + (sx + 27), cls: 'flow', arrow: true });
    paths.push({ d: 'M' + (sx + 27) + ' 614H322V368H' + (sx + 77), cls: 'failpath', arrow: true, fail: true });
    const texts = [{ x: 345, y: 520, t: 'approves', cls: 'vnote', rot: true }, { x: 316, y: 480, t: 'fails: back to builder', cls: 'failtext vnote', fail: true, rot: true }];
    return { W: W, H: H, pos: pos, paths: paths, texts: texts, labels: 'left' };
  }

  /* ======================= 3. DRAWING ======================= */
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  let svg, token, layout, vertical = null, selected = 'overseer', activeNode = null;

  function draw() {
    layout = vertical ? verticalLayout() : desktopLayout();
    host.replaceChildren();
    svg = el('svg', { viewBox: '0 0 ' + layout.W + ' ' + layout.H, 'class': 'sysmap' + (vertical ? ' vert' : ''), role: 'group', 'aria-labelledby': 'map-title', 'aria-describedby': 'map-desc' }, host);
    const title = el('title', { id: 'map-title' }, svg); title.textContent = 'System map: how a change moves from me through the overseer and specialist agents to release';
    const defs = el('defs', {}, svg);
    const mk = el('marker', { id: 'ah', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M1 1 9 5 1 9z', 'class': 'ahead' }, mk);
    layout.paths.forEach(function (p) {
      const a = { d: p.d, 'class': 'edge ' + p.cls + (p.fail ? ' fail' : '') };
      if (p.arrow) a['marker-end'] = 'url(#ah)';
      el('path', a, svg);
    });
    layout.texts.forEach(function (t) {
      const a = { x: t.x, y: t.y, 'text-anchor': t.start ? 'start' : 'middle', 'class': 'note ' + (t.cls || '') + (t.fail ? ' fail' : '') };
      if (t.rot) a.transform = 'rotate(-90 ' + t.x + ' ' + t.y + ')';
      el('text', a, svg).textContent = t.t;
    });
    Object.keys(NODES).forEach(function (id) { drawNode(id); });
    token = el('circle', { r: 10, cx: 0, cy: 0, 'class': 'token', 'aria-hidden': 'true' }, svg);
    svg.classList.toggle('show-fail', $('failmode').checked);
    if (activeNode) markActive(activeNode);
  }

  function drawNode(id) {
    const n = NODES[id], p = layout.pos[id], c = CARDS[id];
    const g = el('g', { 'class': 'node ' + n.kind + ' ' + (n.cls || '') + (id === selected ? ' sel' : ''), id: 'n-' + id, tabindex: 0, role: 'button', 'aria-pressed': String(id === selected),
      'aria-label': (n.flat || n.lines.join(' ')) + ': ' + (c.t === 'Me (the human)' ? 'human, approves' : (n.sub || 'gate')) + '. Show details.' }, svg);
    if (n.kind === 'gate') {
      el('polygon', { points: [p.x, p.y - 25, p.x + 25, p.y, p.x, p.y + 25, p.x - 25, p.y].join(' '), 'class': 'shape' }, g);
      el('path', { d: 'M' + (p.x - 8) + ' ' + p.y + 'l5 5 11-11', 'class': 'tick' }, g);
      const flat = vertical || layout.labels === 'left';
      if (flat) {
        const lines = n.sub ? [n.lines[0], n.sub] : [n.flat || n.lines.join(' ')];
        lines.forEach(function (ln, i) { el('text', { x: p.x - 34, y: p.y + (lines.length === 1 ? 4 : i * 14 - 2), 'text-anchor': 'end', 'class': i ? 'sub' : 'lbl' }, g).textContent = ln; });
      } else {
        const lines = n.sub ? [n.lines[0], n.sub] : n.lines;
        lines.forEach(function (ln, i) { el('text', { x: p.x, y: p.y + 44 + i * 14, 'text-anchor': 'middle', 'class': (n.sub && i) ? 'sub' : 'lbl' }, g).textContent = ln; });
      }
    } else {
      const hw = vertical && id !== 'control' && id !== 'subs' ? 77 : (id === 'control' || id === 'overseer' || id === 'me' ? 55 : 52), hh = vertical ? 27 : 29;
      el('rect', { x: p.x - hw, y: p.y - hh, width: hw * 2, height: hh * 2, rx: 12, 'class': 'shape' }, g);
      const lines = vertical ? [n.flat || n.lines.join(' ')] : n.lines;
      const block = lines.length * 15 + (n.sub ? 14 : 0);
      let y = p.y - block / 2 + 12;
      lines.forEach(function (ln) { el('text', { x: p.x, y: y, 'text-anchor': 'middle', 'class': 'lbl' }, g).textContent = ln; y += 15; });
      if (n.sub) el('text', { x: p.x, y: y - 1, 'text-anchor': 'middle', 'class': 'sub' }, g).textContent = n.sub;
    }
    g.addEventListener('click', function () { select(id); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(id); } });
  }

  /* ======================= 4. CARDS ======================= */
  function select(id) {
    selected = id;
    Object.keys(NODES).forEach(function (k) {
      const g = $('n-' + k); if (!g) return;
      g.classList.toggle('sel', k === id); g.setAttribute('aria-pressed', String(k === id));
    });
    const c = CARDS[id];
    $('card').innerHTML = '<h3>' + c.t + '</h3><dl><div><dt>What it does</dt><dd>' + c.does + '</dd></div><div><dt>May</dt><dd>' + c.may + '</dd></div><div><dt>May not</dt><dd>' + c.not + '</dd></div></dl>';
  }

  /* ======================= 5. RUN A CHANGE ======================= */
  let seq = [], idx = -1, timer = null, running = false;
  const STEP_MS = 1500;

  function renderSteps(state) {
    seq = sequence($('failmode').checked);
    $('steps').innerHTML = seq.map(function (s, i) {
      const st = state === 'all' ? ' done' : '';
      return '<li data-i="' + i + '" class="' + (s.fail ? 'fails' : '') + (s.back ? ' back' : '') + st + '"><span><b>' + s.title + (s.fail ? ' <span class="badge">fails</span>' : '') + '</b> ' + s.text + '</span></li>';
    }).join('');
  }
  function markActive(id) {
    activeNode = id;
    Object.keys(NODES).forEach(function (k) { const g = $('n-' + k); if (g) g.classList.toggle('active', k === id); });
  }
  function moveToken(id, instant) {
    const p = layout.pos[id];
    if (instant) token.style.transition = 'none';
    token.style.transform = 'translate(' + p.x + 'px,' + (p.y - (vertical ? 34 : 38)) + 'px)';
    if (instant) { token.getBoundingClientRect(); token.style.transition = ''; }
    token.classList.add('on');
  }
  function stop() {
    clearTimeout(timer); running = false; idx = -1; markActive(null); activeNode = null;
    if (token) token.classList.remove('on');
    $('run').disabled = false; $('run').textContent = 'Run a change';
  }
  function step() {
    idx++;
    if (idx >= seq.length) {
      $('run-status').textContent = 'Done. The change was released, after a human go.';
      [].forEach.call($('steps').children, function (li) { li.classList.remove('active'); li.classList.add('done'); });
      timer = setTimeout(function () { stop(); $('run').textContent = 'Run again'; }, 1400);
      return;
    }
    const s = seq[idx];
    [].forEach.call($('steps').children, function (li, i) { li.classList.toggle('active', i === idx); li.classList.toggle('done', i < idx); });
    markActive(s.node); moveToken(s.node, idx === 0);
    svg.classList.toggle('flash-fail', !!s.fail);
    $('run-status').textContent = 'Step ' + (idx + 1) + ' of ' + seq.length + ': ' + s.title + '. ' + s.text;
    timer = setTimeout(step, STEP_MS);
  }
  function run() {
    stop(); renderSteps();
    if (reduce.matches) {
      renderSteps('all');
      $('run-status').textContent = 'Reduced motion is on, so the steps are shown without animation: ' + seq.map(function (s) { return s.title; }).join(', then ') + '.';
      return;
    }
    running = true; $('run').disabled = true; $('run').textContent = 'Running…';
    step();
  }

  /* ======================= 6. WIRING ======================= */
  function layoutMode() { return host.clientWidth < 900; }
  function ensure() {
    const v = layoutMode();
    if (v !== vertical) { vertical = v; draw(); if (!running) moveHide(); }
  }
  function moveHide() { if (token) token.classList.remove('on'); }

  $('run').addEventListener('click', run);
  /* The parity-check failure switch. This is the bit that saves careers. */
  $('failmode').addEventListener('change', function () {
    stop(); svg.classList.toggle('show-fail', this.checked); renderSteps();
    $('run-status').textContent = this.checked ? 'Parity check failure switched on: the change will loop back to the builder.' : 'Parity check failure switched off.';
  });
  let lastW = 0;
  new ResizeObserver(function () { if (Math.abs(host.clientWidth - lastW) > 1) { lastW = host.clientWidth; const was = vertical; ensure(); if (was !== vertical && running) { stop(); } } }).observe(host);
  ensure(); renderSteps(); select('overseer');
})();
