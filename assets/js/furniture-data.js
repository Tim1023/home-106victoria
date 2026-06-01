/* 106 Victoria · 家具数据 (Phase 2)
 * window.FURNITURE_TYPES：每种家具类型的默认俯视占地 [w 宽, d 深] mm（缺真实尺寸时回退用）。
 * window.FURNITURE：每个房间可摆放的单品列表，全部取自 plans.html 已列候选单品。
 *   - 只有 Master 的 Kelly / Yume 两张床有页面给出的真实 mm（sizeSource:'real'）；
 *   - 其余按类型默认尺寸（sizeSource 默认 'typical'，UI 标注「默认」）；
 *   - 个别给了 w/d 的是按该单品形态估的更贴近值，仍属 typical。
 * 次卧通用候选（来自 plans.html #bedroom-candidates 共享段，标注「Bedroom 2/3 通用」）分配到 bedroom-2/3/4。
 * Kitchen/Dining 页面无候选单品 → 无托盘。
 */
(function (root) {
  'use strict';

  var TYPES = {
    bed_king:          { w: 1830, d: 2120, icon: '🛏' },
    bed_queen:         { w: 1530, d: 2120, icon: '🛏' },
    sofa_3:            { w: 2100, d: 900,  icon: '🛋' },
    sofa_2:            { w: 1700, d: 850,  icon: '🛋' },
    modular_sofa:      { w: 2600, d: 1600, icon: '🛋' },
    lounge_chair:      { w: 850,  d: 850,  icon: '🪑' },
    dining_chair:      { w: 560,  d: 540,  icon: '🪑' },
    dining_table_rect: { w: 2000, d: 1000, icon: '🍽' },
    dining_table_round:{ w: 1300, d: 1300, icon: '🍽' },
    coffee_table:      { w: 1200, d: 600,  icon: '▭' },
    desk:              { w: 1600, d: 800,  icon: '🗄' },
    chest_drawers:     { w: 1000, d: 500,  icon: '🗄' },
    wall_unit:         { w: 1800, d: 450,  icon: '🗄' },
    floor_lamp:        { w: 450,  d: 450,  icon: '💡' }
  };

  // 次卧通用候选（共享）
  var BEDROOM_SHARED = [
    { id: 'mogensen-chest', label: 'Mogensen 五斗柜', type: 'chest_drawers' },
    { id: 'teak-chest',     label: '丹麦柚木五斗柜', type: 'chest_drawers' },
    { id: 'cado-wall',      label: 'Cado 墙柜',      type: 'wall_unit' },
    { id: 'series7',        label: 'Series 7 椅',    type: 'dining_chair' }
  ];

  var FURNITURE = {
    'dining': [
      { id: 'maria-table',  label: 'Maria 餐桌',  type: 'dining_table_rect' },
      { id: 'wegner-chair', label: 'The Chair',    type: 'dining_chair' },
      { id: 'kai-chair',    label: 'Universe 301', type: 'dining_chair' }
    ],
    'lounge': [
      { id: 'camaleonda',     label: 'Camaleonda 沙发',    type: 'modular_sofa' },
      { id: 'florence-knoll', label: 'Florence Knoll 沙发', type: 'sofa_3', w: 2030, d: 800 },
      { id: 'papa-bear',      label: 'Papa Bear 椅',        type: 'lounge_chair', w: 920, d: 900 },
      { id: 'hvidt-ax',       label: 'Hvidt Ax 椅',         type: 'lounge_chair', w: 720, d: 780 },
      { id: 'scarpa-771',     label: 'Scarpa 771 咖啡桌',   type: 'coffee_table' },
      { id: 'arco',           label: 'Arco 落地灯',         type: 'floor_lamp' }
    ],
    'living': [
      { id: 'wanscher-senator', label: 'Senator 沙发',     type: 'sofa_3', w: 2000, d: 800 },
      { id: 'grete-jalk-118',   label: 'Grete Jalk 118 沙发', type: 'sofa_2' }
    ],
    'study': [
      { id: 'omann-desk',      label: 'Omann 书桌',     type: 'desk' },
      { id: 'jeanneret-desk',  label: 'Jeanneret 书桌', type: 'desk', w: 1400, d: 750 },
      { id: 'papa-bear-study', label: 'Papa Bear 阅读椅', type: 'lounge_chair', w: 920, d: 900 }
    ],
    'master': [
      { id: 'kelly',  label: 'Kelly Bed',     type: 'bed_king', w: 1970, d: 2300, sizeSource: 'real' },
      { id: 'yume',   label: 'Yume Bed',      type: 'bed_king', w: 2160, d: 2880, sizeSource: 'real' },
      { id: 'selene', label: 'Maxalto Selene 床', type: 'bed_king' },
      { id: 'husk',   label: 'B&B Husk 床',    type: 'bed_king' }
    ],
    'bedroom-2': BEDROOM_SHARED.slice(),
    'bedroom-3': BEDROOM_SHARED.slice(),
    'bedroom-4': [
      { id: 'mogensen-chest', label: 'Mogensen 五斗柜', type: 'chest_drawers' },
      { id: 'cado-wall',      label: 'Cado 墙柜',       type: 'wall_unit' }
    ],
    'pool-house': [
      { id: 'trubridge-sling', label: 'Sling Recliner', type: 'lounge_chair', w: 700, d: 1300 },
      { id: 'nz-rocking',      label: 'Plywood 摇椅',    type: 'lounge_chair', w: 600, d: 900 },
      { id: 'paulin-tongue',   label: 'Tongue F577',     type: 'lounge_chair', w: 900, d: 850 }
    ]
  };

  // 解析单品的实际占地与来源标记
  function resolveDims(item) {
    var t = TYPES[item.type] || { w: 600, d: 600, icon: '▭' };
    return {
      w: item.w || t.w,
      d: item.d || t.d,
      src: item.sizeSource || 'typical',
      icon: t.icon || '▭'
    };
  }

  root.FURNITURE_TYPES = TYPES;
  root.FURNITURE = FURNITURE;
  root.resolveFurnitureDims = resolveDims;
})(typeof window !== 'undefined' ? window : globalThis);
