/* Lógica de una partida: latido, progreso, miradas y giros de cada capítulo. */
(function () {
  const LP = (window.LP = window.LP || {});
  const REST = 72;
  const MAX = 180;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  class Watcher {
    constructor(cfg, firstDelay) {
      this.cfg = cfg;
      this.state = 'away';
      this.t = 0;
      this.dur = firstDelay != null ? firstDelay : rnd(cfg.away[0], cfg.away[1]);
    }
    update(dt) {
      this.t += dt;
      if (this.t < this.dur) return null;
      this.t = 0;
      if (this.state === 'away') {
        this.state = 'warn';
        this.dur = this.cfg.warn;
      } else if (this.state === 'warn') {
        this.state = 'look';
        this.dur = rnd(this.cfg.look[0], this.cfg.look[1]);
      } else {
        this.state = 'away';
        this.dur = rnd(this.cfg.away[0], this.cfg.away[1]);
      }
      return this.state;
    }
    get looking() {
      return this.state === 'look';
    }
    get warning() {
      return this.state === 'warn';
    }
  }

  class Game {
    constructor(level, opts) {
      opts = opts || {};
      this.endless = !!opts.endless;
      this.tips = !!opts.tips;
      this.baseLevel = level;
      this.round = 1;
      this.state = 'ready';
      this.events = [];
      this.time = 0;
      this.roundTime = 0;
      this.bpm = REST + 4;
      this.maxBpm = this.bpm;
      this.progress = 0;
      this.score = 0;
      this.combo = 0;
      this.maxCombo = 0;
      this.perfects = 0;
      this.eyeTime = 0;
      this.held = false;
      this.holdDur = 0;
      this.beatClock = 0;
      this.beatPulse = 0;
      this.walkPhase = 0;
      this.endT = 0;
      this.done = false;
      this.failReason = null;
      this.newWords = [];
      this.shake = 0;
      this.tip = null;
      this.tipsShown = {};
      this.eyeContact = false;
      this.zoneBlocked = false;
      this.windActive = false;
      this.windWarn = false;
      this.bumpWarn = false;
      this.lastAudioT = null;
      this.configure();
      if (this.tips && level.tutorial) this.showTip('start', 'Mantén pulsado para acercarte', 99);
    }

    /* Prepara los parámetros del capítulo (o de la ronda en modo infinito). */
    configure() {
      if (!this.endless) {
        const L = this.baseLevel;
        this.cfg = L;
        this.sceneLevel = L;
        this.timeLimit = L.time;
      } else {
        const r = this.round;
        const scenes = LP.LEVELS;
        const sceneLevel = scenes[(r - 1) % scenes.length];
        const cfg = {
          rise: 12.5 * (1 + 0.065 * (r - 1)),
          speed: 0.065 * (1 + 0.025 * (r - 1)),
          calm: 17,
          gaze: {
            away: [Math.max(1.8, 3 - r * 0.08), Math.max(3, 5 - r * 0.1)],
            warn: Math.max(0.5, 0.85 - 0.025 * r),
            look: [1.2, 2],
          },
          teacher: sceneLevel.teacher || null,
          bumps: sceneLevel.bumps || null,
          wind: sceneLevel.wind || null,
          dance: sceneLevel.dance || null,
          zone: sceneLevel.zone || null,
        };
        if (r > 7) {
          const extra = ['teacher', 'bumps', 'wind'];
          const pick = extra[(r * 7) % extra.length];
          const src = { teacher: scenes[1].teacher, bumps: scenes[2].bumps, wind: scenes[3].wind };
          if (!cfg[pick]) cfg[pick] = src[pick];
        }
        this.cfg = cfg;
        this.sceneLevel = sceneLevel;
        this.timeLimit = Math.max(16, 30 - (r - 1) * 1.1);
      }
      const c = this.cfg;
      this.gaze = new Watcher(c.gaze, this.endless ? rnd(1.2, 2.5) : rnd(2.2, 3.2));
      this.teacher = c.teacher ? new Watcher(c.teacher, rnd(2.5, 3.5)) : null;
      this.bumpT = 0;
      this.bumpNext = c.bumps ? rnd(c.bumps.every[0], c.bumps.every[1]) + 1 : 0;
      this.windT = 0;
      this.windNext = c.wind ? rnd(c.wind.every[0], c.wind.every[1]) : 0;
      this.windEnd = 0;
      this.caught = false;
      this.musicSync = !!(c.dance && !this.endless);
    }

    get rest() {
      return REST;
    }
    get max() {
      return MAX;
    }
    get nervous() {
      return clamp((this.bpm - REST) / (MAX - REST), 0, 1);
    }
    get beatInterval() {
      if (this.cfg.dance) return 60 / this.cfg.dance.tempo;
      return 60 / clamp(this.bpm, 60, 200);
    }
    get timeLeft() {
      return Math.max(0, this.timeLimit - (this.endless ? this.roundTime : this.time));
    }

    emit(type, data) {
      const e = data || {};
      e.type = type;
      this.events.push(e);
    }
    showTip(key, text, dur) {
      if (!this.tips || this.tipsShown[key]) return;
      const generic = key === 'gaze' || key === 'release' || key === 'ring';
      if (generic && !this.baseLevel.tutorial) return;
      this.tipsShown[key] = true;
      this.tip = { text, t: 0, dur: dur || 3.6 };
    }

    update(dt, held) {
      if (this.tip) {
        this.tip.t += dt;
        if (this.tip.t > this.tip.dur) this.tip = null;
      }
      this.beatPulse = Math.max(0, this.beatPulse - dt * 4);
      this.shake = Math.max(0, this.shake - dt * 30);

      if (this.state === 'ready') {
        this.tickBeat(dt);
        if (held) {
          this.state = 'play';
          this.held = true;
          this.holdDur = 0;
          if (this.tip && this.tip.dur === 99) this.tip = null;
          if (this.cfg.dance) this.showTip('dance', 'Suelta justo en el compás de la música ♪');
        }
        return;
      }
      if (this.state === 'win' || this.state === 'fail') {
        this.endT += dt;
        this.tickBeat(dt);
        if (this.state === 'win' && this.endT < 1.2) this.walkPhase += dt * 6;
        if (this.endT > (this.state === 'win' ? 2.3 : 1.9)) this.done = true;
        return;
      }

      // ---- jugando ----
      this.time += dt;
      this.roundTime += dt;
      const c = this.cfg;

      const g = this.gaze.update(dt);
      if (g === 'warn') {
        this.emit('gazeWarn');
        this.showTip('gaze', '¡Se va a girar! Si avanzas mientras te mira: contacto visual ✨');
      }
      if (g === 'away') this.eyeContact = false;

      if (this.teacher) {
        const tg = this.teacher.update(dt);
        if (tg === 'warn') {
          this.emit('teacherWarn');
          this.showTip('teacher', '¡El profe se va a girar! Suelta…');
        }
        if (tg === 'away') this.caught = false;
      }

      // baches
      this.bumpWarn = false;
      if (c.bumps) {
        this.bumpT += dt;
        if (this.bumpT >= this.bumpNext - c.bumps.warn) {
          this.bumpWarn = true;
          if (!this.tipsShown.bump) this.showTip('bump', '¡Bache! Suelta antes del golpe');
        }
        if (this.bumpT >= this.bumpNext) {
          const hit = held ? 24 : 7;
          this.bpm += hit;
          this.shake = held ? 16 : 8;
          this.emit('bump', { hard: held });
          this.bumpT = 0;
          this.bumpNext = rnd(c.bumps.every[0], c.bumps.every[1]);
        }
      }

      // viento
      this.windWarn = false;
      if (c.wind) {
        this.windT += dt;
        if (!this.windActive) {
          if (this.windT >= this.windNext - c.wind.warn) {
            this.windWarn = true;
            this.showTip('wind', 'Viene una ráfaga: te empujará hacia atrás');
          }
          if (this.windT >= this.windNext) {
            this.windActive = true;
            this.windEnd = this.windT + rnd(c.wind.dur[0], c.wind.dur[1]);
            this.emit('gust');
          }
        } else if (this.windT >= this.windEnd) {
          this.windActive = false;
          this.windT = 0;
          this.windNext = rnd(c.wind.every[0], c.wind.every[1]);
        }
      }

      // pulsar / soltar
      if (held && !this.held) {
        this.held = true;
        this.holdDur = 0;
      } else if (!held && this.held) {
        this.held = false;
        this.onRelease();
      }
      if (this.held) this.holdDur += dt;

      this.tickBeat(dt);

      // física del corazón
      let dProg = 0;
      let dBpm = 0;
      const looking = this.gaze.looking;
      const teacherLooking = this.teacher && this.teacher.looking;
      const nearness = 1 + this.progress * 0.45;
      this.zoneBlocked = false;
      const wasEye = this.eyeContact;
      this.eyeContact = false;

      if (this.held) {
        let sp = c.speed;
        let rise = c.rise * nearness;
        if (looking) {
          this.eyeContact = true;
          sp *= 2.6;
          rise *= 1.9;
          this.eyeTime += dt;
          this.score += 220 * dt;
        }
        if (teacherLooking) {
          sp = -0.075;
          rise += 10;
          if (!this.caught) {
            this.caught = true;
            this.combo = 0;
            this.shake = 8;
            this.emit('teacherCaught');
          }
        }
        if (this.windActive && sp > 0) sp *= 0.45;
        if (c.zone && this.progress >= c.zone.start && sp > 0) {
          if (this.bpm < c.zone.min || this.bpm > c.zone.max) {
            sp = 0;
            this.zoneBlocked = true;
          } else {
            sp *= 0.8;
          }
          this.showTip('zone', 'Mantén el latido en la zona dulce para avanzar');
        }
        dProg += sp * dt;
        dBpm += rise * dt;
        if (sp > 0) {
          this.score += sp * dt * 1200;
          this.walkPhase += dt * (6 + sp * 40);
        }
        if (this.tips && this.bpm > 128) this.showTip('release', 'Suelta para respirar y calmar tu corazón ♥');
      } else {
        dBpm -= c.calm * dt;
        if (looking) dBpm += 4 * dt;
      }
      if (this.windActive) dProg -= c.wind.push * dt;
      if (this.eyeContact && !wasEye) this.emit('eyeStart');

      this.progress = clamp(this.progress + dProg, 0, 1);
      this.bpm = clamp(this.bpm + dBpm, REST, MAX);
      if (this.bpm > this.maxBpm) this.maxBpm = this.bpm;

      if (this.bpm >= MAX) return this.finish(false, 'blush');
      if (this.progress >= 1) {
        if (this.endless) return this.nextRound();
        return this.finish(true);
      }
      if (this.timeLeft <= 0) return this.finish(false, 'time');
    }

    tickBeat(dt) {
      const interval = this.beatInterval;
      let beat = false;
      if (this.musicSync && LP.Audio && LP.Audio.musicTime() != null) {
        const mt = LP.Audio.musicTime();
        if (mt >= 0) {
          const bc = mt % interval;
          if (this.lastAudioT != null && bc < this.beatClock) beat = true;
          this.beatClock = bc;
          this.lastAudioT = mt;
        }
      } else {
        this.beatClock += dt;
        if (this.beatClock >= interval) {
          this.beatClock %= interval;
          beat = true;
        }
      }
      if (beat) {
        this.beatPulse = 1;
        this.emit('beat', { intensity: this.nervous });
      }
    }

    onRelease() {
      if (this.holdDur < 0.16) return;
      if (this.tips) this.showTip('ring', 'Suelta justo cuando el anillo toque el corazón: ¡respiración perfecta!', 4.2);
      const interval = this.beatInterval;
      const d = Math.min(this.beatClock, interval - this.beatClock);
      const perfectW = Math.min(0.09, interval * 0.13);
      const goodW = Math.min(0.18, interval * 0.27);
      if (d <= perfectW) {
        this.combo++;
        this.perfects++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        this.bpm = Math.max(REST, this.bpm - 11);
        this.score += 100 * Math.min(this.combo, 10);
        if (this.cfg.dance) this.progress = Math.min(0.999, this.progress + this.cfg.dance.bonus);
        this.emit('perfect', { combo: this.combo });
        this.maybeWord();
      } else if (d <= goodW) {
        this.bpm = Math.max(REST, this.bpm - 4);
        this.score += 30;
        this.emit('good');
      } else {
        if (this.combo > 1) this.emit('miss');
        this.combo = 0;
      }
    }

    maybeWord() {
      if (this.endless) return;
      if (!(this.perfects === 1 || this.perfects % 3 === 0)) return;
      const L = this.baseLevel;
      const free = [];
      L.fragments.forEach((f, i) => {
        if (!LP.Store.hasFragment(L.id, i)) free.push(i);
      });
      if (!free.length) return;
      const i = free[Math.floor(Math.random() * free.length)];
      LP.Store.addFragment(L.id, i);
      this.newWords.push(L.fragments[i].k);
      this.emit('word', { text: L.fragments[i].k });
    }

    nextRound() {
      const bonus = 500 * this.round + Math.round(this.timeLeft * 25);
      this.score += bonus;
      this.round++;
      this.progress = 0;
      this.roundTime = 0;
      this.bpm = Math.max(REST, this.bpm - 30);
      this.configure();
      this.emit('round', { round: this.round, bonus });
    }

    finish(win, reason) {
      this.state = win ? 'win' : 'fail';
      this.failReason = reason || null;
      this.endT = 0;
      this.held = false;
      this.eyeContact = false;
      if (win) {
        this.score += Math.round(this.timeLeft * 40);
        const goals = this.baseLevel.goals;
        this.stars = 1 + (this.perfects >= goals.perfect ? 1 : 0) + (this.eyeTime >= goals.eye ? 1 : 0);
        this.emit('win');
      } else {
        this.stars = 0;
        this.shake = 10;
        this.emit('fail', { reason });
      }
      this.score = Math.round(this.score);
    }
  }

  LP.Game = Game;
})();
