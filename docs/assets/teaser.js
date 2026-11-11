/* Home-page teaser: the demo's monthly trend, drawn by the same data and scale logic (assets/hp-data.js).
   Shows the demo's default view: all regions, all product lines, revenue, twelve months to Sep 2024, year to date highlighted.
   render() returns SVG markup, so the build can also run it under Node to write a static fallback. */
(function () {
  'use strict';
  const IS_NODE = typeof module !== 'undefined' && module.exports;
  const HP = IS_NODE ? require('./hp-data.js') : window.HP;
  const nf = new Intl.NumberFormat('en-GB');
  const ASAT = 32; /* Sep 2024, the demo's default "as at" month */

  function render(W) {
    const R = HP.REGIONS.map(function (r) { return r.id; }), P = HP.PRODUCTS.map(function (p) { return p.id; });
    const start = Math.min(Math.max(HP.FIRST, ASAT - 11), HP.LAST - 11), yearStart = ASAT - (ASAT % 12);
    const rows = [];
    for (let m = start; m < start + 12; m++) {
      const s = HP.aggregate(R, P, [m]);
      rows.push({ m: m, a: s.a.rev, b: s.b.rev, inP: m >= yearStart && m <= ASAT });
    }
    const H = W < 520 ? 230 : 270, L = 46, Rr = 10, T = 24, B = 40, slot = (W - L - Rr) / 12;
    const max = Math.max.apply(null, rows.map(function (r) { return Math.max(r.a, r.b); }));
    const step = HP.niceStep(max / 4), top = Math.ceil(max * 1.04 / step) * step, unit = top >= 2000 ? 'm' : 'k';
    const x = function (i) { return L + slot * i + slot / 2; };
    const y = function (v) { return T + (H - T - B) * (1 - v / top); };
    const bw = Math.min(slot * 0.58, 38), f = function (n) { return +n.toFixed(1); };
    const tot = rows.reduce(function (s, r) { return { a: s.a + r.a, b: s.b + r.b }; }, { a: 0, b: 0 });
    const pct = Math.abs((tot.a - tot.b) / tot.b * 100).toFixed(1);
    let o = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="tz-t tz-d"><title id="tz-t">Monthly revenue against budget (invented data)</title>' +
      '<desc id="tz-d">Preview of the live demo: all regions, October 2023 to September 2024. Twelve-month revenue £' + (tot.a / 1000).toFixed(2) + 'm against a budget of £' + (tot.b / 1000).toFixed(2) + 'm, ' + pct + '% ' + (tot.a < tot.b ? 'below' : 'above') + ' budget. All figures are invented.</desc>';
    o += '<text x="0" y="10">£' + unit + '</text>';
    for (let v = 0; v <= top + 1e-9; v += step) {
      o += '<line x1="' + L + '" x2="' + (W - Rr) + '" y1="' + f(y(v)) + '" y2="' + f(y(v)) + '" class="' + (v === 0 ? 'axis' : 'grid') + '"/>' +
        '<text x="' + (L - 8) + '" y="' + f(y(v) + 4) + '" text-anchor="end">' + (unit === 'm' ? String(+(v / 1000).toFixed(1)) : nf.format(v)) + '</text>';
    }
    rows.forEach(function (r, i) {
      o += '<rect class="bar' + (r.inP ? '' : ' dim') + '" x="' + f(x(i) - bw / 2) + '" y="' + f(y(r.a)) + '" width="' + f(bw) + '" height="' + f(Math.max(0, y(0) - y(r.a))) + '" rx="3"/>' +
        '<text x="' + f(x(i)) + '" y="' + (H - B + 16) + '" text-anchor="middle">' + (slot < 34 ? HP.MON[r.m % 12][0] : HP.MON[r.m % 12]) + '</text>';
      if (i === 0 || r.m % 12 === 0) o += '<text x="' + f(x(i)) + '" y="' + (H - B + 30) + '" text-anchor="middle">' + (2022 + Math.floor(r.m / 12)) + '</text>';
    });
    o += '<path class="budl" d="' + rows.map(function (r, i) { return (i ? 'L' : 'M') + f(x(i)) + ' ' + f(y(r.b)); }).join('') + '"/>';
    rows.forEach(function (r, i) { o += '<circle class="budp" cx="' + f(x(i)) + '" cy="' + f(y(r.b)) + '" r="3.5"/>'; });
    return o + '</svg>';
  }

  if (IS_NODE) { module.exports = { render: render }; return; }
  const host = document.getElementById('teaser');
  if (!host || !HP) return;
  let lastW = 0, raf = 0;
  function draw() { const w = Math.round(host.clientWidth); if (w && Math.abs(w - lastW) > 1) { lastW = w; host.innerHTML = render(w); } }
  draw();
  new ResizeObserver(function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }).observe(host);
})();
