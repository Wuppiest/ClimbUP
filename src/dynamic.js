// ============================================================
//  ClimbUP – moving and special objects
//  motion types: slide (back and forth), bob (up/down), spin, orbit,
//  swing (pendulum on a crane cable), vanish (cloud that dissolves), pad (toaster launch)
// ============================================================
const DYNS = [];
const _dq = new T.Quaternion(), _dq2 = new T.Quaternion(), _dv = new V3(), _dv2 = new V3(), _dm = new T.Matrix4(), _dm2 = new T.Matrix4();
const ONE3 = new V3(1, 1, 1);

// world matrix of a moving object at time t
function dynMatrix(s, t, out) {
  const b = s.base, m = s.motion;
  let x = b.x, y = b.y, z = b.z, yaw = b.yaw;
  switch (m.type) {
    case 'slide': { const k = Math.sin(2 * PI * t / m.T + m.ph) * m.A; x += m.ax * k; z += m.az * k; break; }
    case 'bob': y += Math.sin(2 * PI * t / m.T + m.ph) * m.A; break;
    case 'spin': yaw += m.w * t; break;
    case 'orbit': { const a = 2 * PI * t / m.T + m.ph; x += Math.cos(a) * m.r; z += Math.sin(a) * m.r; yaw += m.w * t; break; }
  }
  out.compose(_dv.set(x, y, z), _dq.setFromAxisAngle(UP, yaw), ONE3);
  if (m.type === 'swing') { // rotate around the long axis, pivot high above (crane hook)
    const th = Math.sin(2 * PI * t / m.T + m.ph) * m.A;
    _dv2.set(Math.cos(b.yaw), 0, -Math.sin(b.yaw));
    _dm.makeTranslation(b.x, b.y + m.L, b.z);
    _dm2.makeRotationAxis(_dv2, th); _dm.multiply(_dm2);
    _dm2.makeTranslation(-b.x, -b.y - m.L, -b.z); _dm.multiply(_dm2);
    out.premultiply(_dm);
  }
  return out;
}
function dynPeriod(m) { return m.type === 'spin' ? 2 * PI / Math.abs(m.w) : m.T || 1; }
// bounding box over the whole motion (used by the generator to avoid collisions)
function dynSweptAABB(s) {
  const min = [1e9, 1e9, 1e9], max = [-1e9, -1e9, -1e9], M = new T.Matrix4(), q = new T.Quaternion(), sc = new V3(), p = new V3();
  const per = dynPeriod(s.motion), N = s.motion.type === 'none' || s.motion.type === 'vanish' || s.motion.type === 'pad' ? 1 : 16;
  for (let i = 0; i < N; i++) {
    dynMatrix(s, per * i / N, M); M.decompose(p, q, sc);
    for (const c of s.obj.cols) {
      const o = makeOBB(c, M, q);
      for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], o.min[k]); max[k] = Math.max(max[k], o.max[k]); }
    }
  }
  return { min, max };
}

// ---------- runtime ----------
function yawOf(M) { const e = M.elements; return Math.atan2(-e[2], e[0]); }
const DYN = {
  init(scene, mat) {
    for (const s of WORLD.dyn) {
      const acc = new MeshAcc();
      for (const p of s.obj.parts) acc.add(p.geo, p.m, p.color);
      const mesh = acc.build(mat); mesh.castShadow = true; mesh.receiveShadow = true; mesh.matrixAutoUpdate = false;
      scene.add(mesh);
      const d = { s, mesh, M: new T.Matrix4(), Mprev: new T.Matrix4(), cols: [], q: new T.Quaternion(), state: 'solid', t: 0, scale: 1, armT: 0, cool: 0, extra: null };
      dynMatrix(s, 0, d.M); d.Mprev.copy(d.M);
      for (const c of s.obj.cols) { const o = makeOBB(c, d.M, d.q.setFromRotationMatrix(d.M)); o.enabled = true; o.dyn = d; d.cols.push({ spec: c, obb: o }); DYN_COLS.push(o); }
      if (s.motion.type === 'pad') { // two toast slices that pop out of the slots
        d.extra = [];
        for (const z of [-0.45, 0.45]) {
          const tm = new T.Mesh(new T.BoxGeometry(1.6, 1.3, 0.28), new T.MeshLambertMaterial({ color: '#d9a35b' }));
          tm.castShadow = true; scene.add(tm); d.extra.push({ mesh: tm, z });
        }
      }
      DYNS.push(d);
    }
  },
  // called once per physics step, before the player moves
  step(t, dt) {
    for (const d of DYNS) {
      d.Mprev.copy(d.M);
      dynMatrix(d.s, t, d.M);
      const type = d.s.motion.type;
      if (type === 'vanish') DYN.vanishStep(d, dt);
      if (type === 'pad') DYN.padStep(d, dt);
      d.q.setFromRotationMatrix(d.M);
      for (const c of d.cols) { updateOBB(c.obb, c.spec, d.M, d.q); c.obb.enabled = d.state !== 'gone'; }
    }
  },
  // move the player along with the object they stand on
  carry(dt) {
    const d = P.groundDyn;
    if (!d || P.state !== 'ground') { P.platVel.set(0, 0, 0); return; }
    _dm.copy(d.Mprev).invert();
    _dv.copy(P.pos).applyMatrix4(_dm).applyMatrix4(d.M);
    P.platVel.set((_dv.x - P.pos.x) / dt, (_dv.y - P.pos.y) / dt, (_dv.z - P.pos.z) / dt);
    P.pos.copy(_dv);
    let dy = yawOf(d.M) - yawOf(d.Mprev); dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    P.yaw += dy;
  },
  vanishStep(d, dt) {
    const on = P.groundDyn === d && P.state === 'ground';
    if (d.state === 'solid' && on) { d.state = 'shake'; d.t = 0; }
    else if (d.state === 'shake') { d.t += dt; if (d.t > 1.6) { d.state = 'gone'; d.t = 0; SFX.poof(); } }
    else if (d.state === 'gone') { d.t += dt; if (d.t > 3.5) { d.state = 'back'; d.t = 0; } }
    else if (d.state === 'back') { d.t += dt; if (d.t > 0.4) d.state = 'solid'; }
  },
  padStep(d, dt) {
    if (d.cool > 0) d.cool -= dt;
    const on = P.groundDyn === d && P.state === 'ground';
    if (on && d.cool <= 0) {
      d.armT += dt;
      if (d.armT > 0.55) { // DING!
        const dir = inputDir();
        const vy = 17 + P.charge * 3;
        P.state = 'air'; P.charge = 0; P.groundDyn = null; P.peakY = P.pos.y; P.pos.y += 0.02;
        P.vel.set(dir ? dir.x * CFG.MOVE_SPEED : 0, vy, dir ? dir.z * CFG.MOVE_SPEED : 0);
        P.fovKick = 10; P.dipV += 4;
        d.cool = 1.2; d.armT = 0; d.pop = 0;
        feedback('DING!', '#ffd84a'); SFX.ding();
      }
    } else d.armT = 0;
    if (d.pop != null) { d.pop += dt; if (d.pop > 1.2) d.pop = null; }
  },
  // visuals, once per rendered frame
  render() {
    for (const d of DYNS) {
      d.mesh.matrix.copy(d.M);
      const type = d.s.motion.type;
      if (type === 'vanish') {
        let sc = 1, jx = 0, jz = 0;
        if (d.state === 'shake') { jx = (Math.random() - 0.5) * 0.09 * d.t; jz = (Math.random() - 0.5) * 0.09 * d.t; sc = 1 - d.t * 0.06; }
        else if (d.state === 'gone') sc = Math.max(0.001, 1 - d.t * 4);
        else if (d.state === 'back') sc = Math.min(1, d.t / 0.4);
        _dm.makeScale(sc, sc, sc); _dm.setPosition(jx, 0, jz);
        d.mesh.matrix.copy(d.M).multiply(_dm);
        d.mesh.visible = sc > 0.01;
      }
      if (d.extra) { // toast pop: up fast, falls back into the toaster
        const p = d.pop != null ? Math.max(0, Math.sin(Math.min(1, d.pop / 1.2) * PI)) * 2.2 : 0;
        const arm = P.groundDyn === d ? Math.min(1, d.armT / 0.55) * 0.12 : 0;
        for (const e of d.extra) {
          _dv.set(0, 1.75 + p + arm + (Math.random() - 0.5) * arm * 0.4, e.z).applyMatrix4(d.M);
          e.mesh.position.copy(_dv); e.mesh.rotation.y = d.s.base.yaw;
        }
      }
    }
  },
};
