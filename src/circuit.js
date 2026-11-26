export class Circuit {
    constructor(world, ui) {
        this.world = world;
        this.ui = ui;
        this.reset();
    }

    reset() {
        this.active = false;
        this.nextIndex = 0;
        this.startTime = 0;
        this.currentTime = 0;
        this.best = Number(localStorage.getItem('folio-drive-best')) || null;
    }

    start() {
        this.active = true;
        this.nextIndex = 0;
        this.startTime = performance.now();
        this.highlight();
    }

    highlight() {
        for (let i = 0; i < this.world.checkpoints.length; i++) {
            const c = this.world.checkpoints[i];
            c.ring.material.color.set(i === this.nextIndex ? '#ff4d6d' : '#ffd166');
        }
    }

    update(car) {
        if (!this.active) return;

        this.currentTime = performance.now() - this.startTime;
        const cp = this.world.checkpoints[this.nextIndex];
        const d = Math.hypot(car.group.position.x - cp.x, car.group.position.z - cp.z);
        if (d < 3.2) {
            this.nextIndex++;
            if (this.nextIndex >= this.world.checkpoints.length) {
                this.finish();
            } else {
                this.highlight();
            }
        }
        this.ui.updateCircuit(this.format(this.currentTime), this.nextIndex, this.world.checkpoints.length);
    }

    finish() {
        this.active = false;
        const t = this.currentTime;
        let msg = 'Finished! Well driven.';
        if (this.best === null || t < this.best) {
            this.best = t;
            localStorage.setItem('folio-drive-best', String(t));
            msg = 'New best time!';
        }
        this.ui.showCircuitResult(msg, this.format(t), this.format(this.best));
    }

    format(ms) {
        const m = Math.floor(ms / 60000);
        const s = Math.floor((ms % 60000) / 1000);
        const msec = Math.floor(ms % 1000);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(msec).padStart(3, '0')}`;
    }
}
