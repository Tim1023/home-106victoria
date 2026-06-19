/* 106 Victoria · 家具拖拽试摆交互 (Phase 2)
 * 依赖：window.ROOMS, window.FURNITURE(+TYPES, resolveFurnitureDims), window.FloorRenderer。
 * 由 boot.js 在房间渲染完成后调用 window.initFurniture()。
 *
 * 能力：每房一个家具托盘（点击放入房间中心，再拖动摆放）；pointer 拖拽重定位；
 *       90° 旋转 / 删除 / 方向键微调；AABB 碰撞（须在 body 内、不压子空间/固定家电/其它家具）；
 *       四向到墙净距实时复算（呼应床尾留空）；三态视觉；localStorage 持久化；按房重置。
 *
 * 坐标：家具活在房间 SVG 用户坐标系（同 walls，padding 35、60px/m）。
 *       屏幕→SVG 用 getScreenCTM().inverse()（自动含 viewBox 缩放 / meet 留白 / 页面滚动）。
 */
(function (root) {
  'use strict';

  var LS_KEY = 'v106_furniture_v3';   // v3：玄关定稿(3.8×5.2 + 楼梯西侧)，旧版拖拽记录会落到楼梯上，故作废重置
  var EPS = 0.4;                 // px 容差（贴靠不算压）
  var NUDGE_MM = 10, NUDGE_BIG_MM = 100;
  var GAP_OK = 1000, GAP_WARN = 700;   // mm 阈值：≥1.0m 绿 / 0.7–1.0m 黄 / <0.7m 红

  var FR = root.FloorRenderer;
  var selectedFurn = null;       // 当前选中的 <g class="furn">
  var drag = null;               // 拖拽状态

  function mmToPx(mm) { return FR.mmToPx(mm); }
  function pxToMm(px) { return FR.pxToMm(px); }
  function rooms() { return root.ROOMS || {}; }
  function furnitureOf(roomId) { return (root.FURNITURE || {})[roomId] || []; }

  // ---------- 坐标 ----------
  function clientToSvg(svg, cx, cy) {
    var ctm = svg.getScreenCTM();
    if (!ctm) return null;                 // display:none 等情况
    var pt = svg.createSVGPoint();
    pt.x = cx; pt.y = cy;
    var p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  // ---------- 几何 ----------
  function rectsOverlap(a, b) {
    return a.x + EPS < b.x + b.w && a.x + a.w - EPS > b.x &&
           a.y + EPS < b.y + b.h && a.y + a.h - EPS > b.y;
  }
  function rectContains(o, i) {
    return i.x >= o.x - EPS && i.y >= o.y - EPS &&
           i.x + i.w <= o.x + o.w + EPS && i.y + i.h <= o.y + o.h + EPS;
  }
  // 旋转后世界 AABB：绕中心旋转 → 中心不变，90/270 交换长宽（修复包围盒中心偏移 bug）
  function worldAABB(x, y, wPx, hPx, rot) {
    rot = ((rot % 360) + 360) % 360;
    var cx = x + wPx / 2, cy = y + hPx / 2;
    var W = wPx, H = hPx;
    if (rot === 90 || rot === 270) { W = hPx; H = wPx; }
    return { x: cx - W / 2, y: cy - H / 2, w: W, h: H };
  }
  function gAABB(g) {
    var wPx = mmToPx(+g.dataset.w), hPx = mmToPx(+g.dataset.d);
    return worldAABB(+g.dataset.x, +g.dataset.y, wPx, hPx, +g.dataset.rot);
  }

  // ---------- 碰撞 / 间距 ----------
  function checkFit(svg, g) {
    var room = rooms()[svg.dataset.roomId];
    if (!room) return true;
    var box = gAABB(g);
    if (!rectContains(room.body, box)) return false;            // 须在主房间内
    var i;
    for (i = 0; i < (room.subRooms || []).length; i++)          // 不压子空间
      if (rectsOverlap(box, room.subRooms[i])) return false;
    for (i = 0; i < (room.fixtures || []).length; i++)          // 不压固定家电
      if (rectsOverlap(box, room.fixtures[i])) return false;
    var others = svg.querySelectorAll('.furniture .furn');      // 不压其它家具
    for (i = 0; i < others.length; i++) {
      if (others[i] === g) continue;
      if (rectsOverlap(box, gAABB(others[i]))) return false;
    }
    return true;
  }
  function gapClass(mm) { return mm >= GAP_OK ? 'gap-ok' : (mm >= GAP_WARN ? 'gap-warn' : 'gap-bad'); }

  // ---------- 渲染家具 ----------
  function placeTransform(g) {
    var wPx = mmToPx(+g.dataset.w), hPx = mmToPx(+g.dataset.d);
    var rot = ((+g.dataset.rot % 360) + 360) % 360;
    g.setAttribute('transform',
      'translate(' + (+g.dataset.x) + ' ' + (+g.dataset.y) + ') rotate(' + rot + ' ' + (wPx / 2) + ' ' + (hPx / 2) + ')');
    var t = g.querySelector('.furn-label');               // 反旋转让文字保持正向
    if (t) t.setAttribute('transform', rot ? 'rotate(' + (-rot) + ' ' + (wPx / 2) + ' ' + (hPx / 2) + ')' : '');
  }
  function createFurnEl(item, dims, xPx, yPx, rot) {
    var NS = FR.SVG_NS;
    var wPx = mmToPx(dims.w), hPx = mmToPx(dims.d);
    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'furn');
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', 'button');
    g.setAttribute('aria-label', item.label + '，已放置');
    g.dataset.id = item.id; g.dataset.w = dims.w; g.dataset.d = dims.d;
    g.dataset.rot = rot || 0; g.dataset.x = xPx; g.dataset.y = yPx;
    var rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('class', 'furn-body');
    rect.setAttribute('x', 0); rect.setAttribute('y', 0);
    rect.setAttribute('width', wPx); rect.setAttribute('height', hPx);
    rect.setAttribute('rx', 2);
    var t = document.createElementNS(NS, 'text');
    t.setAttribute('class', 'furn-label');
    t.setAttribute('x', wPx / 2); t.setAttribute('y', hPx / 2);
    t.setAttribute('text-anchor', 'middle');
    t.setAttribute('dominant-baseline', 'central');
    t.textContent = item.label;
    g.appendChild(rect); g.appendChild(t);
    placeTransform(g);
    return g;
  }
  function paintState(g, fits) {
    g.classList.toggle('bad', !fits);
    g.setAttribute('aria-label', g.dataset.id + (fits ? '，已放置' : '，放不下（越界或重叠）'));
  }

  // ---------- 间距标注 ----------
  function gapsLayer(svg) {
    var layer = svg.querySelector('.furn-gaps');
    if (!layer) {
      layer = document.createElementNS(FR.SVG_NS, 'g');
      layer.setAttribute('class', 'furn-gaps');
      svg.appendChild(layer);
    }
    return layer;
  }
  function clearGaps(svg) { if (svg) { var l = svg.querySelector('.furn-gaps'); if (l) l.textContent = ''; } }
  function drawGaps(svg, g) {
    var layer = gapsLayer(svg);
    layer.textContent = '';
    if (!g || g !== selectedFurn) return;
    var room = rooms()[svg.dataset.roomId]; if (!room) return;
    var b = room.body, box = gAABB(g), NS = FR.SVG_NS;
    var sides = [
      { mm: pxToMm(box.y - b.y),                   x1: box.x + box.w / 2, y1: box.y,            x2: box.x + box.w / 2, y2: b.y },
      { mm: pxToMm((b.y + b.h) - (box.y + box.h)), x1: box.x + box.w / 2, y1: box.y + box.h,    x2: box.x + box.w / 2, y2: b.y + b.h },
      { mm: pxToMm(box.x - b.x),                   x1: box.x,             y1: box.y + box.h / 2, x2: b.x,             y2: box.y + box.h / 2 },
      { mm: pxToMm((b.x + b.w) - (box.x + box.w)), x1: box.x + box.w,     y1: box.y + box.h / 2, x2: b.x + b.w,       y2: box.y + box.h / 2 }
    ];
    sides.forEach(function (s) {
      if (s.mm <= 30) return;                       // 几乎贴墙的不标
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', s.x1); line.setAttribute('y1', s.y1);
      line.setAttribute('x2', s.x2); line.setAttribute('y2', s.y2);
      line.setAttribute('class', 'gap-line');
      layer.appendChild(line);
      var tx = document.createElementNS(NS, 'text');
      tx.setAttribute('x', (s.x1 + s.x2) / 2); tx.setAttribute('y', (s.y1 + s.y2) / 2);
      tx.setAttribute('text-anchor', 'middle'); tx.setAttribute('dominant-baseline', 'central');
      tx.setAttribute('class', 'gap-text ' + gapClass(s.mm));
      tx.textContent = (s.mm / 1000).toFixed(2) + 'm';
      layer.appendChild(tx);
    });
  }

  // ---------- 选择 ----------
  function selectFurn(g) {
    if (selectedFurn && selectedFurn !== g) {
      selectedFurn.classList.remove('selected');
      var prevSvg = selectedFurn.closest('svg.svg-room');
      if (prevSvg) clearGaps(prevSvg);
    }
    selectedFurn = g;
    if (g) {
      g.classList.add('selected');
      var svg = g.closest('svg.svg-room');
      drawGaps(svg, g);
      try { g.focus({ preventScroll: true }); } catch (e) { try { g.focus(); } catch (e2) {} }
    }
  }
  function deselect() {
    if (!selectedFurn) return;
    var svg = selectedFurn.closest('svg.svg-room');
    selectedFurn.classList.remove('selected');
    selectedFurn = null;
    if (svg) clearGaps(svg);
  }

  // ---------- 拖拽 ----------
  function attachFurn(g, svg) {
    g.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      selectFurn(g);
      try { g.setPointerCapture(e.pointerId); } catch (_) {}
      var p = clientToSvg(svg, e.clientX, e.clientY);
      if (!p) return;
      drag = { g: g, svg: svg, pid: e.pointerId, offX: p.x - (+g.dataset.x), offY: p.y - (+g.dataset.y) };
    });
    g.addEventListener('keydown', function (e) { onFurnKey(e, g, svg); });
  }
  function onDocMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var p = clientToSvg(drag.svg, e.clientX, e.clientY);
    if (!p) return;
    drag.g.dataset.x = p.x - drag.offX;
    drag.g.dataset.y = p.y - drag.offY;
    placeTransform(drag.g);
    paintState(drag.g, checkFit(drag.svg, drag.g));
    drawGaps(drag.svg, drag.g);
  }
  function onDocUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var g = drag.g, svg = drag.svg;
    try { g.releasePointerCapture(e.pointerId); } catch (_) {}
    drag = null;
    paintState(g, checkFit(svg, g));
    drawGaps(svg, g);
    persist(svg);
  }

  function onFurnKey(e, g, svg) {
    var step = mmToPx(e.shiftKey ? NUDGE_BIG_MM : NUDGE_MM), handled = true;
    switch (e.key) {
      case 'ArrowLeft':  g.dataset.x = (+g.dataset.x) - step; break;
      case 'ArrowRight': g.dataset.x = (+g.dataset.x) + step; break;
      case 'ArrowUp':    g.dataset.y = (+g.dataset.y) - step; break;
      case 'ArrowDown':  g.dataset.y = (+g.dataset.y) + step; break;
      case 'r': case 'R': g.dataset.rot = ((+g.dataset.rot) + 90) % 360; break;
      case 'Delete': case 'Backspace': removeFurn(g, svg); return e.preventDefault();
      case 'Escape': deselect(); return;
      default: handled = false;
    }
    if (!handled) return;
    e.preventDefault();
    placeTransform(g);
    paintState(g, checkFit(svg, g));
    drawGaps(svg, g);
    persist(svg);
  }

  function rotateSelected() {
    if (!selectedFurn) return;
    var svg = selectedFurn.closest('svg.svg-room');
    selectedFurn.dataset.rot = ((+selectedFurn.dataset.rot) + 90) % 360;
    placeTransform(selectedFurn);
    paintState(selectedFurn, checkFit(svg, selectedFurn));
    drawGaps(svg, selectedFurn);
    persist(svg);
  }
  function removeFurn(g, svg) {
    svg = svg || g.closest('svg.svg-room');
    if (selectedFurn === g) selectedFurn = null;
    g.remove();
    clearGaps(svg);
    persist(svg);
  }
  function deleteSelected() {
    if (selectedFurn) removeFurn(selectedFurn, selectedFurn.closest('svg.svg-room'));
  }

  // ---------- 放置 ----------
  function placeItem(svg, item, xPx, yPx, rot, select) {
    var dims = root.resolveFurnitureDims(item);
    var g = createFurnEl(item, dims, xPx, yPx, rot || 0);
    svg.querySelector('.furniture').appendChild(g);
    attachFurn(g, svg);
    paintState(g, checkFit(svg, g));
    if (select) selectFurn(g);
    return g;
  }
  function placeAtCenter(svg, item) {
    var room = rooms()[svg.dataset.roomId]; if (!room) return;
    var dims = root.resolveFurnitureDims(item);
    var wPx = mmToPx(dims.w), hPx = mmToPx(dims.d);
    var cx = room.body.x + room.body.w / 2, cy = room.body.y + room.body.h / 2;
    placeItem(svg, item, cx - wPx / 2, cy - hPx / 2, 0, true);
    persist(svg);
  }

  // ---------- localStorage ----------
  function loadStore() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || { version: 1, rooms: {} }; }
    catch (_) { return { version: 1, rooms: {} }; }
  }
  function saveStore(store) { try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch (_) {} }
  function persist(svg) {
    var roomId = svg.dataset.roomId, room = rooms()[roomId]; if (!room) return;
    var store = loadStore();
    store.rooms[roomId] = [].map.call(svg.querySelectorAll('.furniture .furn'), function (g) {
      return {
        id: g.dataset.id,
        xMm: Math.round(pxToMm((+g.dataset.x) - room.body.x)),   // 存房间相对 mm，不存 px
        yMm: Math.round(pxToMm((+g.dataset.y) - room.body.y)),
        rot: +g.dataset.rot
      };
    });
    saveStore(store);
    if (root.refreshFloorRoom) root.refreshFloorRoom(roomId);   // 同步整屋图家具快照
  }
  function restore(svg) {
    var roomId = svg.dataset.roomId, room = rooms()[roomId]; if (!room) return;
    var items = furnitureOf(roomId);
    var list = loadStore().rooms[roomId];
    if (!list || !list.length) {                              // 无用户记录 → 按 defaultPos 首次自动布局
      items.forEach(function (item) {
        if (!item.defaultPos) return;
        var poses = item.defaultPos.length !== undefined ? item.defaultPos : [item.defaultPos];
        poses.forEach(function (dp) {
          var x = room.body.x + mmToPx(dp.xMm), y = room.body.y + mmToPx(dp.yMm);
          placeItem(svg, item, x, y, dp.rot || 0, false);
        });
      });
      return;
    }
    list.forEach(function (rec) {                             // 有用户记录 → 恢复用户摆放
      var item = items.filter(function (i) { return i.id === rec.id; })[0];
      if (!item) return;
      var x = room.body.x + mmToPx(rec.xMm), y = room.body.y + mmToPx(rec.yMm);
      placeItem(svg, item, x, y, rec.rot || 0, false);
    });
  }
  function clearRoom(svg) {
    if (!root.confirm || root.confirm('恢复本房间默认布局？（将清除你的手动调整）')) {
      var fl = svg.querySelector('.furniture'); if (fl) fl.textContent = '';
      clearGaps(svg);
      if (selectedFurn && selectedFurn.closest('svg.svg-room') === svg) selectedFurn = null;
      var store = loadStore(); delete store.rooms[svg.dataset.roomId]; saveStore(store);
      restore(svg);                                            // 清除后重新摆回 defaultPos 默认布局
    }
  }

  // ---------- 托盘 UI ----------
  function fmtDim(dims) { return (dims.w / 1000).toFixed(2) + '×' + (dims.d / 1000).toFixed(2) + 'm'; }

  function buildTray(svg) {
    var roomId = svg.dataset.roomId;
    var items = furnitureOf(roomId);
    if (!items.length) return;
    var content = svg.closest('.room-content'); if (!content) return;
    if (content.querySelector('.furn-tray')) return;            // 防重复

    var tray = document.createElement('div');
    tray.className = 'furn-tray';

    var head = document.createElement('div');
    head.className = 'furn-tray-head';
    head.innerHTML = '<span>试摆家具 · 点击放入房间中心，再拖动摆放</span>';
    var reset = document.createElement('button');
    reset.type = 'button'; reset.className = 'furn-reset'; reset.textContent = '恢复默认布局';
    reset.addEventListener('click', function () { clearRoom(svg); });
    head.appendChild(reset);

    var itemsWrap = document.createElement('div');
    itemsWrap.className = 'furn-tray-items';
    items.forEach(function (item) {
      var dims = root.resolveFurnitureDims(item);
      var btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'tray-item';
      btn.innerHTML = '<span class="ti-icon">' + dims.icon + '</span>' +
        '<span class="ti-name"></span>' +
        '<span class="ti-dim">' + fmtDim(dims) + '</span>' +
        (dims.src === 'real' ? '' : '<span class="ti-src">默认</span>');
      btn.querySelector('.ti-name').textContent = item.label;
      btn.addEventListener('click', function () { placeAtCenter(svg, item); });
      itemsWrap.appendChild(btn);
    });

    var actions = document.createElement('div');
    actions.className = 'furn-tray-actions';
    var rot = document.createElement('button');
    rot.type = 'button'; rot.className = 'furn-rotate'; rot.textContent = '↻ 旋转选中';
    rot.addEventListener('click', rotateSelected);
    var del = document.createElement('button');
    del.type = 'button'; del.className = 'furn-del'; del.textContent = '🗑 删除选中';
    del.addEventListener('click', deleteSelected);
    var hint = document.createElement('span');
    hint.className = 'furn-hint'; hint.textContent = '拖动移位 · R 旋转 · 方向键微调(Shift 大步) · Delete 删除';
    actions.appendChild(rot); actions.appendChild(del); actions.appendChild(hint);

    tray.appendChild(head); tray.appendChild(itemsWrap); tray.appendChild(actions);

    var wrap = svg.parentNode;                                  // svg 外层 .fp-zoom 风格容器
    if (wrap && wrap.parentNode) wrap.parentNode.insertBefore(tray, wrap.nextSibling);
    else content.appendChild(tray);
  }

  // ---------- 初始化（由 boot.js 调用） ----------
  root.initFurniture = function () {
    if (!root.ROOMS || !root.FURNITURE || !FR) { console.warn('[furniture] 依赖缺失，跳过。'); return; }
    document.addEventListener('pointermove', onDocMove);
    document.addEventListener('pointerup', onDocUp);
    document.addEventListener('pointercancel', onDocUp);
    document.addEventListener('click', function (e) {            // 点空白处取消选中
      if (e.target.closest('.furn') || e.target.closest('.furn-tray')) return;
      deselect();
    });
    var svgs = document.querySelectorAll('svg.svg-room[data-room-id]');
    var trays = 0;
    svgs.forEach(function (svg) {
      gapsLayer(svg);
      var before = svg.closest('.room-content') && svg.closest('.room-content').querySelector('.furn-tray');
      buildTray(svg);
      if (!before && svg.closest('.room-content') && svg.closest('.room-content').querySelector('.furn-tray')) trays++;
      restore(svg);
    });
    console.log('[furniture] 初始化完成：托盘 ' + trays + ' 个 / 房间 ' + svgs.length);
  };
})(typeof window !== 'undefined' ? window : globalThis);
