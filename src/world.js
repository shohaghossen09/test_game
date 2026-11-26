import * as THREE from 'three';

const OBSTACLES = [];

function addTree(scene, x, z, s = 1) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25 * s, 0.35 * s, 1.6 * s, 8),
        new THREE.MeshLambertMaterial({ color: '#8a5a2b' })
    );
    trunk.position.y = 0.8 * s;
    trunk.castShadow = true;
    g.add(trunk);
    const leaves = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.6 * s, 0),
        new THREE.MeshLambertMaterial({ color: '#3f9142', flatShading: true })
    );
    leaves.position.y = 2.6 * s;
    leaves.castShadow = true;
    g.add(leaves);
    g.position.set(x, 0, z);
    scene.add(g);
    OBSTACLES.push({ x, z, r: 0.9 * s });
}

function addRamp(scene, x, z, rotY) {
    const m = new THREE.Mesh(
        new THREE.BoxGeometry(8, 0.5, 3),
        new THREE.MeshLambertMaterial({ color: '#e63946' })
    );
    m.rotation.x = -0.32;
    m.rotation.y = rotY;
    m.position.set(x, 1, z);
    m.castShadow = true;
    scene.add(m);
    return { x, z, r: 4, rotY };
}

export function createWorld(scene) {
    OBSTACLES.length = 0;

    // Ground
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 400),
        new THREE.MeshLambertMaterial({ color: '#8ac926' })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Road ring
    const road = new THREE.Mesh(
        new THREE.RingGeometry(26, 34, 64),
        new THREE.MeshLambertMaterial({ color: '#3d405b' })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.02;
    road.receiveShadow = true;
    scene.add(road);
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const dash = new THREE.Mesh(
            new THREE.PlaneGeometry(0.6, 3),
            new THREE.MeshLambertMaterial({ color: '#ffd166' })
        );
        dash.rotation.x = -Math.PI / 2;
        dash.rotation.z = -a;
        dash.position.set(Math.cos(a) * 30, 0.03, Math.sin(a) * 30);
        scene.add(dash);
    }

    // Buildings around start
    const bColors = ['#e07a5f', '#81b29a', '#f2cc8f', '#a26ea1'];
    for (let i = 0; i < 6; i++) {
        const w = 4 + Math.random() * 3, h = 6 + Math.random() * 8, d = 4 + Math.random() * 3;
        const b = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshLambertMaterial({ color: bColors[i % 4] })
        );
        const a = (i / 6) * Math.PI * 2 + 0.5;
        const r = 55 + Math.random() * 20;
        b.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
        b.castShadow = true;
        scene.add(b);
        OBSTACLES.push({ x: b.position.x, z: b.position.z, r: Math.max(w, d) / 2 + 0.4 });
    }

    // Trees
    for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 44 + Math.random() * 80;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        if (Math.abs(r - 30) < 7) continue;
        addTree(scene, x, z, 0.7 + Math.random() * 0.9);
    }

    // Bowling pins cluster
    for (let i = 0; i < 10; i++) {
        const pin = new THREE.Mesh(
            new THREE.CylinderGeometry(0.18, 0.28, 1.4, 8),
            new THREE.MeshLambertMaterial({ color: '#f1faee' })
        );
        pin.position.set(-42 + (i % 5) * 1.4, 0.7, -6 + Math.floor(i / 5) * 1.4);
        pin.castShadow = true;
        scene.add(pin);
    }

    // Cones
    for (let i = 0; i < 8; i++) {
        const cone = new THREE.Mesh(
            new THREE.ConeGeometry(0.4, 1, 10),
            new THREE.MeshLambertMaterial({ color: '#ff7b00' })
        );
        cone.position.set(14, 0.5, 10 + i * 2.5);
        cone.castShadow = true;
        scene.add(cone);
        OBSTACLES.push({ x: 14, z: 10 + i * 2.5, r: 0.6 });
    }

    // Ramps (launch pads)
    const ramps = [
        addRamp(scene, 0, 45, 0),
        addRamp(scene, -45, 0, Math.PI / 2),
        addRamp(scene, 30, -38, Math.PI / 4)
    ];

    // Checkpoints along the ring
    const checkpoints = [];
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const p = { x: Math.cos(a) * 30, z: Math.sin(a) * 30 };
        checkpoints.push(p);
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(2.2, 0.15, 8, 24),
            new THREE.MeshBasicMaterial({ color: '#ffd166', transparent: true, opacity: 0.85 })
        );
        ring.position.set(p.x, 2, p.z);
        ring.lookAt(p.x, 4, p.z);
        scene.add(ring);
        p.ring = ring;
    }

    // Start pad
    const pad = new THREE.Mesh(
        new THREE.CircleGeometry(6, 32),
        new THREE.MeshLambertMaterial({ color: '#c9ada7' })
    );
    pad.rotation.x = -Math.PI / 2;
    pad.position.set(0, 0.03, 0);
    scene.add(pad);

    // ===== Hidden secrets (glowing stars to find) =====
    const secrets = [];
    const secretSpots = [
        { x: 0, z: 60, label: 'A star beyond the road' },
        { x: -70, z: 20, label: 'A star hidden in the trees' },
        { x: 80, z: -60, label: 'A star far from home' },
        { x: -50, z: -80, label: 'A star in the deep field' },
        { x: 60, z: 50, label: 'A star near the buildings' }
    ];
    for (const s of secretSpots) {
        const star = new THREE.Mesh(
            new THREE.OctahedronGeometry(0.9, 0),
            new THREE.MeshBasicMaterial({ color: '#ffe066' })
        );
        star.position.set(s.x, 1.6, s.z);
        scene.add(star);
        secrets.push({ x: s.x, z: s.z, label: s.label, mesh: star, found: false });
    }

    return {
        obstacles: OBSTACLES,
        ramps,
        checkpoints,
        secrets,
        respawnPoint: new THREE.Vector3(0, 1, 0),
        mapRadius: 130,
        update(dt, elapsed) {
            for (const c of checkpoints) {
                c.ring.rotation.z += dt;
            }
            for (const s of secrets) {
                if (!s.found) {
                    s.mesh.rotation.y += dt * 2;
                    s.mesh.position.y = 1.6 + Math.sin(elapsed * 0.002 + s.x) * 0.4;
                }
            }
        }
    };
}
