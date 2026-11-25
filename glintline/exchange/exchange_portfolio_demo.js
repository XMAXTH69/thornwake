// Glint Exchange - DEMO state for MY PORTFOLIO + MY RESULTS (26 Nov 2026). ONE job: make the two pages clickable in ?demo=1 with FAKE numbers.
// The game never loads any of this: it only sends the real fragment (keys at the top of exchange_portfolio.js). Loaded AFTER exchange_portfolio.js.
// Demo ways in: market / stock page MY PORTFOLIO button, or start with  exchange_live.html?demo=1#p=portfolio&pf=1  (pf 0 ALL | 1 SHARES | 2 OPTIONS; also #p=results&rv=1&ri=0&sel=2).
// FILTER key cycles pf, SELL (shares row) goes to the sell amount page, CLOSE EARLY (option row) to p=oclose. Old p=shares / p=myopt in the demo state = portfolio with pf 1 / 2.
(function () {
  'use strict';
  if (!DEMO) return;
  var EXPD = PF.EXPD;
  function endOf(e) { var n = new Date(), t = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 20); if (t - Date.now() < 2 * 3600000) t += DAYMS; return Math.round((t + (EXPD[e] - 1) * DAYMS) / 1000); }
  function setKey(u, key, val) { var re = new RegExp('(^|&)' + key + '=[^&]*'); return re.test(u) ? u.replace(re, '$1' + key + '=' + val) : u + '&' + key + '=' + val; }

  // fake account: the 3 holdings + 3 options of exchange_options.js (same state, so that file never resets them) plus a few more rows
  function ensure() {
    if (D.pfInit) return; D.pfInit = true; D.rv = 0; D.ri = 1;
    if (D.oe === undefined) { D.oe = 0; D.orow = 10; D.ocp = 'c'; D.obs = 's'; D.oq = 1; D.om = ''; D.olv = 'STANDARD'; D.olx = 10; D.onk = 3; }
    if (!D.pos) D.pos = [{ k: 3, cp: 'p', bs: 's', K: 800, e: 2, q: 2, open: 22, mark: 15, m: 'cash', end: endOf(2) }, { k: 2, cp: 'c', bs: 's', K: 2600, e: 1, q: 1, open: 41, mark: 52, m: 'cov', end: endOf(1) },
      { k: 6, cp: 'c', bs: 'b', K: 620, e: 0, q: 3, open: 9, mark: 14, m: '', end: endOf(0) }];
    var next = 3, best = 1e18, i;                                     // one more stock whose report is the next one: shows the 48 h highlight
    for (i = 0; i < STOCKS; i++) { var t = nextDay(CO.report_day[i], 12 * 3600000); if (t < best && [2, 3, 6, 12, 24, 31, 34].indexOf(i) < 0) { best = t; next = i; } }
    [[12, 150, .93], [34, 300, 1.06], [31, 250, .98], [next, 200, 1.04]].forEach(function (o) { if (D.h[o[0]] === 0) { D.h[o[0]] = o[1]; D.cb[o[0]] = Math.round(o[1] * D.px[o[0]] * o[2] + 500); } });
    function r5(v, s) { return Math.round(v / s) * s; }
    D.pos.push({ k: 12, cp: 'c', bs: 's', K: r5(D.px[12] * 1.05, 25), e: 2, q: 1, open: 35, mark: 26, m: 'cov', end: endOf(2) });
    D.pos.push({ k: next, cp: 'c', bs: 's', K: r5(D.px[next] * 1.06, 5), e: 2, q: 1, open: 40, mark: 31, m: 'cov', end: endOf(2) });
    D.pos.push({ k: 24, cp: 'p', bs: 's', K: r5(D.px[24] * .92, 5), e: 3, q: 1, open: 60, mark: 11, m: 'cash', end: endOf(3) });
    D.pos.push({ k: 31, cp: 'p', bs: 's', K: r5(D.px[31] * 1.08, 5), e: 1, q: 1, open: 190, mark: 270, m: 'cash', end: endOf(1) });
  }

  // fake history: 13 months ending this month, oldest first (ym:puts:calls:div:gains:value:inv:disc:dte)
  function history() {
    var n = new Date(), y = n.getUTCFullYear(), m = n.getUTCMonth(), out = [], i;
    var pu = [0, 40, 95, 140, 120, 210, 180, 260, 230, 300, 340, 310, 180], ca = [0, 0, 30, 60, 110, 90, 170, 150, 220, 190, 260, 300, 150], dv = [0, 0, 10, 12, 25, 25, 40, 38, 52, 60, 64, 70, 35];
    var gn = [0, -30, 60, -80, 140, -40, 210, -120, 300, 150, -90, 420, 260], va = [2000, 2150, 2480, 2700, 3150, 3500, 4200, 4600, 5400, 6000, 6700, 7900, 9100], iv = [20, 35, 48, 55, 62, 58, 66, 72, 64, 70, 78, 83, 75];
    var di = [0, 28, 31, 26, 35, 40, 33, 29, 38, 36, 42, 39, 34], dt = [0, 70, 52, 65, 40, 48, 60, 35, 42, 50, 38, 45, 40];
    for (i = 0; i < 13; i++) { var mm = m - 12 + i, yy = y; while (mm < 0) { mm += 12; yy--; } out.push([(yy % 100) * 100 + mm + 1, pu[i], ca[i], dv[i], gn[i], va[i], iv[i], di[i], dt[i]].join(':')); }
    return out.join('~');
  }
  var TOP = [[3, 820, 310, 90, 540], [2, 300, 760, 140, 210], [12, 260, 410, 260, -90], [6, 150, 90, 20, 380], [34, 120, 60, 310, 40], [24, 480, 0, 0, -310], [31, 90, 130, 210, 30], [0, 60, 120, 80, 60], [20, 140, 40, 30, -50], [40, 70, 20, 0, 60]];

  var prevWrite = demoWrite;
  var legacyPf;                                                      // pf to use when a core/options path still says D.p = shares / myopt
  demoWrite = function () {
    if (!D) return prevWrite();
    if (D.p === 'shares' || D.p === 'myopt') { D.pf = legacyPf !== undefined ? legacyPf : D.p === 'shares' ? 1 : 2; D.p = 'portfolio'; D.sel = 0; }
    prevWrite();
    if (D.p !== 'portfolio' && D.p !== 'results') return;
    ensure();
    var u = location.hash.replace(/^#/, ''), free = D.h.slice(), cbf = D.cb.slice(), hk = [], locked = 0, sum = 0;
    D.pos.forEach(function (p) {                                     // the desk moves covered shares OUT of h: send them in hk like the game does
      if (p.bs !== 's') return;
      if (p.m === 'cov') { var lock = Math.min(100 * p.q, free[p.k]); if (lock > 0) { var c = Math.round(cbf[p.k] * lock / free[p.k]); free[p.k] -= lock; cbf[p.k] -= c; hk.push(p.k + ':' + lock + ':' + c); } }
      else if (p.m === 'cash') locked += p.K * p.q;
    });
    u = setKey(setKey(u, 'h', free.join(',')), 'cb', cbf.join(','));
    u += '&mo=' + encodeURIComponent(D.pos.map(function (p) { return [p.k, p.cp, p.bs, p.K, p.e, p.q, p.open, p.mark, p.m, p.end].join(':'); }).join('~'));
    u += '&hk=' + hk.join('~') + '&pl=' + locked + '&pd=186&of=2';
    if (D.p === 'portfolio') u += '&pf=' + (D.pf || 0);
    if (D.p === 'results') {
      TOP.forEach(function (r) { sum += r[1] + r[2] + r[3] + r[4]; });
      u += '&rm=' + history() + '&rt=' + TOP.map(function (r) { return r.join(':'); }).join('~') + '&rtt=' + (sum + 640) + '&rv=' + D.rv + '&ri=' + D.ri;
    }
    location.hash = u;
  };

  var prevPress = press;
  press = function (id) {
    if (!D || D.p === 'wait' || pendingYes) return;
    var p = D.p;
    if (p !== 'portfolio' && p !== 'results') { legacyPf = D.pf || 0; try { return prevPress(id); } finally { legacyPf = undefined; } }
    var S = parse(), P = PF.parse(S);
    if (p === 'portfolio') {
      var M = PF.build(S, P), n = M.flat.length;
      if (id === 'back') { D.p = 'market'; D.sel = 0; } else if (id === 'minus') { D.pf = ((D.pf || 0) + 1) % 3; D.sel = 0; } else if (id === 'plus') { D.p = 'results'; D.sel = 0; D.rv = 0; }
      else if (id === 'up' && n) D.sel = (D.sel + n - 1) % n; else if (id === 'down' && n) D.sel = (D.sel + 1) % n;
      else if (id === 'select' && n) {
        var row = M.flat[Math.min(D.sel, n - 1)];
        if (row.st === 'SH') { D.k = row.k; if (D.h[row.k] > 0) { D.side = 'sell'; D.q = 1; D.p = 'amount'; } else refuse('sell', 'Your ' + NAMES[row.k] + ' shares are locked by a covered call.'); }
        else { D.k = row.k; D.sel = P.pos.indexOf(row.p); D.p = 'oclose'; }
      }
      return demoWrite();
    }
    var cnt = P.view === 1 ? PF.slices(S, P).flat.length : Math.min(10, P.top.length);
    if (id === 'back') { D.p = 'portfolio'; D.sel = 0; }
    else if (id === 'minus' || id === 'plus') { D.rv = (D.rv + (id === 'plus' ? 1 : PF.views - 1)) % PF.views; D.sel = 0; }
    else if (id === 'up' && cnt && P.view) D.sel = (D.sel + cnt - 1) % cnt; else if (id === 'down' && cnt && P.view) D.sel = (D.sel + 1) % cnt;
    else if (id === 'select' && !P.view) D.ri = D.ri ? 0 : 1;
    return demoWrite();
  };

  var H0 = typeof HASH0 === 'string' ? HASH0 : location.hash, sp = (H0.match(/[#&]p=(\w+)/) || [])[1];
  if (sp === 'portfolio' || sp === 'results') {
    ensure(); D.p = sp; m = H0.match(/[#&]pf=(\d)/); D.pf = m ? +m[1] : 0; if (/[#&]pz=1/.test(H0)) D.pz = 1; var m = H0.match(/sel=(\d+)/); D.sel = m ? +m[1] : 0; m = H0.match(/rv=(\d)/); if (m) D.rv = +m[1]; m = H0.match(/ri=(\d)/); if (m) D.ri = +m[1];
    demoWrite();
  }
})();
