/* 106 Victoria · 房间渲染器 (Phase 1 + 几何修正)
 * window.FloorRenderer：把 window.ROOMS 的数据渲染成 <svg>。
 * 唯一缩放常量 PX_PER_M = 60（1 米 = 60 个 SVG 单位）。
 *
 * 混合模式：
 *   - 房间含结构化几何 `outline` → 由 build* 生成各图层（门弧/窗双线/洁具数学只写一次）。
 *   - 否则回退用旧的 `inner` 原始字符串（尚未迁移的房间仍正常渲染、零回归）。
 *
 * 坐标：数据→渲染用解析式（本文件）；屏幕→数据用 getScreenCTM().inverse()（interactions.js）。
 */
(function (root) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var PX_PER_M = 60;
  var PX_PER_MM = PX_PER_M / 1000;   // 0.06
  var MM_PER_PX = 1000 / PX_PER_M;   // 16.666…
  var PAD = 35;                      // 墙体 padding

  function mmToPx(mm) { return mm * PX_PER_MM; }
  function pxToMm(px) { return px * MM_PER_PX; }
  function n(v) { return Math.round(v * 100) / 100; }   // 收敛小数

  // ---------- 墙体 ----------
  function buildWalls(room) {
    var s = '', o = room.outline;
    if (Array.isArray(o)) {
      s += '<polygon points="' + o.map(function (p) { return n(p[0]) + ',' + n(p[1]); }).join(' ') +
        '" fill="#c6d0c5" stroke="#1a1a1a" stroke-width="3"/>';
    } else {
      s += '<rect x="' + o.x + '" y="' + o.y + '" width="' + o.w + '" height="' + o.h +
        '" fill="#c6d0c5" stroke="#1a1a1a" stroke-width="3"/>';
    }
    (room.subRooms || []).forEach(function (r) {
      s += '<rect x="' + r.x + '" y="' + r.y + '" width="' + r.w + '" height="' + r.h +
        '" fill="#b5c5b3" stroke="#1a1a1a" stroke-width="2"/>';
    });
    return s;
  }

  // 取某 rect 某面墙的几何：起点 + 沿墙单位向量(dx,dy) + 朝室内法线(nx,ny) + 墙长
  function wallGeom(rect, wall) {
    var x = rect.x, y = rect.y, w = rect.w, h = rect.h;
    if (wall === 'N') return { ox: x, oy: y,     dx: 1, dy: 0, nx: 0, ny: 1,  len: w };
    if (wall === 'S') return { ox: x, oy: y + h, dx: 1, dy: 0, nx: 0, ny: -1, len: w };
    if (wall === 'W') return { ox: x, oy: y,     dx: 0, dy: 1, nx: 1, ny: 0,  len: h };
    /* E */            return { ox: x + w, oy: y, dx: 0, dy: 1, nx: -1, ny: 0, len: h };
  }
  function openingRect(room, spec) { return spec.rect || room.outline; }

  // ---------- 门（白口 + 弧）----------
  function buildDoor(rect, d) {
    var g = wallGeom(rect, d.wall);
    var off = mmToPx(d.offsetMm), wid = mmToPx(d.widthMm);
    var sx = g.ox + g.dx * off, sy = g.oy + g.dy * off;
    var ex = sx + g.dx * wid, ey = sy + g.dy * wid;
    var hingeStart = d.hinge !== 'end';
    var hx = hingeStart ? sx : ex, hy = hingeStart ? sy : ey;   // 铰链端
    var fx = hingeStart ? ex : sx, fy = hingeStart ? ey : sy;   // 自由端(关门)
    var r = wid;
    var ox = hx + g.nx * r, oy = hy + g.ny * r;                 // 自由端(开门，垂直入室)
    var cross = (fx - hx) * (oy - hy) - (fy - hy) * (ox - hx);  // 叉积定 sweep（y 向下）
    var sweep = cross > 0 ? 0 : 1;
    return '<line x1="' + n(sx) + '" y1="' + n(sy) + '" x2="' + n(ex) + '" y2="' + n(ey) + '" stroke="#fff" stroke-width="5"/>' +
      '<path d="M' + n(fx) + ',' + n(fy) + ' A' + n(r) + ',' + n(r) + ' 0 0,' + sweep + ' ' + n(ox) + ',' + n(oy) + '" fill="none" stroke="#1a1a1a" stroke-width="0.7"/>';
  }

  // ---------- 窗（白口 + 两条平行细线 ±3px）----------
  function buildWindow(rect, w) {
    var g = wallGeom(rect, w.wall);
    var off = mmToPx(w.offsetMm), wid = mmToPx(w.widthMm);
    var sx = g.ox + g.dx * off, sy = g.oy + g.dy * off;
    var ex = sx + g.dx * wid, ey = sy + g.dy * wid;
    var px = g.nx * 3, py = g.ny * 3;   // 沿法线 ±3
    return '<line x1="' + n(sx) + '" y1="' + n(sy) + '" x2="' + n(ex) + '" y2="' + n(ey) + '" stroke="#fff" stroke-width="6"/>' +
      '<line x1="' + n(sx + px) + '" y1="' + n(sy + py) + '" x2="' + n(ex + px) + '" y2="' + n(ey + py) + '" stroke="#1a1a1a" stroke-width="1.5"/>' +
      '<line x1="' + n(sx - px) + '" y1="' + n(sy - py) + '" x2="' + n(ex - px) + '" y2="' + n(ey - py) + '" stroke="#1a1a1a" stroke-width="1.5"/>';
  }

  function buildOpenings(room) {
    var s = '';
    (room.doors || []).forEach(function (d) { s += buildDoor(openingRect(room, d), d); });
    (room.windows || []).forEach(function (w) { s += buildWindow(openingRect(room, w), w); });
    return s;
  }

  // ---------- 固定家具（rect + kind 细节）----------
  function fixtureGlyph(f) {
    var cx = f.x + f.w / 2, cy = f.y + f.h / 2, s = '';
    if (f.kind === 'cooktop') {
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) {
        s += '<circle cx="' + n(cx + q[0] * f.w / 4) + '" cy="' + n(cy + q[1] * f.h / 4) + '" r="' + n(Math.min(f.w, f.h) / 7) + '" fill="none" stroke="#1a1a1a" stroke-width="1"/>';
      });
    } else if (f.kind === 'sink' || f.kind === 'basin') {
      s += '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(f.w / 3) + '" ry="' + n(f.h / 3) + '" fill="none" stroke="#1a1a1a" stroke-width="1"/>';
    } else if (f.kind === 'shower') {
      s += '<line x1="' + f.x + '" y1="' + f.y + '" x2="' + (f.x + f.w) + '" y2="' + (f.y + f.h) + '" stroke="#1a1a1a" stroke-width="0.8"/>' +
           '<line x1="' + (f.x + f.w) + '" y1="' + f.y + '" x2="' + f.x + '" y2="' + (f.y + f.h) + '" stroke="#1a1a1a" stroke-width="0.8"/>';
    } else if (f.kind === 'toilet') {
      s += '<ellipse cx="' + n(cx) + '" cy="' + n(cy + f.h / 8) + '" rx="' + n(f.w / 3) + '" ry="' + n(f.h / 3) + '" fill="none" stroke="#1a1a1a" stroke-width="1"/>';
    } else if (f.kind === 'stairs') {
      var steps = Math.max(4, Math.round(f.h / 16));               // 踏步线（约每 16px 一级）
      var curved = 2;                                              // 底部 N 级为弧形（bullnose）踏步
      for (var i = 1; i < steps; i++) {
        var yy = f.y + f.h * i / steps;
        if (i >= steps - curved) {                                 // 底部弧形踏步：踏步沿向下(南)外凸
          var bulge = (i - (steps - curved - 1)) * 7;
          s += '<path d="M' + n(f.x) + ',' + n(yy) + ' Q' + n(f.x + f.w / 2) + ',' + n(yy + bulge) + ' ' + n(f.x + f.w) + ',' + n(yy) + '" fill="none" stroke="#1a1a1a" stroke-width="0.8"/>';
        } else {
          s += '<line x1="' + n(f.x) + '" y1="' + n(yy) + '" x2="' + n(f.x + f.w) + '" y2="' + n(yy) + '" stroke="#1a1a1a" stroke-width="0.8"/>';
        }
      }
      s += '<path d="M' + n(cx) + ',' + n(f.y + f.h * 0.6) + ' L' + n(cx) + ',' + n(f.y + 8) + ' M' + n(cx - 4) + ',' + n(f.y + 15) + ' L' + n(cx) + ',' + n(f.y + 8) + ' L' + n(cx + 4) + ',' + n(f.y + 15) + '" fill="none" stroke="#1a1a1a" stroke-width="1"/>';   // 上行箭头
    }
    return s;
  }
  function buildFixtures(room) {
    return (room.fixtures || []).map(function (f) {
      return '<rect x="' + f.x + '" y="' + f.y + '" width="' + f.w + '" height="' + f.h +
        '" fill="#bdb39c" stroke="#1a1a1a" stroke-width="1"/>' + fixtureGlyph(f);
    }).join('');
  }

  // ---------- 尺寸标注 + 房名 ----------
  function buildDims(room) {
    return (room.dims || []).map(function (d) {
      var attrs = 'x="' + d.x + '" y="' + d.y + '" text-anchor="' + (d.anchor || 'middle') + '"';
      if (d.rot) attrs += ' transform="rotate(' + d.rot + ' ' + d.x + ' ' + d.y + ')"';
      if (d.serif) attrs += ' font-family="Cormorant Garamond,serif" font-size="' + (d.size || 11) + '" fill="#1a1a1a" font-weight="500"';
      else if (d.small) attrs += ' font-family="-apple-system" font-size="' + (d.size || 9) + '" fill="#6b6253"';
      return '<text ' + attrs + '>' + d.text + '</text>';
    }).join('');
  }
  function buildLabel(room) {
    var l = room.labelPos || {};
    return '<text x="' + l.x + '" y="' + l.y + '" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="' +
      (room.labelSize || 16) + '" fill="#1a1a1a" font-weight="500" style="paint-order:stroke;stroke:#fffffff0;stroke-width:3">' +
      (room.label || room.name || '') + '</text>';
  }

  // ---------- 拼装 ----------
  function outlineBBox(o) {
    if (Array.isArray(o)) {
      var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      o.forEach(function (p) { minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]); maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]); });
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    return { x: o.x, y: o.y, w: o.w, h: o.h };
  }
  function autoViewBox(room) {
    var b = outlineBBox(room.outline);
    var maxX = b.x + b.w, maxY = b.y + b.h;
    (room.subRooms || []).concat(room.fixtures || []).forEach(function (r) {
      maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h);
    });
    return '0 0 ' + (Math.round(maxX) + PAD) + ' ' + (Math.round(maxY) + PAD);
  }

  function renderRoomInner(room) {
    if (!room.outline) return room.inner || '';   // 未迁移：回退旧字符串
    return '<g class="walls">' + buildWalls(room) + '</g>' +
      '<g class="fixtures">' + buildFixtures(room) + '</g>' +
      '<g class="openings">' + buildOpenings(room) + '</g>' +
      '<g class="dims" font-family="JetBrains Mono,monospace" font-size="11" fill="#6b6253">' + buildDims(room) + '</g>' +
      '<g class="labels">' + buildLabel(room) + '</g>' +
      '<g class="furniture"></g>';
  }
  function renderRoomSVG(room) {
    var vb = room.outline ? autoViewBox(room) : room.viewBox;
    return '<svg class="svg-room" data-room-id="' + room.id + '" viewBox="' + vb +
      '" xmlns="' + SVG_NS + '" preserveAspectRatio="xMidYMid meet">' + renderRoomInner(room) + '</svg>';
  }

  function svgStringToElement(svgString) {
    var tpl = document.createElement('template');
    tpl.innerHTML = svgString.trim();
    return tpl.content.firstElementChild;
  }
  function mountRoom(placeholderSvg, room) {
    var el = svgStringToElement(renderRoomSVG(room));
    if (!el || el.tagName.toLowerCase() !== 'svg') throw new Error('renderRoomSVG 未产出有效 <svg>: ' + room.id);
    placeholderSvg.replaceWith(el);
    return el;
  }

  root.FloorRenderer = {
    SVG_NS: SVG_NS, PX_PER_M: PX_PER_M, PX_PER_MM: PX_PER_MM, MM_PER_PX: MM_PER_PX, PAD: PAD,
    mmToPx: mmToPx, pxToMm: pxToMm,
    buildWalls: buildWalls, buildOpenings: buildOpenings, buildDoor: buildDoor, buildWindow: buildWindow,
    buildFixtures: buildFixtures, wallGeom: wallGeom,
    renderRoomInner: renderRoomInner, renderRoomSVG: renderRoomSVG,
    svgStringToElement: svgStringToElement, mountRoom: mountRoom
  };
})(typeof window !== 'undefined' ? window : globalThis);
