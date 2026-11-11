/* Shared behaviour: theme toggle, header state, mobile menu, timeline tabs.
   The no-flash theme setter is inlined in each page's <head>. */
(function () {
  'use strict';
  var root = document.documentElement;

  /* ---- theme toggle (storage can be blocked, so always guard it) ---- */
  var tb = document.getElementById('theme');
  function syncTheme() {
    if (tb) tb.setAttribute('aria-pressed', String(root.getAttribute('data-theme') === 'dark'));
  }
  if (tb) {
    tb.addEventListener('click', function () {
      var t = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', t);
      syncTheme();
      try { localStorage.setItem('nn-theme', t); } catch (e) { /* ignore */ }
    });
    syncTheme();
  }

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
    mb.addEventListener('click', function () {
      var open = list.classList.toggle('open');
      mb.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && list.classList.contains('open')) { close(); mb.focus(); } });
    list.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 860) close(); });
  }

  /* ---- timeline tabs (arrow keys, Home, End) ---- */
  var tabs = [].slice.call(document.querySelectorAll('.stop'));
  function select(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.setAttribute('aria-selected', String(on));
      x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) t.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t); });
    t.addEventListener('keydown', function (e) {
      var j = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (j === undefined) return;
      e.preventDefault();
      select(tabs[(j + tabs.length) % tabs.length], true);
    });
  });
})();
