/* Shared behaviour: theme toggle, header state, mobile menu, timeline tabs, the stage loader, the command palette,
   count-up figures and the tour button. The no-flash theme setter is inlined in each page's <head>. */
(function () {
  'use strict';
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var NN = window.NN = window.NN || {};
  /* where the site lives (/portfolio/ on GitHub Pages, / locally, and any depth for the 404 page) */
  var me = document.currentScript && document.currentScript.src, BASE = me ? me.replace(/assets\/site\.js(\?.*)?$/, '') : '';

  /* ---- a hello for anyone who opens the console ---- */
  try {
    console.log('%cHello, curious one.%c\nThis is a static site: plain HTML, CSS and a little JavaScript, no framework, no trackers.\nPress Ctrl K (or ⌘K) to jump anywhere. If you like what you see, say hello: nyall_negm@hotmail.co.uk · https://www.linkedin.com/in/nyall-negm/',
      'font:600 15px Inter,system-ui,sans-serif;color:#2445d4', 'font:13px/1.6 Inter,system-ui,sans-serif');
  } catch (e) { /* no console, no problem */ }

  /* ---- theme toggle (storage can be blocked, so always guard it) ---- */
  var tb = document.getElementById('theme');
  function syncTheme() { if (tb) tb.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark')); }
  function setTheme(t) {
    root.setAttribute('data-theme', t); syncTheme();
    try { localStorage.setItem('nn-theme', t); } catch (e) { /* ignore */ }
  }
  if (tb) { tb.addEventListener('click', function () { setTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'); }); syncTheme(); }

  /* ---- header border once scrolled ---- */
  var bar = document.getElementById('top-bar');
  if (bar) {
    var onScroll = function () { bar.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- mobile menu ---- */
  var mb = document.getElementById('menu-btn'), list = document.getElementById('nav-list');
  if (mb && list) {
    var close = function () { list.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); };
    mb.addEventListener('click', function () { var open = list.classList.toggle('open'); mb.setAttribute('aria-expanded', String(open)); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && list.classList.contains('open')) { close(); mb.focus(); } });
    list.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 900) close(); });
  }

  /* ---- "how it works" diagrams light up once they scroll into view ---- */
  var flows = document.querySelectorAll('.flowd');
  if (flows.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.4 });
      [].forEach.call(flows, function (f) { io.observe(f); });
    } else [].forEach.call(flows, function (f) { f.classList.add('in'); });
  }

  /* ---- timeline tabs (arrow keys, Home, End) ---- */
  var tabs = [].slice.call(document.querySelectorAll('.stop'));
  function select(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault(); select(tabs[(j + tabs.length) % tabs.length], true);
    });
  });

  /* ---- career: Skim (the one-page CV) or Story (the same CV, with the demos) ---- */
  var cv = document.querySelector('.cv[data-view]');
  if (cv) {
    var vb = [].slice.call(cv.querySelectorAll('.vsw [data-view]'));
    var view = function (v, user) {
      cv.setAttribute('data-view', v);
      vb.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === v)); });
      if (!user) return;
      try { localStorage.setItem('nn-cv-view', v); } catch (e) { /* ignore */ }
      var u = new URL(location.href); if (v === 'story') u.searchParams.set('view', 'story'); else u.searchParams.delete('view');
      history.replaceState(history.state, '', u.pathname + u.search + u.hash);
      var l = document.getElementById('cv-live'); if (l) l.textContent = v === 'story' ? 'Story view: each achievement links to its demo, and each skill to its evidence.' : 'Skim view: the one-page CV.';
    };
    var want = new URLSearchParams(location.search).get('view'), saved = null;
    try { saved = localStorage.getItem('nn-cv-view'); } catch (e) { /* ignore */ }
    view(want === 'story' || want === 'skim' ? want : saved === 'story' ? 'story' : 'skim');
    vb.forEach(function (b) { b.addEventListener('click', function () { view(b.getAttribute('data-view'), true); }); });
    var pb = document.getElementById('cv-print'); if (pb) pb.addEventListener('click', function () { window.print(); });
  }

  /* ======================= THE STAGE LOADER ======================= */
  /* The stages (and their styles) load the first time one opens, so most visits never download them. */
  var loaded = {};
  function script(src) {
    if (!loaded[src]) loaded[src] = new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = BASE + src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
    });
    return loaded[src];
  }
  function css(href) {
    if (!loaded[href]) loaded[href] = new Promise(function (res) {
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = BASE + href; l.onload = res; l.onerror = res; document.head.appendChild(l);
    });
    return loaded[href];
  }
  var DEPS = { platform: ['hp'], exec: ['hp', 'demo'], qa: ['hp'] };
  NN.loadStage = function (id) {
    var need = DEPS[id] || [], dep = Promise.resolve();
    if (need.indexOf('hp') >= 0 && !window.HP) dep = script('assets/hp-data.js');
    if (need.indexOf('demo') >= 0 && !window.HPDemo) dep = dep.then(function () { return script('assets/demo.js'); });
    return Promise.all([css('assets/stage.css'), script('assets/stage.js').then(function () { return script('assets/stages.js'); }), dep]);
  };
  var STAGES = [
    ['platform', 'Group data platform', 'follow the data lineage'], ['auto', 'Automation suite', 'approval run data sync flows'],
    ['control', 'Agent control room', 'run a project overseer'], ['suite', 'Agentic delivery suite', 'run a change parity check'],
    ['exec', 'Executive reporting', 'bi demo lineage metric'], ['apps', 'Order-tracking app', 'business app orders audit'],
    ['qa', 'Data Q&A desk', 'question answer recheck'], ['workbook', 'Workbook rebuilds', 'excel spreadsheet parity']
  ];
  /* open a stage in place: inline on the explorer, as an overlay anywhere else */
  NN.openStage = function (id, o) {
    o = o || {};
    if (NN.stageHost) return NN.stageHost(id, o);
    if (id === 'exec' && document.getElementById('demo-root')) { location.href = BASE + 'explore.html?node=exec'; return Promise.resolve(); }
    return NN.loadStage(id).then(function () { window.NNStage.open(id, o); });
  };
  function urlState(q) {
    var s = {};
    ['tab', 'sc', 'step'].forEach(function (k) { if (q.has(k)) s[k] = k === 'step' ? +q.get(k) || 0 : q.get(k); });
    if (q.has('mode') || q.has('agents')) s.agents = q.get('mode') === 'agents' || q.get('agents') === '1' ? 1 : 0;
    return s;
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-stage]');
    if (b) { e.preventDefault(); NN.openStage(b.getAttribute('data-stage'), { opener: b }); return; }
    var t = e.target.closest && e.target.closest('[data-tour]');
    if (t) { e.preventDefault(); NN.loadStage('platform').then(function () { window.NNStage.tour(t); }); }
  });
  /* a shared link to a stage view (?stage=...) opens it once every script on the page has run */
  document.addEventListener('DOMContentLoaded', function () {
    var q = new URLSearchParams(location.search), id = q.get('stage');
    if (id && !NN.stageHost && STAGES.some(function (s) { return s[0] === id; })) NN.openStage(id, { state: urlState(q) });
  });

  /* ======================= COUNT-UP FIGURES ======================= */
  /* The page ships the final numbers; with motion allowed they count up once, when they scroll into view. */
  var counts = [].slice.call(document.querySelectorAll('[data-count]'));
  if (counts.length && !reduce.matches && 'IntersectionObserver' in window) {
    var run = function (el) {
      var to = +el.getAttribute('data-count'), pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '', t0 = performance.now();
      (function f(t) {
        var k = Math.min(1, (t - t0) / 1100), v = Math.round(to * (1 - Math.pow(1 - k, 3)));
        el.textContent = pre + v + suf; if (k < 1) requestAnimationFrame(f);
      })(t0);
    };
    var cio = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { cio.unobserve(e.target); run(e.target); } }); }, { threshold: 0.6 });
    counts.forEach(function (el) { el.textContent = (el.getAttribute('data-pre') || '') + '0' + (el.getAttribute('data-suf') || ''); cio.observe(el); });
  }

  /* ======================= COMMAND PALETTE ======================= */
  /* Ctrl K, ⌘K or "/" opens it. A combobox over a list of commands; arrow keys move, Enter runs, Escape closes. */
  var mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  var kb = document.getElementById('cmdk-btn');
  if (kb) { var k = kb.querySelector('kbd'); if (k && mac) k.textContent = '⌘K'; kb.setAttribute('aria-keyshortcuts', mac ? 'Meta+K /' : 'Control+K /'); }
  function go(href) { location.href = BASE + href; }
  function commands() {
    var dark = root.getAttribute('data-theme') === 'dark', C = [];
    [['Home', 'index.html'], ['Platform explorer', 'explore.html'], ['Projects', 'projects.html'], ['Career: the interactive CV', 'career.html'], ['BI demo', 'demo.html'], ['How I work with AI', 'how-i-work.html'], ['Code', 'projects.html#code'], ['How this site is built', 'how-i-work.html#built']]
      .forEach(function (p) { C.push({ g: 'Pages', t: p[0], run: function () { go(p[1]); } }); });
    STAGES.forEach(function (s) { C.push({ g: 'Try a demo', t: s[1], k: s[2], run: function (o) { NN.openStage(s[0], { opener: o }); } }); });
    [['group-data-platform', 'Group data platform'], ['automation-suite', 'Automation suite'], ['agent-control-room', 'Agent control room'], ['agentic-delivery-suite', 'Agentic delivery suite'],
      ['executive-reporting', 'Executive reporting'], ['order-tracking-app', 'Order-tracking app'], ['data-qa-desk', 'Data Q&A desk'], ['workbook-rebuilds', 'Workbook rebuilds'],
      ['money-ledger', 'Money Ledger'], ['lean-agent-toolkit', 'Lean agent toolkit'], ['the-nook', 'The Nook'], ['media-library-tools', 'Media library tools'], ['3d-models', '3D models']]
      .forEach(function (c, i) { C.push({ g: i < 8 ? 'Case studies' : 'Personal projects', t: c[1], k: 'read case study', run: function () { go('projects.html#' + c[0]); } }); });
    C.push({ g: 'Actions', t: 'Request my full CV', k: 'email cv download', run: function () { location.href = 'mailto:nyall_negm@hotmail.co.uk?subject=CV%20request'; } });
    C.push({ g: 'Actions', t: 'Take the 60-second tour', k: 'guided tour', run: function (o) { NN.loadStage('platform').then(function () { window.NNStage.tour(o); }); } });
    C.push({ g: 'Actions', t: dark ? 'Switch to light theme' : 'Switch to dark theme', k: 'theme dark light mode', run: function () { setTheme(dark ? 'light' : 'dark'); } });
    var agents = false; try { agents = sessionStorage.getItem('nn-mode') === 'agents'; } catch (e) { /* ignore */ }
    C.push({ g: 'Actions', t: agents ? 'Show demos by hand' : 'Show demos with agents', k: 'by hand with agents ai mode toggle', run: function () {
      try { sessionStorage.setItem('nn-mode', agents ? 'hand' : 'agents'); } catch (e) { /* ignore */ }
      if (window.NNStage && window.NNStage.current) window.NNStage.agents(!agents);
    } });
    C.push({ g: 'Actions', t: 'Email me', k: 'contact', run: function () { location.href = 'mailto:nyall_negm@hotmail.co.uk'; } });
    C.push({ g: 'Actions', t: 'LinkedIn', k: 'contact profile', run: function () { location.href = 'https://www.linkedin.com/in/nyall-negm/'; } });
    return C;
  }
  var pal = null, opener = null, items = [], act = 0;
  function build() {
    pal = document.createElement('div');
    pal.className = 'cmdk-ov'; pal.hidden = true;
    pal.innerHTML = '<div class="cmdk" role="dialog" aria-modal="true" aria-label="Jump to anything"><div class="cmdk-in">' +
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/></svg>' +
      '<input id="cmdk-q" type="text" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" placeholder="Jump to a page, demo or case study" aria-label="Search commands">' +
      '<kbd>Esc</kbd></div><ul id="cmdk-list" role="listbox" aria-label="Commands"></ul><p class="cmdk-foot" aria-hidden="true"><span>↑ ↓ to move</span><span>Enter to open</span><span>Esc to close</span></p>' +
      '<p class="sr-only" id="cmdk-live" role="status" aria-live="polite"></p></div>';
    document.body.appendChild(pal);
    var q = pal.querySelector('#cmdk-q');
    q.addEventListener('input', render);
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); move(e.key === 'ArrowDown' ? 1 : -1); }
      else if (e.key === 'Home' && e.ctrlKey) { e.preventDefault(); act = 0; mark(); }
      else if (e.key === 'Enter') { e.preventDefault(); runAt(act); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); hide(true); }
      else if (e.key === 'Tab') e.preventDefault(); /* one control: focus stays here */
    });
    pal.addEventListener('mousedown', function (e) { if (e.target === pal) hide(true); });
    pal.querySelector('#cmdk-list').addEventListener('click', function (e) { var li = e.target.closest('[role="option"]'); if (li) runAt(+li.getAttribute('data-i')); });
    pal.querySelector('#cmdk-list').addEventListener('mousemove', function (e) { var li = e.target.closest('[role="option"]'); if (li && +li.getAttribute('data-i') !== act) { act = +li.getAttribute('data-i'); mark(); } });
  }
  function render() {
    var q = pal.querySelector('#cmdk-q').value.trim().toLowerCase(), words = q.split(/\s+/).filter(Boolean), all = commands();
    items = all.filter(function (c) { var h = (c.t + ' ' + c.g + ' ' + (c.k || '')).toLowerCase(); return words.every(function (w) { return h.indexOf(w) >= 0; }); });
    var ul = pal.querySelector('#cmdk-list'), html = '', g = '';
    items.forEach(function (c, i) {
      if (c.g !== g) { g = c.g; html += '<li class="cmdk-g" role="presentation">' + g + '</li>'; }
      html += '<li role="option" id="cmdk-o' + i + '" data-i="' + i + '" aria-selected="false"><span>' + c.t.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span><small>' + c.g + '</small></li>';
    });
    ul.innerHTML = html || '<li class="cmdk-none" role="presentation">Nothing matches. Try “demo”, “career” or “CV”.</li>';
    act = 0; mark();
    pal.querySelector('#cmdk-live').textContent = items.length ? items.length + ' results.' : 'No results.';
  }
  function mark() {
    var q = pal.querySelector('#cmdk-q');
    [].forEach.call(pal.querySelectorAll('[role="option"]'), function (li) { li.setAttribute('aria-selected', String(+li.getAttribute('data-i') === act)); });
    var on = pal.querySelector('#cmdk-o' + act);
    if (on) { q.setAttribute('aria-activedescendant', on.id); on.scrollIntoView({ block: 'nearest' }); } else q.removeAttribute('aria-activedescendant');
  }
  function move(d) { if (!items.length) return; act = (act + d + items.length) % items.length; mark(); }
  function runAt(i) { var c = items[i]; if (!c) return; var o = opener; hide(false); c.run(o); }
  function show() {
    if (window.NNStage && window.NNStage.mode === 'overlay') return; /* never an overlay on an overlay */
    if (!pal) build();
    opener = document.activeElement;
    pal.hidden = false; pal.querySelector('#cmdk-q').value = ''; render();
    [].forEach.call(document.body.children, function (el) { if (el !== pal && !el.hasAttribute('inert') && el.tagName !== 'SCRIPT') { el.setAttribute('inert', ''); el.setAttribute('data-cmdk-inert', ''); } });
    pal.querySelector('#cmdk-q').focus();
    if (kb) kb.setAttribute('aria-expanded', 'true');
  }
  function hide(refocus) {
    if (!pal || pal.hidden) return;
    pal.hidden = true;
    [].forEach.call(document.querySelectorAll('[data-cmdk-inert]'), function (el) { el.removeAttribute('inert'); el.removeAttribute('data-cmdk-inert'); });
    if (kb) kb.setAttribute('aria-expanded', 'false');
    if (refocus && opener && opener.focus) opener.focus();
  }
  NN.palette = show;
  if (kb) kb.addEventListener('click', show);
  document.addEventListener('keydown', function (e) {
    var typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey) { e.preventDefault(); if (pal && !pal.hidden) hide(true); else show(); }
    else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { if (!(pal && !pal.hidden) && !(window.NNStage && window.NNStage.mode === 'overlay')) { e.preventDefault(); show(); } }
  });
})();
