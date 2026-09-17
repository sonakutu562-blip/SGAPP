import { PhysicsWorld, BIRD_PROPS } from './physics.js';
import { Slingshot, SLING_X, SLING_Y } from './slingshot.js';
import { Renderer } from './renderer.js';
import { Camera } from './camera.js';
import { ParticleSystem } from './particles.js';
import { SoundManager } from './sound.js';
import { saveProgress, loadProgress } from './utils.js';
import { getLevel, TOTAL_LEVELS } from './levels.js';
import { WORLDS, WORLD_STARTS, worldOf } from './worlds.js';

const STATES = {
    MENU: 'menu',
    WORLDS: 'worlds',
    LEVEL_SELECT: 'levelSelect',
    AIMING: 'aiming',
    LAUNCHED: 'launched',
    SETTLING: 'settling',
    NEXT_BIRD: 'nextBird',
    VICTORY: 'victory',
    GAMEOVER: 'gameover',
    PAUSED: 'paused',
    LEADERBOARD: 'leaderboard',
    ACHIEVEMENTS: 'achievements'
};

const ACH_DEF = [
    { id: 'first_pig', name: 'Pig Popper', desc: 'Destroy your first pig', icon: '\u{1f437}' },
    { id: 'one_bird', name: 'Sharpshooter', desc: 'Complete a level with 1 bird', icon: '\u{1f3af}' },
    { id: 'three_star', name: 'Perfectionist', desc: 'Get 3 stars on any level', icon: '⭐' },
    { id: 'world2', name: 'Explorer', desc: 'Reach World 2', icon: '\u{1f5fa}️' },
    { id: 'world5', name: 'Adventurer', desc: 'Reach World 5', icon: '\u{1f3d4}️' },
    { id: 'world10', name: 'Champion', desc: 'Reach the Final Frontier', icon: '\u{1f680}' },
    { id: 'combo5', name: 'Combo King', desc: 'Get a 5x combo', icon: '\u{1f525}' },
    { id: 'tnt3', name: 'Chain Reaction', desc: 'Trigger 3 TNT chain', icon: '\u{1f4a5}' },
    { id: 'score100k', name: 'High Scorer', desc: 'Score 100,000 total', icon: '\u{1f4b0}' },
    { id: 'all_birds', name: 'Bird Watcher', desc: 'Use all 6 bird types', icon: '\u{1f426}' },
    { id: 'beat_game', name: 'Fowl Play', desc: 'Complete all 108 levels', icon: '\u{1f3c6}' },
    { id: 'stars50', name: 'Star Collector', desc: 'Earn 50 total stars', icon: '✨' }
];

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
        this.currentLevel = 0;
        this.currentWorld = 0;
        this.score = 0;
        this.birdQueue = [];
        this.birdIndex = 0;
        this.activeBird = null;
        this.extraBirds = [];
        this.settleTimer = 0;
        this.nextBirdTimer = 0;
        this.tipTimer = 120;
        this.trajectoryPoints = [];
        this.lastTime = 0;
        this.levelWind = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.tntChainCurrent = 0;

        this.progress = {};
        this.totalScore = 0;
        this.achList = [];
        this.birdsUsedSet = new Set();
        this.tntChainMax = 0;
        this._loadSaveData();

        this._initUI();
        this.renderer.resize();
        this._bindInput();
        requestAnimationFrame(t => this._loop(t));
    }

    _loadSaveData() {
        const data = loadProgress();
        if (data) {
            this.progress = data.p || {};
            this.totalScore = data.ts || 0;
            this.achList = data.a || [];
            this.birdsUsedSet = new Set(data.bu || []);
            this.tntChainMax = data.tc || 0;
        }
    }

    _saveData() {
        saveProgress({
            p: this.progress,
            ts: this.totalScore,
            a: this.achList,
            bu: [...this.birdsUsedSet],
            tc: this.tntChainMax
        });
    }

    _initUI() {
        document.getElementById('btn-play').addEventListener('click', () => {
            this.sound.init();
            this.sound.click();
            this._showWorlds();
        });

        document.getElementById('btn-leaderboard').addEventListener('click', () => {
            this.sound.init();
            this.sound.click();
            this._showLeaderboard();
        });

        document.getElementById('btn-achievements').addEventListener('click', () => {
            this.sound.init();
            this.sound.click();
            this._showAchievements();
        });

        document.getElementById('sound-toggle').addEventListener('click', () => {
            this.sound.init();
            const muted = this.sound.toggle();
            document.getElementById('sound-toggle').classList.toggle('muted', muted);
            document.getElementById('sound-icon').textContent = muted ? '\u{1f507}' : '\u{1f50a}';
        });

        document.getElementById('btn-back-worlds').addEventListener('click', () => {
            this.sound.click();
            this._showScreen('start-menu');
            this.state = STATES.MENU;
        });

        document.getElementById('btn-back-levels').addEventListener('click', () => {
            this.sound.click();
            this._showWorlds();
        });

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
            this._showWorlds();
        });

        document.getElementById('btn-next-level').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('victory-screen');
            if (this.currentLevel < TOTAL_LEVELS - 1) {
                this._startLevel(this.currentLevel + 1);
            } else {
                this._hideScreen('hud');
                this._showWorlds();
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
            this._showWorlds();
        });

        document.getElementById('btn-retry').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('gameover-screen');
            this._startLevel(this.currentLevel);
        });

        document.getElementById('btn-gameover-menu').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('gameover-screen');
            this._hideScreen('hud');
            this._showWorlds();
        });

        document.getElementById('btn-back-leaderboard').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('leaderboard-screen');
            this._showScreen('start-menu');
            this.state = STATES.MENU;
        });

        document.getElementById('btn-back-achievements').addEventListener('click', () => {
            this.sound.click();
            this._hideScreen('achievements-screen');
            this._showScreen('start-menu');
            this.state = STATES.MENU;
        });

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
                this.tipTimer = 0;
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

        const onActivate = () => {
            if (this.state !== STATES.LAUNCHED || !this.activeBird) return;
            if (this.activeBird.gameData.activated) return;
            this._activateAbility();
        };

        this.canvas.addEventListener('click', () => {
            if (this.state === STATES.LAUNCHED) onActivate();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state === STATES.PAUSED) this._resume();
                else if ([STATES.AIMING, STATES.LAUNCHED, STATES.SETTLING, STATES.NEXT_BIRD].includes(this.state)) {
                    this._pause();
                }
            }
            if (e.key === ' ' && this.state === STATES.LAUNCHED) {
                onActivate();
            }
        });
    }

    _activateAbility() {
        const bird = this.activeBird;
        if (!bird || bird.gameData.activated) return;
        bird.gameData.activated = true;
        const type = bird.gameData.type;
        const pos = bird.position;
        const vel = bird.velocity;

        if (type === 'blue') {
            const sp = Math.hypot(vel.x, vel.y);
            const a = Math.atan2(vel.y, vel.x);
            for (let i = -1; i <= 1; i += 2) {
                const nb = this.physics.createBird('blue', pos.x, pos.y);
                Matter.Body.setVelocity(nb, {
                    x: Math.cos(a + i * 0.25) * sp,
                    y: Math.sin(a + i * 0.25) * sp
                });
                nb.gameData.activated = true;
                this.extraBirds.push(nb);
            }
            this.sound.launch();
        } else if (type === 'yellow') {
            const a = Math.atan2(vel.y, vel.x);
            const sp = Math.hypot(vel.x, vel.y);
            Matter.Body.setVelocity(bird, {
                x: Math.cos(a) * sp * 1.8,
                y: Math.sin(a) * sp * 1.8
            });
            this.particles.emit(pos.x, pos.y, 10,
                ['#ffd700', '#ffaa00', '#ffffff'], 3, [2, 4], [10, 20]);
            this.sound.launch();
        } else if (type === 'black') {
            this.physics.applyExplosion(pos.x, pos.y, 120, 0.06);
            this.particles.emit(pos.x, pos.y, 40,
                ['#ff4400', '#ff8800', '#ffcc00', '#333'], 4, [3, 6], [15, 30]);
            this.sound.explosion();
        } else if (type === 'green') {
            Matter.Body.setVelocity(bird, { x: -vel.x, y: vel.y * 0.7 - 2 });
            this.particles.emit(pos.x, pos.y, 8,
                ['#33cc44', '#66ff66', '#fff'], 2, [2, 3], [8, 15]);
            this.sound.launch();
        } else if (type === 'white') {
            this.physics.createEgg(pos.x, pos.y);
            Matter.Body.setVelocity(bird, { x: vel.x, y: vel.y - 6 });
            this.particles.emit(pos.x, pos.y, 6,
                ['#fff', '#eee', '#ddd'], 3, [2, 3], [5, 10]);
            this.sound.launch();
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

    _isWorldUnlocked(w) {
        if (w === 0) return true;
        let done = 0;
        for (let i = WORLD_STARTS[w - 1]; i < WORLD_STARTS[w]; i++) {
            if (this.progress[i] && this.progress[i].stars > 0) done++;
        }
        return done >= 6;
    }

    _isLevelUnlocked(id) {
        const w = worldOf(id);
        if (!this._isWorldUnlocked(w)) return false;
        if (id === WORLD_STARTS[w]) return true;
        return this.progress[id - 1] && this.progress[id - 1].stars > 0;
    }

    _getWorldStars(w) {
        let s = 0;
        for (let i = WORLD_STARTS[w]; i < WORLD_STARTS[w + 1]; i++) {
            s += (this.progress[i] ? this.progress[i].stars : 0);
        }
        return s;
    }

    _showWorlds() {
        const grid = document.getElementById('world-grid');
        grid.innerHTML = '';
        WORLDS.forEach((w, i) => {
            const d = document.createElement('div');
            d.className = 'world-card';
            const ul = this._isWorldUnlocked(i);
            if (!ul) d.classList.add('locked');
            d.style.background = `linear-gradient(135deg, ${w.sky[0]}, ${w.sky[2] || w.sky[1]})`;
            const tot = (WORLD_STARTS[i + 1] - WORLD_STARTS[i]) * 3;
            d.innerHTML = `<div class="world-num">${i + 1}</div><div class="world-name">${w.name}</div><div class="world-stars">${this._getWorldStars(i)}/${tot} ★</div>`;
            if (ul) {
                d.addEventListener('click', () => {
                    this.sound.click();
                    this._showLevels(i);
                });
            }
            grid.appendChild(d);
        });
        this._hideAllScreens();
        this._showScreen('world-select');
        this.state = STATES.WORLDS;
    }

    _showLevels(w) {
        this.currentWorld = w;
        document.getElementById('world-title').textContent = WORLDS[w].name;
        const grid = document.getElementById('level-grid');
        grid.innerHTML = '';
        for (let i = WORLD_STARTS[w]; i < WORLD_STARTS[w + 1]; i++) {
            const btn = document.createElement('button');
            btn.className = 'level-btn';
            const ul = this._isLevelUnlocked(i);
            if (!ul) btn.classList.add('locked');
            const st = this.progress[i] ? this.progress[i].stars : 0;
            btn.innerHTML = `<span>${i + 1}</span><div class="level-stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</div>`;
            if (ul) {
                btn.addEventListener('click', () => {
                    this.sound.click();
                    this._startLevel(i);
                });
            }
            grid.appendChild(btn);
        }
        this._hideAllScreens();
        this._showScreen('level-select');
        this.state = STATES.LEVEL_SELECT;
    }

    _showLeaderboard() {
        const list = document.getElementById('leaderboard-list');
        list.innerHTML = '';
        const sorted = Object.entries(this.progress)
            .sort((a, b) => (b[1].score || 0) - (a[1].score || 0))
            .slice(0, 20);
        if (sorted.length === 0) {
            list.innerHTML = '<p style="color:#a8b2d1; padding:20px;">Play some levels first!</p>';
        } else {
            sorted.forEach(([id, d]) => {
                const entry = document.createElement('div');
                entry.className = 'leaderboard-entry';
                entry.innerHTML = `<span>Level ${(+id) + 1}</span><span>${'★'.repeat(d.stars)}${'☆'.repeat(3 - d.stars)} ${(d.score || 0).toLocaleString()}</span>`;
                list.appendChild(entry);
            });
            const te = document.createElement('div');
            te.className = 'leaderboard-entry total-entry';
            te.innerHTML = `<span>Total</span><span>${this.totalScore.toLocaleString()}</span>`;
            list.appendChild(te);
        }
        this._hideAllScreens();
        this._showScreen('leaderboard-screen');
        this.state = STATES.LEADERBOARD;
    }

    _showAchievements() {
        const grid = document.getElementById('achievements-grid');
        grid.innerHTML = '';
        ACH_DEF.forEach(a => {
            const d = document.createElement('div');
            d.className = 'ach-card' + (this.achList.includes(a.id) ? ' unlocked' : '');
            d.innerHTML = `<div class="ach-icon">${a.icon}</div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div>`;
            grid.appendChild(d);
        });
        this._hideAllScreens();
        this._showScreen('achievements-screen');
        this.state = STATES.ACHIEVEMENTS;
    }

    _addScore(pts) {
        if (this.comboTimer > 0) this.comboCount++;
        else this.comboCount = 1;
        this.comboTimer = 45;
        const mult = Math.min(this.comboCount, 10);
        this.score += pts * mult;

        if (mult >= 2) {
            const ce = document.getElementById('combo-popup');
            ce.textContent = '×' + mult + ' COMBO!';
            ce.classList.add('show');
            setTimeout(() => ce.classList.remove('show'), 600);
            this.sound.combo();
        }
        if (this.comboCount >= 5 && !this.achList.includes('combo5')) {
            this.achList.push('combo5');
            this._saveData();
        }
        document.getElementById('hud-score').textContent = 'Score: ' + this.score.toLocaleString();
    }

    _checkAchievements() {
        const unlock = (id) => {
            if (!this.achList.includes(id)) {
                this.achList.push(id);
                this._saveData();
            }
        };
        if (this.totalScore >= 100000) unlock('score100k');
        if (this.birdsUsedSet.size >= 6) unlock('all_birds');
        let totStars = 0, totDone = 0;
        for (const k in this.progress) {
            totStars += this.progress[k].stars;
            if (this.progress[k].stars > 0) totDone++;
        }
        if (totStars >= 50) unlock('stars50');
        if (totDone >= 108) unlock('beat_game');
        if (this._isWorldUnlocked(1)) unlock('world2');
        if (this._isWorldUnlocked(4)) unlock('world5');
        if (this._isWorldUnlocked(9)) unlock('world10');
    }

    _startLevel(index) {
        this.sound.init();
        this.currentLevel = index;
        this.currentWorld = worldOf(index);
        this.score = 0;
        this.birdIndex = 0;
        this.comboCount = 0;
        this.comboTimer = 0;
        this.tntChainCurrent = 0;
        this.extraBirds = [];

        const level = getLevel(index);
        this.birdQueue = level.birds;
        this.levelWind = level.wind || 0;

        this._hideAllScreens();
        this._showScreen('hud');

        document.getElementById('hud-level').textContent = `Level ${index + 1}`;
        this.score = 0;
        this._updateScoreDisplay();

        const windEl = document.getElementById('wind-indicator');
        if (this.levelWind !== 0) {
            const dir = this.levelWind > 0 ? '→' : '←';
            const str = Math.abs(this.levelWind) > 0.0002 ? 'Strong' : 'Light';
            windEl.textContent = str + ' Wind ' + dir;
            windEl.style.display = 'block';
        } else {
            windEl.style.display = 'none';
        }

        this.physics = new PhysicsWorld((a, b, speed, damage, type) => {
            this._onCollision(a, b, speed, damage, type);
        });
        this.physics.createGround(1200);

        for (const s of level.structs) {
            this.physics.addStructure(s.t, s.x, s.y, s.w, s.h);
        }
        for (const p of level.pigs) {
            this.physics.addPig(p.x, p.y, p.r);
        }

        this.activeBird = this.physics.createBird(this.birdQueue[0], SLING_X, SLING_Y);
        Matter.Body.setStatic(this.activeBird, true);
        this.birdsUsedSet.add(this.birdQueue[0]);

        this._updateBirdQueue();
        this.slingshot.resetPosition();
        this.camera.reset();
        this.particles = new ParticleSystem();
        this.trajectoryPoints = [];
        this.settleTimer = 0;
        this.tipTimer = 120;

        this.state = STATES.AIMING;
    }

    _onCollision(a, b, speed, damage, type) {
        if (type === 'egg_explode') {
            this.particles.emit(
                (a.position.x + b.position.x) / 2,
                (a.position.y + b.position.y) / 2,
                20, ['#fff', '#ffd', '#ff8'], 3, [1, 3], [10, 20]
            );
            this._addScore(300);
            return;
        }
        if (speed > 5) {
            const cx = a.position ? a.position.x : 0;
            const cy = a.position ? a.position.y : 0;
            this.particles.emit(cx, cy, 3, ['#ddd', '#bbb'], 2, [1, 2], [2, 5]);
        }
    }

    _checkDestroyed() {
        const destroyedStructures = this.physics.getDestroyedStructures();
        for (const s of destroyedStructures) {
            if (s.gameData.isTnt) {
                this.tntChainCurrent++;
                this.physics.applyExplosion(s.position.x, s.position.y, 120, 0.06);
                this.particles.emit(s.position.x, s.position.y, 30,
                    ['#ff4400', '#ff8800', '#ffcc00'], 4, [2, 5], [12, 25]);
                this.sound.explosion();
                this._addScore(500);
                if (this.tntChainCurrent >= 3 && !this.achList.includes('tnt3')) {
                    this.achList.push('tnt3');
                    this._saveData();
                }
            } else {
                this.particles.emit(s.position.x, s.position.y, 8,
                    [s.gameData.type === 'wood' ? '#c4813d' : s.gameData.type === 'glass' ? '#88ccff' : '#999', '#ddd'],
                    2, [1, 3], [3, 8]);
                this.sound.destroy();
                this._addScore(Math.ceil(s.gameData.maxHp));
            }
        }

        const destroyedPigs = this.physics.getDestroyedPigs();
        for (const p of destroyedPigs) {
            this.particles.emit(p.position.x, p.position.y, 15,
                ['#66cc44', '#88ee66', '#aaffaa'], 3, [2, 4], [5, 12]);
            this.sound.pigSqueal();
            this._addScore(500);
            if (!this.achList.includes('first_pig')) {
                this.achList.push('first_pig');
                this._saveData();
            }
        }
    }

    _updateScoreDisplay() {
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
        const bonus = Math.max(0, this.birdQueue.length - this.birdIndex - 1) * 1000;
        const finalScore = this.score + bonus;
        const level = getLevel(this.currentLevel);
        const stars = finalScore >= level.s3 ? 3 : finalScore >= level.s2 ? 2 : finalScore >= level.s1 ? 1 : 1;

        const prev = this.progress[this.currentLevel];
        if (!prev || finalScore > prev.score) {
            this.progress[this.currentLevel] = {
                score: finalScore,
                stars: Math.max(stars, prev ? prev.stars : 0)
            };
        }
        this.totalScore += finalScore;

        if (this.birdIndex === 0 && !this.achList.includes('one_bird')) {
            this.achList.push('one_bird');
        }
        if (stars === 3 && !this.achList.includes('three_star')) {
            this.achList.push('three_star');
        }
        this._checkAchievements();
        this._saveData();

        const starsHtml = [1, 2, 3].map(i => {
            const earned = i <= stars;
            return `<span class="star ${earned ? 'earned' : 'empty'}" style="animation-delay: ${i * 0.15}s">★</span>`;
        }).join('');
        document.getElementById('stars-display').innerHTML = starsHtml;
        document.getElementById('final-score').textContent =
            `Score: ${finalScore.toLocaleString()}${bonus > 0 ? ` (+${bonus.toLocaleString()} bird bonus)` : ''}`;

        const nextBtn = document.getElementById('btn-next-level');
        nextBtn.style.display = (this.currentLevel < TOTAL_LEVELS - 1) ? 'block' : 'none';

        this._showScreen('victory-screen');
        this.sound.victory();
        this.state = STATES.VICTORY;
    }

    _showGameOver() {
        this._showScreen('gameover-screen');
        this.sound.defeat();
        this.state = STATES.GAMEOVER;
    }

    _nextBird() {
        this.birdIndex++;
        if (this.birdIndex >= this.birdQueue.length) {
            setTimeout(() => {
                if (this.physics.pigs.some(p => p.gameData && p.gameData.hp > 0)) {
                    this._showGameOver();
                }
            }, 500);
            return;
        }
        this.activeBird = this.physics.createBird(this.birdQueue[this.birdIndex], SLING_X, SLING_Y);
        Matter.Body.setStatic(this.activeBird, true);
        this.birdsUsedSet.add(this.birdQueue[this.birdIndex]);
        this.slingshot.resetPosition();
        this.camera.stopFollowing();
        this.camera.goHome();
        this._updateBirdQueue();
        this.state = STATES.AIMING;
    }

    _loop(time) {
        const delta = Math.min(time - (this.lastTime || time), 32);
        this.lastTime = time;

        this._update(delta);
        this._draw();

        requestAnimationFrame(t => this._loop(t));
    }

    _update(delta) {
        if (![STATES.AIMING, STATES.LAUNCHED, STATES.SETTLING, STATES.NEXT_BIRD].includes(this.state)) {
            return;
        }

        this.physics.update(1000 / 60);
        this.camera.update();
        this.particles.update();

        if (this.levelWind !== 0 && this.state === STATES.LAUNCHED && this.activeBird) {
            this.physics.applyWind(this.activeBird, this.levelWind);
        }

        if (this.comboTimer > 0) this.comboTimer--;

        this._checkDestroyed();

        if (this.physics.pigs.length === 0 && this.state !== STATES.VICTORY) {
            this._showVictory();
            return;
        }

        if (this.state === STATES.LAUNCHED) {
            if (this.activeBird) {
                const v = Math.hypot(this.activeBird.velocity.x, this.activeBird.velocity.y);
                const oob = this.activeBird.position.x > 1220 ||
                    this.activeBird.position.y > 460 ||
                    this.activeBird.position.x < -20;
                if (v < 0.5 || oob) this.settleTimer++;
                else this.settleTimer = Math.max(0, this.settleTimer - 1);
                if (this.settleTimer > 90 || oob) {
                    this.state = STATES.SETTLING;
                    this.settleTimer = 0;
                    this.camera.stopFollowing();
                }
            }
        }

        if (this.state === STATES.SETTLING) {
            this.settleTimer++;
            if (this.settleTimer > 60) {
                this.state = STATES.NEXT_BIRD;
                this.extraBirds.forEach(b => {
                    if (this.physics.birds.includes(b)) this.physics.removeBird(b);
                });
                this.extraBirds = [];
                if (this.activeBird && this.physics.birds.includes(this.activeBird)) {
                    this.physics.removeBird(this.activeBird);
                }
                this._nextBird();
            }
        }

        if (this.tipTimer > 0) {
            this.tipTimer--;
            document.getElementById('tip-text').style.opacity = Math.min(1, this.tipTimer / 30);
        } else {
            document.getElementById('tip-text').style.opacity = '0';
        }
    }

    _draw() {
        const ctx = this.renderer.ctx;
        this.renderer.clear();

        if ([STATES.MENU, STATES.WORLDS, STATES.LEVEL_SELECT, STATES.LEADERBOARD, STATES.ACHIEVEMENTS].includes(this.state)) {
            this.renderer.drawBackground(0, 0);
            return;
        }

        this.camera.apply(ctx);

        this.renderer.drawBackground(this.currentWorld, this.currentLevel);

        this.slingshot.draw(ctx);

        if (this.slingshot.pulling) {
            this.slingshot.drawTrajectory(ctx, this.trajectoryPoints);
        }

        for (const s of this.physics.structures) {
            if (s.gameData) this.renderer.drawStructure(s);
        }

        for (const p of this.physics.pigs) {
            if (p.gameData) this.renderer.drawPig(p);
        }

        if (this.activeBird && this.activeBird.gameData) {
            this.renderer.drawBird(this.activeBird);
        }
        for (const b of this.extraBirds) {
            if (b.gameData) this.renderer.drawBird(b);
        }

        this.renderer.drawEgg(this.physics.egg);

        if (this.state === STATES.AIMING && this.activeBird) {
            this.slingshot.drawFrontBand(ctx);
        }

        if (this.slingshot.pulling) {
            this.renderer.drawPowerMeter(this.slingshot.pullDist, this.slingshot.maxPull, SLING_X, SLING_Y);
        }

        this.particles.draw(ctx);

        this.camera.restore(ctx);
    }
}

const game = new Game();
