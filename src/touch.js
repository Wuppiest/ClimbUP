// ============================================================
//  ClimbUP – touch controls (iPad / phones)
//  left thumb: floating joystick, right side: drag to look,
//  buttons: jump (hold = charge / grind), sneak (toggle), flag, respawn, pause, talk
// ============================================================
(function () {
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const isTouch = coarse || (navigator.maxTouchPoints > 0 && 'ontouchstart' in window);

  function enableTouch() {
    if (TOUCH.enabled) return;
    TOUCH.enabled = true;
    document.body.classList.add('touch');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // keep tablets smooth
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  if (isTouch) enableTouch();
  window.addEventListener('touchstart', enableTouch, { passive: true, capture: true });
  document.addEventListener('gesturestart', (e) => e.preventDefault()); // no pinch zoom on iOS

  const layer = $('touch'), base = $('stickBase'), knob = $('stickKnob'), hint = $('stickHint');
  const RADIUS = 60, DEAD = 0.18;
  let stickId = null, sx = 0, sy = 0, lookId = null, lx = 0, ly = 0, moved = false;
  const live = () => state === 'play' && !paused;

  function resetStick() {
    stickId = null; moved = false; TOUCH.mx = 0; TOUCH.my = 0;
    base.style.display = 'none'; hint.style.display = '';
  }

  layer.addEventListener('touchstart', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.target.closest && t.target.closest('.tbtn')) continue;
      if (t.clientX < window.innerWidth * 0.45 && stickId === null) {
        stickId = t.identifier; sx = t.clientX; sy = t.clientY;
        base.style.left = sx + 'px'; base.style.top = sy + 'px'; base.style.display = 'block';
        knob.style.transform = ''; hint.style.display = 'none';
      } else if (lookId === null) {
        lookId = t.identifier; lx = t.clientX; ly = t.clientY;
      }
    }
  }, { passive: false });

  layer.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) {
        let dx = t.clientX - sx, dy = t.clientY - sy;
        const l = Math.hypot(dx, dy);
        if (l > RADIUS) { dx *= RADIUS / l; dy *= RADIUS / l; }
        knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        const mx = dx / RADIUS, my = -dy / RADIUS;
        if (Math.hypot(mx, my) < DEAD) { TOUCH.mx = 0; TOUCH.my = 0; }
        else {
          TOUCH.mx = mx; TOUCH.my = my;
          if (live()) { if (!moved) { moved = true; dialogInterrupt(); } timerRunning = true; }
        }
      } else if (t.identifier === lookId) {
        if (live()) {
          const s = 0.0048 * settings.sens;
          P.yaw -= (t.clientX - lx) * s;
          P.pitch = T.MathUtils.clamp(P.pitch - (t.clientY - ly) * s, -1.55, 1.55);
        }
        lx = t.clientX; ly = t.clientY;
      }
    }
  }, { passive: false });

  const endTouch = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) resetStick();
      if (t.identifier === lookId) lookId = null;
    }
  };
  layer.addEventListener('touchend', endTouch);
  layer.addEventListener('touchcancel', endTouch);

  function button(id, onDown, onUp) {
    const el = $(id);
    el.addEventListener('touchstart', (e) => {
      e.preventDefault(); e.stopPropagation();
      el.classList.add('down'); onDown();
    }, { passive: false });
    const up = (e) => {
      e.preventDefault(); e.stopPropagation();
      el.classList.remove('down'); if (onUp) onUp();
    };
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    el.addEventListener('mousedown', (e) => { e.preventDefault(); onDown(); }); // also clickable for testing
    el.addEventListener('mouseup', () => { if (onUp) onUp(); });
  }
  button('tJump', () => pressKey('Space'), () => releaseKey('Space'));
  button('tSneak', () => { if (live()) { keys.ShiftLeft = !keys.ShiftLeft; SFX.toggle(keys.ShiftLeft); } });
  button('tFlag', () => pressKey('KeyE'), () => releaseKey('KeyE'));
  button('tRespawn', () => pressKey('KeyR'), () => releaseKey('KeyR'));
  button('tTalk', () => pressKey('KeyF'), () => releaseKey('KeyF'));
  button('tPause', () => { if (live()) pauseGame(); });

  // tappable respawn confirmation and duck answers (work with mouse too)
  $('confYes').addEventListener('click', () => { if (confirmOpen) { setConfirm(false); respawn(false); } });
  $('confNo').addEventListener('click', () => setConfirm(false));
  $('dlgOpts').addEventListener('click', (e) => { const o = e.target.closest('.opt'); if (o) chooseOption(+o.dataset.i); });

  // try real fullscreen on tablets when the game starts
  $('startBtn').addEventListener('click', () => {
    if (!TOUCH.enabled) return;
    const el = document.documentElement, fs = el.requestFullscreen || el.webkitRequestFullscreen;
    if (fs) { try { const p = fs.call(el); if (p && p.catch) p.catch(() => {}); } catch (err) { /* not supported */ } }
  });

  // per-frame UI state (called from the main loop)
  let lastPlaying = null;
  TOUCH.update = function () {
    const playing = live();
    if (playing !== lastPlaying) {
      document.body.classList.toggle('playing', playing);
      if (!playing) { resetStick(); lookId = null; for (const id of ['tJump', 'tFlag', 'tRespawn', 'tTalk']) $(id).classList.remove('down'); }
      lastPlaying = playing;
    }
    if (!TOUCH.enabled || !playing) return;
    $('tSneak').classList.toggle('on', sneaking());
    $('tTalk').classList.toggle('hidden', dlg.open || !nearDuck());
  };
})();
