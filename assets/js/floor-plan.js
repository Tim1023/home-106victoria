/* 106 Victoria · 整屋交互平面图 (Phase 3)
 * 依赖：window.ROOMS, window.FLOOR_LAYOUT, window.FloorRenderer。由 boot.js 在 initFurniture 之后调用 initFloorPlan()。
 * 渲染到 #house-plan：3 个 tab（一楼/二楼/泳池房）·点房间跳到对应方案·悬停显示房名+尺寸·家具层总开关。
 * 复用各房间 rooms-data.inner（不重画），包一层 <g transform> 搬运到整屋落点；统一 60px/m。
 * 家具：把单房间 SVG 已摆放的家具克隆进整屋图作快照（拖动后由 refreshFloorRoom 同步）。
 */
(function (root) {
  'use strict';

  var FR = root.FloorRenderer;
  var FURN_VIS_KEY = 'v106_furn_visible';
  var planEl = null, tipEl = null;

  function mmToPx(mm) { return FR.mmToPx(mm); }
  function pxToMm(px) { return FR.pxToMm(px); }
  function ROOMS() { return root.ROOMS || {}; }

  // 房间局部内容包围盒（local px）：body + subRooms + fixtures
  function roomFootprintPx(room) {
    var all = [room.body].concat(room.subRooms || [], room.fixtures || []);
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    all.forEach(function (r) {
      minX = Math.min(minX, r.x); minY = Math.min(minY, r.y);
      maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h);
    });
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  function setSvgInner(el, inner) {
    var tmp = FR.svgStringToElement('<svg xmlns="' + FR.SVG_NS + '">' + inner + '</svg>');
    while (tmp.firstChild) el.appendChild(tmp.firstChild);
  }

  // 把单房间已摆放家具克隆进整屋图房间组（display-only 快照）
  function cloneFurnitureInto(g, roomId) {
    var layer = g.querySelector('.furniture');
    if (!layer) return;
    layer.textContent = '';
    var src = document.querySelector('svg.svg-room[data-room-id="' + roomId + '"] .furniture');
    if (!src) return;
    [].forEach.call(src.children, function (node) {
      var c = node.cloneNode(true);
      c.removeAttribute('tabindex'); c.classList.remove('selected');
      layer.appendChild(c);
    });
  }

  function jumpToRoom(id) {
    var sec = document.getElementById(id);
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function roomDimLabel(room) {
    var w = pxToMm(room.body.w) / 1000, h = pxToMm(room.body.h) / 1000;
    return w.toFixed(1) + '×' + h.toFixed(1) + 'm approx';
  }
  function showTip(e, room) { if (!tipEl) return; tipEl.textContent = room.name + ' · ' + roomDimLabel(room); tipEl.style.display = 'block'; moveTip(e); }
  function moveTip(e) {
    if (!tipEl || !planEl) return;
    var r = planEl.getBoundingClientRect();
    tipEl.style.left = (e.clientX - r.left + 14) + 'px';
    tipEl.style.top = (e.clientY - r.top + 14) + 'px';
  }
  function hideTip() { if (tipEl) tipEl.style.display = 'none'; }

  function makePlaceholder(p) {
    var NS = FR.SVG_NS;
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'house-ph');
    var x = mmToPx(p.x), y = mmToPx(p.y), w = mmToPx(p.w), h = mmToPx(p.h);
    var rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x', x); rect.setAttribute('y', y);
    rect.setAttribute('width', w); rect.setAttribute('height', h);
    rect.setAttribute('rx', 2);
    g.appendChild(rect);
    var t = document.createElementNS(NS, 'text');
    t.setAttribute('x', x + w / 2); t.setAttribute('y', y + h / 2);
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central');
    t.textContent = p.label;
    g.appendChild(t);
    return g;
  }

  function makeHouseRoom(r) {
    var room = ROOMS()[r.id]; if (!room) return null;
    var NS = FR.SVG_NS;
    var fp = roomFootprintPx(room);
    var tx = mmToPx(r.x) - fp.x, ty = mmToPx(r.y) - fp.y;
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'house-room');
    g.setAttribute('data-room-id', r.id);
    g.setAttribute('transform', 'translate(' + tx + ' ' + ty + ')');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'link');
    g.setAttribute('aria-label', room.name + ' · 点击跳到方案');
    setSvgInner(g, FR.renderRoomInner(room));   // 复用渲染器(混合模式：结构化生成 / 旧 inner 回退)
    cloneFurnitureInto(g, r.id);
    g.addEventListener('click', function () { jumpToRoom(r.id); });
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jumpToRoom(r.id); } });
    g.addEventListener('mouseenter', function (e) { showTip(e, room); });
    g.addEventListener('mousemove', moveTip);
    g.addEventListener('mouseleave', hideTip);
    return g;
  }

  function renderTabSVG(tab) {
    var NS = FR.SVG_NS;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    function grow(x, y, w, h) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h); }
    tab.rooms.forEach(function (r) {
      var room = ROOMS()[r.id]; if (!room) return;
      var fp = roomFootprintPx(room);
      grow(mmToPx(r.x), mmToPx(r.y), fp.w, fp.h);
    });
    (tab.placeholders || []).forEach(function (p) { grow(mmToPx(p.x), mmToPx(p.y), mmToPx(p.w), mmToPx(p.h)); });
    if (minX === Infinity) { minX = 0; minY = 0; maxX = 100; maxY = 100; }
    var pad = 28;
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'house-svg');
    svg.setAttribute('viewBox', (minX - pad) + ' ' + (minY - pad) + ' ' + ((maxX - minX) + pad * 2) + ' ' + ((maxY - minY) + pad * 2));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    (tab.placeholders || []).forEach(function (p) { svg.appendChild(makePlaceholder(p)); });
    tab.rooms.forEach(function (r) { var g = makeHouseRoom(r); if (g) svg.appendChild(g); });
    return svg;
  }

  // ---- 家具层总开关 ----
  function furnitureVisible() {
    try { var v = localStorage.getItem(FURN_VIS_KEY); return v === null ? true : v === '1'; } catch (_) { return true; }
  }
  function applyFurnVisible(vis) { document.body.classList.toggle('furn-hidden', !vis); }
  function setFurnVisible(vis) { try { localStorage.setItem(FURN_VIS_KEY, vis ? '1' : '0'); } catch (_) {} applyFurnVisible(vis); }

  // ---- 拖动后由 interactions.js 调用，同步整屋图家具 ----
  root.refreshFloorRoom = function (roomId) {
    var groups = document.querySelectorAll('#house-plan .house-room[data-room-id="' + roomId + '"]');
    groups.forEach(function (g) { cloneFurnitureInto(g, roomId); });
  };

  root.initFloorPlan = function () {
    var plan = document.getElementById('house-plan');
    if (!plan) return;
    if (!root.FLOOR_LAYOUT || !root.ROOMS || !FR) { console.warn('[floorplan] 依赖缺失，跳过。'); return; }
    plan.classList.add('house-plan');
    plan.textContent = '';
    planEl = plan;

    var controls = document.createElement('div'); controls.className = 'house-controls';
    var tabsWrap = document.createElement('div'); tabsWrap.className = 'house-tabs';
    var stage = document.createElement('div'); stage.className = 'house-stage';

    root.FLOOR_LAYOUT.tabs.forEach(function (tab, idx) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'house-tab' + (idx === 0 ? ' active' : '');
      btn.textContent = tab.label;
      btn.dataset.tab = tab.id;
      btn.addEventListener('click', function () { activateTab(tab.id); });
      tabsWrap.appendChild(btn);

      var pane = document.createElement('div');
      pane.className = 'house-tabpane';
      pane.dataset.tab = tab.id;
      pane.style.display = idx === 0 ? 'block' : 'none';
      pane.appendChild(renderTabSVG(tab));
      stage.appendChild(pane);
    });

    var toggle = document.createElement('label');
    toggle.className = 'house-furn-toggle';
    var cb = document.createElement('input');
    cb.type = 'checkbox'; cb.checked = furnitureVisible();
    applyFurnVisible(cb.checked);
    cb.addEventListener('change', function () { setFurnVisible(cb.checked); });
    toggle.appendChild(cb);
    toggle.appendChild(document.createTextNode(' 显示家具'));

    controls.appendChild(tabsWrap);
    controls.appendChild(toggle);

    tipEl = document.createElement('div');
    tipEl.className = 'house-tip';
    tipEl.style.display = 'none';

    var note = document.createElement('div');
    note.className = 'house-note';
    note.textContent = "平面为示意·非按真实测绘（Sotheby's 原图标注 approximate / FOR VISUAL PURPOSE ONLY）。点房间跳到对应方案，悬停看尺寸。";

    plan.appendChild(controls);
    plan.appendChild(stage);
    plan.appendChild(tipEl);
    plan.appendChild(note);

    function activateTab(id) {
      [].forEach.call(tabsWrap.querySelectorAll('.house-tab'), function (b) { b.classList.toggle('active', b.dataset.tab === id); });
      [].forEach.call(stage.querySelectorAll('.house-tabpane'), function (p) { p.style.display = p.dataset.tab === id ? 'block' : 'none'; });
      hideTip();
    }

    console.log('[floorplan] 整屋图渲染完成：' + root.FLOOR_LAYOUT.tabs.length + ' 个 tab');
  };
})(typeof window !== 'undefined' ? window : globalThis);
