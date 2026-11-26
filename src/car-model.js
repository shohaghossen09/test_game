import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Optional real 3D car model support.
 * If the repo contains ./assets/car.glb, it replaces the procedural car body.
 * If the file is missing, the procedural car stays — nothing breaks.
 *
 * To use: upload any CC0 .glb car model to the assets/ folder
 * in the repo, named car.glb. Free CC0 sources: kenney.nl,
 * quaternius.com, poly.pizza.
 */
export function loadCarModel(car) {
    const loader = new GLTFLoader();
    loader.load(
        './assets/car.glb',
        (gltf) => {
            const model = gltf.scene;
            model.traverse((o) => {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                }
            });
            model.position.set(0, 0, 0);
            if (car.body) car.body.visible = false;
            car.group.add(model);
        },
        undefined,
        () => { /* no model file — keep procedural car */ }
    );
}
