import * as THREE from 'three';
import { kaleidoscopeVertexShader, kaleidoscopeFragmentShader } from './kaleidoscopeShader.js';
import { ObjectChamber } from './ObjectChamber.js?v=4';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- Initialization ---
const container = document.getElementById('canvas-container');
if (!container) console.error('Canvas container not found!');

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio for performance
renderer.toneMapping = THREE.ReinhardToneMapping;
container.appendChild(renderer.domElement);

// Main Scene (for the quad)
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// Object Chamber (The Source)
const chamber = new ObjectChamber(renderer);

// Shader Material
const uniforms = {
    tDiffuse: { value: chamber.getTexture() },
    uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uSegments: { value: 8.0 },
    uAngle: { value: 0.0 },
    uZoom: { value: 1.0 },
    uTime: { value: 0.0 }
};

const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: kaleidoscopeVertexShader,
    fragmentShader: kaleidoscopeFragmentShader
});

const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
scene.add(quad);

// --- Post-Processing ---
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2;
bloomPass.strength = 0.8; // Glow strength
bloomPass.radius = 0.5;
composer.addPass(bloomPass);

const outputPass = new OutputPass();
composer.addPass(outputPass);

// --- Interaction State ---
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let rotationVelocity = 0; // For inertia
let targetRotationVelocity = 0;

// --- UI Controls ---
const btnBuild = document.getElementById('btn-build');
const inputSegments = document.getElementById('input-segments');
const inputCount = document.getElementById('input-count');
const groupMirrors = document.getElementById('group-mirrors');
const groupCount = document.getElementById('group-count');
const checkChamber = document.getElementById('check-chamber');
const valueSegments = document.getElementById('value-segments');
const valueCount = document.getElementById('value-count');
const instructions = document.querySelector('.instructions');

btnBuild.addEventListener('click', () => {
    // Pass current count value if in chamber mode, else undefined (random)
    const count = checkChamber.checked ? parseInt(inputCount.value) : undefined;
    chamber.buildNew(count);
});

inputSegments.addEventListener('input', (e) => {
    uniforms.uSegments.value = parseFloat(e.target.value);
    valueSegments.innerText = e.target.value;
});

// Debounce buildNew for performance
let buildTimeout;
inputCount.addEventListener('input', (e) => {
    const count = parseInt(e.target.value);
    valueCount.innerText = count;
    clearTimeout(buildTimeout);
    buildTimeout = setTimeout(() => {
        chamber.buildNew(count);
    }, 100);
});

checkChamber.addEventListener('change', (e) => {
    if (e.target.checked) {
        // Show Item Count, Hide Mirrors
        groupMirrors.style.display = 'none';
        groupCount.style.display = 'flex';
        instructions.style.display = 'none';
    } else {
        // Show Mirrors, Hide Item Count
        groupMirrors.style.display = 'flex';
        groupCount.style.display = 'none';
        instructions.style.display = 'block';
    }
});

// --- Input Handling ---
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
});

// Mouse / Touch for Rotation
const onStart = (x, y) => {
    isDragging = true;
    lastMouseX = x;
    lastMouseY = y;
    targetRotationVelocity = 0;
};

const onMove = (x, y) => {
    // Background Color Logic (Mouse Y)
    // Map Y to Hue (0-1) and Intensity (0.5 - 2.0)
    const hue = y / window.innerHeight;
    const intensity = 0.5 + (1.0 - (y / window.innerHeight)) * 1.5; // Top is brighter
    chamber.updateEnvironment(hue, intensity);

    if (!isDragging) return;
    const deltaX = x - lastMouseX;
    const deltaY = y - lastMouseY;

    // Calculate angle change based on movement around center
    // Or simpler: just X movement rotates it
    const sensitivity = 0.005;
    uniforms.uAngle.value -= deltaX * sensitivity;

    // Add some "velocity" for inertia
    targetRotationVelocity = -deltaX * sensitivity;

    lastMouseX = x;
    lastMouseY = y;
};

const onEnd = () => {
    isDragging = false;
};

// Mouse Events
container.addEventListener('mousedown', e => onStart(e.clientX, e.clientY));
window.addEventListener('mousemove', e => onMove(e.clientX, e.clientY));
window.addEventListener('mouseup', onEnd);

// Touch Events
container.addEventListener('touchstart', e => onStart(e.touches[0].clientX, e.touches[0].clientY), { passive: false });
window.addEventListener('touchmove', e => {
    if (isDragging) e.preventDefault(); // Prevent scrolling
    onMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
window.addEventListener('touchend', onEnd);

// Wheel for Zoom
container.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    let newZoom = uniforms.uZoom.value + e.deltaY * -zoomSpeed;
    newZoom = Math.max(0.5, Math.min(3.0, newZoom));
    uniforms.uZoom.value = newZoom;
    // inputZoom.value = newZoom; // Sync UI
}, { passive: false });


// --- UI Inactivity Fade ---
let inactivityTimer;
const uiElements = document.querySelectorAll('.ui-fade');
const urlParams = new URLSearchParams(window.location.search);
const uiDebug = urlParams.has('ui_debug');

function resetInactivityTimer() {
    // Show UI
    uiElements.forEach(el => el.classList.remove('ui-hidden'));

    if (uiDebug) return; // Keep UI always visible in debug mode

    // Clear existing timer
    clearTimeout(inactivityTimer);

    // Set new timer for 5 seconds
    inactivityTimer = setTimeout(() => {
        uiElements.forEach(el => el.classList.add('ui-hidden'));
    }, 5000);
}

// Initialize timer
resetInactivityTimer();

// Hook into interactions
window.addEventListener('mousemove', resetInactivityTimer);
window.addEventListener('mousedown', resetInactivityTimer);
window.addEventListener('touchstart', resetInactivityTimer);
window.addEventListener('wheel', resetInactivityTimer);
window.addEventListener('keydown', resetInactivityTimer);


// --- Animation Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();
    const delta = clock.getDelta();

    // Inertia for rotation
    if (!isDragging) {
        // Decay velocity
        targetRotationVelocity *= 0.95;
        uniforms.uAngle.value += targetRotationVelocity;
    }

    // Update Chamber (physics/movement)
    chamber.update(time);

    // Render Chamber to Texture
    chamber.render();

    // Update Uniforms
    uniforms.uTime.value = time;

    // Render Main Scene
    if (checkChamber.checked) {
        // Debug view: render chamber directly to screen
        renderer.render(chamber.scene, chamber.camera);
    } else {
        // Kaleidoscope view with Bloom
        composer.render();
    }
}

animate();
