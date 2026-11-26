'use strict';
/* Glintline LIVE kiosk: the BOUNTY OFFICE DESK pages (26 Nov 2026, BOUNTY v3, design/BOUNTY-OFFICE.md). ONE job: draw b_home / b_who / b_amt / b_res from the URL #fragment that
   GlintKiosk.cs builds in 'Bounty desk' mode (BountyUrl); no data lives here. Loaded by kiosk_live.html after guild_pages.js (shares CARD, base, card, buttons, T, TC, esc, money, box, selBtn ...).
   Look = the other live pages (palette E, Cinzel headings via the 'brand' class). Red is used ONLY for danger (WANTED / price on a head), like MOOD-GUIDE: red = wanted / hunter.
   Buttons (hit zones of the desk): SELECT = main action, LEFT / RIGHT = move / choose, BACK = one step back, DRIVE zone = REFRESH (b_who), home = leave the desk.
   Fragment keys (text keys are percent-encoded by the kiosk):
     b_home  n = riders wanted now, r = rows 'name|total|secondsLeft;...' (GL_WantedBoard, biggest first)
     b_who   h 0 asking / 1 answered / 2 no answer   n = riders in the list   i = selected index (0 based)   me = '' or the note of a ROOKIE operator ('3 more races')   bk = banked glint
             r = the 5 rows of the page of i, 'name|total|flag|note|fee|hours;...'  fee = extra repeat placing fee (burned, 0 = none), hours = hours until it resets; flag O = off the board until tomorrow (3 wanted today); flag R revenge (the last rider who crashed you) / W already wanted (total = price on him) / P ROOKIE, protected (note 'N more races') / U no rider record yet / '' plain
     b_amt   nm = target name  tt = price on him now  fl = his flag  fe = repeat fee (0 none)  rh = hours until it resets  am = 5 amounts 'a,b,c,d,max'  o = chosen 0..4  mn mx = smallest / largest stake  bk = banked  c = 0 pick / 1 CONFIRM armed / 3 working
     b_res   ok 1 / 0   nm   a = amount   w = why not
   Browser tests:  #p=b_home&n=2&r=Mira|300|420;Joss|120|60
     #p=b_who&h=1&n=7&i=1&bk=1800&r=Joss|0|R|;Ken|300|W|;Mira|0||;Pip|0|P|3 more races;Rex|0|U|
     #p=b_who&h=1&n=3&i=0&me=4+more+races&bk=90&r=Joss|0||;Ken|0||;Pip|0|P|2 more days      |  #p=b_who&h=1&n=0   |  #p=b_who&h=0
     #p=b_who&h=1&n=3&i=0&bk=1800&r=Joss|300|W||500|7;Ken|0|O|Off+the+board+until+tomorrow|0|0;Mira|0|||0|0
     #p=b_amt&nm=Joss&tt=300&fl=W&fe=500&rh=7&am=20,50,100,250,900&o=2&mn=20&mx=900&bk=1800&c=1   |   #p=b_amt&nm=Joss&tt=300&fl=W&am=20,50,100,250,900&o=2&mn=20&mx=900&bk=1800&c=1   |   #p=b_res&ok=1&nm=Joss&a=100   |   #p=b_res&ok=0&nm=Pip&w=That+rider+is+a+ROOKIE,+protected      */
var B_RED = '#ff5c5c';
function bClock(s) { s = Math.max(0, +s || 0); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
function bZone(label, size) { return '<div class="abs drive btn" style="font-size:' + (size || 40) + 'px;letter-spacing:.06em">' + esc(label) + '</div>'; }
function bRows(s) { return String(s || '').split(';').filter(function (x) { return x.length; }).map(function (x) { return x.split('|'); }); }

function pageBountyHome(f) {
  var C = CARD, h = base('BOUNTY OFFICE', null, { nohome: 1 }) + card(), rows = bRows(f.r), n = +f.n || 0;
  h += TC(C[1] + 26, 'MOST WANTED', 70, 'brand', 960);
  if (!n) {
    h += TC(C[1] + 200, 'NOBODY IS WANTED', 52, 'soft', 960) + TC(C[1] + 280, 'Put a price on a rider. Whoever crashes them takes it.', 34, 'soft', 960);
  } else {
    rows.slice(0, 6).forEach(function (r, i) {
      var y = C[1] + 130 + i * 70;
      h += T(C[0] + 70, y, (i + 1) + '   ' + esc(String(r[0]).toUpperCase()), 42, '', 520) +
        '<div class="abs fade" style="' + box(C[0] + 600, y, C[2] - 70, y + 56) + ';text-align:right;font-size:42px;white-space:nowrap;color:' + B_RED + '">' + money(+r[1] || 0) + ' ◆</div>' +
        T(C[0] + 440, y + 12, bClock(r[2]) + ' LEFT', 26, 'soft', 150);
    });
    if (n > 6) h += TC(C[1] + 560, '+ ' + (n - 6) + ' more', 30, 'soft', 960);
  }
  h += TC(C[1] + (n ? 586 : 380), 'Bounties are placed at this desk only', 28, 'soft', 960);
  return h + selBtn('PLACE A BOUNTY');
}

function bWho(f) {
  var C = CARD, n = +f.n || 0, i = +f.i || 0, rows = bRows(f.r), start = Math.floor(i / 5) * 5, h = base('BOUNTY OFFICE', null) + card();
  h += TC(C[1] + 18, 'PICK A RIDER', 56, 'brand', 960);
  if (f.h === '0' || f.h === '2') {
    var closed = f.h === '2';
    return h + TC(C[1] + 250, closed ? 'THE OFFICE DID NOT ANSWER' : 'ASKING THE OFFICE', 62, 'brand', 960) +
      TC(C[1] + 350, closed ? 'Touch REFRESH to ask again.' : 'One moment, reading who is here', 38, 'soft', 960) + buttons(null, false, 'BACK') + bZone('REFRESH', 40);
  }
  if (f.me) h += TC(C[1] + 84, 'YOU ARE A ROOKIE  ·  bounties open after ' + esc(f.me), 32, 'hi', 1000);
  if (!n) return h + TC(C[1] + 250, 'NOBODY ELSE IS HERE', 56, 'soft', 960) + buttons(null, false, 'BACK') + bZone('REFRESH', 40);
  rows.slice(0, 5).forEach(function (r, j) {
    var idx = start + j, on = idx === i, y = C[1] + 126 + j * 78, flag = r[2] || '', note = r[3] || '', tot = +r[1] || 0, fee = +r[4] || 0, hrs = +r[5] || 0, prot = flag === 'P' || flag === 'U' || flag === 'O';
    h += '<div class="abs tile' + (on ? ' on' : '') + ' fade" style="' + box(C[0] + 40, y, C[2] - 40, y + 68) + ';border-radius:16px' + (prot ? ';opacity:.55' : '') + '"></div>';
    h += T(C[0] + 70, fee > 0 ? y + 0 : y + 12, esc(String(r[0]).toUpperCase()), fee > 0 ? 32 : 38, on ? 'hi' : '', 400);
    if (fee > 0 && !prot) h += T(C[0] + 70, y + 38, 'Another bounty on ' + esc(String(r[0]).toUpperCase()) + ' today costs ' + money(fee) + ' ◆ extra (normal again in ' + hrs + ' h)', 27, 'soft', 760);
    var right = flag === 'P' ? '<span class="soft" style="font-size:26px">ROOKIE  ·  protected for ' + esc(note) + '</span>'
      : flag === 'U' ? '<span class="soft" style="font-size:26px">NEW HERE  ·  PROTECTED</span>'
      : flag === 'O' ? '<span class="soft" style="font-size:26px">OFF THE BOARD UNTIL TOMORROW</span>'
      : (flag === 'R' ? '<span class="hi" style="font-size:28px;letter-spacing:.14em">REVENGE</span>  ' : '') + (tot > 0 ? '<span style="color:' + B_RED + '">WANTED  ' + money(tot) + ' ◆</span>' : '');
    h += '<div class="abs fade" style="' + box(C[0] + 440, y, C[2] - 70, y + 68) + ';display:flex;align-items:center;justify-content:flex-end;font-size:34px;white-space:nowrap">' + right + '</div>';
  });
  var pages = Math.max(1, Math.ceil(n / 5));
  h += TC(C[1] + 540, 'RIDER ' + (i + 1) + ' OF ' + n + '   ·   PAGE ' + (Math.floor(i / 5) + 1) + ' OF ' + pages, 28, 'soft', 960);
  if (f.bk) h += TC(C[1] + 590, 'YOUR VAULT  ' + money(+f.bk) + ' ◆', 28, 'soft', 960);
  return h + buttons(null, true, 'BACK') + selBtn(f.me ? 'ROOKIE' : 'PICK', !!f.me) + bZone('REFRESH', 40);
}

function bAmt(f) {
  var C = CARD, am = String(f.am || '').split(',').map(Number), o = +f.o || 0, c = +f.c || 0, mn = +f.mn || 0, mx = +f.mx || 0, work = c === 3;
  var h = base('BOUNTY OFFICE', null) + card() + TC(C[1] + 24, 'PRICE ON', 36, 'soft', 960) + TC(C[1] + 70, esc(String(f.nm || '').toUpperCase()), 76, 'brand hi', 960);
  var tt = +f.tt || 0, fee0 = +f.fe || 0;
  h += TC(C[1] + (fee0 > 0 ? 164 : 176), tt > 0 ? 'already ' + money(tt) + ' ◆ on this rider  ·  yours adds to it' : (f.fl === 'R' ? 'REVENGE  ·  the rider who crashed you' : 'no bounty on this rider yet'), fee0 > 0 ? 28 : 32, tt > 0 ? '' : 'soft', 960);
  var fee = +f.fe || 0, rh = +f.rh || 0;
  if (fee > 0) h += TC(C[1] + 200, 'Another bounty on ' + esc(String(f.nm || '').toUpperCase()) + ' today costs ' + money(fee) + ' ◆ extra (normal again in ' + rh + ' h)', 26, 'hi', 1000);
  for (var j = 0; j < 5; j++) {
    var x = C[0] + 40 + j * 200, v = am[j] || 0, ok = v >= Math.max(1, mn) && v <= mx, on = j === o;
    h += '<div class="abs tile' + (on ? ' on' : '') + ' fade" style="' + box(x, C[1] + 240, x + 184, C[1] + 380) + ';border-radius:20px;flex-direction:column;gap:6px' + (ok ? '' : ';opacity:.35') + (on ? ';border:3px solid var(--accent)' : '') + '">' +
      '<div class="soft" style="font-size:24px;letter-spacing:.14em">' + (j === 4 ? 'MAX' : 'AMOUNT') + '</div><div class="' + (on ? 'hi' : '') + '" style="font-size:46px;white-space:nowrap">' + money(v) + '</div></div>';
  }
  h += TC(C[1] + 410, 'YOUR VAULT  ' + money(+f.bk || 0) + ' ◆   ·   MOST YOU CAN PUT UP  ' + money(mx) + ' ◆  (half your vault)', 30, 'soft', 1000);
  var v = am[o] || 0, line = work ? 'Working, one moment' : c === 1 ? 'Pay ' + money(v) + (fee > 0 ? ' + ' + money(fee) + ' fee' : '') + ' ◆ from your vault? Touch CONFIRM' : v > mx ? 'More than half of your vault' : v < Math.max(1, mn) ? 'Smallest bounty is ' + money(mn) + ' ◆' : 'LEFT / RIGHT = amount  ·  SELECT = PLACE';
  h += TC(C[1] + 470, esc(line), 42, c === 1 ? 'hi' : 'soft', 1000);
  h += TC(C[1] + 540, 'Whoever crashes this rider takes it. If they survive, they keep half of it.', 28, 'soft', 1000);
  return h + buttons(null, true, 'BACK') + selBtn(work ? 'WORKING' : c === 1 ? 'CONFIRM' : 'PLACE', work);
}

function bRes(f) {
  var C = CARD, ok = f.ok === '1', h = base('BOUNTY OFFICE', null) + card();
  if (ok) {
    h += TC(C[1] + 130, 'BOUNTY PLACED', 80, 'brand hi', 960) + TC(C[1] + 260, esc(String(f.nm || '').toUpperCase()), 64, 'brand', 960) +
      TC(C[1] + 360, '<span style="color:' + B_RED + '">' + money(+f.a || 0) + ' ◆</span> from your vault', 48, '', 960) +
      TC(C[1] + 450, 'They are on the Most Wanted wall now.', 34, 'soft', 960);
  } else {
    h += TC(C[1] + 130, 'NOT PLACED', 80, 'brand', 960) + (f.nm ? TC(C[1] + 260, esc(String(f.nm).toUpperCase()), 56, 'brand soft', 960) : '') +
      TC(C[1] + 360, esc(f.w || 'Try again'), 42, 'hi', 1000) + TC(C[1] + 450, 'Nothing was taken from your vault.', 34, 'soft', 960);
  }
  return h + buttons(null, false, 'BACK') + selBtn('BACK TO LIST');
}

function bountyBuild(f) {
  var p = f.p;
  if (p === 'b_home') return { key: 'bhome', car: 'n' + (f.n || 0), html: pageBountyHome(f) };
  if (p === 'b_who') return { key: 'bwho', car: 'w' + (f.h || 0), html: bWho(f) };
  if (p === 'b_amt') return { key: 'bamt', car: 'a', html: bAmt(f) };
  if (p === 'b_res') return { key: 'bres', car: 'r' + (f.ok || 0), html: bRes(f) };
  return null;
}
