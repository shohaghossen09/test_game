import * as THREE from 'three';
import { asphaltTexture, grassTexture, concreteTexture, barkTexture, noiseTexture } from './textures.js';

// ============================================================
// PBR material library — physical shading (metalness/roughness)
// + environment reflections = realistic, not cartoon-flat.
// ============================================================

let LIB = null;

export function materials() {
    if (LIB) return LIB;

    const grass = grassTexture();
    grass.repeat.set(50, 50);
    const asphalt = asphaltTexture();
    asphalt.repeat.set(5, 1);
    const concrete = concreteTexture();
    concrete.repeat.set(2, 2);
    const bark = barkTexture();
    bark.repeat.set(2, 3);

    LIB = {
        ground: new THREE.MeshStandardMaterial({
            map: grass, color: '#c3cf9e', roughness: 1, metalness: 0
        }),
        road: new THREE.MeshStandardMaterial({
            map: asphalt, roughness: 0.92, metalness: 0.02
        }),
        laneMark: new THREE.MeshStandardMaterial({
            color: '#e8e4d8', roughness: 0.7, metalness: 0
        }),
        concrete: new THREE.MeshStandardMaterial({
            map: concrete, roughness: 0.85, metalness: 0.05
        }),
        pad: new THREE.MeshStandardMaterial({
            map: concrete, color: '#b8b2a8', roughness: 0.8, metalness: 0.05
        }),
        bark: new THREE.MeshStandardMaterial({
            map: bark, roughness: 0.95, metalness: 0
        }),
        leaves: new THREE.MeshStandardMaterial({
            color: '#2f6b33', roughness: 0.9, metalness: 0
        }),
        brick: (hex) => new THREE.MeshStandardMaterial({
            color: hex, roughness: 0.8, metalness: 0.08,
            bumpMap: noiseTexture(), bumpScale: 0.02
        }),
        metal: (hex) => new THREE.MeshStandardMaterial({
            color: hex, roughness: 0.35, metalness: 0.85
        }),
        rubber: new THREE.MeshStandardMaterial({
            color: '#1c1c1e', roughness: 0.95, metalness: 0
        }),
        plastic: (hex) => new THREE.MeshStandardMaterial({
            color: hex, roughness: 0.55, metalness: 0.05
        }),
        glossPaint: (hex) => new THREE.MeshStandardMaterial({
            color: hex, roughness: 0.22, metalness: 0.6, envMapIntensity: 1.4
        }),
        glass: new THREE.MeshPhysicalMaterial({
            color: '#9fb8c8', roughness: 0.08, metalness: 0,
            transparent: true, opacity: 0.45, envMapIntensity: 1.6
        }),
        pitch: new THREE.MeshStandardMaterial({
            map: grassTexture(), color: '#3f7d2f', roughness: 1, metalness: 0
        })
    };
    return LIB;
}
