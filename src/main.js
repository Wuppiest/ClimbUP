// ============================================================
//  ClimbUP – player, pogo physics, flag, duck, HUD, main loop
// ============================================================
const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { const v = localStorage.getItem('climbup.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('climbup.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};
const settings = Object.assign({ sens: 1, fov: 80, ring: true }, store.get('settings', {}));

// ---------------- renderer / scene ----------------
const canvas = $('c');
const renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.autoClear = false;

const scene = new T.Scene();
scene.fog = new T.Fog('#f0dcb0', 40, 300);
const camera = new T.PerspectiveCamera(settings.fov, window.innerWidth / window.innerHeight, 0.05, 3000);
camera.rotation.order = 'YXZ';

const hemi = new T.HemisphereLight('#dfefff', '#6b5a48', 1.35);
scene.add(hemi);
const sun = new T.DirectionalLight('#fff4e0', 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const SB = 34;
Object.assign(sun.shadow.camera, { left: -SB, right: SB, top: SB, bottom: -SB, near: 1, far: 220 });
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);
const SUN_DIR = new V3(0.45, 1, 0.3).normalize();

// sky dome with vertical gradient
const skyMat = new T.ShaderMaterial({
  uniforms: { top: { value: new T.Color() }, bottom: { value: new T.Color() } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.3 + 0.12, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, pow(h, 0.75)), 1.0); \n#include <colorspace_fragment>\n }',
  side: T.BackSide, depthWrite: false, fog: false,
});
const sky = new T.Mesh(new T.SphereGeometry(2000, 24, 16), skyMat);
sky.renderOrder = -10;
scene.add(sky);

// stars + planet (fade in high up)
const starGeo = new T.BufferGeometry(); const sp = [];
for (let i = 0; i < 2500; i++) { const v = new V3(Math.random() - 0.5, Math.random() - 0.3, Math.random() - 0.5).normalize().multiplyScalar(1800); sp.push(v.x, v.y, v.z); }
starGeo.setAttribute('position', new T.Float32BufferAttribute(sp, 3));
const starMat = new T.PointsMaterial({ color: '#ffffff', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false });
const stars = new T.Points(starGeo, starMat);
scene.add(stars);

// ---------------- world ----------------
const worldMat = new T.MeshLambertMaterial({ vertexColors: true });
const t0 = performance.now();
const built = buildWorld();
for (const acc of built.accs) { const m = acc.build(worldMat); m.castShadow = true; m.receiveShadow = true; scene.add(m); }
{ const m = built.decoAcc.build(worldMat); m.receiveShadow = true; scene.add(m); }
for (const s of WORLD.signs) scene.add(s);
console.log('[ClimbUP] world built in', Math.round(performance.now() - t0), 'ms, colliders:', COLLIDERS.length, 'path steps:', WORLD.path.length, 'placement fallbacks:', WORLD.fails);

{ // ground
  const g = new T.Mesh(new T.PlaneGeometry(2400, 2400), new T.MeshLambertMaterial({ color: '#8a7656' }));
  g.rotation.x = -PI / 2; g.receiveShadow = true; scene.add(g);
  const acc = new MeshAcc(); rng = mulberry32(7);
  for (let i = 0; i < 140; i++) { const o = new Obj(); const s = R(2, 9); o.add(geoCyl(7), 0, 0.01, 0, s, 0.02, s, tint(pick(['#7a6648', '#968260', '#6e5c40', '#7f7a5a']), 0.05)); placeObj(o, R(-120, 120), 0, R(-120, 120), 0, acc, false); }
  const m = acc.build(worldMat); m.receiveShadow = true; scene.add(m);
}
let planet = null;
{ // planet
  const pl = new T.Group();
  pl.add(new T.Mesh(new T.IcosahedronGeometry(160, 3), new T.MeshLambertMaterial({ color: '#d98a5b', flatShading: true })));
  const ring = new T.Mesh(new T.RingGeometry(210, 290, 48), new T.MeshBasicMaterial({ color: '#e8d3a8', side: T.DoubleSide, transparent: true, opacity: 0.55 }));
  ring.rotation.x = -PI / 2 + 0.35; pl.add(ring);
  pl.position.set(-700, AREAS[5].y0 + 260, -900);
  pl.traverse((o) => { if (o.material) { o.material.fog = false; o.material.transparent = true; o.material.opacity = 0; } });
  scene.add(pl); planet = pl;
}

// ---------------- flag ----------------
const flagGroup = new T.Group();
{
  const pole = new T.Mesh(new T.CylinderGeometry(0.05, 0.06, 2.4, 8), new T.MeshLambertMaterial({ color: '#d9d9d9' }));
  pole.position.y = 1.2; pole.castShadow = true; flagGroup.add(pole);
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 96; const c = cv.getContext('2d');
  c.fillStyle = '#e8322b'; c.fillRect(0, 0, 128, 96); c.fillStyle = '#fff'; c.font = '900 52px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CP', 64, 50);
  const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
  const clothGeo = new T.PlaneGeometry(1.1, 0.75, 8, 4); clothGeo.translate(0.55, 0, 0);
  const cloth = new T.Mesh(clothGeo, new T.MeshLambertMaterial({ map: tex, side: T.DoubleSide }));
  cloth.position.set(0.05, 2.0, 0); cloth.castShadow = true; flagGroup.add(cloth); flagGroup.userData.cloth = cloth;
  const base = new T.Mesh(new T.CylinderGeometry(0.35, 0.4, 0.12, 12), new T.MeshLambertMaterial({ color: '#555' }));
  base.position.y = 0.06; flagGroup.add(base);
  const beam = new T.Mesh(new T.CylinderGeometry(0.25, 0.25, 60, 10, 1, true), new T.MeshBasicMaterial({ color: '#ff4a3d', transparent: true, opacity: 0.18, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, fog: false }));
  beam.position.y = 31; flagGroup.add(beam);
  flagGroup.visible = false; scene.add(flagGroup);
}
const clothBase = flagGroup.userData.cloth.geometry.attributes.position.array.slice();

// ---------------- duck ----------------
const duckGroup = new T.Group();
{
  const acc = new MeshAcc(); const o = new Obj(); const Y = '#ffd21f';
  o.sph(1.9, 0, 1.3, 0, Y, { sx: 1.25, sy: 0.85, seg: 14 });          // body
  o.sph(0.7, -2.0, 1.9, 0, Y, { sx: 1.0, sy: 0.7, seg: 10, rz: 0.6 }); // tail
  o.sph(1.25, 1.35, 3.1, 0, Y, { seg: 14 });                          // head
  o.sph(0.55, 2.55, 2.85, 0, '#ff8a1f', { sx: 1.1, sy: 0.38, sz: 1.0, seg: 10 }); // beak
  for (const s of [-1, 1]) {
    o.sph(0.26, 2.15, 3.45, s * 0.65, '#ffffff', { seg: 8 });
    o.sph(0.15, 2.36, 3.48, s * 0.68, '#111111', { seg: 8 });
    o.sph(0.9, -0.1, 1.55, s * 1.55, '#f5c400', { sx: 1.3, sy: 0.55, sz: 0.4, seg: 10 }); // wings
  }
  for (const p of o.parts) acc.add(p.geo, p.m, p.color);
  const m = acc.build(worldMat); m.castShadow = true; duckGroup.add(m);
  scene.add(duckGroup);
}
duckGroup.position.set(WORLD.duck.x, WORLD.duck.y - 0.6, WORLD.duck.z);
duckGroup.rotation.y = Math.atan2(-WORLD.duck.faceZ, WORLD.duck.faceX);

// ---------------- landing indicator ----------------
const ring = new T.Mesh(new T.RingGeometry(0.16, 0.26, 24), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, depthWrite: false }));
ring.rotation.x = -PI / 2; ring.renderOrder = 2; scene.add(ring);

// ---------------- first-person view model (pogo stick + hands) ----------------
const vmScene = new T.Scene();
vmScene.add(new T.HemisphereLight('#ffffff', '#776655', 1.6));
const vmSun = new T.DirectionalLight('#ffffff', 1.6); vmSun.position.set(0.5, 1, 0.6); vmScene.add(vmSun);
const vmCam = new T.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.01, 10);
const vm = new T.Group(); vmScene.add(vm);
const vmFlag = new T.Group();
{
  const acc = new MeshAcc(); const o = new Obj();
  const red = '#d6312b', dark = '#1d1d1d', skin = '#e8b48f', sleeve = '#2f5fa8';
  o.cyl(0.022, 0.62, 0, 0, 0, '#c9c9c9', { rz: PI / 2, seg: 10 });                 // handlebar
  for (const s of [-1, 1]) o.cyl(0.032, 0.17, s * 0.26, 0, 0, dark, { rz: PI / 2, seg: 10 }); // grips
  o.cyl(0.03, 1.6, 0, -0.8, 0, red, { seg: 10 });                                     // shaft
  o.cyl(0.05, 0.12, 0, -0.06, 0, '#999', { seg: 10 });
  for (let i = 0; i < 6; i++) o.torus(0.06, 0.25, 0, -0.55 - i * 0.06, 0, '#bbbbbb', { rx: PI / 2, seg: 10 }); // spring
  for (const s of [-1, 1]) {
    o.sph(0.055, s * 0.26, 0.01, 0.0, skin, { sx: 1.5, sy: 1, sz: 1.1, seg: 8 }); // fist
    o.cyl(0.05, 0.6, s * 0.32, -0.12, 0.28, sleeve, { rx: -1.1, rz: s * 0.25, seg: 8 }); // arm
  }
  for (const p of o.parts) acc.add(p.geo, p.m, p.color);
  vm.add(acc.build(new T.MeshLambertMaterial({ vertexColors: true })));
  const fp = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, 0.36, 6), new T.MeshLambertMaterial({ color: '#ddd' }));
  fp.position.y = 0.18; vmFlag.add(fp);
  const fc = new T.Mesh(new T.PlaneGeometry(0.16, 0.11), new T.MeshLambertMaterial({ color: '#e8322b', side: T.DoubleSide }));
  fc.position.set(0.08, 0.3, 0); vmFlag.add(fc);
  vmFlag.position.set(0.36, 0.0, 0.02); vmFlag.rotation.z = -0.3; vmFlag.scale.setScalar(0.7); vm.add(vmFlag);
}
const VM_BASE = new V3(0, -0.4, -0.7);
vm.position.copy(VM_BASE); vm.rotation.x = 0.12; vm.scale.setScalar(0.85);

// ---------------- player state ----------------
const P = {
  pos: WORLD.start.clone(), vel: new V3(), yaw: WORLD.startYaw, pitch: -0.05, roll: 0,
  state: 'air', ct: 0, landTime: -9, lastSpace: -99, preH: new V3(),
  landPoint: new V3(), landN: new V3(0, 1, 0),
  grind: false, grindT: 0, wallN: new V3(), lostT: 0, grindCd: 0, kicked: false, lastKickN: new V3(),
  peakY: 0, dip: 0, dipV: 0, fovKick: 0,
};
const flag = { carried: true, pos: new V3(), pending: false };
const stats = { falls: 0, respawns: 0 };
let clock = 0;            // game time (only advances while playing)
let state = 'menu';       // menu | play | win
let paused = false;
let runTime = 0, timerRunning = false;
let maxArea = 0;
let best = store.get('best', null);
const keys = {};
const contacts = { ground: null, groundPoint: new V3(), wall: null };
const _g = new V3(), _w = new V3();

function gravAt(y) { return y > AREAS[5].y0 - 4 ? CFG.G_SPACE : CFG.G; }
function inputDir() {
  const f = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0), r = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  if (!f && !r) return null;
  const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
  const x = -sy * f + cy * r, z = -cy * f - sy * r;
  const l = Math.hypot(x, z);
  return { x: x / l, z: z / l };
}

// ---------------- physics ----------------
const cand = [];
function resolveCollisions() {
  contacts.ground = null; contacts.wall = null;
  const r = CFG.RADIUS;
  queryColliders(P.pos.x - 1, P.pos.z - 1, P.pos.x + 1, P.pos.z + 1, P.pos.y - 0.5, P.pos.y + 2.3, cand);
  for (let iter = 0; iter < 3; iter++) {
    let any = false;
    for (let s = 0; s < 3; s++) {
      for (const c of cand) {
        if (!sphereVsOBB(P.pos.x, P.pos.y + SPHERES[s], P.pos.z, r, c)) continue;
        any = true;
        const nx = _cp.nx, ny = _cp.ny, nz = _cp.nz;
        P.pos.x += nx * _cp.pen; P.pos.y += ny * _cp.pen; P.pos.z += nz * _cp.pen;
        const vn = P.vel.x * nx + P.vel.y * ny + P.vel.z * nz;
        if (vn < 0) { P.vel.x -= nx * vn; P.vel.y -= ny * vn; P.vel.z -= nz * vn; }
        if (s === 0 && ny > 0.7) { contacts.ground = _g.set(nx, ny, nz); contacts.groundPoint.set(_cp.x, _cp.y, _cp.z); }
        else if (Math.abs(ny) < 0.4) { const l = Math.hypot(nx, nz); contacts.wall = _w.set(nx / l, 0, nz / l); }
      }
    }
    if (!any) break;
  }
}

function step(dt) {
  clock += dt;
  if (P.grindCd > 0) P.grindCd -= dt;
  if (P.state === 'compress') {
    P.ct += dt;
    if (P.ct >= CFG.COMPRESS) launch();
    return;
  }
  const g = gravAt(P.pos.y);
  const dir = inputDir();
  if (P.grind) grindUpdate(dt, g);
  else {
    P.vel.y -= g * dt;
    if (dir) {
      const hx = P.vel.x, hz = P.vel.z, cur = Math.hypot(hx, hz);
      let nx = hx + dir.x * CFG.AIR_ACCEL * dt, nz = hz + dir.z * CFG.AIR_ACCEL * dt;
      const lim = Math.max(CFG.MOVE_SPEED, cur), nl = Math.hypot(nx, nz);
      if (nl > lim) { nx *= lim / nl; nz *= lim / nl; }
      P.vel.x = nx; P.vel.z = nz;
    } else { P.vel.x *= 1 - 0.4 * dt; P.vel.z *= 1 - 0.4 * dt; }
  }
  if (P.vel.y < -48) P.vel.y = -48;
  const preVy = P.vel.y;
  P.pos.addScaledVector(P.vel, dt);
  resolveCollisions();
  if (P.pos.y > P.peakY) P.peakY = P.pos.y;

  // grinding
  if (!P.grind && (keys.ShiftLeft || keys.ShiftRight) && contacts.wall && !contacts.ground && P.grindCd <= 0) {
    if (!(P.kicked && contacts.wall.dot(P.lastKickN) > 0.7)) startGrind(contacts.wall);
  }
  if (P.grind) {
    if (contacts.wall && contacts.wall.dot(P.wallN) > 0.6) { P.lostT = 0; P.wallN.lerp(contacts.wall, 0.3).normalize(); }
    else if ((P.lostT += dt) > 0.12) endGrind();
  }
  if (contacts.ground && preVy <= 0.5) land(preVy);
  if (P.pos.y < -60) respawn(true);
}

function startGrind(n) {
  P.grind = true; P.grindT = 0; P.lostT = 0; P.wallN.copy(n);
}
function endGrind() { P.grind = false; P.grindCd = 0.15; }
function grindUpdate(dt, g) {
  P.grindT += dt;
  if (!(keys.ShiftLeft || keys.ShiftRight)) { kick(); return; }
  const n = P.wallN;
  const vn = P.vel.x * n.x + P.vel.z * n.z;
  P.vel.x -= n.x * vn; P.vel.z -= n.z * vn;
  P.vel.x *= 1 - 1.0 * dt; P.vel.z *= 1 - 1.0 * dt;
  const target = P.grindT < CFG.GRIND_SLOW ? -1.3 : -11;
  if (P.vel.y > target) P.vel.y = Math.max(target, P.vel.y - g * 0.7 * dt);
  else P.vel.y += (target - P.vel.y) * Math.min(1, (P.grindT < CFG.GRIND_SLOW ? 6 : 2) * dt);
  P.vel.x -= n.x * 2; P.vel.z -= n.z * 2; // stick to the wall
}
function kick() {
  const n = P.wallN;
  const vn = P.vel.x * n.x + P.vel.z * n.z;
  const tx = (P.vel.x - n.x * vn) * 0.6, tz = (P.vel.z - n.z * vn) * 0.6;
  P.vel.set(tx + n.x * CFG.KICK_OUT, CFG.KICK_UP, tz + n.z * CFG.KICK_OUT);
  P.grind = false; P.grindCd = 0.25; P.kicked = true; P.lastKickN.copy(n);
  feedback('ABSTOSS!', '#ffd84a');
}

function land(preVy) {
  if (P.grind) endGrind();
  P.kicked = false;
  P.state = 'compress'; P.ct = 0; P.landTime = clock;
  P.landPoint.copy(contacts.groundPoint); P.landN.copy(contacts.ground);
  P.preH.set(P.vel.x, 0, P.vel.z);
  P.vel.set(0, 0, 0);
  const impact = -preVy;
  P.dipV -= Math.min(4.5, 0.6 + impact * 0.13);
  if (P.peakY - P.pos.y > 9) { stats.falls++; if (P.peakY - P.pos.y > 25) toast('Autsch. ' + Math.round(P.peakY - P.pos.y) + ' m runtergefallen.'); }
  P.peakY = P.pos.y;
  if (flag.pending) { flag.pending = false; tryPlaceFlag(); }
}
function launch() {
  const dir = inputDir();
  let type = 'move';
  const sp = P.lastSpace;
  if (sp >= P.landTime - CFG.PRE_WIN && sp <= clock + 1e-6) {
    type = Math.abs(sp - P.landTime) <= CFG.PERFECT_WIN ? 'perfect' : 'high';
    P.lastSpace = -99;
  }
  const vy = type === 'perfect' ? CFG.HOP_PERFECT : type === 'high' ? CFG.HOP_HIGH : dir ? CFG.HOP_MOVE : CFG.HOP_IDLE;
  if (dir) P.vel.set(dir.x * CFG.MOVE_SPEED, vy, dir.z * CFG.MOVE_SPEED);
  else P.vel.set(P.preH.x * 0.25, vy, P.preH.z * 0.25);
  P.state = 'air'; P.peakY = P.pos.y; P.pos.y += 0.005;
  if (type === 'perfect') { feedback('PERFEKT!', '#ffd84a'); P.fovKick = 9; }
  else if (type === 'high') { feedback('HOCH!', '#ffffff'); P.fovKick = 5; }
}

function respawn(auto) {
  if (!flag.carried) P.pos.copy(flag.pos).add(new V3(0, 0.05, 0));
  else P.pos.copy(WORLD.start);
  P.vel.set(0, 0, 0); P.state = 'air'; P.grind = false; P.kicked = false; P.peakY = P.pos.y;
  stats.respawns++;
  toast(auto ? 'Aus der Welt gefallen – Respawn.' : (flag.carried ? 'Zurück zum Start.' : 'Respawn an der Flagge.'));
  closeDialog();
}

// ---------------- flag ----------------
function tryPlaceFlag() {
  if (P.landN.y < 0.95) { toast('Boden zu schräg – Flagge nicht gesetzt.'); return; }
  flag.pos.copy(P.landPoint); flag.carried = false; flag.pending = false;
  flagGroup.position.copy(flag.pos); flagGroup.visible = true;
  toast('🚩 Flagge gesetzt!');
}
function pressE() {
  if (flag.carried) {
    if (P.state === 'compress') { tryPlaceFlag(); return; }
    flag.pending = !flag.pending;
    toast(flag.pending ? 'Flagge wird bei der nächsten Landung gesetzt…' : 'Flagge setzen abgebrochen.');
  } else {
    const d = Math.hypot(P.pos.x - flag.pos.x, P.pos.z - flag.pos.z);
    if (d < 2.6 && Math.abs(P.pos.y - flag.pos.y) < 3) {
      flag.carried = true; flagGroup.visible = false; toast('🚩 Flagge aufgehoben.');
    } else toast('Zu weit weg von der Flagge (' + Math.round(P.pos.distanceTo(flag.pos)) + ' m).');
  }
}

// ---------------- duck dialogue ----------------
const DLG = {
  start: () => ({ text: 'Quak. Oh. Schon wieder so ein Hüpfer. Was willst du?', opts: [
    { t: 'Ich will gewinnen!', go: 'flag' },
    { t: 'Bist du eine Gummiente?', fail: 'Ich bin DIE Gummiente. Ein bisschen mehr Respekt, bitte.' },
    { t: 'Nichts, ich hüpf nur so rum.', fail: 'Dann hüpf doch weiter. Nach unten.' },
  ] }),
  flag: () => ({ text: 'Gewinnen. Jaja. Sag mal… wo ist eigentlich deine Flagge?', opts: [
    { t: 'Hab ich dabei.', ok: () => flag.carried, go: 'falls', fail: 'Lügner. Die steht doch irgendwo da unten. Ich hab gute Augen.' },
    { t: 'Die steht weiter unten.', ok: () => !flag.carried, go: 'falls', fail: 'Die steckt doch an deinem Stock! Ich HASSE Lügner.' },
    { t: 'Welche Flagge?', fail: 'Falsche Antwort. Ich zeig dir mal, wo die Flagge hingehört.' },
  ] }),
  falls: () => ({ text: 'Und wie oft bist du auf dem Weg hier hoch runtergefallen? Sei ehrlich. Ich hab zugeguckt.', opts: [
    { t: 'Kein einziges Mal.', ok: () => stats.falls === 0, go: 'life', fail: 'Ich hab ' + stats.falls + ' Mal gezählt. Mindestens.' },
    { t: 'Ein paar Mal…', ok: () => stats.falls > 0, go: 'life', fail: 'Du bist NIE gefallen. Warum machst du dich schlechter, als du bist?' },
    { t: 'Geht dich nichts an.', fail: 'Doch. Das hier ist MEINE Wanne.' },
  ] }),
  life: () => ({ text: 'Letzte Frage. Was ist das Wichtigste im Leben?', opts: [
    { t: 'Bestzeiten.', fail: 'Typisch Speedrunner. Tschüss.' },
    { t: 'Quietschen.', go: 'wait' },
    { t: 'Brot.', fail: 'Brot ist was für Enten aus Fleisch und Blut. Ich bin aus Vinyl!' },
  ] }),
};
const dlg = { open: false, node: null, opts: [], phase: 'idle', t: 0 };
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function openDialog(nodeName) {
  const node = DLG[nodeName]();
  dlg.open = true; dlg.phase = 'choose'; dlg.node = nodeName; dlg.opts = shuffle(node.opts.slice());
  $('dialog').classList.remove('hidden');
  $('dlgText').textContent = node.text;
  $('dlgOpts').innerHTML = dlg.opts.map((o, i) => '<div class="opt"><kbd>' + (i + 1) + '</kbd>' + o.t + '</div>').join('');
}
function closeDialog() { dlg.open = false; dlg.phase = 'idle'; $('dialog').classList.add('hidden'); }
function chooseOption(i) {
  if (!dlg.open || dlg.phase !== 'choose') return;
  const o = dlg.opts[i]; if (!o) return;
  const passed = o.go && (!o.ok || o.ok());
  if (!passed) {
    dlg.phase = 'fail'; dlg.t = 1.8;
    $('dlgText').textContent = o.fail || 'Nö.';
    $('dlgOpts').innerHTML = '';
    return;
  }
  if (o.go === 'wait') {
    dlg.phase = 'wait'; dlg.t = 5;
    $('dlgText').textContent = '…Korrekt. Na gut. Du darfst gewinnen. Du musst nur 5 Sekunden lang GAR NICHTS drücken.';
    $('dlgOpts').innerHTML = '<div class="count" id="dlgCount">5</div>';
    return;
  }
  openDialog(o.go);
}
function duckPush() {
  closeDialog();
  const dx = P.pos.x - WORLD.duck.x, dz = P.pos.z - WORLD.duck.z, l = Math.hypot(dx, dz) || 1;
  P.state = 'air'; P.grind = false;
  P.vel.set(dx / l * 15, 7, dz / l * 15); P.pos.y += 0.05;
  feedback('QUAAAK!', '#ffd21f');
}
function dialogTick(dt) {
  if (!dlg.open) return;
  const dd = Math.hypot(P.pos.x - WORLD.duck.x, P.pos.z - WORLD.duck.z);
  if (dd > 11 || P.pos.y < WORLD.goalY - 3) { closeDialog(); return; }
  if (dlg.phase === 'fail') { dlg.t -= dt; if (dlg.t <= 0) duckPush(); }
  if (dlg.phase === 'wait') {
    dlg.t -= dt;
    const el = $('dlgCount'); if (el) el.textContent = Math.max(1, Math.ceil(dlg.t));
    if (dlg.t <= 0) win();
  }
}
function dialogInterrupt() { // any key press during the 5 second wait
  if (dlg.open && dlg.phase === 'wait') {
    dlg.phase = 'fail'; dlg.t = 1.4;
    $('dlgText').textContent = pick(['Ungeduldig. Schade.', 'Ich sagte: NICHTS. Tschüss.', 'Da hat wohl jemand gedrückt. Quak.']);
    $('dlgOpts').innerHTML = '';
  }
}
function nearDuck() {
  return Math.hypot(P.pos.x - WORLD.duck.x, P.pos.z - WORLD.duck.z) < 7.5 && Math.abs(P.pos.y - WORLD.goalY) < 2.5;
}

// ---------------- HUD ----------------
function fmt(t) {
  if (t == null) return '--:--.--';
  const m = Math.floor(t / 60), s = t - m * 60;
  return String(m).padStart(2, '0') + ':' + s.toFixed(2).padStart(5, '0');
}
let toastT = 0, fbT = 0, bannerT = 0;
function toast(s) { $('toast').textContent = s; $('toast').classList.add('show'); toastT = 2.2; }
function feedback(s, color) { const el = $('feedback'); el.textContent = s; el.style.color = color; el.classList.add('show'); fbT = 0.5; }
function banner(a) { $('banner').querySelector('.small').textContent = 'GEBIET ' + (a + 1) + ' / ' + AREAS.length; $('banner').querySelector('.big').textContent = AREAS[a].name; $('banner').classList.add('show'); bannerT = 2.6; }
function updateBest() {
  const s = best == null ? 'Bestzeit: –' : 'Bestzeit: ' + fmt(best);
  $('best').textContent = s; $('startBest').textContent = s; $('pauseBest').textContent = s;
}
let confirmOpen = false;
function setConfirm(v) {
  confirmOpen = v; $('confirm').classList.toggle('hidden', !v);
  $('confirmText').textContent = flag.carried ? 'Wirklich respawnen? (Flagge ist bei dir → zurück zum Start!)' : 'Wirklich zur Flagge respawnen?';
}
function updateHUD(dt) {
  $('timer').textContent = fmt(runTime);
  let a = 0; for (let i = 0; i < AREAS.length; i++) if (P.pos.y >= AREAS[i].y0) a = i;
  $('area').textContent = AREAS[a].name;
  if (a > maxArea) { maxArea = a; banner(a); }
  $('height').firstChild.textContent = Math.max(0, Math.round(P.pos.y)) + ' m';
  $('height').querySelector('small').textContent = 'Ziel: ' + Math.round(WORLD.goalY) + ' m';
  const fi = $('flagInfo');
  if (flag.carried) fi.textContent = flag.pending ? '🚩 Flagge: wird bei Landung gesetzt…' : '🚩 Flagge: in der Hand';
  else { const dy = Math.round(flag.pos.y - P.pos.y); fi.textContent = '🚩 Flagge: gesetzt (' + (dy > 0 ? '+' : '') + dy + ' m)'; }
  fi.classList.toggle('pending', flag.pending);
  let prompt = '';
  if (!dlg.open && nearDuck()) prompt = '<kbd>F</kbd> Mit der Ente reden';
  else if (!flag.carried && Math.hypot(P.pos.x - flag.pos.x, P.pos.z - flag.pos.z) < 2.6 && Math.abs(P.pos.y - flag.pos.y) < 3) prompt = '<kbd>E</kbd> Flagge aufheben';
  const pe = $('prompt'); pe.classList.toggle('hidden', !prompt); if (prompt && pe.innerHTML !== prompt) pe.innerHTML = prompt;
  $('grind').classList.toggle('hidden', !P.grind);
  if (P.grind) $('grindBar').firstChild.style.width = Math.max(0, 100 - P.grindT / CFG.GRIND_SLOW * 100) + '%';
  if ((toastT -= dt) <= 0) $('toast').classList.remove('show');
  if ((fbT -= dt) <= 0) $('feedback').classList.remove('show');
  if ((bannerT -= dt) <= 0) $('banner').classList.remove('show');
}

// ---------------- environment colors by height ----------------
const _c1 = new T.Color(), _c2 = new T.Color(), _c3 = new T.Color(), _c4 = new T.Color();
function updateEnvironment() {
  const y = P.pos.y;
  let a = 0; for (let i = 0; i < AREAS.length; i++) if (y >= AREAS[i].y0) a = i;
  let t = 0;
  if (a < AREAS.length - 1) {
    const yA = a === 0 ? 0 : AREAS[a].y0, yB = AREAS[a + 1].y0;
    t = T.MathUtils.smoothstep((y - yA) / (yB - yA), 0.55, 1.0);
  }
  const A = AREAS[a], B = AREAS[Math.min(a + 1, AREAS.length - 1)];
  _c1.set(A.sky[0]).lerp(_c3.set(B.sky[0]), t);
  _c2.set(A.sky[1]).lerp(_c4.set(B.sky[1]), t);
  skyMat.uniforms.top.value.copy(_c1); skyMat.uniforms.bottom.value.copy(_c2);
  scene.fog.color.copy(_c2);
  scene.fog.near = T.MathUtils.lerp(A.fog[0], B.fog[0], t);
  scene.fog.far = T.MathUtils.lerp(A.fog[1], B.fog[1], t);
  const space = T.MathUtils.clamp((y - (AREAS[4].y0 + 20)) / (AREAS[5].y0 - AREAS[4].y0 - 10), 0, 1);
  starMat.opacity = space;
  planet.visible = space > 0.01;
  planet.children[0].material.opacity = space; planet.children[1].material.opacity = space * 0.55;
  hemi.intensity = 1.35 - space * 0.35;
  hemi.color.set('#dfefff').lerp(_c3.set('#b8c4ff'), space);
}

// ---------------- visuals per frame ----------------
const _ray = [];
function updateVisuals(dt) {
  // camera spring (landing dip)
  P.dipV += (-P.dip * 120 - P.dipV * 14) * dt;
  P.dip += P.dipV * dt;
  P.dip = Math.max(-0.45, Math.min(0.2, P.dip));
  P.fovKick += (0 - P.fovKick) * Math.min(1, 4 * dt);
  const comp = P.state === 'compress' ? Math.sin(Math.min(1, P.ct / CFG.COMPRESS) * PI) : 0;
  let rollT = 0;
  if (P.grind) { const rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); rollT = (P.wallN.x * rx + P.wallN.z * rz) * 0.14; }
  P.roll += (rollT - P.roll) * Math.min(1, 8 * dt);
  camera.position.set(P.pos.x, P.pos.y + CFG.EYE + P.dip - comp * 0.12, P.pos.z);
  camera.rotation.set(P.pitch, P.yaw, P.roll);
  const fov = settings.fov + P.fovKick;
  if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  sky.position.copy(camera.position); stars.position.copy(camera.position);
  sun.position.copy(P.pos).addScaledVector(SUN_DIR, 100); sun.target.position.copy(P.pos);

  // view model: shaft compresses, slight sway
  const vy = P.state === 'air' ? T.MathUtils.clamp(P.vel.y * 0.006, -0.05, 0.05) : 0;
  vm.position.set(VM_BASE.x + P.roll * 0.3, VM_BASE.y + comp * 0.07 - vy + P.dip * 0.15, VM_BASE.z);
  vm.rotation.set(0.12 + comp * 0.12, 0, -P.roll * 0.8);
  vmFlag.visible = flag.carried;

  // landing indicator
  ring.visible = false;
  if (settings.ring && P.state === 'air') {
    queryColliders(P.pos.x - 0.01, P.pos.z - 0.01, P.pos.x + 0.01, P.pos.z + 0.01, -10, P.pos.y + 0.1, _ray);
    let bestT = 1e9;
    for (const c of _ray) { const t = rayDownOBB(P.pos.x, P.pos.y + 0.05, P.pos.z, c); if (t >= 0 && t < bestT) bestT = t; }
    if (bestT < 80) { ring.visible = true; ring.position.set(P.pos.x, P.pos.y + 0.05 - bestT + 0.03, P.pos.z); const s = 1 + bestT * 0.04; ring.scale.set(s, s, s); }
  }

  // flag cloth waving
  if (flagGroup.visible) {
    const arr = flagGroup.userData.cloth.geometry.attributes.position;
    for (let i = 0; i < arr.count; i++) {
      const x = clothBase[i * 3];
      arr.array[i * 3 + 2] = Math.sin(clock * 6 + x * 5) * 0.12 * x;
    }
    arr.needsUpdate = true;
  }
  // duck idle animation
  duckGroup.position.y = WORLD.duck.y - 0.6 + Math.sin(clock * 1.6) * 0.12;
  const toP = Math.atan2(-(P.pos.z - WORLD.duck.z), P.pos.x - WORLD.duck.x);
  if (Math.hypot(P.pos.x - WORLD.duck.x, P.pos.z - WORLD.duck.z) < 25) {
    let d = toP - duckGroup.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
    duckGroup.rotation.y += d * Math.min(1, 2 * dt);
  }
  duckGroup.rotation.z = Math.sin(clock * 1.3) * 0.05;
}

// ---------------- game flow ----------------
function resetRun() {
  P.pos.copy(WORLD.start); P.vel.set(0, 0, 0); P.yaw = WORLD.startYaw; P.pitch = -0.05;
  P.state = 'air'; P.grind = false; P.kicked = false; P.peakY = P.pos.y; P.lastSpace = -99;
  flag.carried = true; flag.pending = false; flagGroup.visible = false;
  stats.falls = 0; stats.respawns = 0;
  runTime = 0; timerRunning = false; maxArea = 0;
  closeDialog(); setConfirm(false);
}
function win() {
  closeDialog();
  state = 'win'; timerRunning = false;
  const isRecord = best == null || runTime < best;
  if (isRecord) { best = runTime; store.set('best', best); }
  $('winTime').textContent = fmt(runTime);
  $('winRecord').classList.toggle('hidden', !isRecord);
  $('winBest').textContent = 'Bestzeit: ' + fmt(best);
  $('winStats').textContent = 'Stürze: ' + stats.falls + ' · Respawns: ' + stats.respawns;
  updateBest();
  $('win').classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
}
function lock() { try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } }
function startGame() { $('start').classList.add('hidden'); $('hud').classList.remove('hidden'); state = 'play'; paused = false; lock(); }

$('startBtn').onclick = startGame;
$('resumeBtn').onclick = () => { $('pause').classList.add('hidden'); paused = false; lock(); };
$('restartBtn').onclick = () => { resetRun(); $('pause').classList.add('hidden'); paused = false; lock(); };
$('againBtn').onclick = () => { resetRun(); $('win').classList.add('hidden'); state = 'play'; paused = false; lock(); };
$('resetBestBtn').onclick = () => { best = null; store.set('best', null); updateBest(); };
canvas.addEventListener('click', () => { if (state === 'play' && !document.pointerLockElement) { $('pause').classList.add('hidden'); paused = false; lock(); } });
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && state === 'play') { paused = true; $('pause').classList.remove('hidden'); setConfirm(false); }
});
// settings UI
function applySettings() {
  $('sens').value = settings.sens; $('sensV').textContent = (+settings.sens).toFixed(2);
  $('fov').value = settings.fov; $('fovV').textContent = settings.fov;
  $('ring').checked = settings.ring;
  store.set('settings', settings);
}
$('sens').oninput = (e) => { settings.sens = +e.target.value; applySettings(); };
$('fov').oninput = (e) => { settings.fov = +e.target.value; applySettings(); };
$('ring').onchange = (e) => { settings.ring = e.target.checked; applySettings(); };
applySettings(); updateBest();

// ---------------- input ----------------
document.addEventListener('mousemove', (e) => {
  if (!document.pointerLockElement || state !== 'play' || paused) return;
  const s = 0.0022 * settings.sens;
  P.yaw -= e.movementX * s;
  P.pitch = T.MathUtils.clamp(P.pitch - e.movementY * s, -1.55, 1.55);
});
document.addEventListener('mousedown', () => { if (state === 'play' && !paused) dialogInterrupt(); });
window.addEventListener('keydown', (e) => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.code)) e.preventDefault();
  if (state === 'win' && e.code === 'Enter') { $('againBtn').onclick(); return; }
  if (state !== 'play' || paused) return;
  const first = !e.repeat;
  if (first) dialogInterrupt();
  keys[e.code] = true;
  if (!first) return;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(e.code)) timerRunning = true;
  if (confirmOpen) {
    if (e.code === 'Enter' || e.code === 'KeyJ' || e.code === 'KeyY') { setConfirm(false); respawn(false); }
    else if (e.code === 'KeyN' || e.code === 'KeyR' || e.code === 'Backspace') setConfirm(false);
    return;
  }
  switch (e.code) {
    case 'Space': P.lastSpace = clock; break;
    case 'KeyE': pressE(); break;
    case 'KeyR': setConfirm(true); break;
    case 'KeyF': if (!dlg.open && nearDuck()) openDialog('start'); break;
    case 'Digit1': case 'Numpad1': chooseOption(0); break;
    case 'Digit2': case 'Numpad2': chooseOption(1); break;
    case 'Digit3': case 'Numpad3': chooseOption(2); break;
  }
});
window.addEventListener('keyup', (e) => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = vmCam.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); vmCam.updateProjectionMatrix();
});

// ---------------- main loop ----------------
let last = performance.now(), accT = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (state === 'play' && !paused) {
    accT += dt;
    while (accT >= CFG.STEP) { step(CFG.STEP); accT -= CFG.STEP; }
    if (timerRunning) runTime += dt;
    dialogTick(dt);
  } else if (state === 'menu') { // slow idle camera on the title screen
    P.yaw += dt * 0.05;
  }
  updateEnvironment();
  updateVisuals(dt);
  if (state === 'play') updateHUD(dt);
  renderer.clear();
  renderer.render(scene, camera);
  if (state !== 'menu') { renderer.clearDepth(); renderer.render(vmScene, vmCam); }
}
resetRun();
requestAnimationFrame(frame);
window.__climbup = { P, WORLD, AREAS, flag, stats, step, keys, CFG, get state() { return state; }, get clock() { return clock; } };
