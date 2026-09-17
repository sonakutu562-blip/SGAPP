import { MATERIAL_PROPS, BIRD_PROPS } from './physics.js';
import { WORLDS } from './worlds.js';

export class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = window.innerWidth * dpr;
        this.canvas.height = window.innerHeight * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = window.innerWidth + 'px';
        this.canvas.style.height = window.innerHeight + 'px';
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawBackground(worldIndex, levelId) {
        const ctx = this.ctx;
        const w = WORLDS[worldIndex] || WORLDS[0];

        const sky = ctx.createLinearGradient(0, -200, 0, 440);
        sky.addColorStop(0, w.sky[0]);
        sky.addColorStop(0.6, w.sky[1]);
        sky.addColorStop(1, w.sky[2]);
        ctx.fillStyle = sky;
        ctx.fillRect(-200, -200, 1600, 900);

        ctx.fillStyle = 'rgba(255, 255, 255, ' + (worldIndex >= 6 ? 0.15 : 0.5) + ')';
        this._drawCloud(ctx, 100, 60, 50);
        this._drawCloud(ctx, 350, 40, 40);
        this._drawCloud(ctx, 600, 80, 45);
        this._drawCloud(ctx, 850, 30, 55);
        this._drawCloud(ctx, 500, 100, 35);
        this._drawCloud(ctx, 1050, 50, 45);

        if (worldIndex === 9) {
            ctx.fillStyle = 'rgba(255,255,255,0.6)';
            for (let i = 0; i < 30; i++) {
                const sx = ((i * 137 + levelId * 47) % 1200);
                const sy = ((i * 89 + levelId * 31) % 350);
                ctx.fillRect(sx, sy, 2, 2);
            }
        }

        ctx.fillStyle = w.hill;
        ctx.beginPath();
        ctx.moveTo(-50, 440);
        for (let x = -50; x <= 1400; x += 20) {
            ctx.lineTo(x, 440 - Math.sin(x * 0.008) * 15 - Math.sin(x * 0.02) * 5);
        }
        ctx.lineTo(1400, 600);
        ctx.lineTo(-50, 600);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = w.gnd;
        ctx.fillRect(-50, 430, 1500, 200);

        ctx.fillStyle = darken(w.gnd, 20);
        ctx.fillRect(-50, 430, 1500, 4);
    }

    _drawCloud(ctx, x, y, size) {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.15, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y + size * 0.1, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStructure(body) {
        const ctx = this.ctx;
        const { type, hp, maxHp, w, h } = body.gameData;
        const mat = MATERIAL_PROPS[type];

        ctx.save();
        ctx.translate(body.position.x, body.position.y);
        ctx.rotate(body.angle);

        if (type === 'tnt') {
            ctx.fillStyle = '#cc2200';
            ctx.strokeStyle = '#991100';
            ctx.lineWidth = 2;
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.strokeRect(-w / 2, -h / 2, w, h);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold ' + (Math.min(w, h) * 0.5) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('T', 0, 0);
        } else {
            const dmgRatio = Math.max(0, hp / maxHp);
            ctx.fillStyle = mat.color;
            ctx.strokeStyle = mat.stroke;
            ctx.lineWidth = 1.5;
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.strokeRect(-w / 2, -h / 2, w, h);

            if (dmgRatio < 0.7) {
                ctx.strokeStyle = `rgba(0, 0, 0, ${0.3 * (1 - dmgRatio)})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-w * 0.2, -h * 0.3);
                ctx.lineTo(w * 0.1, h * 0.1);
                ctx.lineTo(w * 0.3, h * 0.4);
                ctx.stroke();
            }
            if (dmgRatio < 0.4) {
                ctx.beginPath();
                ctx.moveTo(w * 0.2, -h * 0.4);
                ctx.lineTo(-w * 0.1, 0);
                ctx.lineTo(-w * 0.3, h * 0.3);
                ctx.stroke();
            }

            if (type === 'glass') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w * 0.3, h * 0.3);
            }
        }

        ctx.restore();
    }

    drawPig(body) {
        const ctx = this.ctx;
        const { hp, maxHp, radius } = body.gameData;
        const x = body.position.x;
        const y = body.position.y;
        const dmgRatio = Math.max(0, hp / maxHp);
        const r = radius;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(body.angle);

        ctx.fillStyle = '#66cc44';
        ctx.strokeStyle = '#448822';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#55bb33';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.15, r * 0.45, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#448822';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#338811';
        ctx.beginPath();
        ctx.ellipse(-r * 0.12, r * 0.15, 2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.12, r * 0.15, 2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        const eyeY = -r * 0.2;
        const eyeX = r * 0.25;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-eyeX, eyeY, r * 0.2, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, r * 0.2, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-eyeX + 1, eyeY, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX + 1, eyeY, r * 0.08, 0, Math.PI * 2);
        ctx.fill();

        if (dmgRatio < 0.5) {
            ctx.strokeStyle = '#222';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-eyeX - 3, eyeY - 4);
            ctx.lineTo(-eyeX + 3, eyeY + 2);
            ctx.moveTo(-eyeX + 3, eyeY - 4);
            ctx.lineTo(-eyeX - 3, eyeY + 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(eyeX - 3, eyeY - 4);
            ctx.lineTo(eyeX + 3, eyeY + 2);
            ctx.moveTo(eyeX + 3, eyeY - 4);
            ctx.lineTo(eyeX - 3, eyeY + 2);
            ctx.stroke();
        }

        if (dmgRatio < 0.7) {
            ctx.fillStyle = `rgba(80, 60, 20, ${0.3 * (1 - dmgRatio)})`;
            ctx.beginPath();
            ctx.arc(r * 0.3, -r * 0.1, r * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawBird(body) {
        const ctx = this.ctx;
        const { type } = body.gameData;
        const props = BIRD_PROPS[type];
        const x = body.position.x;
        const y = body.position.y;
        const r = props.radius;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(body.angle);

        ctx.fillStyle = props.color;
        ctx.strokeStyle = darken(props.color, 30);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = lighten(props.color, 40);
        ctx.beginPath();
        ctx.ellipse(0, r * 0.2, r * 0.5, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-r * 0.2, -r * 0.15, r * 0.2, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(r * 0.2, -r * 0.15, r * 0.2, r * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-r * 0.15, -r * 0.12, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(r * 0.25, -r * 0.12, r * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-r * 0.4, -r * 0.45);
        ctx.lineTo(-r * 0.05, -r * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(r * 0.4, -r * 0.45);
        ctx.lineTo(r * 0.05, -r * 0.3);
        ctx.stroke();

        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.moveTo(r * 0.5, r * 0.05);
        ctx.lineTo(r * 0.9, r * 0.1);
        ctx.lineTo(r * 0.5, r * 0.25);
        ctx.closePath();
        ctx.fill();

        if (type === 'blue') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(-r * 0.3, -r * 0.3, r * 0.15, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'yellow') {
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.lineTo(-r * 0.15, -r * 1.3);
            ctx.lineTo(r * 0.15, -r * 1.3);
            ctx.closePath();
            ctx.fill();
        } else if (type === 'black') {
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.quadraticCurveTo(r * 0.3, -r * 1.4, 0, -r * 1.3);
            ctx.stroke();
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(0, -r * 1.3, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'green') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.moveTo(-r * 0.6, r * 0.1);
            ctx.lineTo(-r * 0.9, -r * 0.2);
            ctx.lineTo(-r * 0.7, r * 0.3);
            ctx.closePath();
            ctx.fill();
        } else if (type === 'white') {
            ctx.fillStyle = '#ddd';
            ctx.beginPath();
            ctx.arc(-r * 0.3, r * 0.1, r * 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(r * 0.2, r * 0.3, r * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawEgg(egg) {
        if (!egg) return;
        const ctx = this.ctx;
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(egg.position.x, egg.position.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    drawPowerMeter(pullDist, maxPull, slingX, slingY) {
        if (pullDist <= 0) return;
        const ctx = this.ctx;
        const pct = pullDist / maxPull;
        ctx.save();
        ctx.translate(slingX, slingY - 55);
        const start = Math.PI;
        const end = Math.PI + Math.PI * pct;
        ctx.beginPath();
        ctx.arc(0, 0, 30, start, end);
        ctx.lineWidth = 4;
        ctx.strokeStyle = pct < 0.4 ? '#4CAF50' : pct < 0.75 ? '#FFC107' : '#F44336';
        ctx.stroke();
        ctx.restore();
    }
}

function darken(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `rgb(${r},${g},${b})`;
}

function lighten(hex, amount) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
}
