/* Platform explorer: wiring for the map built by the generator (nodes are real buttons in the page already).
   Sections: 1 panel and selection, 2 mini interactives, 3 live demo overlay, 4 follow the data.
   Everything shown here is invented. */
(function () {
  'use strict';
  const X = window.EXPLORE, HP = window.HP;
  const $ = function (id) { return document.getElementById(id); };
  if (!$('xmap') || !X) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sheet = window.matchMedia('(max-width: 1179px)');
  const nodeBtn = function (id) { return document.querySelector('.xnode[data-id="' + id + '"]'); };
  let selected = null, timers = [], demo = null, demoOpener = null;

  function later(fn, ms) { const t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  /* ======================= 1. PANEL AND SELECTION ======================= */
  function select(id, userMove) {
    const n = X.NODES[id]; if (!n) return;
    clearTimers(); stopFollow(true);
    selected = id;
    document.querySelectorAll('.xnode').forEach(function (b) {
      const on = b.getAttribute('data-id') === id;
      b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on));
    });
    $('xp-title').textContent = n.label;
    $('xp-body').innerHTML = '<dl><div><dt>What it is</dt><dd>' + esc(n.what) + '</dd></div><div><dt>What it changed</dt><dd>' + esc(n.changed) + '</dd></div><div><dt>My role</dt><dd>' + esc(n.role) + '</dd></div></dl>';
    const extra = $('xp-extra'); extra.innerHTML = '';
    if (n.link) extra.insertAdjacentHTML('beforeend', '<p class="xlink"><a class="link" href="' + n.link[0] + '">' + esc(n.link[1]) + '</a></p>');
    if (n.kind && MINI[n.kind]) MINI[n.kind](extra);
    $('xstatus').textContent = 'Showing details for ' + n.label + '.';
    const panel = $('xpanel');
    panel.classList.add('open');
    if (sheet.matches && userMove) {
      panel.focus({ preventScroll: true });
      requestAnimationFrame(function () { if (document.activeElement !== panel && panel.classList.contains('open')) panel.focus({ preventScroll: true }); });
    }
  }
  function closePanel() {
    clearTimers();
    $('xpanel').classList.remove('open');
    const b = selected && nodeBtn(selected); if (b) b.focus();
  }
  function hidePanel() { $('xpanel').classList.remove('open'); } /* close without moving focus */

  /* ======================= 2. MINI INTERACTIVES ======================= */
  const MINI = {};

  /* Executive reporting: opens the real demo in an overlay */
  MINI.exec = function (el) {
    el.insertAdjacentHTML('beforeend', '<div class="mini"><p>This is the live demo, on invented data for a fictional outdoor-gear company: filters, a trend, a variance bridge and a drill-down table.</p><div class="mini-controls"><button type="button" class="btn primary small" id="x-open-demo">Open the live demo here</button><a class="link" href="demo.html">Open the full page</a></div></div>');
    $('x-open-demo').addEventListener('click', function () { openDemo(this); });
  };

  /* Automations: a simulated approval run, with a failure toggle that shows the monitor's alert */
  MINI.auto = function (el) {
    const steps = ['Submitted', 'Checked', 'Approved', 'Posted to finance', 'Logged'];
    el.insertAdjacentHTML('beforeend', '<div class="mini"><p>A simulated run of a payment approval. Invented request.</p>' +
      '<div class="mini-controls"><button type="button" class="btn primary small" id="x-auto-run">Run an approval</button>' +
      '<label class="switch"><input type="checkbox" id="x-auto-fail"><span class="tr" aria-hidden="true"></span>What if a step fails?</label></div>' +
      '<ol class="msteps" id="x-auto-steps">' + steps.map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ol>' +
      '<p class="malert" id="x-auto-alert" hidden></p><p class="sr-only" id="x-auto-live" role="status" aria-live="polite"></p></div>');
    const lis = [].slice.call($('x-auto-steps').children);
    function reset() { clearTimers(); lis.forEach(function (l, i) { l.className = ''; l.textContent = steps[i]; }); $('x-auto-alert').hidden = true; }
    function fail() { return $('x-auto-fail').checked; }
    function showEnd(failed) {
      if (failed) {
        $('x-auto-alert').hidden = false;
        $('x-auto-alert').textContent = 'Monitor alert: the payment approval flow failed at “Posted to finance”. The owner is told straight away, and the daily digest lists it too. Nothing is logged as paid.';
        $('x-auto-live').textContent = 'Failed at Posted to finance. Monitor alert sent.';
      } else { $('x-auto-live').textContent = 'Approved, posted to finance and logged.'; }
    }
    function mark(i, state) { lis[i].className = state; lis[i].textContent = (state === 'done' ? '✓ ' : state === 'bad' ? '✗ ' : '') + steps[i] + (state === 'bad' ? ': failed' : ''); }
    $('x-auto-run').addEventListener('click', function () {
      reset();
      const failAt = fail() ? 3 : -1;
      if (reduce.matches) {
        for (let i = 0; i < steps.length; i++) { if (i === failAt) { mark(i, 'bad'); break; } mark(i, 'done'); }
        showEnd(failAt >= 0); return;
      }
      let i = 0;
      (function next() {
        if (i >= steps.length) { showEnd(false); return; }
        lis[i].className = 'active';
        later(function () {
          if (i === failAt) { mark(i, 'bad'); showEnd(true); return; }
          mark(i, 'done'); i++; next();
        }, 800);
      })();
    });
    $('x-auto-fail').addEventListener('change', reset);
  };

  /* Data Q&A: question, answer from the invented data, independent recheck */
  function money(v) { const a = Math.abs(v); return '£' + (a >= 10000 ? (a / 1000).toFixed(2) + 'm' : Math.round(a).toLocaleString('en-GB') + 'k'); }
  MINI.qa = function (el) {
    el.insertAdjacentHTML('beforeend', '<div class="mini"><p class="qq">Which product line grew fastest against last year, year to date, at Harbour &amp; Pine Outdoor Co. (invented)?</p>' +
      '<div class="mini-controls"><button type="button" class="btn primary small" id="x-qa-ask">Ask the question</button></div>' +
      '<ol class="msteps" id="x-qa-steps"></ol><p class="sr-only" id="x-qa-live" role="status" aria-live="polite"></p></div>');
    function compute() {
      const months = []; for (let m = 24; m <= 32; m++) months.push(m);
      const all = HP.REGIONS.map(function (r) { return r.id; });
      const rows = HP.PRODUCTS.map(function (p) {
        const s = HP.aggregate(all, [p.id], months);
        return { name: p.name, id: p.id, rev: s.a.rev, g: (s.a.rev - s.p.rev) / s.p.rev * 100 };
      }).sort(function (a, b) { return b.g - a.g; });
      return rows[0];
    }
    function recheck(best) { /* a separate route to the same figure: straight from the cells, no aggregate() */
      let cur = 0, prior = 0;
      HP.REGIONS.forEach(function (r) { const c = HP.CELLS[r.id][best.id].rev.a; for (let m = 24; m <= 32; m++) { cur += c[m]; prior += c[m - 12]; } });
      return { rev: cur, g: (cur - prior) / prior * 100 };
    }
    $('x-qa-ask').addEventListener('click', function () {
      clearTimers();
      const best = compute(), chk = recheck(best), ok = chk.rev === best.rev && Math.abs(chk.g - best.g) < 1e-9;
      const lines = ['Question received. This service is read-only: it cannot change anything.',
        'Answer: ' + best.name + '. Revenue ' + money(best.rev) + ' year to date, ' + best.g.toFixed(1) + '% above the same period last year.',
        (ok ? '✓ ' : '✗ ') + 'Independent recheck: a separate agent worked it out its own way and ' + (ok ? 'the figures match' : 'the figures differ, so it would not be sent') + '. Sent as a ready-to-send reply plus a spreadsheet with the data and notes.'];
      const ol = $('x-qa-steps'); ol.innerHTML = '';
      function add(i) { ol.insertAdjacentHTML('beforeend', '<li class="' + (i === 2 ? 'done' : '') + '">' + esc(lines[i]) + '</li>'); $('x-qa-live').textContent = lines[i]; }
      if (reduce.matches) { lines.forEach(function (_, i) { add(i); }); return; }
      add(0); later(function () { add(1); later(function () { add(2); }, 1000); }, 900);
    });
  };

  /* Business apps: mock order list, an edit, and its audit-log entry */
  const orders = [
    { ref: 'HP-1041', who: 'Fjordline Outfitters', status: 'Packed' }, { ref: 'HP-1042', who: 'Ridge & Row', status: 'Picking' },
    { ref: 'HP-1043', who: 'Cairn Supply Co.', status: 'Shipped' }, { ref: 'HP-1044', who: 'Larch Hill Stores', status: 'New' }
  ];
  const audit = [];
  const STATUSES = ['New', 'Picking', 'Packed', 'Shipped'];
  MINI.apps = function (el) {
    el.insertAdjacentHTML('beforeend', '<div class="mini"><p>A mock order list, with invented orders. Edit a status and the change is written to an audit log.</p>' +
      '<div class="tscroll" tabindex="0" role="region" aria-label="Mock order list"><table class="mt"><thead><tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Status</th><th scope="col"><span class="sr-only">Action</span></th></tr></thead><tbody id="x-orders"></tbody></table></div>' +
      '<h4 class="mh">Audit log</h4><ol class="alog" id="x-audit" aria-live="polite"></ol></div>');
    let editing = null;
    function draw() {
      $('x-orders').innerHTML = orders.map(function (o) {
        if (editing === o.ref) {
          return '<tr><td>' + o.ref + '</td><td>' + esc(o.who) + '</td><td><label class="sr-only" for="x-st">Status for ' + o.ref + '</label><select id="x-st">' + STATUSES.map(function (s) { return '<option' + (s === o.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td><td class="act"><button type="button" class="btn primary small" data-save="' + o.ref + '">Save</button> <button type="button" class="btn secondary small" data-cancel="1">Cancel</button></td></tr>';
        }
        return '<tr><td>' + o.ref + '</td><td>' + esc(o.who) + '</td><td>' + o.status + '</td><td class="act"><button type="button" class="btn secondary small" data-edit="' + o.ref + '" aria-label="Edit ' + o.ref + '">Edit</button></td></tr>';
      }).join('');
      $('x-audit').innerHTML = audit.length ? audit.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') : '<li class="none">No edits yet.</li>';
    }
    $('x-orders').addEventListener('click', function (e) {
      const b = e.target.closest('button'); if (!b) return;
      if (b.hasAttribute('data-edit')) { editing = b.getAttribute('data-edit'); draw(); $('x-st').focus(); }
      else if (b.hasAttribute('data-cancel')) { const r = editing; editing = null; draw(); const f = document.querySelector('[data-edit="' + r + '"]'); if (f) f.focus(); }
      else if (b.hasAttribute('data-save')) {
        const o = orders.filter(function (x) { return x.ref === editing; })[0], to = $('x-st').value;
        if (o.status !== to) audit.unshift(o.ref + ': status ' + o.status + ' → ' + to + ' · by you (invented user) · just now');
        if (o.status !== to) o.status = to;
        const r = editing; editing = null; draw(); const f = document.querySelector('[data-edit="' + r + '"]'); if (f) f.focus();
      }
    });
    draw();
  };

  /* Agent control room: a mock dashboard with invented project names */
  const PROJECTS = [
    { name: 'Orion', area: 'Analytics', agents: [['Analyst', 'done'], ['Builder', 'work'], ['Reviewer', 'idle'], ['Tester', 'idle'], ['Release', 'idle']] },
    { name: 'Juno', area: 'Analytics', agents: [['Analyst', 'done'], ['Builder', 'done'], ['Reviewer', 'done'], ['Tester', 'done'], ['Release', 'wait']] },
    { name: 'Kestrel', area: 'Products', agents: [['Analyst', 'done'], ['Builder', 'wait'], ['Reviewer', 'idle'], ['Tester', 'idle'], ['Release', 'idle']] },
    { name: 'Lumen', area: 'Operations', agents: [['Analyst', 'done'], ['Builder', 'done'], ['Reviewer', 'work'], ['Tester', 'idle'], ['Release', 'idle']] }
  ];
  const STATE_TXT = { done: 'done', work: 'working', wait: 'waiting on you', idle: 'not started' };
  const needs = [
    { id: 'n1', text: 'Juno: approve the release of the monthly pack. Backup and rollback are attached.', yes: 'Approve', no: 'Decline', reply: 'Recorded. Juno’s overseer will run a dry run first.', no2: 'Recorded. Juno’s overseer holds the release.' },
    { id: 'n2', text: 'Kestrel: choose a layout for the order list.', yes: 'Option A', no: 'Option B', reply: 'Recorded: Option A. Kestrel’s overseer passes it to the builder.', no2: 'Recorded: Option B. Kestrel’s overseer passes it to the builder.' }
  ];
  const resolved = {}; const consoleLog = [];
  MINI.control = function (el) {
    el.insertAdjacentHTML('beforeend', '<div class="mini"><p>A mock dashboard. Project names are invented.</p><div class="projs" id="x-projs"></div>' +
      '<h4 class="mh">Needs you</h4><ul class="needs" id="x-needs"></ul>' +
      '<h4 class="mh">Message a project lead</h4><div class="mini-controls"><label class="sr-only" for="x-to">Recipient</label><select id="x-to">' + PROJECTS.map(function (p) { return '<option>' + p.name + '</option>'; }).join('') + '</select>' +
      '<label class="sr-only" for="x-msg">Message</label><input id="x-msg" class="tin" type="text" placeholder="Type a message" autocomplete="off"><button type="button" class="btn primary small" id="x-send">Send</button></div>' +
      '<ol class="alog" id="x-console" aria-live="polite"></ol><p class="fine">Policy: agents may only message their own overseer. Across projects, only a person can.</p></div>');
    $('x-projs').innerHTML = PROJECTS.map(function (p) {
      return '<div class="proj-card"><b>' + p.name + '</b><span class="area">' + p.area + '</span><ul class="rings" aria-label="' + p.name + ' agents">' +
        p.agents.map(function (a) { return '<li class="ring ' + a[1] + '" aria-label="' + a[0] + ': ' + STATE_TXT[a[1]] + '" title="' + a[0] + ': ' + STATE_TXT[a[1]] + '"><i></i><span>' + a[0][0] + '</span></li>'; }).join('') + '</ul></div>';
    }).join('');
    function drawNeeds() {
      $('x-needs').innerHTML = needs.map(function (n) {
        if (resolved[n.id]) return '<li class="done"><span>✓ ' + esc(resolved[n.id]) + '</span></li>';
        return '<li><span>' + esc(n.text) + '</span><span class="nb"><button type="button" class="btn primary small" data-n="' + n.id + '" data-v="y">' + n.yes + '</button><button type="button" class="btn secondary small" data-n="' + n.id + '" data-v="n">' + n.no + '</button></span></li>';
      }).join('');
    }
    function drawLog() { $('x-console').innerHTML = consoleLog.length ? consoleLog.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') : '<li class="none">No messages yet.</li>'; }
    $('x-needs').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-n]'); if (!b) return;
      const n = needs.filter(function (x) { return x.id === b.getAttribute('data-n'); })[0];
      resolved[n.id] = b.getAttribute('data-v') === 'y' ? n.reply : n.no2; drawNeeds();
      const nx = $('x-needs').querySelector('button'); if (nx) nx.focus();
    });
    function send() {
      const t = $('x-msg').value.trim(), to = $('x-to').value; if (!t) { $('x-msg').focus(); return; }
      consoleLog.unshift('You to ' + to + ' overseer: ' + t);
      consoleLog.unshift(to + ' overseer: Noted. It goes in the state document, and I will confirm what changes.');
      $('x-msg').value = ''; drawLog(); $('x-msg').focus();
    }
    $('x-send').addEventListener('click', send);
    $('x-msg').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); send(); } });
    drawNeeds(); drawLog();
  };

  /* ======================= 3. LIVE DEMO OVERLAY ======================= */
  function focusables(root) { return [].slice.call(root.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')).filter(function (e) { return e.offsetParent !== null; }); }
  function openDemo(opener) {
    demoOpener = opener; const box = $('xdemo');
    box.hidden = false; document.body.classList.add('xlock');
    demo = window.HPDemo.mount($('xdemo-root'));
    $('xdemo-close').focus();
  }
  function closeDemo() {
    if (!demo) return;
    demo.destroy(); demo = null; $('xdemo').hidden = true; document.body.classList.remove('xlock');
    if (demoOpener && document.contains(demoOpener)) demoOpener.focus(); else { const b = selected && nodeBtn(selected); if (b) b.focus(); }
  }
  $('xdemo-close').addEventListener('click', closeDemo);
  $('xdemo').addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { e.preventDefault(); closeDemo(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables($('xdemo')); if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ======================= 4. FOLLOW THE DATA ======================= */
  let fIdx = -1;
  function clearFollow() { document.querySelectorAll('.xnode').forEach(function (b) { b.classList.remove('follow', 'trail'); }); }
  function stopFollow(silent) {
    clearTimers(); clearFollow(); fIdx = -1;
    $('xfollow').disabled = false; $('xfollow').textContent = 'Follow the data';
    if (silent) { [].forEach.call($('xfsteps').children, function (li) { li.classList.remove('active', 'done'); }); }
  }
  function followStep() {
    fIdx++;
    const lis = $('xfsteps').children;
    if (fIdx >= X.FOLLOW.length) {
      $('xfstatus').textContent = 'Done. One record, from a source to a person, through every layer.';
      [].forEach.call(lis, function (li) { li.classList.remove('active'); li.classList.add('done'); });
      later(function () { clearFollow(); $('xfollow').disabled = false; $('xfollow').textContent = 'Follow it again'; }, 1500);
      return;
    }
    const s = X.FOLLOW[fIdx];
    clearFollow();
    X.FOLLOW.slice(0, fIdx).forEach(function (p) { nodeBtn(p.node).classList.add('trail'); });
    const b = nodeBtn(s.node); b.classList.add('follow');
    [].forEach.call(lis, function (li, i) { li.classList.toggle('active', i === fIdx); li.classList.toggle('done', i < fIdx); });
    $('xfstatus').textContent = 'Step ' + (fIdx + 1) + ' of ' + X.FOLLOW.length + ': ' + s.text;
    b.scrollIntoView({ block: 'center', behavior: reduce.matches ? 'auto' : 'smooth' });
    later(followStep, 1500);
  }
  $('xfollow').addEventListener('click', function () {
    stopFollow(true);
    if (sheet.matches) hidePanel(); /* on phones the open sheet would cover the map */
    if (reduce.matches) {
      [].forEach.call($('xfsteps').children, function (li) { li.classList.add('done'); });
      $('xfstatus').textContent = 'Reduced motion is on, so the steps are shown without animation: ' + X.FOLLOW.map(function (s) { return s.text; }).join(' ');
      return;
    }
    $('xfollow').disabled = true; $('xfollow').textContent = 'Following…';
    followStep();
  });

  /* ======================= wiring ======================= */
  document.querySelectorAll('.xnode').forEach(function (b) { b.addEventListener('click', function () { select(b.getAttribute('data-id'), true); }); });
  $('xp-close').addEventListener('click', closePanel);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sheet.matches && !demo && $('xpanel').classList.contains('open')) { e.preventDefault(); closePanel(); } });
  const want = new URLSearchParams(location.search).get('node');
  if (want && X.NODES[want]) { select(want, false); const b = nodeBtn(want); if (b) b.scrollIntoView({ block: 'center' }); }
  else { select('exec', false); if (sheet.matches) $('xpanel').classList.remove('open'); }
})();
