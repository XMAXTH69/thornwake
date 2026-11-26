// Glint Exchange - OPTIONS pages (25 Nov 2026, GLINTS 14:09; design Glintline/design/GLINT-EXCHANGE.md sec 15, 15b, 16, 16b, 18, 25b-d, 28).
// ONE job: draw the options desk on the broker screen. Loaded AFTER exchange_live.html's main script; it adds pages to PAGES/BARS and
// (demo only) wraps press(). The game sends every number in the #fragment; this file never knows the price clock or its salt.
// MECHANIC: sell (short) or buy (long) CALL / PUT contracts of 100 shares against the house; covered / cash-secured / naked (margin desk).
//
// Pages   chain    options chain: expiry tabs, CALLS left | STRIKE | PUTS right, bid / ask / open interest, ITM greyed for SELL
//         ticket   order ticket: CALL/PUT + BUY/SELL toggles, contracts, premium, fee, max loss, break-even, collateral mode
//         oreview  check the total + MODE (covered / cash-secured / naked) -> SELECT -> Yes/No box
//         oclose   close-early check (reached from MY PORTFOLIO, exchange_portfolio.js: the old MY OPTIONS page was merged into it 25 Nov)
// Fragment keys (live; all prices CENTS PER SHARE; 1 contract = 100 shares)
//   oe 0..3 expiry (1 day, 3 days, 1 week, 4 weeks)   orow 0..20 selected strike row (10 = ATM)   oatm ATM strike   ost strike step
//   ocb oca oco   21 call bids / asks / open interest      opb opa opo   21 put bids / asks / open interest   (bid 0 = no bid)
//   oend expiry unix s   orep report day inside this expiry 1/0   ocp c|p   obs b|s   oq contracts   om cov|cash|naked
//   olv client level word ('' = margin desk locked)   olx leverage x10   onk max naked contracts now   oim margin to lock (glint, naked)
//   odp report deposit % (0 = none in this window)   of option fee per contract per side (default 2)
//   mo positions 'stock:c|p:b|s:strike:oe:qty:open:mark:mode:endUnix' joined by '~'   (open/mark = cents per share)
var OPT = (function () {
  'use strict';
  // owner 26 Nov (P1): AURUM, NULL WAKE, ECHOES, GLINTLINE options trade like every other stock (old sell-only ban removed)
  var EXP = ['1 DAY', '3 DAYS', '1 WEEK', '4 WEEKS'], EXPD = [1, 3, 7, 28], ROWS = 21, ATM = 10, VIS = 11;
  var MODE = { cov: 'COVERED', cash: 'CASH-SECURED', naked: 'NAKED' };
  var R = { CALM: .20, BUMPY: .30, WILD: .40 };                      // initial margin rate r by band (sec 15)
  var REPSIG = { 'DEFENSIVE INCOME': 2, 'VALUE': 3, 'CORE': 3, 'DYNAMIC VALUE': 4, 'GROWTH': 5, 'DYNAMIC GROWTH': 8, 'TURNAROUND': 10, 'SPECULATIVE': 12 };

  function csv(s, n) { return arr(s ? String(s).split(',') : null, n, 0); }
  function parseO(S) {
    var h = location.hash.replace(/^#/, ''), Q = {};
    h.split('&').forEach(function (kv) { var i = kv.indexOf('='); if (i > 0) Q[kv.slice(0, i)] = kv.slice(i + 1); });
    var o = { e: Math.max(0, Math.min(3, parseInt(Q.oe) || 0)), row: Math.max(0, Math.min(ROWS - 1, Q.orow === undefined ? ATM : parseInt(Q.orow) || 0)),
      atm: parseInt(Q.oatm) || 0, step: parseInt(Q.ost) || 0, cb: csv(Q.ocb, ROWS), ca: csv(Q.oca, ROWS), co: csv(Q.oco, ROWS), pb: csv(Q.opb, ROWS), pa: csv(Q.opa, ROWS), po: csv(Q.opo, ROWS),
      end: parseInt(Q.oend) || 0, rep: Q.orep === '1', cp: Q.ocp === 'p' ? 'p' : 'c', bs: Q.obs === 's' ? 's' : 'b', q: Math.max(0, parseInt(Q.oq) || 0), m: MODE[Q.om] ? Q.om : '',
      lv: Q.olv ? decodeURIComponent(Q.olv) : '', lx: parseInt(Q.olx) || 0, nk: parseInt(Q.onk) || 0, im: parseInt(Q.oim) || 0, dp: parseInt(Q.odp) || 0,
      fee: Q.of !== undefined && Q.of !== '' ? parseInt(Q.of) : 2, pos: [] };
    if (Q.mo) decodeURIComponent(Q.mo).split('~').forEach(function (t) {
      var f = t.split(':'); if (f.length < 10) return;
      o.pos.push({ k: +f[0], cp: f[1], bs: f[2], K: +f[3], e: +f[4], q: +f[5], open: +f[6], mark: +f[7], m: f[8], end: +f[9] });
    });
    if (!o.atm) o.atm = S.px[S.k];
    if (!o.step) o.step = Math.max(5, Math.round(o.atm * .02 / 5) * 5);
    return o;
  }
  function strike(o, i) { return o.atm + (i - ATM) * o.step; }
  function itm(cp, K, spot) { return cp === 'c' ? K < spot : K > spot; }
  function endText(t) {
    if (!t) return '';
    var d = new Date(t * 1000), wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()], left = t * 1000 - Date.now(), hrs = Math.max(0, Math.floor(left / 3600000));
    return 'ends ' + wd + ' 20:00 UTC · ' + (hrs >= 48 ? 'in ' + Math.floor(hrs / 24) + ' d ' + hrs % 24 + ' h' : 'in ' + hrs + ' h');
  }
  function kind(cp, bs) { return (bs === 's' ? 'SHORT ' : 'LONG ') + (cp === 'c' ? 'CALL' : 'PUT'); }
  function g(c) { return fmt(c) + ' ◆'; }                            // whole glint

  // ---- what the order means, in glint (shared by ticket + review; the game re-checks all of it)
  function ticket(S, o) {
    var k = S.k, spot = S.px[k], K = strike(o, o.row), call = o.cp === 'c', sell = o.bs === 's', q = Math.max(1, o.q || 1);
    var px = sell ? (call ? o.cb : o.pb)[o.row] : (call ? o.ca : o.pa)[o.row];   // cents per share
    var prem = Math.round(px * q), fee = o.fee * q;                   // cents x 100 shares / 100 = glint: px x q
    var t = { K: K, px: px, q: q, prem: prem, fee: fee, call: call, sell: sell, net: sell ? prem - fee : -(prem + fee), modes: [], why: {} };
    var feeShare = o.fee;                                             // glint per contract = cents per share
    t.be = call ? K + px + (sell ? -feeShare : feeShare) : K - px + (sell ? feeShare : -feeShare);
    if (!sell) { t.maxLoss = g(prem + fee); t.maxGain = call ? 'no limit' : g(Math.max(0, (K - px) * q - fee)); t.lock = 'nothing'; }
    else {
      var shares = S.h[k], cash = S.c, need = K * q;                  // K cents x 100 shares x q / 100 = K x q glint
      if (call) { if (shares >= 100 * q) t.modes.push('cov'); else t.why.cov = 'needs ' + fmt(100 * q) + ' free shares (you have ' + fmt(shares) + ')'; }
      else { if (cash >= need) t.modes.push('cash'); else t.why.cash = 'needs ' + g(need) + ' free (you have ' + g(cash) + ')'; }
      if (!o.lv) t.why.naked = 'margin desk locked (100 races + 7 days)';
      else if (o.e > 1) t.why.naked = 'naked = 1 DAY and 3 DAYS only';
      else if (o.nk < q) t.why.naked = 'level ' + o.lv + ' allows ' + o.nk + ' now';
      else t.modes.push('naked');
      t.mode = t.modes.indexOf(o.m) >= 0 ? o.m : (t.modes[0] || '');
      t.maxGain = g(prem - fee) + ' (the premium)';
      if (t.mode === 'cov') { t.maxLoss = 'no glint: your ' + fmt(100 * q) + ' shares go at ' + f2(K); t.lock = fmt(100 * q) + ' shares'; }
      else if (t.mode === 'cash') { t.maxLoss = g(Math.max(0, (K - px) * q + fee)) + ' if it falls to 0'; t.lock = g(need); }
      else if (t.mode === 'naked') { t.maxLoss = call ? 'NO LIMIT · margin call, then forced close' : g(Math.max(0, (K - px) * q + fee)) + ' if it falls to 0'; t.lock = g(o.im) + ' margin' + (o.dp ? ' + report deposit ' + o.dp + ' %' : ''); }
      else { t.maxLoss = '-'; t.lock = '-'; }
      if (!px) t.be = 0;
      if (itm(o.cp, K, spot)) { t.refuse = 'In the money: SELL only at or out of the money (pick a ' + (call ? 'higher' : 'lower') + ' strike)'; }
      else if (px < 1) t.refuse = 'No bid on this strike (worth less than 1 glint a contract)';
      else if (!t.mode) t.refuse = call ? 'Not enough shares to cover - and no naked desk for this order' : 'Not enough free glint - and no naked desk for this order';
    }
    return t;
  }

  // ---------------- pages
  function head(S, o, title) {
    var k = S.k;
    return frame(S, '') + A(120, 106, 34, 34, '', logo(k, 34)) + T(166, 108, 30, 'dim', title + ' · ' + esc(NAMES[k]) + ' · <span class="acc">' + TICKS[k] + '</span> · spot <span style="color:#fff">' + f2(S.px[k]) + ' ◆</span>') + TR(1820, 110, 24, 'dim', clockHtml());
  }
  function tabs(o, y) {
    var h = '';
    for (var i = 0; i < 4; i++) {
      var on = i === o.e, x = 100 + i * 250;
      h += A(x, y, 230, 58, '', '<div class="c" style="line-height:58px;font-size:30px">' + EXP[i] + '</div>', 'border-radius:12px;box-sizing:border-box;' + (on ? 'background:var(--acc);color:#04070F' : 'border:2px solid var(--line);color:var(--lab)'));
    }
    return h + T(1120, y - 4, 26, 'lab', endText(o.end)) + T(1120, y + 30, 20, 'dim', 'naked (margin desk): 1 DAY and 3 DAYS only');
  }
  function pChain(S) {
    var o = parseO(S), k = S.k, spot = S.px[k], h = head(S, o, 'OPTIONS');
    h += tabs(o, 150);
    var yH = 252, C = { cOI: 300, cB: 520, cA: 720, kx: 830, kw: 260, pB: 1300, pA: 1500, pOI: 1720 };
    h += T(120, yH - 32, 24, 'up', 'CALLS') + TR(1780, yH - 32, 24, 'dn', 'PUTS');
    h += TR(C.cOI, yH, 22, 'dim', 'OPEN INT.') + TR(C.cB, yH, 22, 'dim', 'BID (you sell)') + TR(C.cA, yH, 22, 'dim', 'ASK (you buy)') + A(C.kx, yH, C.kw, 0, 'c dim', 'STRIKE', 'font-size:22px');
    h += TR(C.pB, yH, 22, 'dim', 'BID (you sell)') + TR(C.pA, yH, 22, 'dim', 'ASK (you buy)') + TR(C.pOI, yH, 22, 'dim', 'OPEN INT.') + A(100, yH + 32, 1720, 2, '', '', 'background:var(--line)');
    var top = Math.max(0, Math.min(ROWS - VIS, o.row - 5)), y0 = yH + 44, P = 44, spotDrawn = false;
    for (var i = top; i < top + VIS; i++) {
      var y = y0 + (i - top) * P, K = strike(o, i), sel = i === o.row, cI = itm('c', K, spot), pI = itm('p', K, spot);
      if (!spotDrawn && K > spot) { spotDrawn = true; h += A(100, y - 3, 1720, 2, '', '', 'background:var(--acc)') + A(C.kx - 112, y - 14, 104, 24, 'c', 'spot ' + f2(spot), 'font-size:18px;line-height:24px;background:var(--acc);color:#04070F;border-radius:12px'); }
      if (cI) h += A(100, y, 680, P - 4, '', '', 'background:#ffffff08');
      if (pI) h += A(1140, y, 680, P - 4, '', '', 'background:#ffffff08');
      if (sel) h += A(84, y - 3, 1752, P + 2, '', '', 'border:3px solid var(--acc);border-radius:8px;box-sizing:border-box;background:#7FD4FF22');
      var cbid = o.cb[i], pbid = o.pb[i];
      h += TR(C.cOI, y + 6, 26, 'dim', fmt(o.co[i])) + TR(C.cB, y + 4, 30, cI ? 'dim' : 'up', cbid ? f2(cbid) : '–') + TR(C.cA, y + 4, 30, 'lab', o.ca[i] ? f2(o.ca[i]) : '–');
      h += A(C.kx, y + 2, C.kw, P - 8, 'c', f2(K), 'font-size:32px;line-height:' + (P - 8) + 'px;border-radius:6px;' + (i === ATM ? 'background:#16264A;color:var(--acc)' : 'color:#fff'));
      h += TR(C.pB, y + 4, 30, pI ? 'dim' : 'dn', pbid ? f2(pbid) : '–') + TR(C.pA, y + 4, 30, 'lab', o.pa[i] ? f2(o.pa[i]) : '–') + TR(C.pOI, y + 6, 26, 'dim', fmt(o.po[i]));
    }
    h += A(100, y0 + VIS * P + 6, 1720, 2, '', '', 'background:var(--line)');
    h += T(100, 800, 24, 'dim', 'Prices are glint per SHARE · 1 contract = 100 shares · fee ' + o.fee + ' ◆ a contract each way') + TR(1820, 800, 24, 'dim', 'strike ' + (o.row + 1) + ' of ' + ROWS);
    h += T(100, 836, 24, 'lab', 'Grey side = in the money: BUY only. SELL needs at or out of the money.');
    return h;
  }
  function pill(x, y, w, on, label, sub, col) {
    return A(x, y, w, 96, '', '<div class="c" style="font-size:44px;line-height:60px;margin-top:6px">' + label + '</div><div class="c" style="font-size:20px;line-height:22px;opacity:.85">' + sub + '</div>',
      'border-radius:16px;box-sizing:border-box;' + (on ? 'background:var(--' + col + ');color:#04070F;border:3px solid var(--' + col + ')' : 'border:3px solid var(--line);color:var(--dim)'));
  }
  function summary(S, o, t, y0) {
    var rows = [['Price a share', t.px ? (t.sell ? 'bid ' : 'ask ') + f2(t.px) + ' ◆' : 'no ' + (t.sell ? 'bid' : 'ask'), 'lab'], ['Premium (' + fmt(t.q) + ' × 100)', g(t.prem), 'lab'], ['Broker fee (' + o.fee + ' a contract)', g(t.fee), 'amb'],
      [t.net >= 0 ? 'YOU GET NOW' : 'YOU PAY NOW', sg(t.net) + ' ◆', t.net >= 0 ? 'up' : ''], ['Max loss', t.maxLoss, t.sell && t.mode === 'naked' && t.call ? 'dn' : 'lab'], ['Max gain', t.maxGain, 'lab'],
      ['Break-even at expiry', f2(t.be) + ' ◆', 'amb'], ['Locked', t.lock, 'lab']];
    var h = A(1080, y0, 760, 70 + rows.length * 58, '', '', 'background:#04070F66;border:2px solid var(--line);border-radius:14px') + T(1110, y0 + 14, 22, 'acc', 'THIS ORDER', 0, 'letter-spacing:.2em');
    rows.forEach(function (r, i) { var y = y0 + 56 + i * 58, fs = i === 3 ? 38 : String(r[1]).length > 26 ? 22 : 28; h += T(1110, y + 6, 24, 'dim', r[0]) + A(1400, y + (fs === 22 ? -2 : 0), 410, 0, r[2] + ' r', esc(r[1]), 'font-size:' + fs + 'px;line-height:' + Math.round(fs * 1.1) + 'px;white-space:normal'); if (i === 2) h += A(1110, y + 50, 700, 2, '', '', 'background:var(--line)'); });
    return h;
  }
  function modes(o, t, y) {
    var h = T(100, y, 24, 'acc', 'COLLATERAL', 0, 'letter-spacing:.2em');
    if (!t.sell) return h + T(100, y + 40, 30, 'lab', 'None. You can lose only what you pay.') + T(100, y + 84, 24, 'dim', 'At expiry: in the money = paid out automatically, else it expires.');
    var list = t.call ? [['cov', 'COVERED', 'you own the 100 shares per contract']] : [['cash', 'CASH-SECURED', 'strike × 100 is locked per contract']];
    list.push(['naked', 'NAKED - margin', '1 DAY / 3 DAYS only · report deposit applies']);
    list.forEach(function (m, i) {
      var yy = y + 40 + i * 86, on = t.mode === m[0], ok = t.modes.indexOf(m[0]) >= 0;
      h += A(100, yy, 900, 76, '', '', 'border-radius:12px;box-sizing:border-box;' + (on ? 'border:3px solid var(--acc);background:#7FD4FF22' : 'border:2px solid var(--line)' + (ok ? '' : ';opacity:.5')));
      h += T(124, yy + 8, 30, on ? 'acc' : ok ? 'lab' : 'dim', (on ? '● ' : '○ ') + m[1]) + T(124, yy + 46, 20, 'dim', ok ? m[2] : (t.why[m[0]] || m[2]));
    });
    return h + (o.lv ? T(100, y + 220, 22, 'dim', 'Client level ' + esc(o.lv) + ' · leverage up to ' + (o.lx / 10) + '×') : '');
  }
  function pTicket(S) {
    var o = parseO(S), t = ticket(S, o), h = head(S, o, 'ORDER TICKET');
    h += T(100, 150, 30, 'lab', EXP[o.e] + ' · strike <span style="color:#fff">' + f2(t.K) + '</span> · ' + endText(o.end));
    h += pill(100, 196, 220, t.call, 'CALL', '', 'up') + pill(330, 196, 220, !t.call, 'PUT', '', 'dn');
    var tb = ticket(S, Object.assign({}, o, { bs: 'b' })), ts = ticket(S, Object.assign({}, o, { bs: 's' }));
    h += pill(580, 196, 220, !t.sell, 'LONG', (tb.px ? 'you pay ' + g(Math.abs(tb.net)) : 'no ask'), 'up') + pill(810, 196, 220, t.sell, 'SHORT', (ts.px ? 'you get ' + g(Math.abs(ts.net)) : 'no bid'), 'dn');
    h += T(100, 316, 24, 'acc', 'CONTRACTS', 0, 'letter-spacing:.2em') + T(100, 344, 96, '', fmt(t.q) + ' <span class="dim" style="font-size:36px">= ' + fmt(t.q * 100) + ' shares</span>');
    h += modes(o, t, 470);
    h += summary(S, o, t, 150);
    h += T(100, 760, 26, 'lab', esc(plainText(S, t)), 0, 'white-space:normal;width:940px;line-height:1.3');
    if (t.refuse) h += A(1080, 790, 760, 70, '', '<div style="padding:10px 18px;font-size:24px;white-space:normal;line-height:1.2">' + esc(t.refuse) + '</div>', 'border:2px solid var(--dn);border-radius:12px;color:var(--dn);box-sizing:border-box');
    return h;
  }
  function plainText(S, t) {
    if (t.sell && t.mode === 'naked') return 'If ' + NAMES[S.k] + ' ends ' + (t.call ? 'ABOVE ' : 'BELOW ') + f2(t.K) + ', you pay the difference × ' + fmt(100 * t.q) + ' shares (cash, no shares move). Else you keep everything.';
    return t.sell ? (t.call ? 'If ' + NAMES[S.k] + ' ends ABOVE ' + f2(t.K) + ', you sell ' + fmt(100 * t.q) + ' shares at ' + f2(t.K) + '. Else you keep everything.' : 'If ' + NAMES[S.k] + ' ends BELOW ' + f2(t.K) + ', you buy ' + fmt(100 * t.q) + ' shares at ' + f2(t.K) + '. Else you keep everything.')
      : (t.call ? 'You win if ' + NAMES[S.k] + ' ends above ' + f2(t.be) + '.' : 'You win if ' + NAMES[S.k] + ' ends below ' + f2(t.be) + '.') + ' Else the most you lose is ' + g(t.prem + t.fee) + '.';
  }
  function pReview(S) {
    var o = parseO(S), t = ticket(S, o), h = head(S, o, 'CHECK THE ORDER');
    var name = (t.sell ? 'SELL ' : 'BUY ') + fmt(t.q) + ' ' + (t.call ? 'CALL' : 'PUT') + (t.q > 1 ? 'S' : '') + ' · ' + f2(t.K) + ' · ' + EXP[o.e];
    h += T(100, 140, 80, t.sell ? 'dn' : 'up', t.sell ? 'SHORT' : 'LONG') + T(100, 226, 28, 'lab', (t.sell ? 'you get ' : 'you pay ') + g(Math.abs(t.net)) + ' premium now');
    h += T(100, 270, 36, t.sell ? 'amb' : 'acc', name);
    h += T(100, 316, 100, t.sell ? 'up' : '', (t.sell ? '+' : '−') + fmt(Math.abs(t.net)) + ' <span class="acc" style="font-size:60px">◆</span>') + T(100, 436, 32, 'lab', t.sell ? 'you are paid now' : 'you pay now') + T(100, 476, 22, 'dim', 'no fee if it runs to the end');
    if (t.sell) h += T(100, 520, 30, 'lab', 'Mode: <span class="acc">' + (MODE[t.mode] || '-') + '</span>' + (t.modes.length > 1 ? ' <span class="dim" style="font-size:22px">(MODE changes it)</span>' : '')) + T(100, 562, 26, 'dim', 'Locked until expiry: ' + esc(t.lock));
    var plain = plainText(S, t);
    h += T(100, 610, 30, '', esc(plain), 0, 'white-space:normal;width:940px;line-height:1.3');
    if (t.sell && t.mode === 'naked') h += T(100, 740, 26, 'dn', 'Margin: if your account gets too thin the broker calls you, then closes it by force. Only Exchange glint is at risk.', 0, 'white-space:normal;width:940px;line-height:1.3');
    h += summary(S, o, t, 150);
    h += t.refuse ? TC(820, 30, 'dn', esc(t.refuse)) : TC(820, 30, 'lab', 'Press ' + (t.sell ? 'SELL NOW' : 'BUY NOW') + ', then Yes in the box');
    return h;
  }
  function pl(p) { return (p.bs === 's' ? p.open - p.mark : p.mark - p.open) * p.q; }      // glint
  function pClose(S) {
    var o = parseO(S), p = o.pos[Math.min(S.sel, o.pos.length - 1)], h = frame(S, '');
    if (!p) return h + TC(400, 50, 'dim', 'No position picked');
    var sh = p.bs === 's', cost = p.mark * p.q, fee = o.fee * p.q, net = sh ? -(cost + fee) : cost - fee, res = pl(p) - fee - o.fee * p.q;
    h += T(100, 108, 30, 'dim', 'CLOSE EARLY · ' + esc(NAMES[p.k]) + ' · ' + kind(p.cp, p.bs) + ' ' + f2(p.K) + ' · ' + EXP[p.e]);
    h += T(100, 150, 120, net >= 0 ? 'up' : '', (net >= 0 ? '+' : '−') + fmt(Math.abs(net)) + ' <span class="acc" style="font-size:60px">◆</span>') + T(100, 292, 32, 'lab', sh ? 'you pay to buy it back' : 'you get for selling it back');
    var rows = [[(sh ? 'Buy back ' : 'Sell back ') + fmt(p.q) + ' × 100 × ' + f2(p.mark), g(cost), 'lab'], ['Result of the whole trade', sg(res) + ' ◆', res >= 0 ? 'up' : 'dn']];
    rows.forEach(function (r, i) { var y = 380 + i * 66; h += T(100, y, 32, 'lab', r[0]) + TR(1300, y, 34, r[2], r[1]); });
    h += T(100, 600, 28, 'dim', sh ? 'The locked ' + (p.m === 'cov' ? 'shares are' : 'glint is') + ' free again at once.' : 'The glint goes to your free Exchange glint.');
    h += TC(820, 30, 'lab', 'Press CLOSE NOW, then Yes in the box');
    return h;
  }

  // ---------------- register pages + bars
  PAGES.chain = pChain; PAGES.ticket = pTicket; PAGES.oreview = pReview; PAGES.oclose = pClose;
  BARS.stock = ['BACK', 'BUY', 'SELL', 'MY PORTFOLIO', 'OPTIONS', ''];
  BARS.chain = ['BACK', '▲', '▼', '◀ EXPIRY', 'EXPIRY ▶', 'TRADE'];
  BARS.ticket = ['BACK', 'CALL / PUT', 'BUY / SELL', '−1', '+1', 'REVIEW'];
  BARS.oreview = ['BACK', '', '', '−1', 'MODE ▸', 'CONFIRM'];
  BARS.oclose = ['BACK', '', '', '', '', 'CLOSE NOW'];
  var baseBar = bar;
  bar = function (S) {
    var h = baseBar(S);
    if (S.p === 'oreview') { var o = parseO(S), t = ticket(S, o); h = h.replace('>CONFIRM<', '>' + (t.sell ? 'SELL NOW' : 'BUY NOW') + '<'); if (!t.sell || t.modes.length < 2) h = h.replace('>MODE ▸<', '><').replace(/class="btn"([^>]*)><\/div>/, 'class="btn off"$1></div>'); }
    return h;
  };

  // ---------------- DEMO: a local model only to make the demo clickable (the game sends real numbers)
  function ncdf(x) { var t = 1 / (1 + .2316419 * Math.abs(x)), d = .3989423 * Math.exp(-x * x / 2), p = d * t * (.3193815 + t * (-.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274)))); return x > 0 ? 1 - p : p; }
  function endOf(e) { var n = new Date(), t = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 20); if (t - Date.now() < 2 * 3600000) t += DAYMS; return Math.round((t + (EXPD[e] - 1) * DAYMS) / 1000); }
  function demoChain() {
    var k = D.k, S0 = D.px[k], band = BANDS[k], tk = S0 < 1000 ? 5 : S0 < 3000 ? 10 : 25, end = endOf(D.oe), T = Math.max(.05, (end * 1000 - Date.now()) / DAYMS);
    var stepPct = { CALM: 1, BUMPY: 2, WILD: 3 }[band] * [1, 1.5, 2, 3][D.oe], step = Math.max(2 * tk, Math.round(S0 * stepPct / 100 / tk) * tk), atm = Math.round(S0 / tk) * tk;
    var v = { CALM: 2.03, BUMPY: 4.06, WILD: 8.12 }[band] / 100, rep = 0, rd = CO.report_day[k], day0 = Math.floor((Date.now() - EPOCH) / DAYMS);
    for (var dd = 0; dd <= EXPD[D.oe]; dd++) if (((day0 + dd) % 28) === rd) rep = (REPSIG[CO.category[k]] || 3) / 100;
    var c = { oatm: atm, ost: step, oend: end, orep: rep ? 1 : 0, ocb: [], oca: [], oco: [], opb: [], opa: [], opo: [] };
    for (var i = 0; i < ROWS; i++) {
      var K = atm + (i - ATM) * step, n = Math.min(10, Math.abs(i - ATM)) / 10;
      ['c', 'p'].forEach(function (cp) {
        var vv = v * (cp === 'p' ? (K < S0 ? 1 + .12 * n : 1) : (K > S0 ? 1 - .04 * n : 1)), sd = Math.sqrt(vv * vv * T + rep * rep), d1 = (Math.log(S0 / K) + sd * sd / 2) / sd, d2 = d1 - sd;
        var val = cp === 'c' ? S0 * ncdf(d1) - K * ncdf(d2) : K * ncdf(-d2) - S0 * ncdf(-d1), bid = val < 1 ? 0 : Math.round(val), ask = val < .5 ? 0 : Math.max(1, Math.ceil(val * 1.10));
        var oi = Math.max(0, Math.round(900 * Math.exp(-Math.abs(i - ATM + (cp === 'c' ? -2 : 2)) / 3) * (.6 + .4 * Math.abs(Math.sin(K + k)))));
        c['o' + cp + 'b'].push(bid); c['o' + cp + 'a'].push(ask); c['o' + cp + 'o'].push(oi);
      });
    }
    return c;
  }
  function im() {                                                     // naked initial margin (sec 15): 100 S r + premium, OTM deducted, floor 10 %
    var k = D.k, S0 = D.px[k], c = demoChain(), K = c.oatm + (D.orow - ATM) * c.ost, r = R[BANDS[k]] * (D.oe === 1 ? 1.3 : 1), otm = D.ocp === 'c' ? Math.max(0, K - S0) : Math.max(0, S0 - K);
    var px = (D.ocp === 'c' ? c.ocb : c.opb)[D.orow];
    return Math.ceil(D.oq * (Math.max(S0 * r - otm, S0 * .1) + px));
  }
  var baseWrite = demoWrite;
  demoWrite = function () {
    if (!D) return baseWrite();
    baseWrite();
    if (['chain', 'ticket', 'oreview', 'myopt', 'oclose'].indexOf(D.p) < 0) return;
    var c = demoChain(), u = location.hash.replace(/^#/, '');
    for (var key in c) u += '&' + key + '=' + (Array.isArray(c[key]) ? c[key].join(',') : c[key]);
    u += '&oe=' + D.oe + '&orow=' + D.orow + '&ocp=' + D.ocp + '&obs=' + D.obs + '&oq=' + D.oq + '&om=' + D.om + '&olv=' + D.olv + '&olx=' + D.olx + '&onk=' + D.onk + '&oim=' + im() + '&odp=0&of=2';
    u += '&mo=' + encodeURIComponent(D.pos.map(function (p) { return [p.k, p.cp, p.bs, p.K, p.e, p.q, p.open, p.mark, p.m, p.end].join(':'); }).join('~'));
    location.hash = u;
  };
  function demoOpen() {
    D.oe = 0; D.orow = ATM; D.ocp = 'c'; D.obs = 's'; D.oq = 1; D.om = ''; D.olv = 'STANDARD'; D.olx = 10; D.onk = 3;
    D.pos = [{ k: 3, cp: 'p', bs: 's', K: 800, e: 2, q: 2, open: 22, mark: 15, m: 'cash', end: endOf(2) }, { k: 2, cp: 'c', bs: 's', K: 2600, e: 1, q: 1, open: 41, mark: 52, m: 'cov', end: endOf(1) },
      { k: 6, cp: 'c', bs: 'b', K: 620, e: 0, q: 3, open: 9, mark: 14, m: '', end: endOf(0) }];
  }
  function curT() { var S = parse(); return ticket(S, parseO(S)); }
  function book(t) {
    var k = D.k, c = demoChain();
    D.c += t.net; if (t.sell && t.mode === 'cash') D.c -= t.K * t.q;
    D.pos.push({ k: k, cp: D.ocp, bs: D.obs, K: t.K, e: D.oe, q: t.q, open: t.px, mark: t.px, m: t.sell ? t.mode : '', end: c.oend });
    D.r = '1|opt|' + t.q + '|' + t.net + '|' + t.fee + '|' + encodeURIComponent((t.sell ? 'Sold ' : 'Bought ') + t.q + ' ' + (t.call ? 'call' : 'put') + (t.q > 1 ? 's' : '') + ' ' + f2(t.K) + ' · ' + EXP[D.oe]);
    D.p = 'wait'; demoWrite(); setTimeout(function () { D.sel = D.pos.length - 1; D.p = 'myopt'; D.r = ''; demoWrite(); }, 700);
  }
  var basePress = press, baseDlg = showDlg, dlgKind = '';
  press = function (id) {
    if (!D || D.p === 'wait' || pendingYes) return;
    if (D.oe === undefined) demoOpen();
    var p = D.p;
    if (p === 'stock' && id === 'plus') { D.p = 'chain'; D.orow = ATM; return demoWrite(); }
    if (p === 'stock' && id === 'minus') { D.p = 'myopt'; D.sel = 0; return demoWrite(); }
    if (p === 'chain') {
      if (id === 'back') D.p = 'stock'; else if (id === 'up') D.orow = Math.max(0, D.orow - 1); else if (id === 'down') D.orow = Math.min(ROWS - 1, D.orow + 1);
      else if (id === 'minus') D.oe = (D.oe + 3) % 4; else if (id === 'plus') D.oe = (D.oe + 1) % 4;
      else if (id === 'select') { var spot = D.px[D.k], c = demoChain(), K = c.oatm + (D.orow - ATM) * c.ost; D.ocp = K >= spot ? 'c' : 'p'; D.obs = 's'; D.oq = 1; D.om = ''; D.p = 'ticket'; }
      return demoWrite();
    }
    if (p === 'ticket') {
      if (id === 'back') D.p = 'chain'; else if (id === 'up') { D.ocp = D.ocp === 'c' ? 'p' : 'c'; D.om = ''; } else if (id === 'down') { D.obs = D.obs === 's' ? 'b' : 's'; D.om = ''; }
      else if (id === 'minus') D.oq = Math.max(1, D.oq - 1); else if (id === 'plus') D.oq = Math.min(99, D.oq + 1); else if (id === 'select') D.p = 'oreview';
      return demoWrite();
    }
    if (p === 'oreview') {
      var t = curT();
      if (id === 'back') D.p = 'ticket'; else if (id === 'minus') D.oq = Math.max(1, D.oq - 1);
      else if (id === 'plus' && t.modes.length > 1) D.om = t.modes[(t.modes.indexOf(t.mode) + 1) % t.modes.length];
      else if (id === 'select' && !t.refuse) { dlgKind = 'open'; showDlg(); return; }
      return demoWrite();
    }
    if (p === 'oclose') { if (id === 'back') D.p = 'myopt'; else if (id === 'select') { dlgKind = 'close'; showDlg(); return; } return demoWrite(); }
    return basePress(id);
  };
  showDlg = function () {
    if (!D || ['oreview', 'oclose'].indexOf(D.p) < 0) return baseDlg();
    var d = document.getElementById('dlg'), msg;
    if (D.p === 'oreview') { var t = curT(); msg = (t.sell ? 'SHORT ' : 'LONG ') + t.q + ' ' + (t.call ? 'call' : 'put') + (t.q > 1 ? 's' : '') + ' ' + f2(t.K) + ' ' + EXP[D.oe] + '?<br>' + (t.sell ? 'you get ' : 'you pay ') + fmt(Math.abs(t.net)) + ' ◆ premium now'; }
    else { var p = D.pos[Math.min(D.sel, D.pos.length - 1)]; msg = 'Close ' + kind(p.cp, p.bs).toLowerCase() + ' ' + f2(p.K) + ' now?'; }
    d.innerHTML = '<b>' + msg + '</b><i style="left:120px;background:var(--acc);color:#04070F" data-yn="y">Yes</i><i style="right:120px;background:#3A4050;color:#fff" data-yn="n">No</i>';
    d.style.display = 'block'; pendingYes = true;
  };
  var baseAnswer = answer;
  answer = function (y) {
    if (!D || ['oreview', 'oclose'].indexOf(D.p) < 0) return baseAnswer(y);
    if (!pendingYes) return; pendingYes = false; var d = document.getElementById('dlg'); if (d) d.style.display = 'none';
    if (!y) return;
    if (D.p === 'oreview') book(curT());
    else { var i = Math.min(D.sel, D.pos.length - 1), p = D.pos[i]; D.c += (p.bs === 's' ? -1 : 1) * p.mark * p.q - 2 * p.q; if (p.m === 'cash') D.c += p.K * p.q; D.pos.splice(i, 1); D.sel = 0; D.p = 'myopt'; demoWrite(); }
  };
  if (DEMO) {
    var H0 = typeof HASH0 === 'string' ? HASH0 : location.hash, sp = (H0.match(/[#&]p=(\w+)/) || [])[1];
    if (sp && ['chain', 'ticket', 'oreview', 'myopt', 'oclose'].indexOf(sp) >= 0) {
      demoOpen(); D.p = sp; var m = H0.match(/[#&]k=(\d+)/); if (m) D.k = +m[1];
      m = H0.match(/orow=(\d+)/); if (m) D.orow = +m[1]; m = H0.match(/oe=(\d)/); if (m) D.oe = +m[1];
      m = H0.match(/ocp=(\w)/); if (m) D.ocp = m[1]; m = H0.match(/obs=(\w)/); if (m) D.obs = m[1]; m = H0.match(/oq=(\d+)/); if (m) D.oq = +m[1];
      m = H0.match(/om=(\w+)/); if (m) D.om = m[1];
      demoWrite();
    }
  }
  render();
  return { parse: parseO, ticket: ticket };
})();
