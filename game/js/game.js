import { PhysicsWorld, BIRD_PROPS } from './physics.js';
import { Slingshot, SLING_X, SLING_Y } from './slingshot.js';
import { Renderer } from './renderer.js';
import { Camera } from './camera.js';
import { ParticleSystem } from './particles.js';
import { SoundManager } from './sound.js';
import { saveProgress, loadProgress } from './utils.js';

const STATES = {
    MENU: 'menu',
    LEVEL_SELECT: 'levelSelect',
    PLAYING: 'playing',
    AIMING: 'aiming',
    LAUNCHED: 'launched',
    SETTLING: 'settling',
    NEXT_BIRD: 'nextBird',
    VICTORY: 'victory',
    GAMEOVER: 'gameover',
    PAUSED: 'paused',
    LEADERBOARD: 'leaderboard'
};

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.renderer = new Renderer(this.canvas);
        this.camera = new Camera(window.innerWidth, window.innerHeight);
        this.particles = new ParticleSystem();
        this.sound = new SoundManager();
        this.slingshot = new Slingshot();
        this.physics = null;
        this.state = STATES.MENU;
        this.prevState = null;
        this.levels = [];
        this.currentLevel = 0;
        this.score = 0;
        this.birdQueue = [];
        this.birdIndex = 0;
        this.activeBird = null;
        this.settleTimer = 0;
        this.nextBirdTimer = 0;
        this.progress = loadProgress() || { unlocked: 1, scores: {}, stars: {} };
        this.trajectoryPoints = [];
        this.lastTime = 0;

        this._initUI();
        this._loadLevels().then(() => {
            this.renderer.resize();
            this._bindInput();
            this._updateLevelGrid();
            requestAnimationFrame(t => this._loop(t));
        });
    }

    async _loadLevels() {
        try {
            const resp = await fetch('data/levels.json');
            const data = await resp.json();
            this.levels = data.levels;
        } catch (e) {
            console.error('Failed to load levels:', e);
            this.levels = [];
        }
    }

    _initUI() {
        // Start menu
        document.getElementById('btn-play').addEventListener('click', () => {
            this.sound.init();
            this.sound.click();
            this._showScreen('level-select');
            this.state = STATES.LEVEL_SELECT;
        });

        document.getElementById('btn-leaderboard').addEventListener('click', () => {
            this.sound.init();
            this.sound.click();
            this._showLeaderboard();
        });

        document.getElementById('sound-toggle').addEventListener('click', () => {
            this.sound.init();
            const muted = this.sound.toggle();
            document.getElementById('sound-toggle').classList.toggle('muted', muted);
            document.getElementById('sound-icon').textContent = muted ? '\u{1f507}' : '\u{1f50a}';
        });

        // Level select
        document.getElementById('btn-back-menu').addEventListener('click', () => {
            this.sound.click();
            this._showScreen('start-menu');
            this.state = STATES.MENU;
        });

        // Pause
        document.getElementById('btn-pause').addEventListener('click', () => {
            this.sound.click();
            this._pause();
        });

        document.getElementById('btn-resume').addEventListener('click', () => {
            this.sound.click();
            this._resume();
        });

        document.getElementById('btn-restart').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('pause-menu');
            this._startLevel(this.currentLevel);
        });

        document.getElementById('btn-quit').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('pause-menu');
            this._hideScreen('hud');
            this._showScreen('level-select');
            this.state = STATES.LEVEL_SELECT;
        });

        // Victory
        document.getElementById('btn-next-level').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('victory-screen');
            if (this.currentLevel + 1 < this.levels.length) {
                this._startLevel(this.currentLevel + 1);
            } else {
                this._hideScreen('hud');
                this._showScreen('level-select');
                this.state = STATES.LEVEL_SELECT;
            }
        });

        document.getElementById('btn-replay').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('victory-screen');
            this._startLevel(this.currentLevel);
        });

        document.getElementById('btn-victory-menu').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('victory-screen');
            this._hideScreen('hud');
            this._showScreen('level-select');
            this.state = STATES.LEVEL_SELECT;
        });

        // Game over
        document.getElementById('btn-retry').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('gameover-screen');
            this._startLevel(this.currentLevel);
        });

        document.getElementById('btn-gameover-menu').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('gameover-screen');
            this._hideScreen('hud');
            this._showScreen('level-select');
            this.state = STATES.LEVEL_SELECT;
        });

        // Leaderboard
        document.getElementById('btn-back-leaderboard').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('leaderboard-screen');
            this._showScreen('start-menu');
            this.state = STATES.MENU;
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.renderer.resize();
            this.camera.resize(window.innerWidth, window.innerHeight);
        });
    }

    _bindInput() {
        const getPos = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const screenX = clientX - rect.left;
            const screenY = clientY - rect.top;
            return this.camera.screenToWorld(screenX, screenY);
        };

        const onDown = (e) => {
            if (this.state !== STATES.AIMING || !this.activeBird) return;
            e.preventDefault();
            const pos = getPos(e);
            const props = BIRD_PROPS[this.activeBird.gameData.type];
            if (this.slingshot.startPull(pos.x, pos.y, props.radius)) {
                Matter.Body.setStatic(this.activeBird, true);
            }
        };

        const onMove = (e) => {
            if (!this.slingshot.pulling) return;
            e.preventDefault();
            const pos = getPos(e);
            this.slingshot.updatePull(pos.x, pos.y);
            Matter.Body.setPosition(this.activeBird, {
                x: this.slingshot.birdX,
                y: this.slingshot.birdY
            });
            const trajInput = this.slingshot.getTrajectoryInput();
            if (trajInput) {
                this.trajectoryPoints = this.physics.predictTrajectory(
                    trajInput.startX, trajInput.startY,
                    trajInput.vx, trajInput.vy
                );
                this.sound.stretch(this.slingshot.pullDist);
            }
        };

        const onUp = (e) => {
            if (!this.slingshot.pulling) return;
            e.preventDefault();
            const result = this.slingshot.release();
            this.trajectoryPoints = [];
            if (result && this.activeBird) {
                this.physics.launchBird(this.activeBird, result.velocity);
                this.camera.follow(this.activeBird);
                this.sound.launch();
                this.state = STATES.LAUNCHED;
                this.settleTimer = 0;
            }
        };

        this.canvas.addEventListener('mousedown', onDown);
        this.canvas.addEventListener('mousemove', onMove);
        this.canvas.addEventListener('mouseup', onUp);
        this.canvas.addEventListener('touchstart', onDown, { passive: false });
        this.canvas.addEventListener('touchmove', onMove, { passive: false });
        this.canvas.addEventListener('touchend', onUp, { passive: false });

        // Bird ability activation (click/tap while bird is in flight)
        const onActivate = (e) => {
            if (this.state !== STATES.LAUNCHED || !this.activeBird) return;
            if (this.activeBird.gameData.activated) return;
            this._activateAbility();
        };

        this.canvas.addEventListener('click', (e) => {
            if (this.state === STATES.LAUNCHED) onActivate(e);
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state === STATES.PAUSED) this._resume();
                else if ([STATES.PLAYING, STATES.AIMING, STATES.LAUNCHED, STATES.SETTLING, STATES.NEXT_BIRD].includes(this.state)) {
                    this._pause();
                }
            }
            if (e.key === ' ' && this.state === STATES.LAUNCHED) {
                onActivate(e);
            }
        });
    }

    _activateAbility() {
        const bird = this.activeBird;
        if (!bird || bird.gameData.activated) return;
        bird.gameData.activated = true;
        const type = bird.gameData.type;

        if (type === 'blue') {
            // Split into 3
            const pos = bird.position;
            const vel = bird.velocity;
            const spreadAngle = 0.3;
            for (let i = -1; i <= 1; i++) {
                if (i === 0) continue;
                const angle = Math.atan2(vel.y, vel.x) + spreadAngle * i;
                const speed = Math.hypot(vel.x, vel.y);
                const newBird = this.physics.createBird('blue', pos.x, pos.y);
                Matter.Body.setVelocity(newBird, {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                });
                newBird.gameData.activated = true;
            }
            this.sound.launch();
        } else if (type === 'yellow') {
            // Speed boost
            const vel = bird.velocity;
            const angle = Math.atan2(vel.y, vel.x);
            const speed = Math.hypot(vel.x, vel.y) * 2.5;
            Matter.Body.setVelocity(bird, {
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed
            });
            this.particles.emit(bird.position.x, bird.position.y, 10,
                ['#ffd700', '#ffaa00', '#ffffff'], 3, [2, 4], [10, 20]);
            this.sound.launch();
        } else if (type === 'black') {
            // Explode
            this.physics.applyExplosion(
                bird.position.x, bird.position.y, 120, 0.08
            );
            this.particles.explode(bird.position.x, bird.position.y);
            this.sound.explosion();
            // Damage the bird itself to remove it
            setTimeout(() => {
                if (this.physics.birds.includes(bird)) {
                    this.physics.removeBird(bird);
                }
            }, 100);
        }
    }

    _showScreen(id) {
        document.getElementById(id).classList.add('active');
    }

    _hideScreen(id) {
        document.getElementById(id).classList.remove('active');
    }

    _hideAllScreens() {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    }

    _updateLevelGrid() {
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';
        this.levels.forEach((level, i) => {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            const locked = i + 1 > this.progress.unlocked;
            if (locked) btn.classList.add('locked');
            const stars = this.progress.stars[i + 1] || 0;
            const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars);
            btn.innerHTML = `<span>${i + 1}</span><span class="level-stars">${locked ? '\u{1f512}' : starStr}</span>`;
            if (!locked) {
                btn.addEventListener('click', () => {
                    this.sound.click();
                    this._startLevel(i);
                });
            }
            grid.appendChild(btn);
        });
    }

    _showLeaderboard() {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        for (let i = 1; i <= this.levels.length; i++) {
            const score = this.progress.scores[i] || 0;
            const stars = this.progress.stars[i] || 0;
            if (score === 0 && stars === 0) continue;
            const entry = document.createElement('div');
            entry.className = 'leaderboard-entry';
            entry.innerHTML = `
                <span class="lb-level">Level ${i}</span>
                <span class="lb-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
                <span class="lb-score">${score.toLocaleString()}</span>
            `;
            list.appendChild(entry);
        }
        if (list.children.length === 0) {
            list.innerHTML = '<p style="color:#a8b2d1; padding:20px;">No scores yet. Play some levels!</p>';
        }
        this._hideAllScreens();
        this._showScreen('leaderboard-screen');
        this.state = STATES.LEADERBOARD;
    }

    _startLevel(index) {
        this.currentLevel = index;
        const level = this.levels[index];

        this._hideAllScreens();
        this._showScreen('hud');

        document.getElementById('hud-level').textContent = `Level ${level.id}`;
        this.score = 0;
        this._updateScore();

        // Setup physics
        this.physics = new PhysicsWorld((a, b, speed, damage) => {
            this._onCollision(a, b, speed, damage);
        });
        this.physics.createGround(1200);

        // Create structures
        for (const s of level.structures) {
            this.physics.addStructure(s.type, s.x, s.y, s.w, s.h);
        }

        // Create pigs
        for (const p of level.pigs) {
            this.physics.addPig(p.x, p.y, p.r);
        }

        // Setup birds
        this.birdQueue = [...level.birds];
        this.birdIndex = 0;
        this._updateBirdQueue();
        this._loadNextBird();

        // Reset camera
        this.camera.reset();
        this.particles = new ParticleSystem();
        this.trajectoryPoints = [];

        this.state = STATES.AIMING;
    }

    _loadNextBird() {
        if (this.birdIndex >= this.birdQueue.length) {
            this.activeBird = null;
            return;
        }
        const type = this.birdQueue[this.birdIndex];
        this.activeBird = this.physics.createBird(type, SLING_X, SLING_Y);
        Matter.Body.setStatic(this.activeBird, true);
        this.slingshot.resetPosition();
    }

    _onCollision(a, b, speed, damage) {
        const intensity = Math.min(1, speed / 10);

        if (a.label === 'bird' || b.label === 'bird') {
            this.sound.collision(intensity);
            this.particles.dust(
                (a.position.x + b.position.x) / 2,
                (a.position.y + b.position.y) / 2
            );
        } else if (speed > 3) {
            this.sound.collision(intensity * 0.5);
        }
    }

    _checkDestroyed() {
        const destroyedStructures = this.physics.getDestroyedStructures();
        for (const s of destroyedStructures) {
            this.particles.shatter(s.position.x, s.position.y, s.gameData.type);
            this.sound.destroy();
            const points = s.gameData.type === 'stone' ? 500 : s.gameData.type === 'wood' ? 300 : 200;
            this.score += points;
        }

        const destroyedPigs = this.physics.getDestroyedPigs();
        for (const p of destroyedPigs) {
            this.particles.pigPop(p.position.x, p.position.y);
            this.sound.pigSqueal();
            this.score += 1000;
        }

        if (destroyedStructures.length > 0 || destroyedPigs.length > 0) {
            this._updateScore();
        }
    }

    _updateScore() {
        document.getElementById('hud-score').textContent = `Score: ${this.score.toLocaleString()}`;
    }

    _updateBirdQueue() {
        const container = document.getElementById('bird-queue');
        container.innerHTML = '';
        for (let i = this.birdIndex + 1; i < this.birdQueue.length; i++) {
            const type = this.birdQueue[i];
            const props = BIRD_PROPS[type];
            const el = document.createElement('div');
            el.className = 'bird-icon';
            el.style.background = props.color;
            container.appendChild(el);
        }
    }

    _pause() {
        this.prevState = this.state;
        this.state = STATES.PAUSED;
        this._showScreen('pause-menu');
    }

    _resume() {
        this._hideScreen('pause-menu');
        this.state = this.prevState || STATES.AIMING;
    }

    _showVictory() {
        const level = this.levels[this.currentLevel];
        const birdsLeft = this.birdQueue.length - this.birdIndex - 1;
        const birdBonus = Math.max(0, birdsLeft) * 2000;
        this.score += birdBonus;

        let stars = 0;
        if (this.score >= level.threeStarScore) stars = 3;
        else if (this.score >= level.twoStarScore) stars = 2;
        else if (this.score >= level.oneStarScore) stars = 1;

        // Update progress
        const levelNum = this.currentLevel + 1;
        if (!this.progress.scores[levelNum] || this.score > this.progress.scores[levelNum]) {
            this.progress.scores[levelNum] = this.score;
        }
        if (!this.progress.stars[levelNum] || stars > this.progress.stars[levelNum]) {
            this.progress.stars[levelNum] = stars;
        }
        if (levelNum >= this.progress.unlocked) {
            this.progress.unlocked = Math.min(levelNum + 1, this.levels.length);
        }
        saveProgress(this.progress);
        this._updateLevelGrid();

        // Display
        const starsHtml = [1, 2, 3].map(i => {
            const earned = i <= stars;
            return `<span class="star ${earned ? 'earned' : 'empty'}" style="animation-delay: ${i * 0.2}s">★</span>`;
        }).join('');
        document.getElementById('stars-display').innerHTML = starsHtml;
        document.getElementById('final-score').textContent = `Score: ${this.score.toLocaleString()}${birdBonus > 0 ? ` (+${birdBonus.toLocaleString()} bird bonus)` : ''}`;

        const nextBtn = document.getElementById('btn-next-level');
        nextBtn.style.display = (this.currentLevel + 1 < this.levels.length) ? 'block' : 'none';

        this._showScreen('victory-screen');
        this.sound.victory();
        this.state = STATES.VICTORY;
    }

    _showGameOver() {
        this._showScreen('gameover-screen');
        this.sound.defeat();
        this.state = STATES.GAMEOVER;
    }

    _loop(time) {
        const delta = Math.min(time - (this.lastTime || time), 32);
        this.lastTime = time;

        this._update(delta);
        this._draw();

        requestAnimationFrame(t => this._loop(t));
    }

    _update(delta) {
        if (this.state === STATES.PAUSED || this.state === STATES.VICTORY ||
            this.state === STATES.GAMEOVER || this.state === STATES.MENU ||
            this.state === STATES.LEVEL_SELECT || this.state === STATES.LEADERBOARD) {
            return;
        }

        this.physics.update(delta);
        this.camera.update();
        this.particles.update();
        this._checkDestroyed();

        if (this.state === STATES.LAUNCHED) {
            // Check if bird has stopped or gone off-screen
            if (this.activeBird) {
                const bird = this.activeBird;
                const speed = Math.hypot(bird.velocity.x, bird.velocity.y);
                const offScreen = bird.position.y > 500 || bird.position.x > 1300 || bird.position.x < -100;

                if (bird.gameData.hasCollided || offScreen) {
                    this.settleTimer++;
                }

                if (this.settleTimer > 30 && (speed < 0.5 || offScreen)) {
                    this.camera.stopFollowing();
                    this.state = STATES.SETTLING;
                    this.settleTimer = 0;
                }

                // Hard timeout
                if (this.settleTimer > 180) {
                    this.camera.stopFollowing();
                    this.state = STATES.SETTLING;
                    this.settleTimer = 0;
                }
            }
        }

        if (this.state === STATES.SETTLING) {
            this.settleTimer++;
            if (this.settleTimer > 60 && this.physics.isSettled()) {
                this._advanceAfterBird();
            }
            if (this.settleTimer > 180) {
                this._advanceAfterBird();
            }
        }

        if (this.state === STATES.NEXT_BIRD) {
            this.nextBirdTimer++;
            if (this.nextBirdTimer > 30) {
                this._loadNextBird();
                this._updateBirdQueue();
                this.camera.goHome();
                this.state = STATES.AIMING;
                this.nextBirdTimer = 0;
            }
        }
    }

    _advanceAfterBird() {
        // Remove active bird from world
        if (this.activeBird && this.physics.birds.includes(this.activeBird)) {
            this.physics.removeBird(this.activeBird);
        }
        // Also remove any split birds
        const extraBirds = [...this.physics.birds];
        extraBirds.forEach(b => this.physics.removeBird(b));

        // Check win/lose
        if (this.physics.pigs.length === 0) {
            this._showVictory();
            return;
        }

        this.birdIndex++;
        if (this.birdIndex >= this.birdQueue.length) {
            this._showGameOver();
            return;
        }

        this.state = STATES.NEXT_BIRD;
        this.nextBirdTimer = 0;
        this.settleTimer = 0;
    }

    _draw() {
        const ctx = this.renderer.ctx;
        this.renderer.clear();

        if ([STATES.MENU, STATES.LEVEL_SELECT, STATES.LEADERBOARD].includes(this.state)) {
            // Draw animated background for menus
            this.renderer.drawBackground();
            return;
        }

        this.camera.apply(ctx);

        // Background
        this.renderer.drawBackground();

        // Slingshot (back part)
        this.slingshot.draw(ctx);

        // Trajectory
        if (this.slingshot.pulling) {
            this.slingshot.drawTrajectory(ctx, this.trajectoryPoints);
        }

        // Structures
        for (const s of this.physics.structures) {
            this.renderer.drawStructure(s);
        }

        // Pigs
        for (const p of this.physics.pigs) {
            this.renderer.drawPig(p);
        }

        // Birds
        for (const b of this.physics.birds) {
            this.renderer.drawBird(b);
        }

        // Slingshot front band (drawn over bird)
        if (this.slingshot.pulling) {
            this.slingshot.drawFrontBand(ctx);
        }

        // Particles
        this.particles.draw(ctx);

        this.camera.restore(ctx);
    }
}

// Boot
const game = new Game();
