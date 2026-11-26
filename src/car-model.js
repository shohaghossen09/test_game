import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Optional real 3D car model support (Option B).
 * If the repo contains ./assets/car.glb, it replaces the procedural car body.
 * If the file is missing, the procedural car stays — nothing breaks.
 *
 * Setup: upload any CC0 .glb car (kenney.nl, quaternius.com, poly.pizza)
 * to the assets/ folder in the repo, named car.glb.
 */
export function loadCarModel(car) {
    const loader = new GLTFLoader();
    loader.load(
        './assets/car.glb',
        (gltf) => {
            const model = gltf.scene;

            // Enable realistic shading on every mesh
            model.traverse((o) => {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                    if (o.material) o.material.envMapIntensity = 1.2;
                }
            });

            // Auto-scale: normalize the model to our car length (~3.2 m)
            const box = new THREE.Box3().setFromObject(model);
            const size = new THREE.Vector3();
            box.getSize(size);
            const longest = Math.max(size.x, size.z) || 1;
            const scale = 3.2 / longest;
            model.scale.setScalar(scale);

            // Re-center on the ground
            const scaled = new THREE.Box3().setFromObject(model);
            const center = new THREE.Vector3();
            scaled.getCenter(center);
            model.position.x -= center.x;
            model.position.z -= center.z;
            model.position.y -= scaled.min.y;

            // Hide the procedural body but KEEP the wheels
            // (wheels are children of car.body, referenced by car.update)
            for (const child of car.body.children) {
                if (!car.wheels || car.wheels.indexOf(child) === -1) {
                    child.visible = false;
                }
            }

            car.group.add(model);
        },
        undefined,
        () => { /* no model file — keep procedural car */ }
    );
}
