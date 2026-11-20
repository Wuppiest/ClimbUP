// ============================================================
//  ClimbUP – world generation (fixed seed -> always the same map)
// ============================================================
const AREAS = [
  { id: 'junk', name: 'Schrottplatz', n: 22, cls: [0.72, 0.28, 0], g: CFG.G,
    b: ['car', 'car', 'barrels', 'tires', 'washer', 'fridge', 'pallets', 'container', 'mattress', 'crt', 'cart', 'vending', 'arcade'],
    sky: ['#79aee6', '#f0dcb0'], fog: [40, 300] },
  { id: 'build', name: 'Baustelle', n: 24, cls: [0.42, 0.58, 0], g: CFG.G, rest: 'rest1',
    b: ['ibeam', 'ibeam', 'pipe', 'scaffold', 'drum', 'toilet', 'concrete', 'bricks', 'jersey', 'planks', 'pipestack'],
    sky: ['#6ea4dc', '#f4e2bd'], fog: [50, 320] },
  { id: 'harbor', name: 'Hafen', n: 22, cls: [0.36, 0.58, 0.06], g: CFG.G, rest: 'restHarbor',
    b: ['crate', 'crate', 'crateStack', 'buoy', 'bollard', 'rowboat', 'rowboat', 'containers2', 'container'],
    sky: ['#66a3dc', '#e3ecdf'], fog: [50, 340] },
  { id: 'city', name: 'Dächer der Stadt', n: 24, cls: [0.32, 0.56, 0.12], g: CFG.G, rest: 'rest2',
    b: ['ac', 'tank', 'bus', 'taxi', 'booth', 'dish', 'chimney', 'billboard', 'trafficlight', 'vent', 'solar', 'pigeon'],
    sky: ['#5a8fd8', '#ffd6a0'], fog: [60, 360] },
  { id: 'room', name: 'Riesenzimmer', n: 24, cls: [0.27, 0.55, 0.18], g: CFG.G, rest: 'rest3',
    b: ['toaster', 'block', 'books', 'mug', 'plates', 'brick', 'pencil', 'cube3', 'dice', 'choco', 'sponge', 'remote', 'cheese', 'cookie'],
    sky: ['#7a6fd0', '#ffbe9a'], fog: [60, 380] },
  { id: 'fair', name: 'Jahrmarkt', n: 22, cls: [0.26, 0.52, 0.22], g: CFG.G, rest: 'restFair',
    b: ['bumpercar', 'popcorn', 'giftbox', 'giftbox', 'teacup', 'ticket', 'podium'],
    sky: ['#5d4fb8', '#ffacc4'], fog: [60, 400] },
  { id: 'clouds', name: 'Über den Wolken', n: 22, cls: [0.25, 0.5, 0.25], g: CFG.G, rest: 'rest4',
    b: ['cloud', 'cloud', 'balloon', 'plane', 'island', 'blimp', 'gondola', 'paperplane'],
    sky: ['#2f6fd6', '#d3ebff'], fog: [80, 500] },
  { id: 'space', name: 'Weltraum', n: 24, cls: [0.25, 0.5, 0.25], g: CFG.G_SPACE, rest: 'rest5',
    b: ['satellite', 'asteroid', 'asteroid', 'rocket', 'module', 'ufo', 'rover', 'crystal', 'probe'],
    sky: ['#01020a', '#0d1236'], fog: [200, 1400] },
];
const AI = Object.fromEntries(AREAS.map((a, i) => [a.id, i])); // area index by id
const LAST = AREAS.length - 1;
const TUTORIAL = {
  2: ['LEERTASTE HALTEN', '= Sprung aufladen', 'Länger halten = höher'],
  5: ['VOLL AUFLADEN', 'für die ganz hohen Sprünge', 'Achte auf "MAX!"'],
  8: ['E = CHECKPOINT-FLAGGE', 'auf flachem Boden setzen.', 'R = Respawn an der Flagge'],
  12: ['LEERTASTE an einer Wand', 'halten = GRINDEN', 'Loslassen = abstoßen!'],
};

const WORLD = { start: new V3(0, 0.31, 0), startYaw: -PI / 2, path: [], shortcuts: [], dyn: [], signs: [], duck: null, goalY: 0, fails: 0 };

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
  rng = mulberry32(20261120); // map 2
  const accs = AREAS.map(() => new MeshAcc());
  const decoAcc = new MeshAcc();   // far background, no shadows
  const placed = [];               // {min,max}
  const corridors = [];
  const pendingMain = [];
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
      const sp = obj.span || obj.top; // overhangs below the top count when jumping onto it
      const eNext = exitDist({ yaw, w: sp.w, d: sp.d }, ux, uz);
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
    pendingMain.push({ obj, x: best.cx, y: topY - obj.top.h, z: best.cz, yaw: best.yaw, acc, k: WORLD.path.length }); // placed later (may become a moving object)
    placed.push(best.box); corridors.push(best.corr);
    prev = { x: best.cx, y: topY, z: best.cz, yaw: best.yaw, w: obj.top.w, d: obj.top.d };
    WORLD.path.push({ ...prev, area, cls, th: obj.top.h, name: obj.name || 'rest' });
    return prev;
  }

  for (let a = 0; a < AREAS.length; a++) {
    const A = AREAS[a];
    if (a > 0) {
      const ux0 = Math.cos(heading), uz0 = -Math.sin(heading);
      stepPlace(BUILD[A.rest](), 'normal', AREAS[a - 1].g, accs[a], a, true);
      A.y0 = prev.y - 0.6;
      // area sign floating behind the rest platform
      const sx = prev.x + ux0 * 3.2, sz = prev.z + uz0 * 3.2;
      makeSign(['GEBIET ' + (a + 1), A.name], sx, prev.y + 3.0, sz, -ux0, -uz0, a === AI.space ? '#9fd3ff' : '#ffb52e');
    } else A.y0 = -1e9;
    for (let i = 0; i < A.n; i++) {
      let cls;
      if (a === 0 && i < 3) cls = 'normal';
      else if (a === 0 && (i === 3 || i === 4)) cls = 'high';
      else if (a === 0 && i === 6) cls = 'perfect';
      else { const r = rng(); cls = r < A.cls[0] ? 'normal' : r < A.cls[0] + A.cls[1] ? 'high' : 'perfect'; }
      let name = pick(A.b);
      if (LONG_NARROW.has(name) && cls === 'perfect') name = A.b[0] === name ? A.b[2] : A.b[0];
      const obj = BUILD[name](); obj.name = name;
      if (obj.span && cls === 'perfect') cls = 'high'; // no max-height jumps onto things with overhangs
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
    placeObj(o, cx, topY, cz, 0, accs[LAST]);
    const tx = cx + ux * 3.3, tz = cz + uz * 3.3;
    placeObj(tub, tx, topY, tz, tubYaw, accs[LAST]);
    WORLD.duck = { x: tx, y: topY + H - 0.35, z: tz, faceX: -ux, faceZ: -uz, platformY: topY, cx, cz };
    // duck collider (so you can't hop through her)
    const dc = new Obj(); dc.col(4.6, 3.5, 2.8, 0, 1.75, 0);
    placeObj(dc, tx, topY + H - 0.35, tz, tubYaw, accs[LAST]);
    WORLD.goalY = topY;
    makeSign(['ZIEL', 'Rede mit der Ente (F)'], cx - ux * 2 + (-uz) * 6.5, topY + 3, cz - uz * 2 + ux * 6.5, -ux + uz * 0.6, -uz - ux * 0.6, '#ffe066');
  }

  // ---------------- shortcuts: harder side routes that skip part of the main path ----------------
  // placed[k] / WORLD.path[k] are the main path tops, corridors[k-1] is the jump into path[k]
  {
    const path = WORLD.path;
    const gold = '#ffcf33';
    const isOk = (box, skip) => {
      for (let k = 0; k < placed.length; k++) if (!skip.has(k) && aabbHit(box, placed[k], 0.9)) return false;
      for (let k = 0; k < corridors.length; k++) if (aabbHit(box, corridors[k], 0.4)) return false;
      return true;
    };
    const corrOk = (corr, skip) => {
      for (let k = 0; k < placed.length; k++) if (!skip.has(k) && aabbHit(corr, placed[k], 0.2)) return false;
      return true;
    };
    let lastFork = 8;
    for (let i = 10; i < path.length - 8; i++) {
      const A = path[i];
      if (i - lastFork < 6 || A.area === 0) continue;
      const area = AREAS[A.area], g = area.g;
      const hmaxP = CFG.HOP_PERFECT ** 2 / (2 * g);
      let done = false;
      for (let j = i + 6; j <= i + 16 && j < path.length && !done; j++) {
        const B = path[j];
        if (B.area !== A.area) break;
        const H = B.y - A.y, k = j - i;
        if (H < 4) continue;
        const mMin = Math.max(2, Math.ceil(H / (0.82 * hmaxP)));
        for (let m = mMin; m <= Math.min(k - 3, mMin + 1) && !done; m++) {
          const dyJ = H / m;
          if (dyJ > 0.84 * hmaxP || dyJ < 0.58 * hmaxP) continue; // every step is a big, nearly full-charge jump
          const reach = CFG.MOVE_SPEED * landTime(CFG.HOP_PERFECT, dyJ, g);
          const gapMax = 0.6 * reach - 0.45;
          const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz);
          if (L < 1) continue;
          const px = -dz / L, pz = dx / L;
          for (let tr = 0; tr < 16 && !done; tr++) {
            const bulge = (tr % 2 ? -1 : 1) * R(1, 12);
            // pick small objects for the in-between steps
            const nodes = [];
            let ok = true;
            for (let q = 1; q < m && ok; q++) {
              let obj = null;
              for (let pk = 0; pk < 20; pk++) {
                const nm = pick(area.b);
                if (LONG_NARROW.has(nm)) continue;
                const o = BUILD[nm](); o.name = nm;
                if (o.span || Math.max(o.top.w, o.top.d) > 2.6) continue; // small landing spots
                obj = o; break;
              }
              if (!obj) { ok = false; break; }
              const f = q / m, s = Math.sin(PI * f) * bulge;
              nodes.push({ obj, x: A.x + dx * f + px * s, z: A.z + dz * f + pz * s, y: A.y + H * f, yaw: rng() * PI * 2 });
            }
            if (!ok) continue;
            // check every jump of the chain: A -> n1 -> ... -> B
            const chain = [{ ...A, isMain: true }, ...nodes.map((n) => ({ x: n.x, y: n.y, z: n.z, yaw: n.yaw, w: n.obj.top.w, d: n.obj.top.d })), { ...B, isMain: true }];
            const skip = new Set([i, j]);
            const boxes = [], corrs = [];
            for (let q = 0; q < chain.length - 1 && ok; q++) {
              const a = chain[q], b = chain[q + 1];
              const ux = b.x - a.x, uz = b.z - a.z, l = Math.hypot(ux, uz);
              const gap = l - exitDist(a, ux / l, uz / l) - exitDist(b, -ux / l, -uz / l);
              if (gap < 0.9 || gap > gapMax) { ok = false; break; }
              const corr = { min: [Math.min(a.x, b.x) - 0.7, Math.min(a.y, b.y) + 0.25, Math.min(a.z, b.z) - 0.7], max: [Math.max(a.x, b.x) + 0.7, Math.max(a.y, b.y) + hmaxP + 2.0, Math.max(a.z, b.z) + 0.7] };
              if (!corrOk(corr, skip)) { ok = false; break; }
              corrs.push(corr);
            }
            for (const n of nodes) {
              if (!ok) break;
              if (Math.hypot(n.x, n.z) > 46) { ok = false; break; }
              const box = objAABB(n.obj, n.x, n.y - n.obj.top.h, n.z, n.yaw);
              if (!isOk(box, skip)) { ok = false; break; }
              for (const bb of boxes) if (aabbHit(box, bb, 1.0)) { ok = false; break; }
              boxes.push(box);
            }
            if (!ok) continue;
            // commit
            for (const n of nodes) {
              placeObj(n.obj, n.x, n.y - n.obj.top.h, n.z, n.yaw, accs[A.area]);
              const mk = new Obj(); // golden marker floating above the platform
              mk.add(geoIco(0), 0, 2.4, 0, 0.32, 0.5, 0.32, gold);
              placeObj(mk, n.x, n.y, n.z, 0, accs[A.area], false);
            }
            for (const b of boxes) placed.push(b);
            for (const c of corrs) corridors.push(c);
            const n0 = nodes[0], ux = n0.x - A.x, uz = n0.z - A.z, l = Math.hypot(ux, uz);
            const side = Math.max(A.w, A.d) / 2 + 2.2;
            makeSign(['ABKÜRZUNG', 'schwer, aber schneller!'], A.x - uz / l * side, A.y + 3.4, A.z + ux / l * side, -ux / l + uz / l * 0.6, -uz / l - ux / l * 0.6, gold).scale.setScalar(0.8);
            WORLD.shortcuts.push({ from: i, to: j, saves: k - m, nodes: nodes.map((n) => ({ x: n.x, y: n.y, z: n.z, yaw: n.yaw, w: n.obj.top.w, d: n.obj.top.d, name: n.obj.name })) });
            lastFork = j; done = true;
          }
        }
      }
    }
  }

  // ---------------- moving / special objects on the main path ----------------
  {
    const path = WORLD.path;
    const RULES = {
      ibeam: { type: 'swing', A: 0.26, T: 4.2, L: 9 },
      buoy: { type: 'bob', A: 0.45, T: 3.4 }, rowboat: { type: 'bob', A: 0.35, T: 4.2 },
      bus: { type: 'slide', A: 2.6, T: 7 }, taxi: { type: 'slide', A: 2.2, T: 5.5 },
      toaster: { type: 'pad' }, plates: { type: 'spin', w: 0.7 },
      teacup: { type: 'spin', w: 0.9 }, podium: { type: 'spin', w: -0.6 }, bumpercar: { type: 'slide', A: 2.0, T: 4.5 },
      cloud: { type: 'vanish', chance: 0.6 }, blimp: { type: 'slide', A: 3.0, T: 10 }, balloon: { type: 'bob', A: 0.8, T: 5 },
      asteroid: { type: 'orbit', r: 1.4, T: 9, w: 0.15 }, satellite: { type: 'spin', w: 0.25 },
    };
    const fixed = new Set([0, 1, 2, 3, 4, 5, path.length - 1]);
    for (const sc of WORLD.shortcuts) { fixed.add(sc.from); fixed.add(sc.to); }
    let moving = 0;
    for (const pm of pendingMain) {
      const k = pm.k, node = path[k], rule = RULES[node.name];
      let made = false;
      if (rule && !fixed.has(k) && (rule.chance == null || rng() < rule.chance)) {
        const prevN = path[k - 1], nextN = path[k + 1];
        const bobOk = rule.type !== 'bob' || ((!nextN || nextN.cls !== 'perfect') && node.cls !== 'perfect');
        if (bobOk) {
          const ix = node.x - prevN.x, iz = node.z - prevN.z, il = Math.hypot(ix, iz) || 1;
          const motion = { ...rule, ph: rng() * PI * 2, ax: -iz / il, az: ix / il };
          if (rule.type === 'swing') motion.ph = 0;
          const obj = pm.obj;
          if (rule.type === 'swing') { // crane cable + hook
            const L = obj.top.w;
            for (const sx of [-L * 0.38, L * 0.38]) obj.add(geoCyl(4), sx / 2, obj.top.h + rule.L / 2, 0, 0.04, Math.hypot(rule.L, sx), 0.04, '#333333', 0, 0, Math.atan2(sx, rule.L));
            obj.box(0.5, 0.7, 0.35, 0, obj.top.h + rule.L, 0, '#f1c40f', { col: false });
          }
          const spec = { obj, base: { x: pm.x, y: pm.y, z: pm.z, yaw: pm.yaw }, motion, k };
          const sw = dynSweptAABB(spec);
          let ok = true;
          for (let q = 0; q < placed.length && ok; q++) if (q !== k - 1 && q !== k && q !== k + 1 && aabbHit(sw, placed[q], 0.6)) ok = false;
          for (let q = 0; q < corridors.length && ok; q++) if (q !== k - 1 && q !== k && aabbHit(sw, corridors[q], 0.3)) ok = false;
          if (ok) { WORLD.dyn.push(spec); placed[k] = sw; made = true; moving++; }
        }
      }
      if (!made) placeObj(pm.obj, pm.x, pm.y, pm.z, pm.yaw, pm.acc);
    }
    WORLD.moving = moving;
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
  { // giant floating ferris wheel at fair height
    const o = new Obj(); const Rw = 34, cols = ['#e74c3c', '#f1c40f', '#3498db', '#2ecc71', '#9b59b6', '#e67e22'];
    o.torus(Rw, 0.02, 0, 0, 0, '#ecf0f1', { seg: 40 });
    o.torus(Rw - 3, 0.02, 0, 0, 0, '#bdc3c7', { seg: 40 });
    o.cyl(2.2, 3, 0, 0, 0, '#7f8c8d', { rx: PI / 2, col: false, seg: 10 });
    for (let i = 0; i < 16; i++) {
      const a = i / 16 * PI * 2;
      o.box(Rw, 0.5, 0.5, Math.cos(a) * Rw / 2, Math.sin(a) * Rw / 2, 0, '#dfe6e9', { rz: a, col: false });
      const gx = Math.cos(a) * Rw, gy = Math.sin(a) * Rw;
      o.box(3.2, 2.6, 2.6, gx, gy - 2.4, 0, cols[i % cols.length], { col: false });
      o.box(3.4, 0.3, 2.8, gx, gy - 1.0, 0, '#ffffff', { col: false });
      o.sph(0.5, gx, gy, 0, '#ffe066', { seg: 6 });
    }
    for (const s of [-1, 1]) o.box(2, Rw * 2.2, 2, s * Rw * 0.45, -Rw * 0.95, 4, '#95a5a6', { rz: s * 0.42, col: false });
    const fy = AREAS[AI.fair].y0 + 12;
    placeObj(o, -95, fy, 80, 0.7, decoAcc, false);
  }
  { // lighthouse on a floating rock at harbor height
    const o = new Obj(); const H = 26;
    o.add(geoCone(9), 0, -10, 0, 14, 20, 14, '#6b6158', PI, 0, 0);
    o.cyl(14, 1.5, 0, -0.75, 0, '#7d7366', { seg: 9, col: false });
    for (let i = 0; i < 6; i++) o.cyl(3.6 - i * 0.25, H / 6, 0, H / 12 + i * H / 6, 0, i % 2 ? '#ffffff' : '#d63031', { rt: (3.6 - (i + 1) * 0.25) / (3.6 - i * 0.25), seg: 12, col: false });
    o.cyl(2.6, 3, 0, H + 1.5, 0, '#fff6b0', { seg: 10, col: false });
    o.cone(3.2, 3, 0, H + 4.5, 0, '#2c3e50', { seg: 10 });
    o.box(5, 3, 4, 7, 1.5, 3, '#ecf0f1', { col: false }); o.box(5.4, 0.6, 4.4, 7, 3.3, 3, '#c0392b', { col: false });
    placeObj(o, 110, AREAS[AI.harbor].y0 - 8, -60, 0, decoAcc, false);
  }
  const cloudY = AREAS[AI.clouds].y0;
  for (let i = 0; i < 70; i++) {
    const a = rng() * PI * 2, r = R(70, 420);
    const o = new Obj(); const n = RI(4, 8), s = R(6, 16);
    for (let k = 0; k < n; k++) o.sph(s * R(0.6, 1.1), (rng() - 0.5) * s * 3, 0, (rng() - 0.5) * s * 2, rng() < 0.5 ? '#ffffff' : '#eef3fa', { sy: 0.45, seg: 8 });
    placeObj(o, Math.cos(a) * r, cloudY - 14 + R(-12, 22), Math.sin(a) * r, rng() * PI, decoAcc, false);
  }

  WORLD.fails = fails;
  return { accs, decoAcc };
}
