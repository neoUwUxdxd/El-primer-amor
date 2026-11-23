/* Sonido 100% sintetizado con Web Audio. */
(function () {
  const LP = (window.LP = window.LP || {});
  let ctx = null,
    master = null,
    musicBus = null,
    sfxBus = null,
    echoIn = null,
    noiseBuf = null;
  let enabled = true;
  let music = null,
    musicTimer = null;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      ctx = new AC();
    } catch (e) {
      return;
    }
    master = ctx.createGain();
    master.gain.value = enabled ? 0.85 : 0;
    const comp = ctx.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(ctx.destination);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0.5;
    musicBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;
    sfxBus.connect(master);

    // eco suave tipo caja de música
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.3;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    delay.connect(lp);
    lp.connect(fb);
    fb.connect(delay);
    lp.connect(master);
    echoIn = ctx.createGain();
    echoIn.gain.value = 0.4;
    echoIn.connect(delay);

    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tone(freq, t, opts) {
    if (!ctx) return;
    const o = opts || {};
    const type = o.type || 'sine';
    const vol = o.vol == null ? 0.2 : o.vol;
    const attack = o.attack || 0.01;
    const release = o.release || 0.3;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + attack + release);
    if (o.detune) osc.detune.value = o.detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(vol, 0.0002), t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
    osc.connect(g);
    g.connect(o.dest || sfxBus);
    if (o.echo) g.connect(echoIn);
    osc.start(t);
    osc.stop(t + attack + release + 0.05);
  }

  function noise(t, dur, opts) {
    if (!ctx) return;
    const o = opts || {};
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = o.filter || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 800, t);
    if (o.freqTo) f.frequency.exponentialRampToValueAtTime(o.freqTo, t + dur);
    f.Q.value = o.q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol || 0.2, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(sfxBus);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  const now = () => (ctx ? ctx.currentTime + 0.005 : 0);
  const PENTA = [0, 2, 4, 7, 9];

  // ---------- Música ----------
  function startMusic(cfg) {
    stopMusic();
    if (!ctx || !cfg) return;
    music = { cfg, step: 0, start: ctx.currentTime + 0.12, next: ctx.currentTime + 0.12 };
    musicTimer = setInterval(schedule, 50);
    schedule();
  }
  function stopMusic() {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
    music = null;
  }
  function schedule() {
    if (!music || !ctx) return;
    const spb = 60 / music.cfg.tempo / 2; // corcheas
    while (music.next < ctx.currentTime + 0.3) {
      playStep(music.step, music.next, spb);
      music.next += spb;
      music.step++;
    }
  }
  function playStep(step, t, spb) {
    const cfg = music.cfg;
    const bar = Math.floor(step / 8) % cfg.prog.length;
    const chord = cfg.prog[bar];
    const root = cfg.root;
    if (step % 8 === 0) {
      chord.forEach((n, i) =>
        tone(mtof(root + n - 12), t, {
          type: 'sine',
          vol: 0.05,
          attack: 0.5,
          release: spb * 8,
          dest: musicBus,
          detune: i * 4 - 4,
        })
      );
      tone(mtof(root + chord[0] - 24), t, { type: 'triangle', vol: 0.08, attack: 0.04, release: spb * 6, dest: musicBus });
    }
    if (step % 8 === 4) {
      tone(mtof(root + chord[0] - 24 + 7), t, { type: 'triangle', vol: 0.045, attack: 0.04, release: spb * 3, dest: musicBus });
    }
    const p = cfg.pattern[step % cfg.pattern.length];
    if (p != null) {
      // variación suave cada 4 compases
      const lift = Math.floor(step / 32) % 2 === 1 && step % 8 === 6 ? 1 : 0;
      const idx = p + lift;
      const n = chord[idx % chord.length] + 12 * Math.floor(idx / chord.length);
      tone(mtof(root + 12 + n), t, { type: 'triangle', vol: 0.045, attack: 0.004, release: 0.9, dest: musicBus, echo: true });
      tone(mtof(root + 24 + n), t, { type: 'sine', vol: 0.012, attack: 0.004, release: 0.5, dest: musicBus });
    }
  }
  function musicTime() {
    if (!music || !ctx) return null;
    return ctx.currentTime - music.start;
  }

  // ---------- Efectos ----------
  const A = {
    init,
    startMusic,
    stopMusic,
    musicTime,
    get enabled() {
      return enabled;
    },
    setEnabled(v) {
      enabled = v;
      if (master) master.gain.setTargetAtTime(v ? 0.85 : 0, ctx.currentTime, 0.05);
    },
    heartbeat(intensity) {
      if (!ctx) return;
      const t = now();
      const v = 0.35 + intensity * 0.55;
      tone(95, t, { type: 'triangle', vol: 0.5 * v, attack: 0.006, release: 0.13, slideTo: 45 });
      tone(55, t, { type: 'sine', vol: 0.6 * v, attack: 0.006, release: 0.16, slideTo: 38 });
      tone(85, t + 0.14, { type: 'triangle', vol: 0.33 * v, attack: 0.006, release: 0.12, slideTo: 42 });
    },
    perfect(combo) {
      if (!ctx) return;
      const t = now();
      const c = Math.max(0, combo - 1);
      const n = 76 + PENTA[c % 5] + 12 * (Math.floor(c / 5) % 2);
      tone(mtof(n), t, { type: 'triangle', vol: 0.16, attack: 0.004, release: 0.6, echo: true });
      tone(mtof(n + 12), t + 0.06, { type: 'sine', vol: 0.08, attack: 0.004, release: 0.5, echo: true });
    },
    good() {
      if (!ctx) return;
      tone(mtof(72), now(), { type: 'sine', vol: 0.09, attack: 0.004, release: 0.25 });
    },
    miss() {
      if (!ctx) return;
      tone(mtof(60), now(), { type: 'sine', vol: 0.07, attack: 0.004, release: 0.2, slideTo: mtof(55) });
    },
    gazeWarn() {
      if (!ctx) return;
      const t = now();
      tone(mtof(88), t, { type: 'sine', vol: 0.05, attack: 0.004, release: 0.25, echo: true });
      tone(mtof(91), t + 0.08, { type: 'sine', vol: 0.05, attack: 0.004, release: 0.25, echo: true });
    },
    eye() {
      if (!ctx) return;
      const t = now();
      [84, 88, 91, 96].forEach((n, i) =>
        tone(mtof(n), t + i * 0.05, { type: 'sine', vol: 0.06, attack: 0.004, release: 0.4, echo: true })
      );
    },
    alarm() {
      if (!ctx) return;
      const t = now();
      tone(440, t, { type: 'square', vol: 0.04, attack: 0.005, release: 0.1 });
      tone(349, t + 0.13, { type: 'square', vol: 0.04, attack: 0.005, release: 0.14 });
    },
    bump() {
      if (!ctx) return;
      const t = now();
      tone(130, t, { type: 'sine', vol: 0.4, attack: 0.005, release: 0.25, slideTo: 45 });
      noise(t, 0.25, { filter: 'lowpass', freq: 400, vol: 0.25 });
    },
    whoosh() {
      if (!ctx) return;
      noise(now(), 1.2, { filter: 'bandpass', freq: 300, freqTo: 1400, q: 0.8, vol: 0.16 });
    },
    word() {
      if (!ctx) return;
      const t = now();
      [79, 83, 86, 91].forEach((n, i) =>
        tone(mtof(n), t + i * 0.07, { type: 'triangle', vol: 0.09, attack: 0.004, release: 0.8, echo: true })
      );
    },
    win() {
      if (!ctx) return;
      const t = now();
      [72, 76, 79, 84, 88].forEach((n, i) =>
        tone(mtof(n), t + i * 0.11, { type: 'triangle', vol: 0.12, attack: 0.005, release: 0.9, echo: true })
      );
      [60, 64, 67].forEach((n) => tone(mtof(n), t + 0.5, { type: 'sine', vol: 0.07, attack: 0.1, release: 1.6 }));
    },
    round() {
      if (!ctx) return;
      const t = now();
      [79, 84, 88].forEach((n, i) =>
        tone(mtof(n), t + i * 0.08, { type: 'triangle', vol: 0.1, attack: 0.005, release: 0.6, echo: true })
      );
    },
    fail() {
      if (!ctx) return;
      const t = now();
      [67, 64, 60, 55].forEach((n, i) =>
        tone(mtof(n), t + i * 0.14, { type: 'triangle', vol: 0.1, attack: 0.01, release: 0.45 })
      );
    },
    click() {
      if (!ctx) return;
      tone(mtof(84), now(), { type: 'sine', vol: 0.05, attack: 0.002, release: 0.08 });
    },
  };
  LP.Audio = A;
})();
