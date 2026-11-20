'use strict';
// ============================================================
//  ClimbUP – core: config, RNG, geometry merging, colliders
// ============================================================
const T = THREE;
const V3 = T.Vector3;
const PI = Math.PI;

const CFG = {
  G: 25,              // normal gravity
  G_SPACE: 15,        // gravity in space
  // jump speeds: tap = HOP_MOVE, half charge ~ HOP_HIGH, full charge = HOP_PERFECT
  // (the level generator plans the jumps with these three values)
  HOP_MOVE: 7.5,
  HOP_HIGH: 12,
  HOP_PERFECT: 14.5,
  CHARGE_TIME: 0.7,   // seconds of holding space for a full charge
  CHARGE_DROP: 0.55,  // how far the view sinks at full charge
  WALK_SPEED: 3.0,    // rolling around on the ground
  SNEAK_SPEED: 1.6,   // holding shift: slower, can't roll off edges
  MOVE_SPEED: 6.5,    // horizontal speed when steering
  AIR_ACCEL: 10,      // air control strength
  GRIND_SLOW: 2.0,    // seconds of slow sliding while grinding
  KICK_UP: 10,
  KICK_OUT: 4.5,
  RADIUS: 0.3,
  EYE: 1.6,
  STEP: 1 / 120,
};
const SPHERES = [0.3, 0.9, 1.5]; // sphere centers above feet (capsule approximation)

// ---------- deterministic RNG (map is always the same) ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
let rng = mulberry32(1);
const R = (a, b) => a + (b - a) * rng();
const RI = (a, b) => Math.floor(a + (b - a + 1) * rng());
const pick = (arr) => arr[Math.floor(rng() * arr.length)];
function tint(hex, amt = 0.08) {
  const c = new T.Color(hex);
  c.offsetHSL((rng() - 0.5) * 0.02, 0, (rng() - 0.5) * amt);
  return c;
}

// ---------- geometry cache (non-indexed, so normals become flat = low-poly) ----------
const GEO = {};
function G(key, fn) {
  if (!GEO[key]) { const g = fn(); GEO[key] = g.index ? g.toNonIndexed() : g; }
  return GEO[key];
}
const geoBox = () => G('box', () => new T.BoxGeometry(1, 1, 1));
const geoCyl = (seg = 12, rt = 1) => G('cyl' + seg + '_' + rt, () => new T.CylinderGeometry(rt, 1, 1, seg));
const geoSph = (seg = 10) => G('sph' + seg, () => new T.SphereGeometry(1, seg, Math.max(4, Math.round(seg * 0.6))));
const geoTorus = (tube = 0.35, seg = 14) => G('tor' + tube + '_' + seg, () => new T.TorusGeometry(1, tube, 6, seg));
const geoCone = (seg = 10) => G('cone' + seg, () => new T.ConeGeometry(1, 1, seg));
const geoIco = (detail = 0) => G('ico' + detail, () => new T.IcosahedronGeometry(1, detail));
const geoHalfSph = (seg = 12) => G('hsph' + seg, () => new T.SphereGeometry(1, seg, Math.round(seg / 2), 0, PI * 2, 0, PI / 2));

// ---------- object builder: visual parts + box colliders in local space ----------
class Obj {
  constructor() { this.parts = []; this.cols = []; this.top = { w: 2, d: 2, h: 1 }; this.long = false; }
  add(geo, x, y, z, sx, sy, sz, color, rx = 0, ry = 0, rz = 0) {
    const m = new T.Matrix4().compose(new V3(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), new V3(sx, sy, sz));
    this.parts.push({ geo, m, color: color instanceof T.Color ? color : new T.Color(color) });
    return this;
  }
  col(w, h, d, x, y, z, rx = 0, ry = 0, rz = 0) { this.cols.push({ w, h, d, x, y, z, rx, ry, rz }); return this; }
  box(w, h, d, x, y, z, color, o = {}) {
    const rx = o.rx || 0, ry = o.ry || 0, rz = o.rz || 0;
    this.add(geoBox(), x, y, z, w, h, d, color, rx, ry, rz);
    if (o.col !== false) this.col(w, h, d, x, y, z, rx, ry, rz);
    return this;
  }
  // cylinder, axis = local y (before rotation)
  cyl(r, h, x, y, z, color, o = {}) {
    const rx = o.rx || 0, ry = o.ry || 0, rz = o.rz || 0;
    const rt = o.rt != null ? o.rt : 1;
    this.add(geoCyl(o.seg || 12, rt), x, y, z, r, h, r, color, rx, ry, rz);
    if (o.col === false) return this;
    if (!rx && !rz) this.colCyl(r * Math.max(rt, 1) * (rt < 1 ? 0.9 : 1), h, x, y, z);
    else this.col(r * 1.8, h, r * 1.8, x, y, z, rx, ry, rz);
    return this;
  }
  colCyl(r, h, x, y, z) { // octagon from two boxes
    const a = r * 0.96 * 2;
    this.col(a, h, a, x, y, z, 0, 0, 0);
    this.col(a, h, a, x, y, z, 0, PI / 4, 0);
    return this;
  }
  sph(r, x, y, z, color, o = {}) {
    this.add(geoSph(o.seg || 10), x, y, z, r * (o.sx || 1), r * (o.sy || 1), r * (o.sz || 1), color, o.rx || 0, o.ry || 0, o.rz || 0);
    return this;
  }
  torus(r, tube, x, y, z, color, o = {}) {
    this.add(geoTorus(tube, o.seg || 14), x, y, z, r, r, r, color, o.rx || 0, o.ry || 0, o.rz || 0);
    return this;
  }
  cone(r, h, x, y, z, color, o = {}) {
    this.add(geoCone(o.seg || 10), x, y, z, r, h, r, color, o.rx || 0, o.ry || 0, o.rz || 0);
    return this;
  }
}

// ---------- merges many parts into one vertex-colored mesh ----------
class MeshAcc {
  constructor() { this.pos = []; this.nor = []; this.col = []; }
  add(geo, matrix, color) {
    const g = geo.clone();
    g.applyMatrix4(matrix);
    g.computeVertexNormals();
    const p = g.attributes.position.array, n = g.attributes.normal.array;
    for (let i = 0; i < p.length; i++) { this.pos.push(p[i]); this.nor.push(n[i]); }
    for (let i = 0; i < p.length / 3; i++) this.col.push(color.r, color.g, color.b);
    g.dispose();
  }
  build(mat) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('color', new T.Float32BufferAttribute(this.col, 3));
    g.computeBoundingSphere();
    return new T.Mesh(g, mat);
  }
}

// ---------- colliders: oriented boxes in a 2D (xz) spatial hash ----------
const COLLIDERS = [];
const GRID = new Map();
const CELL = 4;
const cellKey = (ix, iz) => ix * 73856093 ^ iz * 19349663;

function makeOBB(c, gm, gq) {
  const center = new V3(c.x, c.y, c.z).applyMatrix4(gm);
  const q = gq.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(c.rx, c.ry, c.rz)));
  const ax = new V3(1, 0, 0).applyQuaternion(q), ay = new V3(0, 1, 0).applyQuaternion(q), az = new V3(0, 0, 1).applyQuaternion(q);
  const hx = c.w / 2, hy = c.h / 2, hz = c.d / 2;
  const ex = Math.abs(ax.x) * hx + Math.abs(ay.x) * hy + Math.abs(az.x) * hz;
  const ey = Math.abs(ax.y) * hx + Math.abs(ay.y) * hy + Math.abs(az.y) * hz;
  const ez = Math.abs(ax.z) * hx + Math.abs(ay.z) * hy + Math.abs(az.z) * hz;
  return {
    cx: center.x, cy: center.y, cz: center.z, hx, hy, hz,
    a: [ax.x, ax.y, ax.z, ay.x, ay.y, ay.z, az.x, az.y, az.z],
    min: [center.x - ex, center.y - ey, center.z - ez], max: [center.x + ex, center.y + ey, center.z + ez],
    stamp: 0,
  };
}
function addCollider(obb) {
  COLLIDERS.push(obb);
  const x0 = Math.floor(obb.min[0] / CELL), x1 = Math.floor(obb.max[0] / CELL);
  const z0 = Math.floor(obb.min[2] / CELL), z1 = Math.floor(obb.max[2] / CELL);
  if ((x1 - x0) * (z1 - z0) > 4000) { BIG_COLLIDERS.push(obb); return; } // ground etc.
  for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
    const k = cellKey(ix, iz);
    let arr = GRID.get(k); if (!arr) GRID.set(k, arr = []);
    arr.push(obb);
  }
}
const BIG_COLLIDERS = [];
let QSTAMP = 1;
function queryColliders(minX, minZ, maxX, maxZ, minY, maxY, out) {
  out.length = 0; QSTAMP++;
  const x0 = Math.floor(minX / CELL), x1 = Math.floor(maxX / CELL);
  const z0 = Math.floor(minZ / CELL), z1 = Math.floor(maxZ / CELL);
  for (let ix = x0; ix <= x1; ix++) for (let iz = z0; iz <= z1; iz++) {
    const arr = GRID.get(cellKey(ix, iz)); if (!arr) continue;
    for (const c of arr) {
      if (c.stamp === QSTAMP) continue; c.stamp = QSTAMP;
      if (c.max[1] < minY || c.min[1] > maxY) continue;
      out.push(c);
    }
  }
  for (const c of BIG_COLLIDERS) if (!(c.max[1] < minY || c.min[1] > maxY)) out.push(c);
  for (const c of DYN_COLS) { // moving objects
    if (!c.enabled || c.max[0] < minX || c.min[0] > maxX || c.max[2] < minZ || c.min[2] > maxZ || c.max[1] < minY || c.min[1] > maxY) continue;
    out.push(c);
  }
  return out;
}
const DYN_COLS = [];
// recompute an oriented box in place from a local collider spec and a world matrix
const _oq = new T.Quaternion(), _oq2 = new T.Quaternion(), _ov = new V3(), _ov2 = new V3(), _oe = new T.Euler();
function updateOBB(o, c, gm, gq) {
  _ov.set(c.x, c.y, c.z).applyMatrix4(gm);
  _oq.copy(gq).multiply(_oq2.setFromEuler(_oe.set(c.rx, c.ry, c.rz)));
  const a = o.a;
  _ov2.set(1, 0, 0).applyQuaternion(_oq); a[0] = _ov2.x; a[1] = _ov2.y; a[2] = _ov2.z;
  _ov2.set(0, 1, 0).applyQuaternion(_oq); a[3] = _ov2.x; a[4] = _ov2.y; a[5] = _ov2.z;
  _ov2.set(0, 0, 1).applyQuaternion(_oq); a[6] = _ov2.x; a[7] = _ov2.y; a[8] = _ov2.z;
  o.cx = _ov.x; o.cy = _ov.y; o.cz = _ov.z;
  const ex = Math.abs(a[0]) * o.hx + Math.abs(a[3]) * o.hy + Math.abs(a[6]) * o.hz;
  const ey = Math.abs(a[1]) * o.hx + Math.abs(a[4]) * o.hy + Math.abs(a[7]) * o.hz;
  const ez = Math.abs(a[2]) * o.hx + Math.abs(a[5]) * o.hy + Math.abs(a[8]) * o.hz;
  o.min[0] = o.cx - ex; o.min[1] = o.cy - ey; o.min[2] = o.cz - ez;
  o.max[0] = o.cx + ex; o.max[1] = o.cy + ey; o.max[2] = o.cz + ez;
}

// closest point of OBB to p; returns squared distance; writes local info into tmp
const _cp = { x: 0, y: 0, z: 0, inside: false, nx: 0, ny: 0, nz: 0, pen: 0 };
function sphereVsOBB(px, py, pz, r, c) {
  const dx = px - c.cx, dy = py - c.cy, dz = pz - c.cz, a = c.a;
  const lx = dx * a[0] + dy * a[1] + dz * a[2];
  const ly = dx * a[3] + dy * a[4] + dz * a[5];
  const lz = dx * a[6] + dy * a[7] + dz * a[8];
  const qx = Math.max(-c.hx, Math.min(c.hx, lx));
  const qy = Math.max(-c.hy, Math.min(c.hy, ly));
  const qz = Math.max(-c.hz, Math.min(c.hz, lz));
  const ox = lx - qx, oy = ly - qy, oz = lz - qz;
  const d2 = ox * ox + oy * oy + oz * oz;
  if (d2 >= r * r) return false;
  let nlx, nly, nlz, pen;
  if (d2 > 1e-10) {
    const d = Math.sqrt(d2);
    nlx = ox / d; nly = oy / d; nlz = oz / d; pen = r - d;
  } else { // center inside the box: push out along the shallowest axis
    const px_ = c.hx - Math.abs(lx), py_ = c.hy - Math.abs(ly), pz_ = c.hz - Math.abs(lz);
    nlx = nly = nlz = 0;
    if (py_ <= px_ && py_ <= pz_) { nly = ly >= 0 ? 1 : -1; pen = py_ + r; }
    else if (px_ <= pz_) { nlx = lx >= 0 ? 1 : -1; pen = px_ + r; }
    else { nlz = lz >= 0 ? 1 : -1; pen = pz_ + r; }
  }
  _cp.nx = nlx * a[0] + nly * a[3] + nlz * a[6];
  _cp.ny = nlx * a[1] + nly * a[4] + nlz * a[7];
  _cp.nz = nlx * a[2] + nly * a[5] + nlz * a[8];
  _cp.pen = pen;
  _cp.x = c.cx + qx * a[0] + qy * a[3] + qz * a[6];
  _cp.y = c.cy + qx * a[1] + qy * a[4] + qz * a[7];
  _cp.z = c.cz + qx * a[2] + qy * a[5] + qz * a[8];
  return true;
}

// ray straight down against an OBB, returns distance or -1
function rayDownOBB(px, py, pz, c) {
  const dx = px - c.cx, dy = py - c.cy, dz = pz - c.cz, a = c.a;
  const o = [dx * a[0] + dy * a[1] + dz * a[2], dx * a[3] + dy * a[4] + dz * a[5], dx * a[6] + dy * a[7] + dz * a[8]];
  const d = [-a[1], -a[4], -a[7]];
  const h = [c.hx, c.hy, c.hz];
  let tmin = 0, tmax = 1e9;
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-8) { if (o[i] < -h[i] || o[i] > h[i]) return -1; continue; }
    let t1 = (-h[i] - o[i]) / d[i], t2 = (h[i] - o[i]) / d[i];
    if (t1 > t2) { const s = t1; t1 = t2; t2 = s; }
    tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
    if (tmin > tmax) return -1;
  }
  return tmin;
}

// ---------- placing objects in the world ----------
const UP = new V3(0, 1, 0);
function objTransform(x, y, z, yaw) {
  const gq = new T.Quaternion().setFromAxisAngle(UP, yaw);
  const gm = new T.Matrix4().compose(new V3(x, y, z), gq, new V3(1, 1, 1));
  return { gq, gm };
}
function objAABB(obj, x, y, z, yaw) {
  const { gq, gm } = objTransform(x, y, z, yaw);
  const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9];
  for (const c of obj.cols) {
    const o = makeOBB(c, gm, gq);
    for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], o.min[i]); max[i] = Math.max(max[i], o.max[i]); }
  }
  return { min, max };
}
function placeObj(obj, x, y, z, yaw, acc, collide = true) {
  const { gq, gm } = objTransform(x, y, z, yaw);
  const m = new T.Matrix4();
  for (const p of obj.parts) { m.multiplyMatrices(gm, p.m); acc.add(p.geo, m, p.color); }
  if (collide) for (const c of obj.cols) addCollider(makeOBB(c, gm, gq));
}
function aabbHit(a, b, m = 0) {
  return a.min[0] - m < b.max[0] && a.max[0] + m > b.min[0] &&
         a.min[1] - m < b.max[1] && a.max[1] + m > b.min[1] &&
         a.min[2] - m < b.max[2] && a.max[2] + m > b.min[2];
}
