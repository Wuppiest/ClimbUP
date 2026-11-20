// ============================================================
//  ClimbUP – object library ("totally not stolen from an asset store")
//  Every builder returns an Obj whose walkable top surface is centered
//  at local (0, top.h, 0) with size top.w (x) * top.d (z).
// ============================================================
const PAL = {
  rust: ['#a0522d', '#8b4a2b', '#b5653a', '#7d4a33'],
  car: ['#b5533c', '#4f7396', '#6f8a4a', '#c9a640', '#8a8f96', '#a04a6a', '#3e5d4a'],
  barrel: ['#2f5fa8', '#b23a2e', '#3c8a46', '#d9a521', '#5a5a5a'],
  container: ['#b8432f', '#2c6aa0', '#2f8a57', '#d08a2a', '#7b4a9a', '#a7a7a7'],
  bright: ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#ff6fa8'],
  wood: ['#a8743f', '#8f6234', '#b9854c'],
  concrete: ['#9a9a96', '#8b8c88', '#a9a8a2'],
};

const BUILD = {
  // ---------------- 1: Schrottplatz ----------------
  car() {
    const o = new Obj(); const c = tint(pick(PAL.car), 0.12);
    o.box(4.2, 0.9, 1.9, 0.25, 0.75, 0, c);
    o.box(2.3, 0.75, 1.7, 0, 1.575, 0, c);
    o.box(2.36, 0.42, 1.74, 0, 1.6, 0, '#26313b', { col: false });
    o.box(0.08, 0.3, 1.5, 2.36, 0.85, 0, '#cfcfcf', { col: false });
    o.box(0.1, 0.18, 0.35, 2.36, 0.95, 0.6, '#ffe9a6', { col: false });
    o.box(0.1, 0.18, 0.35, 2.36, 0.95, -0.6, '#ffe9a6', { col: false });
    o.box(0.1, 0.2, 0.4, -1.86, 0.95, 0.6, '#c0392b', { col: false });
    o.box(0.1, 0.2, 0.4, -1.86, 0.95, -0.6, '#c0392b', { col: false });
    for (const sx of [-1.2, 1.55]) for (const sz of [-0.88, 0.88]) o.cyl(0.4, 0.3, sx, 0.4, sz, '#1e1e1e', { rx: PI / 2, col: false, seg: 10 });
    o.box(1.2, 0.05, 1.0, 1.4, 1.22, 0, tint('#8b4a2b', 0.1), { col: false }); // rust patch
    o.top = { w: 2.3, d: 1.7, h: 1.95 }; return o;
  },
  barrels() {
    const o = new Obj();
    for (const sx of [-0.62, 0.62]) for (const sz of [-0.62, 0.62]) {
      const c = tint(pick(PAL.barrel), 0.1);
      o.cyl(0.6, 1.8, sx, 0.9, sz, c, { col: false, seg: 12 });
      o.cyl(0.63, 0.08, sx, 0.55, sz, c.clone().multiplyScalar(0.7), { col: false, seg: 12 });
      o.cyl(0.63, 0.08, sx, 1.3, sz, c.clone().multiplyScalar(0.7), { col: false, seg: 12 });
      o.cyl(0.12, 0.04, sx + 0.25, 1.81, sz, '#333', { col: false, seg: 6 });
    }
    o.col(2.44, 1.8, 2.44, 0, 0.9, 0);
    o.top = { w: 2.4, d: 2.4, h: 1.8 }; return o;
  },
  tires() {
    const o = new Obj(); const n = RI(3, 5);
    for (let i = 0; i < n; i++) {
      o.torus(0.7, 0.42, (rng() - 0.5) * 0.15, 0.3 + i * 0.58, (rng() - 0.5) * 0.15, '#1f1f1f', { rx: PI / 2, seg: 12 });
      o.cyl(0.42, 0.5, 0, 0.3 + i * 0.58, 0, '#3a3a3a', { col: false, seg: 10 });
    }
    const h = n * 0.58 + 0.02;
    o.colCyl(0.95, h, 0, h / 2, 0);
    o.top = { w: 1.8, d: 1.8, h }; return o;
  },
  washer() {
    const o = new Obj(); const s = 1.5;
    o.box(s, s, s, 0, s / 2, 0, tint('#e9ecee', 0.05));
    o.cyl(0.48, 0.06, s / 2 + 0.02, 0.62, 0, '#9aa3a8', { rz: PI / 2, col: false, seg: 16 });
    o.cyl(0.38, 0.08, s / 2 + 0.03, 0.62, 0, '#2a3a4a', { rz: PI / 2, col: false, seg: 16 });
    o.box(0.04, 0.22, s * 0.9, s / 2 + 0.02, s - 0.16, 0, '#c8cfd3', { col: false });
    o.cyl(0.07, 0.05, s / 2 + 0.05, s - 0.16, 0.45, '#444', { rz: PI / 2, col: false, seg: 8 });
    o.top = { w: s, d: s, h: s }; return o;
  },
  fridge() {
    const o = new Obj(); const c = tint(pick(['#f2efe6', '#e8e2c9', '#9ec6c9', '#d6d6d6']), 0.06);
    o.box(2.6, 1.0, 1.15, 0, 0.5, 0, c);
    o.box(0.08, 1.02, 1.17, 0.6, 0.5, 0, c.clone().multiplyScalar(0.85), { col: false });
    o.box(1.0, 0.08, 0.1, -0.4, 1.04, 0.42, '#b9b9b9', { col: false });
    o.box(0.6, 0.08, 0.1, 1.0, 1.04, 0.42, '#b9b9b9', { col: false });
    o.top = { w: 2.6, d: 1.15, h: 1.0 }; o.long = true; return o;
  },
  pallets() {
    const o = new Obj(); const n = RI(3, 6); const c = tint('#c49a5c', 0.1);
    for (let i = 0; i < n; i++) {
      const y = i * 0.28;
      for (let k = -2; k <= 2; k++) o.box(1.9, 0.07, 0.24, 0, y + 0.245, k * 0.33, c.clone().offsetHSL(0, 0, (rng() - 0.5) * 0.08), { col: false });
      for (const sz of [-0.6, 0, 0.6]) o.box(1.9, 0.14, 0.2, 0, y + 0.13, sz, c.clone().multiplyScalar(0.8), { col: false });
      o.box(1.9, 0.07, 0.15, 0, y + 0.035, 0, c, { col: false });
    }
    const h = n * 0.28;
    o.col(1.9, h, 1.55, 0, h / 2, 0);
    o.top = { w: 1.9, d: 1.55, h }; return o;
  },
  container(colorHex) {
    const o = new Obj(); const c = tint(colorHex || pick(PAL.container), 0.08);
    const L = 6, H = 2.6, W = 2.44;
    o.box(L, H, W, 0, H / 2, 0, c);
    const dark = c.clone().multiplyScalar(0.78);
    for (let x = -L / 2 + 0.3; x <= L / 2 - 0.2; x += 0.4) {
      o.box(0.14, H - 0.2, 0.04, x, H / 2, W / 2 + 0.02, dark, { col: false });
      o.box(0.14, H - 0.2, 0.04, x, H / 2, -W / 2 - 0.02, dark, { col: false });
    }
    o.box(0.04, H - 0.1, W - 0.1, L / 2 + 0.02, H / 2, 0, dark, { col: false });
    o.box(0.06, H - 0.3, 0.05, L / 2 + 0.05, H / 2, 0.4, '#555', { col: false });
    o.box(0.06, H - 0.3, 0.05, L / 2 + 0.05, H / 2, -0.4, '#555', { col: false });
    o.top = { w: L, d: W, h: H }; o.long = true; return o;
  },
  mattress() {
    const o = new Obj(); const c = tint(pick(['#e8e4d8', '#c9d8e8', '#e8cfd8']), 0.05);
    o.box(2.1, 0.32, 1.5, 0, 0.16, 0, c);
    for (let z = -0.6; z <= 0.61; z += 0.3) o.box(2.12, 0.02, 0.08, 0, 0.32, z, '#7f9fc4', { col: false });
    o.box(0.5, 0.02, 0.4, 0.5, 0.33, 0.2, '#b59a6a', { col: false }); // stain, of course
    o.top = { w: 2.1, d: 1.5, h: 0.32 }; return o;
  },
  crt() {
    const o = new Obj(); const c = tint('#d8cfb5', 0.06);
    o.box(1.3, 1.1, 1.25, 0, 0.55, 0, c);
    o.box(0.7, 0.8, 0.9, -0.85, 0.5, 0, c.clone().multiplyScalar(0.9), { col: false });
    o.box(0.04, 0.78, 0.95, 0.66, 0.6, 0, '#26302a', { col: false });
    o.box(0.04, 0.6, 0.75, 0.68, 0.6, 0, '#3e5a4a', { col: false });
    o.cyl(0.06, 0.05, 0.67, 0.12, 0.45, '#666', { rz: PI / 2, col: false, seg: 6 });
    o.top = { w: 1.3, d: 1.25, h: 1.1 }; return o;
  },

  // ---------------- 2: Baustelle ----------------
  ibeam() {
    const o = new Obj(); const L = R(6, 8.5); const c = tint(pick(['#d9822b', '#b5532c', '#c46a2a']), 0.08);
    o.box(L, 0.12, 0.95, 0, 0.94, 0, c, { col: false });
    o.box(L, 0.76, 0.16, 0, 0.5, 0, c, { col: false });
    o.box(L, 0.12, 0.95, 0, 0.06, 0, c, { col: false });
    for (let x = -L / 2 + 0.5; x < L / 2; x += 1.2) o.cyl(0.05, 0.03, x, 1.0, 0.3, '#555', { col: false, seg: 6 });
    o.col(L, 1.0, 0.95, 0, 0.5, 0);
    o.top = { w: L, d: 0.95, h: 1.0 }; o.long = true; return o;
  },
  pipe() {
    const o = new Obj(); const c = tint('#a3a19a', 0.08);
    o.cyl(1.1, 3.4, 0, 1.1, 0, c, { rz: PI / 2, col: false, seg: 12 });
    o.cyl(0.82, 3.42, 0, 1.1, 0, '#3b3a36', { rz: PI / 2, col: false, seg: 12 });
    o.cyl(1.18, 0.4, 1.5, 1.1, 0, c.clone().multiplyScalar(0.92), { rz: PI / 2, col: false, seg: 12 });
    o.col(3.4, 2.15, 1.7, 0, 1.075, 0);
    o.top = { w: 3.4, d: 1.7, h: 2.15 }; o.long = true; return o;
  },
  scaffold() {
    const o = new Obj(); const W = 3.2, D = 1.4, H = 4;
    const steel = '#9aa0a6', plank = tint(pick(PAL.wood), 0.08);
    for (const sx of [-W / 2 + 0.1, W / 2 - 0.1]) for (const sz of [-D / 2 + 0.1, D / 2 - 0.1]) o.cyl(0.06, H, sx, H / 2, sz, steel, { seg: 6 });
    for (const y of [H / 2, H]) {
      o.box(W, 0.1, D, 0, y - 0.05, 0, plank);
      o.box(W, 0.06, 0.06, 0, y + 0.95, D / 2 - 0.1, steel, { col: false });
    }
    o.box(Math.hypot(W, H / 2), 0.06, 0.06, 0, H * 0.25, -D / 2 + 0.1, steel, { rz: Math.atan2(H / 2, W), col: false });
    o.box(Math.hypot(W, H / 2), 0.06, 0.06, 0, H * 0.75, -D / 2 + 0.1, steel, { rz: -Math.atan2(H / 2, W), col: false });
    for (const sx of [-W / 2 + 0.1, W / 2 - 0.1]) o.cyl(0.05, 1.0, sx, H + 0.5, D / 2 - 0.1, steel, { col: false, seg: 6 });
    o.top = { w: W, d: D, h: H }; o.long = true; return o;
  },
  drum() {
    const o = new Obj(); const wood = tint('#b07f45', 0.08);
    o.cyl(1.45, 0.16, 0, 0.08, 0, wood, { col: false, seg: 14 });
    o.cyl(1.45, 0.16, 0, 1.52, 0, wood, { col: false, seg: 14 });
    o.cyl(1.15, 1.3, 0, 0.8, 0, pick(['#222', '#d35400', '#1e5aa8']), { col: false, seg: 14 });
    o.cyl(0.25, 0.02, 0, 1.61, 0, '#3a2a1a', { col: false, seg: 8 });
    o.colCyl(1.45, 1.6, 0, 0.8, 0);
    o.top = { w: 2.6, d: 2.6, h: 1.6 }; return o;
  },
  toilet() {
    const o = new Obj(); const c = tint(pick(['#2a62c9', '#2f9e44', '#c92a2a']), 0.06);
    o.box(1.25, 2.2, 1.25, 0, 1.1, 0, c);
    o.box(1.4, 0.16, 1.4, 0, 2.28, 0, '#f1f1f1');
    o.box(0.04, 1.9, 0.95, 0.64, 1.0, 0, c.clone().multiplyScalar(0.85), { col: false });
    o.box(0.05, 0.12, 0.25, 0.67, 1.1, 0.3, '#ddd', { col: false });
    o.box(0.05, 0.08, 0.35, 0.66, 1.8, 0, '#eee', { col: false }); // occupied sign
    o.cyl(0.08, 0.5, -0.4, 2.5, 0.4, '#eee', { col: false, seg: 6 });
    o.top = { w: 1.4, d: 1.4, h: 2.36 }; return o;
  },
  concrete() {
    const o = new Obj(); const c = tint(pick(PAL.concrete), 0.06);
    o.box(3.2, 1.2, 1.7, 0, 0.6, 0, c);
    for (const x of [-1, 0, 1]) o.box(0.4, 0.4, 0.04, x, 0.6, 0.86, '#555', { col: false });
    o.torus(0.15, 0.3, -1.2, 1.25, 0, '#777', { rx: 0, seg: 8 });
    o.torus(0.15, 0.3, 1.2, 1.25, 0, '#777', { rx: 0, seg: 8 });
    o.top = { w: 3.2, d: 1.7, h: 1.2 }; o.long = true; return o;
  },
  bricks() {
    const o = new Obj(); const wood = tint('#b9854c', 0.06);
    o.box(1.7, 0.15, 1.3, 0, 0.075, 0, wood);
    const c = tint('#b24a32', 0.06);
    for (let i = 0; i < 5; i++) o.box(1.6, 0.22, 1.2, 0, 0.15 + 0.11 + i * 0.24, 0, c.clone().offsetHSL(0, 0, (rng() - 0.5) * 0.06), { col: false });
    o.col(1.6, 1.2, 1.2, 0, 0.75, 0);
    o.box(1.62, 0.02, 1.22, 0, 1.36, 0, '#d8d8d8', { col: false }); // strap
    o.top = { w: 1.6, d: 1.2, h: 1.36 }; return o;
  },

  // ---------------- 3: Stadt-Dächer ----------------
  ac() {
    const o = new Obj(); const c = tint('#c9cdd1', 0.05);
    o.box(2.2, 1.3, 1.5, 0, 0.65, 0, c);
    o.cyl(0.5, 0.06, 0.5, 1.31, 0, '#5a6066', { col: false, seg: 14 });
    o.cyl(0.08, 0.1, 0.5, 1.33, 0, '#333', { col: false, seg: 8 });
    for (let x = -1; x <= 0.1; x += 0.15) o.box(0.05, 1.0, 0.03, x, 0.65, 0.76, '#8a9096', { col: false });
    o.cyl(0.08, 1.2, -1.1, 0.4, -0.5, '#777', { rz: PI / 2, col: false, seg: 6 });
    o.top = { w: 2.2, d: 1.5, h: 1.3 }; return o;
  },
  tank() {
    const o = new Obj(); const wood = tint('#8b5a2b', 0.06);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) o.cyl(0.1, 1.6, sx, 0.8, sz, '#555', { seg: 6 });
    o.box(2.6, 0.12, 2.6, 0, 1.62, 0, '#666', { col: false });
    o.cyl(1.5, 2.3, 0, 2.83, 0, wood, { col: false, seg: 14 });
    for (const y of [2.1, 2.9, 3.7]) o.cyl(1.53, 0.08, 0, y, 0, '#333', { col: false, seg: 14 });
    o.cyl(1.56, 0.1, 0, 4.03, 0, wood.clone().multiplyScalar(0.8), { col: false, seg: 14 });
    o.colCyl(1.5, 2.45, 0, 2.855, 0);
    o.top = { w: 2.8, d: 2.8, h: 4.08 }; return o;
  },
  bus() {
    const o = new Obj(); const c = tint(pick(['#e8b912', '#c0392b', '#2e86c1', '#f0f0f0']), 0.06);
    const L = 9, H = 2.6, W = 2.5;
    o.box(L, H, W, 0, 0.55 + H / 2, 0, c);
    o.box(L - 1.2, 0.8, W + 0.04, -0.2, 2.25, 0, '#273746', { col: false });
    o.box(0.04, 1.0, W - 0.3, L / 2 + 0.01, 2.0, 0, '#273746', { col: false });
    o.box(L + 0.02, 0.2, W + 0.02, 0, 0.75, 0, '#333', { col: false });
    o.box(0.6, 0.25, 1.6, L / 2 - 0.6, 3.25, 0, c.clone().multiplyScalar(0.85), { col: false });
    for (const sx of [-3, -1.9, 3]) for (const sz of [-1.1, 1.1]) o.cyl(0.55, 0.35, sx, 0.55, sz, '#1e1e1e', { rx: PI / 2, col: false, seg: 10 });
    o.top = { w: L, d: W, h: 0.55 + H }; o.long = true; return o;
  },
  taxi() {
    const o = BUILD.car();
    // repaint as a taxi: recolor the body parts
    for (const p of o.parts.slice(0, 2)) p.color = tint('#f4c20d', 0.05);
    o.box(0.3, 0.25, 0.8, 0.95, 2.07, 0, '#f7f7f7', { col: false });
    o.box(2.32, 0.12, 0.3, 0, 1.05, 0.96, '#222', { col: false });
    return o;
  },
  booth() {
    const o = new Obj(); const c = tint('#c0201a', 0.05);
    o.box(1.2, 2.6, 1.2, 0, 1.3, 0, c);
    for (let y = 0.9; y <= 2.2; y += 0.35) for (const s of [-1, 1]) {
      o.box(1.22, 0.28, 0.02, 0, y, s * 0.6, '#b8d6e8', { col: false });
      o.box(0.02, 0.28, 1.0, s * 0.6, y, 0, '#b8d6e8', { col: false });
    }
    o.box(1.3, 0.2, 1.3, 0, 2.7, 0, c.clone().multiplyScalar(0.85));
    o.box(0.9, 0.16, 0.02, 0, 2.48, 0.61, '#fff', { col: false });
    o.top = { w: 1.3, d: 1.3, h: 2.8 }; return o;
  },
  dish() {
    const o = new Obj(); const c = tint('#b8bcc0', 0.05);
    o.box(1.8, 1.0, 1.8, 0, 0.5, 0, c);
    o.cyl(0.08, 1.1, 1.1, 0.5, 0, '#777', { rz: PI / 2, col: false, seg: 6 });
    o.add(geoHalfSph(14), 1.75, 0.6, 0, 1.0, 0.35, 1.0, '#e8e8e8', 0, 0, PI / 2 + 0.4);
    o.cyl(0.04, 0.9, 1.95, 0.75, 0, '#555', { rz: PI / 2 + 0.4, col: false, seg: 5 });
    o.top = { w: 1.8, d: 1.8, h: 1.0 }; return o;
  },
  chimney() {
    const o = new Obj(); const c = tint('#9e4a35', 0.08);
    o.box(1.3, 3.2, 1.3, 0, 1.6, 0, c);
    for (let y = 0.3; y < 3.1; y += 0.45) o.box(1.32, 0.04, 1.32, 0, y, 0, '#c8b8a8', { col: false });
    o.box(1.6, 0.2, 1.6, 0, 3.3, 0, '#7a3a2a');
    o.box(0.7, 0.04, 0.7, 0, 3.41, 0, '#1a1a1a', { col: false });
    o.top = { w: 1.6, d: 1.6, h: 3.4 }; return o;
  },
  billboard() {
    const o = new Obj();
    o.box(5.4, 0.4, 3.2, 0, 0.2, 0, '#e8e8e8');
    const cols = [pick(PAL.bright), pick(PAL.bright), '#ffffff'];
    o.box(5.0, 0.02, 1.0, 0, 0.41, -0.9, cols[0], { col: false });
    o.box(3.0, 0.02, 0.9, -0.9, 0.41, 0.2, cols[1], { col: false });
    o.box(1.4, 0.02, 1.4, 1.6, 0.41, 0.6, cols[2], { col: false });
    for (const sx of [-1.8, 1.8]) o.cyl(0.12, 2.5, sx, -1.2, 0, '#666', { col: false, seg: 6 });
    o.top = { w: 5.4, d: 3.2, h: 0.4 }; return o;
  },
  trafficlight() {
    const o = new Obj(); const L = R(5.5, 7);
    o.cyl(0.24, L, 0, 0.3, 0, '#4a5560', { rz: PI / 2, col: false, seg: 8 });
    o.col(L, 0.6, 0.6, 0, 0.3, 0);
    o.box(0.6, 1.6, 0.6, L / 2 - 0.3, -0.6, 0, '#2a2a2a');
    o.cyl(0.18, 0.1, L / 2 - 0.3, -0.1, 0.31, '#e74c3c', { rx: PI / 2, col: false, seg: 10 });
    o.cyl(0.18, 0.1, L / 2 - 0.3, -0.6, 0.31, '#f1c40f', { rx: PI / 2, col: false, seg: 10 });
    o.cyl(0.18, 0.1, L / 2 - 0.3, -1.1, 0.31, '#2ecc71', { rx: PI / 2, col: false, seg: 10 });
    o.top = { w: L, d: 0.6, h: 0.6 }; o.long = true; return o;
  },

  // ---------------- 4: Riesenzimmer ----------------
  toaster() {
    const o = new Obj(); const c = tint(pick(['#d5d8dc', '#e74c3c', '#f5f0e1', '#6fb7b7']), 0.04);
    o.box(3.2, 2.2, 2.1, 0, 1.1, 0, c);
    o.box(2.4, 0.02, 0.35, 0, 2.2, -0.45, '#222', { col: false });
    o.box(2.4, 0.02, 0.35, 0, 2.2, 0.45, '#222', { col: false });
    o.box(0.25, 0.25, 0.25, 1.75, 1.5, 0, '#333', { col: false });
    o.box(3.25, 0.15, 2.15, 0, 0.08, 0, '#555', { col: false });
    o.top = { w: 3.2, d: 2.1, h: 2.2 }; return o;
  },
  block() {
    const o = new Obj(); const s = R(2.0, 2.6); const c = tint(pick(PAL.bright), 0.05);
    o.box(s, s, s, 0, s / 2, 0, c);
    const c2 = tint(pick(PAL.bright), 0.05);
    for (const sgn of [-1, 1]) {
      o.box(s * 0.5, s * 0.6, 0.04, 0, s / 2, sgn * (s / 2 + 0.02), c2, { col: false });
      o.box(0.04, s * 0.6, s * 0.5, sgn * (s / 2 + 0.02), s / 2, 0, c2, { col: false });
    }
    o.top = { w: s, d: s, h: s }; return o;
  },
  books() {
    const o = new Obj(); let y = 0;
    const n = RI(2, 4);
    for (let i = 0; i < n; i++) {
      const w = R(2.8, 3.6), d = R(2.0, 2.5), h = R(0.4, 0.7); const c = tint(pick(PAL.bright), 0.15);
      const last = i === n - 1;
      const ox = last ? 0 : (rng() - 0.5) * 0.4, ry = last ? 0 : (rng() - 0.5) * 0.3;
      o.box(w, h, d, ox, y + h / 2, 0, c, { ry });
      o.box(w - 0.1, h - 0.1, 0.05, ox, y + h / 2, d / 2 + 0.01, '#f3ecd6', { ry, col: false });
      y += h;
      if (last) o.top = { w, d, h: y };
    }
    return o;
  },
  mug() {
    const o = new Obj(); const c = tint(pick(['#f5f5f5', '#e74c3c', '#2e86c1', '#f1c40f']), 0.04);
    o.cyl(1.3, 2.4, 0, 1.2, 0, c, { col: false, seg: 16 });
    o.cyl(1.12, 0.02, 0, 2.38, 0, '#4a2c1a', { col: false, seg: 16 });
    o.torus(0.6, 0.25, 1.4, 1.3, 0, c, { rx: 0, seg: 10 });
    o.colCyl(1.3, 2.4, 0, 1.2, 0);
    o.top = { w: 2.4, d: 2.4, h: 2.4 }; return o;
  },
  plates() {
    const o = new Obj(); const n = RI(4, 7);
    for (let i = 0; i < n; i++) {
      o.cyl(2.1, 0.12, (rng() - 0.5) * 0.12, 0.06 + i * 0.14, (rng() - 0.5) * 0.12, i % 2 ? '#f4f4f4' : '#e2eef7', { col: false, seg: 16, rt: 1.0 });
      o.cyl(2.12, 0.03, 0, 0.12 + i * 0.14, 0, '#3a7bd5', { col: false, seg: 16 });
    }
    const h = n * 0.14;
    o.colCyl(2.05, h, 0, h / 2, 0);
    o.top = { w: 3.8, d: 3.8, h }; return o;
  },
  brick() {
    const o = new Obj(); const c = tint(pick(PAL.bright), 0.04);
    o.box(4, 1.4, 2, 0, 0.7, 0, c);
    for (let x = -1.5; x <= 1.5; x += 1) for (const z of [-0.5, 0.5]) o.cyl(0.32, 0.22, x, 1.5, z, c, { col: false, seg: 12 });
    o.top = { w: 4, d: 2, h: 1.42 }; o.long = true; return o;
  },
  pencil() {
    const o = new Obj(); const L = R(6.5, 8.5); const c = tint(pick(['#f4c20d', '#e74c3c', '#2e86c1', '#27ae60']), 0.04);
    o.cyl(0.55, L, 0, 0.5, 0, c, { rz: PI / 2, col: false, seg: 6 });
    o.cone(0.55, 1.2, L / 2 + 0.6, 0.5, 0, '#e8c99b', { rz: -PI / 2, seg: 6 });
    o.cone(0.18, 0.4, L / 2 + 1.0, 0.5, 0, '#333', { rz: -PI / 2, seg: 6 });
    o.cyl(0.57, 0.5, -L / 2 - 0.25, 0.5, 0, '#b8b8b8', { rz: PI / 2, col: false, seg: 6 });
    o.cyl(0.55, 0.6, -L / 2 - 0.8, 0.5, 0, '#f19bb0', { rz: PI / 2, col: false, seg: 6 });
    o.col(L + 1.1, 1.0, 0.95, -0.55, 0.5, 0);
    o.top = { w: L, d: 0.95, h: 1.0 }; o.long = true; return o;
  },
  cube3() {
    const o = new Obj(); const s = 2.4; const cols = ['#ffffff', '#f1c40f', '#e74c3c', '#e67e22', '#2e86c1', '#27ae60'];
    o.box(s, s, s, 0, s / 2, 0, '#151515');
    const st = s / 3, sz = st * 0.82;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      o.box(sz, 0.03, sz, i * st, s + 0.005, j * st, pick(cols), { col: false });
      o.box(sz, sz, 0.03, i * st, s / 2 + j * st, s / 2 + 0.005, pick(cols), { col: false });
      o.box(sz, sz, 0.03, i * st, s / 2 + j * st, -s / 2 - 0.005, pick(cols), { col: false });
      o.box(0.03, sz, sz, s / 2 + 0.005, s / 2 + j * st, i * st, pick(cols), { col: false });
      o.box(0.03, sz, sz, -s / 2 - 0.005, s / 2 + j * st, i * st, pick(cols), { col: false });
    }
    o.top = { w: s, d: s, h: s }; return o;
  },
  dice() {
    const o = new Obj(); const s = 2.2;
    o.box(s, s, s, 0, s / 2, 0, tint(pick(['#f7f7f7', '#c0392b']), 0.03));
    const pip = (x, y, z, rx, rz) => o.cyl(0.2, 0.04, x, y, z, '#1a1a1a', { rx, rz, col: false, seg: 10 });
    const v = 0.55;
    for (const [x, z] of [[-v, -v], [v, v], [0, 0], [-v, v], [v, -v]]) pip(x, s + 0.01, z, 0, 0);       // 5 on top
    for (const [x, y] of [[-v, -v], [v, v]]) pip(x, s / 2 + y, s / 2 + 0.01, PI / 2, 0);                 // 2 front
    for (const [z, y] of [[-v, -v], [0, 0], [v, v]]) pip(s / 2 + 0.01, s / 2 + y, z, 0, PI / 2);         // 3 side
    o.top = { w: s, d: s, h: s }; return o;
  },
  choco() {
    const o = new Obj(); const c = tint('#5b3420', 0.04);
    o.box(4.2, 0.5, 2.1, 0, 0.25, 0, c);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) o.box(0.6, 0.12, 0.6, -1.75 + i * 0.7, 0.56, -0.7 + j * 0.7, c.clone().multiplyScalar(1.12), { col: false });
    o.box(1.6, 0.6, 2.2, -1.4, 0.3, 0, pick(['#7b2cbf', '#c0392b', '#2e86c1']), { col: false });
    o.box(0.2, 0.62, 2.22, -1.4, 0.3, 0, '#e8d27a', { col: false });
    o.top = { w: 4.2, d: 2.1, h: 0.6 }; o.long = true; return o;
  },

  // ---------------- 5: Wolken ----------------
  cloud(w0, d0) {
    const o = new Obj(); const w = w0 || R(3.2, 4.6), d = d0 || R(2.6, 3.6); const h = 1.2;
    o.col(w, 1.0, d, 0, h - 0.5, 0);
    const n = Math.round(w * d / 2.2) + 3;
    for (let i = 0; i < n; i++) {
      const x = (rng() - 0.5) * w * 0.9, z = (rng() - 0.5) * d * 0.9, r = R(0.8, 1.4);
      o.sph(r, x, h - r * 0.55, z, rng() < 0.5 ? '#ffffff' : '#eef4fb', { sy: 0.55, seg: 8 });
    }
    for (let i = 0; i < 4; i++) o.sph(R(0.7, 1.1), (rng() - 0.5) * w * 0.6, h - 1.0, (rng() - 0.5) * d * 0.6, '#dfe8f2', { sy: 0.6, seg: 8 });
    o.top = { w, d, h }; return o;
  },
  balloon() {
    const o = new Obj();
    const cols = [pick(PAL.bright), '#ffffff'];
    o.box(1.4, 1.0, 1.4, 0, 0.5, 0, '#8b5a2b');
    for (const sx of [-0.6, 0.6]) for (const sz of [-0.6, 0.6]) o.cyl(0.03, 1.5, sx * 1.2, 1.75, sz * 1.2, '#4a3a2a', { col: false, seg: 4 });
    const cy = 5.1, r = 2.6;
    for (let i = 0; i < 8; i++) {
      const g = G('bslice' + i, () => new T.SphereGeometry(1, 3, 10, i * PI / 4, PI / 4));
      o.add(g, 0, cy, 0, r, r * 1.12, r, cols[i % 2]);
    }
    o.cone(1.2, 1.2, 0, cy - r * 1.12 + 0.2, 0, cols[0], { rx: PI, seg: 8 });
    o.cyl(1.45, 0.3, 0, cy + r * 1.12 - 0.1, 0, cols[1], { col: false, seg: 12 });
    o.col(r * 1.8, r * 1.6, r * 1.8, 0, cy, 0);
    o.colCyl(1.45, 0.4, 0, cy + r * 1.12 - 0.15, 0);
    o.top = { w: 2.6, d: 2.6, h: cy + r * 1.12 + 0.05 }; o.span = { w: 4.8, d: 4.8 }; return o;
  },
  plane() {
    const o = new Obj(); const c = tint(pick(['#e74c3c', '#f1f1f1', '#2e86c1', '#f4c20d']), 0.04);
    o.box(6.4, 1.1, 1.1, 0, 0.55, 0, c);
    o.cone(0.55, 1.0, 3.7, 0.55, 0, c, { rz: -PI / 2, seg: 8 });
    o.box(0.08, 0.15, 2.4, 4.25, 0.55, 0, '#333', { col: false, rx: 0.4 });
    o.box(1.6, 0.14, 8.5, 0.6, 0.15, 0, c.clone().multiplyScalar(0.9));
    o.box(1.0, 0.1, 3.0, -2.9, 0.6, 0, c.clone().multiplyScalar(0.9));
    o.box(0.9, 0.9, 0.1, -3.0, 1.2, 0, c.clone().multiplyScalar(0.85), { col: false });
    o.box(1.4, 0.4, 1.12, 1.2, 0.95, 0, '#2c3e50', { col: false });
    o.top = { w: 6.4, d: 1.1, h: 1.1 }; o.long = true; return o;
  },
  island() {
    const o = new Obj(); const s = R(3.6, 4.6);
    o.box(s, 0.5, s, 0, -0.25, 0, '#5fae3c');
    o.box(s * 0.98, 0.3, s * 0.98, 0, -0.62, 0, '#7a5232', { col: false });
    o.add(geoCone(7), 0, -2.2, 0, s * 0.6, 3, s * 0.6, '#6b4428', PI, 0, 0);
    o.cyl(0.15, 1.4, s / 2 - 0.4, 0.7, s / 2 - 0.4, '#6b4428', { seg: 6 });
    o.cone(0.8, 1.8, s / 2 - 0.4, 2.1, s / 2 - 0.4, '#3d8b37', { seg: 7 });
    for (let i = 0; i < 4; i++) o.sph(0.12, (rng() - 0.5) * s * 0.6, 0.05, (rng() - 0.5) * s * 0.6, pick(['#ff6fa8', '#fff', '#f1c40f']), { seg: 5 });
    o.top = { w: s, d: s, h: 0 }; return o;
  },
  blimp() {
    const o = new Obj(); const c = tint(pick(['#c0c6cc', '#f4c20d', '#2e86c1']), 0.05);
    o.sph(1.6, 0, 0, 0, c, { sx: 3.6, seg: 14 });
    o.box(1.8, 0.6, 0.9, 0, -1.75, 0, '#444');
    o.box(1.4, 1.2, 0.08, -5.2, 0.6, 0, c.clone().multiplyScalar(0.8), { col: false });
    o.box(1.4, 0.08, 2.4, -5.2, 0, 0, c.clone().multiplyScalar(0.8), { col: false });
    o.box(5, 0.5, 3.3, 0, 0, 0, pick(PAL.bright), { col: false });
    o.col(9.5, 2.9, 2.2, 0, 0.1, 0);
    o.top = { w: 9.0, d: 1.8, h: 1.55 }; o.long = true; return o;
  },

  // ---------------- 6: Weltraum ----------------
  satellite() {
    const o = new Obj();
    o.box(1.7, 1.7, 1.7, 0, 0.85, 0, '#d4a63a');
    o.box(1.72, 0.1, 1.72, 0, 0.6, 0, '#a37a1e', { col: false });
    for (const s of [-1, 1]) {
      o.box(3.6, 0.12, 1.4, s * 2.65, 1.64, 0, '#1f3a6e');
      for (let k = -1; k <= 1; k++) o.box(0.04, 0.13, 1.42, s * 2.65 + k * 1.2, 1.645, 0, '#9aa', { col: false });
    }
    o.add(geoHalfSph(12), 0, -0.1, 0, 0.9, 0.4, 0.9, '#e8e8e8', PI, 0, 0);
    o.cyl(0.03, 1.4, 0.6, 2.4, 0.6, '#ccc', { col: false, seg: 4 });
    o.top = { w: 8.9, d: 1.4, h: 1.7 }; o.long = true; return o;
  },
  asteroid() {
    const o = new Obj(); const r = R(1.8, 2.6);
    const g = new T.IcosahedronGeometry(1, 1);
    const p = g.attributes.position; const seed = rng() * 1000;
    for (let i = 0; i < p.count; i++) { // same noise for shared corners -> no cracks
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const h = Math.sin(Math.round(x * 50) * 12.9898 + Math.round(y * 50) * 78.233 + Math.round(z * 50) * 37.719 + seed) * 43758.5453;
      const k = 0.82 + (h - Math.floor(h)) * 0.32; p.setXYZ(i, x * k, y * k, z * k);
    }
    o.add(g, 0, -r * 0.5, 0, r, r * 0.75, r, tint(pick(['#7d7368', '#6b6560', '#8a7d70']), 0.06));
    o.cyl(r * 0.75, 0.2, 0, -0.1, 0, '#8b8378', { col: false, seg: 9 });
    o.cyl(0.35, 0.05, r * 0.3, 0.0, 0.2, '#5a544d', { col: false, seg: 8 });
    o.colCyl(r * 0.75, r * 1.0, 0, -r * 0.5, 0);
    o.top = { w: r * 1.4, d: r * 1.4, h: 0 }; return o;
  },
  rocket() {
    const o = new Obj(); const L = 7;
    o.cyl(1.0, L, 0, 1.0, 0, '#f2f2f2', { rz: PI / 2, col: false, seg: 12 });
    o.cyl(1.02, 0.6, 1.2, 1.0, 0, '#c0392b', { rz: PI / 2, col: false, seg: 12 });
    o.cone(1.0, 2.2, L / 2 + 1.1, 1.0, 0, '#c0392b', { rz: -PI / 2, seg: 12 });
    o.cone(0.8, 0.9, -L / 2 - 0.3, 1.0, 0, '#555', { rz: -PI / 2, seg: 10 });
    o.cyl(0.35, 0.05, 2.0, 1.0, 1.0, '#5dade2', { rx: PI / 2, col: false, seg: 12 });
    for (const a of [0, PI / 2, PI, PI * 1.5]) o.box(1.4, 0.08, 1.0, -L / 2 + 0.7, 1.0 + Math.sin(a) * 1.3, Math.cos(a) * 1.3, '#c0392b', { rx: a, col: false });
    o.col(L + 2.0, 1.9, 1.7, 0.5, 1.0, 0);
    o.top = { w: L, d: 1.7, h: 1.95 }; o.long = true; return o;
  },
  module() {
    const o = new Obj(); const L = 5.2;
    o.cyl(1.35, L, 0, 1.35, 0, '#dfe3e6', { rz: PI / 2, col: false, seg: 12 });
    for (const x of [-L / 2 + 0.3, 0, L / 2 - 0.3]) o.cyl(1.42, 0.25, x, 1.35, 0, '#9aa3ab', { rz: PI / 2, col: false, seg: 12 });
    o.cyl(0.7, 0.6, L / 2 + 0.3, 1.35, 0, '#9aa3ab', { rz: PI / 2, col: false, seg: 10 });
    o.box(0.8, 0.05, 2.4, -1, 2.72, 0, '#1f3a6e', { col: false });
    o.col(L + 0.6, 2.6, 2.3, 0.3, 1.35, 0);
    o.top = { w: L, d: 2.3, h: 2.65 }; o.long = true; return o;
  },
  ufo() {
    const o = new Obj();
    o.cyl(3.0, 0.7, 0, 0.35, 0, '#9aa3ab', { rt: 0.55, seg: 16, col: false });
    o.colCyl(2.7, 0.7, 0, 0.35, 0);
    o.add(geoHalfSph(14), 0, 0.7, 0, 1.4, 0.9, 1.4, '#7fd8f0');
    o.cyl(1.0, 0.06, 0, 1.58, 0, '#a6e8f8', { col: false, seg: 12 });
    o.colCyl(1.15, 0.9, 0, 1.15, 0);
    for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; o.sph(0.14, Math.cos(a) * 2.6, 0.4, Math.sin(a) * 2.6, i % 2 ? '#ffe066' : '#ff5e5e', { seg: 5 }); }
    o.top = { w: 2.0, d: 2.0, h: 1.6 }; o.span = { w: 5.4, d: 5.4 }; return o; // span = overhang below the top
  },

  // ---------------- big rest platforms at the start of each area ----------------
  rest0() { // start pad (on the ground)
    const o = new Obj();
    o.box(7, 0.3, 7, 0, 0.15, 0, '#6d6d6d');
    for (let i = -3; i <= 3; i++) o.box(0.5, 0.02, 7, i, 0.31, 0, i % 2 ? '#f1c40f' : '#222', { col: false });
    o.top = { w: 7, d: 7, h: 0.3 }; return o;
  },
  rest1() {
    const o = new Obj();
    o.box(7, 0.5, 7, 0, 0.25, 0, '#7d858c');
    for (let i = 0; i < 14; i++) { const x = -3.25 + i * 0.5; o.box(0.5, 0.52, 0.2, x, 0.25, 3.45, i % 2 ? '#f1c40f' : '#222', { col: false }); o.box(0.5, 0.52, 0.2, x, 0.25, -3.45, i % 2 ? '#f1c40f' : '#222', { col: false }); }
    for (const sx of [-3, 3]) for (const sz of [-3, 3]) o.cyl(0.08, 4, sx, -2.0, sz, '#555', { col: false, seg: 5 });
    o.top = { w: 7, d: 7, h: 0.5 }; return o;
  },
  rest2() {
    const o = new Obj();
    o.box(7.5, 1.0, 7.5, 0, 0.5, 0, '#8e8f94');
    o.box(7.6, 0.15, 7.6, 0, 0.08, 0, '#6e6f74', { col: false });
    o.box(1.6, 2.4, 1.6, -2.6, 2.2, -2.6, '#b0a89c');
    o.box(0.04, 1.8, 0.9, -1.78, 1.9, -2.6, '#5a4a3a', { col: false });
    for (const s of [-1, 1]) { o.box(7.5, 0.06, 0.06, 0, 1.9, s * 3.7, '#aaa', { col: false }); o.box(0.06, 0.06, 7.5, s * 3.7, 1.9, 0, '#aaa', { col: false }); }
    o.top = { w: 7.5, d: 7.5, h: 1.0 }; return o;
  },
  rest3() { // giant table top
    const o = new Obj(); const wood = tint('#b07a46', 0.04);
    o.box(9, 0.5, 7, 0, -0.25, 0, wood);
    for (const sx of [-4, 4]) for (const sz of [-3, 3]) o.box(0.5, 6, 0.5, sx, -3.5, sz, wood.clone().multiplyScalar(0.85), { col: false });
    o.box(3, 0.02, 2, 1.5, 0.01, 1.5, '#e8e1d0', { col: false });
    o.top = { w: 9, d: 7, h: 0 }; return o;
  },
  rest4() { return BUILD.cloud(8, 7); },
  rest5() { // moon rock base
    const o = new Obj();
    o.colCyl(4.3, 1.5, 0, -0.75, 0);
    o.cyl(4.4, 1.5, 0, -0.75, 0, '#9a9a9e', { col: false, seg: 10 });
    o.add(geoCone(10), 0, -3, 0, 4.2, 3, 4.2, '#7d7d82', PI, 0, 0);
    for (let i = 0; i < 6; i++) o.cyl(R(0.3, 0.8), 0.04, (rng() - 0.5) * 5, 0.0, (rng() - 0.5) * 5, '#828287', { col: false, seg: 8 });
    o.top = { w: 8, d: 8, h: 0 }; return o;
  },
};

const LONG_NARROW = new Set(['ibeam', 'pencil', 'trafficlight']);

// ============================================================
//  Map 2: new parts
// ============================================================
// put another object's parts into this one (translated + rotated around y)
Obj.prototype.merge = function (other, x, y, z, ry = 0) {
  const m = new T.Matrix4().compose(new V3(x, y, z), new T.Quaternion().setFromAxisAngle(UP, ry), new V3(1, 1, 1));
  for (const p of other.parts) this.parts.push({ geo: p.geo, m: m.clone().multiply(p.m), color: p.color });
  const c = Math.cos(ry), s = Math.sin(ry);
  for (const k of other.cols) this.cols.push({ ...k, x: x + k.x * c + k.z * s, y: y + k.y, z: z - k.x * s + k.z * c, ry: k.ry + ry });
  return this;
};

Object.assign(BUILD, {
  // ---------- Schrottplatz ----------
  cart() {
    const o = new Obj(); const steel = '#b9c0c7', W = 2.1, D = 1.35, H = 1.3, y0 = 0.7;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      o.cyl(0.035, H, sx * W / 2, y0 + H / 2, sz * D / 2, steel, { col: false, seg: 4 });
      o.cyl(0.14, 0.08, sx * (W / 2 - 0.15), 0.14, sz * (D / 2 - 0.1), '#222', { rx: PI / 2, col: false, seg: 8 });
      o.cyl(0.03, y0 - 0.1, sx * (W / 2 - 0.15), y0 / 2 + 0.1, sz * (D / 2 - 0.1), steel, { col: false, seg: 4 });
    }
    for (let x = -W / 2; x <= W / 2 + 0.01; x += 0.21) { o.box(0.025, H, 0.025, x, y0 + H / 2, D / 2, steel, { col: false }); o.box(0.025, H, 0.025, x, y0 + H / 2, -D / 2, steel, { col: false }); }
    for (let y = y0; y <= y0 + H + 0.01; y += 0.26) { o.box(W, 0.025, 0.025, 0, y, D / 2, steel, { col: false }); o.box(W, 0.025, 0.025, 0, y, -D / 2, steel, { col: false }); o.box(0.025, 0.025, D, W / 2, y, 0, steel, { col: false }); o.box(0.025, 0.025, D, -W / 2, y, 0, steel, { col: false }); }
    o.box(W, 0.04, D, 0, y0, 0, steel, { col: false });
    for (let i = 0; i < 9; i++) o.box(R(0.4, 0.8), R(0.3, 0.6), R(0.3, 0.6), R(-0.7, 0.7), y0 + H - 0.3, R(-0.4, 0.4), pick(PAL.bright), { ry: rng() * 3, col: false });
    o.cyl(0.04, D + 0.2, -W / 2 - 0.25, y0 + H + 0.05, 0, '#d63031', { rx: PI / 2, col: false, seg: 6 });
    o.col(W, H, D, 0, y0 + H / 2, 0);
    o.top = { w: W, d: D, h: y0 + H }; o.long = true; return o;
  },
  vending() {
    const o = new Obj(); const c = tint(pick(['#c0392b', '#2e86c1', '#27ae60']), 0.05);
    o.box(2.3, 1.0, 1.3, 0, 0.5, 0, c);
    o.box(1.5, 0.02, 0.9, -0.3, 1.0, 0, '#bfe6f5', { col: false });
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) o.cyl(0.08, 0.3, -0.9 + i * 0.3, 0.98, -0.3 + j * 0.3, pick(['#e74c3c', '#f1c40f', '#2ecc71', '#ecf0f1']), { rz: PI / 2, col: false, seg: 6 });
    o.box(0.5, 0.02, 0.4, 0.8, 1.0, 0.2, '#2c3e50', { col: false });
    o.box(0.3, 0.02, 0.15, 0.8, 1.0, -0.3, '#111', { col: false });
    o.top = { w: 2.3, d: 1.3, h: 1.0 }; o.long = true; return o;
  },
  arcade() {
    const o = new Obj(); const c = tint(pick(['#1f1f3a', '#5b2c83', '#1b4f72']), 0.05);
    o.box(1.4, 2.4, 1.3, 0, 1.2, 0, c);
    o.box(0.04, 0.7, 1.0, 0.71, 1.55, 0, '#0b0b0b', { col: false });
    o.box(0.04, 0.55, 0.85, 0.73, 1.55, 0, pick(['#39ff88', '#3df2ff', '#ff4fd8']), { col: false });
    o.box(0.45, 0.12, 1.25, 0.88, 1.0, 0, '#222', { col: false });
    o.cyl(0.05, 0.2, 0.9, 1.15, -0.3, '#c0392b', { col: false, seg: 6 });
    for (const z of [0.1, 0.3, 0.5]) o.cyl(0.06, 0.04, 0.9, 1.07, z, pick(['#f1c40f', '#e74c3c', '#3498db']), { col: false, seg: 8 });
    o.box(0.05, 0.35, 1.2, 0.71, 2.2, 0, '#ffd84a', { col: false });
    o.top = { w: 1.4, d: 1.3, h: 2.4 }; return o;
  },
  // ---------- Baustelle ----------
  jersey() {
    const o = new Obj(); const L = R(3.4, 4.2);
    o.box(L, 0.45, 1.4, 0, 0.225, 0, '#c9c9c4');
    o.box(L, 0.65, 1.0, 0, 0.775, 0, '#d2d2cc');
    for (let x = -L / 2 + 0.3; x < L / 2; x += 0.8) o.box(0.4, 0.3, 1.02, x, 0.85, 0, '#c0392b', { col: false });
    o.top = { w: L, d: 1.0, h: 1.1 }; o.long = true; return o;
  },
  planks() {
    const o = new Obj(); const n = RI(5, 8);
    for (let i = 0; i < n; i++) for (let k = 0; k < 6; k++) o.box(3.4, 0.12, 0.28, (rng() - 0.5) * 0.15, 0.06 + i * 0.16, -0.75 + k * 0.3, tint(pick(PAL.wood), 0.1), { col: false });
    for (let i = 0; i < n; i += 2) for (const x of [-1.2, 0, 1.2]) o.box(0.12, 0.04, 1.85, x, 0.14 + i * 0.16, 0, '#6b4a2b', { col: false });
    const h = n * 0.16;
    o.col(3.4, h, 1.8, 0, h / 2, 0);
    o.top = { w: 3.4, d: 1.8, h }; o.long = true; return o;
  },
  pipestack() {
    const o = new Obj(); const L = 4.4, r = 0.33;
    for (let row = 0; row < 3; row++) for (let i = 0; i < 4 - (row === 2 ? 0 : 0); i++) {
      const z = -1.0 + i * 0.67, y = r + row * 0.6;
      o.cyl(r, L, 0, y, z, tint(pick(['#7f8c8d', '#95a5a6', '#c0392b']), 0.05), { rz: PI / 2, col: false, seg: 8 });
      o.cyl(r * 0.7, L + 0.02, 0, y, z, '#2c2c2c', { rz: PI / 2, col: false, seg: 8 });
    }
    for (const x of [-1.4, 1.4]) o.box(0.08, 1.9, 2.75, x, 0.95, 0, '#e67e22', { col: false });
    o.col(L, 1.85, 2.6, 0, 0.925, 0);
    o.top = { w: L, d: 2.6, h: 1.85 }; o.long = true; return o;
  },
  // ---------- Hafen ----------
  crate() {
    const o = new Obj(); const s = R(1.7, 2.1); const c = tint('#b98a52', 0.08), dk = c.clone().multiplyScalar(0.75);
    o.box(s, s, s, 0, s / 2, 0, c);
    for (const sg of [-1, 1]) {
      o.box(s + 0.04, 0.16, 0.16, 0, 0.1, sg * s / 2, dk, { col: false }); o.box(s + 0.04, 0.16, 0.16, 0, s - 0.1, sg * s / 2, dk, { col: false });
      o.box(0.16, 0.16, s + 0.04, sg * s / 2, 0.1, 0, dk, { col: false }); o.box(0.16, 0.16, s + 0.04, sg * s / 2, s - 0.1, 0, dk, { col: false });
      o.box(Math.hypot(s, s) * 0.92, 0.14, 0.04, 0, s / 2, sg * (s / 2 + 0.02), dk, { rz: PI / 4, col: false });
    }
    o.box(s * 0.5, 0.01, s * 0.3, 0, s + 0.005, 0, '#2c2c2c', { col: false }); // stencil
    o.top = { w: s, d: s, h: s }; return o;
  },
  crateStack() {
    const o = new Obj();
    const a = BUILD.crate(), b = BUILD.crate(), c = BUILD.crate();
    o.merge(a, -1.1, 0, 0.2, 0.2); o.merge(b, 1.1, 0, -0.1, -0.15);
    const h0 = Math.max(a.top.h, b.top.h);
    o.merge(c, 0, h0, 0, 0);
    o.top = { w: c.top.w, d: c.top.d, h: h0 + c.top.h }; o.span = { w: 4.4, d: 2.4 }; o.long = true; return o;
  },
  buoy() {
    const o = new Obj(); const c = pick(['#e74c3c', '#f39c12', '#27ae60']);
    o.cyl(1.0, 0.9, 0, 0.45, 0, c, { col: false, seg: 12 });
    o.cyl(1.02, 0.25, 0, 0.6, 0, '#ffffff', { col: false, seg: 12 });
    o.cyl(1.15, 0.15, 0, 0.98, 0, '#555', { col: false, seg: 12 });
    o.cone(0.9, 1.2, 0, -0.6, 0, c, { rx: PI, seg: 12 });
    o.cyl(0.06, 1.4, 0.75, 1.75, 0, '#ddd', { col: false, seg: 5 });
    o.sph(0.15, 0.75, 2.5, 0, '#fff4a0', { seg: 6 });
    o.colCyl(1.1, 1.05, 0, 0.525, 0);
    o.top = { w: 2.0, d: 2.0, h: 1.05 }; return o;
  },
  bollard() {
    const o = new Obj();
    o.box(1.8, 0.3, 1.8, 0, 0.15, 0, '#7f8c8d');
    o.cyl(0.55, 1.0, 0, 0.8, 0, '#2c2c2c', { col: false, seg: 10 });
    o.cyl(0.75, 0.22, 0, 1.4, 0, '#2c2c2c', { col: false, seg: 10 });
    o.torus(0.6, 0.12, 0, 0.9, 0, '#c8a96a', { rx: PI / 2, seg: 12 });
    o.colCyl(0.75, 1.21, 0, 0.905, 0);
    o.top = { w: 1.4, d: 1.4, h: 1.51 }; return o;
  },
  rowboat() {
    const o = new Obj(); const L = 4.4, c = tint(pick(['#2e86c1', '#c0392b', '#f0f0f0', '#27ae60']), 0.05);
    o.box(L - 1.2, 0.8, 1.6, -0.3, 0.4, 0, c, { col: false });
    o.box(1.4, 0.8, 1.1, L / 2 - 0.85, 0.4, 0, c, { ry: 0, col: false });
    o.add(geoCone(4), L / 2 - 0.1, 0.4, 0, 0.78, 1.0, 0.78, c, 0, PI / 4, -PI / 2);
    o.box(L - 0.6, 0.06, 1.62, -0.1, 0.83, 0, '#2c3e50', { col: false }); // tarp
    o.box(L, 0.1, 0.1, 0, 0.75, 0.82, '#8b5a2b', { col: false });
    o.box(L, 0.1, 0.1, 0, 0.75, -0.82, '#8b5a2b', { col: false });
    o.box(0.1, 0.06, 2.8, -0.6, 0.9, 0, '#a0794a', { col: false, ry: 0.4 }); // oar
    o.col(L, 0.86, 1.6, 0, 0.43, 0);
    o.top = { w: L - 0.4, d: 1.6, h: 0.86 }; o.long = true; return o;
  },
  containers2() {
    const o = new Obj(); const a = BUILD.container(), b = BUILD.container();
    o.merge(a, 0, 0, 0, 0); o.merge(b, 0, a.top.h, 0, PI / 2);
    o.top = { w: b.top.d, d: b.top.w, h: a.top.h + b.top.h }; return o;
  },
  // ---------- Stadt ----------
  vent() {
    const o = new Obj(); const c = tint('#aab2b9', 0.05);
    o.box(1.7, 1.3, 1.7, 0, 0.65, 0, c);
    for (let y = 0.25; y < 1.2; y += 0.18) o.box(1.72, 0.06, 1.72, 0, y, 0, '#7f8890', { col: false });
    o.cyl(0.55, 0.1, 0, 1.35, 0, '#6d757c', { col: false, seg: 12 });
    o.cyl(0.08, 0.14, 0, 1.36, 0, '#333', { col: false, seg: 6 });
    o.top = { w: 1.7, d: 1.7, h: 1.4 }; return o;
  },
  solar() {
    const o = new Obj();
    for (const sx of [-1.3, 1.3]) for (const sz of [-0.8, 0.8]) o.cyl(0.06, 1.2, sx, 0.6, sz, '#888', { seg: 5 });
    o.box(3.2, 0.12, 2.2, 0, 1.26, 0, '#bdc3c7');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) o.box(0.72, 0.02, 0.66, -1.17 + i * 0.78, 1.33, -0.71 + j * 0.71, '#1b3a6b', { col: false });
    o.top = { w: 3.2, d: 2.2, h: 1.32 }; o.long = true; return o;
  },
  pigeon() {
    const o = new Obj(); const wood = tint('#c9a26b', 0.06);
    o.box(1.7, 1.4, 1.7, 0, 0.7, 0, wood);
    for (const z of [-0.4, 0.4]) o.box(0.04, 0.3, 0.3, 0.86, 0.9, z, '#2c1f14', { col: false });
    o.box(1.95, 0.18, 1.95, 0, 1.49, 0, '#7f3b2b');
    for (let i = 0; i < 3; i++) { const x = R(-0.6, 0.6), z = R(-0.6, 0.6); o.sph(0.13, x, 1.67, z, '#9aa0a8', { sx: 1.5, seg: 6 }); o.sph(0.07, x + 0.15, 1.78, z, '#7a8088', { seg: 5 }); }
    o.top = { w: 1.95, d: 1.95, h: 1.58 }; return o;
  },
  // ---------- Riesenzimmer ----------
  sponge() {
    const o = new Obj();
    o.box(3.2, 1.1, 2.0, 0, 0.55, 0, '#f4d03f');
    o.box(3.2, 0.35, 2.0, 0, 1.275, 0, '#27ae60');
    for (let i = 0; i < 10; i++) o.cyl(0.08, 0.02, R(-1.4, 1.4), R(0.2, 0.9), 1.01, '#c9a227', { rx: PI / 2, col: false, seg: 6 });
    o.sph(0.25, 0.8, 1.48, 0.4, '#e8f6ff', { sy: 0.6, seg: 6 }); // soap bubble foam
    o.top = { w: 3.2, d: 2.0, h: 1.45 }; o.long = true; return o;
  },
  remote() {
    const o = new Obj();
    o.box(5.2, 0.5, 1.6, 0, 0.25, 0, '#1e1e1e');
    o.cyl(0.18, 0.06, 2.2, 0.52, 0, '#e74c3c', { col: false, seg: 10 });
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) o.cyl(0.14, 0.05, -1.6 + i * 0.6, 0.52, -0.45 + j * 0.45, '#555', { col: false, seg: 8 });
    o.box(0.9, 0.05, 0.3, 1.2, 0.52, 0.4, '#27ae60', { col: false }); o.box(0.9, 0.05, 0.3, 1.2, 0.52, -0.4, '#2e86c1', { col: false });
    o.top = { w: 5.2, d: 1.6, h: 0.5 }; o.long = true; return o;
  },
  cheese() {
    const o = new Obj();
    o.box(3.0, 1.6, 2.2, 0, 0.8, 0, '#f7c948');
    for (let i = 0; i < 9; i++) {
      const side = RI(0, 2), r = R(0.12, 0.3);
      if (side === 0) o.cyl(r, 0.02, R(-1.3, 1.3), 1.61, R(-0.9, 0.9), '#d9a520', { col: false, seg: 8 });
      else if (side === 1) o.cyl(r, 0.02, R(-1.3, 1.3), R(0.3, 1.3), 1.11, '#d9a520', { rx: PI / 2, col: false, seg: 8 });
      else o.cyl(r, 0.02, 1.51, R(0.3, 1.3), R(-0.9, 0.9), '#d9a520', { rz: PI / 2, col: false, seg: 8 });
    }
    o.top = { w: 3.0, d: 2.2, h: 1.6 }; return o;
  },
  cookie() {
    const o = new Obj(); const r = R(1.7, 2.1);
    o.cyl(r, 0.45, 0, 0.225, 0, '#c68b4e', { col: false, seg: 14 });
    for (let i = 0; i < 9; i++) { const a = rng() * PI * 2, d = rng() * r * 0.8; o.box(0.22, 0.1, 0.22, Math.cos(a) * d, 0.47, Math.sin(a) * d, '#4a2b17', { ry: rng(), col: false }); }
    o.colCyl(r, 0.45, 0, 0.225, 0);
    o.top = { w: r * 1.8, d: r * 1.8, h: 0.45 }; return o;
  },
  // ---------- Jahrmarkt ----------
  bumpercar() {
    const o = new Obj(); const c = tint(pick(['#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#2ecc71']), 0.05);
    o.box(2.6, 0.4, 1.7, 0, 0.3, 0, '#2c2c2c');
    o.box(2.4, 0.55, 1.55, 0, 0.75, 0, c);
    o.box(0.5, 0.5, 1.3, -0.95, 1.25, 0, c.clone().multiplyScalar(0.8), { col: false });
    o.cyl(0.04, 2.4, -1.05, 2.2, 0, '#bbb', { col: false, seg: 4 });
    o.cyl(0.12, 0.15, -1.05, 3.4, 0, '#ffd84a', { col: false, seg: 6 });
    o.cyl(0.25, 0.05, 0.6, 1.05, 0, '#222', { col: false, seg: 10 });
    o.box(0.3, 0.05, 0.6, 1.0, 1.04, 0, '#fff', { col: false });
    o.top = { w: 2.4, d: 1.55, h: 1.02 }; o.long = true; return o;
  },
  popcorn() {
    const o = new Obj();
    o.box(1.7, 1.2, 1.3, 0, 0.8, 0, '#c0392b');
    for (let x = -0.7; x <= 0.71; x += 0.35) o.box(0.15, 1.2, 1.32, x, 0.8, 0, '#ffffff', { col: false });
    o.box(1.5, 1.1, 1.1, 0, 1.95, 0, '#fff7c2', { col: false });
    for (let i = 0; i < 14; i++) o.sph(0.1, R(-0.6, 0.6), R(1.5, 2.1), R(-0.45, 0.45), '#fff3b0', { seg: 4 });
    o.box(2.0, 0.2, 1.6, 0, 2.6, 0, '#c0392b');
    o.col(1.5, 1.1, 1.1, 0, 1.95, 0);
    for (const sx of [-0.6, 0.6]) o.cyl(0.25, 0.1, sx, 0.25, 0.7, '#333', { rx: PI / 2, col: false, seg: 10 });
    o.top = { w: 2.0, d: 1.6, h: 2.7 }; return o;
  },
  giftbox() {
    const o = new Obj(); const s = R(2.0, 2.5); const c = tint(pick(PAL.bright), 0.04), rb = pick(['#ffd84a', '#ffffff', '#e74c3c']);
    o.box(s, s, s, 0, s / 2, 0, c);
    o.box(s + 0.03, s + 0.03, 0.3, 0, s / 2, 0, rb, { col: false });
    o.box(0.3, s + 0.03, s + 0.03, 0, s / 2, 0, rb, { col: false });
    o.torus(0.3, 0.3, 0.25, s + 0.15, 0, rb, { rx: 0.3, seg: 8 });
    o.torus(0.3, 0.3, -0.25, s + 0.15, 0, rb, { rx: -0.3, seg: 8 });
    o.top = { w: s, d: s, h: s }; return o;
  },
  teacup() {
    const o = new Obj(); const c = tint(pick(['#ff9ff3', '#48dbfb', '#feca57', '#1dd1a1']), 0.04);
    o.cyl(2.3, 0.25, 0, 0.125, 0, '#f5f5f5', { col: false, seg: 16 });
    o.cyl(1.7, 1.5, 0, 1.0, 0, c, { rt: 1.0, col: false, seg: 16 });
    o.cyl(1.55, 0.02, 0, 1.74, 0, '#8e5a2b', { col: false, seg: 16 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; o.sph(0.18, Math.cos(a) * 1.72, 1.0, Math.sin(a) * 1.72, '#ffffff', { seg: 5 }); }
    o.torus(0.55, 0.25, 1.9, 1.05, 0, c, { seg: 10 });
    o.colCyl(2.3, 0.25, 0, 0.125, 0); o.colCyl(1.7, 1.5, 0, 1.0, 0);
    o.top = { w: 3.0, d: 3.0, h: 1.75 }; o.span = { w: 4.6, d: 4.6 }; return o;
  },
  ticket() {
    const o = new Obj();
    o.box(1.8, 2.2, 1.8, 0, 1.1, 0, '#2e86c1');
    o.box(0.04, 0.8, 1.2, 0.91, 1.5, 0, '#bfe6f5', { col: false });
    o.box(0.3, 0.06, 1.2, 1.05, 1.05, 0, '#f1c40f', { col: false });
    o.box(2.2, 0.25, 2.2, 0, 2.32, 0, '#e74c3c');
    for (let i = 0; i < 6; i++) o.box(0.36, 0.26, 2.22, -0.9 + i * 0.36, 2.32, 0, i % 2 ? '#ffffff' : '#e74c3c', { col: false });
    o.box(0.04, 0.35, 1.4, 0.92, 2.0, 0, '#ffd84a', { col: false });
    o.top = { w: 2.2, d: 2.2, h: 2.45 }; return o;
  },
  podium() {
    const o = new Obj(); const r = R(1.5, 1.9);
    o.cyl(r, 1.2, 0, 0.6, 0, '#c0392b', { col: false, seg: 12 });
    for (let i = 0; i < 6; i++) o.box(0.35, 1.22, 0.05, Math.cos(i / 6 * PI * 2) * r * 0.97, 0.6, Math.sin(i / 6 * PI * 2) * r * 0.97, '#ffffff', { ry: -i / 6 * PI * 2 + PI / 2, col: false });
    o.cyl(r + 0.08, 0.12, 0, 1.2, 0, '#d4af37', { col: false, seg: 12 });
    o.cyl(r + 0.08, 0.12, 0, 0.06, 0, '#d4af37', { col: false, seg: 12 });
    for (let i = 0; i < 5; i++) { const a = rng() * PI * 2; o.sph(0.07, Math.cos(a) * r * 0.5, 1.27, Math.sin(a) * r * 0.5, '#ffd84a', { seg: 5 }); }
    o.colCyl(r, 1.26, 0, 0.63, 0);
    o.top = { w: r * 1.8, d: r * 1.8, h: 1.26 }; return o;
  },
  // ---------- Wolken ----------
  gondola() {
    const o = new Obj(); const c = tint(pick(['#e74c3c', '#f1c40f', '#2e86c1']), 0.05);
    o.box(2.8, 2.0, 2.2, 0, 1.0, 0, c);
    for (const sz of [-1, 1]) o.box(2.4, 0.8, 0.02, 0, 1.35, sz * 1.11, '#cfefff', { col: false });
    o.box(3.0, 0.2, 2.4, 0, 2.1, 0, '#ecf0f1');
    o.box(0.15, 2.5, 0.15, 0, 3.4, 0, '#7f8c8d', { col: false });
    o.cyl(0.05, 40, 0, 4.7, 0, '#333', { rz: PI / 2, col: false, seg: 4 });
    o.top = { w: 3.0, d: 2.4, h: 2.2 }; o.long = true; return o;
  },
  paperplane() {
    const o = new Obj(); const c = '#fbfbf6';
    o.box(6.0, 0.08, 1.4, 0, 0.25, 0.75, c, { rx: 0.12, col: false });
    o.box(6.0, 0.08, 1.4, 0, 0.25, -0.75, c, { rx: -0.12, col: false });
    o.box(6.0, 0.6, 0.06, 0, -0.05, 0, '#e8e8e0', { col: false });
    o.add(geoCone(3), 3.4, 0.2, 0, 0.6, 1.4, 1.6, c, 0, 0, -PI / 2);
    o.box(5.5, 0.01, 0.04, 0, 0.42, 0.75, '#d0d0c8', { col: false });
    o.col(6.0, 0.4, 2.8, 0, 0.2, 0);
    o.top = { w: 6.0, d: 2.6, h: 0.4 }; o.long = true; return o;
  },
  // ---------- Weltraum ----------
  rover() {
    const o = new Obj();
    o.box(3.2, 0.45, 2.0, 0, 1.05, 0, '#cfd3d6');
    o.box(3.0, 0.08, 1.8, 0, 1.31, 0, '#d4a63a', { col: false });
    for (const sx of [-1.2, 0, 1.2]) for (const sz of [-1.15, 1.15]) {
      o.cyl(0.42, 0.3, sx, 0.42, sz, '#3a3a3a', { rx: PI / 2, col: false, seg: 10 });
      o.cyl(0.06, 0.6, sx, 0.75, sz * 0.92, '#888', { col: false, seg: 4 });
    }
    o.cyl(0.04, 1.4, -1.3, 2.0, 0.7, '#aaa', { col: false, seg: 4 });
    o.add(geoHalfSph(10), -1.3, 2.7, 0.7, 0.5, 0.18, 0.5, '#eee', PI, 0, 0);
    o.box(0.6, 0.4, 0.6, 1.2, 1.5, -0.5, '#555', { col: false });
    o.top = { w: 3.2, d: 2.0, h: 1.3 }; o.long = true; return o;
  },
  crystal() {
    const o = new Obj(); const c = tint(pick(['#a66bff', '#4fe3ff', '#ff6bd6']), 0.06);
    o.cyl(1.2, 2.2, 0, 1.1, 0, c, { col: false, seg: 6 });
    o.cyl(1.0, 0.04, 0, 2.21, 0, c.clone().lerp(new T.Color('#ffffff'), 0.4), { col: false, seg: 6 });
    for (let i = 0; i < 5; i++) { const a = rng() * PI * 2; o.cyl(R(0.25, 0.45), R(1.0, 2.2), Math.cos(a) * 1.4, 0.5, Math.sin(a) * 1.4, c.clone().multiplyScalar(0.85), { rx: R(-0.5, 0.5), rz: R(-0.5, 0.5), col: false, seg: 6 }); }
    o.add(geoCone(6), 0, -0.9, 0, 1.15, 1.8, 1.15, '#6b6560', PI, 0, 0);
    o.colCyl(1.15, 2.2, 0, 1.1, 0);
    o.top = { w: 2.0, d: 2.0, h: 2.2 }; return o;
  },
  probe() {
    const o = new Obj();
    o.cyl(1.2, 1.4, 0, 0.7, 0, '#d4a63a', { col: false, seg: 8 });
    o.cyl(1.22, 0.1, 0, 1.42, 0, '#9aa3ab', { col: false, seg: 8 });
    o.add(geoHalfSph(14), 2.2, 0.7, 0, 1.3, 0.4, 1.3, '#f2f2f2', 0, 0, PI / 2);
    o.cyl(0.05, 1.0, 1.6, 0.7, 0, '#aaa', { rz: PI / 2, col: false, seg: 4 });
    o.cyl(0.04, 2.6, -1.0, 0.7, 0.9, '#bbb', { rx: PI / 2, rz: 0.4, col: false, seg: 4 });
    o.colCyl(1.2, 1.47, 0, 0.735, 0);
    o.top = { w: 2.2, d: 2.2, h: 1.47 }; return o;
  },
  // ---------- new rest platforms ----------
  restHarbor() {
    const o = new Obj(); const wood = tint('#9c7046', 0.04);
    o.box(8, 0.4, 6.5, 0, -0.2, 0, wood);
    for (let x = -3.6; x <= 3.7; x += 0.8) o.box(0.04, 0.41, 6.5, x, -0.2, 0, '#6e4c2d', { col: false });
    for (const sx of [-3.7, 3.7]) for (const sz of [-3.0, 0, 3.0]) o.cyl(0.25, 6, sx, -3.0, sz, '#5d4029', { col: false, seg: 8 });
    o.merge(BUILD.bollard(), 3.0, 0, 2.5, 0);
    o.top = { w: 8, d: 6.5, h: 0 }; return o;
  },
  restFair() {
    const o = new Obj();
    o.colCyl(4.3, 1.0, 0, -0.5, 0);
    o.cyl(4.4, 1.0, 0, -0.5, 0, '#c0392b', { col: false, seg: 16 });
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; if (i % 2) o.box(1.7, 1.02, 0.05, Math.cos(a) * 4.3, -0.5, Math.sin(a) * 4.3, '#ffffff', { ry: -a + PI / 2, col: false }); o.sph(0.12, Math.cos(a) * 4.35, 0.02, Math.sin(a) * 4.35, '#ffe066', { seg: 5 }); }
    o.cyl(4.2, 0.02, 0, 0.005, 0, '#e8d5a8', { col: false, seg: 16 });
    o.top = { w: 8, d: 8, h: 0 }; return o;
  },
});
