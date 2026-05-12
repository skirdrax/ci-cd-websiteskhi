(function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    let currentGame = 'catcher';
    let animationId = null;
    let starsBg = null;
    
    // ========== GAME 1: CATCHER (Tangkap Bintang) ==========
    let catcher = {
        score: 0,
        lives: 3,
        paddleX: canvas.width/2 - 50,
        paddleWidth: 100,
        paddleHeight: 15,
        paddleY: canvas.height - 40,
        balls: [],
        gameRunning: true,
        mouseX: canvas.width/2,
        
        init() {
            this.score = 0;
            this.lives = 3;
            this.balls = [];
            this.gameRunning = true;
            this.paddleX = canvas.width/2 - this.paddleWidth/2;
            for(let i = 0; i < 4; i++) this.spawnBall();
        },
        
        spawnBall() {
            this.balls.push({
                x: Math.random() * (canvas.width - 30) + 15,
                y: -15,
                radius: 12,
                speedY: 3 + Math.random() * 2.5,
                color: `hsl(${Math.random() * 360}, 100%, 60%)`
            });
        },
        
        update() {
            if(!this.gameRunning) return;
            
            let targetX = this.mouseX - this.paddleWidth/2;
            targetX = Math.max(0, Math.min(targetX, canvas.width - this.paddleWidth));
            this.paddleX = targetX;
            
            if(Math.random() < 0.02) this.spawnBall();
            
            for(let i = 0; i < this.balls.length; i++) {
                const b = this.balls[i];
                b.y += b.speedY;
                
                if(b.y + b.radius >= this.paddleY && b.y - b.radius <= this.paddleY + this.paddleHeight &&
                   b.x + b.radius > this.paddleX && b.x - b.radius < this.paddleX + this.paddleWidth) {
                    this.score += 10;
                    this.balls.splice(i,1);
                    i--;
                    continue;
                }
                
                if(b.y + b.radius >= canvas.height) {
                    this.lives--;
                    this.balls.splice(i,1);
                    i--;
                    if(this.lives <= 0) {
                        this.gameRunning = false;
                    }
                    continue;
                }
                
                if(b.y + b.radius < -20) {
                    this.balls.splice(i,1);
                    i--;
                }
            }
        },
        
        draw() {
            ctx.fillStyle = '#0a0f1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // bintang background
            if(!starsBg) {
                starsBg = [];
                for(let s = 0; s < 80; s++) starsBg.push({x: Math.random()*canvas.width, y: Math.random()*canvas.height});
            }
            for(let s of starsBg) {
                ctx.fillStyle = `rgba(255,255,200,${0.3+Math.sin(Date.now()*0.001)*0.1})`;
                ctx.beginPath();
                ctx.arc(s.x, s.y, 1.5, 0, Math.PI*2);
                ctx.fill();
            }
            
            for(let b of this.balls) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = b.color;
                ctx.fillStyle = b.color;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(b.x-2, b.y-2, 3, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
            
            ctx.fillStyle = '#0ff';
            ctx.shadowBlur = 5;
            ctx.fillRect(this.paddleX, this.paddleY, this.paddleWidth, this.paddleHeight);
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.paddleX+5, this.paddleY-3, this.paddleWidth-10, 5);
            
            ctx.font = 'bold 24px "Courier New"';
            ctx.fillStyle = '#0ff';
            ctx.fillText(`⭐ ${this.score}`, 20, 50);
            ctx.fillStyle = '#f66';
            ctx.fillText(`❤️ ${this.lives}`, canvas.width-100, 50);
            
            if(!this.gameRunning) {
                ctx.font = 'bold 30px monospace';
                ctx.fillStyle = '#ff0';
                ctx.shadowBlur = 0;
                ctx.fillText('GAME OVER!', canvas.width/2-100, canvas.height/2);
                ctx.font = '16px monospace';
                ctx.fillStyle = '#fff';
                ctx.fillText('Pilih game lain atau klik RESTART (pilih ulang game)', canvas.width/2-200, canvas.height/2+50);
            }
            ctx.shadowBlur = 0;
        },
        
        handleMouse(x) {
            this.mouseX = x;
        }
    };
    
    // ========== GAME 2: CLICKER CHAOS ==========
    let clicker = {
        score: 0,
        targets: [],
        gameRunning: true,
        timeLeft: 30,
        lastTimestamp: 0,
        clickCount: 0,
        
        init() {
            this.score = 0;
            this.targets = [];
            this.gameRunning = true;
            this.timeLeft = 30;
            this.clickCount = 0;
            this.lastTimestamp = Date.now();
            for(let i = 0; i < 5; i++) this.spawnTarget();
        },
        
        spawnTarget() {
            this.targets.push({
                x: 50 + Math.random() * (canvas.width - 100),
                y: 50 + Math.random() * (canvas.height - 100),
                radius: 28,
                life: 1
            });
        },
        
        update() {
            if(!this.gameRunning) return;
            
            const now = Date.now();
            if(now - this.lastTimestamp >= 1000) {
                this.timeLeft--;
                this.lastTimestamp = now;
                if(this.timeLeft <= 0) {
                    this.gameRunning = false;
                }
            }
            
            if(Math.random() < 0.04 && this.targets.length < 10) this.spawnTarget();
            
            for(let i = 0; i < this.targets.length; i++) {
                this.targets[i].life -= 0.008;
                if(this.targets[i].life <= 0) {
                    this.targets.splice(i,1);
                    i--;
                }
            }
        },
        
        draw() {
            ctx.fillStyle = '#0a0f1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.strokeStyle = '#0ff1';
            ctx.lineWidth = 1;
            for(let i = 0; i < canvas.width; i+=50) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i%canvas.height);
                ctx.lineTo(canvas.width, i%canvas.height);
                ctx.stroke();
            }
            
            for(let t of this.targets) {
                const alpha = Math.min(1, t.life * 1.5);
                const pulse = Math.sin(Date.now() * 0.008) * 0.2 + 0.8;
                ctx.fillStyle = `rgba(255, ${80 + Math.sin(Date.now()*0.005)*100}, 0, ${alpha})`;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.radius * pulse, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.9)';
                ctx.font = 'bold 20px monospace';
                ctx.fillText('+1', t.x-12, t.y-12);
                
                // target titik tengah
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(t.x, t.y, 5, 0, Math.PI*2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
            
            ctx.font = 'bold 32px "Courier New"';
            ctx.fillStyle = '#ff0';
            ctx.fillText(`💥 ${this.score}`, 20, 55);
            ctx.fillStyle = '#0ff';
            ctx.fillText(`⏱️ ${Math.floor(this.timeLeft)}s`, canvas.width-130, 55);
            ctx.font = '16px monospace';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Klik target yang muncul!', canvas.width/2-100, canvas.height-20);
            
            if(!this.gameRunning) {
                ctx.font = 'bold 28px monospace';
                ctx.fillStyle = '#ff0';
                ctx.fillText(`SCORE: ${this.score}`, canvas.width/2-100, canvas.height/2);
                ctx.font = '14px monospace';
                ctx.fillStyle = '#0ff';
                ctx.fillText('Pilih game lain di menu', canvas.width/2-100, canvas.height/2+40);
            }
        },
        
        handleClick(x, y) {
            if(!this.gameRunning) return false;
            for(let i = 0; i < this.targets.length; i++) {
                const t = this.targets[i];
                const dx = x - t.x;
                const dy = y - t.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < t.radius) {
                    this.score++;
                    this.clickCount++;
                    this.targets.splice(i,1);
                    return true;
                }
            }
            return false;
        }
    };
    
    // ========== GAME 3: DODGE RUNNER ==========
    let runner = {
        score: 0,
        playerX: canvas.width/2,
        playerY: canvas.height - 60,
        playerRadius: 15,
        obstacles: [],
        gameRunning: true,
        mouseX: canvas.width/2,
        
        init() {
            this.score = 0;
            this.playerX = canvas.width/2;
            this.obstacles = [];
            this.gameRunning = true;
        },
        
        spawnObstacle() {
            this.obstacles.push({
                x: Math.random() * (canvas.width - 40) + 20,
                y: -20,
                radius: 12,
                speedY: 4 + Math.random() * 3,
                color: `hsl(${Math.random() * 360}, 80%, 55%)`
            });
        },
        
        update() {
            if(!this.gameRunning) return;
            
            // gerak player
            let targetX = this.mouseX;
            targetX = Math.max(this.playerRadius, Math.min(targetX, canvas.width - this.playerRadius));
            this.playerX = targetX;
            
            // spawn
            if(Math.random() < 0.025) this.spawnObstacle();
            
            for(let i = 0; i < this.obstacles.length; i++) {
                const o = this.obstacles[i];
                o.y += o.speedY;
                
                // tabrakan
                const dx = this.playerX - o.x;
                const dy = this.playerY - o.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if(dist < this.playerRadius + o.radius) {
                    this.gameRunning = false;
                    return;
                }
                
                if(o.y + o.radius > canvas.height) {
                    this.obstacles.splice(i,1);
                    this.score++;
                    i--;
                } else if(o.y + o.radius < -20) {
                    this.obstacles.splice(i,1);
                    i--;
                }
            }
        },
        
        draw() {
            ctx.fillStyle = '#0a0f1e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // efek garis gerak
            for(let i = 0; i < 20; i++) {
                ctx.fillStyle = `rgba(0, 255, 255, ${0.05 + Math.sin(Date.now()*0.005)*0.03})`;
                ctx.fillRect(0, i*30 + (Date.now()*0.2 % 30), canvas.width, 2);
            }
            
            // obstacles
            for(let o of this.obstacles) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = o.color;
                ctx.fillStyle = o.color;
                ctx.beginPath();
                ctx.arc(o.x, o.y, o.radius, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.arc(o.x-2, o.y-2, o.radius/3, 0, Math.PI*2);
                ctx.fill();
            }
            
            // player (lingkaran pelindung)
            ctx.shadowBlur = 12;
            ctx.shadowColor = '#0ff';
            ctx.fillStyle = '#0ff';
            ctx.beginPath();
            ctx.arc(this.playerX, this.playerY, this.playerRadius+2, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(this.playerX, this.playerY, this.playerRadius-2, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = '#0ff';
            ctx.beginPath();
            ctx.arc(this.playerX, this.playerY, 5, 0, Math.PI*2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
            ctx.font = 'bold 28px "Courier New"';
            ctx.fillStyle = '#ff0';
            ctx.fillText(`🏆 ${this.score}`, 20, 55);
            
            if(!this.gameRunning) {
                ctx.font = 'bold 30px monospace';
                ctx.fillStyle = '#f66';
                ctx.fillText('GAME OVER!', canvas.width/2-100, canvas.height/2);
                ctx.font = '16px monospace';
                ctx.fillStyle = '#0ff';
                ctx.fillText(`Score: ${this.score}`, canvas.width/2-60, canvas.height/2+50);
            }
            
            ctx.font = '12px monospace';
            ctx.fillStyle = '#aaa';
            ctx.fillText('Hindari bola berwarna!', canvas.width/2-80, canvas.height-15);
        },
        
        handleMouse(x) {
            this.mouseX = x;
        }
    };
    
    // ========== SWITCH GAME ==========
    function switchGame(gameName) {
        currentGame = gameName;
        
        if(gameName === 'catcher') {
            catcher.init();
        } else if(gameName === 'clicker') {
            clicker.init();
        } else if(gameName === 'runner') {
            runner.init();
        }
        
        // update active button
        document.querySelectorAll('.game-btn').forEach(btn => {
            if(btn.dataset.game === gameName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // ========== EVENT HANDLER ==========
    function handleMouseMove(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        let canvasX = (e.clientX - rect.left) * scaleX;
        canvasX = Math.min(Math.max(canvasX, 0), canvas.width);
        
        if(currentGame === 'catcher') {
            catcher.handleMouse(canvasX);
        } else if(currentGame === 'runner') {
            runner.handleMouse(canvasX);
        }
    }
    
    function handleClick(e) {
        if(currentGame === 'clicker') {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const canvasX = (e.clientX - rect.left) * scaleX;
            const canvasY = (e.clientY - rect.top) * scaleY;
            clicker.handleClick(canvasX, canvasY);
        }
    }
    
    // ========== ANIMATION LOOP ==========
    function animate() {
        if(currentGame === 'catcher') {
            catcher.update();
            catcher.draw();
        } else if(currentGame === 'clicker') {
            clicker.update();
            clicker.draw();
        } else if(currentGame === 'runner') {
            runner.update();
            runner.draw();
        }
        
        animationId = requestAnimationFrame(animate);
    }
    
    // ========== SETUP EVENT LISTENERS ==========
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    
    // touch untuk mobile
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const scaleX = canvas.width / rect.width;
        let canvasX = (touch.clientX - rect.left) * scaleX;
        canvasX = Math.min(Math.max(canvasX, 0), canvas.width);
        
        if(currentGame === 'catcher') catcher.handleMouse(canvasX);
        if(currentGame === 'runner') runner.handleMouse(canvasX);
    });
    
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const canvasX = (touch.clientX - rect.left) * scaleX;
        const canvasY = (touch.clientY - rect.top) * scaleY;
        
        if(currentGame === 'clicker') clicker.handleClick(canvasX, canvasY);
    });
    
    // pilih game dari menu
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchGame(btn.dataset.game);
        });
    });
    
    // ========== START GAME ==========
    switchGame('catcher');
    animate();
})();