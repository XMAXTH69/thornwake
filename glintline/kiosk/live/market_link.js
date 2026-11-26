/* LINKED ECONOMY on the kiosk (26 Nov 2026, Glintline/design/LINKED-ECONOMY.md A-C + E). Loaded by kiosk_live.html before its main script; shares its globals (CARD, CAT, esc).
   GlintKiosk.cs puts today's factors into the page fragment (all x1000, only when known): km = market M (rides, paints, rims, spinners, underglow, line styles, twin, fx),
   kp = parts P (WRENCH, parts are charged M x P), ks = shield S (SAFEGUARD, shield only). No key = the price stays as listed (the buy is refused by the data scripts then).
   Every price chip drawn through tag() is multiplied here with the SAME integer rounding as the C# side (Adj / Adj2: floor((base x f + half) / scale)), so the page shows what is charged.
   NOT moved (same list as the scripts): free cars, ENTRY rides (classic kart strike swift basement kb7), TOP ships (Broker keys), rents, the Broker page, the used market.
   A small tag at the top left of the card says why when the change is 1 % or more: MARKET SALE -3 % / BOOM +4 % / PARTS SHORTAGE +3 % / SHIELD RUSH +5 %. */
var MK = { m: 0, p: 0, s: 0 }, MKX = { kind: '', used: {} };
var MK_ENTRY = { classic: 1, kart: 1, strike: 1, swift: 1, basement: 1, kb7: 1 }, MK_TOP = { northstar: 1, shipa: 1, shipb: 1, shipc: 1, shipd: 1, kb6: 1, kb11: 1, big: 1 };
function mkAdj(b, kind) {                 // kind m = market, p = parts (M x P), s = shield (S only)
  if (kind === 's') return MK.s ? Math.floor((b * MK.s + 500) / 1000) : b;
  if (kind === 'p') return MK.m && MK.p ? Math.floor((b * MK.m * MK.p + 500000) / 1000000) : b;
  return MK.m ? Math.floor((b * MK.m + 500) / 1000) : b;
}
function mkVeh(vid) { var v = CAT.vehicles[vid]; return !!v && v.price > 0 && !v.broker && !MK_ENTRY[vid] && !MK_TOP[vid]; }
function mkBegin(f) {                     // before a page is drawn: read the factors, decide which price family the page shows
  MK.m = +f.km || 0; MK.p = +f.kp || 0; MK.s = +f.ks || 0; MKX.used = {}; MKX.pg = f.p || '';
  var p = f.p || '', a = p.split('_'), k = a[0];
  MKX.kind = (k === 'browse' || k === 'buy') ? (a.length === 2 && mkVeh(a[1]) ? 'm' : '')
    : (k === 'paint' || k === 'rims' || k === 'rimd' || k === 'tyre' || k === 'ug' || k === 'full' || p === 'used_g' || p.indexOf('twin_buy_') === 0) ? 'm'
    : k === 'upg' ? 'p' : p === 'shield' ? 's' : '';
}
function mkFmt(n, sep) { var s = String(n); return sep === ',' ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : s.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function mkText(t) {                      // price chip text: '12 000 glint' / '1,500 glint' / '250' -> today's price, same style; anything else untouched
  if (!MKX.kind) return t;
  var m = /^(\d[\d, \u00a0]*?)(\s*glint)?$/i.exec(String(t)); if (!m) return t;
  var n = parseInt(m[1].replace(/\D/g, ''), 10); if (!(n > 0)) return t;
  MKX.used[MKX.kind] = 1;
  return mkFmt(mkAdj(n, MKX.kind), m[1].indexOf(',') >= 0 ? ',' : ' ') + (m[2] || '');
}
function mkPct(f) { return Math.round((f - 1000) / 10); }
function mkHeads(m, p, s) {               // [{k: 'm'|'p'|'s', up: bool, text}] only when the change is 1 % or more (also used by the Exchange page: same words)
  var o = [], pc;
  if (m && Math.abs(m - 1000) >= 10) { pc = mkPct(m); o.push({ k: 'm', up: pc > 0, text: pc < 0 ? 'MARKET SALE' : 'MARKET BOOM', line: (pc < 0 ? 'MARKET SALE: vehicles ' : 'MARKET BOOM: vehicles ') + (pc > 0 ? '+' : '') + pc + ' % today', tag: (pc < 0 ? 'MARKET SALE ' : 'BOOM +') + pc + ' %' }); }
  if (p && p - 1000 >= 10) { pc = mkPct(p); o.push({ k: 'p', up: true, text: 'PARTS SHORTAGE', line: 'PARTS SHORTAGE: parts +' + pc + ' % today', tag: 'PARTS SHORTAGE +' + pc + ' %' }); }
  if (s && s - 1000 >= 10) { pc = mkPct(s); o.push({ k: 's', up: true, text: 'SHIELD RUSH', line: 'SHIELD RUSH: shields +' + pc + ' % today', tag: 'SHIELD RUSH +' + pc + ' %' }); }
  return o;
}
function mkEnd(r) {                       // after a page is drawn: the tag(s) of the factors that were really applied to a price on it
  if (!r || !r.html) return r;
  var heads = mkHeads(MK.m, MK.p, MK.s).filter(function (h) { return MKX.used[h.k] || (h.k === 'm' && MKX.used.p); }), x = CARD[0] + 30, y = MKX.pg === 'used_g' ? CARD[3] - 100 : CARD[1] + 30, h = '';   // GUILD STOCK page: the tab row sits at the top, so the tag goes bottom left
  heads.forEach(function (q, i) {
    h += '<div class="abs tag fade" style="left:' + x + 'px;top:' + (y + i * 66) + 'px;height:56px;line-height:50px;font-size:32px;padding:0 20px;border-radius:28px' + (q.up ? ';color:#FFB02E;border-color:#FFB02E' : '') + '">' + esc(q.tag) + '</div>';
  });
  r.html += h; return r;
}
