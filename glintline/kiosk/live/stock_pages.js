'use strict';
/* Glintline LIVE kiosk: the GUILD STOCK tab of the GUILD MARKET (26 Nov 2026, Glintline/design/SPECIALISATIONS.md 'GUILD STOCK + GUILD MARKET' G1-G5). ONE job: draw the page used_g from the URL #fragment
   that GlintKiosk.cs builds (StockFrag); no data lives here. Loaded by kiosk_live.html after used_pages.js (shares CAT, CARD, base, card, buttons, carImg, tag, T, TC, esc, money, uTabs, uCar, uName, uWrap, zoneBtn, selBtn, lifeChip).
   Fragment keys (ONE item per page; the kiosk lists every item of THIS garage's cars):
     t=2 tab      i, n = this item / how many (1-based)      k = vehicle key (catalog name + picture; 'guild' = the numbered GUILD EDITION car, no catalog entry, no picture yet)
     it = item kind: hd (HEAVY-DUTY CHASSIS) | ws_oil | ws_tape | ws_metal (WORKSHOP LIVERIES) | chrome (CHROME TRIM) | gold (GOLD UNDERGLOW tone) | guild (GUILD EDITION car)
     st = unlock set MECH_J | MECH_M | DEAL_J | DEAL_M       ub = name of the FIRST unlocker      uo = 1 somebody unlocked it ever      op = 1 OPEN (an active specialist of that rank exists now), 0 = DARK / closed
     ow = 1 already yours      nc = 1 the vehicle is not yours yet      c = 1 confirm armed / 2 working      et, ek = edition supply total / taken (guild), ed = your edition number
     z = 0 asking the Guild / 1 the Guild did not answer        n = 0 nothing to list
   Prices are the LIST prices (mirror of GlintGarageOwn: hd = 30 % of the car's list price, workshop livery 250 = a shop paint, chrome trim 500, gold tone 500, guild edition 8 000); every chip goes through tag() = mkText, so today's market M is applied like on the other pages
   (market_link.js mkBegin: page used_g = family m). Browser test: #p=used_g&t=2&i=1&n=30&k=sharp&it=hd&st=MECH_J&ub=Rivet&uo=1&op=1   (closed: &op=0, never unlocked: &uo=0&ub=)                                  */
var SK = {
  hd: { name: 'HEAVY-DUTY CHASSIS', line: 'Wears 20 % slower', set: 'MECH_J' },
  ws_oil: { name: 'OIL-STAIN LIVERY', line: 'Workshop livery', set: 'MECH_M' },
  ws_tape: { name: 'RACE TAPE LIVERY', line: 'Workshop livery', set: 'MECH_M' },
  ws_metal: { name: 'BARE METAL LIVERY', line: 'Workshop livery', set: 'MECH_M' },
  chrome: { name: 'CHROME TRIM', line: 'Showroom extra', set: 'DEAL_J' },
  gold: { name: 'GOLD UNDERGLOW', line: 'Showroom extra', set: 'DEAL_J' },
  guild: { name: 'GUILD EDITION', line: 'Numbered car', set: 'DEAL_M' }
};
var SK_PRICE = { ws: 250, chrome: 500, gold: 500, guild: 8000, hdPct: 30 };   // mirror GlintGarageOwn (PaintPrice, ChromePrice, UgTonePrice, GuildCarPrice, HdPct)
function stockLabel(set) { return (/_M$/.test(set) ? 'MASTER ' : 'JOURNEYMAN ') + (/^MECH/.test(set) ? 'MECHANIC' : 'DEALER'); }
function stockPrice(it, car) {
  if (it === 'hd') { var v = CAT.vehicles[car]; return v && v.price > 0 ? Math.max(1, Math.floor((v.price * SK_PRICE.hdPct + 50) / 100)) : 0; }
  return /^ws_/.test(it) ? SK_PRICE.ws : SK_PRICE[it] || 0;
}
// placeholder art (CSS only, no picture needed): what the item looks like until the real art exists
function stockSwatch(it, x, y, w, h) {
  var b = box(x, y, x + w, y + h) + ';border-radius:22px;box-sizing:border-box;border:3px solid rgba(var(--softRGB),.45);overflow:hidden';
  if (it === 'ws_oil') return '<div class="abs fade" style="' + b + ';background:radial-gradient(circle at 28% 36%,#2a2118 0,#3c3326 22%,transparent 23%),radial-gradient(circle at 66% 62%,#1d1a16 0,#2f2a22 26%,transparent 27%),linear-gradient(135deg,#6b5a43,#8a7757)"></div>';
  if (it === 'ws_tape') return '<div class="abs fade" style="' + b + ';background:repeating-linear-gradient(135deg,#e9e3d2 0 26px,#2b2b2b 26px 52px)"></div>';
  if (it === 'ws_metal') return '<div class="abs fade" style="' + b + ';background:linear-gradient(110deg,#6c7279 0,#b9bec4 30%,#8b9197 52%,#d3d7da 74%,#767c82 100%)"></div>';
  if (it === 'chrome') return '<div class="abs fade" style="' + b + ';background:linear-gradient(100deg,#8e959c 0,#f4f6f8 22%,#a2a9b0 40%,#ffffff 58%,#7f868d 100%)"></div>';
  if (it === 'gold') return '<div class="abs fade" style="' + b + ';background:radial-gradient(ellipse at 50% 70%,rgba(255,199,51,.95) 0,rgba(255,199,51,.35) 55%,transparent 80%),#14110a"></div>';
  if (it === 'hd') return '<div class="abs fade" style="' + b + ';background:repeating-linear-gradient(90deg,#4a5159 0 14px,#2e343a 14px 28px)"></div>';
  return '';
}
function pageStock(f) {
  var C = CARD, h = base('GUILD MARKET', null) + card() + uTabs(2);
  if (f.z !== undefined && f.z !== '') return h + TC(C[1] + 270, f.z === '1' ? 'THE GUILD DID NOT ANSWER' : 'ASKING THE GUILD', 62, 'brand', 960) + TC(C[1] + 370, f.z === '1' ? 'Try again in a moment' : 'One moment', 40, 'soft', 960) + buttons(null, false, 'BACK') + zoneBtn('SELL');
  if (!(+f.n > 0)) return h + TC(C[1] + 250, 'NO GUILD ITEMS HERE YET', 62, 'brand', 960) + TC(C[1] + 345, 'New parts and paints appear here when players reach Guild ranks', 34, 'soft', 960) + TC(C[1] + 405, 'Join the Guild at the Guild Hall', 36, 'hi', 960) + buttons(null, false, 'BACK') + zoneBtn('SELL');
  var d = SK[f.it] || SK.hd, open = f.op === '1', own = f.ow === '1', nc = f.nc === '1', arm = f.c === '1', work = f.c === '2', guild = f.it === 'guild', set = f.st || d.set;
  var veh = guild ? { name: 'Guild Edition' } : uVeh(f.k), price = stockPrice(f.it, f.k), dark = !open && !own;
  // left: the vehicle (the numbered Guild Edition has no picture yet) + the item swatch
  h += guild ? '<div class="abs fade" style="' + box(C[0] + 60, C[1] + 150, C[0] + 450, C[1] + 410) + ';border-radius:26px;border:3px dashed rgba(var(--softRGB),.5);display:flex;align-items:center;justify-content:center;font-size:34px;letter-spacing:.2em;color:var(--soft)">MODEL SOON</div>' : uCar(f.k);
  h += stockSwatch(f.it, C[0] + 70, C[1] + 424, 370, 74);
  h += '<div class="abs brand fade" id="nm" style="left:' + (C[0] + 500) + 'px;top:' + (C[1] + 110) + 'px;font-size:58px;white-space:nowrap">' + esc(d.name) + '</div>';
  h += T(C[0] + 504, C[1] + 196, esc(String(veh.name).toUpperCase()) + (+f.n > 1 ? '   ' + f.i + ' / ' + f.n : ''), 34, 'soft', 540);
  h += T(C[0] + 504, C[1] + 250, esc(d.line), 40, 'hi', 540);
  if (guild && +f.et > 0) {
    var left = (+f.et) - (+f.ek || 0), out = (+f.ek || 0) >= +f.et && !own;
    h += lifeChip(C[0] + 500, C[1] + 312, own && +f.ed > 0 ? 'YOURS  ' + edText(f.ed, f.et) : out ? 'SOLD OUT  ·  see USED' : 'LIMITED  ·  ' + left + ' LEFT OF ' + f.et, out ? '#FF6A4D' : 'var(--accent)', out);
  }
  var by = +f.uo === 1 && f.ub ? 'Unlocked by ' + f.ub + '  ·  ' + stockLabel(set) : +f.uo === 1 ? 'Unlocked  ·  ' + stockLabel(set) : 'Not unlocked yet  ·  needs a ' + stockLabel(set);
  h += uWrap(C[0] + 504, C[1] + 390, 540, by, 32, dark ? 'soft' : 'hi');
  if (dark) {
    // DARK state: the stand is switched off while no active specialist holds the rank (G4)
    h += '<div class="abs fade" style="' + box(C[0] + 6, C[1] + 100, C[2] - 6, C[3] - 6) + ';background:rgba(6,9,12,.58);border-radius:0 0 26px 26px;pointer-events:none"></div>';
    h += '<div class="abs fade" style="left:' + (C[0] + 500) + 'px;top:' + (C[1] + 470) + 'px;width:520px;font-size:34px;line-height:1.15;color:#FF6A4D">' + (+f.uo === 1 ? 'CLOSED  ·  no active ' + stockLabel(set) : 'LOCKED  ·  nobody has reached it') + '</div>';
  }
  if (nc && !dark) h += uWrap(C[0] + 504, C[1] + 470, 540, 'Buy the ' + String(veh.name) + ' first', 32, 'soft');
  h += tag(C[2] - 30, C[3] - 100, own ? 'YOURS' : price > 0 ? money(price) + ' glint' : '', false);
  if (arm) h += '<div class="abs ctr fade" style="top:' + (C[3] + 14) + 'px;font-size:36px;color:var(--hi)">Buy ' + esc(d.name) + ' from your banked glint? Touch CONFIRM</div>';
  var lab = work ? 'WORKING' : own ? 'YOURS' : dark ? 'CLOSED' : nc ? 'NEEDS CAR' : arm ? 'CONFIRM' : 'BUY';
  return h + buttons(null, true, 'BACK') + selBtn(lab, own || dark || nc) + zoneBtn('SELL');
}
function stockBuild(f) { return { key: 'stock', car: (f.k || '') + (f.it || '') + (f.i || ''), html: pageStock(f) }; }
