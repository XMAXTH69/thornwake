'use strict';
/* Glintline LIVE kiosk: the GUILD HALL DESK pages (26 Nov 2026, design/SPECIALISATIONS.md). ONE job: draw g_home / g_pick / g_price / g_top from the URL #fragment that
   GlintKiosk.cs builds in 'Guild desk' mode (GuildUrl); no data lives here. Loaded by kiosk_live.html after used_pages.js (shares CARD, CAT, base, card, buttons, T, TC, esc, money,
   box, tag, selBtn ...). Look = the other live pages (palette E, Cinzel headings via the 'brand' class, gold diamond = glint_mark.js).
   Buttons (hit zones of the desk): SELECT = main action, BACK zone = second button (SET PRICE on g_home, BACK elsewhere), DRIVE zone = third button (TOP SPECIALISTS), LEFT / RIGHT = choose, home = back to g_home.
   Fragment keys (all short, text keys are percent-encoded by the kiosk):
     h  0 asking the Guild / 1 answered / 2 no answer (every page)
     sp MECHANIC | DEALER | '' (none)   st T training / A active   td tn = play days done / needed   jt jc = jobs today / today's cap   jb total jobs   rk rank 0..2   nr jobs for the next rank (0 = MASTER)
     pc posted price percent   er glint earned   sc cc = start / change cost   sd cd = start / change play days   ch times changed
     g_pick   o = chosen specialisation (0 MECHANIC, 1 DEALER)   c = confirm step (0 none, 1 confirm, 2 confirm again, 3 working)
     g_price  pc = the price shown now (60..95 step 5)   cur = the price posted now   c=3 working
     g_top    r = rows 'kind|name|spec|rank|n|m;...'  (J most jobs, C cheapest mechanic now, T in training, E top earners)
   Browser tests: #p=g_home&h=1&sp=MECHANIC&st=A&jt=12&jc=40&jb=83&rk=1&nr=250&pc=80&er=12400   |   #p=g_home&h=1   |   #p=g_pick&h=1&sp=MECHANIC&o=1&c=2&sd=3&cd=7&sc=5000&cc=10000&rk=1
   #p=g_price&h=1&sp=MECHANIC&pc=70&cur=80&rk=1   |   #p=g_top&h=1&r=J|Mira|MECHANIC|2|310|0;C|Joss|MECHANIC|1|62|0;T|Ken|DEALER|0|2|3                                                         */
var G_RANKS = ['APPRENTICE', 'JOURNEYMAN', 'MASTER'], G_SPECS = ['MECHANIC', 'DEALER'];
function gOn(f) { return f.h === '1'; }
function gInfo(spec) {
  return spec === 'DEALER' ? ['DEALER', 'Sell used rides for an 8 % fee, not 15 %', 'Up to 5 lots at the low fee. A higher rank gives extra garage slots.']
    : ['MECHANIC', 'Repair rides for 60 to 95 % of the Paddock price', 'You set the price. Parts cost 50 % of the Paddock price and burn.'];
}
function gWait(f) {
  var closed = f.h === '2';
  return TC(CARD[1] + 250, closed ? 'THE GUILD DID NOT ANSWER' : 'ASKING THE GUILD', 66, 'brand', 960) +
    TC(CARD[1] + 360, closed ? 'Touch START and try again in a moment.' : 'One moment', 40, 'soft', 960);
}
function gTile(x, y, w, h, label, value, on) {
  return '<div class="abs tile fade" style="' + box(x, y, x + w, y + h) + ';border-radius:20px;flex-direction:column;gap:6px' + (on ? ';border:3px solid var(--accent)' : '') + '">' +
    '<div class="soft" style="font-size:26px;letter-spacing:.14em">' + esc(label) + '</div><div class="hi" style="font-size:46px;white-space:nowrap" data-fit="' + (w - 30) + '">' + value + '</div></div>';
}
function gZone(label, size) { return '<div class="abs drive btn" style="font-size:' + (size || 40) + 'px;letter-spacing:.06em">' + esc(label) + '</div>'; }
function gBack(label, dim) {
  return '<div class="abs back btn' + (dim ? ' still' : '') + '" id="bk"' + (dim ? ' style="opacity:.4"' : '') + '><span style="letter-spacing:.1em">' + esc(label) + '</span></div>';
}

function pageGuildHome(f) {
  var C = CARD, h = base('GUILD HALL', null, { nohome: 1 }) + card();
  if (!gOn(f)) return h + gWait(f) + (f.h === '2' ? selBtn('RETRY') : '');
  var sp = f.sp || '', rk = Math.max(0, Math.min(2, +f.rk || 0)), train = f.st === 'T';
  if (!sp) {
    h += TC(C[1] + 36, 'JOIN THE GUILD', 70, 'brand', 960) + TC(C[1] + 128, 'You are not a specialist yet. Pick one job. Training takes ' + (+f.sd || 3) + ' play days.', 32, 'soft', 960);
    G_SPECS.forEach(function (s, j) {
      var x = C[0] + 40 + j * 520, g = gInfo(s);
      h += '<div class="abs tile fade" style="' + box(x, C[1] + 200, x + 480, C[1] + 470) + ';border-radius:24px;flex-direction:column;gap:14px;padding:0 24px;text-align:center">' +
        '<div class="brand hi" style="font-size:56px;letter-spacing:.2em">' + g[0] + '</div><div style="font-size:32px;line-height:1.2">' + esc(g[1]) + '</div><div class="soft" style="font-size:26px;line-height:1.25">' + esc(g[2]) + '</div></div>';
    });
    h += TC(C[1] + 520, 'START  ' + money(+f.sc || 5000) + ' ◆  ·  ' + (+f.sd || 3) + ' play days of training', 44, 'hi', 960);
    h += TC(C[1] + 584, 'A play day = a day with at least one finished race', 30, 'soft', 960);
    return h + selBtn('START') + gBack('SET PRICE', true) + gZone('TOP SPECIALISTS', 34);
  }
  var info = gInfo(sp), jt = +f.jt || 0, jc = +f.jc || 0, jb = +f.jb || 0, nr = +f.nr || 0;
  h += TC(C[1] + 24, info[0], 80, 'brand hi', 960);
  h += TC(C[1] + 124, train ? 'TRAINING  ·  PLAY DAY ' + (+f.td || 0) + ' OF ' + (+f.tn || 3) : 'ACTIVE  ·  ' + (sp === 'MECHANIC' ? 'LISTED AT THE GARAGE' : 'LOW FEE ON YOUR USED LOTS'), 38, train ? 'soft' : 'hi', 960);
  var x0 = C[0] + 40, w = 320, g = 20, y1 = C[1] + 200, y2 = C[1] + 360, th = 140;
  h += gTile(x0, y1, w, th, 'RANK', G_RANKS[rk]) + gTile(x0 + w + g, y1, w, th, 'JOBS TODAY', jt + ' / ' + jc) + gTile(x0 + 2 * (w + g), y1, w, th, 'TOTAL JOBS', money(jb));
  h += gTile(x0, y2, w, th, train ? 'TRAINING' : 'STATUS', train ? (+f.td || 0) + ' / ' + (+f.tn || 3) + ' DAYS' : 'ACTIVE');
  h += gTile(x0 + w + g, y2, w, th, 'EARNED', money(+f.er || 0) + ' ◆');
  h += gTile(x0 + 2 * (w + g), y2, w, th, sp === 'MECHANIC' ? 'YOUR PRICE' : 'USED FEE', sp === 'MECHANIC' ? (+f.pc || 95) + ' % PADDOCK' : '8 %');
  var bx = C[0] + 40, bw = 1000, by = C[1] + 560, pct = nr > 0 ? Math.min(1, jb / nr) : 1;
  h += '<div class="abs fade" style="' + box(bx, by, bx + bw, by + 30) + ';border-radius:10px;box-sizing:border-box;background:rgba(var(--tabRGB),.6);border:2px solid rgba(var(--softRGB),.43);overflow:hidden"><div style="height:100%;width:' + Math.round(pct * 100) + '%;background:var(--accent)"></div></div>';
  h += T(bx, by + 38, nr > 0 ? esc(money(jb) + ' / ' + money(nr) + ' JOBS TO ' + G_RANKS[Math.min(2, rk + 1)]) : 'HIGHEST RANK REACHED', 26, 'soft', 1000);
  return h + selBtn('CHANGE') + gBack('SET PRICE', sp !== 'MECHANIC') + gZone('TOP SPECIALISTS', 34);
}

function pageGuildPick(f) {
  var C = CARD, o = +f.o === 1 ? 1 : 0, c = +f.c || 0, sp = f.sp || '', change = !!sp, work = c === 3, same = sp === G_SPECS[o];
  var cost = change ? +f.cc || 10000 : +f.sc || 5000, days = change ? +f.cd || 7 : +f.sd || 3, rk = Math.max(0, Math.min(2, +f.rk || 0));
  var h = base('GUILD HALL', null) + card() + TC(C[1] + 30, change ? 'CHANGE SPECIALISATION' : 'CHOOSE YOUR WORK', 56, 'brand', 960);
  G_SPECS.forEach(function (s, j) {
    var x = C[0] + 40 + j * 520, on = j === o, g = gInfo(s);
    h += '<div class="abs tile' + (on ? ' on' : '') + ' fade" style="' + box(x, C[1] + 110, x + 480, C[1] + 330) + ';border-radius:22px;flex-direction:column;gap:12px;padding:0 24px;text-align:center;color:' + (on ? 'var(--text)' : 'var(--soft)') + '">' +
      '<div class="brand" style="font-size:52px;letter-spacing:.2em">' + g[0] + '</div><div style="font-size:30px;line-height:1.2">' + esc(g[1]) + '</div></div>';
  });
  h += TC(C[1] + 350, 'PRICE  ' + money(cost) + ' ◆   ·   ' + days + ' PLAY DAYS OF TRAINING', 44, 'hi', 960);
  if (change) h += TC(C[1] + 420, 'WARNING  ·  your ' + sp + ' and your rank ' + G_RANKS[rk] + ' are LOST', 38, '', 960);
  var line = work ? 'Working, one moment' : same ? 'You already are a ' + sp + '. Pick the other one.'
    : c === 0 ? 'LEFT / RIGHT = choose  ·  SELECT = ' + (change ? 'CHANGE' : 'START')
    : c === 1 ? (change ? 'Pay ' + money(cost) + ' ◆ and give up your rank? Touch CONFIRM' : 'Pay ' + money(cost) + ' ◆ from your banked glint? Touch CONFIRM')
    : 'LAST CHANCE  ·  this cannot be undone. Touch CONFIRM AGAIN';
  h += TC(C[1] + (change ? 490 : 440), esc(line), 40, c > 0 && !same ? 'hi' : 'soft', 960);
  if (change) h += TC(C[1] + 560, 'Change number ' + ((+f.ch || 0) + 1) + '  ·  one specialisation at a time', 28, 'soft', 960);
  var lbl = work ? 'WORKING' : c === 0 ? (change ? 'CHANGE' : 'START') : c === 1 ? 'CONFIRM' : 'CONFIRM AGAIN';
  return h + buttons(null, true, 'BACK') + selBtn(lbl, same && !work);
}

function pageGuildPrice(f) {
  var C = CARD, pc = Math.max(60, Math.min(95, +f.pc || 95)), cur = +f.cur || pc, rk = Math.max(0, Math.min(2, +f.rk || 0)), work = f.c === '3';
  var mat = rk >= 2 ? 450 : 500, price = pc * 10, keep = price - mat;
  var h = base('GUILD HALL', null) + card() + TC(C[1] + 30, 'SET YOUR REPAIR PRICE', 56, 'brand', 960);
  h += TC(C[1] + 120, pc + ' %', 150, 'brand hi tight', 600) + TC(C[1] + 290, 'OF THE PADDOCK PRICE' + (pc === cur ? '   ·   posted now' : '   ·   posted now: ' + cur + ' %'), 36, 'soft', 960);
  h += TC(C[1] + 360, 'On a 1 000 ◆ Paddock repair', 34, 'soft', 960);
  h += TC(C[1] + 408, 'Rider pays ' + money(price) + ' ◆   ·   parts burn ' + mat + ' ◆   ·   you keep ' + money(Math.max(0, keep)) + ' ◆', 40, keep > 0 ? 'hi' : '', 1020);
  for (var q = 60; q <= 95; q += 5) {
    var x = 960 - 3.5 * 80 + (q - 60) / 5 * 80, on = q === pc, was = q === cur;
    h += '<i class="abs fade" style="left:' + (x - (on ? 17 : 12)) + 'px;top:' + (C[1] + (on ? 484 : 490)) + 'px;width:' + (on ? 34 : 24) + 'px;height:' + (on ? 34 : 24) + 'px;border-radius:50%;box-sizing:border-box;border:' + (was ? '4px solid var(--hi)' : '3px solid var(--soft)') + ';background:' + (on ? 'var(--accent)' : 'transparent') + '"></i>';
  }
  h += TC(C[1] + 556, 'LEFT / RIGHT = price in 5 % steps  ·  cheaper = more riders pick you', 30, 'soft', 1000);
  return h + buttons(null, true, 'BACK') + selBtn(work ? 'WORKING' : pc === cur ? 'POSTED' : 'SET PRICE', pc === cur && !work);
}

function gRows(f) {
  var o = { J: [], C: [], T: [], E: [] };
  String(f.r || '').split(';').forEach(function (s) { var a = s.split('|'); if (a.length >= 6 && o[a[0]]) o[a[0]].push({ name: a[1], spec: a[2], rank: +a[3] || 0, n: +a[4] || 0, m: +a[5] || 0 }); });
  return o;
}
function gBlock(x, y, w, head, rows, fmt, max) {
  var h = T(x, y, esc(head), 28, 'hi', w, 'letter-spacing:.14em') + '<div class="abs fade" style="' + box(x, y + 40, x + w, y + 42) + ';background:rgba(var(--accentRGB),.5)"></div>';
  if (!rows.length) return h + T(x, y + 58, 'nobody yet', 28, 'soft', w);
  rows.slice(0, max).forEach(function (r, i) {
    var yy = y + 54 + i * 42;
    h += T(x, yy, (i + 1) + '  ' + esc(r.name), 30, '', w - 250) + T(x + w - 245, yy + 6, esc(G_RANKS[Math.max(0, Math.min(2, r.rank))].slice(0, 4) + (r.spec ? ' ' + r.spec.slice(0, 4) : '')), 20, 'soft', 115) +
      '<div class="abs fade hi" style="left:' + (x + w - 120) + 'px;top:' + yy + 'px;width:120px;text-align:right;font-size:30px;white-space:nowrap">' + fmt(r) + '</div>';
  });
  return h;
}
function pageGuildTop(f) {
  var C = CARD, h = base('GUILD HALL', null) + card() + TC(C[1] + 14, 'TOP SPECIALISTS', 46, 'brand', 960);
  if (!gOn(f)) return h + gWait(f) + buttons(null, false, 'BACK');
  var r = gRows(f), wL = 480, xL = C[0] + 40, xR = C[0] + 560;
  h += gBlock(xL, C[1] + 90, wL, 'CHEAPEST MECHANIC NOW', r.C, function (q) { return q.n + ' %'; }, 1);
  h += gBlock(xL, C[1] + 230, wL, 'IN TRAINING', r.T, function (q) { return q.n + '/' + q.m; }, 5);
  h += gBlock(xR, C[1] + 90, wL, 'MOST JOBS', r.J, function (q) { return money(q.n); }, 5);
  h += gBlock(xR, C[1] + 360, wL, 'TOP EARNERS', r.E, function (q) { return money(q.n) + ' ◆'; }, 5);
  return h + buttons(null, false, 'BACK') + selBtn('REFRESH');
}
function guildBuild(f) {
  var p = f.p;
  if (p === 'g_home') return { key: 'ghome', car: 'h' + (f.h || 0) + (f.sp || ''), html: pageGuildHome(f) };
  if (p === 'g_pick') return { key: 'gpick', car: 'p' + (f.o || 0), html: pageGuildPick(f) };
  if (p === 'g_price') return { key: 'gprice', car: 'c', html: pageGuildPrice(f) };
  if (p === 'g_top') return { key: 'gtop', car: 't', html: pageGuildTop(f) };
  return null;
}
