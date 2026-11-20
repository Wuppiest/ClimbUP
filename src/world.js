// ============================================================
//  ClimbUP – world generation (fixed seed -> always the same map)
// ============================================================
const AREAS = [
  { name: 'Schrottplatz', n: 20, cls: [0.72, 0.28, 0], g: CFG.G,
    b: ['car', 'car', 'barrels', 'tires', 'washer', 'fridge', 'pallets', 'container', 'mattress', 'crt'],
    sky: ['#79aee6', '#f0dcb0'], fog: [40, 300] },
  { name: 'Baustelle', n: 22, cls: [0.42, 0.58, 0], g: CFG.G,
    b: ['ibeam', 'ibeam', 'pipe', 'scaffold', 'drum', 'toilet', 'concrete', 'bricks', 'container'],
    sky: ['#6ea4dc', '#f4e2bd'], fog: [50, 320] },
  { name: 'Dächer der Stadt', n: 22, cls: [0.32, 0.58, 0.10], g: CFG.G,
    b: ['ac', 'tank', 'bus', 'taxi', 'booth', 'dish', 'chimney', 'billboard', 'trafficlight'],
    sky: ['#5a8fd8', '#ffd6a0'], fog: [60, 360] },
  { name: 'Riesenzimmer', n: 22, cls: [0.27, 0.55, 0.18], g: CFG.G,
    b: ['toaster', 'block', 'books', 'mug', 'plates', 'brick', 'pencil', 'cube3', 'dice', 'choco'],
    sky: ['#7a6fd0', '#ffbe9a'], fog: [60, 380] },
  { name: 'Über den Wolken', n: 20, cls: [0.25, 0.5, 0.25], g: CFG.G,
    b: ['cloud', 'cloud', 'balloon', 'plane', 'island', 'blimp'],
    sky: ['#2f6fd6', '#d3ebff'], fog: [80, 500] },
  { name: 'Weltraum', n: 20, cls: [0.25, 0.5, 0.25], g: CFG.G_SPACE,
    b: ['satellite', 'asteroid', 'asteroid', 'rocket', 'module', 'ufo'],
    sky: ['#01020a', '#0d1236'], fog: [200, 1400] },
];
const TUTORIAL = {
  2: ['LEERTASTE HALTEN', '= Sprung aufladen', 'Länger halten = höher'],
  5: ['VOLL AUFLADEN', 'für die ganz hohen Sprünge', 'Achte auf "MAX!"'],
  8: ['E = CHECKPOINT-FLAGGE', 'auf flachem Boden setzen.', 'R = Respawn an der Flagge'],
  12: ['LEERTASTE an einer Wand', 'halten = GRINDEN', 'Loslassen = abstoßen!'],
};

const WORLD = { start: new V3(0, 0.31, 0), startYaw: -PI / 2, path: [], signs: [], duck: null, goalY: 0, fails: 0 };

function exitDist(p, ux, uz) {
  const a = Math.abs(ux * Math.cos(p.yaw) - uz * Math.sin(p.yaw));
  const b = Math.abs(ux * Math.sin(p.yaw) + uz * Math.cos(p.yaw));
  return Math.min(a > 1e-6 ? (p.w / 2) / a : 1e9, b > 1e-6 ? (p.d / 2) / b : 1e9);
}
function landTime(v, dy, g) { return (v + Math.sqrt(Math.max(0, v * v - 2 * g * dy))) / g; }

const TOUCH_DEVICE = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (navigator.maxTouchPoints > 0 && 'ontouchstart' in window);
function makeSign(lines, x, y, z, faceX, faceZ, accent = '#ffb52e') {
  if (TOUCH_DEVICE) lines = lines.map((l) => l.replace('LEERTASTE', 'SPRUNG-KNOPF').replace('E = ', '🚩 = ').replace('R = ', '↺ = ').replace(' (F)', ''));
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
  const c = cv.getContext('2d');
  c.fillStyle = '#1b1f33'; c.strokeStyle = accent; c.lineWidth = 22;
  const r = 50; c.beginPath(); c.roundRect(14, 14, 996, 484, r); c.fill(); c.stroke();
  c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  const n = lines.length;
  lines.forEach((l, i) => {
    const big = i === 0;
    c.font = (big ? '900 ' : '700 ') + (big ? 92 : 64) + 'px "Segoe UI", system-ui, sans-serif';
    c.fillStyle = big ? accent : '#fff';
    c.fillText(l, 512, 256 + (i - (n - 1) / 2) * 120);
  });
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
  const m = new T.Mesh(new T.PlaneGeometry(4, 2), new T.MeshBasicMaterial({ map: tex, transparent: true, side: T.DoubleSide }));
  m.position.set(x, y, z);
  m.rotation.y = Math.atan2(faceX, faceZ);
  WORLD.signs.push(m);
  return m;
}

function buildWorld() {
  rng = mulberry32(20261119);
  const accs = AREAS.map(() => new MeshAcc());
  const decoAcc = new MeshAcc();   // far background, no shadows
  const placed = [];               // {min,max}
  const corridors = [];
  let fails = 0;

  // ground (big collider)
  const I = objTransform(0, 0, 0, 0);
  addCollider(makeOBB({ w: 2400, h: 2, d: 2400, x: 0, y: -1, z: 0, rx: 0, ry: 0, rz: 0 }, I.gm, I.gq));

  // start pad
  const startObj = BUILD.rest0();
  placeObj(startObj, 0, 0, 0, 0, accs[0]);
  placed.push(objAABB(startObj, 0, 0, 0, 0));
  let prev = { x: 0, y: 0.3, z: 0, yaw: 0, w: 7, d: 7 };
  let heading = 0;
  WORLD.path.push({ ...prev, area: 0 });
  makeSign(['ClimbUP', 'LEERTASTE halten = aufladen', 'loslassen = springen!'], 4.5, 3.0, -5.0, -1, 0.6);

  function stepPlace(obj, cls, g, acc, area, isRest) {
    const v = cls === 'perfect' ? CFG.HOP_PERFECT : cls === 'high' ? CFG.HOP_HIGH : CFG.HOP_MOVE;
    const hmax = v * v / (2 * g);
    let dy;
    if (cls === 'normal') dy = (rng() < 0.15 && !isRest) ? R(-1.6, -0.3) : R(0.1, 0.62 * hmax);
    else if (cls === 'high') dy = R(0.45 * hmax, 0.8 * hmax);
    else dy = R(0.76 * hmax, 0.84 * hmax);
    const reach = CFG.MOVE_SPEED * landTime(v, dy, g);
    const gapMax = Math.max(1.0, 0.6 * reach - 0.45);
    let topY = prev.y + dy;
    if (topY < 0.6) topY = 0.6 + rng() * 0.5; // never below the junkyard floor
    // steer the path so it stays in a column around the center
    heading += R(-0.55, 0.55);
    const pr = Math.hypot(prev.x, prev.z);
    if (pr > 24) {
      const hc = Math.atan2(prev.z, -prev.x);
      let d = hc - heading; d = Math.atan2(Math.sin(d), Math.cos(d));
      heading += d * Math.min(1, (pr - 24) / 14);
    }
    let best = null;
    for (let t = 0; t < 60; t++) {
      const hd = heading + (rng() - 0.5) * (t < 20 ? 1.0 : t < 40 ? 2.4 : 6.2);
      const ux = Math.cos(hd), uz = -Math.sin(hd);
      const gap = R(0.9, gapMax) * (t > 30 ? 0.85 : 1);
      const yaw = obj.long ? hd : (isRest ? hd : rng() * PI * 2);
      const eNext = exitDist({ yaw, w: obj.top.w, d: obj.top.d }, ux, uz);
      const dist = exitDist(prev, ux, uz) + gap + eNext;
      const cx = prev.x + ux * dist, cz = prev.z + uz * dist;
      const cand = { cx, cz, yaw, hd, gap };
      if (Math.hypot(cx, cz) > 42 && t < 50) continue;
      const box = objAABB(obj, cx, topY - obj.top.h, cz, yaw);
      const corr = {
        min: [Math.min(prev.x, cx) - 0.7, Math.min(prev.y, topY) + 0.25, Math.min(prev.z, cz) - 0.7],
        max: [Math.max(prev.x, cx) + 0.7, Math.max(prev.y, topY) + hmax + 2.0, Math.max(prev.z, cz) + 0.7],
      };
      let ok = true;
      for (let i = 0; i < placed.length - 1 && ok; i++) if (aabbHit(box, placed[i], 0.6) || aabbHit(corr, placed[i], 0.2)) ok = false;
      for (let i = 0; i < corridors.length - 1 && ok; i++) if (aabbHit(box, corridors[i], 0.3)) ok = false;
      cand.box = box; cand.corr = corr;
      best = cand;
      if (ok) break;
      if (t === 59) fails++;
    }
    heading = best.hd;
    placeObj(obj, best.cx, topY - obj.top.h, best.cz, best.yaw, acc);
    placed.push(best.box); corridors.push(best.corr);
    prev = { x: best.cx, y: topY, z: best.cz, yaw: best.yaw, w: obj.top.w, d: obj.top.d };
    WORLD.path.push({ ...prev, area, cls, th: obj.top.h });
    return prev;
  }

  for (let a = 0; a < AREAS.length; a++) {
    const A = AREAS[a];
    if (a > 0) {
      const ux0 = Math.cos(heading), uz0 = -Math.sin(heading);
      stepPlace(BUILD['rest' + a](), 'normal', AREAS[a - 1].g, accs[a], a, true);
      A.y0 = prev.y - 0.6;
      // area sign floating behind the rest platform
      const sx = prev.x + ux0 * 3.2, sz = prev.z + uz0 * 3.2;
      makeSign(['GEBIET ' + (a + 1), A.name], sx, prev.y + 3.0, sz, -ux0, -uz0, a === 5 ? '#9fd3ff' : '#ffb52e');
    } else A.y0 = -1e9;
    for (let i = 0; i < A.n; i++) {
      let cls;
      if (a === 0 && i < 3) cls = 'normal';
      else if (a === 0 && (i === 3 || i === 4)) cls = 'high';
      else if (a === 0 && i === 6) cls = 'perfect';
      else { const r = rng(); cls = r < A.cls[0] ? 'normal' : r < A.cls[0] + A.cls[1] ? 'high' : 'perfect'; }
      let name = pick(A.b);
      if (LONG_NARROW.has(name) && cls === 'perfect') name = A.b[0] === name ? A.b[2] : A.b[0];
      const obj = BUILD[name]();
      const hd0 = heading;
      stepPlace(obj, cls, A.g, accs[a], a, false);
      if (a === 0 && TUTORIAL[i]) {
        const ux = Math.cos(heading), uz = -Math.sin(heading);
        const px = -uz, pz = ux; // perpendicular
        const off = Math.max(prev.w, prev.d) / 2 + 2.6;
        makeSign(TUTORIAL[i], prev.x + px * off - ux * 0.5, prev.y + 2.8, prev.z + pz * off + uz * 1.5, -ux - px * 0.5, -uz - pz * 0.5);
      }
    }
    A.yEnd = prev.y;
  }

  // ---------------- summit: bathtub + rubber duck ----------------
  {
    const g = CFG.G_SPACE, v = CFG.HOP_HIGH, hmax = v * v / (2 * g);
    const dy = 0.6 * hmax;
    const ux = Math.cos(heading), uz = -Math.sin(heading);
    const R0 = 7;
    const dist = exitDist(prev, ux, uz) + 3.0 + R0 * 0.92;
    const cx = prev.x + ux * dist, cz = prev.z + uz * dist, topY = prev.y + dy;
    const o = new Obj();
    o.cyl(R0, 1.2, 0, -0.6, 0, '#e9e4d6', { seg: 8 });
    o.cyl(R0 + 0.15, 0.3, 0, -0.35, 0, '#d4af37', { seg: 8, col: false });
    o.add(geoCone(8), 0, -4, 0, R0, 5.6, R0, '#8d8a80', PI, 0, 0);
    // bathtub further along the heading
    const tub = new Obj(); const W = 6.6, D = 3.6, H = 1.6, th = 0.35, white = '#f6f6f2';
    tub.box(W, 0.3, D, 0, 0.15, 0, white);
    tub.box(W, H, th, 0, H / 2, D / 2 - th / 2, white); tub.box(W, H, th, 0, H / 2, -D / 2 + th / 2, white);
    tub.box(th, H, D, W / 2 - th / 2, H / 2, 0, white); tub.box(th, H, D, -W / 2 + th / 2, H / 2, 0, white);
    tub.box(W - 2 * th, 0.1, D - 2 * th, 0, H - 0.35, 0, '#7fcdf0', { col: false });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tub.sph(0.25, sx * (W / 2 - 0.4), -0.05, sz * (D / 2 - 0.4), '#d4af37', { seg: 6 });
    tub.cyl(0.12, 1.0, -W / 2 + 0.5, H + 0.4, 0, '#c0c0c0', { col: false, seg: 8 });
    tub.cyl(0.1, 0.6, -W / 2 + 0.75, H + 0.85, 0, '#c0c0c0', { rz: PI / 2, col: false, seg: 8 });
    const tubYaw = heading + PI / 2; // long side faces the player
    placeObj(o, cx, topY, cz, 0, accs[5]);
    const tx = cx + ux * 3.3, tz = cz + uz * 3.3;
    placeObj(tub, tx, topY, tz, tubYaw, accs[5]);
    WORLD.duck = { x: tx, y: topY + H - 0.35, z: tz, faceX: -ux, faceZ: -uz, platformY: topY, cx, cz };
    // duck collider (so you can't hop through her)
    const dc = new Obj(); dc.col(4.6, 3.5, 2.8, 0, 1.75, 0);
    placeObj(dc, tx, topY + H - 0.35, tz, tubYaw, accs[5]);
    WORLD.goalY = topY;
    makeSign(['ZIEL', 'Rede mit der Ente (F)'], cx - ux * 2 + (-uz) * 6.5, topY + 3, cz - uz * 2 + ux * 6.5, -ux + uz * 0.6, -uz - ux * 0.6, '#ffe066');
  }

  // ---------------- floating junk (decor, but solid – maybe a shortcut?) ----------------
  for (let a = 0; a < AREAS.length; a++) {
    const A = AREAS[a]; const y0 = a === 0 ? 3 : A.y0, y1 = A.yEnd + 4;
    let made = 0;
    for (let t = 0; t < 120 && made < 14; t++) {
      const obj = BUILD[pick(A.b)]();
      const ang = rng() * PI * 2, rr = R(6, 50);
      const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr, y = R(y0, y1), yaw = rng() * PI * 2;
      const box = objAABB(obj, x, y, z, yaw);
      let ok = true;
      for (const p of placed) if (aabbHit(box, p, 3.0)) { ok = false; break; }
      if (ok) for (const c of corridors) if (aabbHit(box, c, 2.0)) { ok = false; break; }
      if (!ok) continue;
      placeObj(obj, x, y, z, yaw, accs[a]); placed.push(box); made++;
    }
  }

  // ---------------- junkyard ground clutter ----------------
  for (let t = 0, made = 0; t < 300 && made < 45; t++) {
    const name = pick(['car', 'car', 'barrels', 'tires', 'washer', 'fridge', 'pallets', 'container', 'mattress', 'crt']);
    const obj = BUILD[name]();
    const ang = rng() * PI * 2, rr = R(10, 70);
    const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr, yaw = rng() * PI * 2;
    const box = objAABB(obj, x, 0, z, yaw);
    let ok = true;
    for (const p of placed) if (aabbHit(box, p, 1.5)) { ok = false; break; }
    if (ok) for (const c of corridors) if (aabbHit(box, c, 1.0)) { ok = false; break; }
    if (!ok) continue;
    placeObj(obj, x, 0, z, yaw, accs[0]); placed.push(box); made++;
  }

  // ---------------- background: fence, crane, city skyline, cloud sea ----------------
  for (let i = 0; i < 64; i++) {
    const a = i / 64 * PI * 2, r = 80;
    const o = new Obj();
    o.cyl(0.08, 2.6, 0, 1.3, 0, '#6a6a6a', { seg: 5, col: false });
    o.box(0.04, 2.2, 7.9, 0, 1.3, 3.95, '#8d9399', { col: false });
    placeObj(o, Math.cos(a) * r, 0, Math.sin(a) * r, -a, decoAcc, false);
  }
  { // tower crane
    const o = new Obj(); const H = 80, y = '#f1c40f';
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) o.box(0.3, H, 0.3, sx * 1.2, H / 2, sz * 1.2, y, { col: false });
    for (let h = 3; h < H; h += 3) { o.box(2.6, 0.15, 0.15, 0, h, 1.2, y, { col: false }); o.box(2.6, 0.15, 0.15, 0, h, -1.2, y, { col: false }); o.box(0.15, 0.15, 2.6, 1.2, h, 0, y, { col: false }); o.box(0.15, 0.15, 2.6, -1.2, h, 0, y, { col: false }); }
    o.box(60, 1.6, 1.6, 18, H + 1, 0, y, { col: false });
    o.box(3, 3, 3, 0, H - 1, 2.5, '#ddd', { col: false });
    o.box(6, 3, 3, -12, H, 0, '#777', { col: false });
    o.cyl(0.05, 18, 40, H - 9, 0, '#333', { col: false, seg: 4 });
    o.box(1.6, 1, 1.6, 40, H - 18.5, 0, '#c0392b', { col: false });
    placeObj(o, 60, 0, -70, 0.6, decoAcc, false);
  }
  const bcols = ['#7d8a99', '#8c8f94', '#a39b8f', '#6f7c8a', '#9aa5b1', '#b0a395', '#5e6b78'];
  for (let i = 0; i < 80; i++) {
    const a = rng() * PI * 2, r = R(150, 420);
    const w = R(14, 32), d = R(14, 32), h = R(25, 70) + (rng() < 0.3 ? R(20, 50) : 0);
    const o = new Obj(); const c = tint(pick(bcols), 0.08);
    o.box(w, h, d, 0, h / 2, 0, c, { col: false });
    const win = c.clone().multiplyScalar(0.55).lerp(new T.Color('#3b5b7a'), 0.4);
    for (let y = 4; y < h - 2; y += 4) o.box(w + 0.2, 1.4, d + 0.2, 0, y, 0, win, { col: false });
    o.box(w * 0.4, 3, d * 0.4, 0, h + 1.5, 0, c.clone().multiplyScalar(0.8), { col: false });
    placeObj(o, Math.cos(a) * r, 0, Math.sin(a) * r, rng() * PI, decoAcc, false);
  }
  const cloudY = AREAS[4].y0;
  for (let i = 0; i < 70; i++) {
    const a = rng() * PI * 2, r = R(70, 420);
    const o = new Obj(); const n = RI(4, 8), s = R(6, 16);
    for (let k = 0; k < n; k++) o.sph(s * R(0.6, 1.1), (rng() - 0.5) * s * 3, 0, (rng() - 0.5) * s * 2, rng() < 0.5 ? '#ffffff' : '#eef3fa', { sy: 0.45, seg: 8 });
    placeObj(o, Math.cos(a) * r, cloudY - 14 + R(-12, 22), Math.sin(a) * r, rng() * PI, decoAcc, false);
  }

  WORLD.fails = fails;
  return { accs, decoAcc };
}
