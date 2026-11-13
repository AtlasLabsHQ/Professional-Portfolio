/* The Stage: one reusable frame for every "Try it". site.js loads it (with stages.js and stage.css) the first time a
   stage opens, so pages that never open one never pay for it.
   It mounts inline (the explorer's stage, under the map) or as a full-screen overlay (everywhere else), draws the
   journey strip and the agent layer, keeps its state in the URL, and runs the guided tour.
   Sections: 1 helpers, 2 registry, 3 journey strip, 4 agent layer, 5 URL state, 6 frame, 7 open and close, 8 tour. */
(function () {
  'use strict';
  /* ======================= 1. HELPERS ======================= */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function ICON(p, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  const OK = ICON('<path d="m5 12.5 4.5 4.5L19 7.5"/>'), BAD = ICON('<path d="M7 7l10 10M17 7 7 17"/>');
  const PLAY = '<svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M2.5 1.5v7l6-3.5z" fill="currentColor"/></svg>';
  /* line icons on a 24-unit grid, shared by the journeys and the pieces */
  const I = {
    db: '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6"/>',
    raw: '<path d="M4 13.5h4l1.5 2.5h5l1.5-2.5h4"/><path d="M5.5 7.5 4 13.5v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4l-1.5-6a2 2 0 0 0-2-1.5h-9a2 2 0 0 0-2 1.5z"/>',
    clean: '<path d="M4 5h16l-6 7.5V19l-4-2v-4.5z"/>',
    ready: '<path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    model: '<path d="m12 3.5 8 4.5-8 4.5-8-4.5z"/><path d="m4 12.5 8 4.5 8-4.5"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
    person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-3.8 3.5-6.2 7-6.2s6.3 2.4 7 6.2"/>',
    team: '<circle cx="8" cy="9" r="2.5"/><circle cx="16" cy="9" r="2.5"/><path d="M3.5 18.5c.4-2.6 2.2-4.3 4.5-4.3s4.1 1.7 4.5 4.3M11.5 18.5c.4-2.6 2.2-4.3 4.5-4.3s4.1 1.7 4.5 4.3"/>',
    form: '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3.5 6 1 1 2-2M3.5 12l1 1 2-2M3.5 18l1 1 2-2"/>',
    check: '<path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    bank: '<path d="M4 10h16M5 10V19M19 10V19M9.5 10v9M14.5 10v9M3 19h18"/><path d="m12 3.5 8 4.5H4z"/>',
    log: '<path d="M6 4h10l3 3v13H6z"/><path d="M9 11h7M9 15h5"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    swap: '<path d="M4 8h13M13 4l4 4-4 4M20 16H7M11 12l-4 4 4 4"/>',
    sheet: '<rect x="3.5" y="4" width="17" height="16" rx="2"/><path d="M3.5 10h17M3.5 15h17M10 4v16"/>',
    app: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M3.5 9h17M7 6.8h.01M9.5 6.8h.01"/>',
    loop: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4.5v4h-4"/>',
    q: '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01"/>',
    book: '<path d="M5 4.5h11a3 3 0 0 1 3 3v12H8a3 3 0 0 1-3-3z"/><path d="M5 16.5a3 3 0 0 1 3-3h11"/>',
    answer: '<path d="M4.5 5.5h15v10h-8l-4.5 4v-4h-2.5z"/><path d="M8.5 10.5h7"/>',
    lead: '<circle cx="12" cy="12" r="8"/><path d="m9 12 2 2 4-4"/>',
    brief: '<path d="M6 3.5h9l3 3v14H6z"/><path d="M9 10h6M9 14h6M9 18h3"/>',
    wrench: '<path d="M14.5 5.5a4 4 0 0 0 4.6 5.4L11 19a2.1 2.1 0 0 1-3-3l8.1-8.1a4 4 0 0 0-1.6-2.4z"/>',
    search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>',
    pen: '<path d="M12 20h8"/><path d="M16.5 4.5a2.1 2.1 0 0 1 3 3L8 19l-4 1 1-4z"/>',
    gate: '<path d="m12 3 9 9-9 9-9-9z"/><path d="m8.5 12 2.3 2.3 4.7-4.7"/>',
    release: '<path d="M12 3.5v11M7.5 10 12 14.5 16.5 10"/><path d="M4.5 17v2.5h15V17"/>',
    repo: '<path d="M6 3.5h12v17H6z"/><path d="M9 7.5h6M9 11h6"/><circle cx="12" cy="16" r="1.5"/>',
    inbox: '<path d="M4 13.5h4l1.5 2.5h5l1.5-2.5h4"/><path d="M4 13.5 6 5h12l2 8.5V19H4z"/>',
    platform: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5M3 17.5l9 5 9-5"/>',
    bolt: '<path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12z"/>',
    spark: '<path d="M12 3.5 13.6 9l5.4 1.6-5.4 1.7L12 18l-1.6-5.7L5 10.6 10.4 9z"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
  };
  /* busy buttons keep focus (a disabled button drops it to the page), so use aria-disabled */
  function busy(btn, on) { btn.setAttribute('aria-disabled', String(on)); btn.classList.toggle('is-busy', on); }
  function isBusy(btn) { return btn.getAttribute('aria-disabled') === 'true'; }
  /* Who does the work. Agents are never a step in the pipeline: the steps run on a schedule, as flows, or are people.
     Agents sit beside it and do two things only: help build or change a step (build, always reviewed and signed off by me),
     or read governed data to answer questions (data, read-only). */
  const AG = {
    build: { t: 'Build help', i: I.spark, key: 'an agent helps build or change a step; I review and sign off' },
    data: { t: 'Data agent', i: I.answer, key: 'reads governed data to answer questions, read-only; never a step' },
    auto: { t: 'Automated', i: I.gear, key: 'scheduled or automated, no AI' },
    person: { t: 'Person', i: I.person, key: 'approves anything that reaches production' }
  };
  function agb(k) { return '<span class="agb ' + k + '">' + ICON(AG[k].i, 12) + AG[k].t + '</span>'; }
  function runsKind(r) { return /person|people/i.test(r) ? 'person' : /agent/i.test(r) ? 'agent' : 'auto'; }
  function handFor(def, label) { const h = (def.hand || []).filter(function (x) { return x[0] === label; })[0]; return h ? h[1] : ''; }

  /* ======================= 2. REGISTRY ======================= */
  const DEFS = {};
  let cur = null;   /* the open stage: { id, def, mode, frame, host, opener, state, timers, api, journey } */

  /* ======================= 3. JOURNEY STRIP ======================= */
  /* Chips joined by SVG connectors; each chip says what runs it. go(i) lights a chip and runs a packet along the
     connector into it, in either direction (lineage runs backwards). With agents: a "Build help" mark above a step an
     agent helps build or change, and a "Data agent" mark below governed data it reads. Too wide for one row: the strip
     wraps, each connector staying with the chip it leads to. */
  function Journey(wrap) {
    const ol = wrap.querySelector('.jr'), note = wrap.querySelector('.jr-note');
    let list = [], on = -1, lastW = -1, seen = {};
    const HINT = '<span class="jr-hint">Select a step to see what happens there.</span>';
    function render(items) {
      list = items; on = -1; seen = {};
      ol.innerHTML = items.map(function (it, i) {
        const c = i ? '<span class="jr-c" aria-hidden="true"><svg class="jr-ln" viewBox="0 0 100 10" preserveAspectRatio="none"><line x1="0" y1="5" x2="100" y2="5"/></svg><svg class="jr-tip" viewBox="0 0 6 10"><path d="M1 1.5 5 5 1 8.5"/></svg><i class="pk"></i></span>' : '';
        const runs = it.runs ? '<span class="jr-r ' + runsKind(it.runs) + '"><span class="sr-only">, runs: </span>' + esc(it.runs) + '</span>' : '';
        const mk = (it.build ? '<span class="jr-mk bh"><span class="sr-only">, </span>' + ICON(I.spark, 11) + 'Build help</span>' : '') + (it.data ? '<span class="jr-mk da"><span class="sr-only">, </span>' + ICON(I.answer, 11) + 'Data agent</span>' : '');
        return '<li class="jr-i' + (it.build ? ' has-bh' : '') + (it.data ? ' has-da' : '') + '">' + c + '<button type="button" class="jr-chip" data-i="' + i + '" aria-pressed="false"><span class="jr-ic">' + ICON(I[it.icon] || I.db, 15) + '</span><span class="jr-tx"><span class="jr-l">' + esc(it.label) + '</span>' + runs + '</span>' + mk + '</button></li>';
      }).join('');
      note.innerHTML = HINT;
      fit(true);
    }
    function chips() { return [].slice.call(ol.querySelectorAll('.jr-chip')); }
    function lis() { return [].slice.call(ol.children); }
    function fit(force) {
      const w = wrap.clientWidth; if (!force && w === lastW) return; lastW = w;
      ol.classList.remove('wrapd');
      if (ol.scrollWidth > ol.clientWidth + 1) ol.classList.add('wrapd');
    }
    function packet(li, rev) {
      const c = li && li.querySelector('.jr-c'); if (!c || reduce.matches) return;
      c.classList.remove('run', 'rev'); void c.offsetWidth; c.classList.add('run'); if (rev) c.classList.add('rev');
    }
    /* chips already visited show as done; a connector is lit once both of its ends have been reached */
    function paint() {
      const v = function (k) { return !!seen[k] || k === on; };
      chips().forEach(function (b, k) { b.classList.toggle('on', k === on); b.classList.toggle('done', !!seen[k] && k !== on); });
      lis().forEach(function (li, k) { const c = li.querySelector('.jr-c'); if (c) c.classList.toggle('lit', v(k) && v(k - 1)); });
    }
    function explain(i) {
      const it = list[i], agents = cur && cur.state.agents, hand = cur ? handFor(cur.def, it.label) : '';
      let t = '<b>' + esc(it.label) + '.</b> ' + esc(it.what) + (it.runs ? ' <span class="jr-run">Runs: ' + esc(it.runs) + '.</span>' : '');
      if (!agents && hand) t += ' <span class="jr-hand"><b>By hand:</b> ' + esc(hand) + '</span>';
      if (agents && it.build) t += ' <span class="jr-agt">' + agb('build') + esc(it.build) + '</span>';
      if (agents && it.data) t += ' <span class="jr-agt">' + agb('data') + esc(it.data) + '</span>';
      note.innerHTML = t;
    }
    const api = {
      set: render,
      /* light chip i; the packet runs along every connector from the last lit chip, in the direction of travel */
      go: function (i, cls) {
        const from = on; if (from >= 0) seen[from] = 1;
        on = i; const b = chips()[i]; if (b) b.classList.remove('bad');
        paint(); if (cls && b) b.classList.add(cls);
        if (from < 0 || from === i) return;
        const L = lis();
        if (i > from) for (let k = from + 1; k <= i; k++) packet(L[k], false);
        else for (let k = from; k > i; k--) packet(L[k], true);
      },
      bad: function (i) { const b = chips()[i]; if (b) b.classList.add('bad'); },
      done: function () { if (on >= 0) seen[on] = 1; on = -1; paint(); },
      reset: function () { on = -1; seen = {}; chips().forEach(function (b) { b.classList.remove('on', 'done', 'bad'); }); lis().forEach(function (li) { const c = li.querySelector('.jr-c'); if (c) c.classList.remove('lit', 'run', 'rev'); }); },
      fit: fit,
      refresh: function () { const p = ol.querySelector('[aria-pressed="true"]'); if (p) explain(+p.getAttribute('data-i')); }
    };
    ol.addEventListener('click', function (e) {
      const b = e.target.closest('.jr-chip'); if (!b) return;
      const i = +b.getAttribute('data-i'), was = b.getAttribute('aria-pressed') === 'true';
      chips().forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
      if (was) { note.innerHTML = HINT; return; }
      b.setAttribute('aria-pressed', 'true'); explain(i);
    });
    if ('ResizeObserver' in window) new ResizeObserver(function () { fit(false); }).observe(wrap);
    return api;
  }

  /* ======================= 4. BY HAND | WITH AGENTS ======================= */
  /* One switch, the same on every stage and on the explorer's "How it gets built" lane. By hand (the default): the work
     I do myself at each step. With agents: what agents take off me, and what I still own. */
  const HONEST = 'The foundations were built by hand. Newer work and changes now run through my agent suite, with me reviewing.';
  function modePanel(def, agents) {
    if (!agents) {
      return '<div class="agl-head"><h3 id="stg-agl-h">By hand</h3><p class="mp-sub">I can do every step myself. This is the work at each one.</p></div>' +
        '<ol class="hand-list">' + (def.hand || []).map(function (h) { return '<li><b>' + esc(h[0]) + '</b><p>' + esc(h[1]) + '</p></li>'; }).join('') + '</ol>';
    }
    const first = { build: 'Agents take', data: 'Agents take', auto: 'Runs by itself', person: 'Prepared for me' };
    return '<div class="agl-head"><h3 id="stg-agl-h">With agents</h3><ul class="agl-key" aria-label="Key">' +
      ['build', 'data', 'auto', 'person'].map(function (k) { return '<li>' + agb(k) + '<span>' + AG[k].key + '</span></li>'; }).join('') + '</ul></div>' + chainMini() +
      '<ol class="agl-list">' + def.agents.map(function (a) {
        return '<li>' + agb(a[0]) + '<p class="b"><b>' + first[a[0]] + '</b>' + esc(a[1]) + '</p><span class="arr" aria-hidden="true">→</span><p class="n"><b>I still own</b>' + esc(a[2]) + '</p></li>';
      }).join('') + '</ol><p class="agl-foot">' + ICON(I.person, 14) + 'Agents help build it and read from it; they are never a step in it. A person approves anything that reaches production.</p><p class="agl-hon">' + HONEST + '</p>';
  }
  function setAgents(on, silent) {
    if (!cur) return;
    cur.state.agents = on ? 1 : 0;
    const f = cur.frame;
    f.classList.toggle('agents-on', on);
    f.querySelector('#stg-agl').innerHTML = modePanel(cur.def, on);
    [].forEach.call(f.querySelectorAll('.mode [data-mode]'), function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-mode') === 'agents') === on)); });
    cur.journey.fit(true); cur.journey.refresh();
    try { sessionStorage.setItem('nn-mode', on ? 'agents' : 'hand'); } catch (e) { /* storage can be blocked */ }
    if (!silent) { try { document.dispatchEvent(new CustomEvent('nn-mode', { detail: on })); } catch (e) { /* old browsers */ } }
    if (!silent) { writeURL(); live(on ? 'With agents: build help and data agents marked on the journey, with what agents take and what I still own.' : 'By hand: the work I do myself at each step.'); }
  }
  /* the switch: two buttons with aria-pressed; arrow keys move between them */
  function modeSwitch(label) {
    return '<div class="mode" role="group" aria-label="' + label + '"><button type="button" data-mode="hand" aria-pressed="true">' + ICON(I.wrench, 14) + 'By hand</button><button type="button" data-mode="agents" aria-pressed="false">' + ICON(I.spark, 14) + 'With agents</button></div>';
  }

  /* ======================= 4b. THE CHAIN OF COMMAND ======================= */
  /* Me → overseer → specialist agents → sub-agents → gates. Generic roles only. The compact line sits in every
     "With agents" panel; the full version (delivery suite stage) sends a task down and brings the result back up. */
  const CHAIN = [
    ['me', 'Me', 'I set the goal and the gates, and talk only to the overseer.', []],
    ['ov', 'Overseer', 'One per project. It plans, keeps the project’s state and brings me only my decisions.', []],
    ['sp', 'Specialist agents', 'Each takes a scoped part of the work.', ['Analyst', 'Builder', 'Reviewer', 'Tester']],
    ['sub', 'Sub-agents', 'Short-lived workers for one slice, then gone.', ['One page', 'One measure', 'One check']],
    ['gt', 'Gates', 'Nothing reaches production until all three pass.', ['Parity', 'Review', 'My sign-off']]
  ];
  function chainMini() {
    return '<p class="cc-mini"><span class="sr-only">Chain of command: </span>' + CHAIN.map(function (c) { return '<b>' + c[1] + '</b>'; }).join('<span aria-hidden="true">→</span>') + '<span aria-hidden="true">→</span><span>production</span></p>';
  }
  function chainFull() {
    return '<section class="cc" aria-labelledby="cc-h"><div class="cc-head"><div><h3 id="cc-h">Chain of command</h3><p>Who hands work to whom. A task goes down; results come back up through the same chain.</p></div>' +
      '<button type="button" class="btn secondary small" id="cc-run">' + PLAY + '<span>Send a task down</span></button></div>' +
      '<ol class="cc-list">' + CHAIN.map(function (c) {
        return '<li class="cc-l cc-' + c[0] + '"><span class="cc-n">' + c[1] + '</span><span class="cc-d">' + c[2] + '</span>' +
          (c[3].length ? '<span class="cc-roles">' + c[3].map(function (r) { return '<i>' + r + '</i>'; }).join('') + '</span>' : '') + '<span class="cc-tok" aria-hidden="true"></span></li>';
      }).join('') + '</ol><p class="cc-status" id="cc-status" aria-live="polite"></p></section>';
  }
  /* the animated moment: down to a sub-agent, back up to me, through the gates */
  function chainRun(root, ctx) {
    const L = [].slice.call(root.querySelectorAll('.cc-l')), btn = root.querySelector('#cc-run'), st = root.querySelector('#cc-status');
    const S = [
      [0, '↓ task', 'I ask the overseer for a change, and say what done looks like.'],
      [1, '↓ plan', 'The overseer plans it, updates the state document and hands the builder one slice.'],
      [2, '↓ slice', 'The builder splits the slice into pieces it can hand out.'],
      [3, '↓ one page', 'A sub-agent builds one page, then reports back and is gone.'],
      [2, '↑ result', 'The builder assembles the pieces. A separate reviewer and tester check them.'],
      [4, '↑ checks', 'The gates run: parity, review, and my sign-off still to come.'],
      [1, '↑ summary', 'The overseer checks what came back and keeps the state document up to date.'],
      [0, '↑ decision', 'It brings me one decision: sign off this change, or not. Nothing else reaches me.']
    ];
    function show(k) {
      const s = S[k];
      L.forEach(function (li, i) { li.classList.toggle('on', i === s[0]); li.classList.toggle('up', i === s[0] && s[1].charAt(0) === '↑'); li.querySelector('.cc-tok').textContent = i === s[0] ? s[1] : ''; });
      st.textContent = s[2];
    }
    btn.addEventListener('click', function () {
      if (isBusy(btn)) return;
      if (ctx.reduce) { st.innerHTML = S.map(function (s, i) { return (i + 1) + '. ' + s[2]; }).join(' '); L.forEach(function (li) { li.classList.add('seen'); }); return; }
      busy(btn, true); btn.querySelector('span').textContent = 'Running…';
      S.forEach(function (s, k) { ctx.later(function () { show(k); }, k * 1100); });
      ctx.later(function () { L.forEach(function (li) { li.classList.remove('on', 'up'); li.querySelector('.cc-tok').textContent = ''; }); busy(btn, false); btn.querySelector('span').textContent = 'Send another task'; }, S.length * 1100 + 900);
    });
  }

  /* ======================= 5. URL STATE ======================= */
  const KEYS = ['stage', 'tab', 'sc', 'mode', 'agents', 'step'];
  function readURL() {
    const q = new URLSearchParams(location.search), s = {};
    ['stage', 'tab', 'sc', 'step'].forEach(function (k) { if (q.has(k)) s[k] = q.get(k); });
    if (q.has('mode') || q.has('agents')) s.agents = q.get('mode') === 'agents' || q.get('agents') === '1' ? 1 : 0;
    if (s.step != null) s.step = +s.step || 0;
    return s;
  }
  function writeURL(clear) {
    const u = new URL(location.href), q = u.searchParams;
    KEYS.forEach(function (k) { q.delete(k); });
    q.delete('try');
    if (!clear && cur && !cur.tour) {
      q.set('stage', cur.id);
      ['tab', 'sc', 'step'].forEach(function (k) { const v = cur.state[k]; if (v != null && v !== '') q.set(k, v); });
      if (cur.state.agents) q.set('mode', 'agents');
    }
    const s = q.toString();
    history.replaceState(history.state, '', u.pathname + (s ? '?' + s : '') + u.hash);
  }
  function live(t) { const l = $('stg-live'); if (l) { l.textContent = ''; setTimeout(function () { l.textContent = t; }, 30); } }

  /* ======================= 6. FRAME ======================= */
  function frameHTML(def, overlay) {
    return '<header class="stg-head"><span class="ico" aria-hidden="true">' + ICON(I[def.icon] || I.db) + '</span>' +
      '<div class="t"><p class="eyebrow" id="stg-eb">' + esc(def.eyebrow) + '</p><h2 id="stg-t" tabindex="-1">' + esc(def.title) + '</h2></div>' +
      '<div class="stg-tools">' + modeSwitch('How the work is done') +
      '<button type="button" class="btn ghost small" id="stg-copy">' + ICON(I.link, 15) + '<span>Copy link</span></button></div>' +
      '<button type="button" class="btn secondary small stg-x" id="stg-close">Close</button></header>' +
      '<div class="stg-body"><section class="jr-wrap" aria-labelledby="stg-jr-h"><div class="jr-top"><h3 id="stg-jr-h">The journey</h3><p class="jr-sub-h">The systems this touches, in order, and what runs each one.</p>' +
      '<p class="jr-sub-a">Agents sit beside the journey, never in it: <span>' + ICON(I.spark, 11) + 'Build help</span> above a step an agent helps build or change, reviewed by me; <span>' + ICON(I.answer, 11) + 'Data agent</span> below governed data it reads.</p></div>' +
      '<ol class="jr" aria-label="The journey, in order"></ol><p class="jr-note" aria-live="polite"></p></section>' +
      '<section class="agl" id="stg-agl" aria-labelledby="stg-agl-h" aria-live="polite"></section>' +
      '<div class="stg-hero" id="stg-hero"></div></div><p class="sr-only" id="stg-live" role="status" aria-live="polite"></p>';
  }
  function wire(frame) {
    frame.querySelector('#stg-close').addEventListener('click', function () { close(); });
    const mb = [].slice.call(frame.querySelectorAll('.mode [data-mode]'));
    mb.forEach(function (b, i) {
      b.addEventListener('click', function () { setAgents(b.getAttribute('data-mode') === 'agents'); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault(); const o = mb[1 - i]; o.focus(); setAgents(o.getAttribute('data-mode') === 'agents');
      });
    });
    frame.querySelector('#stg-copy').addEventListener('click', function () {
      const b = this, url = location.href, done = function (ok) {
        b.querySelector('span').textContent = ok ? 'Link copied' : 'Copy failed';
        live(ok ? 'Link to this view copied.' : 'Could not copy. The address bar has the link to this view.');
        setTimeout(function () { if (b.isConnected) b.querySelector('span').textContent = 'Copy link'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
      else done(false);
    });
  }

  /* ======================= 7. OPEN AND CLOSE ======================= */
  function ctxFor(c) {
    return {
      id: c.id, state: c.state, root: c.frame, reduce: reduce.matches, esc: esc, ICON: ICON, I: I, OK: OK, BAD: BAD, PLAY: PLAY, busy: busy, isBusy: isBusy,
      $: function (id) { return c.frame.querySelector('#' + id); },
      J: c.journey, live: live,
      set: function (o) { Object.keys(o).forEach(function (k) { if (o[k] == null) delete c.state[k]; else c.state[k] = o[k]; }); if (cur === c) writeURL(); },
      later: function (fn, ms) { const t = setTimeout(function () { if (cur === c) fn(); }, ms); c.timers.push(t); return t; },
      every: function (fn, ms) { const t = setInterval(fn, ms); c.timers.push(t); return t; },
      clear: function () { c.timers.forEach(function (t) { clearTimeout(t); clearInterval(t); }); c.timers.length = 0; },
      journey: function (items) { c.journey.set(items); }
    };
  }
  function unmount() {
    if (!cur) return;
    cur.timers.forEach(function (t) { clearTimeout(t); clearInterval(t); });
    if (cur.api && cur.api.destroy) try { cur.api.destroy(); } catch (e) { /* keep closing */ }
  }
  function mountInto(c) {
    const def = c.def, f = c.frame;
    f.innerHTML = frameHTML(def, c.mode === 'overlay');
    wire(f);
    c.journey = Journey(f.querySelector('.jr-wrap'));
    c.journey.set(typeof def.journey === 'function' ? def.journey(c.state) : def.journey);
    cur = c;
    setAgents(!!c.state.agents, true);
    c.api = def.mount(f.querySelector('#stg-hero'), ctxFor(c)) || {};
    writeURL();
  }
  function trap(e) {
    if (!cur || cur.mode !== 'overlay') return;
    if (e.key === 'Escape') {
      if (e.defaultPrevented || (e.target.closest && e.target.closest('.chart'))) return;
      e.preventDefault(); close(); return;
    }
    if (e.key !== 'Tab') return;
    const f = [].filter.call(cur.dlg.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])'), function (x) {
      return !x.disabled && x.offsetParent !== null && !x.closest('[hidden]') && x.getAttribute('tabindex') !== '-1';
    });
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !cur.dlg.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !cur.dlg.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
  }
  function inlineKeys(e) {
    if (e.key !== 'Escape' || e.defaultPrevented || !cur || cur.mode !== 'inline') return;
    if (e.target.closest && e.target.closest('.chart')) return;
    e.preventDefault(); close();
  }
  /* open(id, { opener, host (inline element), state, onClose, tour }) */
  function open(id, o) {
    o = o || {};
    const def = DEFS[id]; if (!def) return;
    const state = Object.assign({}, o.state || {});
    if (state.agents == null) { try { state.agents = sessionStorage.getItem('nn-mode') === 'agents' ? 1 : 0; } catch (e) { state.agents = 0; } }
    const mode = o.host ? 'inline' : 'overlay';
    /* already open in the same place: swap the content, keep the opener (never an overlay in an overlay) */
    if (cur && cur.mode === mode && (mode === 'overlay' || cur.host === o.host)) {
      unmount();
      const c = { id: id, def: def, mode: mode, frame: cur.frame, host: cur.host, dlg: cur.dlg, ov: cur.ov, opener: o.opener || cur.opener, onClose: cur.onClose, state: state, timers: [], tour: cur.tour };
      mountInto(c);
      if (!o.keepFocus) c.frame.querySelector('#stg-t').focus({ preventScroll: true });
      if (mode === 'overlay') c.ov.scrollTop = 0; else if (!o.noScroll) c.host.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
      return c;
    }
    if (cur) close(true);
    const c = { id: id, def: def, mode: mode, opener: o.opener || document.activeElement, onClose: o.onClose, state: state, timers: [], tour: o.tour || null };
    if (mode === 'inline') {
      c.host = o.host; c.frame = o.host;
      c.host.classList.add('stg', 'stg-inline'); c.host.setAttribute('aria-labelledby', 'stg-t');
      mountInto(c);
      c.host.hidden = false; c.host.classList.remove('enter'); void c.host.offsetWidth; c.host.classList.add('enter');
      c.host.addEventListener('keydown', inlineKeys);
      if (!o.noScroll) c.host.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    } else {
      const ov = document.createElement('div');
      ov.className = 'stg-ov'; ov.id = 'stg-ov';
      ov.innerHTML = '<div class="stg-dlg stg" role="dialog" aria-modal="true" aria-labelledby="stg-t" aria-describedby="stg-eb"><div class="stg-frame"></div></div>';
      document.body.appendChild(ov);
      c.ov = ov; c.dlg = ov.firstChild; c.frame = c.dlg.firstChild;
      [].forEach.call(document.body.children, function (el) { if (el !== ov && !el.hasAttribute('inert') && el.tagName !== 'SCRIPT') { el.setAttribute('inert', ''); el.setAttribute('data-stg-inert', ''); } });
      document.documentElement.classList.add('stg-lock');
      ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
      document.addEventListener('keydown', trap, true);
      mountInto(c);
      requestAnimationFrame(function () { ov.classList.add('in'); });
    }
    c.frame.querySelector('#stg-t').focus({ preventScroll: true });
    return c;
  }
  function close(silent) {
    if (!cur) return;
    const c = cur;
    unmount();
    if (c.tour) endTour(true);
    cur = null;
    if (c.mode === 'overlay') {
      document.removeEventListener('keydown', trap, true);
      [].forEach.call(document.querySelectorAll('[data-stg-inert]'), function (el) { el.removeAttribute('inert'); el.removeAttribute('data-stg-inert'); });
      document.documentElement.classList.remove('stg-lock');
      c.ov.remove();
    } else {
      c.host.removeEventListener('keydown', inlineKeys);
      c.host.hidden = true; c.host.innerHTML = '';
    }
    writeURL(true);
    if (c.onClose) c.onClose(silent);
    if (silent) return;
    const op = typeof c.opener === 'function' ? c.opener() : c.opener; /* a function when the opener may be re-rendered */
    const o = op && document.contains(op) && op.offsetParent !== null ? op : null;
    if (o) { o.focus({ preventScroll: true }); if (c.mode === 'inline') o.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'center' }); }
  }

  /* ======================= 8. THE GUIDED TOUR ======================= */
  /* Five steps in about a minute. It runs inside the stage overlay (no overlay on an overlay): a bar at the foot says
     where you are, Next and Back move, Escape or "End the tour" leaves. Reduced motion: nothing advances by itself. */
  const TOUR = [
    { stage: 'platform', t: 'The platform', d: 'One record travels from a source to a leader, through every layer of the platform.', run: 'follow', ms: 13500 },
    { stage: 'platform', t: 'Lineage', d: 'Where does a number come from? The same path, stepped back from the report to the source.', run: 'trace', ms: 11000 },
    { stage: 'auto', t: 'An approval run', d: 'A payment approval runs itself: routed, approved, posted to finance and logged, with a live feed.', run: 'run', ms: 11500 },
    { stage: 'auto', state: { agents: 1 }, t: 'By hand, and with agents', d: 'I can do every step by hand. With agents, they help build and change the flows, never run them, and a person still approves.', ms: 10000 },
    { end: true, t: 'Career', d: 'That is the tour. My career reads like the CV, and each achievement opens its demo.', ms: 0 }
  ];
  let tourAt = -1, tourTimer = 0;
  function tourBar() {
    const s = TOUR[tourAt];
    return '<div class="stg-tour" role="group" aria-label="Guided tour"><p><span class="n">' + (tourAt + 1) + ' of ' + TOUR.length + '</span><b>' + esc(s.t) + '.</b> ' + esc(s.d) + '</p>' +
      '<div class="tb"><button type="button" class="btn ghost small" id="tour-back"' + (tourAt ? '' : ' aria-disabled="true"') + '>Back</button>' +
      (s.end ? '<a class="btn primary small" href="career.html">Open the Career page</a>' : '<button type="button" class="btn primary small" id="tour-next">Next</button>') +
      '<button type="button" class="btn secondary small" id="tour-end">' + (s.end ? 'Close' : 'End the tour') + '</button></div>' +
      (reduce.matches || s.end ? '' : '<i class="tprog" style="--ms:' + s.ms + 'ms"></i>') + '</div>';
  }
  function tourGo(i) {
    clearTimeout(tourTimer);
    tourAt = i; const s = TOUR[i];
    if (s.end) {
      unmount();
      const f = cur.frame;
      f.innerHTML = '<header class="stg-head"><span class="ico" aria-hidden="true">' + ICON(I.person) + '</span><div class="t"><p class="eyebrow" id="stg-eb">Guided tour</p><h2 id="stg-t" tabindex="-1">Next: the Career page</h2></div></header>' +
        '<div class="stg-body"><div class="tour-end"><p>The Career page reads like my CV: roles, dates and outcomes, with a Skim view for a quick read and a Story view where each achievement opens its demo, in place.</p>' +
        '<ul class="tour-list"><li>Platform explorer: the whole system on one map.</li><li>Projects: eight anonymised case studies, each with a demo.</li><li>Press Ctrl K (or ⌘K) on any page to jump anywhere.</li></ul></div></div><p class="sr-only" id="stg-live" role="status" aria-live="polite"></p>';
      cur.id = '_end'; cur.api = {};
    } else {
      if (cur.id !== s.stage) open(s.stage, { state: { agents: 0 }, keepFocus: true });
      setAgents(!!(s.state && s.state.agents), true);
      if (s.run && cur.api && cur.api[s.run]) cur.api[s.run]();
    }
    const old = cur.dlg.querySelector('.stg-tour'); if (old) old.remove();
    cur.dlg.insertAdjacentHTML('beforeend', tourBar());
    const nx = $('tour-next'), bk = $('tour-back'), en = $('tour-end');
    if (nx) nx.addEventListener('click', function () { tourGo(tourAt + 1); });
    bk.addEventListener('click', function () { if (tourAt) tourGo(tourAt - 1); });
    en.addEventListener('click', function () { close(); });
    (nx || en).focus({ preventScroll: true });
    live('Tour step ' + (i + 1) + ' of ' + TOUR.length + ': ' + s.t + '. ' + s.d);
    if (!reduce.matches && !s.end) tourTimer = setTimeout(function () { if (cur && cur.tour) tourGo(tourAt + 1); }, s.ms);
  }
  function tour(opener) {
    const first = TOUR[0];
    open(first.stage, { opener: opener, state: { agents: 0 }, tour: true });
    cur.tour = true; writeURL(true);
    cur.dlg.classList.add('touring');
    tourGo(0);
  }
  function endTour() { clearTimeout(tourTimer); tourAt = -1; }

  window.NNStage = {
    define: function (id, def) { DEFS[id] = def; },
    open: open, close: close, tour: tour, readURL: readURL,
    get current() { return cur ? cur.id : null; },
    get mode() { return cur ? cur.mode : null; },
    agents: function (on) { if (cur && !cur.tour) setAgents(on == null ? !cur.state.agents : !!on); },
    lib: { esc: esc, ICON: ICON, I: I, OK: OK, BAD: BAD, PLAY: PLAY, busy: busy, isBusy: isBusy, agb: agb, chainFull: chainFull, chainRun: chainRun, chainMini: chainMini }
  };
})();
