// Glintline GLINT MARK on the web screens (owner 26 Nov 2026: ONE mark everywhere = ◆, always GOLD, the same gold as the in-game
// HUD vault (sRGB #FFD46B = HUD C(1, 0.83, 0.42))). ONE job: after anything is drawn, (1) an amount written as '<number> glint'
// becomes '<number> ◆', (2) every ◆ is wrapped in <span class="glm"> so it shows gold, whatever colour the text around it has.
// Used by exchange/exchange_live.html, exchange/board.html, kiosk/kiosk_live.html. Pages keep writing plain ◆ / 'glint' - this file
// does the rest, so no page code has to change when a new amount is added.
(function () {
  'use strict';
  var GOLD = '#FFD46B';
  var css = document.createElement('style');
  css.textContent = '.glm{color:' + GOLD + '!important;-webkit-text-fill-color:' + GOLD + '!important}';
  document.head.appendChild(css);

  var AMOUNT = /(\d)(\s|&nbsp;| )glint\b/g;               // '1 500 glint' -> '1 500 ◆' (only right after a number)
  function fixText(node) {
    var t = node.nodeValue;
    if (t.indexOf('glint') >= 0) { var u = t.replace(AMOUNT, '$1$2◆'); if (u !== t) { node.nodeValue = u; t = u; } }
    if (t.indexOf('◆') < 0) return;
    var p = node.parentNode;
    if (!p || (p.classList && p.classList.contains('glm')) || /^(SCRIPT|STYLE|TEXTAREA|INPUT)$/.test(p.nodeName)) return;
    var parts = t.split('◆'), frag = document.createDocumentFragment();
    parts.forEach(function (s, i) {
      if (s) frag.appendChild(document.createTextNode(s));
      if (i < parts.length - 1) { var m = document.createElement('span'); m.className = 'glm'; m.textContent = '◆'; frag.appendChild(m); }
    });
    p.replaceChild(frag, node);
  }
  function walk(root) {
    if (root.nodeType === 3) { fixText(root); return; }
    if (root.nodeType !== 1 || (root.classList && root.classList.contains('glm'))) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), list = [], n;
    while ((n = w.nextNode())) list.push(n);
    list.forEach(fixText);
  }
  var busy = false;
  var mo = new MutationObserver(function (recs) {
    if (busy) return; busy = true;
    try { recs.forEach(function (r) { if (r.type === 'characterData') fixText(r.target); else r.addedNodes.forEach(walk); }); }
    finally { mo.takeRecords(); busy = false; }
  });
  function start() { walk(document.body); mo.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
})();
