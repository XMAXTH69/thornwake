// Glint Exchange - CHARTS (26 Nov 2026). ONE job: turn plain numbers into inline SVG strings (line, stacked bars, sunburst, band line, small bars).
// No state, no URL, no page logic: exchange_portfolio.js feeds it. Text sizes stay >= 18 px so a 1920x1080 stage reads from a few metres.
// MECHANIC: show the player what the Exchange earned them over time (MY RESULTS page).
var GCH = (function () {
  'use strict';
  var COL = { puts: '#7FD4FF', calls: '#FFB02E', div: '#9B7BFF', gains: '#2EE59D', loss: '#FF4F64', grid: '#2C3E66', txt: '#8C9AB5', lab: '#DCE3EE' };
  var PAL = ['#7FD4FF', '#FFB02E', '#9B7BFF', '#2EE59D', '#FF6B85', '#E8C46A', '#1FB0BA', '#C7D2E8', '#5F8BFF', '#FF9F6B'];   // sector colours, glint palette
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], uid = 0;
  function n1(v) { return Math.round(v * 10) / 10; }
  function nice(lo, hi, n) {                                         // axis with round numbers
    var span = (hi - lo) || 1, raw = span / n, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), m = raw / p, step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p, t = [];
    var a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step;
    for (var v = a; v <= b + step * .001; v += step) t.push(Math.round(v * 1000) / 1000);
    return { lo: a, hi: b, ticks: t };
  }
  function kf(v) { var a = Math.abs(v), s = a >= 10000 ? Math.round(a / 1000) + 'k' : a >= 1000 ? (a / 1000).toFixed(1).replace('.0', '') + 'k' : String(Math.round(a)); return (v < 0 ? '−' : '') + s; }
  function mon(ym, withYear) { var m = ym % 100, y = Math.floor(ym / 100); return (MON[m - 1] || '?') + (withYear || m === 1 ? ' ' + y : ''); }
  function svg(w, h, body) { return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" style="display:block;overflow:visible">' + body + '</svg>'; }
  function tx(x, y, size, fill, s, anchor, extra) { return '<text x="' + n1(x) + '" y="' + n1(y) + '" font-size="' + size + '" fill="' + fill + '" text-anchor="' + (anchor || 'start') + '"' + (extra || '') + '>' + s + '</text>'; }
  function grid(ml, mt, pw, ph, sc, fmtY) {                          // horizontal lines + left labels
    var b = '';
    sc.ticks.forEach(function (t) {
      var y = mt + ph * (1 - (t - sc.lo) / (sc.hi - sc.lo));
      b += '<line x1="' + ml + '" x2="' + (ml + pw) + '" y1="' + n1(y) + '" y2="' + n1(y) + '" stroke="' + (t === 0 ? '#5A6E99' : COL.grid) + '" stroke-width="' + (t === 0 ? 2 : 1) + '"/>' + tx(ml - 12, y + 7, 20, COL.txt, (fmtY || kf)(t), 'end');
    });
    return b;
  }

  // ---- line: vals[] per month, yms[] month ids; o.zero = axis from 0, o.col
  function line(w, h, vals, yms, o) {
    o = o || {};
    var ml = 84, mr = 30, mt = 26, mb = 44, pw = w - ml - mr, ph = h - mt - mb, n = vals.length, col = o.col || COL.puts, id = 'gA' + (++uid);
    var lo = Math.min.apply(0, vals), hi = Math.max.apply(0, vals);
    if (o.zero) lo = Math.min(0, lo); else { var pad = (hi - lo) * .2 || 1; lo -= pad; hi += pad; }
    var sc = nice(lo, hi, 4);
    function X(i) { return ml + (n === 1 ? pw / 2 : i * pw / (n - 1)); }
    function Y(v) { return mt + ph * (1 - (v - sc.lo) / (sc.hi - sc.lo)); }
    var b = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".38"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' + grid(ml, mt, pw, ph, sc);
    var d = '', i;
    for (i = 0; i < n; i++) d += (i ? 'L' : 'M') + n1(X(i)) + ' ' + n1(Y(vals[i]));
    b += '<path d="' + d + 'L' + n1(X(n - 1)) + ' ' + n1(Y(sc.lo)) + 'L' + n1(X(0)) + ' ' + n1(Y(sc.lo)) + 'Z" fill="url(#' + id + ')"/>';
    b += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>';
    for (i = 0; i < n; i++) b += '<circle cx="' + n1(X(i)) + '" cy="' + n1(Y(vals[i])) + '" r="' + (i === n - 1 ? 9 : 5) + '" fill="' + (i === n - 1 ? '#fff' : '#04070F') + '" stroke="' + col + '" stroke-width="3"/>' + tx(X(i), h - 12, 18, COL.txt, mon(yms[i], i === 0), 'middle');
    var lx = X(n - 1), ly = Y(vals[n - 1]);
    return svg(w, h, b + tx(lx - 14, ly - 18, 26, '#fff', (vals[n - 1] < 0 ? '−' : '') + kf(Math.abs(vals[n - 1])) + ' ◆', 'end', ' font-weight="700"'));
  }

  // ---- stacked bars: rows [{ym, v:[puts,calls,div,gains]}] ; negatives hang below the zero line ; dashed average line
  function bars(w, h, rows, o) {
    o = o || {};
    var ml = 84, mr = 24, mt = 26, mb = 44, pw = w - ml - mr, ph = h - mt - mb, n = rows.length, keys = ['puts', 'calls', 'div', 'gains'], hi = 1, lo = 0, tot = 0, i, k;
    rows.forEach(function (r) { var p = 0, q = 0; r.v.forEach(function (v) { if (v > 0) p += v; else q += v; }); hi = Math.max(hi, p); lo = Math.min(lo, q); tot += p + q; });
    var sc = nice(lo, hi, 4), avg = n ? tot / n : 0, slot = pw / n, bw = slot * .66;
    function Y(v) { return mt + ph * (1 - (v - sc.lo) / (sc.hi - sc.lo)); }
    var b = grid(ml, mt, pw, ph, sc);
    rows.forEach(function (r, i) {
      var x = ml + i * slot + (slot - bw) / 2, up = 0, dn = 0, last = i === n - 1;
      for (k = 0; k < 4; k++) {
        var v = r.v[k]; if (!v) continue;
        var y0 = v > 0 ? Y(up) : Y(dn), y1 = v > 0 ? Y(up + v) : Y(dn + v);
        b += '<rect x="' + n1(x) + '" y="' + n1(Math.min(y0, y1)) + '" width="' + n1(bw) + '" height="' + n1(Math.abs(y0 - y1)) + '" fill="' + (k === 3 && v < 0 ? COL.loss : COL[keys[k]]) + '"' + (v < 0 ? ' fill-opacity=".8"' : last ? ' fill-opacity=".72"' : '') + '/>';
        if (v > 0) up += v; else dn += v;
      }
      b += tx(x + bw / 2, h - 12, 18, COL.txt, mon(r.ym, i === 0), 'middle');
    });
    var ya = Y(avg), lab = 'average ' + kf(avg) + ' ◆ a month', lw = lab.length * 11 + 20;
    b += '<line x1="' + ml + '" x2="' + (ml + pw) + '" y1="' + n1(ya) + '" y2="' + n1(ya) + '" stroke="#fff" stroke-width="3" stroke-dasharray="10 7"/>';
    b += '<rect x="' + (ml + 8) + '" y="' + n1(ya - 33) + '" width="' + lw + '" height="30" rx="7" fill="#04070F" fill-opacity=".85"/>' + tx(ml + 18, ya - 11, 21, '#fff', lab);
    return svg(w, h, b);
  }

  // ---- sunburst: secs [{name, value, kids:[{key, value}]}] (already sorted) ; selKey = key of the picked outer slice ; o.center = [line, line]
  function arc(cx, cy, r0, r1, a0, a1) {
    if (a1 - a0 >= Math.PI * 2 - 1e-4) a1 = a0 + Math.PI * 2 - 1e-4;
    var L = a1 - a0 > Math.PI ? 1 : 0, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    return 'M' + n1(cx + r1 * c0) + ' ' + n1(cy + r1 * s0) + 'A' + r1 + ' ' + r1 + ' 0 ' + L + ' 1 ' + n1(cx + r1 * c1) + ' ' + n1(cy + r1 * s1) + 'L' + n1(cx + r0 * c1) + ' ' + n1(cy + r0 * s1) + 'A' + r0 + ' ' + r0 + ' 0 ' + L + ' 0 ' + n1(cx + r0 * c0) + ' ' + n1(cy + r0 * s0) + 'Z';
  }
  function sunburst(sz, secs, selKey, o) {
    o = o || {};
    var cx = sz / 2, cy = sz / 2, R0 = sz * .165, R1 = sz * .325, R2 = sz * .47, total = 0, a = -Math.PI / 2, b = '';
    secs.forEach(function (s) { total += s.value; });
    if (!total) return svg(sz, sz, tx(cx, cy, 28, COL.txt, 'nothing invested', 'middle'));
    secs.forEach(function (s, si) {
      var span = s.value / total * Math.PI * 2, col = PAL[si % PAL.length], ka = a, hot = false;
      s.kids.forEach(function (k) {
        var ks = k.value / s.value * span, sel = k.key === selKey; if (sel) hot = true;
        b += '<path d="' + arc(cx, cy, R1 + 5, R2 + (sel ? 14 : 0), ka, ka + ks) + '" fill="' + col + '" fill-opacity="' + (sel ? 1 : .62) + '" stroke="' + (sel ? '#fff' : '#101A33') + '" stroke-width="' + (sel ? 4 : 3) + '"/>';
        ka += ks;
      });
      b = '<path d="' + arc(cx, cy, R0, R1, a, a + span) + '" fill="' + col + '" fill-opacity="' + (hot ? 1 : .88) + '" stroke="' + (hot ? '#fff' : '#101A33') + '" stroke-width="' + (hot ? 3 : 3) + '"/>' + b;
      a += span;
    });
    b += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (R0 - 6) + '" fill="#04070F" fill-opacity=".7"/>';
    (o.center || []).forEach(function (t, i) { b += tx(cx, cy + (i ? 34 : -4), i ? 22 : 34, i ? COL.txt : '#fff', t, 'middle', i ? '' : ' font-weight="700"'); });
    return svg(sz, sz, b);
  }

  // ---- band line: vals 0..100 per month drawn over coloured stripes. bands [[lo, hi, colour, label]]
  function bandLine(w, h, vals, yms, bands) {
    var ml = 20, mr = 96, mt = 10, mb = 34, pw = w - ml - mr, ph = h - mt - mb, n = vals.length, b = '', i;
    function X(i) { return ml + (n === 1 ? pw / 2 : i * pw / (n - 1)); }
    function Y(v) { return mt + ph * (1 - v / 100); }
    bands.forEach(function (bd) {
      b += '<rect x="' + ml + '" y="' + n1(Y(bd[1])) + '" width="' + pw + '" height="' + n1(Y(bd[0]) - Y(bd[1])) + '" fill="' + bd[2] + '" fill-opacity=".16"/>' + tx(ml + pw + 10, (Y(bd[0]) + Y(bd[1])) / 2 + 7, 20, bd[2], bd[3]);
    });
    var d = ''; for (i = 0; i < n; i++) d += (i ? 'L' : 'M') + n1(X(i)) + ' ' + n1(Y(vals[i]));
    b += '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>';
    for (i = 0; i < n; i++) b += '<circle cx="' + n1(X(i)) + '" cy="' + n1(Y(vals[i])) + '" r="' + (i === n - 1 ? 8 : 4) + '" fill="' + (i === n - 1 ? '#fff' : '#04070F') + '" stroke="#fff" stroke-width="2"/>';
    b += tx(X(0), h - 8, 18, COL.txt, mon(yms[0], true), 'start') + tx(X(n - 1), h - 8, 18, COL.txt, mon(yms[n - 1]), 'end');
    return svg(w, h, b);
  }

  // ---- small bars: one bar per month (0 = no data = no bar), last bar bright, dashed reference at the average
  function miniBars(w, h, vals, yms, col, avg, fmtY) {
    var ml = 20, mr = 12, mt = 34, mb = 34, pw = w - ml - mr, ph = h - mt - mb, n = vals.length, hi = Math.max.apply(0, vals.concat([1])) * 1.1, slot = pw / n, bw = slot * .62, b = '', i;
    function Y(v) { return mt + ph * (1 - v / hi); }
    for (i = 0; i < n; i++) if (vals[i] > 0) b += '<rect x="' + n1(ml + i * slot + (slot - bw) / 2) + '" y="' + n1(Y(vals[i])) + '" width="' + n1(bw) + '" height="' + n1(ph - (Y(vals[i]) - mt)) + '" rx="3" fill="' + col + '" fill-opacity="' + (i === n - 1 ? 1 : .55) + '"/>';
    b += '<line x1="' + ml + '" x2="' + (ml + pw) + '" y1="' + (mt + ph) + '" y2="' + (mt + ph) + '" stroke="' + COL.grid + '" stroke-width="2"/>';
    if (avg > 0) b += '<line x1="' + ml + '" x2="' + (ml + pw) + '" y1="' + n1(Y(avg)) + '" y2="' + n1(Y(avg)) + '" stroke="#fff" stroke-width="2" stroke-dasharray="8 6"/>' + '<rect x="' + ml + '" y="0" width="230" height="28" rx="7" fill="#04070F" fill-opacity=".85"/>' + tx(ml + 10, 21, 20, '#fff', 'average ' + (fmtY ? fmtY(avg) : kf(avg)));
    b += tx(ml, h - 8, 18, COL.txt, mon(yms[0], true), 'start') + tx(ml + pw, h - 8, 18, COL.txt, mon(yms[n - 1]), 'end');
    return svg(w, h, b);
  }

  return { COL: COL, PAL: PAL, line: line, bars: bars, sunburst: sunburst, bandLine: bandLine, miniBars: miniBars, kf: kf, mon: mon };
})();
