import * as THREE from 'three';

export class FollowCamera {
    constructor(camera, domElement) {
        this.camera = camera;
        this.dom = domElement;
        this.orbitYaw = 0;      // user drag offset
        this.orbitPitch = 0.35;
        this.zoom = 9;
        this.dragging = false;
        this.lastX = 0;
        this.lastY = 0;

        domElement.addEventListener('pointerdown', (e) => {
            this.dragging = true;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });
        window.addEventListener('pointerup', () => { this.dragging = false; });
        window.addEventListener('pointermove', (e) => {
            if (!this.dragging) return;
            this.orbitYaw -= (e.clientX - this.lastX) * 0.005;
            this.orbitPitch = THREE.MathUtils.clamp(
                this.orbitPitch + (e.clientY - this.lastY) * 0.003,
                0.05, 1.2
            );
            this.lastX = e.clientX;
            this.lastY = e.clientY;
        });
        domElement.addEventListener('wheel', (e) => {
            this.zoom = THREE.MathUtils.clamp(this.zoom + e.deltaY * 0.01, 5, 25);
        }, { passive: true });
    }

    update(dt, carPosition, carHeading) {
        // slowly relax orbit back behind the car
        this.orbitYaw *= (1 - Math.min(1, dt * 0.5));

        const angle = carHeading + Math.PI + this.orbitYaw;
        const targetPos = new THREE.Vector3(
            carPosition.x + Math.sin(angle) * this.zoom,
            carPosition.y + this.zoom * this.orbitPitch + 2,
            carPosition.z + Math.cos(angle) * this.zoom
        );

        // smooth follow
        this.camera.position.lerp(targetPos, Math.min(1, dt * 4));
        this.camera.lookAt(
            carPosition.x,
            carPosition.y + 1,
            carPosition.z
        );
    }

    reset() {
        this.orbitYaw = 0;
        this.orbitPitch = 0.35;
        this.zoom = 9;
    }
}
