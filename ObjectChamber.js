import * as THREE from 'three';
import { ArtisanObjects } from './ArtisanObjects.js?v=2';

export class ObjectChamber {
    constructor(renderer, width, height) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100); // Aspect ratio 1:1 for the texture
        this.camera.position.z = 10;

        // Render Target for the chamber view
        this.renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat,
            wrapS: THREE.RepeatWrapping,
            wrapT: THREE.RepeatWrapping
        });

        this.objects = [];
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Debug Camera for "View Chamber" mode (matches screen aspect)
        const aspect = (width && height) ? width / height : 1.0;
        this.debugCamera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.debugCamera.position.z = 10;


        // --- Lighting & Environment ---

        // 1. Backlight (The "Sun" at the end of the tube)
        this.backlight = new THREE.PointLight(0xffffff, 5.0, 20);
        this.backlight.position.set(0, 0, -5); // Behind objects
        this.scene.add(this.backlight);

        // 2. Rim/Fill Lights
        const rimLight = new THREE.SpotLight(0xffaa00, 5.0);
        rimLight.position.set(5, 5, 5);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);

        const fillLight = new THREE.AmbientLight(0x404040, 2.0); // Higher ambient for glass
        this.scene.add(fillLight);

        // 3. Procedural HDR Environment
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();

        // Background
        this.scene.background = new THREE.Color(0x101010);

        this.updateEnvironment();
        this.buildNew();
    }

    updateEnvironment(hue = 0.5, intensity = 1.0) {
        // Create a simple scene to render as env map
        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color().setHSL(hue, 0.6, 0.1 * intensity);

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
        this.scene.background = new THREE.Color().setHSL(hue, 0.4, 0.02 * intensity); // Darker background for contrast

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
        const themes = ['christmas', 'halloween', 'industrial', 'fruity', 'gemstone'];
        const theme = themes[Math.floor(Math.random() * themes.length)];
        console.log('Selected Theme:', theme);

        // Create new objects
        const numObjects = count || (30 + Math.floor(Math.random() * 30));

        for (let i = 0; i < numObjects; i++) {
            let mesh;
            const scale = 0.3 + Math.random() * 1.2;
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
            else { // Gemstone / Default
                if (type < 0.1) mesh = ArtisanObjects.createCharm('diamond', scale, color);
                else if (type < 0.3) mesh = ArtisanObjects.createTwistedRod(scale, color);
                else mesh = this.createStandardGem(scale, color);
            }

            // Fallback if mesh creation failed
            if (!mesh) mesh = this.createStandardGem(scale, color);

            // Random position
            mesh.position.set(
                (Math.random() - 0.5) * 6,
                (Math.random() - 0.5) * 6,
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
                )
            };

            this.group.add(mesh);
            this.objects.push(mesh);
        }
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

        if (matType < 0.7) { // Glass / Gem
            material = new THREE.MeshPhysicalMaterial({
                color: color,
                metalness: 0.1,
                roughness: 0.05,
                transmission: 0.95,
                thickness: 1.5,
                ior: 1.5 + Math.random() * 0.5,
                clearcoat: 1.0,
                attenuationColor: color,
                attenuationDistance: 1.0
            });
        } else if (matType < 0.9) { // Metallic
            material = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 1.0,
                roughness: 0.2,
                envMapIntensity: 1.0
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

    update(time, speed = 1.0) {
        // Slowly rotate the entire group to simulate holding the scope
        this.group.rotation.z = time * 0.1 * speed;
        this.group.rotation.x = Math.sin(time * 0.2 * speed) * 0.2;

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
            )
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
}
