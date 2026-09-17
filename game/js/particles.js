import { randomRange } from './utils.js';

class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.gravity = 0.15;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
        this.vx *= 0.99;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        const currentSize = this.size * alpha;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    get dead() {
        return this.life <= 0;
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, count, colors, speed = 5, sizeRange = [2, 6], lifeRange = [20, 50]) {
        for (let i = 0; i < count; i++) {
            const ang = randomRange(0, Math.PI * 2);
            const spd = randomRange(speed * 0.3, speed);
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(
                x, y,
                Math.cos(ang) * spd,
                Math.sin(ang) * spd,
                color,
                randomRange(sizeRange[0], sizeRange[1]),
                randomRange(lifeRange[0], lifeRange[1])
            ));
        }
    }

    explode(x, y) {
        this.emit(x, y, 40, ['#ff4444', '#ff8800', '#ffcc00', '#ffffff'], 8, [3, 8], [30, 60]);
    }

    shatter(x, y, material) {
        const colorMap = {
            wood: ['#c4813d', '#a06430', '#d4a060', '#8b6914'],
            glass: ['#88ccff', '#aaddff', '#66bbee', '#ffffff'],
            stone: ['#888888', '#aaaaaa', '#666666', '#cccccc']
        };
        const colors = colorMap[material] || colorMap.wood;
        this.emit(x, y, 15, colors, 4, [2, 5], [20, 40]);
    }

    pigPop(x, y) {
        this.emit(x, y, 20, ['#66cc44', '#88dd66', '#ffff88', '#ffffff'], 5, [2, 6], [25, 45]);
    }

    dust(x, y) {
        this.emit(x, y, 8, ['#ccbb99', '#aa9977', '#ddccaa'], 2, [2, 4], [15, 30]);
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].dead) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    }

    get active() {
        return this.particles.length > 0;
    }
}
