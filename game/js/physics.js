const { Engine, World, Bodies, Body, Events, Composite, Vector } = Matter;

const MATERIAL_PROPS = {
    wood:  { density: 0.004, friction: 0.6, restitution: 0.2, hp: 80,  color: '#c4813d', stroke: '#a06430' },
    glass: { density: 0.002, friction: 0.1, restitution: 0.05, hp: 30, color: '#88ccff', stroke: '#66aadd' },
    stone: { density: 0.008, friction: 0.8, restitution: 0.1, hp: 200, color: '#999999', stroke: '#777777' }
};

const BIRD_PROPS = {
    red:    { radius: 16, color: '#e94560', density: 0.006, restitution: 0.3, label: 'R' },
    blue:   { radius: 12, color: '#4488ff', density: 0.003, restitution: 0.4, label: 'B' },
    yellow: { radius: 14, color: '#ffd700', density: 0.005, restitution: 0.35, label: 'Y' },
    black:  { radius: 18, color: '#333333', density: 0.008, restitution: 0.2, label: 'X' }
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

        Events.on(this.engine, 'collisionStart', (event) => {
            for (const pair of event.pairs) {
                this._handleCollision(pair);
            }
        });
    }

    createGround(worldWidth) {
        this.ground = Bodies.rectangle(worldWidth / 2, 440, worldWidth + 200, 40, {
            isStatic: true,
            friction: 0.9,
            restitution: 0.1,
            render: { visible: false },
            label: 'ground'
        });
        const leftWall = Bodies.rectangle(-20, 250, 40, 600, {
            isStatic: true, label: 'wall'
        });
        const rightWall = Bodies.rectangle(worldWidth + 20, 250, 40, 600, {
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
        body.gameData = { type, hp: mat.hp, maxHp: mat.hp, w, h };
        Composite.add(this.world, body);
        this.structures.push(body);
        return body;
    }

    addPig(x, y, radius) {
        const body = Bodies.circle(x, y, radius, {
            density: 0.003,
            friction: 0.4,
            restitution: 0.3,
            label: 'pig'
        });
        body.gameData = { hp: 60, maxHp: 60, radius };
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
        body.gameData = { type, activated: false, hasCollided: false };
        Composite.add(this.world, body);
        this.birds.push(body);
        return body;
    }

    removeBird(body) {
        Composite.remove(this.world, body);
        this.birds = this.birds.filter(b => b !== body);
    }

    launchBird(body, velocity) {
        Body.setStatic(body, false);
        Body.setVelocity(body, velocity);
    }

    _handleCollision(pair) {
        const a = pair.bodyA;
        const b = pair.bodyB;
        const speed = Vector.magnitude(Vector.sub(
            a.velocity || { x: 0, y: 0 },
            b.velocity || { x: 0, y: 0 }
        ));

        if (speed < 1.5) return;

        const damage = speed * 8;

        if (a.label === 'bird' && !a.gameData.hasCollided) {
            a.gameData.hasCollided = true;
        }
        if (b.label === 'bird' && !b.gameData.hasCollided) {
            b.gameData.hasCollided = true;
        }

        [a, b].forEach(body => {
            if (body.gameData && body.gameData.hp !== undefined) {
                body.gameData.hp -= damage;
            }
        });

        if (this.onCollision) {
            this.onCollision(a, b, speed, damage);
        }
    }

    // Predict trajectory for a given start position and velocity
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
        const destroyed = this.structures.filter(s => s.gameData.hp <= 0);
        destroyed.forEach(s => {
            Composite.remove(this.world, s);
        });
        this.structures = this.structures.filter(s => s.gameData.hp > 0);
        return destroyed;
    }

    getDestroyedPigs() {
        const destroyed = this.pigs.filter(p => p.gameData.hp <= 0);
        destroyed.forEach(p => {
            Composite.remove(this.world, p);
        });
        this.pigs = this.pigs.filter(p => p.gameData.hp > 0);
        return destroyed;
    }

    applyExplosion(x, y, radius, force) {
        const allBodies = [...this.structures, ...this.pigs];
        allBodies.forEach(body => {
            const dx = body.position.x - x;
            const dy = body.position.y - y;
            const distance = Math.hypot(dx, dy);
            if (distance < radius && distance > 0) {
                const strength = (1 - distance / radius) * force;
                const fx = (dx / distance) * strength;
                const fy = (dy / distance) * strength;
                Body.applyForce(body, body.position, { x: fx, y: fy });
                if (body.gameData && body.gameData.hp !== undefined) {
                    body.gameData.hp -= strength * 500;
                }
            }
        });
    }

    clear() {
        Composite.clear(this.world, false);
        this.structures = [];
        this.pigs = [];
        this.birds = [];
        this.ground = null;
        this.walls = [];
    }

    isSettled() {
        const bodies = [...this.structures, ...this.pigs, ...this.birds];
        return bodies.every(b => {
            const speed = Vector.magnitude(b.velocity);
            return speed < 0.3;
        });
    }
}
