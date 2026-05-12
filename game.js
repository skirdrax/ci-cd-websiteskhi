(function () {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // Ukuran canvas responsif
  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const maxWidth = Math.min(800, wrapper.clientWidth);
    canvas.style.width = `${maxWidth}px`;
    canvas.style.height = 'auto';
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let currentGame = 'catcher';
  let animationId = null;
  let starsBg = null;

  // ========== GAME 1: CATCHER (Responsive Mouse/Touch) ==========
  let catcher = {
    score: 0,
    lives: 3,
    paddleX: canvas.width / 2 - 50,
    paddleWidth: 100,
    paddleHeight: 15,
    paddleY: canvas.height - 40,
    balls: [],
    gameRunning: true,
    mouseX: canvas.width / 2,

    init() {
      this.score = 0;
      this.lives = 3;
      this.balls = [];
      this.gameRunning = true;
      this.paddleX = canvas.width / 2 - this.paddleWidth / 2;
      for (let i = 0; i < 4; i++) this.spawnBall();
      document.getElementById('gameInfo').innerHTML =
        '🐱 Geser kiri/kanan untuk menangkap bintang!';
    },

    spawnBall() {
      this.balls.push({
        x: Math.random() * (canvas.width - 30) + 15,
        y: -15,
        radius: 10 + Math.random() * 4,
        speedY: 3 + Math.random() * 3,
        color: `hsl(${Math.random() * 360}, 100%, 60%)`,
      });
    },

    update() {
      if (!this.gameRunning) return;

      let targetX = this.mouseX - this.paddleWidth / 2;
      targetX = Math.max(0, Math.min(targetX, canvas.width - this.paddleWidth));
      this.paddleX = targetX;

      if (Math.random() < 0.025) this.spawnBall();

      for (let i = 0; i < this.balls.length; i++) {
        const b = this.balls[i];
        b.y += b.speedY;

        if (
          b.y + b.radius >= this.paddleY &&
          b.y - b.radius <= this.paddleY + this.paddleHeight &&
          b.x + b.radius > this.paddleX &&
          b.x - b.radius < this.paddleX + this.paddleWidth
        ) {
          this.score += 10;
          this.balls.splice(i, 1);
          i--;
          continue;
        }

        if (b.y + b.radius >= canvas.height) {
          this.lives--;
          this.balls.splice(i, 1);
          i--;
          if (this.lives <= 0) {
            this.gameRunning = false;
            document.getElementById('gameInfo').innerHTML =
              '💀 GAME OVER! Pilih game lain atau klik game ini lagi untuk restart 💀';
          }
          continue;
        }

        if (b.y + b.radius < -20) {
          this.balls.splice(i, 1);
          i--;
        }
      }
    },

    draw() {
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Bintang background
      if (!starsBg) {
        starsBg = [];
        for (let s = 0; s < 100; s++)
          starsBg.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
          });
      }
      for (let s of starsBg) {
        ctx.fillStyle = `rgba(255,255,200,${0.2 + Math.sin(Date.now() * 0.001) * 0.1})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bola-bola
      for (let b of this.balls) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = b.color;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(b.x - 2, b.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Paddle
      ctx.fillStyle = '#0ff';
      ctx.shadowBlur = 8;
      ctx.fillRect(
        this.paddleX,
        this.paddleY,
        this.paddleWidth,
        this.paddleHeight,
      );
      ctx.fillStyle = '#fff';
      ctx.fillRect(
        this.paddleX + 5,
        this.paddleY - 3,
        this.paddleWidth - 10,
        5,
      );

      // Score & Lives
      ctx.font = `bold ${Math.floor(canvas.width * 0.03)}px "Courier New"`;
      ctx.fillStyle = '#0ff';
      ctx.fillText(`⭐ ${this.score}`, 15, 45);
      ctx.fillStyle = '#f66';
      ctx.fillText(`❤️ ${this.lives}`, canvas.width - 80, 45);

      if (!this.gameRunning) {
        ctx.font = `bold ${Math.floor(canvas.width * 0.04)}px monospace`;
        ctx.fillStyle = '#ff0';
        ctx.shadowBlur = 0;
        ctx.fillText('GAME OVER!', canvas.width / 2 - 100, canvas.height / 2);
      }
      ctx.shadowBlur = 0;
    },

    handleMove(x) {
      this.mouseX = x;
    },

    restart() {
      this.init();
    },
  };

  // ========== GAME 2: CLICKER CHAOS ==========
  let clicker = {
    score: 0,
    targets: [],
    gameRunning: true,
    timeLeft: 30,
    lastTimestamp: 0,

    init() {
      this.score = 0;
      this.targets = [];
      this.gameRunning = true;
      this.timeLeft = 30;
      this.lastTimestamp = Date.now();
      for (let i = 0; i < 5; i++) this.spawnTarget();
      document.getElementById('gameInfo').innerHTML =
        '💥 KLIK target warna-warni secepat mungkin! 💥';
    },

    spawnTarget() {
      this.targets.push({
        x: 50 + Math.random() * (canvas.width - 100),
        y: 50 + Math.random() * (canvas.height - 100),
        radius: 28,
        life: 1,
      });
    },

    update() {
      if (!this.gameRunning) return;

      const now = Date.now();
      if (now - this.lastTimestamp >= 1000) {
        this.timeLeft--;
        this.lastTimestamp = now;
        if (this.timeLeft <= 0) {
          this.gameRunning = false;
          document.getElementById('gameInfo').innerHTML =
            `🎉 SELESAI! Skor akhir: ${this.score} 🎉`;
        }
      }

      if (Math.random() < 0.04 && this.targets.length < 10) this.spawnTarget();

      for (let i = 0; i < this.targets.length; i++) {
        this.targets[i].life -= 0.008;
        if (this.targets[i].life <= 0) {
          this.targets.splice(i, 1);
          i--;
        }
      }
    },

    draw() {
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid efek
      ctx.strokeStyle = '#0ff1';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i % canvas.height);
        ctx.lineTo(canvas.width, i % canvas.height);
        ctx.stroke();
      }

      // Target
      for (let t of this.targets) {
        const alpha = Math.min(1, t.life * 1.5);
        const pulse = Math.sin(Date.now() * 0.008) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, ${80 + Math.sin(Date.now() * 0.005) * 100}, 0, ${alpha})`;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = `bold ${Math.floor(canvas.width * 0.025)}px monospace`;
        ctx.fillText('+1', t.x - 12, t.y - 12);
        ctx.beginPath();
        ctx.arc(t.x, t.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // UI
      ctx.font = `bold ${Math.floor(canvas.width * 0.035)}px "Courier New"`;
      ctx.fillStyle = '#ff0';
      ctx.fillText(`💥 ${this.score}`, 15, 50);
      ctx.fillStyle = '#0ff';
      ctx.fillText(`⏱️ ${Math.floor(this.timeLeft)}s`, canvas.width - 100, 50);

      if (!this.gameRunning && this.timeLeft <= 0) {
        ctx.font = `bold ${Math.floor(canvas.width * 0.04)}px monospace`;
        ctx.fillStyle = '#0f0';
        ctx.fillText(
          `SKOR: ${this.score}`,
          canvas.width / 2 - 90,
          canvas.height / 2,
        );
      }
    },

    handleClick(x, y) {
      if (!this.gameRunning) return false;
      for (let i = 0; i < this.targets.length; i++) {
        const t = this.targets[i];
        const dx = x - t.x;
        const dy = y - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < t.radius) {
          this.score++;
          this.targets.splice(i, 1);
          return true;
        }
      }
      return false;
    },

    restart() {
      this.init();
    },
  };

  // ========== GAME 3: DODGE RUNNER ==========
  let runner = {
    score: 0,
    playerX: canvas.width / 2,
    playerY: canvas.height - 60,
    playerRadius: 15,
    obstacles: [],
    gameRunning: true,
    mouseX: canvas.width / 2,

    init() {
      this.score = 0;
      this.playerX = canvas.width / 2;
      this.obstacles = [];
      this.gameRunning = true;
      document.getElementById('gameInfo').innerHTML =
        '🏃 Hindari bola berwarna! Geser untuk menghindar 🏃';
    },

    spawnObstacle() {
      this.obstacles.push({
        x: Math.random() * (canvas.width - 40) + 20,
        y: -20,
        radius: 12,
        speedY: 4 + Math.random() * 4,
        color: `hsl(${Math.random() * 360}, 80%, 55%)`,
      });
    },

    update() {
      if (!this.gameRunning) return;

      let targetX = this.mouseX;
      targetX = Math.max(
        this.playerRadius,
        Math.min(targetX, canvas.width - this.playerRadius),
      );
      this.playerX = targetX;

      if (Math.random() < 0.03) this.spawnObstacle();

      for (let i = 0; i < this.obstacles.length; i++) {
        const o = this.obstacles[i];
        o.y += o.speedY;

        const dx = this.playerX - o.x;
        const dy = this.playerY - o.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.playerRadius + o.radius) {
          this.gameRunning = false;
          document.getElementById('gameInfo').innerHTML =
            `💀 GAME OVER! Skor: ${this.score} 💀`;
          return;
        }

        if (o.y + o.radius > canvas.height) {
          this.obstacles.splice(i, 1);
          this.score++;
          i--;
        } else if (o.y + o.radius < -20) {
          this.obstacles.splice(i, 1);
          i--;
        }
      }
    },

    draw() {
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Efek garis gerak
      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = `rgba(0, 255, 255, ${0.05 + Math.sin(Date.now() * 0.005) * 0.03})`;
        ctx.fillRect(
          0,
          (i * 30 + Date.now() * 0.2) % canvas.height,
          canvas.width,
          2,
        );
      }

      // Obstacles
      for (let o of this.obstacles) {
        ctx.shadowBlur = 8;
        ctx.shadowColor = o.color;
        ctx.fillStyle = o.color;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Player
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#0ff';
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.arc(
        this.playerX,
        this.playerY,
        this.playerRadius + 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(
        this.playerX,
        this.playerY,
        this.playerRadius - 2,
        0,
        Math.PI * 2,
      );
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.font = `bold ${Math.floor(canvas.width * 0.035)}px "Courier New"`;
      ctx.fillStyle = '#ff0';
      ctx.fillText(`🏆 ${this.score}`, 15, 50);

      if (!this.gameRunning) {
        ctx.font = `bold ${Math.floor(canvas.width * 0.04)}px monospace`;
        ctx.fillStyle = '#f66';
        ctx.fillText('GAME OVER!', canvas.width / 2 - 100, canvas.height / 2);
      }
    },

    handleMove(x) {
      this.mouseX = x;
    },

    restart() {
      this.init();
    },
  };

  // ========== SWITCH GAME ==========
  function switchGame(gameName) {
    currentGame = gameName;

    if (gameName === 'catcher') {
      catcher.init();
    } else if (gameName === 'clicker') {
      clicker.init();
    } else if (gameName === 'runner') {
      runner.init();
    }

    // Update active button
    document.querySelectorAll('.game-btn').forEach((btn) => {
      if (btn.dataset.game === gameName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // ========== EVENT HANDLER (Responsive Mouse & Touch) ==========
  function getCanvasCoords(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    let canvasX = (clientX - rect.left) * scaleX;
    let canvasY = (clientY - rect.top) * scaleY;
    canvasX = Math.min(Math.max(canvasX, 0), canvas.width);
    canvasY = Math.min(Math.max(canvasY, 0), canvas.height);

    return { x: canvasX, y: canvasY };
  }

  function handleMove(e) {
    e.preventDefault();
    const { x } = getCanvasCoords(e);

    if (currentGame === 'catcher') {
      catcher.handleMove(x);
    } else if (currentGame === 'runner') {
      runner.handleMove(x);
    }
  }

  function handleClick(e) {
    e.preventDefault();
    const { x, y } = getCanvasCoords(e);

    if (currentGame === 'clicker') {
      clicker.handleClick(x, y);
    }
  }

  // Restart game ketika pilih game yang sama
  function handleGameRestart(e) {
    const gameName = e.currentTarget.dataset.game;
    if (currentGame === gameName) {
      if (currentGame === 'catcher') catcher.restart();
      if (currentGame === 'clicker') clicker.restart();
      if (currentGame === 'runner') runner.restart();
    }
    switchGame(gameName);
  }

  // ========== PASANG EVENT LISTENER ==========
  canvas.addEventListener('mousemove', handleMove);
  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('touchmove', handleMove, { passive: false });
  canvas.addEventListener('touchstart', handleClick, { passive: false });
  canvas.addEventListener('touchstart', handleMove, { passive: false });

  document.querySelectorAll('.game-btn').forEach((btn) => {
    btn.addEventListener('click', handleGameRestart);
  });

  // ========== START GAME ==========
  switchGame('catcher');

  // ========== ANIMATION LOOP ==========
  function animate() {
    if (currentGame === 'catcher') {
      catcher.update();
      catcher.draw();
    } else if (currentGame === 'clicker') {
      clicker.update();
      clicker.draw();
    } else if (currentGame === 'runner') {
      runner.update();
      runner.draw();
    }

    animationId = requestAnimationFrame(animate);
  }

  animate();
})();
