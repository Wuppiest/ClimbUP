// ============================================================
//  ClimbUP – procedural sound (Web Audio, no audio files)
// ============================================================
const SFX = (() => {
  let ctx = null, master = null, out = null, noiseBuf = null, verbIn = null;
  const L = {}; // continuous loops: charge, roll, grind, wind, space
  let muted = false, wasFull = false;

  const vol = () => { if (muted) return 0; try { return settings.vol != null ? settings.vol : 0.7; } catch (e) { return 0.7; } };
  const now = () => ctx.currentTime;

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    out = ctx.createGain(); out.gain.value = vol();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    master = ctx.createGain(); master.gain.value = 0.9;
    master.connect(comp); comp.connect(out); out.connect(ctx.destination);
    // white noise buffer
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    // small generated reverb (used by duck, chimes, space)
    const conv = ctx.createConvolver(); const len = ctx.sampleRate * 1.6;
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    conv.buffer = ir; verbIn = ctx.createGain(); verbIn.gain.value = 0.35;
    verbIn.connect(conv); conv.connect(master);
    makeLoops();
  }

  // ---------- building blocks ----------
  function env(g, t, a, peak, dec) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }
  function tone({ type = 'sine', f0 = 440, f1 = null, f2 = null, t1 = 0.1, dur = 0.3, v = 0.2, a = 0.005, delay = 0, vib = 0, vibF = 25, filter = null, q = 1, verb = 0 }) {
    if (!ctx) return;
    const t = now() + delay;
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 != null) o.frequency.exponentialRampToValueAtTime(f1, t + t1);
    if (f2 != null) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    if (vib) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = vibF; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
    const g = ctx.createGain(); env(g, t, a, v, dur);
    let node = o;
    if (filter) { const f = ctx.createBiquadFilter(); f.type = filter.type || 'bandpass'; f.frequency.value = filter.f; f.Q.value = q; node.connect(f); node = f; }
    node.connect(g); g.connect(master);
    if (verb) { const vg = ctx.createGain(); vg.gain.value = verb; g.connect(vg); vg.connect(verbIn); }
    o.start(t); o.stop(t + a + dur + 0.05);
  }
  function noise({ dur = 0.2, v = 0.2, type = 'lowpass', f0 = 800, f1 = null, q = 0.8, a = 0.005, delay = 0, verb = 0 }) {
    if (!ctx) return;
    const t = now() + delay;
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t);
    if (f1 != null) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); env(g, t, a, v, dur);
    s.connect(f); f.connect(g); g.connect(master);
    if (verb) { const vg = ctx.createGain(); vg.gain.value = verb; g.connect(vg); vg.connect(verbIn); }
    s.start(t, Math.random()); s.stop(t + a + dur + 0.05);
  }
  function loopNoise(type, f, q) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    const g = ctx.createGain(); g.gain.value = 0;
    s.connect(fl); fl.connect(g); g.connect(master); s.start();
    return { s, f: fl, g };
  }
  function makeLoops() {
    // spring charge: buzzy saw through a lowpass + creaky band noise
    const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 60;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 400; lp.Q.value = 6;
    const trem = ctx.createOscillator(), tg = ctx.createGain(); trem.frequency.value = 18; tg.gain.value = 0.5;
    const og = ctx.createGain(); og.gain.value = 0;
    const am = ctx.createGain(); am.gain.value = 0.5; trem.connect(tg); tg.connect(am.gain);
    o.connect(lp); lp.connect(am); am.connect(og); og.connect(master); o.start(); trem.start();
    L.charge = { o, lp, g: og, creak: loopNoise('bandpass', 900, 8) };
    L.roll = loopNoise('lowpass', 260, 1.5);
    L.grind = loopNoise('bandpass', 2600, 2.5);
    const ro = ctx.createOscillator(); ro.type = 'square'; ro.frequency.value = 47;
    const rg = ctx.createGain(); rg.gain.value = 0; const rf = ctx.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 500;
    ro.connect(rf); rf.connect(rg); rg.connect(master); ro.start(); L.grindRattle = { o: ro, g: rg };
    L.wind = loopNoise('lowpass', 400, 0.7);
    L.windHi = loopNoise('bandpass', 1800, 0.6);
    // space drone
    const sg = ctx.createGain(); sg.gain.value = 0; sg.connect(master);
    const sv = ctx.createGain(); sv.gain.value = 0.6; sg.connect(sv); sv.connect(verbIn);
    for (const [f, ty] of [[55, 'sine'], [82.4, 'sine'], [110.3, 'triangle']]) { const x = ctx.createOscillator(); x.type = ty; x.frequency.value = f; x.detune.value = (Math.random() - 0.5) * 12; x.connect(sg); x.start(); }
    L.space = { g: sg };
  }
  const set = (param, v, tc = 0.05) => param.setTargetAtTime(v, now(), tc);

  // ---------- events ----------
  const api = {
    init,
    get ready() { return !!ctx; },
    setVolume() { if (ctx) set(out.gain, vol(), 0.02); },
    toggleMute() { muted = !muted; api.setVolume(); return muted; },
    get muted() { return muted; },

    jump(c) {
      const k = 0.6 + c * 0.6;
      tone({ type: 'sine', f0: 150 + c * 50, f1: 480 + c * 380, f2: 260 + c * 120, t1: 0.09, dur: 0.32 + c * 0.15, v: 0.32 * k, vib: 30 + c * 30, vibF: 22 });
      tone({ type: 'triangle', f0: 95, f1: 70, t1: 0.15, dur: 0.18, v: 0.22 });
      noise({ dur: 0.18 + c * 0.15, v: 0.04 + c * 0.1, type: 'bandpass', f0: 700, f1: 2400, q: 1.2 });
      if (c >= 1) tone({ type: 'sine', f0: 900, f1: 1800, t1: 0.2, dur: 0.25, v: 0.08, delay: 0.02 });
    },
    land(impact) {
      const k = Math.min(1, impact / 22);
      if (impact < 2.5) return;
      tone({ type: 'sine', f0: 140 - k * 50, f1: 42, t1: 0.14, dur: 0.16 + k * 0.25, v: 0.18 + k * 0.45 });
      noise({ dur: 0.07 + k * 0.2, v: 0.08 + k * 0.3, type: 'lowpass', f0: 700 + k * 1500, f1: 150, q: 0.7 });
      tone({ type: 'triangle', f0: 1250 + Math.random() * 200, dur: 0.08 + k * 0.1, v: 0.03 + k * 0.05, delay: 0.01 }); // spring 'dink'
      tone({ type: 'sine', f0: 220, f1: 330, f2: 200, t1: 0.06, dur: 0.18, v: 0.05 + k * 0.05, vib: 25, vibF: 28, delay: 0.02 }); // spring wobble
      if (impact > 20) { // big crash
        noise({ dur: 0.55, v: 0.4, type: 'lowpass', f0: 2600, f1: 120, q: 0.5 });
        tone({ type: 'sine', f0: 70, f1: 30, t1: 0.4, dur: 0.6, v: 0.5 });
        for (let i = 0; i < 4; i++) tone({ type: 'square', f0: 300 + Math.random() * 900, dur: 0.06, v: 0.04, delay: 0.03 + Math.random() * 0.2, filter: { type: 'bandpass', f: 1500 }, q: 4 });
      }
    },
    chargeFull() { tone({ type: 'sine', f0: 1760, dur: 0.25, v: 0.07, verb: 0.3 }); tone({ type: 'sine', f0: 2637, dur: 0.2, v: 0.04, delay: 0.03 }); },
    grindStart() { noise({ dur: 0.12, v: 0.15, type: 'highpass', f0: 2500, q: 0.7 }); tone({ type: 'square', f0: 180, f1: 90, t1: 0.1, dur: 0.12, v: 0.05, filter: { type: 'lowpass', f: 900 } }); },
    kick() {
      noise({ dur: 0.3, v: 0.22, type: 'bandpass', f0: 500, f1: 3000, q: 1.4 });
      tone({ type: 'sine', f0: 200, f1: 620, f2: 380, t1: 0.08, dur: 0.28, v: 0.2, vib: 40, vibF: 24 });
    },
    flagSet() {
      noise({ dur: 0.08, v: 0.2, type: 'lowpass', f0: 900, q: 1 });
      [1046.5, 1318.5, 1568].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.25, v: 0.12, delay: 0.05 + i * 0.07, verb: 0.3 }));
    },
    flagPick() { [1568, 1318.5].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.18, v: 0.1, delay: i * 0.07, verb: 0.2 })); },
    error() { tone({ type: 'square', f0: 150, dur: 0.1, v: 0.07, filter: { type: 'lowpass', f: 800 } }); tone({ type: 'square', f0: 120, dur: 0.14, v: 0.07, delay: 0.12, filter: { type: 'lowpass', f: 800 } }); },
    toggle(on) { tone({ type: 'sine', f0: on ? 600 : 420, f1: on ? 900 : 300, t1: 0.06, dur: 0.08, v: 0.08 }); },
    click() { tone({ type: 'triangle', f0: 1400, dur: 0.04, v: 0.06 }); },
    respawn() {
      tone({ type: 'sine', f0: 1500, f1: 180, t1: 0.35, dur: 0.4, v: 0.15, verb: 0.4 });
      noise({ dur: 0.45, v: 0.15, type: 'bandpass', f0: 3000, f1: 400, q: 2 });
      tone({ type: 'sine', f0: 300, f1: 900, t1: 0.2, dur: 0.25, v: 0.1, delay: 0.35, verb: 0.4 });
    },
    area() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone({ type: 'triangle', f0: f, dur: i === 3 ? 0.7 : 0.18, v: 0.12, delay: i * 0.11, verb: 0.4 });
        tone({ type: 'sine', f0: f / 2, dur: i === 3 ? 0.7 : 0.18, v: 0.06, delay: i * 0.11 });
      });
    },
    squeak(n = 1, d0 = 0) { // rubber duck squeak
      for (let i = 0; i < n; i++) {
        const d = d0 + i * 0.2, b = 850 + Math.random() * 250;
        tone({ type: 'square', f0: b, f1: b * 1.55, f2: b * 1.15, t1: 0.05, dur: 0.15, v: 0.09, vib: 60, vibF: 32, filter: { type: 'bandpass', f: 1500 }, q: 2.5, delay: d, verb: 0.15 });
      }
    },
    quack() {
      tone({ type: 'sawtooth', f0: 320, f1: 560, f2: 230, t1: 0.12, dur: 0.6, v: 0.28, vib: 50, vibF: 30, filter: { type: 'bandpass', f: 1000 }, q: 1.6, verb: 0.35 });
      tone({ type: 'square', f0: 160, f1: 280, f2: 120, t1: 0.12, dur: 0.55, v: 0.12, filter: { type: 'lowpass', f: 900 } });
      noise({ dur: 0.35, v: 0.2, type: 'bandpass', f0: 600, f1: 2500, q: 1.2, delay: 0.1 });
    },
    ding() { // toaster bell + spring launch
      tone({ type: 'sine', f0: 2093, dur: 0.6, v: 0.16, verb: 0.4 }); tone({ type: 'sine', f0: 4186, dur: 0.35, v: 0.05 });
      tone({ type: 'sine', f0: 140, f1: 900, f2: 500, t1: 0.12, dur: 0.45, v: 0.28, vib: 35, vibF: 20, delay: 0.03 });
      noise({ dur: 0.35, v: 0.15, type: 'bandpass', f0: 600, f1: 3000, q: 1.2 });
    },
    poof() { noise({ dur: 0.45, v: 0.22, type: 'lowpass', f0: 2200, f1: 300, q: 0.6 }); tone({ type: 'sine', f0: 500, f1: 180, t1: 0.3, dur: 0.35, v: 0.06, verb: 0.3 }); },
    tick(last) { tone({ type: 'sine', f0: last ? 1320 : 880, dur: 0.07, v: 0.1 }); },
    win() {
      const mel = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5];
      mel.forEach((f, i) => { tone({ type: 'triangle', f0: f, dur: i === mel.length - 1 ? 1.0 : 0.16, v: 0.13, delay: i * 0.13, verb: 0.45 }); tone({ type: 'sine', f0: f / 2, dur: 0.2, v: 0.05, delay: i * 0.13 }); });
      api.squeak(3, 1.1);
    },

    // continuous sounds, called every frame
    update(info) {
      if (!ctx) return;
      const { playing, ground, charge, speed, vy, grind, height, space } = info;
      const ch = playing && ground && charge > 0 ? charge : 0;
      set(L.charge.g.gain, ch ? 0.05 + ch * 0.07 : 0, 0.03);
      set(L.charge.o.frequency, 55 + ch * 70, 0.03);
      set(L.charge.lp.frequency, 250 + ch * 900, 0.03);
      set(L.charge.creak.g.gain, ch ? 0.03 + ch * 0.05 : 0, 0.04);
      set(L.charge.creak.f.frequency, 500 + ch * 1500, 0.05);
      if (ch >= 1 && !wasFull) api.chargeFull();
      wasFull = ch >= 1;
      const roll = playing && ground && charge === 0 ? Math.min(1, speed / 3) : 0;
      set(L.roll.g.gain, roll * 0.12, 0.06);
      set(L.roll.f.frequency, 180 + roll * 220, 0.06);
      const gr = playing && grind ? 1 : 0;
      set(L.grind.g.gain, gr * 0.12, 0.04);
      set(L.grindRattle.g.gain, gr * 0.04, 0.04);
      set(L.grind.f.frequency, 2200 + Math.min(1, Math.abs(vy) / 8) * 1500, 0.05);
      // wind: louder the faster you move through the air, plus a quiet bed that grows with height
      const sp = playing && !ground ? Math.hypot(speed, vy) : 0;
      const w = Math.min(1, Math.max(0, (sp - 7) / 28));
      const bed = playing ? Math.min(1, height / 150) * 0.03 + 0.008 : 0.008;
      set(L.wind.g.gain, bed + w * 0.32, 0.12);
      set(L.wind.f.frequency, 300 + w * 900, 0.12);
      set(L.windHi.g.gain, w * w * 0.1, 0.12);
      set(L.space.g.gain, space * 0.045, 0.5);
    },
  };
  return api;
})();
