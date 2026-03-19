// 愤怒的小鸟 - 核心游戏逻辑
class AngryBirdsGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 游戏状态
        this.score = 0;
        this.birdsLeft = 3;
        this.pigsLeft = 5;
        this.currentBird = null;
        this.slingshot = { x: 150, y: 350 };
        this.isAiming = false;
        this.isFlying = false;
        this.birds = [];
        this.pigs = [];
        this.blocks = [];
        this.particles = [];
        this.mousePos = { x: 0, y: 0 };
        this.gameOver = false;
        this.win = false;

        // 物理常量
        this.gravity = 0.3;
        this.birdSpeed = 0.8;
        this.maxPower = 20;
        this.minPower = 5;

        // 绑定事件
        this.bindEvents();

        // 初始化游戏
        this.initLevel();
        this.updateUI();
        this.gameLoop();
    }

    initLevel() {
        // 创建小鸟群
        this.birds = [
            { x: this.slingshot.x, y: this.slingshot.y, radius: 15, color: '#DC143C', vx: 0, vy: 0, launched: false }
        ];
        this.birdsLeft = 3;

        // 创建小猪和结构
        this.pigs = [];
        this.blocks = [];

        // 地面块
        const groundY = this.canvas.height * 0.75;
        for (let i = 0; i < 12; i++) {
            this.blocks.push({
                x: 400 + i * 40,
                y: groundY,
                width: 35,
                height: 50,
                type: 'wood',
                health: 60
            });
        }

        // 小猪位置
        const pigPositions = [
            { x: 460, y: groundY - 35 },
            { x: 500, y: groundY - 35 },
            { x: 540, y: groundY - 60 },
            { x: 580, y: groundY - 35 },
            { x: 620, y: groundY - 60 }
        ];

        pigPositions.forEach(pos => {
            this.pigs.push({
                x: pos.x,
                y: pos.y,
                radius: 20,
                health: 30,
                color: '#90EE90'
            });
        });

        this.pigsLeft = this.pigs.length;
        this.currentBird = this.birds[0];
        this.updateUI();
    }

    bindEvents() {
        // 鼠标事件
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this.onMouseLeave());

        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));

        // 键盘事件
        document.addEventListener('keydown', (e) => this.onKeyDown(e));

        // 按钮事件
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('nextBirdBtn').addEventListener('click', () => this.nextBird());
        document.getElementById('menuBtn').addEventListener('click', () => this.backToMenu());
    }

    onMouseDown(e) {
        if (this.isFlying || this.gameOver) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // 检查是否在弹弓位置附近
        const dx = x - this.currentBird.x;
        const dy = y - this.currentBird.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
            this.isAiming = true;
        }
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mousePos.x = e.clientX - rect.left;
        this.mousePos.y = e.clientY - rect.top;

        if (this.isAiming && !this.isFlying) {
            const dx = this.slingshot.x - this.mousePos.x;
            const dy = this.slingshot.y - this.mousePos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDrag = 80;

            if (distance > maxDrag) {
                const angle = Math.atan2(dy, dx);
                this.currentBird.x = this.slingshot.x - Math.cos(angle) * maxDrag;
                this.currentBird.y = this.slingshot.y - Math.sin(angle) * maxDrag;
            } else {
                this.currentBird.x = this.mousePos.x;
                this.currentBird.y = this.mousePos.y;
            }
        }
    }

    onMouseUp(e) {
        if (this.isAiming) {
            this.launchBird();
        }
        this.isAiming = false;
    }

    onMouseLeave() {
        this.isAiming = false;
    }

    onTouchStart(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        if (e.touches.length > 0) {
            const touch = e.touches[0];
            this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onTouchEnd(e) {
        e.preventDefault();
        if (e.changedTouches.length > 0) {
            const touch = e.changedTouches[0];
            this.onMouseUp({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }

    onKeyDown(e) {
        if (this.gameOver) return;

        if (e.key === ' ' && this.currentBird && !this.currentBird.launched) {
            this.launchBird();
        } else if (e.key === 'r' || e.key === 'R') {
            this.resetGame();
        } else if (e.key === 'n' || e.key === 'N') {
            this.nextBird();
        }
    }

    launchBird() {
        if (this.isFlying || this.currentBird.launched) return;

        const dx = this.slingshot.x - this.currentBird.x;
        const dy = this.slingshot.y - this.currentBird.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 10) return; // 拖拽距离太小不发射

        const power = Math.min(distance * 0.15, this.maxPower);
        const angle = Math.atan2(dy, dx);

        this.currentBird.vx = Math.cos(angle) * power;
        this.currentBird.vy = Math.sin(angle) * power;
        this.currentBird.launched = true;
        this.isFlying = true;

        // 隐藏下一个小鸟按钮
        document.getElementById('nextBirdBtn').style.display = 'none';
    }

    update() {
        if (this.gameOver) return;

        // 更新所有小鸟
        this.birds.forEach(bird => {
            if (!bird.launched) return;

            // 应用重力
            bird.vy += this.gravity;
            bird.x += bird.vx;
            bird.y += bird.vy;

            // 空气阻力
            bird.vx *= 0.99;

            // 边界碰撞
            if (bird.x - bird.radius < 0 || bird.x + bird.radius > this.canvas.width) {
                bird.vx = -bird.vx * 0.8;
                bird.x = bird.x - bird.radius < 0 ? bird.radius : this.canvas.width - bird.radius;
            }

            // 地面/天花板碰撞
            if (bird.y + bird.radius > this.canvas.height) {
                bird.y = this.canvas.height - bird.radius;
                bird.vy = -bird.vy * 0.6;
                bird.vx *= 0.8;

                // 如果速度很小，停止
                if (Math.abs(bird.vy) < 0.5 && Math.abs(bird.vx) < 0.5) {
                    this.birdLanded(bird);
                }
            } else if (bird.y - bird.radius < 0) {
                bird.y = bird.radius;
                bird.vy = -bird.vy * 0.8;
            }

            // 检测与方块的碰撞
            this.checkBlockCollisions(bird);
            // 检测与小猪的碰撞
            this.checkPigCollisions(bird);
        });

        // 更新粒子效果
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life--;
        });

        // 检查是否所有小鸟都用完
        const launchedBirds = this.birds.filter(b => b.launched);
        if (launchedBirds.length === this.birds.length && !this.isFlying && this.pigs.length > 0) {
            this.nextBird();
        }

        // 检查胜负
        if (this.pigs.length === 0 && !this.win) {
            this.win = true;
            this.gameOver = true;
            this.score += this.birdsLeft * 100; // 奖励剩余小鸟
            this.updateUI();
            setTimeout(() => alert(`🎉 胜利！所有小猪被击碎！\n最终得分: ${this.score}`), 100);
        } else if (this.birds.length === 0 && !this.win) {
            this.gameOver = true;
            setTimeout(() => alert(`💔 游戏结束！\n剩余小猪: ${this.pigs.length}\n最终得分: ${this.score}`), 100);
        }
    }

    checkBlockCollisions(bird) {
        for (let i = this.blocks.length - 1; i >= 0; i--) {
            const block = this.blocks[i];
            if (this.circleRectCollision(bird, block)) {
                // 伤害方块
                block.health -= 15;

                // 物理反弹
                const blockCenterX = block.x + block.width / 2;
                const blockCenterY = block.y + block.height / 2;
                const dx = bird.x - blockCenterX;
                const dy = bird.y - blockCenterY;
                const angle = Math.atan2(dy, dx);

                bird.vx = Math.cos(angle) * 3;
                bird.vy = Math.sin(angle) * 3 - 2;

                // 减少方块生命值
                if (block.health <= 0) {
                    this.createParticles(block.x + block.width / 2, block.y + block.height / 2, block.type);
                    this.blocks.splice(i, 1);
                } else {
                    this.createParticles(bird.x, bird.y, 'dust');
                }

                break; // 一次只碰撞一个方块
            }
        }
    }

    checkPigCollisions(bird) {
        for (let i = this.pigs.length - 1; i >= 0; i--) {
            const pig = this.pigs[i];
            const dx = bird.x - pig.x;
            const dy = bird.y - pig.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < bird.radius + pig.radius) {
                // 伤害小猪
                pig.health -= 30;

                // 反弹小鸟
                bird.vx = -bird.vx * 0.5;
                bird.vy = bird.vy * -0.5 - 1;

                // 创建粒子效果
                this.createParticles(pig.x, pig.y, 'pig');

                if (pig.health <= 0) {
                    this.pigs.splice(i, 1);
                    this.pigsLeft--;
                    this.score += 100;
                }

                break; // 一次只碰撞一个小猪
            }
        }
    }

    circleRectCollision(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;

        return (dx * dx + dy * dy) < (circle.radius * circle.radius);
    }

    createParticles(x, y, type) {
        const colors = {
            wood: ['#DEB887', '#D2691E', '#8B4513'],
            stone: ['#808080', '#696969', '#A9A9A9'],
            pig: ['#98FB98', '#90EE90'],
            dust: ['#F5DEB3', '#FFE4B5']
        };

        const particleColors = colors[type] || colors.dust;

        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                radius: Math.random() * 4 + 2,
                color: particleColors[Math.floor(Math.random() * particleColors.length)],
                life: 30
            });
        }
    }

    birdLanded(bird) {
        this.isFlying = false;
        bird.vx = 0;
        bird.vy = 0;
        this.currentBird = null;

        // 显示下一个小鸟按钮（如果有剩余）
        setTimeout(() => {
            if (this.birds.length < 3 && this.pigs.length > 0) {
                document.getElementById('nextBirdBtn').style.display = 'block';
            }
        }, 1000);
    }

    nextBird() {
        // 移除当前小鸟（如果已发射）
        const launchedIndex = this.birds.findIndex(b => b.launched);
        if (launchedIndex !== -1) {
            this.birds.splice(launchedIndex, 1);
        }

        if (this.birds.length < 3) {
            this.birds.push({
                x: this.slingshot.x,
                y: this.slingshot.y,
                radius: 15,
                color: '#DC143C',
                vx: 0,
                vy: 0,
                launched: false
            });
        }

        // 找到未发射的小鸟
        const nextBird = this.birds.find(b => !b.launched);
        if (nextBird) {
            this.currentBird = nextBird;
        } else {
            this.currentBird = null;
        }

        this.isFlying = false;
        document.getElementById('nextBirdBtn').style.display = 'none';

        if (this.currentBird) {
            // 重置弹弓位置
            this.currentBird.x = this.slingshot.x;
            this.currentBird.y = this.slingshot.y;
        }

        this.updateUI();
    }

    resetGame() {
        this.score = 0;
        this.gameOver = false;
        this.win = false;
        this.isAiming = false;
        this.isFlying = false;
        this.birds = [];
        this.pigs = [];
        this.blocks = [];
        this.particles = [];
        this.initLevel();
        document.getElementById('nextBirdBtn').style.display = 'none';
    }

    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制天空
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height * 0.7);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(1, '#B0E0E6');
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.7);

        // 绘制地面
        const groundGradient = this.ctx.createLinearGradient(0, this.canvas.height * 0.7, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#8B4513');
        groundGradient.addColorStop(1, '#654321');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.canvas.height * 0.7, this.canvas.width, this.canvas.height * 0.3);

        // 绘制弹弓
        this.drawSlingshot();

        // 绘制方块
        this.blocks.forEach(block => {
            const color = block.type === 'wood' ? '#DEB887' : '#A9A9A9';
            this.ctx.fillStyle = color;
            this.ctx.fillRect(block.x, block.y, block.width, block.height);
            this.ctx.strokeStyle = '#654321';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(block.x, block.y, block.width, block.height);

            // 显示方块生命值
            if (block.health < 60) {
                this.ctx.fillStyle = block.health > 30 ? '#FF8C00' : '#DC143C';
                this.ctx.fillRect(block.x, block.y - 8, (block.width * block.health) / 60, 4);
            }
        });

        // 绘制小猪
        this.pigs.forEach(pig => {
            this.drawPig(pig);
        });

        // 绘制小鸟
        this.birds.forEach(bird => {
            if (!bird.launched || this.isFlying) {
                this.drawBird(bird);
            }
        });

        // 绘制粒子效果
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 绘制瞄准线
        if (this.isAiming && this.currentBird) {
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.slingshot.x, this.slingshot.y);
            this.ctx.lineTo(this.currentBird.x, this.currentBird.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);

            // 绘制力度指示器
            const dx = this.slingshot.x - this.currentBird.x;
            const dy = this.slingshot.y - this.currentBird.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const power = Math.min(distance * 0.15, this.maxPower);

            this.ctx.fillStyle = `rgba(255, 255, 0, 0.7)`;
            this.ctx.fillText(`力度: ${power.toFixed(1)}`, this.currentBird.x + 10, this.currentBird.y - 10);
        }
    }

    drawSlingshot() {
        const x = this.slingshot.x;
        const y = this.slingshot.y;

        // 弹弓支架
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(x - 5, y - 50, 10, 80);
        this.ctx.fillRect(x + 30, y - 60, 8, 60);

        // 弹弓皮筋
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        if (this.currentBird) {
            this.ctx.moveTo(x - 5, y - 40);
            this.ctx.lineTo(this.currentBird.x, this.currentBird.y);
            this.ctx.moveTo(x + 30, y - 50);
            this.ctx.lineTo(this.currentBird.x, this.currentBird.y);
        } else {
            this.ctx.moveTo(x - 5, y - 40);
            this.ctx.lineTo(x - 10, y);
            this.ctx.moveTo(x + 30, y - 50);
            this.ctx.lineTo(x + 25, y);
        }
        this.ctx.stroke();
    }

    drawBird(bird) {
        // 身体
        this.ctx.fillStyle = bird.color;
        this.ctx.beginPath();
        this.ctx.arc(bird.x, bird.y, bird.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 眼睛
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(bird.x - 5, bird.y - 5, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(bird.x - 5, bird.y - 5, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // 喙
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.beginPath();
        this.ctx.moveTo(bird.x + 5, bird.y);
        this.ctx.lineTo(bird.x + 15, bird.y);
        this.ctx.lineTo(bird.x + 5, bird.y + 5);
        this.ctx.fill();

        // 眉毛
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(bird.x - 10, bird.y - 10);
        this.ctx.lineTo(bird.x - 2, bird.y - 8);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(bird.x + 10, bird.y - 10);
        this.ctx.lineTo(bird.x + 2, bird.y - 8);
        this.ctx.stroke();
    }

    drawPig(pig) {
        // 身体
        this.ctx.fillStyle = pig.color;
        this.ctx.beginPath();
        this.ctx.arc(pig.x, pig.y, pig.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // 边框
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // 耳朵
        this.ctx.beginPath();
        this.ctx.arc(pig.x - 10, pig.y - 12, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(pig.x + 10, pig.y - 12, 6, 0, Math.PI * 2);
        this.ctx.fill();

        // 鼻子
        this.ctx.fillStyle = '#FFB6C1';
        this.ctx.beginPath();
        this.ctx.arc(pig.x - 5, pig.y + 5, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(pig.x + 5, pig.y + 5, 6, 0, Math.PI * 2);
        this.ctx.fill();

        // 鼻孔
        this.ctx.fillStyle = '#8B0000';
        this.ctx.beginPath();
        this.ctx.arc(pig.x - 5, pig.y + 5, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(pig.x + 5, pig.y + 5, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // 眼睛
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(pig.x - 6, pig.y - 5, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(pig.x + 6, pig.y - 5, 2, 0, Math.PI * 2);
        this.ctx.fill();

        // 显示生命值
        if (pig.health < 30) {
            this.ctx.fillStyle = pig.health > 15 ? '#FF8C00' : '#DC143C';
            this.ctx.fillRect(pig.x - 15, pig.y - 30, (30 * pig.health) / 30, 4);
        }
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('birdsLeft').textContent = this.birds.length;
        document.getElementById('pigsLeft').textContent = this.pigs.length;
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    backToMenu() {
        window.location.href = 'index_new.html';
    }
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    window.game = new AngryBirdsGame('gameCanvas');
});

// 确保画布大小适配
window.addEventListener('resize', () => {
    if (window.game) {
        window.game.canvas.width = Math.min(800, window.innerWidth - 50);
        window.game.canvas.height = Math.min(500, window.innerHeight * 0.7);
    }
});