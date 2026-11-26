import * as THREE from 'three';

export class Car {
    constructor(scene) {
        this.speed = 0;
        this.steer = 0;
        this.heading = 0;
        this.onGround = true;
        this.jumpVel = 0;
        this.y = 0;
        this.honkTime = 0;
        this.hydraulics = 0;

        this.group = new THREE.Group();
        scene.add(this.group);
        this.body = this.#buildMesh();
        this.group.add(this.body);
    }

    #mat(kind, hex) {
        if (kind === 'paint') {
            return new THREE.MeshStandardMaterial({
                color: hex, roughness: 0.25, metalness: 0.65, envMapIntensity: 1.3
            });
        }
        if (kind === 'glass') {
            return new THREE.MeshPhysicalMaterial({
                color: '#8db3cc', roughness: 0.05, metalness: 0,
                transparent: true, opacity: 0.4, envMapIntensity: 1.8
            });
        }
        if (kind === 'rubber') {
            return new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.95 });
        }
        if (kind === 'chrome') {
            return new THREE.MeshStandardMaterial({
                color: '#d9dde1', roughness: 0.12, metalness: 1, envMapIntensity: 1.6
            });
        }
        return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.5 });
    }

    #buildMesh() {
        const car = new THREE.Group();
        const paint = this.#mat('paint', '#b3122f');
        const darkPaint = this.#mat('paint', '#1b1b1e');
        const glass = this.#mat('glass');
        const rubber = this.#mat('rubber');
        const chrome = this.#mat('chrome');

        const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 3.2), paint);
        chassis.position.y = 0.5;
        chassis.castShadow = true;
        car.add(chassis);

        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.18, 0.9), paint);
        hood.position.set(0, 0.8, 1.05);
        hood.castShadow = true;
        car.add(hood);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.45, 1.5), glass);
        cabin.position.set(0, 1.02, -0.35);
        car.add(cabin);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.1, 1.6), paint);
        roof.position.set(0, 1.28, -0.35);
        roof.castShadow = true;
        car.add(roof);

        const pillarGeo = new THREE.BoxGeometry(0.08, 0.45, 0.08);
        [[-0.6, 0.35], [0.6, 0.35], [-0.6, -1.05], [0.6, -1.05]].forEach(([px, pz]) => {
            const p = new THREE.Mesh(pillarGeo, darkPaint);
            p.position.set(px, 1.05, pz);
            car.add(p);
        });

        const bumperF = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.28, 0.2), darkPaint);
        bumperF.position.set(0, 0.42, 1.65);
        car.add(bumperF);
        const grille = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.05), chrome);
        grille.position.set(0, 0.58, 1.72);
        car.add(grille);

        const bumperR = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.28, 0.2), darkPaint);
        bumperR.position.set(0, 0.42, -1.65);
        car.add(bumperR);

        const hlMat = new THREE.MeshPhysicalMaterial({
            color: '#fff8e7', roughness: 0.05, metalness: 0,
            transparent: true, opacity: 0.9, envMapIntensity: 2
        });
        [-0.5, 0.5].forEach(x => {
            const hl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), hlMat);
            hl.scale.set(1.4, 0.7, 0.6);
            hl.position.set(x, 0.62, 1.68);
            car.add(hl);
        });

        const tlMat = new THREE.MeshStandardMaterial({
            color: '#5a0a0a', roughness: 0.2, metalness: 0.3,
            emissive: '#ff1a1a', emissiveIntensity: 0.8
        });
        [-0.5, 0.5].forEach(x => {
            const tl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, 0.06), tlMat);
            tl.position.set(x, 0.6, -1.7);
            car.add(tl);
        });

        const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 20);
        const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.32, 12);
        this.wheels = [];
        const positions = [
            [-0.85, 0.42, 1.1],
            [0.85, 0.42, 1.1],
            [-0.85, 0.42, -1.1],
            [0.85, 0.42, -1.1]
        ];
        for (const [x, y, z] of positions) {
            const wheelGroup = new THREE.Group();
            wheelGroup.rotation.order = 'YXZ';
            const tire = new THREE.Mesh(tireGeo, rubber);
            tire.rotation.z = Math.PI / 2;
            tire.castShadow = true;
            wheelGroup.add(tire);
            const rim = new THREE.Mesh(rimGeo, chrome);
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);
            const spokes = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 6, 10), chrome);
            spokes.rotation.y = Math.PI / 2;
            wheelGroup.add(spokes);
            wheelGroup.position.set(x, y, z);
            car.add(wheelGroup);
            this.wheels.push(wheelGroup);
        }

        [[-0.88, 0.92, 0.5], [0.88, 0.92, 0.5]].forEach(([x, y, z]) => {
            const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.14), paint);
            m.position.set(x, y, z);
            car.add(m);
        });

        [-0.3, 0.3].forEach(x => {
            const ex = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.25, 10), chrome);
            ex.rotation.x = Math.PI / 2;
            ex.position.set(x, 0.35, -1.75);
            car.add(ex);
        });

        return car;
    }

    update(dt, input, world) {
        const accel = 28;
        const maxSpeed = input.boost ? 40 : 22;
        const friction = 0.985;

        if (input.forward) this.speed += accel * dt;
        else if (input.backward) this.speed -= accel * 0.6 * dt;
        else this.speed *= friction;
        if (input.brake) this.speed *= 0.94;

        this.speed = THREE.MathUtils.clamp(this.speed, -12, maxSpeed);

        const target = input.left && !input.right ? 1 : input.right && !input.left ? -1 : 0;
        this.steer += (target - this.steer) * Math.min(1, dt * 10);
        const turnRate = this.steer * (1.6 - Math.min(1, Math.abs(this.speed) / 40)) * Math.min(1, Math.abs(this.speed) / 6);
        this.heading += turnRate * dt * 2.2;

        if (input.jump && this.onGround) {
            this.jumpVel = 9;
            this.onGround = false;
        }
        if (!this.onGround) {
            this.jumpVel -= 23 * dt;
            this.y += this.jumpVel * dt;
            if (this.y <= 0) { this.y = 0; this.onGround = true; this.jumpVel = 0; }
        }

        for (const r of world.ramps) {
            const dx = this.group.position.x - r.x, dz = this.group.position.z - r.z;
            if (Math.abs(dx) < 4.5 && Math.abs(dz) < 4.5 && this.speed > 12) {
                this.jumpVel = Math.max(this.jumpVel, Math.min(14, this.speed * 0.45));
                this.onGround = false;
            }
        }

        if (this.hydraulics > 0) {
            this.hydraulics -= dt;
            this.y = Math.abs(Math.sin(this.hydraulics * 18)) * 0.6;
        } else if (this.onGround) this.y = 0;

        const vx = Math.sin(this.heading) * this.speed;
        const vz = Math.cos(this.heading) * this.speed;
        this.group.position.x += vx * dt;
        this.group.position.z += vz * dt;

        const bound = 140;
        this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, -bound, bound);
        this.group.position.z = THREE.MathUtils.clamp(this.group.position.z, -bound, bound);

        for (const o of world.obstacles) {
            const dx = this.group.position.x - o.x;
            const dz = this.group.position.z - o.z;
            const d = Math.hypot(dx, dz);
            if (d < o.r + 0.9 && d > 0.001) {
                const push = (o.r + 0.9 - d);
                this.group.position.x += (dx / d) * push;
                this.group.position.z += (dz / d) * push;
                this.speed *= 0.4;
            }
        }

        if (this.honkTime > 0) this.honkTime -= dt;

        this.group.position.y = this.y;
        this.group.rotation.y = this.heading;
        this.body.rotation.z = this.steer * 0.06;
        this.body.rotation.x = THREE.MathUtils.clamp(this.speed * 0.004, -0.05, 0.05);
        if (this.wheels) {
            for (let i = 0; i < 4; i++) {
                this.wheels[i].rotation.x += this.speed * dt * 2;
            }
            this.wheels[0].rotation.y = this.steer * 0.5;
            this.wheels[1].rotation.y = this.steer * 0.5;
        }
    }

    get speedKmh() {
        return Math.round(Math.abs(this.speed) * 3.6);
    }

    respawn(point) {
        this.group.position.copy(point);
        this.group.position.y = 0;
        this.speed = 0;
        this.heading = 0;
        this.y = 0;
        this.jumpVel = 0;
        this.onGround = true;
    }

    honk(audio) {
        if (this.honkTime > 0) return;
        this.honkTime = 0.4;
        if (audio.enabled) audio.honk();
    }

    doHydraulics() {
        this.hydraulics = 1.2;
    }
}
