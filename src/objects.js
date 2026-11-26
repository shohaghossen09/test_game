import * as THREE from 'three';

const GRAVITY = -22;
const WORLD_BOUND = 138;
const RESPAWN_MS = 15000;

/**
 * Physics props that react to the car — the Bruno Simon "feel":
 * knock pins flying, kick footballs, spin windmills by honking.
 */
export class Props {
    constructor(scene) {
        this.scene = scene;
        this.knockables = [];
        this.balls = [];
        this.windmills = [];
    }

    #knockable(mesh, x, z, radius) {
        const s = {
            mesh, x, z, radius,
            homeX: x, homeZ: z,
            vx: 0, vy: 0, vz: 0,
            fallen: false, settled: false,
            spinAxis: new THREE.Vector3(1, 0, 0),
            spinRate: 0,
            respawnAt: 0
        };
        this.knockables.push(s);
        return s;
    }

    addPin(x, z) {
        const g = new THREE.Group();
        const mat = new THREE.MeshLambertMaterial({ color: '#f8f4e3' });
        const red = new THREE.MeshLambertMaterial({ color: '#e63946' });
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.27, 1.15, 10), mat);
        body.position.y = 0.58;
        body.castShadow = true;
        g.add(body);
        const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.05, 8, 14), red);
        stripe.rotation.x = Math.PI / 2;
        stripe.position.y = 0.9;
        g.add(stripe);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), mat);
        head.position.y = 1.22;
        head.castShadow = true;
        g.add(head);
        g.position.set(x, 0, z);
        this.scene.add(g);
        return this.#knockable(g, x, z, 0.5);
    }

    addCone(x, z) {
        const g = new THREE.Group();
        const c = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 1, 10),
            new THREE.MeshLambertMaterial({ color: '#ff7b00' })
        );
        c.position.y = 0.5;
        c.castShadow = true;
        g.add(c);
        g.position.set(x, 0, z);
        this.scene.add(g);
        return this.#knockable(g, x, z, 0.55);
    }

    addBall(x, z, r = 0.9) {
        const g = new THREE.Group();
        const ball = new THREE.Mesh(
            new THREE.SphereGeometry(r, 18, 14),
            new THREE.MeshLambertMaterial({ color: '#ffffff' })
        );
        ball.castShadow = true;
        g.add(ball);
        for (let i = 0; i < 5; i++) {
            const patch = new THREE.Mesh(
                new THREE.CircleGeometry(r * 0.3, 8),
                new THREE.MeshBasicMaterial({ color: '#1a1a1a', side: THREE.DoubleSide })
            );
            const a = (i / 5) * Math.PI * 2;
            patch.position.set(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.5, r * 0.86);
            patch.lookAt(patch.position.x * 3, patch.position.y * 3, r * 3);
            g.add(patch);
        }
        g.position.set(x, r, z);
        this.scene.add(g);
        this.balls.push({ mesh: g, x, z, r, homeX: x, homeZ: z, vx: 0, vz: 0, vy: 0 });
    }

    addWindmill(x, z) {
        const g = new THREE.Group();
        const tower = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.9, 6, 10),
            new THREE.MeshLambertMaterial({ color: '#c9ada7' })
        );
        tower.position.y = 3;
        tower.castShadow = true;
        g.add(tower);
        const hub = new THREE.Group();
        hub.position.set(0, 6, 0.7);
        for (let i = 0; i < 4; i++) {
            const blade = new THREE.Mesh(
                new THREE.BoxGeometry(0.5, 4.6, 0.12),
                new THREE.MeshLambertMaterial({ color: '#f2cc8f' })
            );
            blade.position.y = 2.5;
            blade.castShadow = true;
            const arm = new THREE.Group();
            arm.rotation.z = (i / 4) * Math.PI * 2;
            arm.add(blade);
            hub.add(arm);
        }
        g.add(hub);
        g.position.set(x, 0, z);
        this.scene.add(g);
        this.windmills.push({ group: g, hub, x, z, speed: 0.6, target: 0.6 });
    }

    #hitKnockable(k, car) {
        const dx = k.x - car.group.position.x;
        const dz = k.z - car.group.position.z;
        const d = Math.hypot(dx, dz) || 0.001;
        const power = Math.abs(car.speed);
        const impulse = power * (0.55 + Math.random() * 0.35);
        k.vx = (dx / d) * impulse + Math.sin(car.heading) * power * 0.25;
        k.vz = (dz / d) * impulse + Math.cos(car.heading) * power * 0.25;
        k.vy = Math.min(9, 1.5 + power * 0.3);
        k.fallen = true;
        k.settled = false;
        k.spinAxis.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
        k.spinRate = 4 + Math.random() * 6;
        car.speed *= 0.93;
    }

    update(dt, car, audio) {
        const honking = !!(car && car.honkTime > 0);
        const cx = car ? car.group.position.x : 0;
        const cz = car ? car.group.position.z : 0;

        // windmills — honk within range to make them spin like crazy
        for (const w of this.windmills) {
            const d = Math.hypot(cx - w.x, cz - w.z);
            if (honking && d < 15) {
                w.target = 9;
            } else {
                w.target += (0.6 - w.target) * Math.min(1, dt * 0.6);
            }
            w.speed += (w.target - w.speed) * Math.min(1, dt * 3);
            w.hub.rotation.z -= w.speed * dt;
        }

        // knockables — pins & cones fly, tumble, settle, respawn
        for (const k of this.knockables) {
            if (k.respawnAt > 0) {
                if (performance.now() >= k.respawnAt) this.#restoreKnockable(k);
                continue;
            }
            const d = Math.hypot(cx - k.x, cz - k.z);
            if (!k.fallen && car && d < k.radius + 1.1 && Math.abs(car.speed) > 1.5 && car.y < 1.4) {
                this.#hitKnockable(k, car);
            }
            if (k.fallen && !k.settled) {
                k.vy += GRAVITY * dt;
                k.x = THREE.MathUtils.clamp(k.x + k.vx * dt, -WORLD_BOUND, WORLD_BOUND);
                k.z = THREE.MathUtils.clamp(k.z + k.vz * dt, -WORLD_BOUND, WORLD_BOUND);
                k.vx *= 0.99;
                k.vz *= 0.99;
                let y = k.mesh.position.y + k.vy * dt;
                if (y <= 0) {
                    y = 0;
                    k.vy = -k.vy * 0.35;
                    k.spinRate *= 0.55;
                    if (Math.abs(k.vy) < 1.2) {
                        k.vy = 0;
                        k.settled = true;
                        k.respawnAt = performance.now() + RESPAWN_MS;
                    }
                }
                k.mesh.position.set(k.x, y, k.z);
                k.mesh.rotateOnWorldAxis(k.spinAxis, k.spinRate * dt);
            }
        }

        // balls — kickable footballs that roll and bounce
        for (const b of this.balls) {
            const dx = b.x - cx;
            const dz = b.z - cz;
            const d = Math.hypot(dx, dz);
            if (car && d < b.r + 1.2 && Math.abs(car.speed) > 0.5 && car.y < 1.5) {
                const inv = 1 / (d || 0.001);
                const kick = Math.abs(car.speed) * 0.65 + 2;
                b.vx = dx * inv * kick;
                b.vz = dz * inv * kick;
                b.vy = Math.min(6, Math.abs(car.speed) * 0.18);
                car.speed *= 0.96;
            }
            b.vy += GRAVITY * dt;
            let y = b.mesh.position.y + b.vy * dt;
            if (y <= b.r) {
                y = b.r;
                b.vy = Math.abs(b.vy) > 1 ? -b.vy * 0.45 : 0;
            }
            b.x = THREE.MathUtils.clamp(b.x + b.vx * dt, -WORLD_BOUND, WORLD_BOUND);
            b.z = THREE.MathUtils.clamp(b.z + b.vz * dt, -WORLD_BOUND, WORLD_BOUND);
            b.vx *= 0.985;
            b.vz *= 0.985;
            b.mesh.position.set(b.x, y, b.z);
            const sp = Math.hypot(b.vx, b.vz);
            if (sp > 0.05) {
                const axis = new THREE.Vector3(-b.vz, 0, b.vx).normalize();
                b.mesh.rotateOnWorldAxis(axis, (sp / b.r) * dt);
            }
        }
    }

    #restoreKnockable(k) {
        k.fallen = false;
        k.settled = false;
        k.respawnAt = 0;
        k.x = k.homeX;
        k.z = k.homeZ;
        k.vx = k.vy = k.vz = 0;
        k.spinRate = 0;
        k.mesh.position.set(k.homeX, 0, k.homeZ);
        k.mesh.rotation.set(0, 0, 0);
    }

    reset() {
        for (const k of this.knockables) this.#restoreKnockable(k);
        for (const b of this.balls) {
            b.x = b.homeX;
            b.z = b.homeZ;
            b.vx = b.vz = b.vy = 0;
            b.mesh.position.set(b.homeX, b.r, b.homeZ);
            b.mesh.rotation.set(0, 0, 0);
        }
        for (const w of this.windmills) {
            w.speed = 0.6;
            w.target = 0.6;
        }
    }
}
