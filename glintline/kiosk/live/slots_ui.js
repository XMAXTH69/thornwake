/* Glintline LIVE kiosk: GARAGE SLOTS (26 Nov 2026 owner K1-K9, Glintline/design/USED-MARKET.md). ONE job: draw the slots line of the START page and the GARAGE FULL / HANGAR FULL pages from the URL #fragment
   GlintKiosk.cs builds (SlotFrag / FullFrag); no data lives here. Loaded by kiosk_live.html after used_pages.js (shares CARD, base, card, buttons, TC, esc, money, tag, zoneBtn, selBtn, mkText ...).
   Fragment keys:
     attract   gu gl hu hl   GARAGE used / limit, HANGAR used / limit   -> line 'GARAGE 3 / 4 · HANGAR 1 / 1' (a full pool is drawn in the gold highlight colour). No keys = no line.
     full_g | full_h   u l = used / limit of that pool, n = list price of the next slot before today's market factor (0 = none left to buy), c=1 BUY SLOT confirm armed / 2 paying
   Buttons: SELL = SELECT zone (opens the USED MARKET on its SELL tab), BUY SLOT = DRIVE zone (price x M through mkText, 2nd press = CONFIRM on SELECT, DRIVE again = CANCEL), BACK.
   Browser test: #p=full_g&u=4&l=4&n=7500&km=970   |   #p=full_h&u=1&l=1&n=15000&c=1   |   #p=attract&gu=3&gl=4&hu=1&hl=1                                                                      */
function slotsLine(f) {
  if (!f || f.gl === undefined) return '';
  var part = function (name, u, l) { return '<span style="color:' + (+u >= +l ? 'var(--hi)' : 'var(--soft)') + '">' + name + ' ' + (+u) + ' / ' + (+l) + '</span>'; };
  return '<div class="abs ctr fade" style="top:732px;font-size:36px;letter-spacing:.14em">' + part('GARAGE', f.gu, f.gl) + '<span class="soft">&nbsp; · &nbsp;</span>' + part('HANGAR', f.hu, f.hl) + '</div>';
}
function slotPips(l, u, y) {      // one box per slot, filled = a vehicle sits in it
  var s = 56, g = 16, n = Math.max(1, Math.min(12, +l)), x0 = 960 - (n * s + (n - 1) * g) / 2, h = '';
  for (var i = 0; i < n; i++) {
    var x = x0 + i * (s + g), on = i < +u;
    h += '<div class="abs tile fade" style="' + box(x, y, x + s, y + s) + ';border-radius:12px;border:3px solid ' + (on ? 'var(--accent)' : 'rgba(var(--softRGB),.5)') + ';background:' + (on ? 'rgba(var(--accentRGB),.85)' : 'rgba(var(--tabRGB),.6)') + '"></div>';
  }
  return h;
}
function pageFull(f) {
  var C = CARD, hang = f.p === 'full_h', pool = hang ? 'HANGAR' : 'GARAGE', u = +f.u || 0, l = +f.l || 0, n = +f.n || 0, arm = f.c === '1', work = f.c === '2';
  var price = n > 0 ? mkText(money(n)) : '';
  var h = base(pool + ' FULL', null) + card() + TC(C[1] + 100, pool + ' FULL', 84, 'brand', 960);
  h += TC(C[1] + 214, u + ' / ' + l + '  ' + (hang ? 'PLANES AND SHIPS' : 'CARS AND BIKES'), 46, 'hi', 960) + slotPips(l, u, C[1] + 296);
  h += TC(C[1] + 392, 'Sell one on the GUILD MARKET, or buy a slot', 44, '', 960);
  h += TC(C[1] + 454, 'A bought slot is yours for good', 34, 'soft', 960);
  if (arm) h += TC(C[1] + 524, 'Pay ' + price + ' ◆ from your vault? Touch CONFIRM', 44, 'hi', 960);
  else if (n > 0) h += '<div class="abs soft fade" style="left:' + (C[0] + 50) + 'px;top:' + (C[3] - 84) + 'px;font-size:34px">NEXT SLOT</div>' + tag(C[2] - 30, C[3] - 100, money(n) + ' glint', false);
  else h += TC(C[1] + 524, 'NO MORE SLOTS TO BUY', 44, 'hi', 960);
  var zone = zoneBtn(arm ? 'CANCEL' : 'BUY SLOT');
  if (!arm && n <= 0) zone = zone.replace('class="abs drive btn" style="', 'class="abs drive btn" style="opacity:.35;');
  return h + buttons(null, false, 'BACK') + selBtn(work ? 'WORKING' : arm ? 'CONFIRM' : 'SELL') + zone;
}
function fullBuild(f) { return { key: 'full', car: f.p, html: pageFull(f) }; }
