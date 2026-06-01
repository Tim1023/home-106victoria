/* 106 Victoria · 启动器 (Phase 1)
 * 渐进增强：DOMContentLoaded 后，把每个带 data-room-id 的占位 <svg> 用数据重新渲染。
 * 任何一处出错都只跳过该房间、保留其原静态 SVG，绝不让页面整体回归。
 * Phase 2/3 会在这里追加家具交互、整屋图的初始化挂钩。
 */
(function (root) {
  'use strict';

  function initRooms() {
    var R = root.ROOMS, FR = root.FloorRenderer;
    if (!R || !FR) {
      console.warn('[boot] 缺少 ROOMS 或 FloorRenderer，保留静态 SVG。');
      return;
    }
    var nodes = document.querySelectorAll('svg.svg-room[data-room-id]');
    var ok = 0, skip = 0;
    nodes.forEach(function (svg) {
      var id = svg.getAttribute('data-room-id');
      var room = R[id];
      if (!room) { skip++; console.warn('[boot] 未找到房间数据，保留静态图:', id); return; }
      try {
        FR.mountRoom(svg, room);
        ok++;
      } catch (e) {
        skip++;
        console.error('[boot] 渲染失败，保留静态图:', id, e);
      }
    });
    console.log('[boot] 房间渲染完成：成功 ' + ok + ' · 跳过 ' + skip + ' / 共 ' + nodes.length);

    // 供 Phase 2/3 串接的初始化钩子（此刻可能尚未定义）
    if (typeof root.initFurniture === 'function') {
      try { root.initFurniture(); } catch (e) { console.error('[boot] initFurniture 失败:', e); }
    }
    if (typeof root.initFloorPlan === 'function') {
      try { root.initFloorPlan(); } catch (e) { console.error('[boot] initFloorPlan 失败:', e); }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRooms);
  } else {
    initRooms();
  }
})(typeof window !== 'undefined' ? window : globalThis);
