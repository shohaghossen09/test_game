import * as THREE from 'three';

// ============================================================
// Procedural canvas textures — no external texture downloads,
// everything is generated locally so the game stays lightweight.
// ============================================================

function makeCanvas(size = 256) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    return c;
}

/** Speckled asphalt texture */
export function asphaltTexture() {
    const c = makeCanvas(512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#3a3a3e';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
        const g = 40 + Math.random() * 45;
        ctx.fillStyle = `rgba(${g},${g},${g + 3},${0.12 + Math.random() * 0.25})`;
        const s = Math.random() * 3 + 0.5;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, s, s);
    }
    ctx.strokeStyle = 'rgba(20,20,22,0.35)';
    for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        let x = Math.random() * 512, y = Math.random() * 512;
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
            x += (Math.random() - 0.5) * 60;
            y += (Math.random() - 0.5) * 60;
            ctx.lineTo(x, y);
        }
        ctx.lineWidth = Math.random() * 1.2 + 0.3;
        ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

/** Grass texture — layered green blades and dirt patches */
export function grassTexture() {
    const c = makeCanvas(512);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#5d8a3a';
    ctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 9000; i++) {
        const x = Math.random() * 512, y = Math.random() * 512;
        const h = 3 + Math.random() * 7;
        const g = 105 + Math.random() * 70;
        ctx.strokeStyle = `rgba(${g * 0.55},${g * 0.85},${g * 0.38},${0.25 + Math.random() * 0.3})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (Math.random() - 0.5) * 3, y - h);
        ctx.stroke();
    }
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 512, y = Math.random() * 512, r = 8 + Math.random() * 24;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(122,96,60,0.28)');
        grad.addColorStop(1, 'rgba(122,96,60,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

/** Concrete — pads, ramps, windmill towers */
export function concreteTexture() {
    const c = makeCanvas(256);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#9a9a98';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 3500; i++) {
        const v = 130 + Math.random() * 50;
        ctx.fillStyle = `rgba(${v},${v},${v - 4},${0.15 + Math.random() * 0.25})`;
        ctx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

/** Wood bark for tree trunks */
export function barkTexture() {
    const c = makeCanvas(128);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#6b4a2f';
    ctx.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 128; x += 2) {
        const v = 70 + Math.random() * 50;
        ctx.fillStyle = `rgba(${v},${v * 0.68},${v * 0.45},${0.35 + Math.random() * 0.3})`;
        ctx.fillRect(x, 0, 1 + Math.random() * 2, 128);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

/** Rough noise — used as bump maps */
export function noiseTexture(size = 128, base = 128, spread = 50) {
    const c = makeCanvas(size);
    const ctx = c.getContext('2d');
    for (let y = 0; y < size; y += 2) {
        for (let x = 0; x < size; x += 2) {
            const v = base + (Math.random() - 0.5) * spread;
            ctx.fillStyle = `rgb(${v},${v},${v})`;
            ctx.fillRect(x, y, 2, 2);
        }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}
