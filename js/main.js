/* Arranque, bucle principal y pantallas. */
(function () {
  const LP = window.LP;
  const S = LP.Store;
  const A = LP.Audio;
  const R = LP.Render;
  const FX = LP.FX;
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const ACH = [
    { id: 'first', ico: '💌', name: 'Primer latido', desc: 'Completa el primer capítulo' },
    { id: 'calm', ico: '🧊', name: 'Sangre fría', desc: 'Gana un capítulo sin pasar de 140 BPM' },
    { id: 'brave', ico: '👀', name: 'Mirada valiente', desc: '6 s de contacto visual en una partida' },
    { id: 'combo10', ico: '🔥', name: 'En sintonía', desc: 'Combo x10 de respiraciones perfectas' },
    { id: 'edge', ico: '😳', name: 'Al borde', desc: 'Gana después de pasar de 170 BPM' },
    { id: 'end', ico: '🌙', name: 'Te lo dije', desc: 'Completa la confesión' },
    { id: 'stars', ico: '⭐', name: 'Corazón lleno', desc: 'Consigue las 21 estrellas' },
    { id: 'poet', ico: '✍️', name: 'Poeta', desc: 'Recupera las 28 frases de la carta' },
    { id: 'b5', ico: '🦋', name: 'Mariposas', desc: 'Llega a la ronda 5 del modo infinito' },
    { id: 'b10', ico: '🌸', name: 'Enamoramiento total', desc: 'Llega a la ronda 10 del modo infinito' },
    { id: 'tomato', ico: '🍅', name: 'Rojo tomate', desc: 'Ponte rojísimo 10 veces' },
  ];
  const MENU_MUSIC = { tempo: 66, root: 65, prog: [[0, 4, 7], [9, 12, 16], [5, 9, 12], [7, 11, 14]], pattern: [0, null, 2, null, 1, null, 3, null] };

  let game = null;
  let levelIndex = 0;
  let endless = false;
  let paused = false;
  let resultShown = false;
  let current = 'menu';
  let afterSetup = 'menu';
  let audioReady = false;

  // ---------- utilidades ----------
  function show(id) {
    current = id;
    $$('.screen').forEach((s) => s.classList.toggle('show', s.id === 's-' + id));
    $('#hud').classList.toggle('show', id === null);
  }
  function vibrate(p) {
    if (S.data.vibrate && navigator.vibrate) {
      try {
        navigator.vibrate(p);
      } catch (e) {}
    }
  }
  const toastQueue = [];
  let toastBusy = false;
  function toast(msg) {
    toastQueue.push(msg);
    if (!toastBusy) nextToast();
  }
  function nextToast() {
    const el = $('#toast');
    const msg = toastQueue.shift();
    if (!msg) {
      toastBusy = false;
      return;
    }
    toastBusy = true;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(nextToast, 420);
    }, 2400);
  }
  function award(id) {
    if (S.unlock(id)) {
      const a = ACH.find((x) => x.id === id);
      if (a) toast(`${a.ico} Logro: ${a.name}`);
    }
  }
  function ensureAudio() {
    A.init();
    A.setEnabled(S.data.sound);
    if (!audioReady) {
      audioReady = true;
      if (!game) A.startMusic(MENU_MUSIC);
    }
  }
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- menú ----------
  function refreshMenu() {
    const d = S.data;
    $('#menu-for').textContent = d.crush ? `para ${d.crush} ♥` : '';
    const stars = S.totalStars();
    const fr = S.fragmentCount();
    let txt = `★ ${stars}/21 · ✍ ${fr}/28`;
    if (d.endlessBest) txt += ` · 🦋 ${d.endlessBest}`;
    $('#menu-stats').textContent = txt;
    $('#btn-sound').classList.toggle('off', !d.sound);
    $('#btn-sound').textContent = d.sound ? '🔊' : '🔈';
    $('#btn-vibe').classList.toggle('off', !d.vibrate);
  }
  function goMenu() {
    game = null;
    FX.clear();
    LP.Input.enabled = false;
    refreshMenu();
    show('menu');
    if (audioReady) A.startMusic(MENU_MUSIC);
  }

  // ---------- personajes ----------
  const PICK = [
    { key: 'hair', label: 'Peinado', list: () => R.STYLES, text: true },
    { key: 'hairColor', label: 'Pelo', list: () => R.HAIR },
    { key: 'skin', label: 'Piel', list: () => R.SKIN },
    { key: 'shirt', label: 'Ropa', list: () => R.SHIRT },
  ];
  function buildSetup() {
    $('#in-crush').value = S.data.crush;
    $('#in-me').value = S.data.me;
    $$('.picker').forEach((pk) => {
      const who = pk.dataset.who;
      const rows = pk.querySelector('.rows');
      rows.innerHTML = '';
      PICK.forEach((p) => {
        const row = document.createElement('div');
        row.className = 'pick-row';
        row.innerHTML = `<button aria-label="anterior">‹</button><span></span><button aria-label="siguiente">›</button>`;
        const span = row.querySelector('span');
        const paint = () => {
          const list = p.list();
          const v = S.data.looks[who][p.key] % list.length;
          span.innerHTML = p.text ? list[v] : `${p.label} <i class="swatch" style="background:${list[v]}"></i>`;
          R.drawPreview(pk.querySelector('canvas'), S.data.looks[who], who === 'me' ? 1 : -1);
        };
        const [prev, next] = row.querySelectorAll('button');
        const step = (d) => {
          const n = p.list().length;
          S.data.looks[who][p.key] = (S.data.looks[who][p.key] + d + n) % n;
          A.click();
          paint();
        };
        prev.onclick = () => step(-1);
        next.onclick = () => step(1);
        rows.appendChild(row);
        paint();
      });
    });
    updateCrushLabel();
  }
  function updateCrushLabel() {
    const n = $('#in-crush').value.trim();
    $('#crush-label').textContent = n || 'Tu amor';
  }
  $('#in-crush').addEventListener('input', updateCrushLabel);
  $('#setup-done').onclick = () => {
    S.data.crush = $('#in-crush').value.trim().slice(0, 16);
    S.data.me = $('#in-me').value.trim().slice(0, 16);
    S.data.setupDone = true;
    S.save();
    refreshMenu();
    if (afterSetup === 'chapters') openChapters();
    else show('menu');
  };
  function openSetup(next) {
    afterSetup = next || 'menu';
    buildSetup();
    show('setup');
  }

  // ---------- capítulos ----------
  function openChapters() {
    const grid = $('#chapter-grid');
    grid.innerHTML = '';
    LP.LEVELS.forEach((L, i) => {
      const unlocked = i < S.data.unlocked;
      const st = S.data.stars[L.id] || 0;
      const fr = (S.data.fragments[L.id] || []).length;
      const b = document.createElement('button');
      b.className = 'chapter' + (unlocked ? '' : ' locked');
      b.dataset.scene = L.scene;
      b.innerHTML = `<div><div class="num">Capítulo ${i + 1}</div><div class="name">${L.title}</div></div>
        <div><div class="st">${'<b>★</b>'.repeat(st)}${'★'.repeat(3 - st)}</div><div class="words">✍ ${fr}/4 frases</div></div>`;
      if (unlocked) b.onclick = () => openIntro(i);
      else b.onclick = () => toast('Termina el capítulo anterior para desbloquearlo');
      grid.appendChild(b);
    });
    $('#stars-total').textContent = `★ ${S.totalStars()}/21`;
    show('chapters');
  }

  function openIntro(i) {
    levelIndex = i;
    const L = LP.LEVELS[i];
    $('#intro-num').textContent = `Capítulo ${i + 1}`;
    $('#intro-title').textContent = L.title;
    $('#intro-story').textContent = LP.fmt(L.story);
    $('#intro-hint').textContent = L.hint;
    $('#intro-goals').innerHTML = `<div>★ Llegar antes de ${L.time} s</div><div>★ ${L.goals.perfect} respiraciones perfectas</div><div>★ ${L.goals.eye} s de contacto visual</div>`;
    show('intro');
  }

  // ---------- partida ----------
  function startLevel(i) {
    ensureAudio();
    endless = false;
    levelIndex = i;
    const L = LP.LEVELS[i];
    game = new LP.Game(L, { tips: !S.data.stars[L.id] });
    beginGame(L.music);
  }
  function startEndless() {
    ensureAudio();
    endless = true;
    game = new LP.Game(LP.LEVELS[0], { endless: true });
    beginGame(LP.ENDLESS.music);
  }
  function beginGame(music) {
    FX.clear();
    paused = false;
    resultShown = false;
    LP.Input.clear();
    LP.Input.enabled = true;
    show(null);
    A.startMusic(music);
  }
  function retry() {
    if (endless) startEndless();
    else startLevel(levelIndex);
  }
  function pause() {
    if (!game || paused || resultShown) return;
    paused = true;
    LP.Input.enabled = false;
    LP.Input.clear();
    A.stopMusic();
    show('pause');
  }
  function resume() {
    if (!game) return;
    paused = false;
    LP.Input.clear();
    LP.Input.enabled = true;
    show(null);
    A.startMusic(endless ? LP.ENDLESS.music : LP.LEVELS[levelIndex].music);
  }

  function processEvents() {
    if (!game.events.length) return;
    const L = R.layout();
    const s = L.s;
    const px = L.startX + (L.endX - L.startX) * game.progress;
    const headY = L.gy - 150 * s;
    for (const e of game.events) {
      switch (e.type) {
        case 'beat':
          if (game.state === 'play' || game.state === 'ready') A.heartbeat(e.intensity);
          if (e.intensity > 0.8 && game.state === 'play') vibrate(18);
          break;
        case 'perfect':
          A.perfect(e.combo);
          FX.ring(L.heartX, L.heartY, L.heartR * 1.1, '#ffd166');
          FX.sparks(L.heartX, L.heartY, 10, '#ffe27a');
          FX.text(L.heartX, L.heartY - L.heartR - 46 * L.hs, e.combo > 1 ? `¡Perfecto! x${e.combo}` : '¡Perfecto!', { color: '#ff4f84', size: 24 * L.hs });
          vibrate(12);
          if (e.combo >= 10) award('combo10');
          break;
        case 'good':
          A.good();
          FX.text(L.heartX, L.heartY - L.heartR - 46 * L.hs, 'Bien', { color: '#b072d8', size: 20 * L.hs });
          break;
        case 'miss':
          A.miss();
          FX.text(L.heartX, L.heartY - L.heartR - 46 * L.hs, 'Uy… a destiempo', { color: '#8a7090', size: 17 * L.hs });
          break;
        case 'gazeWarn':
          A.gazeWarn();
          break;
        case 'eyeStart':
          A.eye();
          FX.text((px + L.crushX) / 2, headY - 70 * s, '¡Contacto visual!', { color: '#ff4f84', size: 24 * L.hs });
          FX.hearts(L.crushX, headY - 30 * s, 5, 40);
          break;
        case 'teacherWarn':
          break;
        case 'teacherCaught':
          A.alarm();
          FX.text(W2(), headY - 90 * s, '¡El profe te ha visto!', { color: '#e0335f', size: 22 * L.hs });
          vibrate(60);
          break;
        case 'bump':
          A.bump();
          if (e.hard) FX.text(px, headY - 60 * s, '¡Ay!', { color: '#e0335f', size: 22 * L.hs });
          vibrate(e.hard ? 70 : 25);
          break;
        case 'gust':
          A.whoosh();
          break;
        case 'word':
          A.word();
          FX.text(px, headY - 80 * s, `✍ «${e.text}»`, { color: '#b0467a', size: 26 * L.hs, dur: 2.2, vy: -22 });
          FX.hearts(px, headY - 40 * s, 4, 30, '#ffb3c7');
          break;
        case 'round':
          A.round();
          FX.text(L.W / 2, L.gy - 250 * s, `¡+1 corazón! Ronda ${e.round}`, { color: '#ff4f84', size: 28 * L.hs, dur: 1.8 });
          FX.hearts(L.crushX, headY, 14, 80);
          vibrate([20, 40, 20]);
          if (e.round >= 5) award('b5');
          if (e.round >= 10) award('b10');
          break;
        case 'win':
          A.win();
          FX.hearts((L.endX + L.crushX) / 2, headY - 20 * s, 26, 120);
          FX.sparks((L.endX + L.crushX) / 2, headY - 40 * s, 24, '#fff3a0');
          vibrate([30, 60, 30, 60, 80]);
          break;
        case 'fail':
          A.stopMusic();
          A.fail();
          vibrate(220);
          if (e.reason === 'blush') {
            FX.puff(px, headY - 30 * s, 10);
            FX.text(px, headY - 80 * s, '¡Rojísimo!', { color: '#e0335f', size: 28 * L.hs, dur: 1.6 });
          } else {
            FX.text(L.W / 2, L.gy - 250 * s, 'Se acabó el tiempo…', { color: '#8a5a9a', size: 26 * L.hs, dur: 1.6 });
          }
          break;
      }
    }
    game.events.length = 0;
  }
  const W2 = () => window.innerWidth * 0.3;

  // ---------- resultado ----------
  const WIN_TITLES = ['¡Lo conseguiste!', '¡Qué momento tan bonito!', '♥ Perfecto ♥', '¡Tu corazón aguantó!'];
  function showResult() {
    resultShown = true;
    LP.Input.enabled = false;
    LP.Input.clear();
    const g = game;
    const d = S.data;
    const next = $('#res-next'),
      retryB = $('#res-retry'),
      back = $('#res-back');
    retryB.style.display = '';
    $('#res-words').innerHTML = '';

    if (g.state === 'fail') {
      d.fails++;
      if (g.failReason === 'blush' && d.fails >= 10) award('tomato');
    }

    if (endless) {
      const rounds = g.round - 1;
      const isBest = g.score > d.endlessBest;
      d.endlessBest = Math.max(d.endlessBest, g.score);
      d.endlessRound = Math.max(d.endlessRound, rounds);
      S.save();
      $('#res-title').textContent = isBest && g.score > 0 ? '¡Nuevo récord! 🦋' : 'Fin del sueño';
      $('#res-sub').textContent =
        g.failReason === 'blush' ? 'Tanta mariposa en el estómago… ¡te pusiste rojísimo!' : 'El momento se escapó… pero las mariposas siguen ahí.';
      $('#res-stars').innerHTML = '';
      $('#res-stats').innerHTML = `<div>Corazones<b>♥ ${rounds}</b></div><div>Puntos<b>${g.score}</b></div><div>Récord<b>${d.endlessBest}</b></div><div>Mejor combo<b>x${g.maxCombo}</b></div>`;
      next.textContent = 'Otra vez';
      next.onclick = retry;
      retryB.style.display = 'none';
      back.textContent = 'Menú';
      back.onclick = goMenu;
      show('result');
      return;
    }

    const L = LP.LEVELS[levelIndex];
    if (g.state === 'win') {
      const prevStars = d.stars[L.id] || 0;
      d.stars[L.id] = Math.max(prevStars, g.stars);
      const prevBest = d.best[L.id] || 0;
      d.best[L.id] = Math.max(prevBest, g.score);
      d.unlocked = Math.max(d.unlocked, Math.min(LP.LEVELS.length, levelIndex + 2));
      d.wins++;
      S.save();
      award('first');
      if (g.maxBpm <= 140) award('calm');
      if (g.maxBpm >= 170) award('edge');
      if (L.id === 'confesion') award('end');
      if (S.totalStars() >= 21) award('stars');
      $('#res-title').textContent = WIN_TITLES[Math.floor(Math.random() * WIN_TITLES.length)];
      $('#res-sub').textContent = L.memory;
      let stars = '';
      for (let i = 0; i < 3; i++) stars += `<span class="star ${i < g.stars ? 'on' : ''}" style="animation-delay:${0.15 + i * 0.22}s">★</span>`;
      $('#res-stars').innerHTML = stars;
      const newBest = g.score > prevBest && prevBest > 0 ? ' 🎉' : '';
      $('#res-stats').innerHTML = `<div>Puntos${newBest}<b>${g.score}</b></div><div>Respiraciones perfectas<b>${g.perfects}/${L.goals.perfect}</b></div><div>Contacto visual<b>${g.eyeTime.toFixed(1)}/${L.goals.eye} s</b></div><div>Mejor combo<b>x${g.maxCombo}</b></div>`;
      const last = levelIndex === LP.LEVELS.length - 1;
      next.textContent = last ? 'Leer tu carta 💌' : 'Siguiente capítulo';
      next.onclick = () => {
        A.click();
        if (last) openLetter('result');
        else openIntro(levelIndex + 1);
      };
      back.textContent = 'Capítulos';
      back.onclick = () => {
        goMenu();
        openChapters();
      };
    } else {
      S.save();
      if (g.failReason === 'blush') {
        $('#res-title').textContent = '¡Te pusiste rojísimo!';
        $('#res-sub').textContent = 'Tu corazón no pudo más… Suelta antes de llegar al límite y respira al ritmo.';
      } else {
        $('#res-title').textContent = 'El momento pasó…';
        $('#res-sub').textContent = LP.fmt('{n} se fue. Pero mañana habrá otra oportunidad. Atrévete un poco más.');
      }
      $('#res-stars').innerHTML = '<span class="star">★</span><span class="star">★</span><span class="star">★</span>';
      $('#res-stats').innerHTML = `<div>Distancia<b>${Math.round(g.progress * 100)}%</b></div><div>Latido máximo<b>${Math.round(g.maxBpm)}</b></div>`;
      next.textContent = 'Reintentar';
      next.onclick = retry;
      retryB.style.display = 'none';
      back.textContent = 'Capítulos';
      back.onclick = () => {
        goMenu();
        openChapters();
      };
    }
    if (g.newWords.length) {
      $('#res-words').innerHTML = '<div style="width:100%;font-size:14px;color:var(--ink-soft)">Nuevas palabras para tu carta</div>' + g.newWords.map((w) => `<span class="word">${escapeHtml(w)}</span>`).join('');
    }
    if (S.fragmentCount() >= 28) award('poet');
    if (g.eyeTime >= 6) award('brave');
    retryB.onclick = retry;
    show('result');
  }

  // ---------- carta ----------
  let letterFrom = 'diary';
  function letterText() {
    const d = S.data;
    const lines = [];
    LP.LEVELS.forEach((L) => {
      const got = L.fragments.filter((f, i) => S.hasFragment(L.id, i)).map((f) => f.t);
      if (got.length) lines.push(got.join(' '));
    });
    return { to: d.crush || 'ti', from: d.me || 'yo', lines };
  }
  function openLetter(from) {
    letterFrom = from || 'diary';
    const d = S.data;
    let html = `<p class="line" style="animation-delay:.1s">Para ${escapeHtml(d.crush || 'ti')}:</p><br>`;
    let delay = 0.4;
    LP.LEVELS.forEach((L) => {
      let para = '';
      L.fragments.forEach((f, i) => {
        para += S.hasFragment(L.id, i) ? escapeHtml(f.t) + ' ' : '<span class="missing">· · · · · </span>';
      });
      html += `<p class="line" style="animation-delay:${delay}s">${para}</p>`;
      delay += 0.35;
    });
    const n = S.fragmentCount();
    html += `<p class="sign line" style="animation-delay:${delay}s">Con todo mi corazón,<br>${escapeHtml(d.me || 'yo')}</p>`;
    if (n < 28) html += `<p class="line missing" style="animation-delay:${delay + 0.3}s;font-size:.8em;text-align:center;margin-top:12px">(${n}/28 frases · consigue respiraciones perfectas para recordar el resto)</p>`;
    $('#letter-body').innerHTML = html;
    show('letter');
  }
  $('#letter-back').onclick = () => {
    if (letterFrom === 'result') {
      goMenu();
      openChapters();
    } else openDiary();
  };
  $('#letter-copy').onclick = () => {
    const t = letterText();
    const txt = `Para ${t.to}:\n\n${t.lines.join('\n\n')}\n\nCon todo mi corazón,\n${t.from}`;
    const done = () => toast('Carta copiada ♥');
    try {
      navigator.clipboard.writeText(txt).then(done, () => toast('No se pudo copiar'));
    } catch (e) {
      toast('No se pudo copiar');
    }
  };

  // ---------- diario ----------
  function openDiary() {
    const box = $('#polaroids');
    box.innerHTML = '';
    LP.LEVELS.forEach((L, i) => {
      const done = !!S.data.stars[L.id];
      const el = document.createElement('div');
      el.className = 'polaroid' + (done ? '' : ' locked');
      el.style.setProperty('--r', `${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg`);
      const cv = document.createElement('canvas');
      cv.width = 320;
      cv.height = 240;
      el.appendChild(cv);
      const cap = document.createElement('div');
      cap.className = 'cap';
      cap.textContent = done ? L.memory : `${i + 1}. ${L.title} · ???`;
      el.appendChild(cap);
      box.appendChild(el);
      R.snapshot(cv, L, S.data.looks, 2 + i);
    });
    const n = S.fragmentCount();
    $('#diary-letter').textContent = `Leer la carta (${n}/28) 💌`;
    const ach = $('#achievements');
    ach.innerHTML = ACH.map((a) => {
      const got = !!S.data.achievements[a.id];
      return `<div class="ach ${got ? '' : 'locked'}"><span class="ico">${a.ico}</span><div><b>${a.name}</b>${a.desc}</div></div>`;
    }).join('');
    show('diary');
  }
  $('#diary-letter').onclick = () => openLetter('diary');
  $('#btn-reset').onclick = () => {
    if (confirm('¿Seguro que quieres borrar todo tu progreso? No se puede deshacer.')) {
      S.reset();
      toast('Progreso borrado');
      goMenu();
    }
  };

  // ---------- acciones ----------
  document.addEventListener('click', (e) => {
    ensureAudio();
    const b = e.target.closest('[data-action]');
    if (!b) {
      if (e.target.closest('button')) A.click();
      return;
    }
    A.click();
    switch (b.dataset.action) {
      case 'story':
        if (!S.data.setupDone) openSetup('chapters');
        else openChapters();
        break;
      case 'endless':
        startEndless();
        break;
      case 'diary':
        openDiary();
        break;
      case 'setup':
        openSetup('menu');
        break;
      case 'menu':
        goMenu();
        break;
      case 'chapters':
        openChapters();
        break;
      case 'resume':
        resume();
        break;
      case 'retry':
        retry();
        break;
      case 'quit':
        if (endless) goMenu();
        else {
          goMenu();
          openChapters();
        }
        break;
    }
  });
  $('#intro-start').onclick = () => startLevel(levelIndex);
  $('#btn-pause').onclick = (e) => {
    e.stopPropagation();
    pause();
  };
  $('#btn-pause').addEventListener('pointerdown', (e) => e.stopPropagation());
  $('#btn-sound').onclick = () => {
    S.data.sound = !S.data.sound;
    S.save();
    A.setEnabled(S.data.sound);
    refreshMenu();
  };
  $('#btn-vibe').onclick = () => {
    S.data.vibrate = !S.data.vibrate;
    S.save();
    refreshMenu();
    if (S.data.vibrate) vibrate(30);
  };
  window.addEventListener('keydown', (e) => {
    if (e.target && e.target.tagName === 'INPUT') return;
    if ((e.code === 'Escape' || e.code === 'KeyP') && game && !resultShown) {
      paused ? resume() : pause();
      return;
    }
    if ((e.code === 'Enter' || e.code === 'Space') && !e.repeat) {
      if (current === 'intro') {
        e.preventDefault();
        startLevel(levelIndex);
      } else if (current === 'result') {
        e.preventDefault();
        $('#res-next').click();
      }
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
  });

  // ---------- bucle ----------
  R.init($('#game'));
  LP.Input.init($('#game'));
  LP.Input.onAnyPress = ensureAudio;
  let last = performance.now();
  let T = 0;
  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    T += dt;
    if (game) {
      if (!paused) {
        game.update(dt, LP.Input.held);
        processEvents();
        if (game.done && !resultShown) showResult();
      }
      FX.update(paused ? 0 : dt);
      R.drawGame(game, T, paused ? 0 : dt, S.data.looks);
    } else {
      FX.update(dt);
      R.drawMenu(T, dt, S.data.looks);
    }
    requestAnimationFrame(frame);
  }
  refreshMenu();
  show('menu');
  requestAnimationFrame(frame);

  // ganchos para pruebas automáticas
  LP._debug = {
    get game() {
      return game;
    },
    startLevel,
    startEndless,
    openDiary,
    openLetter,
    openChapters,
  };
})();
