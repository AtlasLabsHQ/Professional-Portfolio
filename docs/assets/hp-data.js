/* Harbour & Pine Outdoor Co.: the invented data and the maths shared by the demo and the home-page teaser.
   Every number is INVENTED. Generated from a fixed seed, so it is identical on every load. */
(function () {
  'use strict';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const REGIONS = [
    { id: 'north', name: 'North', share: 0.36, opexAdj: 0.0 },
    { id: 'midlands', name: 'Midlands', share: 0.33, opexAdj: 0.015 },
    { id: 'south', name: 'South', share: 0.31, opexAdj: -0.01 }
  ];
  /* annual: base-year revenue in £k across all regions; g: yearly growth; amp/peak: seasonality; cogs: cost of sales share */
  const PRODUCTS = [
    { id: 'tents', name: 'Tents & Shelters', annual: 14000, g: 0.05, amp: 0.38, peak: 6, cogs: 0.56 },
    { id: 'packs', name: 'Packs & Bags', annual: 9500, g: 0.04, amp: 0.22, peak: 5, cogs: 0.52 },
    { id: 'apparel', name: 'Apparel', annual: 16000, g: 0.07, amp: 0.30, peak: 10, cogs: 0.50 },
    { id: 'footwear', name: 'Footwear', annual: 11000, g: 0.06, amp: 0.18, peak: 8, cogs: 0.58 },
    { id: 'cook', name: 'Cook & Camp', annual: 6000, g: 0.05, amp: 0.40, peak: 6, cogs: 0.54 },
    { id: 'climbing', name: 'Climbing & Safety', annual: 4500, g: 0.09, amp: 0.12, peak: 3, cogs: 0.55 }
  ];
  /* a few deliberate stories in the latest year so the variances are interesting */
  const STORY = { 'north|apparel': 1.06, 'south|footwear': 0.90, 'midlands|tents': 0.94, 'south|climbing': 1.08, 'north|cook': 1.05 };
  const FIRST = 12, LAST = 35; /* month index 0 = Jan 2022 (prior-year base); shown months are 12..35 = Jan 2023..Dec 2024 */

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* CELLS[region][product] = { rev, cogs, opex } each { a: Actual[36], b: Budget[36] } in £k, whole numbers */
  const CELLS = (function () {
    const rand = mulberry32(20241231), cells = {};
    REGIONS.forEach(function (r) {
      cells[r.id] = {};
      PRODUCTS.forEach(function (p) {
        const c = { rev: { a: [], b: [] }, cogs: { a: [], b: [] }, opex: { a: [], b: [] } };
        for (let m = 0; m <= LAST; m++) {
          const trend = Math.pow(1 + p.g, m / 12);
          const season = 1 + p.amp * Math.cos(2 * Math.PI * ((m % 12) - p.peak) / 12);
          const base = p.annual * r.share / 12 * trend * season;
          const story = m >= 24 ? (STORY[r.id + '|' + p.id] || 1) : 1;
          const revA = Math.round(base * (1 + (rand() - 0.5) * 0.10) * story);
          const revB = Math.round(base * (1.015 + (rand() - 0.5) * 0.02));
          const cogsA = Math.round(revA * (p.cogs + (rand() - 0.5) * 0.03));
          const cogsB = Math.round(revB * p.cogs);
          const opexB = Math.round(revB * (0.30 + r.opexAdj));
          const opexA = Math.round(opexB * (1 + (rand() - 0.5) * 0.08));
          c.rev.a.push(revA); c.rev.b.push(revB);
          c.cogs.a.push(cogsA); c.cogs.b.push(cogsB);
          c.opex.a.push(opexA); c.opex.b.push(opexB);
        }
        cells[r.id][p.id] = c;
      });
    });
    return cells;
  })();

  /* ======================= 2. MATHS AND FORMATTING ======================= */
  function blank() { return { rev: 0, cogs: 0, opex: 0 }; }
  function finish(s) { s.gm = s.rev - s.cogs; s.ebitda = s.gm - s.opex; return s; }

  /* Sum a set of regions x products x months for Actual (a), Budget (b) and Prior Year (p = actual 12 months earlier). */
  function aggregate(regionIds, productIds, months) {
    const out = { a: blank(), b: blank(), p: blank() };
    regionIds.forEach(function (r) {
      productIds.forEach(function (p) {
        const c = CELLS[r][p];
        months.forEach(function (m) {
          out.a.rev += c.rev.a[m]; out.a.cogs += c.cogs.a[m]; out.a.opex += c.opex.a[m];
          out.b.rev += c.rev.b[m]; out.b.cogs += c.cogs.b[m]; out.b.opex += c.opex.b[m];
          out.p.rev += c.rev.a[m - 12]; out.p.cogs += c.cogs.a[m - 12]; out.p.opex += c.opex.a[m - 12];
        });
      });
    });
    finish(out.a); finish(out.b); finish(out.p);
    return out;
  }


  function niceStep(raw) {
    const pow = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / pow;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * pow;
  }

  const HP = { MON: MON, REGIONS: REGIONS, PRODUCTS: PRODUCTS, CELLS: CELLS, FIRST: FIRST, LAST: LAST, aggregate: aggregate, niceStep: niceStep };
  if (typeof module !== 'undefined' && module.exports) module.exports = HP; else window.HP = HP;
})();
