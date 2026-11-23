/* Todo el dibujo: escenarios procedurales, personajes, partículas y HUD. */
(function () {
  const LP = (window.LP = window.LP || {});
  const R = (LP.Render = {});
  let cv, ctx;
  let W = 0,
    H = 0,
    DPR = 1;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const hash = (i) => {
    const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  R.SKIN = ['#ffe3d1', '#f7c9a6', '#e3a77f', '#b97a55', '#7d5137'];
  R.HAIR = ['#3a2723', '#6e4430', '#c8874c', '#f0cf78', '#ef6f97', '#7d6ad8', '#1f1d2b', '#a99cb6'];
  R.SHIRT = ['#ff8fab', '#8ecae6', '#a8dba0', '#ffd166', '#c3a6ff', '#ff9f6e', '#f4f1f6', '#6c7bd8'];
  R.STYLES = ['Corto', 'Largo', 'Rizado', 'Moño', 'Coletas'];

  R.init = function (canvas) {
    cv = canvas;
    ctx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
    if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
  };
  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    cv.style.width = W + 'px';
    cv.style.height = H + 'px';
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden';
    document.body.appendChild(probe);
    safeTop = probe.offsetHeight || 0;
    probe.remove();
  }
  let safeTop = 0;

  R.layout = function () {
    const portrait = H > W;
    const s = clamp(portrait ? Math.min(W / 500, H / 700) : Math.min(W / 640, H / 600), 0.5, 1.55);
    const gy = H * (portrait ? 0.64 : 0.72);
    const crushX = W * (portrait ? 0.76 : 0.74);
    const startX = W * (portrait ? 0.18 : 0.2);
    const endX = crushX - 74 * s;
    const hs = clamp(Math.min(W, H) / 520, 0.78, 1.25);
    const heartR = 32 * hs;
    const heartX = W / 2;
    const heartY = H - heartR - 40 * hs;
    return { W, H, s, gy, crushX, startX, endX, hs, heartR, heartX, heartY, portrait };
  };

  // ---------- utilidades de dibujo ----------
  function vgrad(y0, y1, stops) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
    return g;
  }
  function rrect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }
  function heartPath(c, x, y, size) {
    const s = size / 2;
    c.beginPath();
    c.moveTo(x, y + s * 0.95);
    c.bezierCurveTo(x - s * 1.9, y - s * 0.2, x - s * 0.9, y - s * 1.55, x, y - s * 0.55);
    c.bezierCurveTo(x + s * 0.9, y - s * 1.55, x + s * 1.9, y - s * 0.2, x, y + s * 0.95);
    c.closePath();
  }
  R.heartPath = heartPath;
  function glow(x, y, r, color, alpha) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  function cloud(x, y, s, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
    ctx.arc(x + 24 * s, y - 10 * s, 26 * s, 0, Math.PI * 2);
    ctx.arc(x + 52 * s, y, 20 * s, 0, Math.PI * 2);
    ctx.rect(x, y, 52 * s, 20 * s);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  function butterfly(x, y, s, t, color) {
    const flap = Math.abs(Math.sin(t * 10)) * 0.8 + 0.2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(Math.sin(t * 2) * 0.2);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.scale(side * flap, 1);
      ctx.beginPath();
      ctx.ellipse(7 * s, -5 * s, 8 * s, 6 * s, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(5 * s, 5 * s, 5 * s, 4 * s, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#5a3a5f';
    ctx.fillRect(-1 * s, -6 * s, 2 * s, 12 * s);
    ctx.restore();
  }

  // ---------- escenarios ----------
  function bgDream(t, L) {
    ctx.fillStyle = vgrad(0, H, ['#ffc9dd', '#f1c6ff', '#c9d6ff']);
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) {
      const x = (hash(i) * W + Math.sin(t * 0.2 + i) * 40 + W) % W;
      const y = (hash(i + 50) * H - t * (8 + hash(i + 9) * 14) + H * 10) % H;
      glow(x, y, (20 + hash(i + 3) * 50) * L.s, 'rgba(255,255,255,0.55)', 0.6);
    }
    ctx.fillStyle = vgrad(L.gy, H, ['#f7b6d2', '#e9a3d0']);
    ctx.beginPath();
    ctx.moveTo(0, L.gy + 10);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, L.gy + Math.sin(x * 0.01 + 1) * 8 * L.s);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();
    const cols = ['#ff7fa8', '#b28dff', '#ffb36b', '#7cc8ff'];
    for (let i = 0; i < 5; i++) {
      const bx = W * (0.15 + 0.7 * hash(i + 20)) + Math.sin(t * (0.4 + hash(i) * 0.3) + i) * W * 0.12;
      const by = H * (0.15 + 0.35 * hash(i + 30)) + Math.cos(t * (0.6 + hash(i + 2) * 0.3) + i * 2) * H * 0.06;
      butterfly(bx, by, L.s * 1.1, t + i, cols[i % cols.length]);
    }
  }

  function bgAula(t, L, variant) {
    const s = L.s;
    ctx.fillStyle = vgrad(0, L.gy, ['#ffeede', '#ffd9cc']);
    ctx.fillRect(0, 0, W, L.gy);
    // ventana
    const wx = W * 0.56,
      wy = H * 0.08,
      ww = Math.min(W * 0.36, 420 * s),
      wh = (L.gy - wy) * 0.58;
    ctx.fillStyle = vgrad(wy, wy + wh, ['#9fd3ff', '#ffe0ef']);
    ctx.fillRect(wx, wy, ww, wh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(wx, wy, ww, wh);
    ctx.clip();
    for (let i = 0; i < 4; i++) {
      const cx = ((hash(i) * ww + t * (6 + i * 3)) % (ww + 120 * s)) + wx - 60 * s;
      cloud(cx, wy + wh * (0.2 + 0.18 * i), s * 0.8, 0.85);
    }
    ctx.fillStyle = '#b6e3a8';
    ctx.beginPath();
    ctx.ellipse(wx + ww * 0.3, wy + wh, ww * 0.5, wh * 0.18, 0, Math.PI, 0);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 7 * s;
    ctx.strokeRect(wx, wy, ww, wh);
    ctx.beginPath();
    ctx.moveTo(wx + ww / 2, wy);
    ctx.lineTo(wx + ww / 2, wy + wh);
    ctx.moveTo(wx, wy + wh / 2);
    ctx.lineTo(wx + ww, wy + wh / 2);
    ctx.stroke();
    // rayos de sol
    ctx.globalAlpha = 0.16 + Math.sin(t * 0.5) * 0.04;
    ctx.fillStyle = '#fff6d6';
    ctx.beginPath();
    ctx.moveTo(wx, wy + wh);
    ctx.lineTo(wx + ww, wy + wh);
    ctx.lineTo(wx + ww * 0.55, H);
    ctx.lineTo(wx - ww * 0.6, H);
    ctx.fill();
    ctx.globalAlpha = 1;
    // pizarra
    const bx = W * 0.05,
      by = H * 0.1,
      bw = Math.min(W * 0.42, 460 * s),
      bh = (L.gy - by) * 0.48;
    ctx.fillStyle = '#c99567';
    rrect(bx - 8 * s, by - 8 * s, bw + 16 * s, bh + 16 * s, 8 * s);
    ctx.fill();
    ctx.fillStyle = '#3e6b5a';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 2.5 * s;
    ctx.font = `600 ${Math.round(20 * s)}px Fredoka, sans-serif`;
    ctx.textAlign = 'left';
    if (variant === 'nota') {
      ctx.fillText('x² + ♥ = ?', bx + 18 * s, by + 36 * s);
      ctx.fillText('Examen: viernes', bx + 18 * s, by + 66 * s);
    } else {
      ctx.fillText('Bienvenidos :)', bx + 18 * s, by + 36 * s);
    }
    heartPath(ctx, bx + bw - 44 * s, by + bh - 34 * s, 34 * s);
    ctx.stroke();
    // zócalo y suelo
    ctx.fillStyle = '#f5c2b2';
    ctx.fillRect(0, L.gy - 34 * s, W, 34 * s);
    ctx.fillStyle = vgrad(L.gy, H, ['#e8b08a', '#cf916d']);
    ctx.fillRect(0, L.gy, W, H - L.gy);
    ctx.strokeStyle = 'rgba(120,60,40,.12)';
    ctx.lineWidth = 2;
    for (let y = L.gy + 16 * s; y < H; y += 26 * s) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    // pupitre de su amor
    desk(L.crushX + 46 * s, L.gy, s);
    desk(W * 0.42, L.gy - 26 * s, s * 0.8, 0.6);
  }
  function desk(x, gy, s, alpha) {
    ctx.globalAlpha = alpha || 1;
    ctx.fillStyle = '#b37a52';
    ctx.fillRect(x - 30 * s, gy - 52 * s, 5 * s, 52 * s);
    ctx.fillRect(x + 25 * s, gy - 52 * s, 5 * s, 52 * s);
    ctx.fillStyle = '#d9a273';
    rrect(x - 40 * s, gy - 60 * s, 80 * s, 12 * s, 4 * s);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function bgBus(t, L, shake) {
    const s = L.s;
    ctx.fillStyle = '#ffe0b5';
    ctx.fillRect(0, 0, W, H);
    const wy = H * 0.1,
      wh = (L.gy - wy) * 0.55;
    ctx.fillStyle = vgrad(wy, wy + wh, ['#ffc09e', '#ff9fc4', '#d9a6ff']);
    ctx.fillRect(0, wy, W, wh);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, wy, W, wh);
    ctx.clip();
    glow(W * 0.7, wy + wh * 0.75, wh * 0.7, 'rgba(255,240,200,.9)', 0.8);
    for (let layer = 0; layer < 2; layer++) {
      const speed = layer === 0 ? 40 : 110;
      const bw = (layer === 0 ? 70 : 90) * s;
      const off = (t * speed * s) % bw;
      const n = Math.ceil(W / bw) + 2;
      const base = Math.floor((t * speed * s) / bw);
      ctx.fillStyle = layer === 0 ? 'rgba(160,110,180,.55)' : 'rgba(110,70,140,.75)';
      for (let i = 0; i < n; i++) {
        const id = base + i + layer * 1000;
        const h = (0.25 + hash(id) * (layer === 0 ? 0.55 : 0.4)) * wh;
        const x = W - (i * bw - off) - bw;
        ctx.fillRect(x + 4 * s, wy + wh - h, bw - 8 * s, h);
        if (layer === 1) {
          ctx.fillStyle = 'rgba(255,230,160,.7)';
          for (let k = 0; k < 3; k++)
            if (hash(id * 3 + k) > 0.5) ctx.fillRect(x + 14 * s + k * 20 * s, wy + wh - h + 14 * s, 8 * s, 10 * s);
          ctx.fillStyle = 'rgba(110,70,140,.75)';
        }
      }
    }
    ctx.restore();
    // marcos de ventanas
    ctx.fillStyle = '#f6c98a';
    const fw = 230 * s;
    for (let x = 0; x < W + fw; x += fw) ctx.fillRect(x - 6 * s, wy, 12 * s, wh);
    ctx.fillStyle = '#e7a85e';
    ctx.fillRect(0, wy - 8 * s, W, 8 * s);
    ctx.fillRect(0, wy + wh, W, 10 * s);
    // asientos
    ctx.fillStyle = '#6f8fe0';
    for (let x = W * 0.08; x < W; x += 170 * s) {
      rrect(x, wy + wh + 10 * s, 110 * s, (L.gy - wy - wh) * 0.55, 14 * s);
      ctx.fill();
    }
    // barras y asas
    ctx.strokeStyle = '#ffcf3f';
    ctx.lineWidth = 7 * s;
    for (const px of [W * 0.33, W * 0.62]) {
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, L.gy);
      ctx.stroke();
    }
    ctx.lineWidth = 3 * s;
    ctx.strokeStyle = '#d9d2e0';
    for (let i = 0; i < 6; i++) {
      const hx = W * (0.1 + i * 0.16);
      const sw = Math.sin(t * 2 + i) * 4 * s + shake * 0.6;
      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx + sw, wy - 14 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(hx + sw, wy - 6 * s, 7 * s, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = vgrad(L.gy, H, ['#7c7698', '#5f5a7c']);
    ctx.fillRect(0, L.gy, W, H - L.gy);
    ctx.fillStyle = '#ffcf3f';
    ctx.fillRect(0, L.gy, W, 5 * s);
  }

  function bgLluvia(t, L, windActive) {
    const s = L.s;
    ctx.fillStyle = vgrad(0, L.gy, ['#3f3a74', '#7e66ad', '#e9a2c4']);
    ctx.fillRect(0, 0, W, L.gy);
    // edificios
    const bw = 80 * s;
    for (let i = 0; i * bw < W + bw; i++) {
      const h = (0.25 + hash(i + 7) * 0.4) * L.gy;
      const x = i * bw;
      ctx.fillStyle = '#3a3462';
      ctx.fillRect(x, L.gy - h, bw - 6 * s, h);
      for (let wy = L.gy - h + 14 * s; wy < L.gy - 20 * s; wy += 22 * s)
        for (let k = 0; k < 3; k++) {
          if (hash(i * 31 + wy * 0.37 + k) > 0.55) {
            ctx.fillStyle = 'rgba(255,214,140,.75)';
            ctx.fillRect(x + 10 * s + k * 21 * s, wy, 9 * s, 11 * s);
          }
        }
    }
    // farolas
    for (const fx of [W * 0.12, W * 0.5, W * 0.9]) {
      ctx.fillStyle = '#2c2850';
      ctx.fillRect(fx - 3 * s, L.gy - 170 * s, 6 * s, 170 * s);
      ctx.fillRect(fx - 3 * s, L.gy - 170 * s, 30 * s, 5 * s);
      glow(fx + 26 * s, L.gy - 160 * s, 90 * s, 'rgba(255,220,150,.75)', 0.9);
      ctx.fillStyle = '#ffe9b0';
      ctx.beginPath();
      ctx.arc(fx + 26 * s, L.gy - 162 * s, 6 * s, 0, Math.PI * 2);
      ctx.fill();
    }
    // suelo mojado
    ctx.fillStyle = vgrad(L.gy, H, ['#4a4378', '#2f2a55']);
    ctx.fillRect(0, L.gy, W, H - L.gy);
    for (const fx of [W * 0.12, W * 0.5, W * 0.9]) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#ffd99a';
      ctx.beginPath();
      ctx.ellipse(fx + 26 * s, L.gy + (H - L.gy) * 0.4, 18 * s, (H - L.gy) * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // lluvia
    const slant = windActive ? -0.55 : -0.18;
    ctx.strokeStyle = 'rgba(220,225,255,.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const n = Math.floor((W * H) / 9000);
    for (let i = 0; i < n; i++) {
      const sp = 600 + hash(i + 3) * 300;
      const y = (hash(i) * H + t * sp) % H;
      const x = (hash(i + 99) * (W + 200) + y * -slant) % (W + 200) - 100;
      ctx.moveTo(x, y);
      ctx.lineTo(x + slant * 16, y + 16);
    }
    ctx.stroke();
  }

  function bgBaile(t, L) {
    const s = L.s;
    ctx.fillStyle = vgrad(0, L.gy, ['#1d1440', '#3e2468', '#5b2d74']);
    ctx.fillRect(0, 0, W, L.gy);
    // conos de luz
    const cols = ['255,120,180', '140,170,255', '255,210,120', '170,255,220'];
    for (let i = 0; i < 4; i++) {
      const a = Math.sin(t * 0.7 + i * 1.6) * 0.5;
      const ox = W * (0.2 + i * 0.2);
      ctx.save();
      ctx.translate(ox, 0);
      ctx.rotate(a);
      const g = ctx.createLinearGradient(0, 0, 0, L.gy);
      g.addColorStop(0, `rgba(${cols[i]},.35)`);
      g.addColorStop(1, `rgba(${cols[i]},0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.lineTo(6, 0);
      ctx.lineTo(120 * s, L.gy * 1.1);
      ctx.lineTo(-120 * s, L.gy * 1.1);
      ctx.fill();
      ctx.restore();
    }
    // guirnaldas
    for (let row = 0; row < 2; row++) {
      const y0 = H * (0.08 + row * 0.1);
      const sag = 40 * s;
      for (let i = 0; i <= 18; i++) {
        const u = i / 18;
        const x = u * W;
        const y = y0 + Math.sin(u * Math.PI) * sag;
        const on = Math.sin(t * 3 + i * 1.3 + row) > -0.3;
        const c = ['#ff8fb3', '#ffd166', '#8ecae6', '#c3a6ff'][(i + row) % 4];
        if (on) glow(x, y, 16 * s, c, 0.55);
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x, y, 3.5 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // bola de discoteca
    const dx = W / 2,
      dy = H * 0.07,
      dr = 22 * s;
    ctx.fillStyle = '#d9d6ea';
    ctx.beginPath();
    ctx.arc(dx, dy, dr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,80,120,.4)';
    ctx.lineWidth = 1;
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.ellipse(dx, dy, Math.abs(Math.cos(t + k * 0.6)) * dr, dr, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const sx = (hash(i + Math.floor(t * 2)) * W) | 0;
      const sy = (hash(i + 40 + Math.floor(t * 2)) * L.gy) | 0;
      glow(sx, sy, 8 * s, 'rgba(255,255,255,.9)', 0.6);
    }
    // suelo brillante
    ctx.fillStyle = vgrad(L.gy, H, ['#4a2a68', '#2a1a44']);
    ctx.fillRect(0, L.gy, W, H - L.gy);
    ctx.strokeStyle = 'rgba(255,255,255,.07)';
    for (let x = -W; x < W * 2; x += 60 * s) {
      ctx.beginPath();
      ctx.moveTo(W / 2 + (x - W / 2) * 0.4, L.gy);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
  }

  function bgMano(t, L) {
    const s = L.s;
    ctx.fillStyle = vgrad(0, L.gy, ['#7c64c4', '#ff86a6', '#ffb879', '#ffd9a0']);
    ctx.fillRect(0, 0, W, L.gy);
    const sx = W * 0.58,
      sy = L.gy - 30 * s;
    glow(sx, sy, 260 * s, 'rgba(255,240,190,.8)', 0.9);
    ctx.fillStyle = '#fff3c9';
    ctx.beginPath();
    ctx.arc(sx, sy, 60 * s, 0, Math.PI * 2);
    ctx.fill();
    // colinas
    const hills = [
      ['#d97aa6', 0.78, 30],
      ['#a967a8', 0.88, 22],
    ];
    hills.forEach(([c, k, amp], j) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, L.gy);
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, L.gy * k + Math.sin(x * 0.006 + j * 2) * amp * s);
      ctx.lineTo(W, L.gy);
      ctx.fill();
    });
    // árbol
    const tx = W * 0.08;
    ctx.fillStyle = '#4e3266';
    ctx.fillRect(tx - 8 * s, L.gy - 170 * s, 16 * s, 170 * s);
    ctx.beginPath();
    ctx.arc(tx, L.gy - 190 * s, 70 * s, 0, Math.PI * 2);
    ctx.arc(tx + 60 * s, L.gy - 160 * s, 50 * s, 0, Math.PI * 2);
    ctx.arc(tx - 40 * s, L.gy - 150 * s, 45 * s, 0, Math.PI * 2);
    ctx.fill();
    // suelo
    ctx.fillStyle = vgrad(L.gy, H, ['#7d5aa0', '#4c3672']);
    ctx.fillRect(0, L.gy, W, H - L.gy);
    // banco
    const bx = (L.endX + L.crushX) / 2;
    ctx.fillStyle = '#5c3b6e';
    ctx.fillRect(bx - 110 * s, L.gy - 40 * s, 8 * s, 40 * s);
    ctx.fillRect(bx + 102 * s, L.gy - 40 * s, 8 * s, 40 * s);
    rrect(bx - 120 * s, L.gy - 48 * s, 240 * s, 10 * s, 4 * s);
    ctx.fill();
    rrect(bx - 120 * s, L.gy - 90 * s, 240 * s, 8 * s, 4 * s);
    ctx.fill();
    // luciérnagas
    for (let i = 0; i < 14; i++) {
      const fx = (hash(i) * W + Math.sin(t * 0.5 + i) * 50 * s + W) % W;
      const fy = L.gy * (0.45 + hash(i + 7) * 0.5) + Math.cos(t * 0.7 + i * 2) * 20 * s;
      const a = 0.4 + 0.6 * Math.max(0, Math.sin(t * 2 + i * 3));
      glow(fx, fy, 12 * s, 'rgba(255,250,170,.95)', a);
    }
  }

  function bgConfesion(t, L) {
    const s = L.s;
    ctx.fillStyle = vgrad(0, L.gy, ['#0b1033', '#1f2466', '#4b3a8e', '#9a62a8']);
    ctx.fillRect(0, 0, W, L.gy);
    for (let i = 0; i < 120; i++) {
      const x = hash(i) * W,
        y = hash(i + 300) * L.gy * 0.85;
      const a = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + hash(i + 5)) + i));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#fff';
      const r = (hash(i + 77) > 0.9 ? 2 : 1.1) * Math.max(1, s * 0.8);
      ctx.fillRect(x, y, r, r);
    }
    ctx.globalAlpha = 1;
    // luna
    const mx = W * 0.8,
      my = H * 0.16;
    glow(mx, my, 110 * s, 'rgba(255,240,210,.6)', 0.8);
    ctx.fillStyle = '#fff4d6';
    ctx.beginPath();
    ctx.arc(mx, my, 34 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(220,200,170,.35)';
    ctx.beginPath();
    ctx.arc(mx - 10 * s, my - 6 * s, 7 * s, 0, Math.PI * 2);
    ctx.arc(mx + 12 * s, my + 10 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    // estrella fugaz
    const ph = t % 6;
    if (ph < 0.9) {
      const k = ph / 0.9;
      const x0 = W * 0.15 + k * W * 0.4,
        y0 = H * 0.08 + k * H * 0.12;
      const g = ctx.createLinearGradient(x0, y0, x0 - 90 * s, y0 - 30 * s);
      g.addColorStop(0, 'rgba(255,255,255,' + (1 - k) + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 - 90 * s, y0 - 30 * s);
      ctx.stroke();
    }
    // ciudad lejana
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = hash(i + 9) > 0.5 ? 'rgba(255,214,150,.8)' : 'rgba(255,170,200,.7)';
      ctx.fillRect(hash(i + 400) * W, L.gy * 0.9 + hash(i + 500) * L.gy * 0.08, 2.2, 2.2);
    }
    // colina
    ctx.fillStyle = '#1c1a45';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, L.gy + 10 * s);
    ctx.quadraticCurveTo(W / 2, L.gy - 40 * s, W, L.gy + 10 * s);
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.strokeStyle = '#2d2a62';
    ctx.lineWidth = 2;
    for (let i = 0; i < 40; i++) {
      const gx = hash(i + 60) * W;
      const gy = L.gy + 6 * s - Math.sin((gx / W) * Math.PI) * 24 * s;
      ctx.beginPath();
      ctx.moveTo(gx, gy + 4);
      ctx.quadraticCurveTo(gx + 2, gy - 6 * s, gx + 5 * s + Math.sin(t + i) * 2, gy - 12 * s);
      ctx.stroke();
    }
  }

  function drawBackground(scene, variant, t, L, g) {
    switch (scene) {
      case 'aula':
        return bgAula(t, L, variant);
      case 'bus':
        return bgBus(t, L, g ? g.shake : 0);
      case 'lluvia':
        return bgLluvia(t, L, g && g.windActive);
      case 'baile':
        return bgBaile(t, L);
      case 'mano':
        return bgMano(t, L);
      case 'confesion':
        return bgConfesion(t, L);
      default:
        return bgDream(t, L);
    }
  }
  R.drawBackground = drawBackground;

  // ---------- personajes ----------
  function hairCap(c, r) {
    c.beginPath();
    c.moveTo(-r - 3, 4);
    c.arc(0, 0, r + 3, Math.PI, Math.PI * 2);
    c.lineTo(r + 3, 4);
    c.bezierCurveTo(r - 2, -12, 16, -4, 8, -17);
    c.bezierCurveTo(2, -8, -12, -10, -r + 2, -5);
    c.closePath();
  }

  /* p: face(1/-1), eyes('open'|'happy'|'closed'), blush, walk, shake, nervous, reach, sweat, back */
  function drawChar(c, x, gy, s, look, p) {
    p = p || {};
    const f = p.face || 1;
    const skin = R.SKIN[look.skin % R.SKIN.length];
    const hair = R.HAIR[look.hairColor % R.HAIR.length];
    const shirt = R.SHIRT[look.shirt % R.SHIRT.length];
    const style = look.hair % R.STYLES.length;
    const jitter = p.shake ? (Math.random() - 0.5) * p.shake : 0;
    c.save();
    c.translate(x + jitter * s, gy);
    c.scale(s, s);
    // sombra
    c.fillStyle = 'rgba(50,20,60,.16)';
    c.beginPath();
    c.ellipse(0, 2, 34, 7, 0, 0, Math.PI * 2);
    c.fill();
    const walk = p.walk || 0;
    const sw = Math.sin(walk) * 9 * (p.walking ? 1 : 0);
    const bob = p.walking ? -Math.abs(Math.sin(walk)) * 4 : 0;
    // piernas
    c.lineCap = 'round';
    c.strokeStyle = p.legs || '#4b4f80';
    c.lineWidth = 13;
    c.beginPath();
    c.moveTo(-9, -46 + bob);
    c.lineTo(-9 + sw, -7);
    c.moveTo(9, -46 + bob);
    c.lineTo(9 - sw, -7);
    c.stroke();
    c.fillStyle = '#3a2f4a';
    c.beginPath();
    c.ellipse(-9 + sw + f * 3, -4, 9, 5, 0, 0, Math.PI * 2);
    c.ellipse(9 - sw + f * 3, -4, 9, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.translate(0, bob);
    const hx = 0,
      hy = -150,
      r = 33;
    // pelo trasero
    if (!p.back && (style === 1 || style === 4)) {
      c.fillStyle = hair;
      if (style === 1) {
        rrectC(c, -r - 6, hy - 10, 2 * r + 12, 66, 22);
        c.fill();
      } else {
        for (const sd of [-1, 1]) {
          c.beginPath();
          c.ellipse(sd * (r + 6), hy + 14, 11, 22, sd * 0.25, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
    // cuerpo
    c.fillStyle = shirt;
    rrectC(c, -27, -120, 54, 78, 22);
    c.fill();
    c.fillStyle = 'rgba(0,0,0,.06)';
    rrectC(c, -27, -66, 54, 24, 12);
    c.fill();
    // brazos
    const reach = p.reach || 0;
    c.strokeStyle = shirt;
    c.lineWidth = 12;
    c.beginPath();
    c.moveTo(-f * 22, -108);
    c.lineTo(-f * 27, -70 + Math.sin(walk) * 3);
    c.moveTo(f * 22, -108);
    c.lineTo(f * (27 + reach * 24), -70 - reach * 18);
    c.stroke();
    c.fillStyle = skin;
    c.beginPath();
    c.arc(-f * 27, -66 + Math.sin(walk) * 3, 6.5, 0, Math.PI * 2);
    c.arc(f * (27 + reach * 26), -66 - reach * 19, 6.5, 0, Math.PI * 2);
    c.fill();
    // cuello y cabeza
    c.fillStyle = skin;
    c.fillRect(-7, -126, 14, 12);
    c.beginPath();
    c.arc(hx, hy, r, 0, Math.PI * 2);
    c.fill();

    if (p.back) {
      c.fillStyle = hair;
      c.beginPath();
      c.arc(hx, hy - 2, r + 3, 0, Math.PI * 2);
      c.fill();
    } else {
      // cara
      const ex = f * 8;
      const eyes = p.eyes || 'open';
      c.fillStyle = '#3a2433';
      c.strokeStyle = '#3a2433';
      c.lineWidth = 3;
      for (const k of [-1, 1]) {
        const x0 = ex + k * 11,
          y0 = hy + 3;
        if (eyes === 'happy') {
          c.beginPath();
          c.arc(x0, y0 + 2, 4.5, Math.PI * 1.1, Math.PI * 1.9);
          c.stroke();
        } else if (eyes === 'closed' || p.blink) {
          c.beginPath();
          c.moveTo(x0 - 4, y0);
          c.lineTo(x0 + 4, y0);
          c.stroke();
        } else {
          c.beginPath();
          c.ellipse(x0 + f * 1, y0, 4, 5.5, 0, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#fff';
          c.beginPath();
          c.arc(x0 + f * 2, y0 - 2, 1.6, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#3a2433';
        }
      }
      // rubor
      const blush = clamp(p.blush || 0, 0, 1);
      c.fillStyle = `rgba(255,80,120,${0.22 + blush * 0.6})`;
      c.beginPath();
      c.ellipse(ex - 17, hy + 13, 7 + blush * 2, 4 + blush, 0, 0, Math.PI * 2);
      c.ellipse(ex + 17, hy + 13, 7 + blush * 2, 4 + blush, 0, 0, Math.PI * 2);
      c.fill();
      if (blush > 0.85) {
        c.fillStyle = `rgba(255,60,90,${(blush - 0.85) * 2.5})`;
        c.beginPath();
        c.arc(hx, hy, r, 0, Math.PI * 2);
        c.fill();
      }
      // boca
      c.strokeStyle = '#7a3348';
      c.lineWidth = 2.5;
      c.beginPath();
      if ((p.nervous || 0) > 0.72 && eyes !== 'happy') {
        c.moveTo(ex - 6, hy + 18);
        c.quadraticCurveTo(ex - 3, hy + 15, ex, hy + 18);
        c.quadraticCurveTo(ex + 3, hy + 21, ex + 6, hy + 18);
      } else {
        const sm = p.smile == null ? 0.5 : p.smile;
        c.moveTo(ex - 5, hy + 16);
        c.quadraticCurveTo(ex, hy + 16 + 3 + sm * 4, ex + 5, hy + 16);
      }
      c.stroke();
      // pelo delantero
      c.save();
      c.translate(hx, hy);
      c.scale(f, 1);
      c.fillStyle = hair;
      if (style === 2) {
        for (let a = 0; a <= 12; a++) {
          const ang = Math.PI * (0.92 + a * 0.097);
          c.beginPath();
          c.arc(Math.cos(ang) * (r + 1), Math.sin(ang) * (r + 1) + 2, 11, 0, Math.PI * 2);
          c.fill();
        }
        c.beginPath();
        c.arc(4, -r + 6, 13, 0, Math.PI * 2);
        c.arc(-12, -r + 9, 11, 0, Math.PI * 2);
        c.fill();
      } else {
        hairCap(c, r);
        c.fill();
        if (style === 3) {
          c.beginPath();
          c.arc(-4, -r - 8, 13, 0, Math.PI * 2);
          c.fill();
        }
        if (style === 1) {
          rrectC(c, -r - 6, -6, 12, 46, 6);
          c.fill();
          rrectC(c, r - 6, -6, 12, 46, 6);
          c.fill();
        }
        if (style === 4) {
          c.fillStyle = '#ff6f9c';
          c.beginPath();
          c.arc(-r - 3, 0, 4, 0, Math.PI * 2);
          c.arc(r + 3, 0, 4, 0, Math.PI * 2);
          c.fill();
        }
      }
      c.restore();
      if (p.glasses) {
        c.strokeStyle = '#3a2433';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(ex - 11, hy + 3, 8, 0, Math.PI * 2);
        c.moveTo(ex + 19, hy + 3);
        c.arc(ex + 11, hy + 3, 8, 0, Math.PI * 2);
        c.moveTo(ex - 3, hy + 3);
        c.lineTo(ex + 3, hy + 3);
        c.stroke();
      }
      if (p.sweat) {
        c.fillStyle = 'rgba(140,200,255,.9)';
        const sx = -f * 30,
          sy = hy - 14 + ((performance.now() / 30) % 14);
        c.beginPath();
        c.moveTo(sx, sy - 8);
        c.quadraticCurveTo(sx + 6, sy, sx, sy + 4);
        c.quadraticCurveTo(sx - 6, sy, sx, sy - 8);
        c.fill();
      }
    }
    c.restore();
  }
  function rrectC(c, x, y, w, h, r) {
    c.beginPath();
    if (c.roundRect) c.roundRect(x, y, w, h, r);
    else c.rect(x, y, w, h);
  }
  R.drawChar = drawChar;

  function umbrella(x, y, s, open) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.strokeStyle = '#6b4a6b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 95);
    ctx.stroke();
    const w = 70 + open * 30;
    ctx.fillStyle = '#ff7fa8';
    ctx.beginPath();
    ctx.moveTo(-w, 10);
    ctx.quadraticCurveTo(0, -60, w, 10);
    for (let i = 4; i >= 0; i--) {
      const x0 = -w + (i + 1) * ((2 * w) / 5);
      ctx.quadraticCurveTo(x0 - w / 5, 0, x0 - (2 * w) / 5, 10);
    }
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.25)';
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, 6);
    ctx.quadraticCurveTo(0, -50, w * 0.2, 6);
    ctx.fill();
    ctx.restore();
  }

  function bubble(x, y, s, text, color, t) {
    const b = Math.sin(t * 12) * 3 * s;
    ctx.save();
    ctx.translate(x, y + b);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 17 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-5 * s, 14 * s);
    ctx.lineTo(0, 24 * s);
    ctx.lineTo(5 * s, 14 * s);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = `700 ${Math.round(22 * s)}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1 * s);
    ctx.restore();
  }

  // ---------- partículas ----------
  const FX = (LP.FX = { list: [] });
  FX.add = function (p) {
    p.life = 0;
    FX.list.push(p);
    if (FX.list.length > 260) FX.list.shift();
  };
  FX.hearts = function (x, y, n, spread, color) {
    for (let i = 0; i < n; i++) {
      FX.add({
        type: 'heart',
        x: x + (Math.random() - 0.5) * (spread || 30),
        y: y + (Math.random() - 0.5) * (spread || 30) * 0.4,
        vx: (Math.random() - 0.5) * 80,
        vy: -60 - Math.random() * 90,
        max: 1.2 + Math.random() * 0.8,
        size: 10 + Math.random() * 14,
        color: color || ['#ff6f9c', '#ff9fbf', '#ffb3c7', '#ff4f84'][i % 4],
      });
    }
  };
  FX.sparks = function (x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2,
        sp = 80 + Math.random() * 160;
      FX.add({ type: 'spark', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, max: 0.5 + Math.random() * 0.4, size: 3 + Math.random() * 4, color: color || '#fff3a0' });
    }
  };
  FX.ring = function (x, y, r, color) {
    FX.add({ type: 'ring', x, y, r, max: 0.5, color: color || '#ff6f9c' });
  };
  FX.text = function (x, y, text, o) {
    o = o || {};
    FX.add({ type: 'text', x, y, text, vy: o.vy == null ? -40 : o.vy, max: o.dur || 1.2, size: o.size || 22, color: o.color || '#ff4f84', stroke: o.stroke || '#fff' });
  };
  FX.puff = function (x, y, n) {
    for (let i = 0; i < n; i++)
      FX.add({ type: 'puff', x: x + (Math.random() - 0.5) * 30, y, vx: (Math.random() - 0.5) * 50, vy: -50 - Math.random() * 40, max: 0.9 + Math.random() * 0.4, size: 8 + Math.random() * 10 });
  };
  FX.update = function (dt) {
    for (let i = FX.list.length - 1; i >= 0; i--) {
      const p = FX.list[i];
      p.life += dt;
      if (p.life >= p.max) {
        FX.list.splice(i, 1);
        continue;
      }
      if (p.vx != null) p.x += p.vx * dt;
      if (p.vy != null) p.y += p.vy * dt;
      if (p.type === 'heart') {
        p.vx *= 0.98;
        p.vy += 20 * dt;
      }
      if (p.type === 'spark') {
        p.vx *= 0.92;
        p.vy *= 0.92;
      }
    }
  };
  FX.clear = () => (FX.list.length = 0);
  FX.draw = function () {
    for (const p of FX.list) {
      const k = p.life / p.max;
      const a = 1 - k;
      if (p.type === 'heart') {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        heartPath(ctx, p.x + Math.sin(p.life * 6) * 6, p.y, p.size);
        ctx.fill();
      } else if (p.type === 'spark') {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 6);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      } else if (p.type === 'ring') {
        ctx.globalAlpha = a;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 4 * a + 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (1 + k * 1.2), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'puff') {
        ctx.globalAlpha = a * 0.7;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + k), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'text') {
        const pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.5 : k < 0.25 ? 1.1 - ((k - 0.15) / 0.1) * 0.1 : 1;
        ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(pop, pop);
        ctx.font = `700 ${Math.round(p.size)}px Fredoka, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(4, p.size / 4);
        ctx.strokeStyle = p.stroke;
        ctx.strokeText(p.text, 0, 0);
        ctx.fillStyle = p.color;
        ctx.fillText(p.text, 0, 0);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  };

  // pétalos ambientales
  const petals = [];
  function ambient(dt, scene, L) {
    const want = scene === 'aula' || scene === 'dream' || scene === 'mano' ? 14 : 0;
    while (petals.length < want) petals.push({ x: Math.random() * W, y: -20 - Math.random() * H, r: Math.random() * 6, sp: 20 + Math.random() * 30 });
    if (petals.length > want) petals.length = want;
    ctx.fillStyle = scene === 'mano' ? 'rgba(255,220,180,.7)' : 'rgba(255,170,200,.75)';
    for (const p of petals) {
      p.y += p.sp * dt;
      p.x += Math.sin(p.y * 0.02 + p.r) * 20 * dt;
      p.r += dt * 2;
      if (p.y > H + 10) {
        p.y = -10;
        p.x = Math.random() * W;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.beginPath();
      ctx.ellipse(0, 0, 5 * L.s, 2.6 * L.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ---------- HUD ----------
  function drawHUD(g, L, t) {
    const hs = L.hs;
    const top = 16 + safeTop;
    // barra de progreso
    const bx = 18,
      bw = W - 18 - 72,
      by = top + 10,
      bh = 12 * hs;
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    rrect(bx, by, bw, bh, bh / 2);
    ctx.fill();
    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#ffb3c7');
    grad.addColorStop(1, '#ff5f92');
    ctx.fillStyle = grad;
    rrect(bx, by, Math.max(bh, bw * g.progress), bh, bh / 2);
    ctx.fill();
    if (g.cfg.zone) {
      const zx = bx + bw * g.cfg.zone.start;
      ctx.fillStyle = 'rgba(127,220,192,.55)';
      rrect(zx, by, bx + bw - zx, bh, bh / 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ff4f84';
    heartPath(ctx, bx + bw, by + bh / 2, 26 * hs);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#ff5f92';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(bx + bw * g.progress, by + bh / 2, 9 * hs, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // textos
    ctx.font = `600 ${Math.round(15 * hs)}px Fredoka, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    const dark = ['lluvia', 'baile', 'confesion', 'mano'].indexOf(g.sceneLevel.scene) !== -1;
    ctx.fillStyle = dark ? 'rgba(255,255,255,.92)' : 'rgba(74,42,79,.85)';
    const label = g.endless ? `Ronda ${g.round}` : g.baseLevel.title;
    ctx.fillText(label, bx, by + bh + 8);
    ctx.textAlign = 'right';
    const tl = Math.ceil(g.timeLeft);
    ctx.fillStyle = tl <= 8 && g.state === 'play' && Math.floor(t * 4) % 2 ? '#ff3b6b' : ctx.fillStyle;
    ctx.fillText(`⏱ ${tl}s   ★ ${Math.round(g.score)}`, bx + bw, by + bh + 8);

    // corazón medidor
    const hx = L.heartX,
      hy = L.heartY,
      hr = L.heartR;
    const nerv = g.nervous;
    const a0 = Math.PI * 0.75,
      a1 = Math.PI * 2.25;
    ctx.lineCap = 'round';
    ctx.lineWidth = 9 * hs;
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath();
    ctx.arc(hx, hy, hr + 18 * hs, a0, a1);
    ctx.stroke();
    if (g.cfg.zone) {
      const z0 = (g.cfg.zone.min - g.rest) / (g.max - g.rest),
        z1 = (g.cfg.zone.max - g.rest) / (g.max - g.rest);
      ctx.strokeStyle = 'rgba(127,220,192,.95)';
      ctx.beginPath();
      ctx.arc(hx, hy, hr + 18 * hs, lerp(a0, a1, z0), lerp(a0, a1, z1));
      ctx.stroke();
    }
    const col = nerv < 0.5 ? '#ff8fb3' : nerv < 0.78 ? '#ff5f92' : '#ff2d55';
    ctx.strokeStyle = col;
    ctx.lineWidth = 5 * hs;
    ctx.beginPath();
    ctx.arc(hx, hy, hr + 18 * hs, a0, lerp(a0, a1, Math.max(0.01, nerv)));
    ctx.stroke();
    // anillo de ritmo
    if (g.state === 'play' || g.state === 'ready') {
      const k = g.beatClock / g.beatInterval;
      const rr = hr * (1 + 1.25 * (1 - k));
      ctx.globalAlpha = 0.25 + 0.65 * k;
      ctx.strokeStyle = g.combo > 2 ? '#ffd166' : '#fff';
      ctx.lineWidth = 3 * hs;
      ctx.beginPath();
      ctx.arc(hx, hy + 2 * hs, rr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    const pulse = 1 + g.beatPulse * (0.12 + nerv * 0.12);
    glow(hx, hy, hr * 2.2, nerv > 0.78 ? 'rgba(255,40,80,.55)' : 'rgba(255,140,180,.45)', 0.6 + g.beatPulse * 0.4);
    ctx.fillStyle = col;
    heartPath(ctx, hx, hy + 2 * hs, hr * 2.05 * pulse);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.beginPath();
    ctx.ellipse(hx - hr * 0.42, hy - hr * 0.3, hr * 0.22, hr * 0.13, -0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(20 * hs)}px Fredoka, sans-serif`;
    ctx.fillText(Math.round(g.bpm), hx, hy - 1 * hs);
    ctx.font = `600 ${Math.round(9 * hs)}px Fredoka, sans-serif`;
    ctx.fillText('BPM', hx, hy + 14 * hs);
    if (g.combo > 1) {
      ctx.font = `700 ${Math.round(18 * hs)}px Fredoka, sans-serif`;
      ctx.textAlign = 'left';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#fff';
      ctx.lineJoin = 'round';
      const txt = `x${g.combo}`;
      ctx.strokeText(txt, hx + hr + 30 * hs, hy);
      ctx.fillStyle = '#ff4f84';
      ctx.fillText(txt, hx + hr + 30 * hs, hy);
    }
    if (g.eyeTime > 0 && !g.endless) {
      ctx.font = `600 ${Math.round(13 * hs)}px Fredoka, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillStyle = dark ? 'rgba(255,255,255,.85)' : 'rgba(74,42,79,.75)';
      ctx.fillText(`👀 ${g.eyeTime.toFixed(1)}s`, hx - hr - 30 * hs, hy - 9 * hs);
      ctx.fillText(`♥ ${g.perfects}`, hx - hr - 30 * hs, hy + 9 * hs);
    }
  }

  function tipText(text, y, L, alpha) {
    const hs = L.hs;
    ctx.font = `600 ${Math.round(16 * hs)}px Fredoka, sans-serif`;
    const w = Math.min(W - 32, ctx.measureText(text).width + 36);
    const lines = wrap(text, w - 30);
    const lh = 21 * hs;
    const h = lines.length * lh + 18;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(255,255,255,.92)';
    rrect(W / 2 - w / 2, y - h / 2, w, h, 16);
    ctx.fill();
    ctx.fillStyle = '#4a2a4f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    lines.forEach((ln, i) => ctx.fillText(ln, W / 2, y - h / 2 + 9 + lh / 2 + i * lh));
    ctx.globalAlpha = 1;
  }
  function wrap(text, maxW) {
    const words = text.split(' ');
    const out = [];
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) {
        out.push(cur);
        cur = w;
      } else cur = test;
    }
    if (cur) out.push(cur);
    return out;
  }

  // ---------- escena de juego ----------
  R.drawGame = function (g, t, dt, looks) {
    const L = R.layout();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.save();
    if (g.shake > 0) ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
    const lv = g.sceneLevel;
    drawBackground(lv.scene, lv.variant, t, L, g);
    ambient(dt, lv.scene, L);
    const s = L.s;

    // profe
    if (g.teacher) {
      const tx = W * (L.portrait ? 0.3 : 0.27),
        tgy = L.gy - 30 * s;
      const facing = g.teacher.looking || (g.teacher.warning && g.teacher.t > g.teacher.dur * 0.6);
      drawChar(ctx, tx, tgy, s, { hair: 3, hairColor: 7, shirt: 7, skin: 1 }, { face: -1, back: !facing, glasses: true, smile: 0.1, legs: '#5a4a5a' });
      if (g.teacher.warning) bubble(tx + 6 * s, tgy - 225 * s, s, '?', '#7d6ad8', t);
      if (g.teacher.looking) bubble(tx + 6 * s, tgy - 225 * s, s, '!', '#ff3b6b', t);
    }

    // posiciones
    let px = lerp(L.startX, L.endX, g.progress);
    let cx = L.crushX;
    const nerv = g.nervous;
    const win = g.state === 'win';
    const fail = g.state === 'fail';
    if (win) px = lerp(L.startX, L.endX, 1) + Math.min(1, g.endT * 1.5) * 18 * s;
    if (fail && g.failReason === 'time') cx += g.endT * 150 * s;
    const blinkC = Math.sin(t * 1.3) > 0.985;
    const blinkP = Math.sin(t * 1.1 + 2) > 0.988;
    const crushLooking = g.gaze.looking || (g.gaze.warning && g.gaze.t > g.gaze.dur * 0.7) || win || g.state === 'ready';

    if (lv.scene === 'lluvia') umbrella(cx - 10 * s, L.gy - 205 * s, s, win ? Math.min(1, g.endT) : 0);

    drawChar(ctx, cx, L.gy, s, looks.crush, {
      face: fail && g.failReason === 'time' ? 1 : crushLooking ? -1 : 1,
      eyes: win ? 'happy' : 'open',
      blink: blinkC,
      blush: g.eyeContact ? 0.75 : win ? 0.8 : 0.25,
      smile: g.eyeContact || win ? 1 : 0.4,
      reach: win ? Math.min(1, g.endT * 1.5) : g.cfg.zone && g.progress > g.cfg.zone.start ? 0.3 : 0,
      walk: fail ? g.endT * 8 : 0,
      walking: fail && g.failReason === 'time',
    });
    drawChar(ctx, px, L.gy, s, looks.me, {
      face: 1,
      eyes: win ? 'happy' : fail && g.failReason === 'blush' ? 'closed' : 'open',
      blink: blinkP,
      blush: fail && g.failReason === 'blush' ? 1 : nerv,
      nervous: nerv,
      shake: g.zoneBlocked ? 2.5 : nerv > 0.72 ? (nerv - 0.72) * 9 : 0,
      sweat: nerv > 0.68 && !win,
      walk: g.walkPhase,
      walking: (g.held && g.state === 'play') || (win && g.endT < 1),
      reach: win ? 1 : g.progress > 0.85 ? (g.progress - 0.85) / 0.15 : 0,
      smile: g.eyeContact ? 0.9 : 0.4,
    });

    // aviso de mirada
    if (g.gaze.warning && g.state === 'play') {
      const k = g.gaze.t / g.gaze.dur;
      glow(cx, L.gy - 150 * s, 60 * s, 'rgba(255,240,150,.8)', 0.3 + k * 0.5);
      bubble(cx, L.gy - 220 * s, s, '!', '#ff9f1c', t);
    }
    // contacto visual
    if (g.eyeContact) {
      const y = L.gy - 147 * s;
      ctx.fillStyle = '#ff6f9c';
      const n = 5;
      for (let i = 1; i < n; i++) {
        const u = (i / n + t * 0.6) % 1;
        const x = lerp(px + 30 * s, cx - 30 * s, u);
        ctx.globalAlpha = Math.sin(u * Math.PI);
        heartPath(ctx, x, y - Math.sin(u * Math.PI) * 18 * s, 14 * s);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // avisos de bache / viento
    if (g.bumpWarn) {
      bubble(W / 2, L.gy - 250 * s, s * 1.1, '⚠', '#ff9f1c', t);
    }
    if (g.windWarn || g.windActive) {
      ctx.strokeStyle = `rgba(255,255,255,${g.windActive ? 0.7 : 0.4})`;
      ctx.lineWidth = 3 * s;
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const y = L.gy - (40 + i * 32) * s;
        const x = W - ((t * (g.windActive ? 700 : 250) + i * 170) % (W + 200));
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 40 * s, y - 14 * s, x + 90 * s, y);
        ctx.stroke();
      }
    }
    ctx.restore();

    // viñeta de nervios / brillo de contacto
    if (nerv > 0.6 || g.eyeContact) {
      const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
      const red = nerv > 0.6 ? (nerv - 0.6) / 0.4 : 0;
      vg.addColorStop(0, 'rgba(255,0,60,0)');
      vg.addColorStop(1, g.eyeContact && red < 0.3 ? 'rgba(255,150,200,.35)' : `rgba(255,20,70,${0.5 * red * (0.8 + g.beatPulse * 0.4)})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }

    drawHUD(g, L, t);
    FX.draw();

    if (g.state === 'ready') {
      const a = 0.75 + Math.sin(t * 4) * 0.25;
      tipText(g.tip ? g.tip.text : 'Mantén pulsado para empezar', L.gy - 260 * s, L, a);
    } else if (g.tip && g.state === 'play') {
      const tt = g.tip;
      const a = tt.t < 0.25 ? tt.t / 0.25 : tt.t > tt.dur - 0.4 ? (tt.dur - tt.t) / 0.4 : 1;
      tipText(tt.text, Math.min(L.heartY - L.heartR - 70 * L.hs, L.gy + (H - L.gy) * 0.3), L, a);
    }
    return { L, px, cx };
  };

  // escena de menú
  R.drawMenu = function (t, dt, looks) {
    const L = Object.assign({}, R.layout());
    L.gy = H * (L.portrait ? 0.9 : 0.8);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bgDream(t, L);
    ambient(dt, 'dream', L);
    const s = L.s * (L.portrait ? 0.75 : 0.9);
    const meet = (Math.sin(t * 0.4) + 1) / 2;
    const gy = L.portrait ? H - 18 : H * 0.86;
    const a = W * 0.22 + meet * W * 0.06;
    const b = W * 0.78 - meet * W * 0.06;
    const lookA = Math.sin(t * 0.9) > 0.2;
    const lookB = Math.sin(t * 0.9 + 1.2) > 0.2;
    drawChar(ctx, a, gy, s, looks.me, { face: lookA ? 1 : -1, blush: 0.5 + meet * 0.4, smile: 0.7, blink: Math.sin(t * 1.3) > 0.985 });
    drawChar(ctx, b, gy, s, looks.crush, { face: lookB ? -1 : 1, blush: 0.4 + meet * 0.4, smile: 0.7, blink: Math.sin(t * 1.1 + 2) > 0.985 });
    if (lookA && lookB) {
      ctx.fillStyle = '#ff6f9c';
      heartPath(ctx, W / 2, gy - 190 * s - Math.sin(t * 3) * 6, 26 * s);
      ctx.fill();
    }
    FX.draw();
  };

  // foto para el diario
  R.snapshot = function (canvas, level, looks, t) {
    const saved = [ctx, W, H, DPR];
    ctx = canvas.getContext('2d');
    W = canvas.width;
    H = canvas.height;
    DPR = 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const L = R.layout();
    const s = L.s * 1.15;
    drawBackground(level.scene, level.variant, t || 3, L, null);
    const mid = W / 2;
    if (level.scene === 'lluvia') umbrella(mid + 18 * s, L.gy - 205 * s, s, 1);
    drawChar(ctx, mid - 22 * s, L.gy, s, looks.me, { face: 1, eyes: 'happy', blush: 0.8, reach: 1, smile: 1 });
    drawChar(ctx, mid + 22 * s, L.gy, s, looks.crush, { face: -1, eyes: 'happy', blush: 0.8, reach: 1, smile: 1 });
    ctx.fillStyle = '#ff5f92';
    heartPath(ctx, mid, L.gy - 215 * s, 26 * s);
    ctx.fill();
    [ctx, W, H, DPR] = saved;
  };

  R.drawPreview = function (canvas, look, face) {
    const c = canvas.getContext('2d');
    const w = canvas.width,
      h = canvas.height;
    c.clearRect(0, 0, w, h);
    drawChar(c, w / 2, h - 10, h / 225, look, { face: face || 1, blush: 0.4, smile: 0.8 });
  };
})();
