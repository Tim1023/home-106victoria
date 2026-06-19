/* 106 Victoria · 房间布局数据底座 (Phase 1)
 * window.ROOMS：每个房间的矢量平面数据。
 *   - viewBox / inner：渲染源。inner 为 <svg> 内的图层内容，取自 assets/svg-rooms/*.svg，
 *     与 plans.html 原手写内嵌 SVG 逐字节一致 → 保证 Phase 1 零回归。
 *   - body / subRooms / fixtures：结构化几何（绝对 SVG px，单房间坐标系），供 Phase 2 碰撞/间距使用。
 *     body = 主房间可摆放区；subRooms = 封闭子空间(走入式衣帽间/卫生间/厕所)，作障碍不可放；
 *     fixtures = 固定家电(橱柜/中岛/书柜镶板)，作障碍不可放。
 * 坐标系：1 m = 60 px（renderer.js 中的 PX_PER_M），墙体留 35px padding。
 * 注意：不要依赖 DOM 中 walls rect 的顺序判断主墙——一律读这里的 body（Master 主墙在 x=275）。
 */
(function (root) {
  'use strict';

  var ROOMS = {
    'kitchen-dining': {
      id: 'kitchen-dining',
      name: 'Kitchen / Dining',
      label: 'Kitchen / Dining',
      labelSize: 17,
      labelPos: { x: 155, y: 263 },
      outline: { x: 35, y: 35, w: 240, h: 456 },
      body: { x: 35, y: 35, w: 240, h: 456 },
      subRooms: [],
      fixtures: [
        { x: 35, y: 215, w: 30, h: 200, kind: 'counter' },
        { x: 40, y: 300, w: 22, h: 26, kind: 'sink' },
        { x: 35, y: 413, w: 150, h: 30, kind: 'counter' },
        { x: 86, y: 416, w: 44, h: 24, kind: 'cooktop' },
        { x: 120, y: 250, w: 50, h: 165, kind: 'island' }
      ],
      doors: [
        { wall: 'E', offsetMm: 800, widthMm: 1500 }
      ],
      windows: [
        { wall: 'W', offsetMm: 900, widthMm: 1100 },
        { wall: 'W', offsetMm: 3000, widthMm: 1400 }
      ],
      dims: [
        { x: 155, y: 23, text: '4.0 m' },
        { x: 23, y: 263, text: '7.6 m', rot: -90 }
      ],
      inner: '<g class="walls"><rect x="35" y="35" width="240" height="456" fill="#c6d0c5" stroke="#1a1a1a" stroke-width="3"/></g><g class="fixtures"><rect x="35" y="215" width="30" height="240" fill="#bdb39c" stroke="#1a1a1a" stroke-width="1"/><rect x="35" y="455" width="150" height="30" fill="#bdb39c" stroke="#1a1a1a" stroke-width="1"/><rect x="125" y="251" width="48" height="168" fill="#bdb39c" stroke="#1a1a1a" stroke-width="1"/></g><g class="openings"></g><g class="dims" font-family="JetBrains Mono,monospace" font-size="11" fill="#6b6253"><text x="155" y="23" text-anchor="middle">4.0 m</text><text x="23" y="263" text-anchor="middle" transform="rotate(-90 23 263)">7.6 m</text></g><g class="labels"><text x="155" y="263" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="17" fill="#1a1a1a" font-weight="500" style="paint-order:stroke;stroke:#fffffff0;stroke-width:3">Kitchen / Dining</text></g><g class="furniture"></g>'
    },

    'dining': {
      id: 'dining',
      name: 'Dining 正式餐厅',
      label: 'Dining',
      labelSize: 17,
      labelPos: { x: 176, y: 158 },
      outline: { x: 35, y: 35, w: 282, h: 246 },
      body: { x: 35, y: 35, w: 282, h: 246 },
      subRooms: [],
      fixtures: [],
      doors: [
        { wall: 'E', offsetMm: 400, widthMm: 900 },
        { wall: 'S', offsetMm: 500, widthMm: 900 }
      ],
      windows: [
        { wall: 'N', offsetMm: 900, widthMm: 2000 }
      ],
      dims: [
        { x: 176, y: 23, text: '4.7 m' },
        { x: 23, y: 158, text: '4.1 m', rot: -90 }
      ],
      inner: '<g class="walls"><rect x="35" y="35" width="282" height="246" fill="#c6d0c5" stroke="#1a1a1a" stroke-width="3"/></g><g class="openings"><line x1="83" y1="281" x2="137" y2="281" stroke="#fff" stroke-width="5"/><path d="M83,281 A54,54 0 0,0 137,227" fill="none" stroke="#1a1a1a" stroke-width="0.7"/><line x1="35" y1="125" x2="35" y2="179" stroke="#fff" stroke-width="5"/><path d="M35,125 A54,54 0 0,1 89,179" fill="none" stroke="#1a1a1a" stroke-width="0.7"/></g><g class="dims" font-family="JetBrains Mono,monospace" font-size="11" fill="#6b6253"><text x="176" y="23" text-anchor="middle">4.7 m</text><text x="23" y="158" text-anchor="middle" transform="rotate(-90 23 158)">4.1 m</text></g><g class="labels"><text x="176" y="158" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="17" fill="#1a1a1a" font-weight="500" style="paint-order:stroke;stroke:#fffffff0;stroke-width:3">Dining</text></g><g class="furniture"></g>'
    },

    'lounge': {
      id: 'lounge',
      name: 'Lounge 主客厅',
      label: 'Lounge',
      labelSize: 22,
      labelPos: { x: 191, y: 239 },
      outline: { x: 35, y: 35, w: 312, h: 408 },
      body: { x: 35, y: 35, w: 312, h: 408 },
      subRooms: [],
      fixtures: [],
      doors: [
        { wall: 'N', offsetMm: 1700, widthMm: 1600 },
        { wall: 'W', offsetMm: 2900, widthMm: 900 },
        { wall: 'W', offsetMm: 5400, widthMm: 900 },
        { wall: 'E', offsetMm: 600, widthMm: 900 }
      ],
      windows: [
        { wall: 'E', offsetMm: 2400, widthMm: 1600 },
        { wall: 'E', offsetMm: 4400, widthMm: 1400 }
      ],
      dims: [
        { x: 191, y: 23, text: '5.2 m' },
        { x: 23, y: 239, text: '6.8 m', rot: -90 }
      ],
      inner: '<g class="walls"><rect x="35" y="35" width="312" height="408" fill="#c6d0c5" stroke="#1a1a1a" stroke-width="3"/></g><g class="openings"><line x1="137" y1="35" x2="234" y2="35" stroke="#fff" stroke-width="6"/><line x1="137" y1="32" x2="234" y2="32" stroke="#1a1a1a" stroke-width="1.5"/><line x1="137" y1="38" x2="234" y2="38" stroke="#1a1a1a" stroke-width="1.5"/><line x1="35" y1="219" x2="35" y2="264" stroke="#fff" stroke-width="5"/><path d="M35,219 A46,46 0 0,1 81,264" fill="none" stroke="#1a1a1a" stroke-width="0.7"/><line x1="347" y1="73" x2="347" y2="119" stroke="#fff" stroke-width="5"/><path d="M347,73 A46,46 0 0,0 301,119" fill="none" stroke="#1a1a1a" stroke-width="0.7"/><line x1="347" y1="155" x2="347" y2="243" stroke="#fff" stroke-width="5"/><path d="M347,155 A88,88 0 0,0 259,243" fill="none" stroke="#1a1a1a" stroke-width="0.7"/><line x1="347" y1="301" x2="347" y2="390" stroke="#fff" stroke-width="5"/><path d="M347,301 A89,89 0 0,0 258,390" fill="none" stroke="#1a1a1a" stroke-width="0.7"/></g><g class="dims" font-family="JetBrains Mono,monospace" font-size="11" fill="#6b6253"><text x="191" y="23" text-anchor="middle">5.2 m</text><text x="23" y="239" text-anchor="middle" transform="rotate(-90 23 239)">6.8 m</text></g><g class="labels"><text x="191" y="239" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="22" fill="#1a1a1a" font-weight="500" style="paint-order:stroke;stroke:#fffffff0;stroke-width:3">Lounge</text></g><g class="furniture"></g>'
    },

    'living': {
      id: 'living',
      name: 'Living 起居室',
      label: 'Living',
      labelSize: 18,
      labelPos: { x: 164, y: 242 },
      outline: { x: 35, y: 35, w: 258, h: 414 },
      body: { x: 35, y: 35, w: 258, h: 414 },
      subRooms: [],
      fixtures: [
        { x: 35, y: 170, w: 26, h: 80, kind: 'paneling' }
      ],
      doors: [
        { wall: 'N', offsetMm: 1000, widthMm: 2300 },
        { wall: 'W', offsetMm: 3400, widthMm: 900 },
        { wall: 'S', offsetMm: 1600, widthMm: 1600 }
      ],
      windows: [
        { wall: 'E', offsetMm: 1900, widthMm: 2700 }
      ],
      dims: [
        { x: 164, y: 23, text: '4.3 m' },
        { x: 23, y: 242, text: '6.9 m', rot: -90 }
      ],
      inner: '<g class="walls"><rect x="35" y="35" width="258" height="414" fill="#c6d0c5" stroke="#1a1a1a" stroke-width="3"/></g><g class="openings"><line x1="94" y1="35" x2="231" y2="35" stroke="#fff" stroke-width="6"/><line x1="94" y1="32" x2="231" y2="32" stroke="#1a1a1a" stroke-width="1.5"/><line x1="94" y1="38" x2="231" y2="38" stroke="#1a1a1a" stroke-width="1.5"/><line x1="132" y1="449" x2="226" y2="449" stroke="#fff" stroke-width="6"/><line x1="132" y1="446" x2="226" y2="446" stroke="#1a1a1a" stroke-width="1.5"/><line x1="132" y1="452" x2="226" y2="452" stroke="#1a1a1a" stroke-width="1.5"/><line x1="35" y1="363" x2="35" y2="403" stroke="#fff" stroke-width="5"/><path d="M35,363 A40,40 0 0,1 75,403" fill="none" stroke="#1a1a1a" stroke-width="0.7"/><line x1="293" y1="154" x2="293" y2="317" stroke="#fff" stroke-width="6"/><line x1="290" y1="154" x2="290" y2="317" stroke="#1a1a1a" stroke-width="1.5"/><line x1="296" y1="154" x2="296" y2="317" stroke="#1a1a1a" stroke-width="1.5"/></g><g class="dims" font-family="JetBrains Mono,monospace" font-size="11" fill="#6b6253"><text x="164" y="23" text-anchor="middle">4.3 m</text><text x="23" y="242" text-anchor="middle" transform="rotate(-90 23 242)">6.9 m</text></g><g class="labels"><text x="164" y="242" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="18" fill="#1a1a1a" font-weight="500" style="paint-order:stroke;stroke:#fffffff0;stroke-width:3">Living</text></g><g class="furniture"></g>'
    },

    'study': {
      id: 'study',
      name: 'Study 书房',
      label: 'Study',
      labelSize: 14,
      labelPos: { x: 161, y: 134 },
      outline: { x: 35, y: 35, w: 252, h: 198 },
      body: { x: 35, y: 35, w: 252, h: 198 },
      subRooms: [],
      fixtures: [
        { x: 35, y: 55, w: 16, h: 130, kind: 'paneling' }
      ],
      doors: [
        { wall: 'N', offsetMm: 2200, widthMm: 900 }
      ],
      windows: [
        { wall: 'S', offsetMm: 1100, widthMm: 1900 }
      ],
      dims: [
        { x: 161, y: 23, text: '4.2 m' },
        { x: 23, y: 134, text: '3.3 m', rot: -90 }
      ],
      inner: '<g class="walls"><rect x="35" y="35" width="252" height="198" fill="#c6d0c5" stroke="#1a1a1a" stroke-width="3"/></g><g class="fixtures"><rect x="35" y="35" width="9" height="198" fill="#bdb39c" stroke="#1a1a1a" stroke-width="1"/><rect x="278" y="35" width="9" height="198" fill="#bdb39c" stroke="#1a1a1a" stroke-width="1"/></g><g class="openings"><line x1="64" y1="35" x2="122" y2="35" stroke="#fff" stroke-width="5"/><path d="M64,35 A58,58 0 0,1 122,93" fill="none" stroke="#1a1a1a" stroke-width="0.7"/><line x1="160" y1="35" x2="244" y2="35" stroke="#fff" stroke-width="5"/><path d="M160,35 A85,85 0 0,1 244,120" fill="none" stroke="#1a1a1a" stroke-width="0.7"/></g><g class="dims" font-family="JetBrains Mono,monospace" font-size="11" fill="#6b6253"><text x="161" y="23" text-anchor="middle">4.2 m</text><text x="23" y="134" text-anchor="middle" transform="rotate(-90 23 134)">3.3 m</text></g><g class="labels"><text x="161" y="134" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="14" fill="#1a1a1a" font-weight="500" style="paint-order:stroke;stroke:#fffffff0;stroke-width:3">Study</text></g><g class="furniture"></g>'
    },

    /* foyer：入户玄关。按 Study(4.2m=214px)/Lounge(5.2m=268px) 标定 ≈51px/m，实测约 3.8 × 5.2 m。
       布局(中介图 + Tim 确认)：弧形楼梯在左下(SW)贴 Study 墙；楼梯上端下方藏一间储物间 Store1(NW)，
       门朝左上的过道开口。右上(NE)另有储物间 Store2(正对南面入户门 Entry)，紧挨它的是通客厅(Living)的门。
       南墙偏东入户门(Entry)；东墙下段通 Lounge；东/中为开放入户厅(条案+大圆镜贴东墙，见 房源_07)。
       尺寸为按中介图标定的近似值(图本身标 approximate)。 */
    'foyer': {
      id: 'foyer',
      name: '玄关 · 入户厅',
      label: 'Foyer',
      labelSize: 13,
      labelPos: { x: 170, y: 255 },
      outline: { x: 35, y: 35, w: 228, h: 312 },
      body: { x: 35, y: 35, w: 228, h: 312 },
      subRooms: [
        { x: 35, y: 35, w: 62, h: 70, label: 'Store' },
        { x: 165, y: 35, w: 73, h: 82, label: 'Store' }
      ],
      fixtures: [
        { x: 35, y: 105, w: 62, h: 242, kind: 'stairs' }
      ],
      doors: [
        { wall: 'S', offsetMm: 2050, widthMm: 1000 },
        { wall: 'S', offsetMm: 150, widthMm: 500, rect: { x: 35, y: 35, w: 62, h: 70 } },
        { wall: 'S', offsetMm: 250, widthMm: 600, rect: { x: 165, y: 35, w: 73, h: 82 } },
        { wall: 'N', offsetMm: 2050, widthMm: 800 },
        { wall: 'E', offsetMm: 3450, widthMm: 900 }
      ],
      windows: [
        { wall: 'N', offsetMm: 1050, widthMm: 600 }
      ],
      dims: [
        { x: 149, y: 23, text: '3.8 m' },
        { x: 23, y: 191, text: '5.2 m', rot: -90 },
        { x: 66, y: 74, text: 'Store', serif: true, size: 8 },
        { x: 201, y: 80, text: 'Store', serif: true, size: 8 },
        { x: 66, y: 232, text: '楼梯', serif: true, size: 9 },
        { x: 130, y: 130, text: '↑客厅', small: true, size: 8 },
        { x: 120, y: 50, text: '过道', small: true, size: 8 },
        { x: 180, y: 338, text: 'Entry', small: true, size: 9 }
      ]
    },

    /* master：按 Tim 确认的中介图——卧室 3.5×5.5(右) + 卫浴 2.0×2.5(左上) + 衣帽间 2.0×1.4(左下)。
       门窗/洁具为初稿，待 calibrate.html 叠图 + Tim 核对。 */
    'master': {
      id: 'master',
      name: 'Master 主卧',
      label: 'Master',
      labelSize: 16,
      labelPos: { x: 260, y: 200 },
      outline: { x: 155, y: 35, w: 210, h: 330 },
      body: { x: 155, y: 35, w: 210, h: 330 },
      subRooms: [
        { x: 35, y: 35, w: 120, h: 150, label: 'Bathroom' },
        { x: 35, y: 185, w: 120, h: 84, label: 'Walk-in' }
      ],
      fixtures: [
        { x: 50, y: 44, w: 92, h: 24, kind: 'basin' },
        { x: 43, y: 80, w: 60, h: 58, kind: 'shower' },
        { x: 112, y: 98, w: 30, h: 40, kind: 'toilet' }
      ],
      doors: [
        { wall: 'W', offsetMm: 1100, widthMm: 700, rect: { x: 155, y: 35, w: 210, h: 330 } },
        { wall: 'E', offsetMm: 300, widthMm: 600, rect: { x: 35, y: 185, w: 120, h: 84 } },
        { wall: 'S', offsetMm: 250, widthMm: 900, rect: { x: 155, y: 35, w: 210, h: 330 } }
      ],
      windows: [
        { wall: 'N', offsetMm: 350, widthMm: 2400, rect: { x: 155, y: 35, w: 210, h: 330 } },
        { wall: 'E', offsetMm: 550, widthMm: 1100, rect: { x: 155, y: 35, w: 210, h: 330 } }
      ],
      dims: [
        { x: 260, y: 23, text: '3.5 m' },
        { x: 383, y: 200, text: '5.5 m', rot: -90 }
      ]
    },

    /* bedroom-2 = 4.5×4.0（原 plans.html 标成 3.5×5.5，与 master 标反，已纠正）。顶墙单窗，底墙入口。 */
    'bedroom-2': {
      id: 'bedroom-2',
      name: 'Bedroom 2',
      label: 'Bedroom 2',
      labelSize: 15,
      labelPos: { x: 170, y: 155 },
      outline: { x: 35, y: 35, w: 270, h: 240 },
      body: { x: 35, y: 35, w: 270, h: 240 },
      subRooms: [],
      fixtures: [],
      doors: [
        { wall: 'S', offsetMm: 1800, widthMm: 900 },
        { wall: 'W', offsetMm: 2900, widthMm: 800 }
      ],
      windows: [
        { wall: 'N', offsetMm: 1300, widthMm: 1600 }
      ],
      dims: [
        { x: 170, y: 23, text: '4.5 m' },
        { x: 23, y: 155, text: '4.0 m', rot: -90 }
      ]
    },

    /* bedroom-3 = 4.5×3.1（左下角房）。底墙+左墙转角双窗，顶墙入口。 */
    'bedroom-3': {
      id: 'bedroom-3',
      name: 'Bedroom 3',
      label: 'Bedroom 3',
      labelSize: 14,
      labelPos: { x: 170, y: 128 },
      outline: { x: 35, y: 35, w: 270, h: 186 },
      body: { x: 35, y: 35, w: 270, h: 186 },
      subRooms: [],
      fixtures: [],
      doors: [
        { wall: 'N', offsetMm: 2000, widthMm: 900 }
      ],
      windows: [
        { wall: 'S', offsetMm: 1100, widthMm: 1900 },
        { wall: 'W', offsetMm: 1400, widthMm: 1100 }
      ],
      dims: [
        { x: 170, y: 23, text: '4.5 m' },
        { x: 23, y: 128, text: '3.1 m', rot: -90 }
      ]
    },

    /* bedroom-4 = 3.7×1.9（右下角窄房/更衣间）。右墙+底墙转角双窗，顶墙入口。 */
    'bedroom-4': {
      id: 'bedroom-4',
      name: 'Bedroom 4 / Dressing',
      label: 'Bedroom 4',
      labelSize: 14,
      labelPos: { x: 146, y: 92 },
      outline: { x: 35, y: 35, w: 222, h: 114 },
      body: { x: 35, y: 35, w: 222, h: 114 },
      subRooms: [],
      fixtures: [],
      doors: [
        { wall: 'N', offsetMm: 300, widthMm: 800 }
      ],
      windows: [
        { wall: 'E', offsetMm: 400, widthMm: 1000 },
        { wall: 'S', offsetMm: 1300, widthMm: 1500 }
      ],
      dims: [
        { x: 146, y: 23, text: '3.7 m' },
        { x: 23, y: 92, text: '1.9 m', rot: -90 }
      ]
    },

    'pool-house': {
      id: 'pool-house',
      name: 'Pool House 独立泳池房',
      label: 'Pool House',
      labelSize: 21,
      labelPos: { x: 130, y: 250 },
      outline: { x: 35, y: 35, w: 300, h: 420 },
      body: { x: 35, y: 35, w: 300, h: 420 },
      subRooms: [
        { x: 215, y: 35, w: 120, h: 90, label: 'Toilet' }
      ],
      fixtures: [
        { x: 296, y: 50, w: 28, h: 34, kind: 'toilet' },
        { x: 300, y: 92, w: 26, h: 18, kind: 'basin' }
      ],
      doors: [
        { wall: 'W', offsetMm: 800, widthMm: 900 },
        { wall: 'W', offsetMm: 3700, widthMm: 900 },
        { wall: 'W', offsetMm: 300, widthMm: 700, rect: { x: 215, y: 35, w: 120, h: 90 } }
      ],
      windows: [
        { wall: 'N', offsetMm: 600, widthMm: 2400 },
        { wall: 'W', offsetMm: 2500, widthMm: 1500 }
      ],
      dims: [
        { x: 185, y: 23, text: '5.0 m' },
        { x: 23, y: 245, text: '7.0 m', rot: -90 }
      ],
      inner: '<g class="walls"><rect x="35" y="35" width="300" height="420" fill="#c6d0c5" stroke="#1a1a1a" stroke-width="3"/><rect x="215" y="35" width="120" height="90" fill="#b5c5b3" stroke="#1a1a1a" stroke-width="2"/></g><g class="openings"><line x1="58" y1="35" x2="201" y2="35" stroke="#fff" stroke-width="6"/><line x1="58" y1="32" x2="201" y2="32" stroke="#1a1a1a" stroke-width="1.5"/><line x1="58" y1="38" x2="201" y2="38" stroke="#1a1a1a" stroke-width="1.5"/><line x1="259" y1="35" x2="294" y2="35" stroke="#fff" stroke-width="5"/><path d="M259,35 A35,35 0 0,1 294,70" fill="none" stroke="#1a1a1a" stroke-width="0.7"/><line x1="35" y1="99" x2="35" y2="155" stroke="#fff" stroke-width="5"/><path d="M35,99 A56,56 0 0,1 91,155" fill="none" stroke="#1a1a1a" stroke-width="0.7"/><line x1="35" y1="231" x2="35" y2="325" stroke="#fff" stroke-width="6"/><line x1="32" y1="231" x2="32" y2="325" stroke="#1a1a1a" stroke-width="1.5"/><line x1="38" y1="231" x2="38" y2="325" stroke="#1a1a1a" stroke-width="1.5"/></g><g class="dims" font-family="JetBrains Mono,monospace" font-size="11" fill="#6b6253"><text x="185" y="23" text-anchor="middle">5.0 m</text><text x="23" y="245" text-anchor="middle" transform="rotate(-90 23 245)">7.0 m</text><text x="275" y="78" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="11" fill="#1a1a1a" font-weight="500">Toilet</text><text x="275" y="92" text-anchor="middle" font-family="-apple-system" font-size="9" fill="#6b6253">2.0 × 1.5</text></g><g class="labels"><text x="185" y="245" text-anchor="middle" font-family="Cormorant Garamond,serif" font-size="21" fill="#1a1a1a" font-weight="500" style="paint-order:stroke;stroke:#fffffff0;stroke-width:3">Pool House</text></g><g class="furniture"></g>'
    }
  };

  // 房间在 plans.html 中的顺序（用于 Phase 3 整屋图遍历，与 section 顺序一致）
  var ORDER = ['kitchen-dining', 'dining', 'lounge', 'living', 'study', 'foyer', 'master', 'bedroom-2', 'bedroom-3', 'bedroom-4', 'pool-house'];

  root.ROOMS = ROOMS;
  root.ROOMS_ORDER = ORDER;
})(typeof window !== 'undefined' ? window : globalThis);
