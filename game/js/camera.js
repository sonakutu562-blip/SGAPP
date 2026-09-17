import { lerp, clamp } from './utils.js';

export class Camera {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.worldWidth = 1200;
        this.worldHeight = 480;
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.scale = 1;
        this.targetScale = 1;
        this.baseScale = 1;
        this.following = null;
        this.smoothing = 0.08;
        this.returnDelay = 0;
        this._calcBaseScale();
    }

    _calcBaseScale() {
        const sx = this.canvasWidth / this.worldWidth;
        const sy = this.canvasHeight / this.worldHeight;
        this.baseScale = Math.min(sx, sy);
    }

    resize(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this._calcBaseScale();
    }

    follow(body) {
        this.following = body;
        this.returnDelay = 0;
    }

    stopFollowing() {
        this.following = null;
        this.returnDelay = 60;
    }

    reset() {
        this.following = null;
        this._calcBaseScale();
        this.targetScale = this.baseScale;
        this.scale = this.baseScale;
        this.targetX = 0;
        this.targetY = 0;
        this.x = 0;
        this.y = 0;
        this.returnDelay = 0;
    }

    goHome() {
        this.following = null;
        this.targetX = 0;
        this.targetY = 0;
        this.targetScale = this.baseScale;
    }

    update() {
        if (this.following) {
            const bx = this.following.position.x;
            const by = this.following.position.y;
            const followScale = this.baseScale * 1.2;
            const viewW = this.canvasWidth / followScale;
            const viewH = this.canvasHeight / followScale;
            this.targetX = clamp(bx - viewW / 2, 0, Math.max(0, this.worldWidth - viewW));
            this.targetY = clamp(by - viewH / 2, 0, Math.max(0, this.worldHeight - viewH));
            this.targetScale = followScale;
        } else if (this.returnDelay > 0) {
            this.returnDelay--;
            if (this.returnDelay <= 0) {
                this.goHome();
            }
        }

        this.x = lerp(this.x, this.targetX, this.smoothing);
        this.y = lerp(this.y, this.targetY, this.smoothing);
        this.scale = lerp(this.scale, this.targetScale, this.smoothing * 0.5);
    }

    apply(ctx) {
        ctx.save();
        ctx.scale(this.scale, this.scale);
        ctx.translate(-this.x, -this.y);
    }

    restore(ctx) {
        ctx.restore();
    }

    screenToWorld(sx, sy) {
        return {
            x: sx / this.scale + this.x,
            y: sy / this.scale + this.y
        };
    }
}
