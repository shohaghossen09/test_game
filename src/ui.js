import * as THREE from 'three';

export class UI {
    constructor() {
        this.el = {
            hud: document.getElementById('hud'),
            speed: document.getElementById('hud-speed-value'),
            hint: document.getElementById('hint'),
            minimap: document.getElementById('minimap'),
            title: document.getElementById('screen-title'),
            options: document.getElementById('screen-options'),
            controls: document.getElementById('screen-controls'),
            circuit: document.getElementById('screen-circuit'),
            circuitMsg: document.getElementById('circuit-msg'),
            circuitTime: document.getElementById('circuit-time'),
            circuitBest: document.getElementById('circuit-best')
        };
        this.showMap = true;
        this.mmCtx = this.el.minimap.getContext('2d');
        this.hintTimer = 0;
    }

    showHud() { this.el.hud.classList.remove('hidden'); }
    hideTitle() { this.el.title.classList.add('hidden'); }
    showOptions() { this.el.options.classList.remove('hidden'); }
    hideOptions() { this.el.options.classList.add('hidden'); }
    showControls() { this.el.controls.classList.remove('hidden'); }
    hideControls() { this.el.controls.classList.add('hidden'); }

    toggleMap() {
        this.showMap = !this.showMap;
        this.el.minimap.classList.toggle('hidden', !this.showMap);
    }

    setHint(text, seconds = 4) {
        this.el.hint.textContent = text;
        this.hintTimer = seconds;
    }

    updateSpeed(kmh) { this.el.speed.textContent = kmh; }

    updateCircuit(timeStr, idx, total) {
        if (this.circuitPanelOpen) {
            this.el.circuitTime.textContent = timeStr;
        }
        if (idx > 0) {
            this.setHint(`Checkpoint ${idx}/${total} — keep going!`, 3);
        }
    }

    showCircuitResult(msg, timeStr, bestStr) {
        this.circuitPanelOpen = true;
        this.el.circuit.classList.remove('hidden');
        this.el.circuitMsg.textContent = msg;
        this.el.circuitTime.textContent = timeStr;
        this.el.circuitBest.textContent = `Best: ${bestStr}`;
    }

    hideCircuitResult() {
        this.circuitPanelOpen = false;
        this.el.circuit.classList.add('hidden');
    }

    updateMinimap(carPos, world) {
        if (!this.showMap) return;
        const ctx = this.mmCtx;
        const W = 180, scale = W / (world.mapRadius * 2 + 40);
        ctx.clearRect(0, 0, W, W);
        ctx.save();
        ctx.translate(W / 2, W / 2);

        // road ring
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 8 * scale * 30;
        ctx.beginPath();
        ctx.arc(0, 0, 30 * scale * 2.4, 0, Math.PI * 2);
        ctx.stroke();

        // checkpoints
        for (const c of world.checkpoints) {
            ctx.fillStyle = '#ffd166';
            ctx.fillRect(c.x * scale - 1, c.z * scale - 1, 3, 3);
        }

        // car
        ctx.fillStyle = '#ff4d6d';
        ctx.beginPath();
        ctx.arc(carPos.x * scale, carPos.z * scale, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update(dt) {
        if (this.hintTimer > 0) {
            this.hintTimer -= dt;
            if (this.hintTimer <= 0) {
                this.el.hint.textContent = 'WASD / Arrows to drive · Shift boost · Space jump · H honk';
            }
        }
    }
}
