import * as THREE from 'three';
import { kaleidoscopeVertexShader, kaleidoscopeFragmentShader } from './kaleidoscopeShader.js';
import { ObjectChamber } from './ObjectChamber.js?v=100';
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
const chamber = new ObjectChamber(renderer, window.innerWidth, window.innerHeight);
chamber.resize(window.innerWidth, window.innerHeight);

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
let lastInteractionTime = 0;
const IDLE_THRESHOLD = window.IDLE_THRESHOLD_OVERRIDE || 30.0; // Seconds

// Expose for debugging
window.chamber = chamber;

// --- Audio Engine ---
import { KaleidoscopeAudio } from './KaleidoscopeAudio.js';
const audio = new KaleidoscopeAudio();
window.audio = audio; // Expose for debugging
let btnAudio;

// Connect Collision Audio
chamber.setAudio(audio);


// --- UI Controls ---
let btnBuild, inputSegments, inputCount, groupMirrors, groupCount, checkChamber, valueSegments, valueCount, instructions, speedSlider, valueSpeed;

document.addEventListener('DOMContentLoaded', () => {
    btnBuild = document.getElementById('btn-build');
    // ... existing ...
    inputSegments = document.getElementById('input-segments');
    inputCount = document.getElementById('input-count');
    groupMirrors = document.getElementById('group-mirrors');
    groupCount = document.getElementById('group-count');
    checkChamber = document.getElementById('check-chamber');
    valueSegments = document.getElementById('value-segments');
    valueCount = document.getElementById('value-count');
    instructions = document.querySelector('.instructions');
    speedSlider = document.getElementById('speedSlider');
    valueSpeed = document.getElementById('value-speed');

    btnAudio = document.getElementById('btn-audio');
    if (btnAudio) {
        btnAudio.addEventListener('click', async () => {
            if (!audio.isPlaying) {
                await audio.init();
                audio.start();
                btnAudio.innerHTML = '<span class="icon">🔇</span> Stop Audio';
                btnAudio.classList.add('active');
            } else {
                audio.stop();
                btnAudio.innerHTML = '<span class="icon">🔊</span> Start Audio';
                btnAudio.classList.remove('active');
            }
        });
    }

    if (btnBuild) {
        btnBuild.addEventListener('click', () => {
            // Pass current count value if in chamber mode, else undefined (random)
            const count = checkChamber.checked ? parseInt(inputCount.value) : undefined;
            chamber.buildNew(count);
            lastInteractionTime = clock.getElapsedTime();
        });
    }

    if (inputSegments) {
        inputSegments.addEventListener('input', (e) => {
            uniforms.uSegments.value = parseFloat(e.target.value);
            valueSegments.innerText = e.target.value;
            lastInteractionTime = clock.getElapsedTime();
        });
    }

    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            valueSpeed.innerText = e.target.value;
            lastInteractionTime = clock.getElapsedTime();
        });
    }

    // Debounce buildNew for performance
    let buildTimeout;
    if (inputCount) {
        inputCount.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            valueCount.innerText = count;
            clearTimeout(buildTimeout);
            buildTimeout = setTimeout(() => {
                chamber.buildNew(count);
            }, 300);
            lastInteractionTime = clock.getElapsedTime();
        });
    }

    if (checkChamber) {
        checkChamber.addEventListener('change', (e) => {
            if (e.target.checked) {
                groupMirrors.style.display = 'none';
                groupCount.style.display = 'flex';
                instructions.innerText = 'Drag to Rotate View • Scroll to Zoom';
                // Build with current count immediately
                chamber.buildNew(parseInt(inputCount.value));
            } else {
                groupMirrors.style.display = 'flex';
                groupCount.style.display = 'none';
                instructions.innerText = 'Drag to Rotate & Color • Scroll to Zoom';
                chamber.buildNew(); // Random count for kaleidoscope
            }
            lastInteractionTime = clock.getElapsedTime();
        });
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
    lastInteractionTime = clock.getElapsedTime();

    // Audio feedback?
    // audio.triggerInteractionSound(); // Future
};

const onMove = (x, y) => {
    // Background Color Logic (Mouse Y)
    // Map Y to Hue (0-1) and Intensity (0.5 - 2.0)
    const hue = y / window.innerHeight;
    const intensity = 0.5 + (1.0 - (y / window.innerHeight)) * 1.5; // Top is brighter
    chamber.updateEnvironment(hue, intensity);

    lastInteractionTime = clock.getElapsedTime();

    // Reset major idle timer on interaction
    if (window.lastMajorIdleTime) {
        window.lastMajorIdleTime = lastInteractionTime;
    }

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
    lastInteractionTime = clock.getElapsedTime();
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
    lastInteractionTime = clock.getElapsedTime();
    // inputZoom.value = newZoom; // Sync UI
}, { passive: false });


// --- UI Inactivity Fade ---
let inactivityTimer;
const uiElements = document.querySelectorAll('.ui-fade');
const urlParams = new URLSearchParams(window.location.search);
const uiDebug = urlParams.get('ui_debug') === 'true';

function resetInactivityTimer() {
    // Show UI
    uiElements.forEach(el => el.classList.remove('ui-hidden'));
    document.body.classList.remove('cursor-hidden');

    if (uiDebug) return; // Keep UI always visible in debug mode

    // Clear existing timer
    clearTimeout(inactivityTimer);

    // Set new timer for 5 seconds
    inactivityTimer = setTimeout(() => {
        uiElements.forEach(el => el.classList.add('ui-hidden'));
        document.body.classList.add('cursor-hidden');
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

    // Determine Speed Multiplier
    let speedMult = 1.0;
    if (speedSlider) {
        speedMult = parseFloat(speedSlider.value) / 10.0;
    }

    // Update Audio
    if (audio.isPlaying) {
        audio.updateParams(speedMult, chamber.currentTheme);
    }

    // Idle Animation Logic
    const timeSinceInteraction = time - lastInteractionTime;
    const isIdle = !isDragging && timeSinceInteraction > IDLE_THRESHOLD;

    // Notify Audio of Idle State
    if (audio && audio.isInitialized) {
        audio.setIdle(isIdle);
    }

    if (isIdle) {
        // Procedural "Wandering" Rotation
        // State: Move in a direction, slow down, stop, maybe reverse.

        // Randomly change "target" idle velocity every few seconds
        // Use a noise-like function or simple probability
        if (!window.idleNextStateTime || time > window.idleNextStateTime) {
            // Pick next state duration (2 to 7 seconds)
            window.idleNextStateTime = time + 2.0 + Math.random() * 5.0;

            // Pick next target velocity
            const chance = Math.random();
            if (chance < 0.3) {
                // Stop/Pause (30% chance)
                window.idleTargetVelocity = 0;
            } else {
                // Move (70% chance)
                // Random direction (+/- 1)
                const dir = Math.random() > 0.5 ? 1 : -1;
                // Random slow speed (0.0005 to 0.003)
                const magnitude = 0.0005 + Math.random() * 0.0025;
                window.idleTargetVelocity = dir * magnitude;
            }
        }

        // Initialize if undefined
        if (window.idleCurrentVelocity === undefined) window.idleCurrentVelocity = 0;

        // Smoothly lerp current velocity to target (Heavy damping for "easy does it")
        // Lerp factor 0.02 is very slow smoothing
        window.idleCurrentVelocity += (window.idleTargetVelocity - window.idleCurrentVelocity) * 0.01;

        // Apply
        uniforms.uAngle.value += window.idleCurrentVelocity * speedMult;

        // Breathing Zoom
        // Base 1.0, varies +/- 0.1, slow period
        const idleZoom = 1.0 + Math.sin(time * 0.5) * 0.1;
        // Lerp current zoom towards idle zoom
        uniforms.uZoom.value += (idleZoom - uniforms.uZoom.value) * 0.01;

        // Animate Background Hue
        // Cycle roughly every 60 seconds
        const idleHue = (time * 0.05) % 1.0;
        chamber.updateEnvironment(idleHue, 1.0); // Maintain high intensity

        // Dynamic Content Swapping
        // Every 2 seconds (approx), swap 1-2 objects
        if (Math.floor(time * 0.5) > Math.floor((time - delta) * 0.5)) {
            const swapCount = 1 + Math.floor(Math.random() * 2);
            const themes = ['christmas', 'halloween', 'industrial', 'fruity', 'gemstone'];
            const randomTheme = themes[Math.floor(Math.random() * themes.length)];

            if (chamber.objects.length < 100) {
                chamber.swapObjects(swapCount, randomTheme);
            } else {
                chamber.removeRandomObject();
            }
        }

        // --- Major Idle Reset (User Request) ---
        // Every 30 to 120 seconds, rebuild scope and reset audio
        if (!window.lastMajorIdleTime) {
            window.lastMajorIdleTime = time;
            window.nextMajorIdleInterval = 30 + Math.random() * 90;
        }

        if (time - window.lastMajorIdleTime > window.nextMajorIdleInterval) {
            console.log("Triggering Major Idle Reset");

            // 1. Rebuild Scope
            chamber.buildNew();

            // 2. Reset Audio (Fade & Restart)
            if (audio && audio.isInitialized) {
                audio.performTextureReset();
            }

            // 3. Randomize Mirrors (4-16)
            const newSegments = 4 + Math.floor(Math.random() * 13);
            uniforms.uSegments.value = newSegments;
            if (inputSegments) inputSegments.value = newSegments;
            if (valueSegments) valueSegments.innerText = newSegments;

            // 3. Reset Timer
            window.lastMajorIdleTime = time;
            window.nextMajorIdleInterval = 30 + Math.random() * 90; // new random interval
        }

    } else if (!isDragging) {
        // Normal Inertia
        // Decay velocity
        targetRotationVelocity *= 0.95;
        uniforms.uAngle.value += targetRotationVelocity * speedMult;
    }

    // Update Chamber (physics/movement)
    chamber.update(time, speedMult);

    // Render Chamber to Texture
    chamber.render();

    // Update Uniforms
    uniforms.uTime.value = time;

    // Render Main Scene
    if (checkChamber && checkChamber.checked) {
        // Safety check for aspect ratio
        if (chamber.debugCamera && Math.abs(chamber.debugCamera.aspect - (window.innerWidth / window.innerHeight)) > 0.01) {
            chamber.resize(window.innerWidth, window.innerHeight);
        }
        // Debug view: render chamber directly to screen
        renderer.render(chamber.scene, chamber.debugCamera);
    } else {
        // Kaleidoscope view with Bloom
        composer.render();
    }
}

animate();
