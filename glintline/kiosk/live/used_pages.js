'use strict';
/* Glintline LIVE kiosk: the USED MARKET pages (26 Nov 2026, design/USED-MARKET.md). ONE job: draw used_l / used_s / used_c / used_p / used_x from the
   URL #fragment that GlintKiosk.cs builds (UsedFrag); no data lives here. Loaded by kiosk_live.html after kiosk_pages.js (shares CAT, CARD, base, card,
   buttons, carImg, tag, T, TC, esc, money, title ...). Text values are percent-encoded by the kiosk (+ = space), parse() decodes them.
   Fragment keys (all short, the kiosk sends ONE lot / ride per page, never the whole list):
     t=0|1       tab (0 LISTINGS, 1 SELL)                 i,n = this item / how many (1-based)       k = vehicle key (catalog name + picture)
     used_l  LISTINGS   n=0 -> empty;  s seller, pr price, v value (new price + extras), w what comes with it, me=1 own lot, c=1 confirm armed / 2 working
     used_s  SELL list  val value, md 0 no sale / 1 paddock only / 2 paddock + players, why (md 0), lot = open lot id (listed), pr = its price
     used_c  CHOICE     val, o chosen option, os option letters (p PADDOCK, l PLAYERS, x CANCEL LISTING), c=1 paddock confirm armed / 2 working
     used_p  LIST PRICE val, pct (70..100), pr price, you = you get after the 15 % fee, c=2 working
     used_x  z=0 asking the market / z=1 closed                                                                                              */
function zoneBtn(label) {     // the free DRIVE hit zone (bottom right) used as a second button on the START and USED pages
  return '<div class="abs drive btn" style="font-size:40px;letter-spacing:.08em">' + esc(label) + '</div>';
}
function selBtn(label, dim) { return '<div class="abs sel btn" style="font-size:' + (label.length > 8 ? 46 : 62) + 'px;letter-spacing:' + (label.length > 8 ? '.1em' : '.3em') + (dim ? ';opacity:.35' : '') + '">' + esc(label) + '</div>'; }
function uVeh(k) { var v = CAT.vehicles[k]; return { name: v ? v.name : title(k || '?'), render: v ? v.render : null }; }
function uTabs(t) {
  var C = CARD;
  return ['LISTINGS', 'SELL'].map(function (s, j) {
    var x = C[0] + 40 + j * 250;
    return '<div class="abs tile' + (j === +t ? ' on' : '') + ' fade" style="' + box(x, C[1] + 22, x + 230, C[1] + 80) + ';border-radius:29px;font-size:30px;letter-spacing:.14em;color:' + (j === +t ? 'var(--accent)' : 'var(--soft)') + '">' + s + '</div>';
  }).join('');
}
function uPos(f) { return f.n > 1 && f.n <= 12 ? [(+f.i) - 1, +f.n] : null; }   // stars in the top bar only for a short list
function uCar(k) { var u = uVeh(k), C = CARD; return u.render ? carImg(u.render, [C[0] + 30, C[1] + 130, C[0] + 470, C[1] + 440]) : ''; }
function uName(k) { return '<div class="abs brand fade" id="nm" style="left:' + (CARD[0] + 500) + 'px;top:' + (CARD[1] + 110) + 'px;font-size:62px;white-space:nowrap">' + esc(uVeh(k).name) + '</div>'; }
function uWrap(x, y, w, text, size, cls) { return '<div class="abs fade ' + (cls || 'soft') + '" style="left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;font-size:' + size + 'px;line-height:1.2">' + esc(text) + '</div>'; }
function uNote(text) { return TC(CARD[1] + 330, esc(text), 52, 'soft', 960); }

function pageUsedList(f) {
  var C = CARD, h = base('USED MARKET', uPos(f)) + card() + uTabs(0);
  if (!(+f.n > 0)) return h + TC(C[1] + 270, 'NO USED RIDES LISTED', 62, 'brand', 960) + TC(C[1] + 370, 'Nobody is selling a ride of this garage right now', 38, 'soft', 960) +
    TC(C[1] + 440, 'Touch SELL to list yours', 38, 'hi', 960) + buttons(null, false, 'BACK') + zoneBtn('SELL');
  var pct = +f.v > 0 ? Math.round(100 * f.pr / f.v) : 0, arm = f.c === '1', work = f.c === '2';
  h += uCar(f.k) + uName(f.k) + T(C[0] + 504, C[1] + 200, 'SELLER  ' + esc(f.s || '?'), 36, 'soft', 520);
  h += T(C[0] + 504, C[1] + 260, 'COMES WITH IT', 28, 'hi', 520) + uWrap(C[0] + 504, C[1] + 300, 520, f.w || 'the ride itself', 34, 'soft');
  h += T(C[0] + 50, C[3] - 96, pct + ' % OF THE NEW PRICE', 38, 'soft', 480);
  h += tag(C[2] - 30, C[3] - 100, money(f.pr) + ' ◆', false);
  if (arm) h += '<div class="abs ctr fade" style="top:' + (C[3] + 14) + 'px;font-size:36px;color:var(--hi)">Pay ' + money(f.pr) + ' ◆ from your banked glint? Touch CONFIRM</div>';
  return h + buttons(null, true, 'BACK') + selBtn(work ? 'WORKING' : f.me === '1' ? 'YOURS' : arm ? 'CONFIRM' : 'BUY', f.me === '1') + zoneBtn('SELL');
}
function pageUsedSell(f) {
  var C = CARD, h = base('USED MARKET', uPos(f)) + card() + uTabs(1);
  if (!(+f.n > 0)) return h + TC(C[1] + 270, 'NOTHING TO SELL HERE', 62, 'brand', 960) + TC(C[1] + 370, 'You own no ride of this garage', 38, 'soft', 960) + buttons(null, false, 'BACK') + zoneBtn('LISTINGS');
  var md = +f.md, val = +f.val, listed = !!f.lot;
  h += uCar(f.k) + uName(f.k) + T(C[0] + 504, C[1] + 200, 'VALUE', 28, 'hi', 520) + T(C[0] + 504, C[1] + 236, money(val) + ' ◆', 56, '', 520);
  var line = listed ? 'LISTED FOR ' + money(f.pr) + ' ◆' : md === 0 ? 'CANNOT BE SOLD' : md === 1 ? 'PADDOCK ONLY' : 'PADDOCK OR PLAYERS';
  h += T(C[0] + 504, C[1] + 330, esc(line), 38, 'hi', 520);
  var sub = listed ? 'You get ' + money(Math.floor(f.pr * 85 / 100)) + ' ◆ when it sells' : md === 0 ? (f.why || 'not now') : md === 1 ? 'The Paddock pays ' + money(Math.floor(val / 2)) + ' ◆ at once' : 'Paddock pays ' + money(Math.floor(val / 2)) + ' ◆, players 70 to 100 %';
  h += uWrap(C[0] + 504, C[1] + 390, 520, sub, 34, 'soft');
  return h + buttons(null, true, 'BACK') + selBtn('OPEN', md === 0 && !listed) + zoneBtn('LISTINGS');
}
function pageUsedChoice(f) {
  var C = CARD, val = +f.val, os = (f.os || 'p').split(''), o = +f.o || 0, arm = f.c === '1', work = f.c === '2';
  var NM = { p: ['SELL TO', 'PADDOCK'], l: ['LIST FOR', 'PLAYERS'], x: ['CANCEL', 'LISTING'] };
  var h = base('USED MARKET', null) + card() + uTabs(1) + TC(C[1] + 100, esc(uVeh(f.k).name), 54, 'brand', 900);
  var tw = 300, gap = 40, x0 = 960 - (os.length * tw + (os.length - 1) * gap) / 2;
  os.forEach(function (c, j) {
    var x = x0 + j * (tw + gap), on = j === o;
    h += '<div class="abs tile' + (on ? ' on' : '') + ' fade" style="' + box(x, C[1] + 190, x + tw, C[1] + 360) + ';border-radius:22px;flex-direction:column;font-size:40px;letter-spacing:.1em;color:' + (on ? 'var(--text)' : 'var(--soft)') + '"><div>' + NM[c][0] + '</div><div>' + NM[c][1] + '</div></div>';
  });
  var c0 = os[o], txt = c0 === 'p' ? 'The Paddock pays 50 % = ' + money(Math.floor(val / 2)) + ' ◆, at once' : c0 === 'l' ? 'You pick the price: 70 to 100 % of ' + money(val) + ' ◆. The fee is 15 %.' : 'Take your ride off the market and get it back';
  h += TC(C[1] + 410, esc(txt), 40, 'soft', 960);
  if (arm) h += TC(C[1] + 490, 'Sell for ' + money(Math.floor(val / 2)) + ' ◆?  Touch CONFIRM', 46, 'hi', 960);
  return h + buttons(null, os.length > 1, 'BACK') + selBtn(work ? 'WORKING' : arm ? 'CONFIRM' : c0 === 'p' ? 'PADDOCK' : c0 === 'l' ? 'SET PRICE' : 'CANCEL');
}
function pageUsedPrice(f) {
  var C = CARD, pct = +f.pct, h = base('USED MARKET', null) + card() + uTabs(1) + TC(C[1] + 100, esc(uVeh(f.k).name), 54, 'brand', 900);
  h += TC(C[1] + 170, pct + '%', 150, 'brand hi tight', 600) + TC(C[1] + 345, 'ASKING PRICE  ' + money(f.pr) + ' ◆', 48, '', 960);
  h += TC(C[1] + 415, 'YOU GET  ' + money(f.you) + ' ◆   (after the 15 % fee)', 42, 'hi', 960);
  for (var q = 70; q <= 100; q += 5) { var x = 960 - 7 * 44 + (q - 70) / 5 * 88; h += '<i class="abs fade" style="left:' + (x - 14) + 'px;top:' + (C[1] + 520) + 'px;width:28px;height:28px;border-radius:50%;background:' + (q === pct ? 'var(--accent)' : 'rgba(var(--softRGB),.4)') + '"></i>'; }
  h += TC(C[1] + 570, 'LEFT / RIGHT = price, 5 % steps', 32, 'soft', 960);
  return h + buttons(null, true, 'BACK') + selBtn(f.c === '2' ? 'WORKING' : 'LIST IT');
}
function pageUsedWait(f) {
  var closed = f.z === '1';
  return base('USED MARKET', null) + card() + TC(CARD[1] + 250, closed ? 'USED MARKET CLOSED' : 'ASKING THE MARKET', 66, 'brand', 960) +
    TC(CARD[1] + 360, closed ? 'Nobody answered. Try again in a moment.' : 'One moment', 40, 'soft', 960) + buttons(null, false, 'BACK');
}
function usedBuild(f) {
  var p = f.p;
  if (p === 'used_l') return { key: 'usedl', car: f.k + f.i, html: pageUsedList(f) };
  if (p === 'used_s') return { key: 'useds', car: f.k + f.i, html: pageUsedSell(f) };
  if (p === 'used_c') return { key: 'usedc', car: f.k, html: pageUsedChoice(f) };
  if (p === 'used_p') return { key: 'usedp', car: f.k, html: pageUsedPrice(f) };
  if (p === 'used_x') return { key: 'usedx', car: 'x', html: pageUsedWait(f) };
  return null;
}
