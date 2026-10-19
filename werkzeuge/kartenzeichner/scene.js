// Scene description for the illustrated Arcadia map (2000 x 1500 design space).
"use strict";

function drawScene() {
  const CS = 1.45, SS = 1.8;
  const _city = city, _ship = ship, _village = village;
  city = (x, y, sc, st, sd) => _city(x, y, sc * CS, st, sd);
  ship = (x, y, s, sail) => _ship(x, y, s * SS, sail);
  village = (x, y, n, roofs, sd, o) => { ctx.save(); ctx.translate(x, y); ctx.scale(1.35, 1.35); ctx.translate(-x, -y); _village(x, y, n, roofs, sd, o); ctx.restore(); };
  const noise = (x, y, sd) => Math.sin(x * 0.031 + sd) * Math.cos(y * 0.037 - sd * 0.7) + Math.sin((x + y) * 0.019 + sd * 1.3) * 0.7;
  const sprites = [];               // drawn y-sorted
  const add = (y, fn) => sprites.push({ y, fn });
  const keep = [];                  // keep-out circles for vegetation
  const K_ = (x, y, r) => keep.push([x, y, r]);
  const free = (x, y) => keep.every(([kx, ky, kr]) => (x - kx) ** 2 + ((y - ky) * 1.4) ** 2 > kr * kr);

  function scatter(cx, cy, rx, ry, sp, pred, make, seed) {
    const rnd = rng(seed);
    for (let gx = cx - rx; gx <= cx + rx; gx += sp) for (let gy = cy - ry; gy <= cy + ry; gy += sp * 0.62) {
      const x = gx + (rnd() - 0.5) * sp * 0.9, y = gy + (rnd() - 0.5) * sp * 0.5;
      const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (e > 1 - rnd() * 0.3) continue;
      if (!landAround(x, y, 4) || !free(x, y) || (pred && !pred(x, y))) continue;
      const v = rnd();
      add(y, () => make(x, y, v));
    }
  }

  // ===== keep-out zones for settlements and landmarks =====
  const SITES = [
    [1480, 205, 26], [1520, 320, 30], [1600, 400, 16], [1700, 350, 16], [1600, 470, 36], [1630, 545, 16], [1720, 615, 34], [1800, 690, 24],
    [1770, 250, 30], [1865, 190, 34], [1830, 380, 60], [1700, 80, 18], [1660, 262, 26],
    [1890, 690, 28], [1770, 960, 36], [1965, 850, 20], [1880, 920, 26],
    [210, 560, 40], [160, 300, 22], [340, 140, 24], [500, 440, 28], [95, 470, 24], [260, 700, 28], [110, 760, 55],
    [1780, 1240, 40], [1310, 1300, 30], [1400, 1210, 26], [1660, 1390, 30], [1800, 1440, 22], [1500, 1330, 62], [1880, 1110, 50],
    [655, 1030, 55], [440, 1200, 40], [960, 880, 26], [700, 1240, 30], [520, 1420, 62], [820, 960, 50], [130, 1420, 34],
    [1160, 330, 20], [1000, 350, 18],
  ];
  for (const s of SITES) K_(...s);

  // ===== ground layer (clipped to land): fields, rivers, roads =====
  const ground = document.createElement("canvas"); ground.width = IMG_W; ground.height = IMG_H;
  const g = ground.getContext("2d"); const mainCtx = ctx; setup(g, IMG_W, IMG_H);
  // fields
  fields(470, 1190, 85, 50, -0.25, 11); fields(690, 1215, 45, 30, 0.2, 12); fields(1560, 520, 40, 26, 0.3, 13); fields(1690, 590, 45, 24, -0.2, 14);
  fields(1515, 345, 30, 18, 0.1, 15); fields(1270, 455, 0, 0, 0, 1);
  // rivers
  river([[1680, 300], [1610, 330], [1560, 318], [1505, 322], [1470, 330]], 1.2, 3.2);                       // Neverwinter
  river([[1800, 500], [1740, 520], [1690, 548], [1640, 552], [1590, 560], [1540, 565]], 1.2, 3.4);           // Delimbiyr
  river([[1930, 560], [1860, 585], [1800, 598], [1745, 612], [1700, 625], [1660, 630]], 1.2, 3.8);           // Chionthar
  river([[1720, 300], [1690, 380], [1660, 430], [1625, 465], [1585, 478], [1550, 480]], 1, 2.8);              // Dessarin
  river([[1700, 1140], [1640, 1190], [1560, 1240], [1470, 1270], [1390, 1290], [1300, 1310], [1260, 1315]], 1.2, 4);  // jungle river
  river([[640, 1080], [600, 1140], [560, 1180], [500, 1215], [430, 1240], [360, 1250], [290, 1250], [230, 1240]], 1, 3.4); // Valdorien
  river([[170, 520], [200, 600], [240, 650], [300, 690], [360, 700], [430, 705]], 1, 3);                       // Naggaroth
  // roads
  road([[1480, 205], [1515, 260], [1520, 320], [1560, 400], [1600, 470], [1630, 545], [1680, 590], [1720, 615], [1765, 655], [1800, 690]]);
  road([[1600, 470], [1650, 410], [1700, 350], [1740, 300], [1770, 250], [1820, 215], [1865, 190]]);
  road([[1560, 400], [1600, 400]]);
  road([[1800, 690], [1850, 690], [1890, 690], [1860, 760], [1830, 840], [1790, 910], [1770, 960]]);
  road([[210, 560], [240, 640], [260, 700]]); road([[210, 560], [330, 500], [420, 460], [500, 440]]); road([[210, 560], [150, 510], [95, 470]]); road([[210, 560], [190, 430], [160, 300], [250, 200], [340, 140]]);
  road([[440, 1200], [560, 1230], [700, 1240]]); road([[440, 1200], [560, 1130], [700, 1110], [800, 1020], [900, 930], [960, 880]]); road([[440, 1200], [470, 1320], [520, 1420]]); road([[440, 1200], [300, 1300], [180, 1390], [130, 1420]]);
  road([[1310, 1300], [1400, 1210], [1520, 1190], [1650, 1210], [1780, 1240]]); road([[1780, 1240], [1720, 1330], [1660, 1390]]);
  // clip to land
  const mask = document.createElement("canvas"); mask.width = IMG_W; mask.height = IMG_H;
  const mc = mask.getContext("2d"), md = mc.createImageData(IMG_W, IMG_H);
  for (let i = 0, n = IMG_W * IMG_H; i < n; i++) { const r = LAND[i * 4], gg = LAND[i * 4 + 1], b = LAND[i * 4 + 2]; md.data[i * 4 + 3] = (b > r + 10 && (r + gg + b) / 3 < 175) ? 0 : 255; }
  mc.putImageData(md, 0, 0);
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = "destination-in"; g.drawImage(mask, 0, 0); g.globalCompositeOperation = "source-over";
  setup(mainCtx, IMG_W, IMG_H);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(ground, 0, 0); ctx.restore();

  // ===== Chaos border tint (right edge, behind the mountains) =====
  ctx.save(); ctx.globalCompositeOperation = "multiply";
  const cg = ctx.createLinearGradient(2000, 0, 1915, 0); cg.addColorStop(0, "rgba(120,30,40,.75)"); cg.addColorStop(1, "rgba(120,30,40,0)");
  ctx.fillStyle = cg; ctx.fillRect(1915, 0, 85, 560); ctx.restore();
  glow(2010, 260, 120, "#c0302a", 0.28);

  // ===== Sword Coast =====
  // Spine of the World
  { const r = rng(21); for (let x = 1285; x <= 1895; x += 15 + r() * 22) { for (const row of [0, 1]) { if (row === 1 && r() < 0.45) continue; const xx = x + row * 11 + r() * 6, y = 138 + row * 18 + Math.sin(x / 55) * 7 + r() * 6; if (!isLand(xx, y)) continue; const w = (row ? 22 : 30) + r() * 20, h = (row ? 16 : 26) + r() * 20; add(y, () => mountain(xx, y, w, h, { fill: row ? "#9a8f7e" : "#a49d92", shade: row ? "#6a604f" : "#6f685e", snow: !row && h > 32 })); } } }
  // Sword Mountains between Luskan and Neverwinter (small)
  { const r = rng(22); for (const [x, y] of [[1545, 255], [1565, 270], [1530, 238]]) add(y, () => mountain(x, y, 22 + r() * 6, 18 + r() * 6, {})); }
  add(262, () => volcano(1660, 262, 34, 30));
  // Forests
  scatter(1630, 300, 62, 34, 9, null, (x, y, v) => (v < 0.6 ? oak(x, y, 11, "#4f6f2c") : pine(x, y, 12, "#3a5a2c")), 31);       // Neverwinter Wood
  scatter(1770, 450, 110, 70, 8.5, (x, y) => noise(x, y, 7) > -0.9, (x, y, v) => (v < 0.85 ? oak(x, y, 10 + v * 5, v < 0.35 ? "#45652a" : v < 0.7 ? "#557532" : "#64803a") : pine(x, y, 13, "#35532a")), 32);             // High Forest
  scatter(1850, 600, 40, 26, 9, null, (x, y, v) => oak(x, y, 10, "#566f2f"), 33);                                                // Cloak Wood
  scatter(1600, 70, 120, 32, 14, (x, y) => isLand(x, y), (x, y, v) => pine(x, y, 10, "#3d5a3a", true), 34);                       // Icewind Dale pines
  // Settlements
  add(205, () => { city(1480, 197, 0.8, "sword", 1); ship(1450, 222, 4, "#3a3a3a"); });
  add(320, () => city(1522, 312, 0.95, "sword", 2));
  add(400, () => village(1600, 396, 6, [PAL.roofRed, PAL.roofBrown], 3));
  add(350, () => village(1700, 346, 6, [PAL.roofBrown, PAL.roofSlate], 4));
  add(470, () => { city(1602, 460, 1.25, "sword", 5); ship(1560, 492, 5); ship(1540, 470, 3.5, "#8a2b2b"); });
  add(545, () => village(1630, 540, 6, [PAL.roofRed, PAL.roofBrown], 6, { tower: true }));
  add(615, () => { city(1722, 606, 1.15, "sword", 7); ship(1685, 640, 4.5); });
  add(690, () => candlekeep(1800, 690));
  add(250, () => city(1770, 243, 0.9, "elven", 8));
  add(200, () => dwarfGate(1865, 192));
  add(80, () => village(1700, 76, 7, [PAL.roofBrown, "#6b5a4a"], 9, { tower: true }));
  // Chaoswacht beacons along the border range
  for (const [x, y] of [[1945, 250], [1950, 335], [1942, 420], [1948, 500]]) add(y, () => beaconTower(x, y));

  // ===== Calimshan =====
  { const r = rng(41); for (let i = 0; i < 160; i++) { const x = 1720 + r() * 280, y = 640 + r() * 370; if (!isSand(x, y) || !free(x, y)) continue; const w = 16 + r() * 16; add(y, () => dune(x, y, w)); } }
  { const r = rng(42); for (let i = 0; i < 18; i++) { const x = 1855 + r() * 60, y = 895 + r() * 45; if (!isLand(x, y)) continue; const w = 12 + r() * 12; add(y, () => glassDune(x, y, w)); } }
  add(690, () => city(1890, 683, 0.85, "calim", 10));
  add(960, () => { city(1772, 952, 1.15, "calim", 11); ship(1730, 985, 4.5, "#d9b86a"); });
  add(850, () => { brassDome(1962, 852, 11); columns(1940, 862, 4, 4.5, "#d8c49a"); });
  add(800, () => { for (const [dx, dy] of [[0, 0], [8, 3], [-7, 4], [3, 7]]) palm(1835 + dx, 795 + dy, 12); ctx.beginPath(); ctx.ellipse(1836, 803, 9, 3.5, 0, 0, 7); fill("#6aa7b4"); stroke(0.8); });

  // ===== Naggaroth =====
  { const r = rng(51); for (let i = 0; i < 70; i++) { const x = 10 + r() * 420, y = 70 + r() * 360; if (!landAround(x, y, 5) || !free(x, y)) continue; const [pr, pg, pb] = px(x, y); if (pg > pr + 8) continue; const v = r(); add(y, () => (v < 0.6 ? deadTree(x, y, 9 + v * 4) : pine(x, y, 10, "#3a4a3e", true))); } }
  scatter(310, 610, 80, 40, 8.5, null, (x, y, v) => pine(x, y, 11 + v * 2, v < 0.5 ? "#1f2f26" : "#2a3a2c"), 52);    // dark pine forest
  scatter(120, 640, 55, 45, 9, null, (x, y, v) => pine(x, y, 11, "#24352a"), 53);
  scatter(420, 560, 45, 30, 9, null, (x, y, v) => pine(x, y, 11, "#24352a"), 54);
  { const r = rng(55); for (const [x, y] of [[60, 420], [150, 405], [240, 400], [110, 395], [200, 385]]) add(y, () => mountain(x, y, 30 + r() * 10, 30 + r() * 12, { fill: "#a29ca3", shade: "#66606a", snow: true })); }
  add(560, () => city(212, 550, 1.25, "dark", 12));
  add(300, () => needleTower(160, 300));
  add(140, () => city(340, 134, 0.8, "dark", 13));
  add(440, () => city(498, 432, 0.9, "dark", 14));
  add(470, () => city(96, 464, 0.8, "dark", 15));
  add(700, () => { city(262, 692, 0.95, "dark", 16); for (const [x, y] of [[245, 676], [280, 680]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 20); stroke(0.8); ctx.beginPath(); ctx.moveTo(x, y - 20); ctx.lineTo(x + 6, y - 17); ctx.lineTo(x, y - 14); fill("#a01e2a"); } });
  add(480, () => blackArk(585, 478, 8));
  add(520, () => ship(640, 530, 3.5, "#3a2a40"));

  // ===== Zul'Rakar jungle =====
  scatter(1560, 1260, 330, 230, 9, (x, y) => isGreen(x, y) && noise(x, y, 3) > -0.45, (x, y, v) => (v < 0.82 ? jungleTree(x, y, 10 + v * 6, v < 0.3 ? "#2c5623" : v < 0.6 ? "#3a6629" : "#4a7531") : palm(x, y, 13)), 61);
  { const r = rng(62); for (let i = 0; i < 26; i++) { const x = 1270 + r() * 700, y = 1030 + r() * 460; if (!landAround(x, y, 5) || !free(x, y)) continue; add(y, () => palm(x, y, 12)); } }
  add(1240, () => ziggurat(1780, 1236, 26, { stone: "#d1a83e", dark: "#8f6f25", roof: "#3f8a6a", glow: "#ffd36a" }));
  add(1300, () => { village(1316, 1296, 9, ["#8a8f93", "#a0643a", "#6f7f5a"], 17, { wall: "#a98a62" }); for (const [x, y, l] of [[1280, 1300, 20], [1284, 1318, 16]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - l, y + 2); stroke(3.2); stroke(2, PAL.wood); } ship(1250, 1318, 4.5, "#c9a03c"); ship(1262, 1282, 3.6, "#7a3a2a"); tower(1335, 1290, 3, 14, { wall: PAL.wood, roof: "#8a8f93", top: "cone" }); });
  add(1210, () => ziggurat(1400, 1208, 18, { stone: "#8f9686", dark: "#4f5a46", roof: "#5a6a4a", vines: true }));
  add(1390, () => crater(1660, 1388, 22));
  add(1440, () => caveEntrance(1800, 1440, 9));
  add(1000, () => { for (const [dx, dy] of [[-8, 4], [6, 0], [14, 6]]) palm(1490 + dx, 985 + dy, 11); ship(1450, 1000, 3.6, "#2a2a2a"); });

  // ===== Valdorien =====
  { const r = rng(71); for (const [x, y] of [[580, 1060], [610, 1085], [705, 1075], [735, 1050]]) add(y, () => mountain(x, y, 30 + r() * 8, 22 + r() * 8, { fill: "#9b917f", shade: "#6c6253" })); }
  add(950, () => dragon(735, 945, 16));
  scatter(250, 1010, 90, 50, 9, null, (x, y, v) => oak(x, y, 11 + v * 2, v < 0.5 ? "#557a30" : "#4a6c2b"), 72);
  scatter(820, 1100, 60, 35, 9, null, (x, y, v) => oak(x, y, 11, "#587a32"), 73);
  scatter(300, 1380, 80, 40, 9, null, (x, y, v) => (v < 0.6 ? oak(x, y, 11, "#5a7b30") : pine(x, y, 11, "#3c5c2e")), 74);
  scatter(150, 880, 60, 40, 10, null, (x, y, v) => pine(x, y, 11, "#3c5c2e"), 75);
  add(1200, () => city(442, 1190, 1.25, "white", 18));
  add(880, () => { city(958, 874, 0.7, "white", 19); lighthouse(985, 872, 5); });
  add(1240, () => { city(700, 1232, 0.95, "white", 20); ship(780, 1250, 4.5); ship(770, 1220, 3.4, "#3f5f8f"); });
  add(1420, () => titanHead(130, 1418, 12));
  add(1120, () => mist(250, 1110, 70));

  // ===== Sea and islands =====
  scatter(1180, 430, 230, 230, 13, (x, y) => noise(x, y, 5) > -0.2, (x, y, v) => (v < 0.6 ? oak(x, y, 10, "#4f7a33") : pine(x, y, 10, "#3a5a2c")), 81);  // Moonshae forests
  add(330, () => { tower(1156, 330, 5, 14, { top: "crenel" }); tower(1166, 332, 4, 18, { top: "cone", roof: PAL.roofBlue, flag: "#3f6a3a" }); house(1148, 334, 5, PAL.roofSlate); });
  add(350, () => moonwell(1000, 352));
  add(745, () => whirlpool(578, 750, 26));
  add(1300, () => lighthouse(942, 1300, 5));
  add(380, () => compass(720, 380, 34));
  add(900, () => serpent(1150, 900, 6));
  add(760, () => ship(1100, 760, 5));
  add(620, () => ship(760, 640, 4.5, "#8a2b2b"));
  add(1120, () => ship(1180, 1120, 4.5));
  add(900, () => ship(420, 890, 4));

  // ===== World trees (last within their rows) =====
  const TREES = {
    elarion: { dark: "#2f6b2e", mid: "#4f8f3a", light: "#9fcb5e", glow: "#f5e7a0", trunk: "#5a4030" },
    dorn: { dark: "#24152a", mid: "#45204c", light: "#7a3a6a", glow: "#b0306a", trunk: "#1e1a1f", extra: "thorns" },
    zand: { dark: "#1d4a20", mid: "#2e7531", light: "#62ad4a", glow: "#d2f5a6", trunk: "#5b4630", extra: "lanterns" },
    liane: { dark: "#21522a", mid: "#3a8040", light: "#74b85d", glow: "#dcf7ae", trunk: "#5a4a32", extra: "vines" },
    valdr: { dark: "#6a5320", mid: "#a5812c", light: "#e0b84e", glow: "#ffe9a8", trunk: "#4e3b2c", extra: "gold" },
    silber: { dark: "#76878f", mid: "#b2c2ca", light: "#f2f8fb", glow: "#e6f3ff", trunk: "#9aa1a6", extra: "silver" },
  };
  add(380, () => worldTree(1830, 380, 120, TREES.elarion, 101));
  add(760, () => worldTree(110, 760, 105, TREES.dorn, 102));
  add(1330, () => worldTree(1500, 1330, 125, TREES.zand, 103));
  add(1110, () => worldTree(1880, 1110, 100, TREES.liane, 104));
  add(1420, () => worldTree(520, 1420, 125, TREES.valdr, 105));
  add(960, () => worldTree(820, 960, 100, TREES.silber, 106));

  sprites.sort((a, b) => a.y - b.y);
  for (const s of sprites) s.fn();
}
