import { clamp, dist } from './utils.js';

const SLING_X = 160;
const SLING_Y = 360;
const MAX_PULL = 90;
const LAUNCH_POWER = 0.18;

export { SLING_X, SLING_Y };

export class Slingshot {
    constructor() {
        this.anchorX = SLING_X;
        this.anchorY = SLING_Y;
        this.birdX = SLING_X;
        this.birdY = SLING_Y;
        this.pulling = false;
        this.pullDist = 0;
        this.maxPull = MAX_PULL;
    }

    startPull(worldX, worldY, birdRadius) {
        const d = dist(worldX, worldY, this.anchorX, this.anchorY);
        if (d < birdRadius + 30) {
            this.pulling = true;
            return true;
        }
        return false;
    }

    updatePull(worldX, worldY) {
        if (!this.pulling) return;
        const dx = worldX - this.anchorX;
        const dy = worldY - this.anchorY;
        const d = dist(worldX, worldY, this.anchorX, this.anchorY);
        const clamped = Math.min(d, this.maxPull);
        if (d > 0) {
            this.birdX = this.anchorX + (dx / d) * clamped;
            this.birdY = this.anchorY + (dy / d) * clamped;
        }
        this.pullDist = clamped;
    }

    release() {
        if (!this.pulling) return null;
        this.pulling = false;
        if (this.pullDist < 10) {
            this.resetPosition();
            return null;
        }
        const dx = this.anchorX - this.birdX;
        const dy = this.anchorY - this.birdY;
        const velocity = {
            x: dx * LAUNCH_POWER,
            y: dy * LAUNCH_POWER
        };
        const result = { velocity, pullDist: this.pullDist };
        this.resetPosition();
        return result;
    }

    resetPosition() {
        this.birdX = this.anchorX;
        this.birdY = this.anchorY;
        this.pullDist = 0;
    }

    getTrajectoryInput() {
        if (!this.pulling || this.pullDist < 10) return null;
        const dx = this.anchorX - this.birdX;
        const dy = this.anchorY - this.birdY;
        return {
            startX: this.birdX,
            startY: this.birdY,
            vx: dx * LAUNCH_POWER,
            vy: dy * LAUNCH_POWER
        };
    }

    draw(ctx) {
        // Back band
        ctx.strokeStyle = '#5c3d1a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.anchorX - 12, this.anchorY - 30);
        ctx.lineTo(this.birdX, this.birdY);
        ctx.stroke();

        // Slingshot post
        ctx.fillStyle = '#8b5e3c';
        ctx.fillRect(this.anchorX - 18, this.anchorY - 35, 8, 75);
        ctx.fillRect(this.anchorX + 10, this.anchorY - 35, 8, 75);

        // Fork top
        ctx.fillStyle = '#6b4226';
        ctx.beginPath();
        ctx.arc(this.anchorX - 14, this.anchorY - 33, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.anchorX + 14, this.anchorY - 33, 6, 0, Math.PI * 2);
        ctx.fill();

        // Base
        ctx.fillStyle = '#5c3d1a';
        ctx.fillRect(this.anchorX - 22, this.anchorY + 35, 44, 10);
    }

    drawFrontBand(ctx) {
        ctx.strokeStyle = '#5c3d1a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(this.birdX, this.birdY);
        ctx.lineTo(this.anchorX + 12, this.anchorY - 30);
        ctx.stroke();
    }

    drawTrajectory(ctx, points) {
        if (!points || points.length === 0) return;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < points.length; i++) {
            const size = Math.max(1, 3 - i * 0.1);
            const alpha = Math.max(0.1, 1 - i / points.length);
            ctx.globalAlpha = alpha * 0.6;
            ctx.beginPath();
            ctx.arc(points[i].x, points[i].y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
}
