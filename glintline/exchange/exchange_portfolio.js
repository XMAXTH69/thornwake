// Glint Exchange - MY PORTFOLIO (the ONE account page: shares + options, merged 25 Nov 2026) + MY RESULTS pages (26 Nov 2026; design Glintline/design/GLINT-EXCHANGE.md sec 16b, 18, 24, 27, 28, 29).
// ONE job: read the fragment and draw the two account pages on the broker screen. Loaded AFTER exchange_options.js and exchange_charts.js;
// it adds pages to PAGES/BARS like exchange_options.js does. Demo wiring lives in exchange_portfolio_demo.js. The game sends every number.
// MECHANIC: let the player see what they hold (shares + options per stock, the wheel pair) and what the Exchange earned them over time.
//
// DATA RULE: the screen gets its state ONLY from the #fragment sent by GlintBroker (media URL). Compact aggregates, never daily data.
//   Pages          p=portfolio   p=results      (old p=shares / p=myopt are NOT pages any more: they draw p=portfolio with pf=1 / pf=2)
//   FILTER  pf 0 ALL (default, missing = 0) | 1 SHARES only | 2 OPTIONS only    drawn as 3 tabs next to the title; the bottom bar FILTER key cycles it.
//   SEL RULE (portfolio): 'sel' = index into the FILTERED flat row list, 0-based. Flat list = groups sorted by exposure DESC (= shares x px / 100 + strike x contracts of its options; stable, ties keep first-seen order: shares groups by stock id, then option-only groups in mo order; NEVER re-sorted after filtering),
//     inside a group the SHARES row first, then its options in the order of 'mo'; pf=1 drops the option rows, pf=2 drops the shares rows (empty groups vanish,
//     the group order of the rest is unchanged). ALL = every row. sel is clamped to the list; the page shows the page that holds sel.
//     SELL (shares row) / CLOSE EARLY (option row) act on that row; for CLOSE EARLY the game then shows p=oclose with sel = index of that option inside 'mo'.
//   Bottom lines: 'If you sell all now: X' (pf 0/1; sum floor(h*fillSell/100) - f per stock over the FREE shares h) and 'If you close all now: +X' (pf 0/2; options, fee 'of' per contract, default 2).
// Re-used core keys (already sent on every page):  c free glint   px 50 prices   h 50 FREE shares   cb 50 cost x100 of the FREE shares   sel selected row/slice
// Re-used option key (same text as MY OPTIONS):     mo  'stock:c|p:b|s:strike:oe:qty:open:mark:mode:endUnix' joined by '~'  (cents per share)
// NEW keys, all optional (missing = 0 / empty):
//   hk   shares locked by covered calls (the desk moves them OUT of h):  'stock:shares:costx100' joined '~'          <= 8 entries (8 positions)
//   pl   glint locked now: cash-secured puts + naked margin (int)         pd  result today in glint (signed int, GlintExchangeDesk day net)
//   pf portfolio filter 0|1|2 (see above)   of option fee per contract (same key as the options pages, default 2)
//   rv   results view 0 overview | 1 sectors | 2 top earners             ri  line chart 1 = VALUE (default) | 0 = INCOME added up
//   rm   monthly history, OLDEST first, up to 13 rows joined '~':  'ym:puts:calls:div:gains:value:inv:disc:dte'
//        ym = YYMM (2611 = Nov 2026)   puts calls div gains = glint earned that month (signed int)   value = account value at month end (glint)
//        inv = % of the account invested at month end (0-100)   disc = average put discount, strike below price, in 0.1 % (34 = 3.4 %)
//        dte = average days to expiry of the contracts opened that month, in 0.1 day (45 = 4.5 d)   0 = nothing that month
//   rt   top earners, best total first, max 10, joined '~':  'stock:puts:calls:div:gains'  (glint, signed, all time)
//   rtt  all-time total result of ALL stocks in glint (signed) - lets the page show 'other stocks' and the share of performance %
// Sunburst, KPI cards and the table need NO extra keys: they come from h, hk, px, cb, mo, c.
// Estimated MAX LENGTH of the new keys: rm 13 x ~52 = 680 + rt 10 x ~36 = 360 + hk ~150 + pl pd rtt rv ri ~50 = about 1,250 chars.
//   With the core keys (about 1.3 k) the results page is about 2.6 k; the options chain page already sends about 2.2 k (measured in demo).
var PF = (function () {
  'use strict';
  var EXPD = [1, 3, 7, 28], PG = 9, VIEWS = ['OVERVIEW', 'SECTORS', 'TOP EARNERS'], WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var STRAT = { SH: ['SHARES', '#DCE3EE'], SC: ['SHORT CALL', '#FFB02E'], SP: ['SHORT PUT', '#7FD4FF'], LC: ['LONG CALL', '#2EE59D'], LP: ['LONG PUT', '#FF4F64'] };
  var GLASS = 'background:linear-gradient(180deg,#7FD4FF12,#04070F66 40%);border:2px solid var(--line);border-radius:14px;box-sizing:border-box';

  // ---------------- fragment
  function parseP(S) {
    var h = location.hash.replace(/^#/, ''), Q = {};
    h.split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) Q[kv.slice(0, i)] = kv.slice(i + 1); });
    function list(key, n) { return Q[key] ? decodeURIComponent(Q[key]).split('~').map(function (t) { return t.split(':').map(Number); }).filter(function (f) { return f.length >= n; }) : []; }
    var P = { pos: [], lock: {}, pf: Math.max(0, Math.min(2, parseInt(Q.pf) || 0)), fee: Q.of !== undefined && Q.of !== '' ? parseInt(Q.of) : 2, pl: parseInt(Q.pl) || 0, hasPl: Q.pl !== undefined, pd: parseInt(Q.pd) || 0, rtt: parseInt(Q.rtt) || 0,
      view: Math.max(0, Math.min(2, parseInt(Q.rv) || 0)), val: Q.ri !== '0', mon: [], top: [] };
    if (Q.mo) decodeURIComponent(Q.mo).split('~').forEach(function (t) {
      var f = t.split(':'); if (f.length < 10) return;
      P.pos.push({ k: +f[0], cp: f[1], bs: f[2], K: +f[3], e: +f[4], q: +f[5], open: +f[6], mark: +f[7], m: f[8], end: +f[9] });
    });
    list('hk', 3).forEach(function (f) { P.lock[f[0]] = { sh: f[1], cost: f[2] }; });
    list('rm', 9).forEach(function (f) { P.mon.push({ ym: f[0], v: [f[1], f[2], f[3], f[4]], value: f[5], inv: f[6], disc: f[7], dte: f[8] }); });
    list('rt', 5).forEach(function (f) { P.top.push({ k: f[0], v: [f[1], f[2], f[3], f[4]] }); });
    P.mon = P.mon.slice(-13); P.top = P.top.slice(0, 10);
    return P;
  }
  function total(S, P, k) { return { sh: S.h[k] + (P.lock[k] ? P.lock[k].sh : 0), cost: S.cb[k] + (P.lock[k] ? P.lock[k].cost : 0) }; }   // free + locked shares, cost x100

  // ---------------- small helpers
  function dstr(t) { var d = new Date(t); return WD[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MN[d.getUTCMonth()]; }
  function inH(t) { var hrs = Math.max(0, Math.floor((t - Date.now()) / 3600000)); return hrs < 48 ? 'in ' + hrs + ' h' : 'in ' + Math.floor(hrs / 24) + ' days'; }
  function soon(t) { return t - Date.now() <= 48 * 3600000; }
  function g(v) { return fmt(v) + ' ◆'; }
  function pc(v, d) { return sg(v, d === undefined ? 1 : d) + ' %'; }
  function card(x, y, w, h) { return A(x, y, w, h, '', '', GLASS); }
  function title(S, text) { return frame(S, '') + T(100, 108, 30, 'dim', text) + TR(1820, 110, 24, 'dim', clockHtml()); }
  function chipTxt(x, y, w, hh, col, label, size) { return A(x, y, w, hh, 'c', label, 'font-size:' + size + 'px;line-height:' + hh + 'px;border-radius:7px;background:' + col + ';color:#04070F'); }

  // ---------------- table model: groups per stock (shares row first, option rows under it), pages that never split a group
  function build(S, P, nof) {                                         // nof = ignore the pf filter (KPI cards, sunburst)
    var by = {}, ks = [], i;
    function grp(k) { if (!by[k]) { by[k] = { k: k, rows: [], exp: 0 }; ks.push(k); } return by[k]; }
    for (i = 0; i < STOCKS; i++) { var t = total(S, P, i); if (t.sh > 0) { var gg = grp(i), val = t.sh * S.px[i] / 100; gg.exp += val; gg.rows.push({ st: 'SH', k: i, sh: t.sh, open: t.cost / t.sh, mark: S.px[i], val: val, pl: val - t.cost / 100, pct: t.cost ? (val - t.cost / 100) / (t.cost / 100) * 100 : 0 }); } }
    P.pos.forEach(function (p) {
      var gg = grp(p.k), short = p.bs === 's', st = (short ? 'S' : 'L') + (p.cp === 'c' ? 'C' : 'P'), spot = S.px[p.k], q = p.q;
      var plv = (short ? p.open - p.mark : p.mark - p.open) * q, itm = short && (p.cp === 'c' ? spot > p.K : spot < p.K);
      gg.exp += p.K * q; gg.rows.push({ st: st, k: p.k, p: p, q: q, open: p.open, mark: p.mark, val: (short ? -1 : 1) * p.mark * q, pl: plv, pct: p.open ? plv / (p.open * q) * 100 : 0, itm: itm,
        ret: short ? p.open / p.K * 365 / (EXPD[p.e] || 7) * 100 : null });
    });
    var ord = {}; ks.forEach(function (k, i) { ord[k] = i; });                // STABLE: ties keep first-seen order (shares groups by stock id, then option-only groups in mo order) = the game's order
    ks.sort(function (a, b) { return by[b].exp - by[a].exp || ord[a] - ord[b]; });
    var groups = ks.map(function (k) { return by[k]; }), flat = [], pages = [], a = 0, n = 0;
    groups.forEach(function (gr) { var ho = gr.rows.some(function (r) { return r.st !== 'SH'; }), hs = gr.rows.some(function (r) { return r.st === 'SH'; }), w = hs && gr.rows.some(function (r) { return r.st === 'SC'; }); gr.rows.forEach(function (r) { r.hasOpt = ho; r.wheel = w; }); });
    if (!nof && P.pf) {
      groups = groups.map(function (gr) { return { k: gr.k, exp: gr.exp, rows: gr.rows.filter(function (r) { return (r.st === 'SH') === (P.pf === 1); }) }; }).filter(function (gr) { return gr.rows.length; });
    }
    groups.forEach(function (gr) {
      if (n && n + gr.rows.length > PG) { pages.push([a, flat.length]); a = flat.length; n = 0; }
      gr.rows.forEach(function (r, j) { r.first = j === 0; r.last = j === gr.rows.length - 1; r.n = gr.rows.length; flat.push(r); });
      n += gr.rows.length;
    });
    if (flat.length > a) pages.push([a, flat.length]);
    return { groups: groups, flat: flat, pages: pages };
  }
  function hint(r) {                                                  // small action hint: ITM > ALERT (report within 48 h) > CLOSE (80 % of the premium kept)
    var t = nextDay(CO.report_day[r.k], 12 * 3600000), opt = r.st !== 'SH';
    if (opt && r.st[0] === 'S' && r.itm) return ['ITM', 'var(--dn)'];
    if (soon(t) && (opt || r.hasOpt)) return ['ALERT', 'var(--amb)'];
    if (opt && r.st[0] === 'S' && r.mark <= r.open * .2) return ['CLOSE', 'var(--up)'];
    return null;
  }

  // ---------------- PAGE 1: MY PORTFOLIO
  function pPortfolio(S) {
    var P = parseP(S); if (S.p === 'shares') P.pf = 1; else if (S.p === 'myopt') P.pf = 2;      // old pages = the portfolio with a filter
    var A0 = build(S, P, true), M = build(S, P), h = title(S, 'MY PORTFOLIO'), sv = 0, locked = 0, prem = 0, opts = 0, stocks = 0, plAll = 0;
    A0.flat.forEach(function (r) { if (r.st === 'SH') { sv += r.val; stocks++; } else { opts++; if (r.st[0] === 'S') { prem += r.open * r.q; if (r.p.m === 'cash') locked += r.p.K * r.q; } } });
    M.flat.forEach(function (r) { plAll += r.pl; });
    if (P.hasPl) locked = P.pl;
    ['ALL ' + A0.flat.length, 'SHARES ' + stocks, 'OPTIONS ' + opts].forEach(function (lb, i) {
      h += A(450 + i * 210, 102, 196, 38, 'c', lb, 'font-size:22px;line-height:34px;border-radius:7px;box-sizing:border-box;' + (i === P.pf ? 'background:var(--acc);color:#04070F' : 'border:2px solid var(--line);color:var(--dim)'));
    });
    var inv = sv + locked;
    // owner 26 Nov: main view = what you decide on. ONE top strip, rows = name · how many · value · gain/loss (+ expiry for options); the rest sits in the detail panel of the selected row.
    h += card(100, 146, 1720, 84) + T(124, 158, 19, 'acc', 'PORTFOLIO VALUE', 0, 'letter-spacing:.14em') + T(124, 184, 40, '', g(inv)) +
      T(620, 158, 19, 'acc', 'GAIN / LOSS', 0, 'letter-spacing:.14em') + T(620, 184, 40, plAll >= 0 ? 'up' : 'dn', sg(plAll) + ' ◆') +
      T(1120, 158, 19, 'acc', 'FREE GLINTS', 0, 'letter-spacing:.14em') + T(1120, 184, 40, '', g(S.c));
    var yH = 250, X = { lg: 120, nm: 170, ch: 480, hn: 624, qt: 880, vl: 1070, pl: 1270 }, DX = 1320;
    h += T(X.nm, yH, 19, 'dim', 'STOCK', 0, 'letter-spacing:.1em') + TR(X.qt, yH, 19, 'dim', 'HOW MANY') + TR(X.vl, yH, 19, 'dim', 'VALUE') + TR(X.pl, yH, 19, 'dim', 'GAIN / LOSS') + A(100, yH + 28, 1200, 2, '', '', 'background:var(--line)');
    if (!M.flat.length) return h + TC(470, 50, 'dim', P.pf === 1 ? 'You own no shares.' : P.pf === 2 ? 'No open options.' : 'No open positions.') + TC(550, 32, 'dim', 'Buy shares or sell an option first.');
    var sel = Math.max(0, Math.min(M.flat.length - 1, S.sel)), pi = 0;
    M.pages.forEach(function (pg, i) { if (sel >= pg[0] && sel < pg[1]) pi = i; });
    var pg = M.pages[pi], y0 = 286, cur = M.flat[sel];
    for (var i = pg[0]; i < pg[1]; i++) {
      var r = M.flat[i], y = y0 + (i - pg[0]) * 52, k = r.k, st = STRAT[r.st], opt = r.st !== 'SH', up = r.pl >= 0, hn = hint(r);
      if (hn && hn[0] === 'CLOSE') hn = null;                                             // '80 % kept' hint dropped (detail only)
      if (r.first && r.n > 1) { var gh = 0, gi = i; while (gi < pg[1] && M.flat[gi].k === k) { gh += 52; gi++; } h += A(88, y - 3, 1224, gh - 2, '', '', 'background:#ffffff0A;border-radius:8px;border-left:6px solid ' + (r.wheel ? 'var(--amb)' : '#4A6A99') + ';box-sizing:border-box'); }
      if (i === sel) h += A(80, y - 3, 1232, 50, '', '', 'background:#7FD4FF33;border-left:8px solid var(--acc);box-sizing:border-box');
      h += A(X.lg, y + 5, 36, 36, '', logo(k, 36)) + T(X.nm, opt ? y - 1 : y + 7, 29, '', esc(NAMES[k]), 300, 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap');
      if (opt) h += T(X.nm, y + 28, 18, soon(r.p.end * 1000) ? 'amb' : 'dim', 'ends ' + inH(r.p.end * 1000).replace(' days', ' d'));
      h += chipTxt(X.ch, y + 7, 134, 30, st[1], st[0], 18);
      if (hn) h += chipTxt(X.hn, y + 7, 72, 30, hn[1], hn[0], 17);
      h += TR(X.qt, y + 7, 28, 'lab', fmt(opt ? r.q : r.sh));
      h += TR(X.vl, y + 7, 28, r.val < 0 ? 'dim' : '', fmt(r.val) + ' ◆') + TR(X.pl, y + 7, 28, up ? 'up' : 'dn', sg(r.pl) + ' ◆');
    }
    // detail panel of the selected row (everything that is not a decision)
    var dk = cur.k, dt = nextDay(CO.report_day[dk], 12 * 3600000), drs = soon(dt), dopt = cur.st !== 'SH', dry = dopt ? cur.ret : CO.div_yield[dk], dst = STRAT[cur.st];
    h += card(DX, 246, 500, 530) + T(DX + 20, 262, 19, 'acc', 'DETAIL', 0, 'letter-spacing:.14em') + A(DX + 20, 296, 64, 64, '', logo(dk, 64)) +
      T(DX + 100, 298, 28, '', esc(NAMES[dk]), 380, 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap') + T(DX + 100, 334, 19, 'dim', TICKS[dk] + ' · ' + esc(CO.sector[dk]), 380, 'overflow:hidden;white-space:nowrap');
    var dr = [[dopt ? (cur.st[0] === 'S' ? 'Got per share' : 'Paid per share') : 'Average cost', f2(cur.open)], ['Price now', f2(dopt ? cur.mark : S.px[dk])]];
    if (dopt) dr.push(['Strike', f2(cur.p.K)], ['Ends', dstr(cur.p.end * 1000) + ' · ' + inH(cur.p.end * 1000)]);
    dr.push([dopt ? 'A year if repeated' : 'Dividend a year', dry === null || dry === undefined ? '–' : (dry > 999 ? '>999' : dry < 10 ? dry.toFixed(1) : Math.round(dry)) + ' %'],
      ['Next report', '<span class="' + (drs ? 'amb' : '') + '">' + dstr(dt) + ' · ' + inH(dt) + '</span>'], ['Peers', CO.peers[dk].join(' · ')], ['Gain / loss', '<span class="' + (cur.pl >= 0 ? 'up' : 'dn') + '">' + pc(cur.pct) + '</span>']);
    dr.forEach(function (rw, i) { var yy = 376 + i * 44; h += T(DX + 20, yy + 4, 20, 'dim', rw[0]) + TR(DX + 480, yy, 24, 'lab', rw[1]) + A(DX + 20, yy + 36, 460, 1, '', '', 'background:var(--line)'); });
    if (cur.wheel) h += T(DX + 20, 376 + dr.length * 44 + 4, 18, 'amb', 'amber bar = shares with a short call on them', 460, 'white-space:normal;line-height:1.15');
    h += T(100, 800, 22, 'dim', 'page ' + (pi + 1) + '/' + M.pages.length + ' · ▲▼ move, past the end = next page');
    var act = cur.st === 'SH' ? ['SELL ' + TICKS[cur.k], 'var(--dn)'] : ['CLOSE EARLY', 'var(--amb)'];
    h += chipTxt(820, 794, 280, 36, act[1], act[0], 22);                // action of the selected row = the SELECT key
    // owner 25 Nov: ONE plain number each (fees already in it, no explanation line)
    var sn = 0, cn = 0;
    for (var j = 0; j < STOCKS; j++) if (S.h[j] > 0) sn += Math.floor(S.h[j] * fillSell(S.px[j], j) / 100) - S.f;
    P.pos.forEach(function (p) { var c = p.mark * p.q; cn += (p.bs === 's' ? -c : c) - P.fee * p.q; });
    if (P.pf !== 2 && stocks) h += T(100, 842, 32, '', 'If you sell all now: ' + fmt(sn) + ' ◆');
    if (P.pf !== 1 && opts) h += TR(1820, 842, 32, '', 'If you close all now: <span class="' + (cn >= 0 ? 'up' : 'dn') + '">' + sg(cn) + ' ◆</span>');
    h += T(100, 896, 20, 'dim', 'ALERT report within 48 h · ITM short option ends inside the money');
    return h;
  }

  // ---------------- sunburst model (sector = YOUR SECTORS ring, stock = COMPANY ring) from shares + cash put collateral
  function slices(S, P) {
    var M = build(S, P, true), bySec = {}, secs = [], tot = 0, flat = [];
    M.groups.forEach(function (gr) {
      var k = gr.k, v = 0, names = [];
      gr.rows.forEach(function (r) { if (r.st === 'SH') { v += r.val; names.push('SHARES'); } else { names.push(STRAT[r.st][0]); if (r.st === 'SP' && r.p.m === 'cash') v += r.p.K * r.q; } });
      if (v <= 0) return;
      var sec = CO.sector[k]; if (!bySec[sec]) { bySec[sec] = { name: sec, value: 0, kids: [] }; secs.push(bySec[sec]); }
      bySec[sec].value += v; bySec[sec].kids.push({ key: k, k: k, value: v, strat: names.join(' + '), rows: gr.rows }); tot += v;
    });
    secs.sort(function (a, b) { return b.value - a.value; });
    secs.forEach(function (s, i) { s.kids.sort(function (a, b) { return b.value - a.value; }); s.col = GCH.secCol(s.name, i); s.kids.forEach(function (kd) { kd.sec = s; kd.share = kd.value / tot * 100; flat.push(kd); }); });
    return { secs: secs, flat: flat, total: tot };
  }

  // ---------------- PAGE 2: MY RESULTS
  function vOverview(S, P) {
    var h = '', m = P.mon, n = m.length, yms = m.map(function (r) { return r.ym; });
    h += card(100, 146, 850, 372) + card(970, 146, 850, 372);
    var vals, cum = 0;
    if (P.val) vals = m.map(function (r) { return r.value; }); else vals = m.map(function (r) { cum += r.v[0] + r.v[1] + r.v[2] + r.v[3]; return cum; });
    h += T(124, 160, 21, 'acc', P.val ? 'GLINT VALUE · account at each month end' : 'INCOME ADDED UP · since you started', 0, 'letter-spacing:.1em');
    h += A(116, 196, 818, 306, '', GCH.line(818, 306, vals, yms, { zero: !P.val, col: P.val ? '#7FD4FF' : '#2EE59D' }));
    h += T(994, 160, 21, 'acc', 'INCOME EACH MONTH', 0, 'letter-spacing:.1em');
    var lg = [['puts', GCH.COL.puts], ['calls', GCH.COL.calls], ['dividends', GCH.COL.div], ['price gains', GCH.COL.gains]], lx = 1280;
    lg.forEach(function (l) { h += A(lx, 164, 16, 16, '', '', 'background:' + l[1] + ';border-radius:4px') + T(lx + 24, 158, 20, 'lab', l[0]); lx += 24 + l[0].length * 10.5 + 22; });
    h += A(986, 196, 818, 306, '', GCH.bars(818, 306, m, {}));
    // small cards: invested share with 80-100 / 50-80 / 0-50 bands, average discount on puts, average days to expiry
    var last = m[n - 1], ci = last.inv, mean = function (key) { var s = 0, c = 0; m.forEach(function (r) { if (r[key] > 0) { s += r[key]; c++; } }); return c ? s / c : 0; };
    var cx = [100, 680, 1260], tt = ['INVESTED SHARE OF ACCOUNT', 'AVERAGE DISCOUNT ON PUTS', 'AVERAGE DAYS TO EXPIRY'];
    cx.forEach(function (x, i) { h += card(x, 536, 560, 330) + T(x + 22, 550, 21, 'acc', tt[i], 0, 'letter-spacing:.1em'); });
    h += T(122, 580, 70, '', ci + ' <span style="font-size:40px" class="dim">%</span>') + T(330, 598, 20, 'dim', 'of the account is in shares<br>and locked glint now', 270, 'white-space:normal;line-height:1.2');
    h += A(122, 676, 520, 176, '', GCH.bandLine(516, 176, m.map(function (r) { return r.inv; }), yms, [[80, 100, '#FFB02E', '80–100'], [50, 80, '#7FD4FF', '50–80'], [0, 50, '#8C9AB5', '0–50']]));
    var ad = mean('disc') / 10, dd = mean('dte') / 10;
    h += T(702, 580, 70, '', ad.toFixed(1) + ' <span style="font-size:40px" class="dim">%</span>') + T(960, 598, 20, 'dim', 'strike below the share<br>price when you sold', 250, 'white-space:normal;line-height:1.2');
    h += A(702, 676, 520, 176, '', GCH.miniBars(520, 176, m.map(function (r) { return r.disc; }), yms, '#7FD4FF', mean('disc'), function (v) { return (v / 10).toFixed(1) + ' %'; }));
    h += T(1282, 580, 70, '', dd.toFixed(1) + ' <span style="font-size:40px" class="dim">days</span>') + T(1552, 598, 20, 'dim', 'how long your<br>contracts run', 250, 'white-space:normal;line-height:1.2');
    h += A(1282, 676, 520, 176, '', GCH.miniBars(520, 176, m.map(function (r) { return r.dte; }), yms, '#FFB02E', mean('dte'), function (v) { return (v / 10).toFixed(1) + ' d'; }));
    return h;
  }
  function vSectors(S, P) {
    var SL = slices(S, P), h = '';
    if (!SL.flat.length) return h + TC(470, 50, 'dim', 'Nothing invested yet.');
    var sel = Math.max(0, Math.min(SL.flat.length - 1, S.sel)), kd = SL.flat[sel];
    h += A(100, 150, 700, 716, '', GCH.sunburst(700, SL.secs, kd.key, { center: [fmt(SL.total) + ' ◆', 'invested'] }));
    h += T(830, 160, 21, 'acc', 'YOUR SECTORS', 0, 'letter-spacing:.1em');
    SL.secs.forEach(function (s, i) {
      var y = 204 + i * 52, on = s === kd.sec;
      if (on) h += A(822, y - 6, 440, 48, '', '', 'background:#7FD4FF22;border:1px solid #7FD4FF66;border-radius:8px;box-sizing:border-box');
      h += A(838, y + 6, 22, 22, '', '', 'background:' + s.col + ';border-radius:6px') + T(876, y, 25, on ? '' : 'lab', esc(s.name), 290, 'overflow:hidden;text-overflow:ellipsis') + TR(1246, y, 25, on ? '' : 'lab', (s.value / SL.total * 100).toFixed(1) + ' %');
    });
    h += card(1296, 146, 524, 720);
    var x = 1320;
    h += T(x, 160, 21, 'acc', 'COMPANY', 0, 'letter-spacing:.1em') + A(x, 204, 88, 88, '', logo(kd.k, 88));
    h += T(x + 108, 208, 32, '', esc(NAMES[kd.k]), 380, 'overflow:hidden;text-overflow:ellipsis') + T(x + 108, 252, 21, 'dim', TICKS[kd.k] + ' · ' + esc(CO.sector[kd.k]), 380, 'overflow:hidden');
    h += T(x, 316, 30, 'amb', esc(kd.strat), 480, 'white-space:normal;line-height:1.1') + T(x, 372, 84, '', kd.share.toFixed(1) + ' <span style="font-size:44px" class="dim">%</span>') + T(x, 468, 22, 'lab', 'of everything you have invested');
    var rep = nextDay(CO.report_day[kd.k], 12 * 3600000), sh = kd.rows.filter(function (r) { return r.st === 'SH'; })[0], pl = 0; kd.rows.forEach(function (r) { pl += r.pl; });
    var rows = [['Slice value', g(kd.value)], ['Shares', sh ? fmt(sh.sh) : 'none'], ['Options', fmt(kd.rows.length - (sh ? 1 : 0)) + ' open'], ['Sector total', (kd.sec.value / SL.total * 100).toFixed(1) + ' %'], ['P / L open', '<span class="' + (pl >= 0 ? 'up' : 'dn') + '">' + sg(pl) + ' ◆</span>'], ['Next report', '<span class="' + (soon(rep) ? 'amb' : '') + '">' + dstr(rep) + ' · ' + inH(rep) + '</span>']];
    rows.forEach(function (rw, i) { var y = 520 + i * 54; h += T(x, y + 4, 22, 'dim', rw[0]) + TR(1796, y, 27, 'lab', rw[1]) + A(x, y + 40, 476, 1, '', '', 'background:var(--line)'); });
    return h;
  }
  function vTop(S, P) {
    var h = '', T10 = P.top, X = { nm: 176, pu: 790, ca: 950, dv: 1130, gn: 1310, tt: 1480, bar: 1512, pc: 1810 }, n = Math.min(10, T10.length), sum = 0, others;
    var hd = [['PUTS', X.pu, GCH.COL.puts], ['CALLS', X.ca, GCH.COL.calls], ['DIVIDENDS', X.dv, GCH.COL.div], ['PRICE GAINS', X.gn, GCH.COL.gains]];
    h += T(120, 150, 20, 'dim', 'WHERE DID I EARN MOST · all time', 0, 'letter-spacing:.1em');
    hd.forEach(function (c) { h += TR(c[1], 150, 20, '', '<span style="color:' + c[2] + '">' + c[0] + '</span>', 'letter-spacing:.06em'); });
    h += TR(X.tt, 150, 20, 'lab', 'TOTAL') + T(X.bar, 150, 20, 'dim', 'SHARE OF RESULT') + A(100, 182, 1720, 2, '', '', 'background:var(--line)');
    if (!n) return h + TC(470, 50, 'dim', 'No results yet.') + TC(550, 32, 'dim', 'Sell an option or hold a dividend share first.');
    var sel = Math.max(0, Math.min(n - 1, S.sel)), pg = Math.floor(sel / 10), rtt = P.rtt || 0;
    T10.forEach(function (r) { sum += r.v[0] + r.v[1] + r.v[2] + r.v[3]; });
    function row(y, label, k, v, tot, share, hot) {
      var o = '';
      if (hot) o += A(80, y - 6, 1760, 52, '', '', 'background:#7FD4FF33;border-left:8px solid var(--acc);box-sizing:border-box');
      o += (k >= 0 ? A(120, y + 1, 38, 38, '', logo(k, 38)) : '') + T(k >= 0 ? 176 : 124, y + 3, 27, k >= 0 ? '' : 'lab', label, 420, 'overflow:hidden;text-overflow:ellipsis');
      if (v) [X.pu, X.ca, X.dv, X.gn].forEach(function (x, i) { o += TR(x, y + 3, 26, v[i] < 0 ? 'dn' : v[i] === 0 ? 'dim' : 'lab', v[i] === 0 ? '–' : fmt(v[i])); });
      o += TR(X.tt, y + 1, 30, tot >= 0 ? 'up' : 'dn', sg(tot));
      if (share !== null) o += A(X.bar, y + 10, 200, 20, '', '', 'background:#2C3E6677;border-radius:10px') + A(X.bar, y + 10, Math.max(0, Math.min(200, share * 2)), 20, '', '', 'background:' + (tot >= 0 ? 'var(--up)' : 'var(--dn)') + ';border-radius:10px') + TR(X.pc, y + 3, 26, 'lab', share.toFixed(1) + ' %');
      return o;
    }
    for (var i = pg * 10; i < Math.min(n, pg * 10 + 10); i++) {
      var r = T10[i], tot = r.v[0] + r.v[1] + r.v[2] + r.v[3];
      h += row(196 + (i - pg * 10) * 52, esc(NAMES[r.k]), r.k, r.v, tot, rtt ? tot / rtt * 100 : 0, i === sel);
    }
    others = rtt - sum;
    h += A(100, 724, 1720, 2, '', '', 'background:var(--line)');
    if (rtt) { h += row(734, 'Other stocks', -1, null, others, others / rtt * 100, false); h += A(100, 786, 1720, 2, '', '', 'background:var(--line)') + row(796, 'ALL STOCKS', -1, null, rtt, 100, false); }
    h += T(100, 846, 20, 'dim', 'page ' + (pg + 1) + '/' + Math.ceil(n / 10) + ' · top ' + n + ' stocks · ▲▼ move');
    return h;
  }
  function pResults(S) {
    var P = parseP(S), h = title(S, 'MY RESULTS · all time · ' + (P.view + 1) + '/3 ' + VIEWS[P.view]);
    if (!P.mon.length && P.view === 0) return h + TC(470, 50, 'dim', 'No results yet.') + TC(550, 32, 'dim', 'Sell an option or hold a dividend share first.');
    return h + (P.view === 0 ? vOverview(S, P) : P.view === 1 ? vSectors(S, P) : vTop(S, P));
  }

  // ---------------- register pages + bars (entry buttons only in free slots)
  PAGES.portfolio = PAGES.shares = PAGES.myopt = pPortfolio; PAGES.results = pResults;      // shares / myopt = old names, same page
  BARS.portfolio = ['BACK', '▲', '▼', 'FILTER', 'RESULTS', ''];
  BARS.results = ['BACK', '', '', '◀ VIEW', 'VIEW ▶', ''];
  var baseBar = bar;
  bar = function (S) {
    if (S.p === 'portfolio' || S.p === 'shares' || S.p === 'myopt') {                       // SELECT = the action of the picked row
      var Pp = parseP(S), Mm = build(S, Pp), r0 = Mm.flat[Math.max(0, Math.min(Mm.flat.length - 1, S.sel))];
      if (S.p === 'shares') Pp.pf = 1; else if (S.p === 'myopt') Pp.pf = 2;
      Mm = build(S, Pp); r0 = Mm.flat[Math.max(0, Math.min(Mm.flat.length - 1, S.sel))];
      BARS[S.p] = ['BACK', '▲', '▼', 'FILTER', 'RESULTS', r0 ? (r0.st === 'SH' ? 'SELL' : 'CLOSE EARLY') : ''];
    }
    if (S.p === 'results') { var P = parseP(S); BARS.results = ['BACK', P.view ? '▲' : '', P.view ? '▼' : '', '◀ VIEW', 'VIEW ▶', P.view ? '' : (P.val ? 'SHOW INCOME' : 'SHOW VALUE')]; }
    return baseBar(S);
  };
  render();
  return { parse: parseP, build: build, slices: slices, views: VIEWS.length, EXPD: EXPD };
})();
