import * as THREE from 'three';
import { ArtisanObjects } from './ArtisanObjects.js?v=3';

export class ObjectChamber {
    constructor(renderer, width, height) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100); // Wider FOV for fuller view
        this.camera.position.z = 7; // Closer for more density

        // Render Target for the chamber view (enhanced resolution with MSAA)
        this.renderTarget = new THREE.WebGLRenderTarget(2048, 2048, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping,
            samples: 4 // MSAA antialiasing
        });

        this.objects = [];
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Debug Camera for "View Chamber" mode (matches screen aspect)
        const aspect = (width && height) ? width / height : 1.0;
        this.debugCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.debugCamera.position.z = 10;


        // --- Lighting & Environment ---

        // 1. Backlight (The "Sun" at the end of the tube) - Reduced to prevent hot spot
        this.backlight = new THREE.PointLight(0xffffff, 4.0, 20); // Reduced from 8.0
        this.backlight.position.set(0, 0, -5); // Behind objects
        this.scene.add(this.backlight);

        // 2. Rim/Fill Lights
        const rimLight = new THREE.SpotLight(0xffaa00, 5.0);
        rimLight.position.set(5, 5, 5);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);

        const fillLight = new THREE.AmbientLight(0x404040, 2.0); // Higher ambient for glass
        this.scene.add(fillLight);

        // 3. Multiple colored accent lights for more sparkle
        const accentColors = [0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa8e6cf];
        this.accentLights = [];
        for (let i = 0; i < 4; i++) {
            const accentLight = new THREE.PointLight(accentColors[i], 3.0, 15);
            const angle = (i / 4) * Math.PI * 2;
            accentLight.position.set(
                Math.cos(angle) * 6,
                Math.sin(angle) * 6,
                0
            );
            this.scene.add(accentLight);
            this.accentLights.push(accentLight);
        }

        // 3. Procedural HDR Environment
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();

        // Background
        this.scene.background = new THREE.Color(0x101010);

        this.updateEnvironment();

        // Camera movement system
        this.cameraMode = 'inside'; // 'static', 'inside', 'orbital', 'drift', 'figure8', 'follow'
        this.cameraTime = 0;
        this.cameraDriftVel = new THREE.Vector3(
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.01,
            (Math.random() - 0.5) * 0.005
        );
        this.cameraTarget = new THREE.Vector3(0, 0, 0);

        // Randomly pick a camera mode at start
        const modes = ['inside', 'orbital', 'drift', 'figure8', 'follow'];
        this.cameraMode = modes[Math.floor(Math.random() * modes.length)];
        console.log('Camera Mode:', this.cameraMode);

        this.buildNew();
    }

    updateEnvironment(hue = 0.5, intensity = 1.0, saturation = 0.8, lightness = 0.25) {
        // Create a simple scene to render as env map
        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color().setHSL(hue, saturation * 0.8, lightness * 1.5 * intensity);

        // Add some bright "lights" (meshes) to the env scene to create reflections
        const geometry = new THREE.IcosahedronGeometry(1, 1);
        const material = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(hue + 0.3, 1.0, 0.8 * intensity) });

        for (let i = 0; i < 10; i++) {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20
            );
            envScene.add(mesh);
        }

        const envMap = this.pmremGenerator.fromScene(envScene).texture;
        this.scene.environment = envMap;
        this.scene.background = new THREE.Color().setHSL(hue, saturation, lightness * intensity);

        // Update backlight color too
        this.backlight.color.setHSL(hue, 0.5, 0.9);
        this.backlight.intensity = 5.0 * intensity;
    }

    buildNew(count) {
        // Clear existing
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }
        this.objects = [];

        // Select a Theme
        const themes = ['christmas', 'halloween', 'industrial', 'fruity', 'gemstone', 'aquarium', 'outer-space', 'microscopic', 'feline'];
        this.currentTheme = themes[Math.floor(Math.random() * themes.length)]; // Store on instance
        const theme = this.currentTheme;
        console.log('Selected Theme:', theme);

        // Create new objects (increased density)
        const numObjects = count || (50 + Math.floor(Math.random() * 50)); // 50-100 instead of 30-60

        for (let i = 0; i < numObjects; i++) {
            let mesh;
            const scale = 0.4 + Math.random() * 0.6; // Smaller, more uniform: 0.4-1.0 instead of 0.3-1.5
            let color = this.getThemeColor(theme);

            // Select Object Type based on Theme
            const type = Math.random();

            if (theme === 'christmas') {
                if (type < 0.2) mesh = ArtisanObjects.createCharm('star', scale, new THREE.Color(0xffd700)); // Gold Stars
                else if (type < 0.4) mesh = ArtisanObjects.createTwistedRod(scale * 1.5, new THREE.Color(0xff0000)); // Candy Canes
                else if (type < 0.6) mesh = ArtisanObjects.createBead(scale, new THREE.Color(0x00ff00)); // Green Beads
                else mesh = this.createStandardGem(scale, color); // Ornaments
            }
            else if (theme === 'halloween') {
                if (type < 0.2) mesh = ArtisanObjects.createCharm('moon', scale, new THREE.Color(0xffff00));
                else if (type < 0.4) mesh = ArtisanObjects.createCharm('cloud', scale, new THREE.Color(0x555555)); // Spooky clouds
                else if (type < 0.6) mesh = ArtisanObjects.createTwistedRod(scale, new THREE.Color(0xff6600)); // Orange rods
                else mesh = this.createStandardGem(scale, color);
            }
            else if (theme === 'industrial') {
                if (type < 0.3) mesh = ArtisanObjects.createScrew(scale, new THREE.Color(0xb87333)); // Copper
                else if (type < 0.6) mesh = ArtisanObjects.createColoredSpring(scale, new THREE.Color(0xc0c0c0)); // Steel
                else if (type < 0.8) mesh = ArtisanObjects.createCharm('lightning', scale, new THREE.Color(0xffff00)); // Electricity
                else mesh = this.createStandardGem(scale, color); // Raw gems
            }
            else if (theme === 'fruity') {
                if (type < 0.3) mesh = ArtisanObjects.createFruit('cherry', scale);
                else if (type < 0.6) mesh = ArtisanObjects.createFruit('grape', scale);
                else if (type < 0.8) mesh = ArtisanObjects.createBead(scale, color);
                else mesh = this.createStandardGem(scale, color);
            }
            else if (theme === 'aquarium') {
                if (type < 0.15) mesh = ArtisanObjects.createFish('tropical', scale, color);
                else if (type < 0.3) mesh = ArtisanObjects.createJellyfish(scale, color);
                else if (type < 0.4) mesh = ArtisanObjects.createSeahorse(scale, color);
                else if (type < 0.55) mesh = ArtisanObjects.createShell(Math.random() < 0.5 ? 'spiral' : 'scallop', scale, color);
                else if (type < 0.7) mesh = ArtisanObjects.createStarfish(scale, color);
                else if (type < 0.85) mesh = ArtisanObjects.createCoral(scale, color);
                else mesh = this.createStandardGem(scale, color); // Bubbles/gems
            }
            else if (theme === 'outer-space') {
                if (type < 0.2) mesh = ArtisanObjects.createPlanet('rocky', scale, color);
                else if (type < 0.35) mesh = ArtisanObjects.createPlanet('cratered', scale * 0.8, color);
                else if (type < 0.45) mesh = ArtisanObjects.createPlanet('ringed', scale, color);
                else if (type < 0.6) mesh = ArtisanObjects.createAsteroid(scale, color);
                else if (type < 0.75) mesh = ArtisanObjects.createComet(scale, color);
                else if (type < 0.9) mesh = ArtisanObjects.createSpaceStar(5, scale * 0.6, color);
                else mesh = this.createStandardGem(scale, color); // Crystals/minerals
            }
            else if (theme === 'microscopic') {
                if (type < 0.2) mesh = ArtisanObjects.createCell(scale, color);
                else if (type < 0.4) mesh = ArtisanObjects.createBacteria('rod', scale, color);
                else if (type < 0.5) mesh = ArtisanObjects.createBacteria('spiral', scale, color);
                else if (type < 0.6) mesh = ArtisanObjects.createBacteria('sphere', scale, color);
                else if (type < 0.75) mesh = ArtisanObjects.createVirus(scale, color);
                else if (type < 0.85) mesh = ArtisanObjects.createDNA(scale, color, this.getThemeColor(theme));
                else mesh = ArtisanObjects.createDiatom(scale, color);
            }
            else if (theme === 'feline') {
                if (type < 0.25) mesh = ArtisanObjects.createCatHead(scale, color);
                else if (type < 0.45) mesh = ArtisanObjects.createYarnBall(scale, color);
                else if (type < 0.6) mesh = ArtisanObjects.createPaw(scale, color);
                else if (type < 0.75) mesh = ArtisanObjects.createMouseToy(scale, color);
                else if (type < 0.85) mesh = ArtisanObjects.createFish('tropical', scale * 0.8, color); // Cat toy fish
                else mesh = this.createStandardGem(scale, color); // Cat toys / bells
            }
            else { // Gemstone / Default
                if (type < 0.1) mesh = ArtisanObjects.createCharm('diamond', scale, color);
                else if (type < 0.3) mesh = ArtisanObjects.createTwistedRod(scale, color);
                else mesh = this.createStandardGem(scale, color);
            }

            // Fallback if mesh creation failed
            if (!mesh) mesh = this.createStandardGem(scale, color);

            // Random position (tighter clustering with depth)
            mesh.position.set(
                (Math.random() - 0.5) * 4, // Reduced from 6 to 4 for tighter clustering
                (Math.random() - 0.5) * 4,
                (Math.random() - 0.5) * 3  // Increased from 2 to 3 for more depth
            );

            // Add center bias for denser core
            const centerBias = 0.3;
            mesh.position.multiplyScalar(1.0 - centerBias + Math.random() * centerBias);

            // Random rotation
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            // Store velocity
            mesh.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02,
                    (Math.random() - 0.5) * 0.02
                ),
                rotVelocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.05,
                    (Math.random() - 0.5) * 0.05,
                    (Math.random() - 0.5) * 0.05
                ),
                baseScale: scale,
                isReactive: Math.random() < 0.7 // 70% chance to be audio reactive
            };

            this.group.add(mesh);
            this.objects.push(mesh);
        }

        // Set colorful but dark background based on theme
        let bgHue, bgSat, bgLight;

        if (theme === 'aquarium') {
            bgHue = 0.52 + (Math.random() - 0.5) * 0.1; // Blue-cyan
            bgSat = 0.8 + Math.random() * 0.2;
            bgLight = 0.05 + Math.random() * 0.08; // 0.05-0.13
        } else if (theme === 'outer-space') {
            bgHue = Math.random() < 0.5 ? 0.65 : 0.75; // Purple or deep blue
            bgSat = 0.7 + Math.random() * 0.3;
            bgLight = 0.02 + Math.random() * 0.06; // 0.02-0.08 (very dark for space)
        } else if (theme === 'microscopic') {
            bgHue = Math.random(); // Full spectrum like microscope slides
            bgSat = 0.9 + Math.random() * 0.1;
            bgLight = 0.08 + Math.random() * 0.10; // 0.08-0.18
        } else if (theme === 'feline') {
            bgHue = 0.85 + (Math.random() - 0.5) * 0.15; // Pink-magenta
            bgSat = 0.6 + Math.random() * 0.3;
            bgLight = 0.08 + Math.random() * 0.10; // 0.08-0.18
        } else if (theme === 'christmas') {
            bgHue = Math.random() < 0.5 ? 0.0 : 0.33; // Red or green
            bgSat = 0.9;
            bgLight = 0.06 + Math.random() * 0.10; // 0.06-0.16
        } else if (theme === 'halloween') {
            bgHue = 0.08 + (Math.random() - 0.5) * 0.05; // Orange
            bgSat = 0.95;
            bgLight = 0.05 + Math.random() * 0.08; // 0.05-0.13
        } else if (theme === 'industrial') {
            bgHue = 0.1 + (Math.random() - 0.5) * 0.1; // Orange-rust
            bgSat = 0.4 + Math.random() * 0.3; // Lower saturation
            bgLight = 0.04 + Math.random() * 0.10; // 0.04-0.14
        } else if (theme === 'fruity') {
            bgHue = Math.random(); // Rainbow
            bgSat = 1.0;
            bgLight = 0.10 + Math.random() * 0.12; // 0.10-0.22 (still brightest)
        } else {
            // Gemstone - vibrant rainbow
            bgHue = Math.random();
            bgSat = 0.9 + Math.random() * 0.1;
            bgLight = 0.06 + Math.random() * 0.12; // 0.06-0.18
        }

        this.updateEnvironment(bgHue, 1.0, bgSat, bgLight);
    }

    getThemeColor(theme) {
        if (theme === 'christmas') {
            const palette = [0xff0000, 0x00ff00, 0xffd700, 0xffffff];
            return new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
        } else if (theme === 'halloween') {
            const palette = [0xff6600, 0x000000, 0x663399, 0x00ff00];
            return new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
        } else if (theme === 'industrial') {
            // Even industrial can be a bit more vibrant? Keeping it metallic for now but adding a rust orange
            const palette = [0xc0c0c0, 0x808080, 0xb87333, 0x333333, 0xff4500];
            return new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
        } else if (theme === 'fruity') {
            // Super vibrant fruits
            return new THREE.Color().setHSL(Math.random(), 1.0, 0.6);
        } else if (theme === 'aquarium') {
            // Ocean blues, corals, tropical fish colors
            const palette = [0x00bfff, 0xff6b9d, 0xffa500, 0x7fffd4, 0xff00ff, 0x00ff7f, 0xffe4b5];
            return new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
        } else if (theme === 'outer-space') {
            // Deep space: blues, purples, oranges, grays
            const palette = [0x4169e1, 0x8b00ff, 0xff4500, 0xc0c0c0, 0xffd700, 0xff69b4, 0x1e90ff];
            return new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
        } else if (theme === 'microscopic') {
            // Scientific stain colors: greens, blues, purples, pinks
            const palette = [0x00ff88, 0x0088ff, 0xff00aa, 0xffff00, 0xff8800, 0x88ffbb, 0xff0066];
            return new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
        } else if (theme === 'feline') {
            // Cat colors: oranges, grays, whites, pinks, with yarn colors
            const palette = [0xff8844, 0xcccccc, 0xffffff, 0xffaacc, 0xff00ff, 0x00ffff, 0xffff00];
            return new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
        } else {
            // Gemstone / Default - Max saturation
            return new THREE.Color().setHSL(Math.random(), 1.0, 0.5);
        }
    }

    createStandardGem(scale, color) {
        const geometries = [
            new THREE.IcosahedronGeometry(0.5, 0),
            new THREE.TetrahedronGeometry(0.5, 0),
            new THREE.OctahedronGeometry(0.5, 0),
            new THREE.TorusGeometry(0.3, 0.1, 8, 16),
            new THREE.CapsuleGeometry(0.2, 0.6, 4, 8),
            new THREE.SphereGeometry(0.4, 16, 16)
        ];
        const geom = geometries[Math.floor(Math.random() * geometries.length)];

        let material;
        const matType = Math.random();

        if (matType < 0.8) { // Glass / Gem (increased from 0.7 to 0.8 for more sparkle)
            material = new THREE.MeshPhysicalMaterial({
                color: color,
                metalness: 0.0, // Pure glass
                roughness: 0.01, // Very smooth for maximum reflection
                transmission: 0.98, // Higher transmission
                thickness: 2.0, // Increased thickness
                ior: 1.8 + Math.random() * 0.4, // Diamond-like refraction (1.8-2.2)
                clearcoat: 1.0,
                clearcoatRoughness: 0.0, // Mirror-like clearcoat
                attenuationColor: color,
                attenuationDistance: 0.8, // Richer color
                emissive: color, // Self-illumination
                emissiveIntensity: 0.1 + Math.random() * 0.15 // 0.1-0.25 glow (reduced from 0.3-0.5)
            });
        } else if (matType < 0.95) { // Metallic (increased from 0.9)
            material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 1.0,
                roughness: 0.1, // Smoother for more mirror-like
                envMapIntensity: 2.5, // Enhanced reflections
                emissive: color,
                emissiveIntensity: 0.1 // Subtle glow (reduced from 0.2)
            });
        } else { // Matte / Plastic
            material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.6
            });
        }
        const mesh = new THREE.Mesh(geom, material);
        mesh.scale.set(scale, scale, scale);
        return mesh;
    }

    setAudio(audio) {
        this.audio = audio;
    }

    update(time, speed = 1.0) {
        // Slowly rotate the entire group to simulate holding the scope
        this.group.rotation.z = time * 0.1 * speed;
        this.group.rotation.x = Math.sin(time * 0.2 * speed) * 0.2;

        // Update camera position based on mode
        this.updateCameraPosition(time, speed);

        const objects = this.objects;
        const count = objects.length;

        // Audio Energy for Pulsing
        let audioEnergy = 0;
        if (this.audio && this.audio.getEnergy) {
            audioEnergy = this.audio.getEnergy(); // 0.0 to 1.0
        }

        // Collision Detection (Naive O(N^2) - OK for N < 100)
        for (let i = 0; i < count; i++) {
            const objA = objects[i];
            const radiusA = objA.scale.x * 0.5; // Approx radius

            for (let j = i + 1; j < count; j++) {
                const objB = objects[j];
                const radiusB = objB.scale.x * 0.5;

                const distSq = objA.position.distanceToSquared(objB.position);
                const minSeparation = radiusA + radiusB;

                if (distSq < minSeparation * minSeparation) {
                    // Collision!

                    // Simple elastic bounce response
                    // Separate them slightly to prevents sticking
                    const dir = new THREE.Vector3().subVectors(objA.position, objB.position).normalize();
                    const push = dir.multiplyScalar(0.01);
                    objA.position.add(push);
                    objB.position.sub(push);

                    // Swap velocities approx (or reflect)
                    const temp = objA.userData.velocity.clone();
                    objA.userData.velocity.lerp(objB.userData.velocity, 0.8); // Transfer momentum
                    objB.userData.velocity.lerp(temp, 0.8);

                    // Audio Trigger
                    // Calculate relative velocity for impact intensity
                    if (this.audio) {
                        const relVel = new THREE.Vector3().subVectors(objA.userData.velocity, objB.userData.velocity).length();
                        // Trigger with lower threshold since we removed audio probability gate
                        if (relVel > 0.003) {
                            this.audio.triggerCollisionSound(relVel);
                        }
                    }
                }
            }
        }

        // Animate individual objects (tumbling)
        this.objects.forEach(obj => {
            obj.position.add(obj.userData.velocity.clone().multiplyScalar(speed));
            obj.rotation.x += obj.userData.rotVelocity.x * speed;
            obj.rotation.y += obj.userData.rotVelocity.y * speed;
            obj.rotation.z += obj.userData.rotVelocity.z * speed;

            // Simple bounds check to keep them in view
            if (obj.position.length() > 4.5) {
                obj.userData.velocity.multiplyScalar(-1); // Bounce back
                obj.position.add(obj.userData.velocity); // Move out of stuck
            }

            // Audio Reactivity (Scale Pulsing)
            if (obj.userData.isReactive && obj.userData.baseScale) {
                // Pulse size based on energy. 
                // Thresholding: only pulse if energy is significant > 0.3
                const pulse = Math.max(0, audioEnergy - 0.2) * 0.8;
                const newScale = obj.userData.baseScale * (1.0 + pulse);
                obj.scale.setScalar(newScale);
            }
        });
    }

    render() {
        // Render scene to texture
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);
        this.renderer.setRenderTarget(null);
    }

    getTexture() {
        return this.renderTarget.texture;
    }

    setBackgroundHue(hue) {
        this.updateEnvironment(hue);
    }

    resize(width, height) {
        if (this.debugCamera) {
            this.debugCamera.aspect = width / height;
            this.debugCamera.updateProjectionMatrix();
        }
    }

    addRandomObject(theme = 'gemstone') {
        let mesh;
        const scale = 0.3 + Math.random() * 1.2;
        let color = this.getThemeColor(theme);

        // Select Object Type based on Theme
        const type = Math.random();

        if (theme === 'christmas') {
            if (type < 0.2) mesh = ArtisanObjects.createCharm('star', scale, new THREE.Color(0xffd700));
            else if (type < 0.4) mesh = ArtisanObjects.createTwistedRod(scale * 1.5, new THREE.Color(0xff0000));
            else if (type < 0.6) mesh = ArtisanObjects.createBead(scale, new THREE.Color(0x00ff00));
            else mesh = this.createStandardGem(scale, color);
        }
        else if (theme === 'halloween') {
            if (type < 0.2) mesh = ArtisanObjects.createCharm('moon', scale, new THREE.Color(0xffff00));
            else if (type < 0.4) mesh = ArtisanObjects.createCharm('cloud', scale, new THREE.Color(0x555555));
            else if (type < 0.6) mesh = ArtisanObjects.createTwistedRod(scale, new THREE.Color(0xff6600));
            else mesh = this.createStandardGem(scale, color);
        }
        else if (theme === 'industrial') {
            if (type < 0.3) mesh = ArtisanObjects.createScrew(scale, new THREE.Color(0xb87333));
            else if (type < 0.6) mesh = ArtisanObjects.createColoredSpring(scale, new THREE.Color(0xc0c0c0));
            else if (type < 0.8) mesh = ArtisanObjects.createCharm('lightning', scale, new THREE.Color(0xffff00));
            else mesh = this.createStandardGem(scale, color);
        }
        else if (theme === 'fruity') {
            if (type < 0.3) mesh = ArtisanObjects.createFruit('cherry', scale);
            else if (type < 0.6) mesh = ArtisanObjects.createFruit('grape', scale);
            else if (type < 0.8) mesh = ArtisanObjects.createBead(scale, color);
            else mesh = this.createStandardGem(scale, color);
        }
        else if (theme === 'aquarium') {
            if (type < 0.15) mesh = ArtisanObjects.createFish('tropical', scale, color);
            else if (type < 0.3) mesh = ArtisanObjects.createJellyfish(scale, color);
            else if (type < 0.4) mesh = ArtisanObjects.createSeahorse(scale, color);
            else if (type < 0.55) mesh = ArtisanObjects.createShell(Math.random() < 0.5 ? 'spiral' : 'scallop', scale, color);
            else if (type < 0.7) mesh = ArtisanObjects.createStarfish(scale, color);
            else if (type < 0.85) mesh = ArtisanObjects.createCoral(scale, color);
            else mesh = this.createStandardGem(scale, color);
        }
        else if (theme === 'outer-space') {
            if (type < 0.2) mesh = ArtisanObjects.createPlanet('rocky', scale, color);
            else if (type < 0.35) mesh = ArtisanObjects.createPlanet('cratered', scale * 0.8, color);
            else if (type < 0.45) mesh = ArtisanObjects.createPlanet('ringed', scale, color);
            else if (type < 0.6) mesh = ArtisanObjects.createAsteroid(scale, color);
            else if (type < 0.75) mesh = ArtisanObjects.createComet(scale, color);
            else if (type < 0.9) mesh = ArtisanObjects.createSpaceStar(5, scale * 0.6, color);
            else mesh = this.createStandardGem(scale, color);
        }
        else if (theme === 'microscopic') {
            if (type < 0.2) mesh = ArtisanObjects.createCell(scale, color);
            else if (type < 0.4) mesh = ArtisanObjects.createBacteria('rod', scale, color);
            else if (type < 0.5) mesh = ArtisanObjects.createBacteria('spiral', scale, color);
            else if (type < 0.6) mesh = ArtisanObjects.createBacteria('sphere', scale, color);
            else if (type < 0.75) mesh = ArtisanObjects.createVirus(scale, color);
            else if (type < 0.85) mesh = ArtisanObjects.createDNA(scale, color, this.getThemeColor(theme));
            else mesh = ArtisanObjects.createDiatom(scale, color);
        }
        else if (theme === 'feline') {
            if (type < 0.25) mesh = ArtisanObjects.createCatHead(scale, color);
            else if (type < 0.45) mesh = ArtisanObjects.createYarnBall(scale, color);
            else if (type < 0.6) mesh = ArtisanObjects.createPaw(scale, color);
            else if (type < 0.75) mesh = ArtisanObjects.createMouseToy(scale, color);
            else if (type < 0.85) mesh = ArtisanObjects.createFish('tropical', scale * 0.8, color);
            else mesh = this.createStandardGem(scale, color);
        }
        else { // Gemstone / Default
            if (type < 0.1) mesh = ArtisanObjects.createCharm('diamond', scale, color);
            else if (type < 0.3) mesh = ArtisanObjects.createTwistedRod(scale, color);
            else mesh = this.createStandardGem(scale, color);
        }

        if (!mesh) mesh = this.createStandardGem(scale, color);

        // Random position (spawn near center but slightly offset)
        mesh.position.set(
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 4,
            (Math.random() - 0.5) * 2
        );

        // Random rotation
        mesh.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );

        // Store velocity
        mesh.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02,
                (Math.random() - 0.5) * 0.02
            ),
            rotVelocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05,
                (Math.random() - 0.5) * 0.05
            ),
            baseScale: scale,
            isReactive: Math.random() < 0.7 // 70% chance
        };

        this.group.add(mesh);
        this.objects.push(mesh);
    }

    removeRandomObject() {
        if (this.objects.length === 0) return;
        const index = Math.floor(Math.random() * this.objects.length);
        const objectToRemove = this.objects[index];

        // Remove from scene and array
        this.group.remove(objectToRemove);
        this.objects.splice(index, 1);

        // Dispose geometry and material to prevent leaks
        if (objectToRemove.geometry) objectToRemove.geometry.dispose();
        if (objectToRemove.material) {
            if (Array.isArray(objectToRemove.material)) {
                objectToRemove.material.forEach(m => m.dispose());
            } else {
                objectToRemove.material.dispose();
            }
        }
    }

    swapObjects(count = 1, theme = 'gemstone') {
        for (let i = 0; i < count; i++) {
            if (this.objects.length > 0) this.removeRandomObject();
            this.addRandomObject(theme);
        }
    }

    updateCameraPosition(time, speed = 1.0) {
        this.cameraTime += 0.016 * speed; // Approximate delta time
        const t = this.cameraTime;

        switch(this.cameraMode) {
            case 'static':
                // Original static position
                this.camera.position.set(0, 0, 7);
                this.camera.lookAt(0, 0, 0);
                break;

            case 'inside':
                // Camera moves INSIDE the object chamber, weaving through objects
                const insideRadius = 2.0; // Stay within the object cluster
                this.camera.position.x = Math.sin(t * 0.3) * insideRadius + Math.cos(t * 0.7) * 0.5;
                this.camera.position.y = Math.cos(t * 0.25) * insideRadius + Math.sin(t * 0.6) * 0.5;
                this.camera.position.z = Math.sin(t * 0.2) * 1.5 + 3.0; // Oscillate depth

                // Look at a point that moves slightly
                this.cameraTarget.x = Math.sin(t * 0.15) * 0.5;
                this.cameraTarget.y = Math.cos(t * 0.18) * 0.5;
                this.cameraTarget.z = 0;
                this.camera.lookAt(this.cameraTarget);
                break;

            case 'orbital':
                // Camera orbits around the center
                const orbitRadius = 5.0;
                const orbitSpeed = 0.2;
                const orbitHeight = Math.sin(t * 0.15) * 1.5; // Bobbing up/down
                this.camera.position.x = Math.cos(t * orbitSpeed) * orbitRadius;
                this.camera.position.y = orbitHeight;
                this.camera.position.z = Math.sin(t * orbitSpeed) * orbitRadius;
                this.camera.lookAt(0, 0, 0);
                break;

            case 'drift':
                // Slow random walk with momentum
                this.cameraDriftVel.x += (Math.random() - 0.5) * 0.0002;
                this.cameraDriftVel.y += (Math.random() - 0.5) * 0.0002;
                this.cameraDriftVel.z += (Math.random() - 0.5) * 0.0001;

                // Damping
                this.cameraDriftVel.multiplyScalar(0.98);

                // Apply velocity
                this.camera.position.add(this.cameraDriftVel);

                // Keep within bounds (soft boundaries)
                const driftLimit = 6.0;
                if (Math.abs(this.camera.position.x) > driftLimit) {
                    this.cameraDriftVel.x *= -0.5;
                    this.camera.position.x = Math.sign(this.camera.position.x) * driftLimit;
                }
                if (Math.abs(this.camera.position.y) > driftLimit) {
                    this.cameraDriftVel.y *= -0.5;
                    this.camera.position.y = Math.sign(this.camera.position.y) * driftLimit;
                }
                if (this.camera.position.z < 2 || this.camera.position.z > 10) {
                    this.cameraDriftVel.z *= -0.5;
                    this.camera.position.z = Math.max(2, Math.min(10, this.camera.position.z));
                }

                this.camera.lookAt(0, 0, 0);
                break;

            case 'figure8':
                // Lissajous figure-8 pattern
                const fig8Scale = 3.5;
                this.camera.position.x = Math.sin(t * 0.2) * fig8Scale;
                this.camera.position.y = Math.sin(t * 0.4) * fig8Scale * 0.7; // Different frequency
                this.camera.position.z = Math.cos(t * 0.15) * 2.0 + 5.0;
                this.camera.lookAt(0, 0, 0);
                break;

            case 'follow':
                // Follow the closest object
                if (this.objects.length > 0) {
                    // Find closest object to current camera position
                    let closestDist = Infinity;
                    let closestObj = this.objects[0];

                    for (const obj of this.objects) {
                        const dist = this.camera.position.distanceTo(obj.position);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestObj = obj;
                        }
                    }

                    // Move camera toward closest object (with damping)
                    const followSpeed = 0.02;
                    const targetPos = closestObj.position.clone();
                    targetPos.z += 3.0; // Stay behind the object

                    this.camera.position.lerp(targetPos, followSpeed);

                    // Look at the object
                    this.camera.lookAt(closestObj.position);
                }
                break;
        }
    }

    setCameraMode(mode) {
        if (['static', 'inside', 'orbital', 'drift', 'figure8', 'follow'].includes(mode)) {
            this.cameraMode = mode;
            this.cameraTime = 0; // Reset time

            // Reset camera position based on mode
            if (mode === 'static') {
                this.camera.position.set(0, 0, 7);
            } else if (mode === 'drift') {
                // Reset drift velocity
                this.cameraDriftVel.set(
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.005
                );
            }

            console.log('Camera mode changed to:', mode);
        }
    }
}
