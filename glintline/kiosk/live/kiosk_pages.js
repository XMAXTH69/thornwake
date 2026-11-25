'use strict';
/* Glintline LIVE kiosk: renderers of the garage SUB-PAGES (26 Nov 2026) - upg_<kind>_<mk>, trail_<i>, rims_<key>, shield, ug_p_/ug_t_<key>[_own], <kind>_drive.
   Loaded by kiosk_live.html (shares its globals: CAT, CARD, W, base, card, buttons, esc, money, box, star, fit ...). Look reference = build_kiosk_pages.py
   (same 1920x1080 coordinates, sizes, colours). All names/prices/effects come from catalog_<pal>.json (built from the same python modules). */
var IMGDIM = {}, ANIM = null;
function stopAnim() { if (ANIM) { cancelAnimationFrame(ANIM.raf); ANIM = null; } }
function T(x, y, s, size, cls, maxw, extra) {       // text at page px, shrinks to maxw
  return '<div class="abs fade ' + (cls || '') + '" style="left:' + x + 'px;top:' + y + 'px;font-size:' + size + 'px;white-space:nowrap;' + (extra || '') + '"' + (maxw ? ' data-fit="' + maxw + '"' : '') + '>' + s + '</div>';
}
function TC(y, s, size, cls, maxw) { return '<div class="abs ctr fade ' + (cls || '') + '" style="top:' + y + 'px;font-size:' + size + 'px"' + (maxw ? ' data-fit="' + maxw + '"' : '') + '>' + s + '</div>'; }
function chip(x, y, w, h, on, inner, r) {
  return '<div class="abs tile' + (on ? ' on' : '') + '" style="' + box(x, y, x + w, y + h) + ';border-radius:' + (r || 16) + 'px;background:rgba(var(--tabRGB),.92)">' + inner + '</div>';
}
function ownedTag(owned, text, star0) { return tag(CARD[2] - 30, CARD[1] + 30, owned ? 'YOURS' : text, !owned && star0); }
function imgFit(name, b, cls, alpha) {   // picture fitted (contain, bottom-centred) in box b at its exact fitted size (as PIL: min scale, may upscale)
  var d = IMGDIM[name] || [b[2] - b[0], b[3] - b[1]], s = Math.min((b[2] - b[0]) / d[0], (b[3] - b[1]) / d[1]), w = d[0] * s, h = d[1] * s, cx = (b[0] + b[2]) / 2;
  return '<img class="abs ' + (cls || '') + '" src="live/img/' + name + '.webp" style="left:' + (cx - w / 2) + 'px;top:' + (b[3] - h) + 'px;width:' + w + 'px;height:' + h + 'px' + (alpha ? ';opacity:' + alpha : '') + '">';
}
function pool(name, b) {   // glow pool under a part / wheel (glow_under in build_kiosk_pages.py) + the picture, sliding in
  var d = IMGDIM[name] || [1, 1], s = Math.min((b[2] - b[0]) / d[0], (b[3] - b[1]) / d[1]), w = d[0] * s, cx = (b[0] + b[2]) / 2;
  return '<div class="abs slide"><div class="abs glow" style="' + box(cx - w * .55, b[3] - 50, cx + w * .55, b[3] + 14) + ';filter:blur(24px)"></div>' + imgFit(name, b) + '</div>';
}
function hiTxt() { return 'hi'; }
function owned(f) { return f.y === '1'; }
function dots(i, n) { return [i, n]; }

// ---------- drive tile page (<kind>_drive and paint_<car>_drive share it)
function driveTile() {
  var C = CARD;
  return '<div class="fade">' + [0, 1, 2].map(function (k) { var r = 130 + k * 16; return '<i class="abs" style="left:' + (960 - r) + 'px;top:' + (C[1] + 210 - r) + 'px;width:' + 2 * r + 'px;height:' + 2 * r + 'px;box-sizing:border-box;border-radius:50%;border:6px solid rgba(var(--accentRGB),' + ((200 - k * 60) / 255).toFixed(2) + ')"></i>'; }).join('') +
    '<svg class="abs" style="left:900px;top:' + (C[1] + 130) + 'px" width="130" height="160"><polygon fill="var(--accent)" points="10,10 130,80 10,150 38,80"/></svg></div>' +
    '<div class="abs ctr brand fade" style="top:' + (C[1] + 386) + 'px;font-size:76px">READY TO DRIVE</div>' +
    '<div class="abs ctr hi fade" style="top:' + (C[1] + 490) + 'px;font-size:42px">Touch DRIVE · your ride waits on the start pad</div>' +
    '<div class="abs ctr soft fade" style="top:' + (C[1] + 556) + 'px;font-size:34px">BACK for more paint, parts, lines, rims or a shield</div>';
}
function pageSubDrive(kind) {
  var n = { upg: CAT.upg.list.length, trail: CAT.trails.length, rims: CAT.rims.length, shield: 1, ug: CAT.ug.pats.length + CAT.ug.tones.length }[kind];
  return base(CAT.sub_title[kind], dots(n, n)) + card() + driveTile() + buttons('DRIVE', true, 'BACK', false);
}

// ---------- UPGRADES: upg_<kind>_<mk>
function pageUpg(kind, mk, f) {
  var U = CAT.upg, L = U.list, C = CARD, idx = L.findIndex(function (q) { return q[0] === kind && q[1] === mk; }), own = owned(f), x = C[0] + 580, mw = C[2] - x - 40;
  var h = base('UPGRADES', dots(idx, L.length), { vonly: 1 }) + card() + pool('part_' + kind, [C[0] + 40, C[1] + 110, C[0] + 540, C[1] + 470]);
  h += T(x, C[1] + 130, esc(U.names[kind]) + '<span style="letter-spacing:0">&nbsp;&nbsp;·&nbsp;&nbsp;' + esc(U.mk_name[mk - 1]) + '</span>', 66, 'brand', mw);
  h += T(x, C[1] + 236, esc(U.effect[kind][mk - 1]), 46, 'hi', mw);
  ['' + U.mk_who[mk - 1], own ? 'Yours for this vehicle' : 'Unlock for this vehicle: +' + U.unlock[kind][mk - 1] + ' glint', 'Starter rides pay half', 'Drops down the tube · throw it on'].forEach(function (ln, k) { h += T(x, C[1] + 312 + 50 * k, esc(ln), 34, 'soft', mw); });
  h += ownedTag(own, U.copy[kind][mk - 1] + ' glint', true);
  var cw = 176, gap = 16, n = U.kinds.length, x0 = C[0] + (C[2] - C[0] - n * cw - (n - 1) * gap) / 2, y = C[3] - 110;
  U.kinds.forEach(function (k, j) { h += chip(x0 + j * (cw + gap), y, cw, 76, k === kind, '<span style="font-size:34px;color:' + (k === kind ? 'var(--text)' : 'var(--soft)') + '">' + esc(U.names[k]) + '</span>'); });
  return h + buttons(own ? 'CHOOSE' : 'BUY', true, 'BACK', true);
}

// ---------- LIGHT LINE: trail_<i>  (ribbon = animated canvas, port of kiosk_trail.py)
function pageTrail(i, f) {
  var key = CAT.trails[i], st = CAT.trail_styles[key], tier = st[0], C = CARD, own = owned(f) && tier !== 'FREE';
  var h = base('LIGHT LINE', dots(i, CAT.trails.length), { vonly: 1 }) + card() +
    TC(C[1] + 372, esc(key), 80, 'brand', 960) + TC(C[1] + 474, esc(st[1]), 44, 'hi') + TC(C[1] + 548, esc(CAT.trail_who[tier]), 36, 'soft') + ownedTag(own, tier === 'FREE' ? 'FREE' : 'CLUB', false);
  h += '<canvas id="trl" class="abs" width="1020" height="330" style="left:450px;top:' + (C[1] + 50) + 'px"></canvas>';
  return h + buttons('CHOOSE', true, 'BACK', true);
}
var TK = null;
function tc() { return CAT.trail_consts; }
function tfr(x) { return x - Math.floor(x); }
function tcl(x) { return Math.max(0, Math.min(1, x)); }
function tmix(a, b, f) { return [a[0] * (1 - f) + b[0] * f, a[1] * (1 - f) + b[1] * f, a[2] * (1 - f) + b[2] * f]; }
function twave(x) { return .5 + .5 * Math.sin(2 * Math.PI * x); }
function tramp(cols, x) { x = tfr(x) * cols.length; var i = Math.floor(x) % cols.length, f = x - Math.floor(x); return tmix(cols[i], cols[(i + 1) % cols.length], f); }
function tstyle(key, u, v, t) {    // [colour 0..1 x3, strength]  (kiosk_trail.style)
  var K = tc(), TAU = 2 * Math.PI;
  switch (key) {
    case 'STEADY': return [K.CYAN, 1];
    case 'BREATHE': return [K.CYAN, .55 + .45 * twave(2 * t)];
    case 'CHASE': return [K.CYAN, .45 + 1.8 * Math.pow(tfr(2 * u - 3 * t), 6)];
    case 'BRAKE FLASH': var fl = Math.pow(1 - tfr(2 * t), 3); return [tmix(K.CYAN, K.WHITE, .35 * fl), .7 + 2.6 * fl * (1 - .6 * u)];
    case 'BOOST SURGE': var d = 1.3 * tfr(2 * t) - u, s = tcl(1 - 2.5 * d) * tcl(40 * d); return [tmix(K.CYAN, [.7, 1, 1], s), .8 + 2.4 * s];
    case 'DUAL-TONE': return [tmix(K.CYAN, K.MAGENTA, tcl(3 * (v - .12) + .25 * Math.sin(TAU * (1.5 * u - t)))), 1];
    case 'AURUM': var sh = Math.pow(twave(5 * u - t), 14); return [tmix(tmix(K.PEARL, K.GOLD, tcl(4 * v)), [1, .78, .30], sh), 1 + 1.2 * sh];
    case 'NULL WAKE': var edge = tcl(1 - 30 * Math.abs(v - .34)), fl2 = (.55 + .45 * Math.sin(TAU * 7 * t) * Math.sin(TAU * 3 * t)) * (.6 + .4 * twave(9 * u + 5 * t)); return [tmix(K.UV, K.ICE, edge), 1 + 1.6 * edge * fl2];
    case 'PODIUM': return [K.CHAMP, .85 + .15 * twave(t)];
    case 'PRISM': return [tramp(K.PRISM, .6 * u - t), 1];
    case 'RAINBOW': return [K.RAINBOW[Math.min(6, Math.floor(tfr(u * 8 / 7) * 7))], .85 + .15 * twave(2 * t)];
  }
  return [K.CYAN, 1];
}
function trailFrame(key, t, alpha, ctx, L, Lg, LC) {   // box (510,260,1410,470) of the page = canvas offset (-450, -CARD[1]-50)
  var N = 260, bx0 = 510, by0 = CARD[1] + 110, bx1 = 1410, by1 = CARD[1] + 320, ox = 450, oy = CARD[1] + 50, TAU = 2 * Math.PI, height = 46, pts = [];
  for (var i = 0; i < N; i++) { var u = i / (N - 1); pts.push([u, bx1 - u * (bx1 - bx0) - ox, (by0 + by1) / 2 + (by1 - by0) * .32 * Math.sin(TAU * .75 * u + .4) * (.4 + .6 * u) - oy]); }
  function fade(u) { return Math.pow(tcl(1.25 - u), .8) * alpha; }
  function rgba(c, a) { return 'rgba(' + Math.round(255 * Math.min(1, Math.max(0, c[0]))) + ',' + Math.round(255 * Math.min(1, Math.max(0, c[1]))) + ',' + Math.round(255 * Math.min(1, Math.max(0, c[2]))) + ',' + a.toFixed(3) + ')'; }
  var g = L.getContext('2d'); g.clearRect(0, 0, L.width, L.height); g.lineCap = 'butt'; g.lineWidth = Math.floor(height * .28) + 2;
  [.12, .34, .62, .88].forEach(function (v) {
    var dy = height * (.5 - v) * .9;
    for (var i = 0; i < N - 1; i++) {
      var s = tstyle(key, pts[i][0], v, t), c = s[0], st = s[1], k = Math.min(1, .55 + .45 * st);
      g.strokeStyle = rgba([c[0] * k, c[1] * k, c[2] * k], fade(pts[i][0]) * Math.min(1, .55 + .35 * st));
      g.beginPath(); g.moveTo(pts[i][1], pts[i][2] + dy); g.lineTo(pts[i + 1][1], pts[i + 1][2] + dy); g.stroke();
    }
  });
  var h = Lg.getContext('2d'); h.clearRect(0, 0, L.width, L.height); h.filter = 'blur(18px)'; h.drawImage(L, 0, 0); h.filter = 'none';
  var cg = LC.getContext('2d'); cg.clearRect(0, 0, L.width, L.height); cg.lineWidth = 5;
  for (var i = 0; i < N - 1; i++) {
    var s = tstyle(key, pts[i][0], .5, t), c = s[0], hot = tcl((s[1] - .8) / 1.5);
    cg.strokeStyle = rgba([c[0] * (.4 - .4 * hot) + .6 + .4 * hot, c[1] * (.4 - .4 * hot) + .6 + .4 * hot, c[2] * (.4 - .4 * hot) + .6 + .4 * hot], .86 * fade(pts[i][0]));
    cg.beginPath(); cg.moveTo(pts[i][1], pts[i][2]); cg.lineTo(pts[i + 1][1], pts[i + 1][2]); cg.stroke();
  }
  if (key === 'PODIUM') for (var k = 0; k < 6; k++) {
    var uu = tfr(k / 6 + t), i2 = Math.floor(uu * (N - 1)), sz = 10 + 8 * twave(2 * t + k / 3), cx = pts[i2][1], cy = pts[i2][2] - height * .7; cg.fillStyle = 'rgba(255,244,214,' + (.9 * fade(pts[i2][0])).toFixed(2) + ')';
    cg.beginPath(); cg.moveTo(cx, cy - sz); cg.lineTo(cx + sz * .28, cy); cg.lineTo(cx, cy + sz); cg.lineTo(cx - sz * .28, cy); cg.fill();
    cg.beginPath(); cg.moveTo(cx - sz, cy); cg.lineTo(cx, cy - sz * .28); cg.lineTo(cx + sz, cy); cg.lineTo(cx, cy + sz * .28); cg.fill();
  }
  ctx.clearRect(0, 0, L.width, L.height); ctx.drawImage(Lg, 0, 0); ctx.drawImage(Lg, 0, 0); ctx.drawImage(L, 0, 0); ctx.filter = 'blur(1.5px)'; ctx.drawImage(LC, 0, 0); ctx.filter = 'none';
}
function startTrail(key, same) {
  var cv = document.getElementById('trl'); if (!cv) return; var ctx = cv.getContext('2d');
  var mk = function () { var c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; return c; }, L = mk(), Lg = mk(), LC = mk(), t0 = performance.now();
  ANIM = { raf: 0 };
  (function loop(now) {
    var el = (now - t0) / 1000, a = (same || Q.get('still') === '1') ? 1 : tcl((el - .25) / .65);
    trailFrame(key, (el / 4) % 1, a, ctx, L, Lg, LC); ANIM.raf = requestAnimationFrame(loop);
  })(t0);
}

// ---------- RIMS & SPINNER: rims_<key>
function pageRims(key, f) {
  var R = CAT.rims, i = R.findIndex(function (r) { return r.key === key; }), r = R[i], C = CARD, x = C[0] + 570, mw = C[2] - x - 40, kind = key === 'none' ? 'none' : (key === 'aurum' || key === 'null') ? 'faction' : 'shop', own = owned(f);
  var h = base('RIMS & SPINNER', dots(i, R.length), { vonly: 1 }) + card() + pool('rim_' + key, [C[0] + 40, C[1] + 100, C[0] + 520, C[1] + 470]);
  h += T(x, C[1] + 150, esc(r.name), 70, 'brand', mw) + T(x, C[1] + 250, esc(r.line), 34, 'hi', mw);
  r.hints.forEach(function (ln, k) { h += T(x, C[1] + 320 + 46 * k, esc(ln), 34, 'soft', mw); });
  h += ownedTag(own, r.price, kind === 'shop');
  var cw = 124, gap = 12, n = R.length, x0 = C[0] + (C[2] - C[0] - n * cw - (n - 1) * gap) / 2, y = C[3] - 110;
  R.forEach(function (q, j) { h += chip(x0 + j * (cw + gap), y, cw, 84, q.key === key, imgFit0('rim_' + q.key, cw - 24, 64, q.key === key ? 1 : .5)); });
  return h + buttons(kind === 'shop' && !own ? 'BUY' : 'CHOOSE', true, 'BACK', true);
}
function imgFit0(name, mw, mh, a) { return '<img src="live/img/' + name + '.webp" style="max-width:' + mw + 'px;max-height:' + mh + 'px;opacity:' + a + '">'; }

// ---------- SHIELD
function pageShield(f) {
  var C = CARD, S = CAT.shield, cx = W / 2, cy = C[1] + 190, r = 110, own = owned(f);
  var h = base('SHIELD', dots(0, 1)) + card() + '<div class="fade">';
  for (var k = 0; k < 3; k++) { var rr = r + k * 14; h += '<i class="abs" style="left:' + (cx - rr) + 'px;top:' + (cy - rr) + 'px;width:' + 2 * rr + 'px;height:' + 2 * rr + 'px;box-sizing:border-box;border-radius:50%;border:6px solid rgba(var(--accentRGB),' + ((220 - k * 70) / 255).toFixed(2) + ')"></i>'; }
  h += star(cx, cy, r * .62, 'var(--accent)') + '</div>';
  h += TC(C[1] + 340, 'SHIELD', 84, 'brand') + TC(C[1] + 446, esc(S.line1), 46, 'hi') + TC(C[1] + 512, esc(S.line2), 36, 'soft') + ownedTag(own, S.price, true);
  return h + buttons(own ? 'CHOOSE' : 'BUY', true, 'BACK', true);
}

// ---------- UNDERGLOW: ug_p_<pattern> | ug_t_<tone>  [+ _own]
function ugRgb(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a === undefined ? 1 : a) + ')'; }
function hsv(hh, s, v) { var i = Math.floor(hh * 6) % 6, f = hh * 6 - Math.floor(hh * 6), p = v * (1 - s), q = v * (1 - f * s), t = v * (1 - (1 - f) * s); return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i].map(function (x) { return Math.round(255 * x); }); }
function ugCurve(key, t) {
  if (key === 'steady') return .8;
  if (key === 'breathe') return .35 + .65 * (.5 - .5 * Math.cos(2 * Math.PI * t / 4));
  if (key === 'twin') { var ph = t % 2; return (ph < .15 || (ph >= .3 && ph < .45)) ? 1 : .15; }
  if (key === 'brake') return (t > 1.2 && t < 2.6) ? 1 : .5;
  if (key === 'beat') { var idx = Math.floor(t / .5), tb = t - idx * .5, pk = idx % 4 === 3 ? 1 : .7, env = tb < .05 ? tb / .05 : Math.max(0, 1 - (tb - .05) / .3); return .25 + (pk - .25) * env; }
  if (key === 'velocity') return .25 + .75 * Math.min(1, t / 3.2);
  return .8;
}
function ugGlyph(key, kind, tone, b) {
  var x0 = b[0], y0 = b[1], w = b[2] - b[0], h = b[3] - b[1], cx = w / 2, base = tone || [0, 229, 255], blobs;
  if (key === 'aurora') blobs = [[-.28, [0, 229, 204]], [0, [153, 76, 255]], [.28, [76, 255, 102]]];
  else if (key === 'prism') blobs = [[-.28, hsv(100 / 360, .9, 1)], [0, hsv(200 / 360, .9, 1)], [.28, hsv(300 / 360, .9, 1)]];
  else if (kind === 't' && key === 'none') { blobs = []; CAT.ug.hues8.forEach(function (c, i) { if (i !== 3 && i !== 5) blobs.push([-.3 + .6 * i / 7, c]); }); }
  else blobs = [[0, base]];
  var o = '<div class="abs fade" style="' + box(x0, y0, x0 + w, y0 + h) + '"><div class="abs" style="' + box(0, 0, w, h) + ';box-sizing:border-box;border-radius:24px;background:rgba(var(--tabRGB),.78);border:2px solid rgba(var(--softRGB),.31)"></div>';
  blobs.forEach(function (q) { var rw = w * (blobs.length === 1 ? .46 : .24); o += '<i class="abs" style="' + box(cx + q[0] * w - rw, 150 - 36, cx + q[0] * w + rw, 150 + 44) + ';border-radius:50%;background:' + ugRgb(q[1], .92) + ';filter:blur(20px)"></i>'; });
  o += '<i class="abs" style="' + box(cx - w * .36, 82, cx + w * .36, 126) + ';box-sizing:border-box;border-radius:20px;background:#18181c;background:rgb(18,24,28);border:2px solid rgba(var(--softRGB),.55)"></i>' +
    '<i class="abs" style="' + box(cx - w * .27, 118, cx - w * .2, 140) + ';border-radius:50%;background:rgb(8,10,12)"></i><i class="abs" style="' + box(cx + w * .2, 118, cx + w * .27, 140) + ';border-radius:50%;background:rgb(8,10,12)"></i>';
  if (kind === 'p') {
    var gx0 = 40, gx1 = w - 40, gy0 = 210, gy1 = h - 30, p = [];
    for (var i = 0; i <= 160; i++) p.push((gx0 + (gx1 - gx0) * i / 160).toFixed(1) + ',' + (gy1 - (gy1 - gy0) * ugCurve(key, 4 * i / 160)).toFixed(1));
    o += '<svg class="abs" style="left:0;top:0" width="' + w + '" height="' + h + '"><line x1="' + gx0 + '" y1="' + gy1 + '" x2="' + gx1 + '" y2="' + gy1 + '" stroke="var(--soft)" stroke-opacity=".35" stroke-width="2"/><polyline points="' + p.join(' ') + '" fill="none" stroke-width="5" stroke="' + (key === 'aurora' || key === 'prism' ? 'var(--accent)' : ugRgb(base)) + '"/></svg>';
  } else o += '<div class="abs soft" style="left:0;width:' + w + 'px;top:' + (h - 70) + 'px;text-align:center;font-size:30px">' + (key === 'none' ? 'your colour' : 'tone') + '</div>';
  return o + '</div>';
}
function pageUg(spec, f) {
  var G = CAT.ug, own = /_own$/.test(spec) || owned(f), key = spec.replace(/_own$/, ''), kind = key.charAt(0), k = key.slice(2), C = CARD, x = C[0] + 570, mw = C[2] - x - 40, nm, line, price, tone = null;
  if (kind === 'p') { var q = G.pats.find(function (z) { return z[0] === k; }); nm = q[1]; line = q[2]; price = q[3]; }
  else { var z = G.tones.find(function (e) { return e[0] === k; }); nm = z[1]; tone = z[2]; line = k === 'none' ? 'Your rider colour' : 'A steady tone for the glow'; price = k === 'none' ? 0 : G.tone_price; }
  var free = price === 0;
  var h = base('UNDERGLOW', null, { vonly: 1 }) + card() + ugGlyph(k, kind, tone, [C[0] + 40, C[1] + 80, C[0] + 520, C[1] + 450]);
  h += T(x, C[1] + 96, esc(nm), 70, 'brand', mw) + T(x, C[1] + 196, esc(line), 38, 'hi', mw);
  [free ? 'Free · changes nothing else' : own ? 'Yours for this vehicle · pick any time' : 'Bought for this vehicle only', 'Game flashes still show over it', 'Never red, amber or white'].forEach(function (ln, j) { h += T(x, C[1] + 270 + 46 * j, esc(ln), 34, 'soft', mw); });
  h += tag(C[2] - 30, C[1] + 30, free ? 'FREE' : own ? 'YOURS' : money(price) + ' glint', !free && !own);
  var cw = 118, gap = 10, y = C[3] - 200, n = G.pats.length, x0 = C[0] + (C[2] - C[0] - n * cw - (n - 1) * gap) / 2;
  G.pats.forEach(function (p, j) { var on = kind === 'p' && p[0] === k; h += chip(x0 + j * (cw + gap), y, cw, 64, on, '<span style="font-size:26px;white-space:nowrap;color:' + (on ? 'var(--text)' : 'var(--soft)') + '" data-fit="' + (cw - 12) + '">' + esc(p[1]) + '</span>', 14); });
  var y2 = C[3] - 112, tw = 58, m = G.tones.length; x0 = C[0] + (C[2] - C[0] - (m * tw + (m - 1) * 10)) / 2;
  G.tones.forEach(function (e, j) { var on = kind === 't' && e[0] === k;
    h += chip(x0 + j * (tw + 10), y2, tw, tw, on, e[2] ? '<i style="width:34px;height:34px;border-radius:50%;background:' + ugRgb(e[2], on ? 1 : .75) + '"></i>' : '<span style="font-size:30px;color:' + (on ? 'var(--text)' : 'var(--soft)') + '">A</span>', 14); });
  return h + buttons(own || free ? 'CHOOSE' : 'BUY', true, 'BACK', true);
}
function ugKnown(s) { var k = s.replace(/_own$/, ''), G = CAT.ug; return k.charAt(0) === 'p' ? G.pats.some(function (q) { return 'p_' + q[0] === k; }) : G.tones.some(function (q) { return 't_' + q[0] === k; }); }
