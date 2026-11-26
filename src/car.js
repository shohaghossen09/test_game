import * as THREE from 'three';

export class Car {
    constructor(scene) {
        this.speed = 0;
        this.steer = 0;
        this.heading = 0;
        this.boost = 0;
        this.onGround = true;
        this.jumpVel = 0;
        this.y = 0;
        this.honkTime = 0;
        this.hydraulics = 0;

        this.group = new THREE.Group();
        scene.add(this.group);
        this.body = this.#buildMesh();
        this.group.add(this.body);
        this.trail = [];
    }

    #buildMesh() {
        const car = new THREE.Group();
        const bodyMat = new THREE.MeshLambertMaterial({ color: '#e63946' });
        const darkMat = new THREE.MeshLambertMaterial({ color: '#22223b' });

        const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 3.2), bodyMat);
        chassis.position.y = 0.55;
        chassis.castShadow = true;
        car.add(chassis);

        const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 1.4), darkMat);
        cabin.position.set(0, 1.05, -0.1);
        cabin.castShadow = true;
        car.add(cabin);

        const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
        this.wheels = [];
        const positions = [
            [-0.85, 0.42, 1.1],
            [0.85, 0.42, 1.1],
            [-0.85, 0.42, -1.1],
            [0.85, 0.42, -1.1]
        ];
        for (const [x, y, z] of positions) {
            const w = new THREE.Mesh(wheelGeo, darkMat);
            w.rotation.z = Math.PI / 2;
            w.position.set(x, y, z);
            w.castShadow = true;
            car.add(w);
            this.wheels.push(w);
        }

        // headlights
        const hl = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 0.1),
            new THREE.MeshBasicMaterial({ color: '#fff3b0' }));
        hl.position.set(0, 0.55, 1.62);
        car.add(hl);

        return car;
    }

    update(dt, input, world) {
        const accel = 28;
        const maxSpeed = input.boost ? 40 : 22;
        const friction = 0.985;

        // forward / reverse
        if (input.forward) this.speed += accel * dt;
        else if (input.backward) this.speed -= accel * 0.6 * dt;
        else this.speed *= friction;
        if (input.brake) this.speed *= 0.94;

        this.speed = THREE.MathUtils.clamp(this.speed, -12, maxSpeed);

        // steering
        const target = input.left && !input.right ? 1 : input.right && !input.left ? -1 : 0;
        this.steer += (target - this.steer) * Math.min(1, dt * 10);
        const turnRate = this.steer * (1.6 - Math.min(1, Math.abs(this.speed) / 40)) * Math.min(1, Math.abs(this.speed) / 6);
        this.heading += turnRate * dt * 2.2;

        // jump
        if (input.jump && this.onGround) {
            this.jumpVel = 9;
            this.onGround = false;
        }
        if (!this.onGround) {
            this.jumpVel -= 24 * dt;
            this.y += this.jumpVel * dt;
            if (this.y <= 0) { this.y = 0; this.onGround = true; this.jumpVel = 0; }
        }

        // ramp launches
        for (const r of world.ramps) {
            const dx = this.group.position.x - r.x, dz = this.group.position.z - r.z;
            if (Math.abs(dx) < 4.5 && Math.abs(dz) < 4.5 && this.speed > 12) {
                this.jumpVel = Math.max(this.jumpVel, Math.min(14, this.speed * 0.45));
                this.onGround = false;
            }
        }

        // hydraulics bounce (number keys)
        if (this.hydraulics > 0) {
            this.hydraulics -= dt;
            this.y = Math.abs(Math.sin(this.hydraulics * 18)) * 0.6;
        } else if (this.onGround) this.y = 0;

        // position integration
        const vx = Math.sin(this.heading) * this.speed;
        const vz = Math.cos(this.heading) * this.speed;
        this.group.position.x += vx * dt;
        this.group.position.z += vz * dt;

        // world bounds
        const bound = 140;
        this.group.position.x = THREE.MathUtils.clamp(this.group.position.x, -bound, bound);
        this.group.position.z = THREE.MathUtils.clamp(this.group.position.z, -bound, bound);

        // simple obstacle collision (push out)
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

        // honk timer
        if (this.honkTime > 0) this.honkTime -= dt;

        // apply visual transforms
        this.group.position.y = this.y;
        this.group.rotation.y = this.heading;
        this.body.position.y = this.onGround && this.hydraulics <= 0 ? 0 : Math.sin(performance.now() * 0.02) * 0.03;
        if (this.wheels) {
            for (let i = 0; i < 4; i++) this.wheels[i].rotation.x += this.speed * dt * 2;
            // front wheel steer visual
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
