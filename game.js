/* ============================================
   NEON SNAKE — CYBERPUNK EDITION
   game.js — Full game engine
   ============================================ */

(function () {
  'use strict';

  // ── CANVAS SETUP ──────────────────────────────
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const GRID = 20; // cells per row/col
  let CELL; // pixel size per cell, computed
  let W, H; // canvas pixel dimensions

  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const size = wrapper.clientWidth;
    canvas.width = size;
    canvas.height = size;
    W = size;
    H = size;
    CELL = size / GRID;
  }
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    if (!running) drawIdle();
  });

  // ── PALETTE ───────────────────────────────────
  const C = {
    bg: '#020209',
    gridLine: 'rgba(0,255,136,0.03)',
    snakeHead: '#00ff88',
    snakeBody: '#00cc6a',
    snakeGlow: 'rgba(0,255,136,0.6)',
    food: '#ff006e',
    foodGlow: 'rgba(255,0,110,0.8)',
    bonus: '#ffee00',
    bonusGlow: 'rgba(255,238,0,0.8)',
    super_: '#bf00ff',
    superGlow: 'rgba(191,0,255,0.8)',
    wall: 'rgba(0,255,136,0.15)',
    text: '#00ff88',
    danger: '#ff006e',
  };

  // ── STATE ─────────────────────────────────────
  let snake, dir, nextDir, food, bonusFood, superFood;
  let score, highscore, level, lives;
  let gameLoop, running, paused, gameStarted, soundEnabled;
  let particles, floatingTexts;
  let frameCount, bonusTimer, superTimer;
  let speed; // ms per tick

  const SPEED_BY_LEVEL = [180, 155, 130, 110, 95, 82, 70, 60, 52, 45];

  // ── AUDIO (Web Audio API) ─────────────────────
  let audioCtx;
  function getAudio() {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  function beep(freq, type, duration, vol = 0.15) {
    if (!soundEnabled) return;
    try {
      const ac = getAudio();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        freq * 0.5,
        ac.currentTime + duration,
      );
      gain.gain.setValueAtTime(vol, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + duration);
    } catch (e) {}
  }

  function playEat() {
    beep(440, 'square', 0.08, 0.12);
    setTimeout(() => beep(660, 'square', 0.06, 0.1), 50);
  }
  function playBonus() {
    [440, 550, 660, 880].forEach((f, i) =>
      setTimeout(() => beep(f, 'square', 0.1, 0.15), i * 60),
    );
  }
  function playSuper() {
    [300, 400, 600, 800, 1000].forEach((f, i) =>
      setTimeout(() => beep(f, 'sawtooth', 0.12, 0.18), i * 50),
    );
  }
  function playDeath() {
    [220, 180, 140, 100].forEach((f, i) =>
      setTimeout(() => beep(f, 'sawtooth', 0.2, 0.2), i * 80),
    );
  }
  function playLevelUp() {
    [400, 500, 600, 700, 800].forEach((f, i) =>
      setTimeout(() => beep(f, 'square', 0.15, 0.2), i * 70),
    );
  }

  // ── INIT / RESET ──────────────────────────────
  function init() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    level = 1;
    lives = 3;
    particles = [];
    floatingTexts = [];
    bonusFood = null;
    superFood = null;
    bonusTimer = 0;
    superTimer = 0;
    frameCount = 0;
    speed = SPEED_BY_LEVEL[0];
    highscore = parseInt(localStorage.getItem('neonsnake_hs') || '0');
    updateHUD();
    spawnFood();
    updateSpeedBars();
  }

  // ── FOOD SPAWNING ─────────────────────────────
  function randomCell() {
    return {
      x: Math.floor(Math.random() * GRID),
      y: Math.floor(Math.random() * GRID),
    };
  }

  function cellFree(cell) {
    if (snake.some((s) => s.x === cell.x && s.y === cell.y)) return false;
    if (food && food.x === cell.x && food.y === cell.y) return false;
    return true;
  }

  function spawnFood() {
    let c;
    do {
      c = randomCell();
    } while (!cellFree(c));
    food = { ...c, pulse: 0 };
  }

  function maybeSpawnBonus() {
    if (!bonusFood && Math.random() < 0.008 * level) {
      let c;
      do {
        c = randomCell();
      } while (!cellFree(c));
      bonusFood = { ...c, pulse: 0, ttl: 200 };
    }
  }

  function maybeSpawnSuper() {
    if (!superFood && score > 0 && score % 150 === 0 && Math.random() < 0.4) {
      let c;
      do {
        c = randomCell();
      } while (!cellFree(c));
      superFood = { ...c, pulse: 0, ttl: 150 };
    }
  }

  // ── GAME TICK ─────────────────────────────────
  function tick() {
    if (!running || paused) return;

    dir = { ...nextDir };
    frameCount++;

    // Move snake
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall wrap
    head.x = (head.x + GRID) % GRID;
    head.y = (head.y + GRID) % GRID;

    // Self collision
    if (snake.some((s) => s.x === head.x && s.y === head.y)) {
      triggerDeath();
      return;
    }

    snake.unshift(head);

    let ate = false;

    // Check food
    if (head.x === food.x && head.y === food.y) {
      ate = true;
      const pts = 10 * level;
      addScore(pts);
      spawnParticles(head.x, head.y, C.food, 12);
      addFloatText(`+${pts}`, head.x, head.y, C.food);
      playEat();
      spawnFood();
    }

    // Check bonus
    if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
      ate = true;
      const pts = 50 * level;
      addScore(pts);
      spawnParticles(head.x, head.y, C.bonus, 20);
      addFloatText(`+${pts} 🌟`, head.x, head.y, C.bonus);
      playBonus();
      bonusFood = null;
    }

    // Check super food
    if (superFood && head.x === superFood.x && head.y === superFood.y) {
      ate = true;
      const pts = 100 * level;
      addScore(pts);
      spawnParticles(head.x, head.y, C.super_, 30);
      addFloatText(`+${pts} ⚡ ULTRA!`, head.x, head.y, C.super_);
      playSuper();
      superFood = null;
    }

    if (!ate) snake.pop();

    // Bonus TTL
    if (bonusFood) {
      bonusFood.ttl--;
      if (bonusFood.ttl <= 0) bonusFood = null;
    }
    if (superFood) {
      superFood.ttl--;
      if (superFood.ttl <= 0) superFood = null;
    }

    maybeSpawnBonus();
    if (frameCount % 60 === 0) maybeSpawnSuper();

    // Level up every 100 pts
    const newLevel = Math.min(10, Math.floor(score / 100) + 1);
    if (newLevel > level) {
      level = newLevel;
      speed = SPEED_BY_LEVEL[level - 1] || 45;
      restartLoop();
      updateSpeedBars();
      playLevelUp();
      addFloatText(`LEVEL ${level}!`, GRID / 2, GRID / 2, C.bonus);
    }

    updateHUD();
    render();
  }

  function triggerDeath() {
    playDeath();
    spawnParticles(snake[0].x, snake[0].y, C.danger, 40);

    // Flash animation
    let flashes = 0;
    const flashInterval = setInterval(() => {
      ctx.fillStyle = flashes % 2 === 0 ? 'rgba(255,0,110,0.3)' : 'transparent';
      ctx.fillRect(0, 0, W, H);
      flashes++;
      if (flashes >= 6) {
        clearInterval(flashInterval);
        stopGame();
        showGameOver();
      }
    }, 80);
  }

  // ── SCORING ───────────────────────────────────
  function addScore(pts) {
    score += pts;
    if (score > highscore) {
      highscore = score;
      localStorage.setItem('neonsnake_hs', highscore);
    }
    // DOM pop animation
    const el = document.getElementById('score');
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 150);
  }

  // ── PARTICLES ─────────────────────────────────
  function spawnParticles(gx, gy, color, count) {
    const cx = (gx + 0.5) * CELL;
    const cy = (gy + 0.5) * CELL;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 3;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.03 + Math.random() * 0.04,
        r: 2 + Math.random() * 3,
        color,
      });
    }
  }

  function addFloatText(text, gx, gy, color) {
    floatingTexts.push({
      text,
      x: (gx + 0.5) * CELL,
      y: (gy + 0.5) * CELL,
      vy: -1.2,
      life: 1,
      decay: 0.02,
      color,
    });
  }

  // ── RENDER ────────────────────────────────────
  function render() {
    ctx.clearRect(0, 0, W, H);

    // BG
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    // Grid
    drawGrid();

    // Food items
    food.pulse = (food.pulse || 0) + 0.08;
    drawFood(food.x, food.y, C.food, C.foodGlow, food.pulse, '◆');

    if (bonusFood) {
      bonusFood.pulse = (bonusFood.pulse || 0) + 0.1;
      drawFood(
        bonusFood.x,
        bonusFood.y,
        C.bonus,
        C.bonusGlow,
        bonusFood.pulse,
        '★',
      );
      drawTTLBar(bonusFood.x, bonusFood.y, bonusFood.ttl / 200, C.bonus);
    }

    if (superFood) {
      superFood.pulse = (superFood.pulse || 0) + 0.12;
      drawFood(
        superFood.x,
        superFood.y,
        C.super_,
        C.superGlow,
        superFood.pulse,
        '⚡',
      );
      drawTTLBar(superFood.x, superFood.y, superFood.ttl / 150, C.super_);
    }

    // Snake
    drawSnake();

    // Particles
    drawParticles();

    // Floating texts
    drawFloatingTexts();
  }

  function drawGrid() {
    ctx.strokeStyle = C.gridLine;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID; i++) {
      const pos = i * CELL;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(W, pos);
      ctx.stroke();
    }
  }

  function drawFood(gx, gy, color, glowColor, pulse, symbol) {
    const cx = (gx + 0.5) * CELL;
    const cy = (gy + 0.5) * CELL;
    const s = Math.sin(pulse) * 0.15 + 0.85;
    const r = CELL * 0.35 * s;

    // Glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.5);
    grad.addColorStop(0, glowColor);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Symbol
    ctx.fillStyle = '#000';
    ctx.font = `bold ${CELL * 0.45}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(symbol, cx, cy);
  }

  function drawTTLBar(gx, gy, ratio, color) {
    const x = gx * CELL + 1;
    const y = gy * CELL + CELL - 4;
    const w = (CELL - 2) * ratio;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, CELL - 2, 3);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, 3);
  }

  function drawSnake() {
    const len = snake.length;
    snake.forEach((seg, i) => {
      const cx = seg.x * CELL;
      const cy = seg.y * CELL;
      const pad = i === 0 ? 1 : 2;
      const sr = CELL - pad * 2;

      if (i === 0) {
        // Head — brighter, rounded
        ctx.shadowColor = C.snakeGlow;
        ctx.shadowBlur = 20;
        ctx.fillStyle = C.snakeHead;
        roundRect(ctx, cx + pad, cy + pad, sr, sr, CELL * 0.2);
        ctx.fill();

        // Eyes
        ctx.shadowBlur = 0;
        drawEyes(seg, dir);
      } else {
        // Body segments with gradient fade
        const t = i / len;
        const alpha = 1 - t * 0.6;
        ctx.shadowColor = C.snakeGlow;
        ctx.shadowBlur = 12 * (1 - t);
        ctx.fillStyle = hexAlpha(C.snakeBody, alpha);
        roundRect(ctx, cx + pad, cy + pad, sr, sr, CELL * 0.15);
        ctx.fill();

        // Segment shine line
        ctx.shadowBlur = 0;
        ctx.strokeStyle = hexAlpha('#00ff88', 0.3 * (1 - t));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx + pad + 2, cy + pad + 2);
        ctx.lineTo(cx + pad + sr - 4, cy + pad + 2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    });
  }

  function drawEyes(head, d) {
    const cx = (head.x + 0.5) * CELL;
    const cy = (head.y + 0.5) * CELL;
    const er = CELL * 0.1;
    const offset = CELL * 0.18;

    let positions;
    if (d.x === 1)
      positions = [
        { x: cx + offset, y: cy - offset },
        { x: cx + offset, y: cy + offset },
      ];
    else if (d.x === -1)
      positions = [
        { x: cx - offset, y: cy - offset },
        { x: cx - offset, y: cy + offset },
      ];
    else if (d.y === -1)
      positions = [
        { x: cx - offset, y: cy - offset },
        { x: cx + offset, y: cy - offset },
      ];
    else
      positions = [
        { x: cx - offset, y: cy + offset },
        { x: cx + offset, y: cy + offset },
      ];

    positions.forEach((p) => {
      ctx.fillStyle = '#020209';
      ctx.beginPath();
      ctx.arc(p.x, p.y, er, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x - er * 0.2, p.y - er * 0.2, er * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawParticles() {
    particles = particles.filter((p) => p.life > 0);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.life -= p.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawFloatingTexts() {
    floatingTexts = floatingTexts.filter((t) => t.life > 0);
    floatingTexts.forEach((t) => {
      t.y += t.vy;
      t.life -= t.decay;

      ctx.save();
      ctx.globalAlpha = Math.max(0, t.life);
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 10;
      ctx.font = `bold ${CELL * 0.7}px 'Orbitron', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    });
  }

  function drawIdle() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    drawGrid();
  }

  // ── HUD UPDATE ────────────────────────────────
  function updateHUD() {
    document.getElementById('score').textContent = String(score).padStart(
      6,
      '0',
    );
    document.getElementById('highscore').textContent = String(
      highscore,
    ).padStart(6, '0');
    document.getElementById('level').textContent = String(level).padStart(
      2,
      '0',
    );
  }

  function updateSpeedBars() {
    const bars = document.querySelectorAll('.speed-bars span');
    const active = Math.ceil((level / 10) * 5);
    bars.forEach((b, i) => {
      b.classList.toggle('active', i < active);
    });
  }

  // ── GAME FLOW ─────────────────────────────────
  function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    init();
    running = true;
    paused = false;
    gameStarted = true;
    restartLoop();
  }

  function stopGame() {
    running = false;
    clearInterval(gameLoop);
  }

  function restartLoop() {
    clearInterval(gameLoop);
    gameLoop = setInterval(tick, speed);
  }

  function togglePause() {
    if (!running && !gameStarted) return;
    paused = !paused;
    const pi = document.getElementById('pauseIndicator');
    pi.classList.toggle('hidden', !paused);
    if (!paused) render();
  }

  function showGameOver() {
    const isNew = score === highscore && score > 0;
    document.getElementById('finalScore').textContent = String(score).padStart(
      6,
      '0',
    );
    document.getElementById('finalBest').textContent = String(
      highscore,
    ).padStart(6, '0');
    document.getElementById('finalLevel').textContent = level;
    document
      .getElementById('newRecordBadge')
      .classList.toggle('hidden', !isNew);
    document.getElementById('gameOverScreen').classList.remove('hidden');
    gameStarted = false;
  }

  // ── INPUT ─────────────────────────────────────
  const OPPOSITE = {
    ArrowUp: 'ArrowDown',
    ArrowDown: 'ArrowUp',
    ArrowLeft: 'ArrowRight',
    ArrowRight: 'ArrowLeft',
    w: 's',
    s: 'w',
    a: 'd',
    d: 'a',
  };

  function setDir(dx, dy, key) {
    const cur = dir.x === dx && dir.y === dy;
    if (cur) return;
    // Prevent reversal
    if (dir.x === -dx && dir.y === -dy) return;
    nextDir = { x: dx, y: dy };
  }

  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        setDir(0, -1);
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        setDir(0, 1);
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        setDir(-1, 0);
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        setDir(1, 0);
        break;
      case 'p':
      case 'P':
      case 'Escape':
        togglePause();
        break;
      case 'Enter':
      case ' ':
        if (!gameStarted) startGame();
        break;
    }
  });

  // Touch swipe
  let touchStart = null;
  canvas.addEventListener(
    'touchstart',
    (e) => {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      e.preventDefault();
    },
    { passive: false },
  );

  canvas.addEventListener(
    'touchend',
    (e) => {
      if (!touchStart) return;
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        setDir(dx > 0 ? 1 : -1, 0);
      } else {
        setDir(0, dy > 0 ? 1 : -1);
      }
      touchStart = null;
      e.preventDefault();
    },
    { passive: false },
  );

  // D-pad buttons
  document.querySelectorAll('.dpad-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const d = btn.dataset.dir;
      if (d === 'UP') setDir(0, -1);
      if (d === 'DOWN') setDir(0, 1);
      if (d === 'LEFT') setDir(-1, 0);
      if (d === 'RIGHT') setDir(1, 0);
    });
    // Touch prevention for fast repeat
    btn.addEventListener(
      'touchstart',
      (e) => {
        e.preventDefault();
        const d = btn.dataset.dir;
        if (d === 'UP') setDir(0, -1);
        if (d === 'DOWN') setDir(0, 1);
        if (d === 'LEFT') setDir(-1, 0);
        if (d === 'RIGHT') setDir(1, 0);
      },
      { passive: false },
    );
  });

  // Pause & sound buttons
  document.getElementById('pauseBtn').addEventListener('click', togglePause);

  soundEnabled = true;
  document.getElementById('soundBtn').addEventListener('click', function () {
    soundEnabled = !soundEnabled;
    this.textContent = soundEnabled ? '🔊' : '🔇';
  });

  // Start / Restart
  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('restartBtn').addEventListener('click', startGame);

  // ── HELPERS ───────────────────────────────────
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function hexAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // ── IDLE ANIMATION ────────────────────────────
  let idleRaf;
  let idleSnake = Array.from({ length: 8 }, (_, i) => ({ x: 10 - i, y: 10 }));
  let idleDir = { x: 1, y: 0 };
  let idleTick = 0;

  function idleAnimate() {
    if (gameStarted) {
      cancelAnimationFrame(idleRaf);
      return;
    }
    idleTick++;
    if (idleTick % 8 === 0) {
      // Auto-pilot: random direction changes
      if (Math.random() < 0.15) {
        const turns =
          idleDir.x !== 0
            ? [
                { x: 0, y: -1 },
                { x: 0, y: 1 },
              ]
            : [
                { x: -1, y: 0 },
                { x: 1, y: 0 },
              ];
        idleDir = turns[Math.floor(Math.random() * 2)];
      }
      const head = {
        x: (idleSnake[0].x + idleDir.x + GRID) % GRID,
        y: (idleSnake[0].y + idleDir.y + GRID) % GRID,
      };
      idleSnake.unshift(head);
      idleSnake.pop();
    }

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
    drawGrid();

    // Draw idle snake
    idleSnake.forEach((seg, i) => {
      const cx = seg.x * CELL;
      const cy = seg.y * CELL;
      const pad = 2;
      const sr = CELL - pad * 2;
      const t = i / idleSnake.length;
      ctx.fillStyle = hexAlpha(C.snakeBody, 0.4 * (1 - t));
      ctx.shadowColor = C.snakeGlow;
      ctx.shadowBlur = 8;
      roundRect(ctx, cx + pad, cy + pad, sr, sr, CELL * 0.15);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    idleRaf = requestAnimationFrame(idleAnimate);
  }

  // ── BOOT ──────────────────────────────────────
  running = false;
  paused = false;
  gameStarted = false;
  soundEnabled = true;
  particles = [];
  floatingTexts = [];
  highscore = parseInt(localStorage.getItem('neonsnake_hs') || '0');
  document.getElementById('highscore').textContent = String(highscore).padStart(
    6,
    '0',
  );

  idleAnimate();
})();
