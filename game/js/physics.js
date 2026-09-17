const { Engine, World, Bodies, Body, Events, Composite, Vector } = Matter;

const MATERIAL_PROPS = {
    wood:  { density: 0.004, friction: 0.6, restitution: 0.2, hp: 80,  color: '#c4813d', stroke: '#a06430' },
    glass: { density: 0.002, friction: 0.1, restitution: 0.05, hp: 30, color: '#88ccff', stroke: '#66aadd' },
    stone: { density: 0.008, friction: 0.8, restitution: 0.1, hp: 200, color: '#999999', stroke: '#777777' },
    tnt:   { density: 0.003, friction: 0.4, restitution: 0.1, hp: 15,  color: '#cc2200', stroke: '#991100' }
};

const BIRD_PROPS = {
    red:    { radius: 16, color: '#e94560', density: 0.006, restitution: 0.3, label: 'R' },
    blue:   { radius: 12, color: '#4488ff', density: 0.003, restitution: 0.4, label: 'B' },
    yellow: { radius: 14, color: '#ffd700', density: 0.005, restitution: 0.35, label: 'Y' },
    black:  { radius: 18, color: '#333333', density: 0.008, restitution: 0.2, label: 'X' },
    green:  { radius: 14, color: '#33cc44', density: 0.005, restitution: 0.3, label: 'G' },
    white:  { radius: 15, color: '#f0eedd', density: 0.005, restitution: 0.25, label: 'W' }
};

export { MATERIAL_PROPS, BIRD_PROPS };

export class PhysicsWorld {
    constructor(onCollision) {
        this.engine = Engine.create({
            gravity: { x: 0, y: 1.2 }
        });
        this.world = this.engine.world;
        this.structures = [];
        this.pigs = [];
        this.birds = [];
        this.ground = null;
        this.walls = [];
        this.onCollision = onCollision;
        this.egg = null;

        Events.on(this.engine, 'collisionStart', (event) => {
            for (const pair of event.pairs) {
                this._handleCollision(pair);
            }
        });
    }

    createGround(worldWidth) {
        this.ground = Bodies.rectangle(worldWidth / 2, 455, worldWidth + 200, 50, {
            isStatic: true,
            friction: 1,
            restitution: 0.1,
            label: 'ground'
        });
        const leftWall = Bodies.rectangle(-10, 240, 20, 500, {
            isStatic: true, label: 'wall'
        });
        const rightWall = Bodies.rectangle(worldWidth + 10, 240, 20, 500, {
            isStatic: true, label: 'wall'
        });
        this.walls = [leftWall, rightWall];
        Composite.add(this.world, [this.ground, leftWall, rightWall]);
    }

    addStructure(type, x, y, w, h) {
        const mat = MATERIAL_PROPS[type];
        const body = Bodies.rectangle(x, y, w, h, {
            density: mat.density,
            friction: mat.friction,
            restitution: mat.restitution,
            label: 'structure',
            chamfer: { radius: 1 }
        });
        body.gameData = { type, hp: mat.hp, maxHp: mat.hp, w, h, isTnt: type === 'tnt' };
        Composite.add(this.world, body);
        this.structures.push(body);
        return body;
    }

    addPig(x, y, radius) {
        const body = Bodies.circle(x, y, radius, {
            density: 0.005,
            friction: 0.5,
            restitution: 0.2,
            label: 'pig'
        });
        body.gameData = { hp: 40, maxHp: 40, radius, isPig: true };
        Composite.add(this.world, body);
        this.pigs.push(body);
        return body;
    }

    createBird(type, x, y) {
        const props = BIRD_PROPS[type];
        const body = Bodies.circle(x, y, props.radius, {
            density: props.density,
            restitution: props.restitution,
            friction: 0.5,
            label: 'bird'
        });
        body.gameData = { type, activated: false, isBird: true, hasCollided: false };
        Composite.add(this.world, body);
        this.birds.push(body);
        return body;
    }

    createEgg(x, y) {
        const egg = Bodies.circle(x, y + 20, 8, {
            density: 0.01,
            restitution: 0.1,
            friction: 0.3,
            label: 'egg'
        });
        egg.gameData = { isEgg: true };
        Composite.add(this.world, egg);
        Body.setVelocity(egg, { x: 0, y: 12 });
        this.egg = egg;
        return egg;
    }

    removeBird(body) {
        Composite.remove(this.world, body);
        this.birds = this.birds.filter(b => b !== body);
    }

    removeEgg() {
        if (this.egg) {
            Composite.remove(this.world, this.egg);
            this.egg = null;
        }
    }

    launchBird(body, velocity) {
        Body.setStatic(body, false);
        Body.setVelocity(body, velocity);
    }

    _handleCollision(pair) {
        const a = pair.bodyA;
        const b = pair.bodyB;

        if (this.egg && (a === this.egg || b === this.egg)) {
            const ep = this.egg.position;
            this.applyExplosion(ep.x, ep.y, 80, 0.04);
            Composite.remove(this.world, this.egg);
            this.egg = null;
            if (this.onCollision) {
                this.onCollision(a, b, 10, 0, 'egg_explode');
            }
            return;
        }

        [a, b].forEach((body, idx) => {
            const other = idx === 0 ? b : a;
            if (!body.gameData) return;
            const spd = Math.max(
                Math.hypot(a.velocity.x, a.velocity.y),
                Math.hypot(b.velocity.x, b.velocity.y)
            );
            if (body.gameData.hp !== undefined && spd > 2) {
                const dmg = spd * (other.gameData && other.gameData.isBird ? 3 : 1.5);
                body.gameData.hp -= dmg;
                if (this.onCollision) {
                    this.onCollision(a, b, spd, dmg, 'hit');
                }
            }
        });
    }

    predictTrajectory(startX, startY, vx, vy, steps = 60) {
        const points = [];
        let x = startX;
        let y = startY;
        let velX = vx;
        let velY = vy;
        const gravity = this.engine.gravity.y;

        for (let i = 0; i < steps; i++) {
            velY += gravity * 0.001;
            x += velX;
            y += velY;
            if (y > 430) break;
            if (i % 2 === 0) {
                points.push({ x, y });
            }
        }
        return points;
    }

    update(delta) {
        Engine.update(this.engine, delta);
    }

    getDestroyedStructures() {
        const destroyed = this.structures.filter(s => s.gameData && s.gameData.hp <= 0);
        destroyed.forEach(s => {
            Composite.remove(this.world, s);
        });
        this.structures = this.structures.filter(s => !s.gameData || s.gameData.hp > 0);
        return destroyed;
    }

    getDestroyedPigs() {
        const destroyed = this.pigs.filter(p => p.gameData && p.gameData.hp <= 0);
        destroyed.forEach(p => {
            Composite.remove(this.world, p);
        });
        this.pigs = this.pigs.filter(p => !p.gameData || p.gameData.hp > 0);
        return destroyed;
    }

    applyExplosion(x, y, radius, force) {
        const allBodies = [...this.structures, ...this.pigs];
        allBodies.forEach(body => {
            if (!body.gameData) return;
            const dx = body.position.x - x;
            const dy = body.position.y - y;
            const distance = Math.hypot(dx, dy);
            if (distance < radius && distance > 0) {
                const strength = (1 - distance / radius) * force;
                const fx = (dx / distance) * strength;
                const fy = (dy / distance) * strength;
                Body.applyForce(body, body.position, { x: fx, y: fy });
                if (body.gameData.hp !== undefined) {
                    body.gameData.hp -= strength * 500;
                }
            }
        });
    }

    applyWind(bird, windForce) {
        if (bird && windForce !== 0) {
            Body.applyForce(bird, bird.position, { x: windForce, y: 0 });
        }
    }

    clear() {
        Composite.clear(this.world, false);
        this.structures = [];
        this.pigs = [];
        this.birds = [];
        this.ground = null;
        this.walls = [];
        this.egg = null;
    }

    isSettled() {
        const bodies = [...this.structures, ...this.pigs, ...this.birds];
        return bodies.every(b => {
            const speed = Vector.magnitude(b.velocity);
            return speed < 0.3;
        });
    }
}
