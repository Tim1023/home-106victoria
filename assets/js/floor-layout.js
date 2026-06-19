/* 106 Victoria · 整屋平面布局表 (Phase 3)
 * window.FLOOR_LAYOUT：每个房间在整屋统一坐标系中的落点（body/content 左上角，单位 mm）。
 * 三个 tab 分组——因卧室区是二楼独立 wing、泳池房是 detached building，硬拼一张会误导：
 *   ground   一楼主屋：kitchen-dining / dining / living / study / lounge / foyer(玄关+楼梯)（+ Laundry/Garage 灰块占位）
 *   upstairs 二楼卧室：master(含 walk-in+bath) / bedroom-2 / bedroom-3 / bedroom-4（+ 家庭浴室/小卧 灰块）
 *   pool     泳池房：pool-house(含 toilet)
 * ⚠ offset 为人工从 full-floor-plan.jpg 目测的近似值（jpg 本身标注 approximate / FOR VISUAL PURPOSE ONLY），
 *   仅示意相对位置、非测绘。房间尺寸本身是准确的（来自 rooms-data 的真实 mm）。
 * rooms[].x/y = 该房间「局部内容左上角」(≈local 35,35) 在整屋 mm 网格中的位置；渲染时换算 px=mm×0.06。
 */
(function (root) {
  'use strict';

  var FLOOR_LAYOUT = {
    tabs: [
      {
        id: 'ground',
        label: '一楼主屋',
        rooms: [
          { id: 'kitchen-dining', x: 0,    y: 0 },
          { id: 'dining',         x: 4500, y: 1500 },
          { id: 'living',         x: 9400, y: 1800 },
          { id: 'study',          x: 300,  y: 8200 },
          { id: 'lounge',         x: 5000, y: 6000 },
          { id: 'foyer',          x: 3200, y: 7400 }
        ],
        placeholders: [
          { x: 4500, y: 5800,  w: 3000, h: 2100, label: 'Laundry' },
          { x: 5200, y: 13200, w: 6400, h: 6800, label: 'Garage' }
        ]
      },
      {
        id: 'upstairs',
        label: '二楼卧室',
        rooms: [
          { id: 'bedroom-2', x: 2500,  y: 0 },
          { id: 'master',    x: 7300,  y: 0 },
          { id: 'bedroom-3', x: 2500,  y: 4400 },
          { id: 'bedroom-4', x: 10600, y: 6000 }
        ],
        placeholders: [
          { x: 0,    y: 200,  w: 2200, h: 3600, label: 'Bathroom' },
          { x: 7300, y: 6100, w: 2900, h: 3400, label: '卧室' }
        ]
      },
      {
        id: 'pool',
        label: '泳池房',
        rooms: [
          { id: 'pool-house', x: 0, y: 0 }
        ],
        placeholders: []
      }
    ]
  };

  root.FLOOR_LAYOUT = FLOOR_LAYOUT;
})(typeof window !== 'undefined' ? window : globalThis);
