import * as THREE from 'three';
import { createWorld } from './world.js';
import { Car } from './car.js';
import { FollowCamera } from './camera.js';
import { UI } from './ui.js';
import { Circuit } from './circuit.js';
import { materials } from './materials.js';
import { loadCarModel } from './car-model.js';
import { Sky } from 'three/addons/objects/Sky.js';

const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#cfe0ea', 70, 260);

// ===== Physically-based sky (Preetham atmosphere) =====
const sky = new Sky();
sky.scale.setScalar(45000);
scene.add(sky);
const skyUniforms = sky.material.uniforms;
skyUniforms.turbidity.value = 6;
skyUniforms.rayleigh.value = 1.8;
skyUniforms.mieCoefficient.value = 0.005;
skyUniforms.mieDirectionalG.value = 0.8;
const sunVec = new THREE.Vector3().setFromSphericalCoords(
    1, THREE.MathUtils.degToRad(62), THREE.MathUtils.degToRad(135)
);
skyUniforms.sunPosition.value.copy(sunVec);

// Environment reflections generated from the sky itself
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(sky).texture;
pmrem.dispose();

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 5000);
camera.position.set(0, 8, 14);

// Sun light aligned with the sky sun
const sun = new THREE.DirectionalLight('#fff2dd', 2.4);
sun.position.copy(sunVec).multiplyScalar(80);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -80;
sun.shadow.camera.right = 80;
sun.shadow.camera.top = 80;
sun.shadow.camera.bottom = -80;
sun.shadow.bias = -0.0004;
scene.add(sun);
scene.add(new THREE.HemisphereLight('#cfe8ff', '#5d8a3a', 0.5));

materials();

const world = createWorld(scene);
const car = new Car(scene);
car.respawn(world.respawnPoint);
loadCarModel(car);
const followCam = new FollowCamera(camera, canvas);
const ui = new UI();
const circuit = new Circuit(world, ui);

const audio = {
    enabled: true,
    ctx: null,
    ensure() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    honk() {
        this.ensure();
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = 'square';
        o.frequency.value = 420;
        g.gain.setValueAtTime(0.08, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        o.connect(g).connect(this.ctx.destination);
        o.start();
        o.stop(this.ctx.currentTime + 0.3);
    },
    playChime() {
        this.ensure();
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((f, i) => {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = 'sine';
            o.frequency.value = f;
            const t = this.ctx.currentTime + i * 0.12;
            g.gain.setValueAtTime(0.1, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            o.connect(g).connect(this.ctx.destination);
            o.start(t);
            o.stop(t + 0.4);
        });
    }
};

let secretsFoundCount = 0;
ui.initSecrets(world.secrets.length);

function checkSecrets() {
    for (const s of world.secrets) {
        if (s.found) continue;
        const d = Math.hypot(car.group.position.x - s.x, car.group.position.z - s.z);
        if (d < 3) {
            s.found = true;
            scene.remove(s.mesh);
            secretsFoundCount++;
            ui.updateSecrets(secretsFoundCount);
            if (secretsFoundCount === world.secrets.length) {
                ui.setHint('All secrets found! You win!', 6);
                audio.playChime();
            } else {
                ui.setHint('Secret found! ' + secretsFoundCount + '/' + world.secrets.length + ' ' + s.label, 4);
            }
        }
    }
}

const visitedAreas = new Set();
function checkAreas() {
    for (const a of world.areas) {
        if (visitedAreas.has(a.name)) continue;
        const d = Math.hypot(car.group.position.x - a.x, car.group.position.z - a.z);
        if (d < a.r) {
            visitedAreas.add(a.name);
            if (a.name !== 'Home') {
                ui.setHint('Welcome to ' + a.name + '!', 3);
            }
        }
    }
}

const input = { forward: false, backward: false, left: false, right: false, boost: false, brake: false, jump: false };

const KEYMAP = {
    KeyW: 'forward', ArrowUp: 'forward',
    KeyS: 'backward', ArrowDown: 'backward',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'boost', ShiftRight: 'boost',
    ControlLeft: 'brake'
};

addEventListener('keydown', (e) => {
    if (KEYMAP[e.code]) { input[KEYMAP[e.code]] = true; e.preventDefault(); }
    if (e.code === 'Space') { input.jump = true; e.preventDefault(); }
    switch (e.code) {
        case 'KeyR': car.respawn(world.respawnPoint); ui.setHint('Respawned!', 2); break;
        case 'KeyM': ui.toggleMap(); break;
        case 'KeyL': audio.enabled = !audio.enabled; ui.setHint(audio.enabled ? 'Sound on' : 'Sound off', 2); break;
        case 'KeyH': car.honk(audio); break;
        case 'KeyB': ui.showBts(); break;
        case 'KeyC': circuit.start(); ui.setHint('Circuit started - hit the red checkpoint!', 4); break;
        case 'KeyO': ui.showOptions(); break;
        case 'KeyK': ui.showControls(); break;
        case 'Escape': ui.hideOptions(); ui.hideControls(); ui.hideCircuitResult(); ui.hideBts(); break;
        default:
            if (/^Digit[1-9]$/.test(e.code)) car.doHydraulics();
    }
});
addEventListener('keyup', (e) => {
    if (KEYMAP[e.code]) input[KEYMAP[e.code]] = false;
    if (e.code === 'Space') input.jump = false;
});

const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

if (isTouchDevice) {
    const touchControls = document.getElementById('touch-controls');
    const stick = document.getElementById('touch-steer');
    const knob = document.getElementById('touch-knob');

    function setKnob(dx, dy) {
        knob.style.left = 'calc(50% + ' + dx + 'px)';
        knob.style.top = 'calc(50% + ' + dy + 'px)';
    }

    function updateStick(e) {
        const rect = stick.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = e.clientX - cx, dy = e.clientY - cy;
        const max = rect.width / 2 - 10;
        const d = Math.hypot(dx, dy);
        if (d > max) { dx = dx / d * max; dy = dy / d * max; }
        setKnob(dx, dy);
        input.forward = dy < -10;
        input.backward = dy > 10;
        input.left = dx < -10;
        input.right = dx > 10;
    }

    function resetStick() {
        input.left = input.right = input.forward = input.backward = false;
        setKnob(0, 0);
    }

    stick.addEventListener('pointerdown', (e) => {
        stick.setPointerCapture(e.pointerId);
        updateStick(e);
    });
    stick.addEventListener('pointermove', (e) => {
        if (stick.hasPointerCapture && stick.hasPointerCapture(e.pointerId)) updateStick(e);
    });
    stick.addEventListener('pointerup', resetStick);
    stick.addEventListener('pointercancel', resetStick);

    const bindHold = (id, prop) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); input[prop] = true; });
        btn.addEventListener('pointerup', () => { input[prop] = false; });
        btn.addEventListener('pointerleave', () => { input[prop] = false; });
        btn.addEventListener('pointercancel', () => { input[prop] = false; });
    };
    bindHold('touch-boost', 'boost');
    bindHold('touch-jump', 'jump');
    bindHold('touch-brake', 'brake');

    document.getElementById('btn-start').addEventListener('click', () => {
        touchControls.classList.remove('hidden');
    }, { once: true });
}

document.getElementById('btn-start').onclick = () => {
    ui.hideTitle();
    ui.showHud();
    audio.ensure();
};
document.getElementById('btn-bts').onclick = () => ui.showBts();
document.getElementById('btn-close-bts').onclick = () => ui.hideBts();
document.getElementById('btn-audio').onclick = () => { audio.enabled = !audio.enabled; ui.setHint(audio.enabled ? 'Sound on' : 'Sound off', 2); };
document.getElementById('btn-stuck').onclick = () => { car.respawn(world.respawnPoint); ui.setHint('Respawned!', 2); };
document.getElementById('btn-map').onclick = () => ui.toggleMap();
document.getElementById('btn-restart-circuit').onclick = () => { ui.hideCircuitResult(); circuit.start(); };
document.getElementById('opt-audio').onclick = (e) => {
    audio.enabled = !audio.enabled;
    e.target.textContent = audio.enabled ? 'On' : 'Off';
    e.target.classList.toggle('active', audio.enabled);
};
document.getElementById('opt-respawn').onclick = () => car.respawn(world.respawnPoint);
document.getElementById('opt-reset').onclick = () => {
    car.respawn(world.respawnPoint);
    circuit.reset();
    world.props.reset();
    visitedAreas.clear();
    ui.setHint('World reset', 2);
};
document.getElementById('opt-quality-low').onclick = () => setQuality(false);
document.getElementById('opt-quality-high').onclick = () => setQuality(true);
document.getElementById('btn-close-options').onclick = () => ui.hideOptions();

function setQuality(high) {
    renderer.shadowMap.enabled = high;
    renderer.setPixelRatio(high ? Math.min(devicePixelRatio, 2) : 0.75);
    scene.fog.far = high ? 260 : 150;
    document.getElementById('opt-quality-high').classList.toggle('active', high);
    document.getElementById('opt-quality-low').classList.toggle('active', !high);
    renderer.shadowMap.needsUpdate = true;
}

addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});

const clock = new THREE.Clock();

function tick() {
    requestAnimationFrame(tick);
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = performance.now();

    if (!ui.el.title.classList.contains('hidden')) {
        const t = elapsed * 0.0002;
        camera.position.set(Math.cos(t) * 24, 10, Math.sin(t) * 24);
        camera.lookAt(0, 1, 0);
    } else {
        car.update(dt, input, world);
        checkSecrets();
        checkAreas();
        circuit.update(car);
        world.update(dt, elapsed, car, audio);
        followCam.update(dt, car.group.position, car.heading);
        ui.updateSpeed(car.speedKmh);
        ui.updateMinimap(car.group.position, world);
    }
    ui.update(dt);
    renderer.render(scene, camera);
}
tick();
