'use strict';
/* Glintline LIVE kiosk: LIFE status + LIMITED EDITION + STATUS GATE chips (26 Nov 2026, design/USED-MARKET.md last section). ONE job: small shared pieces that
   show a ride's condition, its edition number and the supply / gate of a ride in the shop. No data lives here: GlintKiosk.cs puts it in the URL #fragment.
   Loaded by kiosk_live.html before used_pages.js (shares CARD, esc, money, tag-style chips, selBtn).
   Fragment keys   lf = life in thousandths of a percent (100000 = 100 %, 0 = SCRAP)        ed = this ride's edition number, et = edition total  ('#07 / 40')
                   ek = numbers already taken (buy_ / broker_ pages: et - ek left, ek >= et = SOLD OUT · see USED)      gt = gate plate text (buy_ / broker_ pages)
   Status words    MINT 100-80 / GOOD 79-50 / WORN 49-20 / TIRED 19-1 / SCRAP 0 (same as GlintGarageOwn.Status). TIRED does not drive slower - it only lowers what a repair can restore.     */
function lifePct(m) { m = +m || 0; return m <= 0 ? 0 : Math.max(1, Math.floor(m / 1000)); }
function lifeName(m) { var p = lifePct(m); return (+m || 0) <= 0 ? 'SCRAP' : p >= 80 ? 'MINT' : p >= 50 ? 'GOOD' : p >= 20 ? 'WORN' : 'TIRED'; }
function lifeCol(m) { var n = lifeName(m); return n === 'MINT' || n === 'GOOD' ? 'var(--hi)' : n === 'WORN' ? '#FFB02E' : '#FF6A4D'; }
function pad2(n) { n = +n; return (n < 10 ? '0' : '') + n; }
function edText(n, t) { return '#' + pad2(n) + (+t > 0 ? ' / ' + t : ''); }
// round chip with its own colour (same look as the market tag of market_link.js); x,y = top-left in page px
function lifeChip(x, y, text, col, solid) {
  return '<div class="abs tag fade" style="left:' + x + 'px;top:' + y + 'px;height:56px;line-height:50px;font-size:32px;padding:0 20px;border-radius:28px;color:' + (solid ? '#10151c' : col) + ';border-color:' + col + (solid ? ';background:' + col : '') + '">' + esc(text) + '</div>';
}
// 'MINT  100 %' / 'SCRAP'
function lifeText(m) { var n = lifeName(m); return +m <= 0 ? n : n + '  ' + lifePct(m) + ' %'; }
function lifeChips(x, y, f, short) {      // status chip + (when numbered) the edition chip next to it; returns html
  var h = lifeChip(x, y, lifeText(f.lf), lifeCol(f.lf), +f.lf <= 0), w = +f.lf <= 0 ? 150 : 250;
  if (+f.ed > 0) h += lifeChip(x + w + 16, y, (short ? '' : 'LIMITED ') + edText(f.ed, f.et), 'var(--accent)');
  return h;
}
// the big gold button replaced by a dark, not pressable one (SOLD OUT, SCRAPPED); drawn over the page's own button
function selCover(label) { return '<div class="abs sel btn still" style="background:rgba(var(--tabRGB),.98);color:var(--soft);border:4px solid rgba(var(--softRGB),.45);box-sizing:border-box;font-size:56px;letter-spacing:.2em">' + esc(label) + '</div>'; }
// after a page is drawn: own_ page = status + number (+ SCRAP blocks DRIVE), buy_ / broker_ page = edition supply + gate plate. r = {html,...} of build0
function lifeEnd(r, f) {
  if (!r || !r.html) return r;
  var p = f.p || '', a = p.split('_'), C = CARD, h = '';
  if (a[0] === 'own' && a.length === 2 && f.lf !== undefined && f.lf !== '') {
    h += lifeChips(C[0] + 30, C[3] - 125, f);   // bottom left: the name and the stat bars use the top
    if (+f.lf <= 0) h += '<div class="abs fade" style="left:' + (C[0] + 34) + 'px;top:' + (C[3] - 62) + 'px;font-size:32px;white-space:nowrap;color:#FF6A4D">cannot be driven  ·  sell it as scrap at the USED MARKET</div>' + selCover('SCRAPPED');
  } else if ((a[0] === 'buy' || a[0] === 'broker') && a.length === 2) {
    var bro = a[0] === 'broker', y = bro ? C[3] - 100 : C[1] + 92, x = C[0] + 30, et = +f.et || 0, ek = f.ek === undefined ? -1 : +f.ek, out = et > 0 && ek >= et;
    if (et > 0 && ek >= 0) {      // broker page: one row at the bottom (the ship picture fills the top); shop pages: two rows left under the market tag
      h += lifeChip(x, y, out ? 'SOLD OUT  ·  see USED' : 'LIMITED  ·  ' + (et - ek) + ' LEFT OF ' + et, out ? '#FF6A4D' : 'var(--accent)', out);
      if (bro) x += out ? 330 : 400; else y += 62;
    }
    if (f.gt) h += lifeChip(x, y, 'NEEDS ' + f.gt, '#FFB02E');
    if (out && a[0] === 'buy') h += selCover('SOLD OUT');
  }
  r.html += h; return r;
}
