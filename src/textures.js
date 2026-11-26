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
        ctx.lineWidth = Math.random() * 1.2 +  toggle3;
        ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}
