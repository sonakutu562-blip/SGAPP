import { MATERIAL_PROPS, BIRD_PROPS } from './physics.js';

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

    drawBackground() {
        const ctx = this.ctx;
        // Use world coordinates (drawn inside camera transform)
        const worldW = 1400;
        const worldH = 900;

        // Sky gradient
        const sky = ctx.createLinearGradient(0, -200, 0, 440);
        sky.addColorStop(0, '#87CEEB');
        sky.addColorStop(0.7, '#B0E0FF');
        sky.addColorStop(1, '#E8F4FD');
        ctx.fillStyle = sky;
        ctx.fillRect(-200, -200, worldW + 400, worldH + 400);

        // Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this._drawCloud(ctx, 100, 60, 50);
        this._drawCloud(ctx, 350, 40, 40);
        this._drawCloud(ctx, 600, 80, 45);
        this._drawCloud(ctx, 850, 30, 55);
        this._drawCloud(ctx, 500, 100, 35);
        this._drawCloud(ctx, 1050, 50, 45);

        // Hills
        ctx.fillStyle = '#7ec850';
        ctx.beginPath();
        ctx.moveTo(-50, 440);
        for (let x = -50; x <= worldW; x += 20) {
            ctx.lineTo(x, 440 - Math.sin(x * 0.008) * 15 - Math.sin(x * 0.02) * 5);
        }
        ctx.lineTo(worldW, worldH);
        ctx.lineTo(-50, worldH);
        ctx.closePath();
        ctx.fill();

        // Ground
        ctx.fillStyle = '#5da832';
        ctx.fillRect(-50, 430, worldW + 100, worldH);

        // Ground detail
        ctx.fillStyle = '#4e9228';
        ctx.fillRect(-50, 430, worldW + 100, 4);
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

        // Damage indication: lerp color toward darker
        const dmgRatio = Math.max(0, hp / maxHp);
        const baseColor = mat.color;

        ctx.fillStyle = baseColor;
        ctx.strokeStyle = mat.stroke;
        ctx.lineWidth = 1.5;
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.strokeRect(-w / 2, -h / 2, w, h);

        // Damage cracks
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

        // Glass transparency effect
        if (type === 'glass') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(-w / 2 + 2, -h / 2 + 2, w * 0.3, h * 0.3);
        }

        ctx.restore();
    }

    drawPig(body) {
        const ctx = this.ctx;
        const { hp, maxHp, radius } = body.gameData;
        const x = body.position.x;
        const y = body.position.y;
        const dmgRatio = Math.max(0, hp / maxHp);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(body.angle);

        // Body
        ctx.fillStyle = '#66cc44';
        ctx.strokeStyle = '#448822';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Snout
        ctx.fillStyle = '#55bb33';
        ctx.beginPath();
        ctx.ellipse(0, radius * 0.15, radius * 0.45, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#448822';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Nostrils
        ctx.fillStyle = '#338811';
        ctx.beginPath();
        ctx.ellipse(-radius * 0.12, radius * 0.15, 2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(radius * 0.12, radius * 0.15, 2, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        const eyeY = -radius * 0.2;
        const eyeX = radius * 0.25;

        // White
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(-eyeX, eyeY, radius * 0.2, radius * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(eyeX, eyeY, radius * 0.2, radius * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-eyeX + 1, eyeY, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX + 1, eyeY, radius * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Damage expression
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

        // Bruises
        if (dmgRatio < 0.7) {
            ctx.fillStyle = `rgba(80, 60, 20, ${0.3 * (1 - dmgRatio)})`;
            ctx.beginPath();
            ctx.arc(radius * 0.3, -radius * 0.1, radius * 0.25, 0, Math.PI * 2);
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

        // Body
        ctx.fillStyle = props.color;
        ctx.strokeStyle = darken(props.color, 30);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Belly highlight
        ctx.fillStyle = lighten(props.color, 40);
        ctx.beginPath();
        ctx.ellipse(0, r * 0.2, r * 0.5, r * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
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

        // Eyebrows (angry!)
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

        // Beak
        ctx.fillStyle = '#ff9900';
        ctx.beginPath();
        ctx.moveTo(r * 0.5, r * 0.05);
        ctx.lineTo(r * 0.9, r * 0.1);
        ctx.lineTo(r * 0.5, r * 0.25);
        ctx.closePath();
        ctx.fill();

        // Type-specific markers
        if (type === 'blue') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(-r * 0.3, -r * 0.3, r * 0.15, 0, Math.PI * 2);
            ctx.fill();
        } else if (type === 'yellow') {
            // Crest
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.lineTo(-r * 0.15, -r * 1.3);
            ctx.lineTo(r * 0.15, -r * 1.3);
            ctx.closePath();
            ctx.fill();
        } else if (type === 'black') {
            // Fuse
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
        }

        ctx.restore();
    }

    drawBirdIcon(ctx, type, x, y, size) {
        const props = BIRD_PROPS[type];
        ctx.fillStyle = props.color;
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = darken(props.color, 30);
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function darken(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (num >> 16) - amount);
    const g = Math.max(0, ((num >> 8) & 0xff) - amount);
    const b = Math.max(0, (num & 0xff) - amount);
    return `rgb(${r},${g},${b})`;
}

function lighten(hex, amount) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (num >> 16) + amount);
    const g = Math.min(255, ((num >> 8) & 0xff) + amount);
    const b = Math.min(255, (num & 0xff) + amount);
    return `rgb(${r},${g},${b})`;
}
