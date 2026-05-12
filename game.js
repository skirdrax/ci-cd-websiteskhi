// ========== CANVAS & ELEMENTS ==========
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Ukuran canvas
canvas.width = 1000;
canvas.height = 600;

// ========== GAME STATE ==========
let score = 0;
let lives = 3;
let level = 1;
let gameRunning = true;
let animationId = null;

// === Platform (Paddle) ===
const PADDLE_WIDTH = 140;
const PADDLE_HEIGHT = 20;
let paddleX = (canvas.width - PADDLE_WIDTH) / 2;
const paddleY = canvas.height - PADDLE_HEIGHT - 15;

// === Bola Energi ===
let balls = [];
const BASE_BALL_RADIUS = 10;
let ballSpeedY = 3.8;
let spawnRate = 65; // frame counter cycle
let spawnCounter = 0;

// Efek partikel futuristik saat menangkap bola
let particles = [];

// Warna neon dinamis
const colors = ['#0ff', '#f0f', '#ff0', '#f66', '#6f6', '#fa0'];

// Kontrol mouse / touch
let mouseX = paddleX;

// === Helper Functions ===
function updateUI() {
  document.getElementById('scoreValue').innerText = score;
  document.getElementById('livesValue').innerText = lives;
  document.getElementById('levelValue').innerText = level;
}

// Menambah partikel ledakan kecil
function addExplosion(x, y, color) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 4 - 1.5,
      life: 0.8,
      size: Math.random() * 4 + 2,
      color: color,
    });
  }
}

// Update partikel
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].x += particles[i].vx;
    particles[i].y += particles[i].vy;
    particles[i].life -= 0.025;
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// Menambah bola baru
function spawnBall() {
  const radius = BASE_BALL_RADIUS + (Math.random() * 3 - 1);
  const color = colors[Math.floor(Math.random() * colors.length)];
  balls.push({
    x: Math.random() * (canvas.width - 2 * radius) + radius,
    y: -radius,
    radius: radius,
    speedY: ballSpeedY + Math.random() * 1.2,
    color: color,
  });
}

// Reset game penuh
function resetGame() {
  gameRunning = true;
  score = 0;
  lives = 3;
  level = 1;
  balls = [];
  particles = [];
  ballSpeedY = 3.8;
  spawnRate = 65;
  spawnCounter = 5;
  paddleX = (canvas.width - PADDLE_WIDTH) / 2;
  mouseX = paddleX;
  updateUI();
  // sembunyikan overlay jika tampak
  const modal = document.getElementById('gameOverModal');
  modal.style.visibility = 'hidden';
  modal.style.opacity = '0';
}

// Cek level & difficulty naik
function updateDifficultyByScore() {
  let newLevel = 1;
  if (score >= 30) newLevel = 4;
  else if (score >= 18) newLevel = 3;
  else if (score >= 8) newLevel = 2;
  else newLevel = 1;

  if (newLevel !== level) {
    level = newLevel;
    // effect scaling difficulty
    if (level === 2) {
      ballSpeedY = 4.8;
      spawnRate = 50;
    } else if (level === 3) {
      ballSpeedY = 5.8;
      spawnRate = 40;
    } else if (level >= 4) {
      ballSpeedY = 7.0;
      spawnRate = 32;
    }
    document.getElementById('levelValue').innerText = level;
    // efek visual flash level up
    canvas.style.boxShadow = '0 0 0 3px #ff0, 0 0 30px cyan';
    setTimeout(() => {
      if (gameRunning)
        canvas.style.boxShadow = '0 0 0 3px #0ff4, 0 20px 35px rgba(0,0,0,0.6)';
    }, 300);
  }
}

// Game logic: update bola, tabrakan, nyawa
function updateGame() {
  if (!gameRunning) return;

  // 1. Gerakan paddle mengikuti mouse/touch (batasan)
  let newPaddleX = mouseX - PADDLE_WIDTH / 2;
  newPaddleX = Math.max(0, Math.min(newPaddleX, canvas.width - PADDLE_WIDTH));
  paddleX = newPaddleX;

  // 2. Spawn bola berdasarkan spawnRate
  if (spawnCounter <= 0) {
    spawnBall();
    // tambahan kadang spawn double saat level tinggi
    if (level >= 3 && Math.random() < 0.3) spawnBall();
    spawnCounter = spawnRate;
  } else {
    spawnCounter--;
  }

  // 3. Update bola dan deteksi nyawa / tabrakan paddle
  for (let i = 0; i < balls.length; i++) {
    const b = balls[i];
    b.y += b.speedY;

    // Cek tabrakan dengan paddle
    if (
      b.y + b.radius >= paddleY &&
      b.y - b.radius <= paddleY + PADDLE_HEIGHT &&
      b.x + b.radius > paddleX &&
      b.x - b.radius < paddleX + PADDLE_WIDTH
    ) {
      // Tangkap bola! tambah skor
      score += Math.floor(10 + level * 1.5);
      updateUI();
      addExplosion(b.x, b.y, b.color);
      balls.splice(i, 1);
      i--;
      updateDifficultyByScore();
      continue;
    }

    // Cek jika bola jatuh ke bawah (melewati paddle)
    if (b.y + b.radius >= canvas.height) {
      lives--;
      updateUI();
      addExplosion(b.x, canvas.height - 15, '#ff3366');
      balls.splice(i, 1);
      i--;

      if (lives <= 0) {
        gameRunning = false;
        showGameOver();
        return;
      }
      continue;
    }

    // Hapus bola jika keluar atas (aman)
    if (b.y + b.radius < -30) {
      balls.splice(i, 1);
      i--;
    }
  }

  // tambahan cek agar saat score tinggi tidak terlalu mudah mati, tetap seru
  if (!gameRunning) return;
}

// ========== GRAFIK FUTURISTIK ==========
function draw() {
  if (!ctx) return;
  // Bersihkan canvas dengan gradasi gelap futuristik
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#02101f');
  grad.addColorStop(1, '#00030c');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Garis grid dinamis (hologram)
  ctx.strokeStyle = '#0ff2';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < canvas.width; i += 45) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i % canvas.height);
    ctx.lineTo(canvas.width, i % canvas.height);
    ctx.stroke();
  }

  // Gambar partikel neon
  for (let p of particles) {
    ctx.globalAlpha = p.life * 0.9;
    ctx.shadowBlur = 8;
    ctx.shadowColor = p.color;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Gambar Bola Energi dengan efek core
  for (let b of balls) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = b.color;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius - 2, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    // efek glow
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = b.color + '60';
    ctx.fill();
  }

  // Gambar PADDLE dengan teknologi futuristik
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#0ff';
  ctx.fillStyle = '#0ffc';
  ctx.fillRect(paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
  ctx.fillStyle = '#fff';
  ctx.fillRect(paddleX + 4, paddleY - 2, PADDLE_WIDTH - 8, 5);
  ctx.fillStyle = '#0ff';
  ctx.fillRect(paddleX + 8, paddleY - 4, PADDLE_WIDTH - 16, 4);
  // pinggiran neon
  ctx.strokeStyle = '#fffa';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

  // Area bawah efek scanner
  ctx.fillStyle = '#0ff2';
  ctx.fillRect(0, canvas.height - 12, canvas.width, 4);
  ctx.fillStyle = '#f0f5';
  ctx.fillRect(paddleX - 5, paddleY + 5, 5, 10);
  ctx.fillRect(paddleX + PADDLE_WIDTH, paddleY + 5, 5, 10);

  // Tampilkan skor dan lives di canvas juga (opsional)
  ctx.font = 'bold 20px "Orbitron"';
  ctx.fillStyle = '#7df9ff';
  ctx.shadowBlur = 0;
  ctx.fillText(`⚡${score}`, 25, 55);
  ctx.fillStyle = '#ff66cc';
  ctx.fillText(`❤️ ${lives}`, canvas.width - 85, 55);
  if (level >= 2) {
    ctx.font = '12px monospace';
    ctx.fillStyle = '#fa0';
    ctx.fillText(`⚡ SPEED BOOST LV${level}`, canvas.width - 150, 95);
  }
  ctx.shadowBlur = 0;

  // animasi cursor custom (lingkaran neon)
  if (gameRunning) {
    ctx.beginPath();
    ctx.arc(mouseX, paddleY - 8, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#0ff3';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mouseX, paddleY - 8, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
  }
}

// Game loop utama
function gameLoop() {
  updateParticles();
  if (gameRunning) {
    updateGame();
  }
  draw();
  animationId = requestAnimationFrame(gameLoop);
}

// Menampilkan Game Over modal
function showGameOver() {
  if (!gameRunning) {
    document.getElementById('finalScoreMsg').innerText =
      `✨ Skor Akhir: ${score} ✨ | Level ${level}`;
    const modal = document.getElementById('gameOverModal');
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
  }
}

// restart dari modal atau tombol
function restartGame() {
  resetGame();
  // tambahan reset state
  if (!gameRunning) gameRunning = true;
  updateUI();
  const modal = document.getElementById('gameOverModal');
  modal.style.visibility = 'hidden';
  modal.style.opacity = '0';
  // kosongkan array bola dan partikel
  balls = [];
  particles = [];
  spawnCounter = 8;
}

// ========== EVENT MOUSE & TOUCH (kontrol futuristik) ==========
function handleMove(clientX) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  let canvasX = (clientX - rect.left) * scaleX;
  canvasX = Math.min(Math.max(canvasX, 0), canvas.width);
  mouseX = canvasX;
}

canvas.addEventListener('mousemove', (e) => {
  handleMove(e.clientX);
});
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (e.touches.length) handleMove(e.touches[0].clientX);
});
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  if (e.touches.length) handleMove(e.touches[0].clientX);
});

// Tombol restart
document.getElementById('restartButton').addEventListener('click', () => {
  restartGame();
});
document.getElementById('modalRestartBtn').addEventListener('click', () => {
  restartGame();
});

// Inisialisasi game
resetGame();
// spawn awal agar tidak kosong
for (let i = 0; i < 3; i++) spawnBall();
spawnCounter = 20;
updateUI();
gameLoop();
