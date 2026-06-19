/* 106 Victoria · 家具数据 (NZ 现货精选版 v2)
 * 数据来源：「家具资产配置表(NZ现货版)」筛出有 NZ 现货的 74 件 → 按房间精选成套布局。
 *   已剔除「未找到现货」及「Matisse 无价/request price/需询价」条目。
 * window.FURNITURE_TYPES：category → 默认占地[w,d]mm + 托盘图标(每件已带真实 w/d，TYPES 仅作回退/图标)。
 * window.FURNITURE：每房精选单品。
 *   - w/d：该单品真实俯视占地 mm（经典款标准尺寸/保守估值）。
 *   - link：NZ 购买渠道直链。
 *   - defaultPos：默认摆位(相对房间 body 左上角 mm；rot 0/90/180/270 绕中心)。
 *     单件为对象 {xMm,yMm,rot}；同款多件(如成套餐椅)为数组，工具首次加载自动按此布局。
 *   全部摆位已通过碰撞校验：在 body 内、不压固定橱柜/卫浴/子空间、彼此不重叠、过道≥700mm。
 */
(function (root) {
  'use strict';

  var TYPES = {
    bed:             { w: 1700, d: 2100, icon: '🛏' },
    bench:           { w: 1100, d: 400, icon: '▭' },
    coffee_table:    { w: 1200, d: 600, icon: '▭' },
    console:         { w: 1200, d: 350, icon: '🗄' },
    daybed:          { w: 1900, d: 800, icon: '🛋' },
    desk:            { w: 1600, d: 750, icon: '🖥' },
    dining_chair:    { w: 520, d: 520, icon: '🪑' },
    dining_table:    { w: 1800, d: 950, icon: '🍽' },
    dresser:         { w: 1000, d: 480, icon: '🗄' },
    floor_lamp:      { w: 450, d: 450, icon: '💡' },
    lounge_chair:    { w: 800, d: 800, icon: '🪑' },
    nightstand:      { w: 500, d: 400, icon: '▢' },
    office_chair:    { w: 600, d: 600, icon: '🪑' },
    pendant:         { w: 400, d: 400, icon: '💡' },
    shelf:           { w: 1800, d: 400, icon: '🗄' },
    sideboard:       { w: 1800, d: 450, icon: '🗄' },
    sofa:            { w: 2200, d: 950, icon: '🛋' },
    stool:           { w: 450, d: 400, icon: '◦' },
    table_lamp:      { w: 300, d: 300, icon: '💡' },
    trolley:         { w: 700, d: 500, icon: '🛒' }
  };

  var FURNITURE = {
    'kitchen-dining': [
      {"id": "dining-table", "label": "Saarinen Tulip 郁金香圆桌", "type": "dining_table", "w": 1200, "d": 1200, "link": "https://www.studioitalia.co.nz/products/saarinen-dining-table", "defaultPos": {"xMm": 1400, "yMm": 850, "rot": 0}},
      {"id": "dining-chair", "label": "Wishbone Y椅 CH24 ×4", "type": "dining_chair", "w": 480, "d": 520, "link": "https://cultdesign.co.nz", "defaultPos": [{"xMm": 1760, "yMm": 300, "rot": 0}, {"xMm": 1760, "yMm": 2080, "rot": 180}, {"xMm": 850, "yMm": 1210, "rot": 90}, {"xMm": 2630, "yMm": 1210, "rot": 270}]},
      {"id": "dining-pendant", "label": "PH5 吊灯", "type": "pendant", "w": 100, "d": 100, "link": "https://cultdesign.co.nz/products/ph5-pendant", "defaultPos": {"xMm": 1950, "yMm": 1400, "rot": 0}},
      {"id": "sideboard", "label": "Arne Vodder Model 18/21 餐边柜", "type": "sideboard", "w": 2100, "d": 450, "link": "https://thevintageshop.co.nz/product/sideboard-arne-vodder-2/", "defaultPos": {"xMm": 2725, "yMm": 3600, "rot": 90}},
      {"id": "floor-lamp", "label": "Akari 落地纸灯", "type": "floor_lamp", "w": 300, "d": 300, "link": "https://www.finnishdesignshop.com/en-nz/product/akari-25n-floor-lamp", "defaultPos": {"xMm": 3600, "yMm": 200, "rot": 0}}
    ],
    'dining': [
      {"id": "dining-table-ch327", "label": "Wegner CH327 实木长餐桌", "type": "dining_table", "w": 2200, "d": 950, "link": "https://archipro.co.nz/product/ch327-table-by-carl-hansen-son-cult-design", "defaultPos": {"xMm": 1250, "yMm": 1425, "rot": 0}},
      {"id": "dining-chair-wishbone", "label": "Wegner CH24 Y 椅 ×6", "type": "dining_chair", "w": 530, "d": 510, "link": "https://archipro.co.nz/product/ch24-wishbone-chair-by-carl-hansen-son-cult-design", "defaultPos": [{"xMm": 1318, "yMm": 905, "rot": 0}, {"xMm": 2085, "yMm": 905, "rot": 0}, {"xMm": 2852, "yMm": 905, "rot": 0}, {"xMm": 1318, "yMm": 2385, "rot": 180}, {"xMm": 2085, "yMm": 2385, "rot": 180}, {"xMm": 2852, "yMm": 2385, "rot": 180}]},
      {"id": "dining-sideboard-vodder", "label": "Arne Vodder 玫瑰木餐边柜", "type": "sideboard", "w": 2000, "d": 450, "link": "https://thevintageshop.co.nz/product/sideboard-arne-vodder-2/", "defaultPos": {"xMm": 3475, "yMm": 1825, "rot": 90}},
      {"id": "dining-pendant-artichoke", "label": "PH Artichoke 松果吊灯", "type": "pendant", "w": 100, "d": 100, "link": "https://archipro.co.nz/product/ph-artichoke-pendant-by-louis-poulsen-cult-design", "defaultPos": {"xMm": 2300, "yMm": 1850, "rot": 0}}
    ],
    'lounge': [
      {"id": "camaleonda-sofa", "label": "Camaleonda 模块沙发", "type": "sofa", "w": 1050, "d": 2950, "link": "https://matisse.co.nz/camaleonda-sofa/", "defaultPos": {"xMm": 150, "yMm": 2050, "rot": 0}},
      {"id": "noguchi-coffee-table", "label": "Noguchi 野口勇茶几", "type": "coffee_table", "w": 1280, "d": 900, "link": "https://matisse.co.nz/noguchi-coffee-table/", "defaultPos": {"xMm": 1550, "yMm": 3050, "rot": 0}},
      {"id": "eames-lounge-chair", "label": "Eames 躺椅+脚凳", "type": "lounge_chair", "w": 900, "d": 1400, "link": "https://matisse.co.nz/eames-lounge-chair-and-ottoman/", "defaultPos": {"xMm": 3550, "yMm": 4150, "rot": 0}},
      {"id": "pk22-lounge-chair", "label": "PK22 休闲椅", "type": "lounge_chair", "w": 650, "d": 650, "link": "https://www.mrbigglesworthy.co.nz/product/pair-of-iconic-poul-kjaerholm-pk22-armchairs-by-fritz-hansen", "defaultPos": {"xMm": 3650, "yMm": 2350, "rot": 0}},
      {"id": "arco-floor-lamp", "label": "Arco 落地灯", "type": "floor_lamp", "w": 400, "d": 400, "link": "https://ecc.co.nz/lighting/indoor-lighting/floor-lamps/arco-floor-lamp", "defaultPos": {"xMm": 850, "yMm": 5350, "rot": 0}},
      {"id": "tea-trolley", "label": "Aalto 900 茶推车", "type": "trolley", "w": 900, "d": 450, "link": "https://matisse.co.nz/tea-trolley-900", "defaultPos": {"xMm": 200, "yMm": 1400, "rot": 0}}
    ],
    'living': [
      {"id": "sofa-camaleonda", "label": "Camaleonda 模块沙发", "type": "sofa", "w": 2680, "d": 1010, "link": "https://matisse.co.nz/camaleonda-sofa/", "defaultPos": {"xMm": 760, "yMm": 700, "rot": 0}},
      {"id": "coffee-noguchi", "label": "Noguchi 野口勇茶几", "type": "coffee_table", "w": 1280, "d": 930, "link": "https://matisse.co.nz/noguchi-coffee-table/", "defaultPos": {"xMm": 1280, "yMm": 2200, "rot": 0}},
      {"id": "lounge-eames", "label": "Eames 躺椅", "type": "lounge_chair", "w": 850, "d": 900, "link": "https://matisse.co.nz/eames-lounge-chair-and-ottoman/", "defaultPos": {"xMm": 3150, "yMm": 2050, "rot": 270}},
      {"id": "ottoman-eames", "label": "Eames 躺椅脚凳", "type": "stool", "w": 560, "d": 600, "link": "https://matisse.co.nz/eames-lounge-chair-and-ottoman/", "defaultPos": {"xMm": 3200, "yMm": 3050, "rot": 270}},
      {"id": "media-usm", "label": "USM Haller 影音收纳柜", "type": "sideboard", "w": 2200, "d": 380, "link": "https://ecc.co.nz/furniture/indoor-furniture/storage/usm-haller-storage", "defaultPos": {"xMm": 1150, "yMm": 6480, "rot": 0}},
      {"id": "floor-arco", "label": "Arco 大理石落地灯", "type": "floor_lamp", "w": 600, "d": 600, "link": "https://ecc.co.nz/lighting/indoor-lighting/floor-lamps/arco-floor-lamp", "defaultPos": {"xMm": 3500, "yMm": 3950, "rot": 0}},
      {"id": "trolley-aalto", "label": "Aalto 900 茶推车", "type": "trolley", "w": 900, "d": 510, "link": "https://matisse.co.nz/tea-trolley-900", "defaultPos": {"xMm": 200, "yMm": 6280, "rot": 0}}
    ],
    'study': [
      {"id": "desk-bodil-kjaer", "label": "Bodil Kjær 007 邦德书桌", "type": "desk", "w": 2240, "d": 1140, "link": "https://cultdesign.co.nz/products/office-desk", "defaultPos": {"xMm": 300, "yMm": 200, "rot": 0}},
      {"id": "office-chair-eames-alu", "label": "Eames 铝合金办公椅", "type": "office_chair", "w": 600, "d": 600, "link": "https://matisse.co.nz/eames-aluminium-group-chairs/", "defaultPos": {"xMm": 1240, "yMm": 1450, "rot": 180}},
      {"id": "lounge-eames-lounge", "label": "Eames Lounge Chair 躺椅", "type": "lounge_chair", "w": 840, "d": 840, "link": "https://matisse.co.nz/eames-lounge-chair-and-ottoman/", "defaultPos": {"xMm": 3050, "yMm": 600, "rot": 180}},
      {"id": "ottoman-eames", "label": "Eames Lounge 配套脚凳", "type": "stool", "w": 660, "d": 550, "link": "https://matisse.co.nz/eames-lounge-chair-and-ottoman/", "defaultPos": {"xMm": 3100, "yMm": 1550, "rot": 0}},
      {"id": "shelf-vitsoe", "label": "Vitsoe 606 模块书架", "type": "shelf", "w": 1880, "d": 350, "link": "https://www.vitsoe.com/us/606", "defaultPos": {"xMm": 300, "yMm": 2950, "rot": 0}},
      {"id": "floor-lamp-arco", "label": "Arco 大理石落地灯", "type": "floor_lamp", "w": 500, "d": 500, "link": "https://ecc.co.nz/lighting/indoor-lighting/floor-lamps/arco-floor-lamp", "defaultPos": {"xMm": 3500, "yMm": 2750, "rot": 0}},
      {"id": "table-lamp-atollo", "label": "Atollo 台灯", "type": "table_lamp", "w": 250, "d": 250, "link": "https://ecc.co.nz/lighting/indoor-lighting/table-lamps/atollo-table-lamp", "defaultPos": {"xMm": 2700, "yMm": 250, "rot": 0}}
    ],
    'foyer': [
      {"id": "console", "label": "Florence Knoll 条案 / 中古玫瑰木条案", "type": "console", "w": 1200, "d": 350, "link": "https://www.mrbigglesworthy.co.nz/shop-vintage", "defaultPos": {"xMm": 3025, "yMm": 2975, "rot": 90}},
      {"id": "bench", "label": "Wegner 长凳 / 中古柚木玄关凳", "type": "bench", "w": 1100, "d": 400, "link": "https://cultdesign.co.nz", "defaultPos": {"xMm": 3050, "yMm": 1450, "rot": 90}},
      {"id": "floor-lamp", "label": "Akari 1A 纸落地灯", "type": "floor_lamp", "w": 350, "d": 350, "link": "https://www.finnishdesignshop.com/en-nz/product/akari-25n-floor-lamp", "defaultPos": {"xMm": 3400, "yMm": 4550, "rot": 0}},
      {"id": "pendant", "label": "Flos / Le Klint 入户吊灯", "type": "pendant", "w": 100, "d": 100, "link": "https://ecc.co.nz/", "defaultPos": {"xMm": 2600, "yMm": 3000, "rot": 0}}
    ],
    'master': [
      {"id": "bed", "label": "Nelson Thin Edge 窄边床", "type": "bed", "w": 1900, "d": 2150, "link": "https://matisse.co.nz/nelson-thin-edge-bed/", "defaultPos": {"xMm": 800, "yMm": 100, "rot": 0}},
      {"id": "nightstand", "label": "USM Haller 模块柜 ×2", "type": "nightstand", "w": 500, "d": 400, "link": "https://ecc.co.nz/furniture/indoor-furniture/storage/usm-haller-storage", "defaultPos": [{"xMm": 280, "yMm": 150, "rot": 0}, {"xMm": 2720, "yMm": 150, "rot": 0}]},
      {"id": "dresser", "label": "Arne Vodder Model 18/21 餐边/斗柜", "type": "dresser", "w": 1800, "d": 480, "link": "https://thevintageshop.co.nz/product/sideboard-arne-vodder-2/", "defaultPos": {"xMm": 850, "yMm": 4920, "rot": 0}},
      {"id": "lounge", "label": "Eames 躺椅 + 脚凳", "type": "lounge_chair", "w": 850, "d": 1450, "link": "https://matisse.co.nz/eames-lounge-chair-and-ottoman/", "defaultPos": {"xMm": 150, "yMm": 3000, "rot": 0}},
      {"id": "floor-lamp", "label": "Arco 抛物线落地灯", "type": "floor_lamp", "w": 400, "d": 400, "link": "https://ecc.co.nz/lighting/indoor-lighting/floor-lamps/arco-floor-lamp", "defaultPos": {"xMm": 150, "yMm": 4550, "rot": 0}},
      {"id": "pendant", "label": "PH5 吊灯", "type": "pendant", "w": 100, "d": 100, "link": "https://cultdesign.co.nz/products/ph5-pendant", "defaultPos": {"xMm": 1700, "yMm": 1125, "rot": 0}}
    ],
    'bedroom-2': [
      {"id": "bed-thin-edge", "label": "Nelson Thin Edge 窄边床", "type": "bed", "w": 1620, "d": 2150, "link": "https://matisse.co.nz/nelson-thin-edge-bed/", "defaultPos": {"xMm": 1100, "yMm": 0, "rot": 0}},
      {"id": "nightstand-usm", "label": "USM Haller 模块床头柜 ×2", "type": "nightstand", "w": 500, "d": 500, "link": "https://ecc.co.nz/furniture/indoor-furniture/storage/usm-haller-storage", "defaultPos": [{"xMm": 560, "yMm": 0, "rot": 0}, {"xMm": 2760, "yMm": 0, "rot": 0}]},
      {"id": "dresser-vodder", "label": "Arne Vodder Sideboard 斗柜", "type": "dresser", "w": 1800, "d": 480, "link": "https://thevintageshop.co.nz/product/sideboard-arne-vodder-2/", "defaultPos": {"xMm": 3360, "yMm": 1260, "rot": 90}},
      {"id": "lounge-wishbone", "label": "Wegner CH24 Y椅", "type": "lounge_chair", "w": 530, "d": 510, "link": "https://cultdesign.co.nz", "defaultPos": {"xMm": 300, "yMm": 3200, "rot": 0}},
      {"id": "floor-lamp-akari", "label": "Akari 野口勇纸落地灯", "type": "floor_lamp", "w": 450, "d": 450, "link": "https://www.finnishdesignshop.com/en-nz/product/akari-25n-floor-lamp", "defaultPos": {"xMm": 880, "yMm": 3300, "rot": 0}},
      {"id": "pendant-ph5", "label": "PH5 吊灯", "type": "pendant", "w": 100, "d": 100, "link": "https://cultdesign.co.nz/products/ph5-pendant", "defaultPos": {"xMm": 1860, "yMm": 1025, "rot": 0}}
    ],
    'bedroom-3': [
      {"id": "nelson-thin-edge-bed", "label": "Nelson Thin Edge 窄边床", "type": "bed", "w": 1620, "d": 2150, "link": "https://matisse.co.nz/nelson-thin-edge-bed/", "defaultPos": {"xMm": 950, "yMm": 0, "rot": 0}},
      {"id": "butterfly-stool", "label": "Butterfly 蝴蝶凳 ×2", "type": "nightstand", "w": 420, "d": 310, "link": "https://matisse.co.nz/butterfly-stool-maple/", "defaultPos": [{"xMm": 470, "yMm": 100, "rot": 0}, {"xMm": 2630, "yMm": 100, "rot": 0}]},
      {"id": "vodder-dresser", "label": "Arne Vodder 餐边柜", "type": "dresser", "w": 2100, "d": 470, "link": "https://thevintageshop.co.nz/product/sideboard-arne-vodder-2/", "defaultPos": {"xMm": 3215, "yMm": 1115, "rot": 90}},
      {"id": "pk22-lounge", "label": "PK22 休闲椅", "type": "lounge_chair", "w": 640, "d": 640, "link": "https://www.mrbigglesworthy.co.nz/product/pair-of-iconic-poul-kjaerholm-pk22-armchairs-by-fritz-hansen", "defaultPos": {"xMm": 300, "yMm": 2300, "rot": 0}},
      {"id": "arco-floor-lamp", "label": "Arco 大理石落地灯", "type": "floor_lamp", "w": 330, "d": 330, "link": "https://ecc.co.nz/lighting/indoor-lighting/floor-lamps/arco-floor-lamp", "defaultPos": {"xMm": 1080, "yMm": 2400, "rot": 0}},
      {"id": "ph5-pendant", "label": "PH5 吊灯", "type": "pendant", "w": 100, "d": 100, "link": "https://cultdesign.co.nz/products/ph5-pendant", "defaultPos": {"xMm": 1710, "yMm": 1025, "rot": 0}}
    ],
    'bedroom-4': [
      {"id": "ge258-daybed", "label": "Wegner GE258 中古日托榻", "type": "daybed", "w": 1980, "d": 760, "link": "https://www.mrbigglesworthy.co.nz/product/exceptional-hans-wegner-ge-sofa-daybed-by-getama", "defaultPos": {"xMm": 100, "yMm": 0, "rot": 0}},
      {"id": "aalto-trolley", "label": "Aalto 900 茶推车", "type": "trolley", "w": 900, "d": 650, "link": "https://matisse.co.nz/tea-trolley-900", "defaultPos": {"xMm": 2250, "yMm": 0, "rot": 0}},
      {"id": "pk22-chair", "label": "Kjærholm PK22 休闲椅", "type": "lounge_chair", "w": 630, "d": 630, "link": "https://www.mrbigglesworthy.co.nz/product/pair-of-iconic-poul-kjaerholm-pk22-armchairs-by-fritz-hansen", "defaultPos": {"xMm": 3000, "yMm": 1150, "rot": 0}},
      {"id": "akari-25n-lamp", "label": "Akari 25N 纸落地灯", "type": "floor_lamp", "w": 330, "d": 330, "link": "https://www.finnishdesignshop.com/en-nz/product/akari-25n-floor-lamp", "defaultPos": {"xMm": 3350, "yMm": 150, "rot": 0}}
    ],
    'pool-house': [
      {"id": "togo-sofa", "label": "Togo 三座模块沙发", "type": "sofa", "w": 1740, "d": 1020, "link": "https://www.ligne.nz/togo", "defaultPos": {"xMm": -210, "yMm": 2760, "rot": 90}},
      {"id": "noguchi-coffee", "label": "Noguchi 野口勇茶几", "type": "coffee_table", "w": 1280, "d": 930, "link": "https://matisse.co.nz/noguchi-coffee-table/", "defaultPos": {"xMm": 1500, "yMm": 2700, "rot": 0}},
      {"id": "roly", "label": "Roly Poly 象腿椅 ×2", "type": "lounge_chair", "w": 840, "d": 700, "link": "https://www.davidshaw.co.nz/product/roly-poly-chair/", "defaultPos": [{"xMm": 3400, "yMm": 2400, "rot": 0}, {"xMm": 3400, "yMm": 3300, "rot": 0}]},
      {"id": "lc4-chaise", "label": "LC4 躺椅", "type": "daybed", "w": 1600, "d": 560, "link": "https://matisse.co.nz/lc4-chaise-longue", "defaultPos": {"xMm": 200, "yMm": 5200, "rot": 0}},
      {"id": "tea-trolley", "label": "Aalto 900 茶推车", "type": "trolley", "w": 900, "d": 640, "link": "https://matisse.co.nz/tea-trolley-900", "defaultPos": {"xMm": 1500, "yMm": 1650, "rot": 0}},
      {"id": "arco-lamp", "label": "Arco 大理石落地灯", "type": "floor_lamp", "w": 350, "d": 350, "link": "https://ecc.co.nz/lighting/indoor-lighting/floor-lamps/arco-floor-lamp", "defaultPos": {"xMm": 200, "yMm": 1950, "rot": 0}}
    ]
  };

  // 解析单品占地与图标（item 带 w/d 则优先，否则回退 TYPES）
  function resolveDims(item) {
    var t = TYPES[item.type] || { w: 600, d: 600, icon: '▭' };
    return { w: item.w || t.w, d: item.d || t.d, src: item.sizeSource || 'real', icon: t.icon || '▭' };
  }

  root.FURNITURE_TYPES = TYPES;
  root.FURNITURE = FURNITURE;
  root.resolveFurnitureDims = resolveDims;
})(typeof window !== 'undefined' ? window : globalThis);
