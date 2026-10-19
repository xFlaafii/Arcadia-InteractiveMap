// Drawing helpers for the illustrated Arcadia map.
// All coordinates are in a 2000 x 1500 design space; the context is scaled to the real image size.
"use strict";

const INK = "#2a2118";
const PAL = {
  stone: "#aaa397", stoneD: "#7c766c", paving: "#b9ab8c",
  roofRed: "#9a4a33", roofBrown: "#7b5537", roofSlate: "#59626c", roofBlue: "#4a6684",
  roofGold: "#c8a03c", roofPurple: "#5b2f60", white: "#ebe5d5", sand: "#dcc591", sandD: "#b99d66",
  dark: "#2e2a33", darkL: "#4a4453", wood: "#7a5634", woodD: "#56391f",
};

let ctx, IMG_W, IMG_H, K, LAND = null;

function setup(c, w, h) {
  ctx = c; IMG_W = w; IMG_H = h; K = w / 2000;
  ctx.setTransform(K, 0, 0, K, 0, 0);
  ctx.lineJoin = "round"; ctx.lineCap = "round";
}

// ---------- seeded random ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
let R = rng(7);
const rr = (a, b) => a + R() * (b - a);
const pick = (arr) => arr[Math.floor(R() * arr.length)];

// ---------- terrain lookup from the base image ----------
function px(x, y) {
  const ix = Math.max(0, Math.min(IMG_W - 1, Math.round(x * K))), iy = Math.max(0, Math.min(IMG_H - 1, Math.round(y * K)));
  const i = (iy * IMG_W + ix) * 4; return [LAND[i], LAND[i + 1], LAND[i + 2]];
}
function isWater(x, y) { const [r, g, b] = px(x, y); return b > r + 10 && (r + g + b) / 3 < 175; }
function isLand(x, y) { return !isWater(x, y); }
function landAround(x, y, d) { return isLand(x, y) && isLand(x + d, y) && isLand(x - d, y) && isLand(x, y + d) && isLand(x, y - d); }
function isGreen(x, y) { const [r, g, b] = px(x, y); return g > b + 12 && r < 175 && (r + g + b) / 3 < 160; }
function isSand(x, y) { const [r, g, b] = px(x, y); return r > 165 && g > 135 && b < 150 && r > b + 40; }

// ---------- basics ----------
function stroke(w, color = INK) { ctx.lineWidth = w; ctx.strokeStyle = color; ctx.stroke(); }
function fill(color) { ctx.fillStyle = color; ctx.fill(); }
function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
function softShadow(x, y, rx, ry, a = 0.35) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(30,24,16,${a})`); g.addColorStop(1, "rgba(30,24,16,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function glow(x, y, r, color, a = 0.5) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(color, a)); g.addColorStop(1, hexA(color, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function smoothPath(pts) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
  const l = pts[pts.length - 1]; ctx.lineTo(l[0], l[1]);
}
function wiggle(pts, amt, steps = 4) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
    for (let s = 1; s <= steps; s++) { const t = s / steps; out.push(s === steps ? [bx, by] : [ax + (bx - ax) * t + rr(-amt, amt), ay + (by - ay) * t + rr(-amt, amt)]); }
  }
  return out;
}

// ---------- vegetation ----------
function oak(x, y, s, c = "#5c7a33") {
  ctx.fillStyle = PAL.woodD; ctx.fillRect(x - s * 0.06, y - s * 0.35, s * 0.12, s * 0.35);
  const blobs = [[0, -0.62, 0.3], [-0.2, -0.5, 0.22], [0.2, -0.5, 0.22]];
  for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(x + bx * s, y + by * s, br * s, 0, 7); stroke(s * 0.09); }
  for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(x + bx * s, y + by * s, br * s, 0, 7); fill(c); }
  ctx.beginPath(); ctx.arc(x - s * 0.07, y - s * 0.7, s * 0.13, 0, 7); fill(shade(c, 0.25));
}
function pine(x, y, s, c = "#3c5a2f", snow = false) {
  ctx.fillStyle = PAL.woodD; ctx.fillRect(x - s * 0.05, y - s * 0.2, s * 0.1, s * 0.2);
  for (let i = 0; i < 3; i++) {
    const top = y - s * (0.55 + i * 0.22), base = y - s * (0.15 + i * 0.22), w = s * (0.36 - i * 0.08);
    ctx.beginPath(); ctx.moveTo(x - w, base); ctx.lineTo(x, top); ctx.lineTo(x + w, base); ctx.closePath();
    fill(i === 2 && snow ? "#eef3f5" : c); stroke(s * 0.06);
    if (snow && i < 2) { ctx.beginPath(); ctx.moveTo(x - w * 0.35, top + (base - top) * 0.35); ctx.lineTo(x, top); ctx.lineTo(x + w * 0.35, top + (base - top) * 0.35); ctx.closePath(); fill("#eef3f5"); }
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x + w, base); ctx.lineTo(x + w * 0.2, base); ctx.closePath(); fill("rgba(0,0,0,.18)");
  }
}
function deadTree(x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - s * 0.8);
  ctx.moveTo(x, y - s * 0.45); ctx.lineTo(x - s * 0.25, y - s * 0.7); ctx.moveTo(x, y - s * 0.55); ctx.lineTo(x + s * 0.28, y - s * 0.85);
  ctx.moveTo(x, y - s * 0.75); ctx.lineTo(x - s * 0.12, y - s * 0.95);
  stroke(s * 0.08, "#3b3530");
}
function palm(x, y, s) {
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.5, x + s * 0.05, y - s * 0.9); stroke(s * 0.1, "#6b5032");
  const tx = x + s * 0.05, ty = y - s * 0.9;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i - 2.5) * 0.55;
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * s * 0.35, ty + Math.sin(a) * s * 0.35 - s * 0.1, tx + Math.cos(a) * s * 0.5, ty + Math.sin(a) * s * 0.5 + s * 0.12);
    stroke(s * 0.12, INK); stroke(s * 0.08, "#4f8a35");
  }
}
function jungleTree(x, y, s, c = "#2f5d25") {
  ctx.fillStyle = PAL.woodD; ctx.fillRect(x - s * 0.06, y - s * 0.3, s * 0.12, s * 0.3);
  const blobs = [[0, -0.6, 0.32], [-0.28, -0.48, 0.24], [0.28, -0.48, 0.24], [-0.12, -0.8, 0.2], [0.15, -0.78, 0.2]];
  for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(x + bx * s, y + by * s, br * s, 0, 7); stroke(s * 0.08); }
  for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(x + bx * s, y + by * s, br * s, 0, 7); fill(c); }
  ctx.beginPath(); ctx.arc(x - s * 0.1, y - s * 0.82, s * 0.12, 0, 7); fill(shade(c, 0.3));
  ctx.beginPath(); ctx.arc(x + s * 0.2, y - s * 0.55, s * 0.1, 0, 7); fill(shade(c, 0.15));
  if (R() < 0.35) { ctx.beginPath(); ctx.moveTo(x - s * 0.25, y - s * 0.4); ctx.quadraticCurveTo(x - s * 0.3, y - s * 0.2, x - s * 0.22, y - s * 0.1); stroke(s * 0.04, "#3f6a2a"); }
}
function bush(x, y, s, c) { ctx.beginPath(); ctx.arc(x, y - s * 0.3, s * 0.3, Math.PI, 0); ctx.closePath(); fill(c); stroke(s * 0.07); }

// ---------- mountains ----------
function mountain(x, y, w, h, o = {}) {
  const fillC = o.fill || "#9b907c", sh = o.shade || "#6c6253";
  const px_ = x + rr(-w * 0.08, w * 0.08), py = y - h;
  softShadow(x + w * 0.1, y, w * 0.6, w * 0.15, 0.25);
  ctx.beginPath(); ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w * 0.25, y - h * 0.45 + rr(-2, 2)); ctx.lineTo(px_ - w * 0.08, py + h * 0.15); ctx.lineTo(px_, py);
  ctx.lineTo(px_ + w * 0.12, py + h * 0.2); ctx.lineTo(x + w * 0.28, y - h * 0.5); ctx.lineTo(x + w / 2, y); ctx.closePath();
  fill(fillC);
  ctx.save(); ctx.clip();
  ctx.beginPath(); ctx.moveTo(px_, py); ctx.lineTo(px_ + w * 0.12, py + h * 0.2); ctx.lineTo(x + w * 0.28, y - h * 0.5); ctx.lineTo(x + w / 2, y); ctx.lineTo(px_ + w * 0.05, y); ctx.lineTo(px_ - w * 0.02, py + h * 0.5); ctx.closePath(); fill(sh);
  if (o.snow) { ctx.beginPath(); ctx.moveTo(px_, py); ctx.lineTo(px_ - w * 0.16, py + h * 0.32); ctx.lineTo(px_ - w * 0.05, py + h * 0.26); ctx.lineTo(px_ + w * 0.02, py + h * 0.36); ctx.lineTo(px_ + w * 0.18, py + h * 0.3); ctx.closePath(); fill("#eef2f2"); }
  for (let i = 0; i < 4; i++) { const t = 0.35 + i * 0.15; ctx.beginPath(); ctx.moveTo(px_ + w * 0.05 + t * w * 0.3, py + h * t); ctx.lineTo(px_ + w * 0.02 + t * w * 0.18, py + h * (t + 0.18)); stroke(w * 0.018 + 0.2, "rgba(42,33,24,.45)"); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(x - w / 2, y);
  ctx.lineTo(x - w * 0.25, y - h * 0.45); ctx.lineTo(px_ - w * 0.08, py + h * 0.15); ctx.lineTo(px_, py);
  ctx.lineTo(px_ + w * 0.12, py + h * 0.2); ctx.lineTo(x + w * 0.28, y - h * 0.5); ctx.lineTo(x + w / 2, y); stroke(Math.max(0.6, w * 0.035));
  ctx.beginPath(); ctx.moveTo(px_, py + h * 0.05); ctx.lineTo(px_ - w * 0.02, py + h * 0.5); stroke(w * 0.02, "rgba(42,33,24,.6)");
}
function volcano(x, y, w, h) {
  mountain(x, y, w, h, { fill: "#7b6a5a", shade: "#54473b" });
  ctx.beginPath(); ctx.ellipse(x, y - h + 2, w * 0.1, w * 0.035, 0, 0, 7); fill("#d4502a");
  glow(x, y - h, w * 0.3, "#ff7a2a", 0.45);
  for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + i * w * 0.06 + rr(-2, 2), y - h - 6 - i * w * 0.09, w * (0.06 + i * 0.02), 0, 7); fill(`rgba(70,64,60,${0.45 - i * 0.07})`); }
}

// ---------- buildings ----------
function house(x, y, s, roof, wall = "#d9cdb2") {
  ctx.beginPath(); ctx.rect(x - s / 2, y - s * 0.55, s, s * 0.55); fill(wall); stroke(s * 0.1);
  ctx.beginPath(); ctx.moveTo(x - s * 0.62, y - s * 0.5); ctx.lineTo(x - s * 0.15, y - s * 1.05); ctx.lineTo(x + s * 0.15, y - s * 1.05); ctx.lineTo(x + s * 0.62, y - s * 0.5); ctx.closePath(); fill(roof); stroke(s * 0.1);
  ctx.beginPath(); ctx.moveTo(x + s * 0.15, y - s * 1.05); ctx.lineTo(x + s * 0.62, y - s * 0.5); ctx.lineTo(x + s * 0.1, y - s * 0.5); ctx.closePath(); fill("rgba(0,0,0,.18)");
  ctx.fillStyle = "#3a2c20"; ctx.fillRect(x - s * 0.08, y - s * 0.28, s * 0.16, s * 0.28);
}
function flatHouse(x, y, s, wall) {
  ctx.beginPath(); ctx.rect(x - s / 2, y - s * 0.7, s, s * 0.7); fill(wall); stroke(s * 0.1);
  ctx.fillStyle = "rgba(0,0,0,.15)"; ctx.fillRect(x + s * 0.15, y - s * 0.7, s * 0.35, s * 0.7);
  ctx.fillStyle = "#4a3726"; ctx.fillRect(x - s * 0.25, y - s * 0.45, s * 0.12, s * 0.15); ctx.fillRect(x + s * 0.05, y - s * 0.45, s * 0.12, s * 0.15);
}
function tower(x, y, w, h, o = {}) {
  const wall = o.wall || PAL.stone, roof = o.roof || PAL.roofSlate, top = o.top || "cone";
  ctx.beginPath(); ctx.rect(x - w / 2, y - h, w, h); fill(wall); stroke(w * 0.12);
  ctx.fillStyle = "rgba(0,0,0,.18)"; ctx.fillRect(x + w * 0.1, y - h, w * 0.4, h);
  ctx.fillStyle = o.window || "#2b2018"; ctx.fillRect(x - w * 0.1, y - h * 0.7, w * 0.2, h * 0.12);
  if (top === "cone") { ctx.beginPath(); ctx.moveTo(x - w * 0.65, y - h); ctx.lineTo(x, y - h - w * 1.4); ctx.lineTo(x + w * 0.65, y - h); ctx.closePath(); fill(roof); stroke(w * 0.12); }
  else if (top === "spire") { ctx.beginPath(); ctx.moveTo(x - w * 0.55, y - h); ctx.lineTo(x, y - h - w * 2.8); ctx.lineTo(x + w * 0.55, y - h); ctx.closePath(); fill(roof); stroke(w * 0.12); }
  else if (top === "dome") { ctx.beginPath(); ctx.arc(x, y - h, w * 0.6, Math.PI, 0); ctx.closePath(); fill(roof); stroke(w * 0.12); ctx.beginPath(); ctx.moveTo(x, y - h - w * 0.6); ctx.lineTo(x, y - h - w * 1.1); stroke(w * 0.1); }
  else if (top === "crenel") { for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.rect(x + i * w * 0.36 - w * 0.13, y - h - w * 0.3, w * 0.26, w * 0.3); fill(wall); stroke(w * 0.1); } }
  else if (top === "spikes") { for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(x + i * w * 0.36 - w * 0.15, y - h); ctx.lineTo(x + i * w * 0.36, y - h - w * (i === 0 ? 2.4 : 1.2)); ctx.lineTo(x + i * w * 0.36 + w * 0.15, y - h); ctx.closePath(); fill(roof); stroke(w * 0.08); } }
  if (o.flag) { ctx.beginPath(); ctx.moveTo(x, y - h - w * 1.4); ctx.lineTo(x, y - h - w * 2.2); stroke(w * 0.08); ctx.beginPath(); ctx.moveTo(x, y - h - w * 2.2); ctx.lineTo(x + w * 0.7, y - h - w * 2); ctx.lineTo(x, y - h - w * 1.8); fill(o.flag); }
}
function domeBuilding(x, y, s, wall, domeC) {
  ctx.beginPath(); ctx.rect(x - s / 2, y - s * 0.6, s, s * 0.6); fill(wall); stroke(s * 0.09);
  ctx.beginPath(); ctx.arc(x, y - s * 0.6, s * 0.42, Math.PI, 0); ctx.closePath(); fill(domeC); stroke(s * 0.09);
  ctx.beginPath(); ctx.arc(x - s * 0.12, y - s * 0.78, s * 0.12, 0, 7); fill("rgba(255,255,255,.35)");
  ctx.beginPath(); ctx.moveTo(x, y - s * 1.02); ctx.lineTo(x, y - s * 1.25); stroke(s * 0.07);
}
function minaret(x, y, s, wall, domeC) {
  ctx.beginPath(); ctx.rect(x - s * 0.12, y - s * 1.6, s * 0.24, s * 1.6); fill(wall); stroke(s * 0.07);
  ctx.beginPath(); ctx.rect(x - s * 0.2, y - s * 1.25, s * 0.4, s * 0.08); fill(wall); stroke(s * 0.05);
  ctx.beginPath(); ctx.arc(x, y - s * 1.6, s * 0.16, Math.PI, 0); ctx.closePath(); fill(domeC); stroke(s * 0.06);
}

// city styles
const STYLES = {
  sword: { wall: PAL.stone, ground: "#b8a989", roofs: [PAL.roofRed, PAL.roofBrown, "#8b3d2b", PAL.roofSlate], walls: ["#ddd1b6", "#cfc1a2", "#e3d8c0"], tower: { wall: PAL.stone, roof: PAL.roofSlate, top: "cone", flag: "#8a2b2b" } },
  elven: { wall: "#d9d6cc", ground: "#c2bca8", roofs: ["#4f6f8f", "#6a8fb0", "#5d7f6a"], walls: ["#ece8dc", "#e2ded2"], tower: { wall: "#e4e1d8", roof: "#4a6e94", top: "spire", flag: "#cfd8e8" } },
  white: { wall: PAL.white, ground: "#d0c6a8", roofs: [PAL.roofGold, "#3f5f8f", "#b8873a", "#3f5f8f"], walls: ["#f1ecdf", "#e8e1cf"], tower: { wall: PAL.white, roof: "#3f5f8f", top: "cone", flag: "#c8a03c" } },
  dark: { wall: PAL.dark, ground: "#8a8290", roofs: [PAL.roofPurple, "#3b2240", "#6e2a3a"], walls: [PAL.darkL, "#3d3845", "#55505c"], tower: { wall: PAL.darkL, roof: PAL.roofPurple, top: "spire", window: "#d6463a" } },
  calim: { wall: PAL.sandD, ground: "#cdb582", domes: ["#f1ede2", "#d4a43a", "#4f9a94", "#e6dcc6"], walls: [PAL.sand, "#e6d4a6", "#cfb27a"] },
};

function city(cx, cy, scale, styleName, seed = 1) {
  R = rng(seed * 977 + 13);
  const st = STYLES[styleName], rx = 24 * scale, ry = 14 * scale;
  softShadow(cx, cy + 2, rx * 1.15, ry * 1.1, 0.35);
  ctx.save(); ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); fill(st.ground); ctx.restore(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); stroke(0.8, "rgba(42,33,24,.5)");
  const wallW = 2.4 * scale;
  // back wall
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, Math.PI * 2); stroke(wallW + 1.6); stroke(wallW, st.wall);
  // buildings
  const items = [];
  const n = Math.round(14 * scale * scale + 6);
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 0.82;
    items.push({ x: cx + Math.cos(a) * rx * d, y: cy + Math.sin(a) * ry * d, kind: "h", s: rr(4.2, 6) * Math.sqrt(scale) });
  }
  const towers = Math.round(1 + scale * 2);
  for (let i = 0; i < towers; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * 0.6; items.push({ x: cx + Math.cos(a) * rx * d, y: cy + Math.sin(a) * ry * d, kind: "t" }); }
  items.push({ x: cx, y: cy - ry * 0.15, kind: "keep" });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) {
    if (styleName === "calim") {
      if (it.kind === "h") (R() < 0.3 ? domeBuilding(it.x, it.y, it.s * 1.05, pick(st.walls), pick(st.domes)) : flatHouse(it.x, it.y, it.s, pick(st.walls)));
      else if (it.kind === "t") minaret(it.x, it.y, 7 * Math.sqrt(scale), "#ece0c2", pick(st.domes));
      else domeBuilding(it.x, it.y, 13 * Math.sqrt(scale), "#efe6cf", "#d4a43a");
    } else {
      if (it.kind === "h") house(it.x, it.y, it.s, pick(st.roofs), pick(st.walls));
      else if (it.kind === "t") tower(it.x, it.y, 3.6 * Math.sqrt(scale), rr(9, 13) * Math.sqrt(scale), st.tower);
      else {
        const s = Math.sqrt(scale);
        if (styleName === "dark") { tower(it.x - 5 * s, it.y, 5 * s, 16 * s, { ...st.tower, top: "spikes" }); tower(it.x + 4 * s, it.y + 1, 4 * s, 22 * s, st.tower); }
        else { ctx.beginPath(); ctx.rect(it.x - 7 * s, it.y - 9 * s, 14 * s, 9 * s); fill(st.wall); stroke(1.1 * s); tower(it.x - 6 * s, it.y, 4.5 * s, 15 * s, st.tower); tower(it.x + 6 * s, it.y, 4.5 * s, 13 * s, st.tower); tower(it.x, it.y - 1, 5 * s, 19 * s, { ...st.tower, top: styleName === "elven" ? "spire" : "crenel" }); }
      }
    }
  }
  // front wall with crenels and gate towers
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI); stroke(wallW + 1.6); stroke(wallW, st.wall);
  for (let a = 0.15; a < Math.PI; a += 0.32) { const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; ctx.fillStyle = st.wall; ctx.fillRect(x - 0.9 * scale, y - wallW * 0.9, 1.8 * scale, 1.4 * scale); }
  if (styleName !== "calim") { tower(cx - rx * 0.92, cy + 2, 4 * Math.sqrt(scale), 8 * Math.sqrt(scale), { ...st.tower, top: styleName === "dark" ? "spikes" : "crenel" }); tower(cx + rx * 0.92, cy + 2, 4 * Math.sqrt(scale), 8 * Math.sqrt(scale), { ...st.tower, top: styleName === "dark" ? "spikes" : "crenel" }); }
  else { minaret(cx - rx * 0.9, cy + 2, 6 * Math.sqrt(scale), "#ece0c2", "#d4a43a"); minaret(cx + rx * 0.9, cy + 2, 6 * Math.sqrt(scale), "#ece0c2", "#4f9a94"); }
  if (styleName === "dark") glow(cx, cy - ry, rx * 1.1, "#8a2a6a", 0.12);
  R = rng(seed * 31 + 5);
}
function village(cx, cy, n, roofs, seed = 3, opts = {}) {
  R = rng(seed * 131 + 7);
  softShadow(cx, cy + 2, 14 + n, 6 + n * 0.4, 0.25);
  const items = [];
  for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()); items.push({ x: cx + Math.cos(a) * (8 + n) * d, y: cy + Math.sin(a) * (4 + n * 0.5) * d }); }
  if (opts.tower) items.push({ x: cx + 2, y: cy - 3, t: true });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.t ? tower(it.x, it.y, 3.6, 11, { top: "cone", roof: PAL.roofSlate }) : house(it.x, it.y, rr(4.5, 5.8), pick(roofs), opts.wall || "#d9cdb2");
}

// ---------- special landmarks ----------
function candlekeep(x, y) {
  softShadow(x, y + 2, 22, 7, 0.35);
  ctx.beginPath(); ctx.moveTo(x - 22, y + 2); ctx.lineTo(x - 15, y - 10); ctx.lineTo(x + 12, y - 12); ctx.lineTo(x + 22, y + 2); ctx.closePath(); fill("#8f8576"); stroke(1.2);
  house(x - 9, y - 9, 5, PAL.roofSlate); house(x + 10, y - 10, 5, PAL.roofSlate);
  tower(x, y - 10, 9, 22, { wall: "#cfc6b4", top: "crenel" });
  tower(x, y - 32, 6.5, 14, { wall: "#d6cdbb", top: "cone", roof: PAL.roofSlate });
  glow(x, y - 30, 10, "#ffe08a", 0.35);
}
function dwarfGate(x, y) {
  mountain(x, y + 10, 58, 52, { fill: "#8f8678", shade: "#615a50", snow: true });
  ctx.beginPath(); ctx.moveTo(x - 9, y + 8); ctx.lineTo(x - 9, y - 6); ctx.arc(x, y - 6, 9, Math.PI, 0); ctx.lineTo(x + 9, y + 8); ctx.closePath(); fill("#2a221c"); stroke(1.4, "#c9a03c");
  glow(x, y, 14, "#ffb347", 0.4);
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.rect(x + s * 13 - 3, y - 14, 6, 22); fill("#a39a8b"); stroke(1); ctx.beginPath(); ctx.arc(x + s * 13, y - 17, 3.4, 0, 7); fill("#a39a8b"); stroke(1); }
}
function beaconTower(x, y) {
  softShadow(x, y + 1, 9, 3);
  tower(x, y, 6, 18, { wall: "#5d5650", top: "crenel", window: "#e2783a" });
  glow(x, y - 22, 12, "#ff6a1a", 0.6);
  ctx.beginPath(); ctx.moveTo(x - 2.5, y - 19); ctx.quadraticCurveTo(x - 3, y - 25, x, y - 29); ctx.quadraticCurveTo(x + 3, y - 24, x + 2.5, y - 19); ctx.closePath(); fill("#ff9a3a");
  ctx.beginPath(); ctx.moveTo(x + 3, y - 18); ctx.lineTo(x + 3, y - 34); stroke(0.8); ctx.beginPath(); ctx.moveTo(x + 3, y - 34); ctx.lineTo(x + 10, y - 31); ctx.lineTo(x + 3, y - 28); fill("#8a1f1f");
}
function needleTower(x, y) {
  softShadow(x, y + 2, 14, 5, 0.4);
  ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x - 4, y - 50); ctx.lineTo(x, y - 66); ctx.lineTo(x + 4, y - 50); ctx.lineTo(x + 9, y); ctx.closePath(); fill(PAL.darkL); stroke(1.3);
  ctx.beginPath(); ctx.moveTo(x, y - 66); ctx.lineTo(x + 4, y - 50); ctx.lineTo(x + 9, y); ctx.lineTo(x + 2, y); ctx.closePath(); fill("rgba(0,0,0,.3)");
  for (let i = 0; i < 4; i++) { ctx.fillStyle = "#c04a8a"; ctx.fillRect(x - 1, y - 12 - i * 11, 2, 3); }
  glow(x, y - 62, 18, "#c95be0", 0.55);
  tower(x - 11, y + 2, 4, 10, { wall: PAL.darkL, roof: PAL.roofPurple, top: "spikes" }); tower(x + 11, y + 2, 4, 10, { wall: PAL.darkL, roof: PAL.roofPurple, top: "spikes" });
}
function ship(x, y, s, sail = "#efe6d0") {
  ctx.beginPath(); ctx.moveTo(x - s * 1.2, y + s * 0.4); ctx.quadraticCurveTo(x - s * 1.6, y + s * 0.9, x - s * 2.2, y + s * 0.8); stroke(s * 0.12, "rgba(255,255,255,.55)");
  ctx.beginPath(); ctx.moveTo(x - s, y - s * 0.2); ctx.lineTo(x + s, y - s * 0.2); ctx.quadraticCurveTo(x + s * 0.8, y + s * 0.4, x, y + s * 0.4); ctx.quadraticCurveTo(x - s * 0.8, y + s * 0.4, x - s, y - s * 0.2); fill(PAL.wood); stroke(s * 0.12);
  ctx.beginPath(); ctx.moveTo(x, y - s * 0.2); ctx.lineTo(x, y - s * 1.8); stroke(s * 0.1);
  ctx.beginPath(); ctx.moveTo(x - s * 0.7, y - s * 1.6); ctx.quadraticCurveTo(x - s * 0.5, y - s * 1.0, x - s * 0.7, y - s * 0.45); ctx.lineTo(x + s * 0.7, y - s * 0.45); ctx.quadraticCurveTo(x + s * 0.9, y - s * 1.0, x + s * 0.7, y - s * 1.6); ctx.closePath(); fill(sail); stroke(s * 0.1);
}
function blackArk(x, y, s) {
  softShadow(x, y + s * 0.3, s * 2.4, s * 0.6, 0.45);
  ctx.beginPath(); ctx.moveTo(x - s * 2.6, y + s * 0.6); ctx.quadraticCurveTo(x - s * 3.2, y + s * 1, x - s * 3.8, y + s * 0.9); stroke(s * 0.15, "rgba(255,255,255,.5)");
  ctx.beginPath(); ctx.moveTo(x - s * 2.4, y - s * 0.1); ctx.lineTo(x + s * 2.4, y - s * 0.3); ctx.quadraticCurveTo(x + s * 2, y + s * 0.6, x, y + s * 0.7); ctx.quadraticCurveTo(x - s * 2, y + s * 0.6, x - s * 2.4, y - s * 0.1); fill("#26222b"); stroke(s * 0.1);
  for (const [dx, h, w] of [[-1.5, 1.2, 0.5], [-0.6, 2.0, 0.6], [0.4, 2.8, 0.7], [1.4, 1.6, 0.5]]) tower(x + dx * s, y - s * 0.15, w * s, h * s, { wall: PAL.darkL, roof: PAL.roofPurple, top: "spire", window: "#d6463a" });
  glow(x, y - s, s * 2.5, "#8a2a6a", 0.2);
}
function ziggurat(x, y, s, o = {}) {
  const stone = o.stone || "#c9a443", dark = o.dark || "#8f6f25";
  softShadow(x, y + 2, s * 1.4, s * 0.35, 0.4);
  for (let i = 0; i < 4; i++) {
    const w = s * (2.2 - i * 0.45), h = s * 0.32, by = y - i * h;
    ctx.beginPath(); ctx.moveTo(x - w / 2, by); ctx.lineTo(x - w / 2 + h * 0.4, by - h); ctx.lineTo(x + w / 2 - h * 0.4, by - h); ctx.lineTo(x + w / 2, by); ctx.closePath(); fill(stone); stroke(s * 0.05);
    ctx.beginPath(); ctx.moveTo(x + w * 0.1, by - h); ctx.lineTo(x + w / 2 - h * 0.4, by - h); ctx.lineTo(x + w / 2, by); ctx.lineTo(x + w * 0.15, by); ctx.closePath(); fill(hexA(dark, 0.55));
  }
  ctx.beginPath(); ctx.rect(x - s * 0.12, y - s * 1.28, s * 0.24, s * 1.28); fill(shade(stone, -0.15)); stroke(s * 0.04);
  for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(x - s * 0.12, y - i * s * 0.16); ctx.lineTo(x + s * 0.12, y - i * s * 0.16); stroke(s * 0.02, "rgba(42,33,24,.5)"); }
  ctx.beginPath(); ctx.rect(x - s * 0.3, y - s * 1.28 - s * 0.35, s * 0.6, s * 0.35); fill(shade(stone, 0.1)); stroke(s * 0.05);
  ctx.beginPath(); ctx.moveTo(x - s * 0.38, y - s * 1.63); ctx.lineTo(x, y - s * 1.9); ctx.lineTo(x + s * 0.38, y - s * 1.63); ctx.closePath(); fill(o.roof || "#3f8a6a"); stroke(s * 0.05);
  if (o.vines) for (let i = 0; i < 9; i++) { const vx = x + rr(-s, s), vy = y - rr(0, s); ctx.beginPath(); ctx.moveTo(vx, vy - s * 0.3); ctx.quadraticCurveTo(vx + 2, vy - s * 0.1, vx, vy); stroke(s * 0.06, "#3d6a2c"); }
  if (o.glow) glow(x, y - s * 1.7, s * 1.2, o.glow, 0.35);
}
function crater(x, y, r) {
  ctx.beginPath(); ctx.ellipse(x, y, r * 1.15, r * 0.6, 0, 0, 7); fill("#6e5a44"); stroke(1.2);
  ctx.beginPath(); ctx.ellipse(x, y + 1, r * 0.9, r * 0.45, 0, 0, 7); fill("#3a2a22"); stroke(0.8);
  const g = ctx.createRadialGradient(x, y + 1, 0, x, y + 1, r * 0.85); g.addColorStop(0, "#ffd36a"); g.addColorStop(0.45, "#f0742a"); g.addColorStop(1, "rgba(120,40,20,0)");
  ctx.save(); ctx.translate(x, y + 1); ctx.scale(1, 0.5); ctx.translate(-x, -(y + 1)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y + 1, r * 0.85, 0, 7); ctx.fill(); ctx.restore();
  glow(x, y, r * 2, "#ff7a2a", 0.3);
  for (const [dx, dy, h] of [[-0.7, 0.1, 9], [-0.55, 0.25, 6], [0.65, 0.05, 8], [0.75, 0.25, 5], [0.1, -0.35, 6]]) {
    const cxp = x + dx * r, cyp = y + dy * r;
    ctx.beginPath(); ctx.moveTo(cxp - 2, cyp); ctx.lineTo(cxp, cyp - h); ctx.lineTo(cxp + 2, cyp); ctx.closePath(); fill("#7fe0e8"); stroke(0.6);
  }
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(x + i * 3 - 4, y - 8 - i * 6, 3 + i * 1.5, 0, 7); fill(`rgba(220,220,210,${0.35 - i * 0.07})`); }
}
function columns(x, y, n, s, c = "#cfc4ad") {
  softShadow(x, y + 1, n * s * 0.9, s * 0.5, 0.3);
  for (let i = 0; i < n; i++) { const cx = x + (i - (n - 1) / 2) * s * 1.1, h = s * rr(0.9, 2.4); ctx.beginPath(); ctx.rect(cx - s * 0.22, y - h, s * 0.44, h); fill(c); stroke(s * 0.1); ctx.beginPath(); ctx.moveTo(cx - s * 0.22, y - h); ctx.lineTo(cx, y - h - s * 0.25); ctx.lineTo(cx + s * 0.22, y - h + s * 0.1); stroke(s * 0.1); }
  ctx.beginPath(); ctx.rect(x - n * s * 0.6, y - s * 0.12, n * s * 1.2, s * 0.25); fill(shade(c, -0.15)); stroke(s * 0.08);
}
function brassDome(x, y, s) {
  softShadow(x, y + 1, s * 1.5, s * 0.4, 0.35);
  ctx.beginPath(); ctx.arc(x, y, s, Math.PI, 0); ctx.closePath(); fill("#b98b3a"); stroke(s * 0.08);
  ctx.beginPath(); ctx.moveTo(x + s * 0.1, y - s); ctx.lineTo(x + s * 0.25, y - s * 0.5); ctx.lineTo(x + s * 0.05, y - s * 0.2); ctx.lineTo(x + s * 0.3, y); stroke(s * 0.08);
  ctx.beginPath(); ctx.arc(x - s * 0.35, y - s * 0.6, s * 0.2, 0, 7); fill("rgba(255,240,190,.45)");
  ctx.beginPath(); ctx.moveTo(x - s * 1.4, y); ctx.quadraticCurveTo(x - s * 0.8, y - s * 0.25, x - s * 0.5, y); ctx.moveTo(x + s * 0.6, y); ctx.quadraticCurveTo(x + s, y - s * 0.3, x + s * 1.5, y); stroke(s * 0.1, PAL.sandD);
}
function dune(x, y, w, c = "#b8945a") {
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w * 0.1, y - w * 0.3, x + w / 2, y); ctx.closePath(); fill("rgba(150,110,60,.18)");
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w * 0.1, y - w * 0.3, x + w / 2, y); stroke(w * 0.05, c);
  ctx.beginPath(); ctx.moveTo(x - w * 0.05, y - w * 0.15); ctx.quadraticCurveTo(x + w * 0.2, y - w * 0.12, x + w / 2, y); stroke(w * 0.04, "rgba(90,60,30,.35)");
}
function glassDune(x, y, w) {
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.quadraticCurveTo(x - w * 0.1, y - w * 0.35, x + w / 2, y); ctx.closePath(); fill("rgba(190,235,240,.55)"); stroke(w * 0.04, "rgba(70,120,130,.8)");
  ctx.beginPath(); ctx.moveTo(x - w * 0.15, y - w * 0.12); ctx.lineTo(x - w * 0.05, y - w * 0.2); stroke(w * 0.05, "rgba(255,255,255,.9)");
}
function caveEntrance(x, y, s) {
  ctx.beginPath(); ctx.moveTo(x - s * 1.4, y); ctx.quadraticCurveTo(x - s, y - s * 1.6, x, y - s * 1.7); ctx.quadraticCurveTo(x + s, y - s * 1.6, x + s * 1.4, y); ctx.closePath(); fill("#7d7363"); stroke(s * 0.1);
  ctx.beginPath(); ctx.moveTo(x - s * 0.55, y); ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.95, x, y - s * 0.95); ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.95, x + s * 0.55, y); ctx.closePath(); fill("#1d1714"); stroke(s * 0.08);
  // snake statue
  ctx.beginPath(); ctx.moveTo(x + s * 0.9, y); ctx.quadraticCurveTo(x + s * 1.6, y - s * 0.4, x + s * 1.1, y - s * 0.9); ctx.quadraticCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.3, y - s * 1.6); stroke(s * 0.42, INK); stroke(s * 0.3, "#6f9a5a");
  ctx.beginPath(); ctx.arc(x + s * 1.35, y - s * 1.65, s * 0.22, 0, 7); fill("#6f9a5a"); stroke(s * 0.08);
  ctx.fillStyle = "#e0c040"; ctx.fillRect(x + s * 1.38, y - s * 1.72, s * 0.08, s * 0.08);
}
function whirlpool(x, y, r) {
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    for (let t = 0; t < 14; t += 0.15) { const rad = r * (1 - t / 14), a = t + k * 2.1; const px2 = x + Math.cos(a) * rad, py2 = y + Math.sin(a) * rad * 0.6; t === 0 ? ctx.moveTo(px2, py2) : ctx.lineTo(px2, py2); }
    stroke(1.4, "rgba(230,245,250,.75)");
  }
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.5); g.addColorStop(0, "rgba(10,25,35,.8)"); g.addColorStop(1, "rgba(10,25,35,0)");
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.6); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, 7); ctx.fill(); ctx.restore();
}
function moonwell(x, y) {
  glow(x, y - 2, 18, "#bfefff", 0.6);
  ctx.beginPath(); ctx.ellipse(x, y, 7, 3.5, 0, 0, 7); fill("#9fe6ff"); stroke(1.2);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx.beginPath(); ctx.rect(x + Math.cos(a) * 10 - 1.2, y + Math.sin(a) * 5 - 6, 2.4, 6); fill("#c9c3b5"); stroke(0.6); }
  ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x, y - 20); stroke(2.5, "rgba(220,250,255,.5)");
}
function compass(x, y, r) {
  ctx.save(); ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); stroke(1.4, "rgba(42,33,24,.7)"); ctx.beginPath(); ctx.arc(x, y, r * 0.86, 0, 7); stroke(0.7, "rgba(42,33,24,.6)");
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2, len = i % 2 ? r * 0.6 : r * 1.1, w = i % 2 ? r * 0.08 : r * 0.13;
    const tx = x + Math.cos(a) * len, ty = y + Math.sin(a) * len, lx = x + Math.cos(a - Math.PI / 2) * w, ly = y + Math.sin(a - Math.PI / 2) * w, qx = x + Math.cos(a + Math.PI / 2) * w, qy = y + Math.sin(a + Math.PI / 2) * w;
    ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(tx, ty); ctx.lineTo(x, y); ctx.closePath(); fill(i % 2 ? "#d8cdb0" : "#efe6cc"); stroke(0.8);
    ctx.beginPath(); ctx.moveTo(qx, qy); ctx.lineTo(tx, ty); ctx.lineTo(x, y); ctx.closePath(); fill(i % 2 ? "#6b5a3e" : "#8a2b2b"); stroke(0.8);
  }
  ctx.beginPath(); ctx.arc(x, y, r * 0.1, 0, 7); fill("#c8a03c"); stroke(0.8);
  ctx.font = `${r * 0.42}px 'IM Fell English SC', Georgia, serif`; ctx.textAlign = "center"; ctx.fillStyle = INK; ctx.fillText("N", x, y - r * 1.18);
  ctx.restore();
}
function dragon(x, y, s, c = "#7a1f1a") {
  ctx.save(); ctx.translate(x, y); ctx.scale(s / 10, s / 10);
  softShadow(4, 36, 12, 3, 0.25);
  ctx.beginPath();
  ctx.moveTo(-14, 2); ctx.quadraticCurveTo(-8, -1, -4, 0); // tail to body
  ctx.quadraticCurveTo(-2, -12, -16, -18); ctx.quadraticCurveTo(-8, -13, -10, -9); ctx.quadraticCurveTo(-4, -10, -5, -5); ctx.quadraticCurveTo(-1, -6, 0, -2); // left wing
  ctx.quadraticCurveTo(4, -14, 18, -20); ctx.quadraticCurveTo(11, -13, 13, -9); ctx.quadraticCurveTo(7, -10, 8, -5); ctx.quadraticCurveTo(5, -5, 4, -1); // right wing
  ctx.quadraticCurveTo(8, -2, 11, -5); ctx.lineTo(13, -4); ctx.lineTo(10, -1); // head
  ctx.quadraticCurveTo(6, 2, 2, 2); ctx.quadraticCurveTo(-6, 3, -14, 2); ctx.closePath();
  fill(c); stroke(0.8);
  ctx.beginPath(); ctx.moveTo(-14, 2); ctx.quadraticCurveTo(-20, 4, -22, 0); stroke(1.4, c);
  ctx.restore();
}
function serpent(x, y, s) {
  for (let i = 0; i < 3; i++) {
    const hx = x + i * s * 1.4;
    ctx.beginPath(); ctx.arc(hx, y, s * 0.6, Math.PI, 0); stroke(s * 0.36, INK); stroke(s * 0.26, "#3f7a5e");
    ctx.beginPath(); ctx.moveTo(hx - s * 0.75, y + 0.5); ctx.quadraticCurveTo(hx - s, y + s * 0.15, hx - s * 1.3, y); stroke(s * 0.06, "rgba(255,255,255,.6)");
  }
  const hx = x + 3 * s * 1.4 - s * 0.4;
  ctx.beginPath(); ctx.moveTo(hx - s * 0.2, y); ctx.quadraticCurveTo(hx, y - s * 1.6, hx + s * 0.7, y - s * 1.5); ctx.lineTo(hx + s * 0.75, y - s * 1.2); ctx.quadraticCurveTo(hx + s * 0.3, y - s * 1.1, hx + s * 0.3, y); ctx.closePath(); fill("#3f7a5e"); stroke(s * 0.08);
  ctx.fillStyle = "#e0c040"; ctx.fillRect(hx + s * 0.4, y - s * 1.45, s * 0.12, s * 0.12);
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(hx + s * 0.1 - i * s * 0.15, y - s * (1.2 - i * 0.35)); ctx.lineTo(hx - s * 0.2 - i * s * 0.15, y - s * (1.35 - i * 0.35)); stroke(s * 0.08, "#2c5a44"); }
}
function mist(x, y, r) {
  for (let i = 0; i < 9; i++) { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); }
  for (let i = 0; i < 9; i++) {
    const mx = x + rr(-r, r), my = y + rr(-r * 0.5, r * 0.5), mr = rr(r * 0.35, r * 0.7);
    const g = ctx.createRadialGradient(mx, my, 0, mx, my, mr); g.addColorStop(0, "rgba(240,245,248,.42)"); g.addColorStop(1, "rgba(240,245,248,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 7); ctx.fill();
  }
  for (let i = 0; i < 4; i++) { const my = y + rr(-r * 0.4, r * 0.4), mx = x + rr(-r * 0.6, r * 0.2); ctx.beginPath(); ctx.moveTo(mx, my); ctx.bezierCurveTo(mx + r * 0.3, my - 4, mx + r * 0.5, my + 4, mx + r * 0.8, my); stroke(1.2, "rgba(255,255,255,.55)"); }
}
function lighthouse(x, y, s) {
  glow(x, y - s * 2.4, s * 3.5, "#ffe9a0", 0.4);
  ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x - s * 0.3, y - s * 2.2); ctx.lineTo(x + s * 0.3, y - s * 2.2); ctx.lineTo(x + s * 0.5, y); ctx.closePath(); fill("#efe8da"); stroke(s * 0.1);
  ctx.fillStyle = "#9a3a2a"; ctx.fillRect(x - s * 0.42, y - s * 0.9, s * 0.84, s * 0.3); ctx.fillRect(x - s * 0.36, y - s * 1.6, s * 0.72, s * 0.3);
  ctx.beginPath(); ctx.rect(x - s * 0.3, y - s * 2.6, s * 0.6, s * 0.4); fill("#ffe08a"); stroke(s * 0.08);
  ctx.beginPath(); ctx.moveTo(x - s * 0.4, y - s * 2.6); ctx.lineTo(x, y - s * 3); ctx.lineTo(x + s * 0.4, y - s * 2.6); ctx.closePath(); fill("#9a3a2a"); stroke(s * 0.08);
}
function titanHead(x, y, s) {
  softShadow(x, y + 1, s * 1.8, s * 0.45, 0.4);
  ctx.beginPath(); ctx.moveTo(x - s * 1.2, y); ctx.quadraticCurveTo(x - s * 1.4, y - s * 1.3, x - s * 0.3, y - s * 1.5); ctx.quadraticCurveTo(x + s * 0.8, y - s * 1.5, x + s, y - s * 0.6); ctx.lineTo(x + s * 1.2, y); ctx.closePath(); fill("#a7a091"); stroke(s * 0.08);
  ctx.beginPath(); ctx.moveTo(x - s * 0.4, y - s * 0.95); ctx.lineTo(x - s * 0.1, y - s * 0.95); ctx.moveTo(x + s * 0.25, y - s * 0.95); ctx.lineTo(x + s * 0.55, y - s * 0.9); ctx.moveTo(x + s * 0.1, y - s * 0.85); ctx.lineTo(x + s * 0.2, y - s * 0.5); ctx.lineTo(x + s * 0.05, y - s * 0.45); ctx.moveTo(x - s * 0.1, y - s * 0.25); ctx.lineTo(x + s * 0.4, y - s * 0.25); stroke(s * 0.07);
  ctx.beginPath(); ctx.moveTo(x - s * 0.9, y - s * 1.1); ctx.lineTo(x - s * 0.6, y - s * 0.6); ctx.lineTo(x - s * 0.75, y - s * 0.2); stroke(s * 0.05, "rgba(42,33,24,.6)");
  for (const dx of [-2.2, 2.2]) { ctx.beginPath(); ctx.rect(x + dx * s - s * 0.2, y - s * 1.6, s * 0.4, s * 1.6); fill("#b8b1a2"); stroke(s * 0.07); }
  ctx.beginPath(); ctx.rect(x - 2.4 * s, y - s * 1.8, s * 4.8, s * 0.25); fill("#b8b1a2"); stroke(s * 0.07);
}
function fields(cx, cy, rx, ry, ang, seed) {
  R = rng(seed);
  const cols = ["#c2b66a", "#a7b05a", "#cdbb72", "#93a24f", "#b5a65a", "#d1c27c"];
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
  const cw = 13, ch = 9;
  for (let gx = -rx; gx < rx; gx += cw) for (let gy = -ry; gy < ry; gy += ch) {
    if ((gx / rx) ** 2 + (gy / ry) ** 2 > 1 - R() * 0.25) continue;
    const wx = cx + gx * Math.cos(ang) - gy * Math.sin(ang), wy = cy + gx * Math.sin(ang) + gy * Math.cos(ang);
    if (!landAround(wx, wy, 6)) continue;
    ctx.beginPath(); ctx.rect(gx + rr(-1, 1), gy + rr(-1, 1), cw - 1.5, ch - 1.5); fill(hexA(pick(cols).replace(/^#/, "#"), 1)); stroke(0.5, "rgba(60,45,25,.45)");
    if (R() < 0.5) { for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(gx + 1, gy + i * 2); ctx.lineTo(gx + cw - 3, gy + i * 2); stroke(0.3, "rgba(60,45,25,.3)"); } }
  }
  ctx.restore();
}
function river(pts, w0, w1) {
  const p = wiggle(pts, 4, 5);
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < p.length; i++) {
      const t = i / (p.length - 1), w = w0 + (w1 - w0) * t;
      ctx.beginPath(); ctx.moveTo(p[i - 1][0], p[i - 1][1]); ctx.lineTo(p[i][0], p[i][1]);
      pass === 0 ? stroke(w + 1.6, "rgba(42,52,58,.85)") : stroke(w, "#6f95a3");
    }
  }
}
function road(pts) {
  const p = wiggle(pts, 2.5, 5);
  ctx.setLineDash([5, 4]); smoothPath(p); stroke(1.5, "rgba(92,62,32,.85)"); ctx.setLineDash([]);
}
function clump(cx, cy, r, p, n, out) {
  for (let i = 0; i < n; i++) { const a = R() * Math.PI * 2, d = Math.sqrt(R()) * r * 0.75; out.push([cx + Math.cos(a) * d * 1.25, cy + Math.sin(a) * d * 0.7, r * rr(0.32, 0.5)]); }
}
function worldTree(x, y, H, p, seed) {
  R = rng(seed);
  glow(x, y - H * 0.62, H * 0.95, p.glow, 0.42);
  softShadow(x + H * 0.08, y + 3, H * 0.62, H * 0.12, 0.45);
  const tw = H * 0.13;
  // roots
  for (let i = 0; i < 9; i++) {
    const s = i < 4.5 ? -1 : 1, k = (i % 5) / 4, len = H * rr(0.22, 0.4);
    const sx = x + s * tw * (0.3 + k * 0.6), ex = x + s * len * (0.5 + k * 0.6), ey = y + rr(-2, H * 0.03);
    ctx.beginPath(); ctx.moveTo(sx, y - H * 0.1); ctx.quadraticCurveTo(sx + s * len * 0.3, y - H * 0.01, ex, ey);
    stroke(H * 0.05 * (1 - k * 0.4) + 1.6, INK); stroke(H * 0.05 * (1 - k * 0.4), p.trunk);
  }
  // limbs (drawn before trunk so the trunk covers their bases)
  const limbs = [[-0.42, 0.62, 0.075], [0.45, 0.6, 0.075], [-0.2, 0.82, 0.06], [0.22, 0.85, 0.06], [0, 0.95, 0.055], [-0.55, 0.5, 0.05], [0.58, 0.48, 0.05]];
  for (const [lx, ly, lw] of limbs) {
    ctx.beginPath(); ctx.moveTo(x + lx * H * 0.15, y - H * 0.42); ctx.quadraticCurveTo(x + lx * H * 0.35, y - H * (0.45 + ly * 0.12), x + lx * H * 0.68, y - H * ly);
    stroke(H * lw + 1.8, INK); stroke(H * lw, p.trunk);
  }
  // trunk
  ctx.beginPath(); ctx.moveTo(x - tw * 1.35, y - H * 0.02);
  ctx.bezierCurveTo(x - tw * 0.6, y - H * 0.18, x - tw * 1.0, y - H * 0.32, x - tw * 1.2, y - H * 0.48);
  ctx.lineTo(x + tw * 1.2, y - H * 0.48);
  ctx.bezierCurveTo(x + tw * 1.0, y - H * 0.32, x + tw * 0.6, y - H * 0.18, x + tw * 1.35, y - H * 0.02); ctx.closePath();
  fill(p.trunk); stroke(H * 0.012 + 0.8);
  for (let i = 0; i < 5; i++) { const ox = rr(-0.7, 0.7) * tw; ctx.beginPath(); ctx.moveTo(x + ox, y - H * rr(0.03, 0.08)); ctx.quadraticCurveTo(x + ox * 1.3 + rr(-2, 2), y - H * 0.25, x + ox * 0.8, y - H * rr(0.35, 0.46)); stroke(H * 0.007 + 0.3, i % 2 ? "rgba(0,0,0,.35)" : "rgba(255,255,255,.15)"); }
  ctx.beginPath(); ctx.moveTo(x + tw * 0.3, y - H * 0.02); ctx.bezierCurveTo(x + tw * 0.8, y - H * 0.18, x + tw * 0.6, y - H * 0.32, x + tw * 1.0, y - H * 0.48); ctx.lineTo(x + tw * 1.2, y - H * 0.48); ctx.bezierCurveTo(x + tw * 1.0, y - H * 0.32, x + tw * 0.6, y - H * 0.18, x + tw * 1.35, y - H * 0.02); ctx.closePath(); fill("rgba(0,0,0,.25)");
  // crown: several clumps at the limb ends, lower ones wide
  const centers = [[-0.62, 0.58, 0.24], [0.64, 0.56, 0.24], [-0.33, 0.8, 0.27], [0.34, 0.82, 0.27], [0, 0.98, 0.26], [0, 0.72, 0.3], [-0.78, 0.46, 0.17], [0.8, 0.44, 0.17]];
  const blobs = [];
  for (const [cx_, cy_, r_] of centers) clump(x + cx_ * H * 0.7, y - H * cy_, H * r_, p, 9, blobs);
  blobs.sort((a, b) => a[1] - b[1]);
  for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); stroke(H * 0.022 + 1.4); }
  for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx, by, br, 0, 7); fill(p.dark); }
  for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx - br * 0.12, by - br * 0.22, br * 0.78, 0, 7); fill(p.mid); }
  for (const [bx, by, br] of blobs) { ctx.beginPath(); ctx.arc(bx - br * 0.3, by - br * 0.42, br * 0.36, 0, 7); fill(p.light); }
  // leaf texture
  for (let i = 0; i < 70; i++) { const b = blobs[Math.floor(R() * blobs.length)]; const a = R() * 7, d = R() * b[2] * 0.8; ctx.beginPath(); ctx.arc(b[0] + Math.cos(a) * d, b[1] + Math.sin(a) * d, H * 0.012 + 0.4, Math.PI * 0.1, Math.PI * 0.9); stroke(H * 0.004 + 0.3, "rgba(20,30,15,.45)"); }
  const cx = x, cy = y - H * 0.75, rx = H * 0.6, ry = H * 0.28;
  if (p.extra === "thorns") {
    for (let i = 0; i < 34; i++) { const b = blobs[Math.floor(R() * blobs.length)], a = Math.atan2(b[1] - cy, b[0] - cx) + rr(-0.5, 0.5); const bx = b[0] + Math.cos(a) * b[2] * 0.9, by = b[1] + Math.sin(a) * b[2] * 0.9; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a) * H * 0.09, by + Math.sin(a) * H * 0.07); stroke(H * 0.014 + 0.5, "#140f14"); }
    for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(cx + rr(-rx, rx) * 0.8, cy + rr(-ry, ry) * 0.9, H * 0.013, 0, 7); fill("#e0405a"); }
  }
  if (p.extra === "lanterns") {
    for (let i = 0; i < 22; i++) { const lx = cx + rr(-rx, rx) * 0.85, ly = cy + rr(-ry * 0.3, ry * 1.1); glow(lx, ly, H * 0.045, "#ffd27a", 0.8); ctx.beginPath(); ctx.arc(lx, ly, H * 0.008 + 0.4, 0, 7); fill("#fff1b0"); }
    for (const [dx, dy] of [[-0.3, 0.52], [0.28, 0.5], [0.05, 0.6], [-0.45, 0.47]]) { const hx = x + dx * H, hy = y - H * dy; ctx.beginPath(); ctx.rect(hx - H * 0.028, hy - H * 0.035, H * 0.056, H * 0.035); fill("#8a6a3e"); stroke(0.7); ctx.beginPath(); ctx.moveTo(hx - H * 0.04, hy - H * 0.035); ctx.lineTo(hx, hy - H * 0.065); ctx.lineTo(hx + H * 0.04, hy - H * 0.035); ctx.closePath(); fill("#c9a03c"); stroke(0.7); }
  }
  if (p.extra === "vines" || p.extra === "lanterns") {
    for (let i = 0; i < 20; i++) { const b = blobs[Math.floor(R() * blobs.length)]; if (b[1] < cy - ry * 0.3) continue; const vx = b[0] + rr(-b[2], b[2]) * 0.6, vy = b[1] + b[2] * 0.6, l = H * rr(0.08, 0.26); ctx.beginPath(); ctx.moveTo(vx, vy); ctx.quadraticCurveTo(vx + rr(-3, 3), vy + l * 0.6, vx + rr(-2, 2), vy + l); stroke(H * 0.008 + 0.6, "#2c5a26"); }
  }
  if (p.extra === "silver") {
    for (let i = 0; i < 60; i++) { const b = blobs[Math.floor(R() * blobs.length)]; ctx.beginPath(); ctx.arc(b[0] + rr(-b[2], b[2]) * 0.7, b[1] + rr(-b[2], b[2]) * 0.7, H * 0.006 + 0.35, 0, 7); fill("rgba(255,255,255,.95)"); }
    glow(cx, cy, rx * 0.9, "#ffffff", 0.18);
  }
  if (p.extra === "gold") {
    for (let i = 0; i < 30; i++) { const lx = cx + rr(-rx, rx) * 1.1, ly = y - H * rr(0.0, 0.4); ctx.beginPath(); ctx.ellipse(lx, ly, H * 0.009 + 0.5, H * 0.004 + 0.3, rr(0, 3), 0, 7); fill("#e0b44a"); }
  }
  R = rng(seed + 99);
}
