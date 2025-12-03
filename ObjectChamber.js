import * as THREE from 'three';
import { ArtisanObjects } from './ArtisanObjects.js';

export class ObjectChamber {
    constructor(renderer) {
        this.renderer = renderer;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100); // Aspect ratio 1:1 for the texture
        this.camera.position.z = 10;

        // Render Target for the chamber view
        this.renderTarget = new THREE.WebGLRenderTarget(1024, 1024, {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        });

        this.objects = [];
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
        dirLight.position.set(5, 10, 7);
        this.scene.add(dirLight);

        const pointLight = new THREE.PointLight(0xffaa00, 1.0, 20);
        pointLight.position.set(-5, -5, 5);
        this.scene.add(pointLight);

        // Background - maybe a gradient or textured plane
        this.scene.background = new THREE.Color(0x101010);

        this.buildNew();
    }

    buildNew(count) {
        // Clear existing
        while (this.group.children.length > 0) {
            this.group.remove(this.group.children[0]);
        }
        this.objects = [];

        // Randomize Background
        const hue = Math.random();
        this.scene.background = new THREE.Color().setHSL(hue, 0.3, 0.05);

        // Create new objects
        const numObjects = count || (30 + Math.floor(Math.random() * 30));

        const geometries = [
            new THREE.IcosahedronGeometry(0.5, 0),
            new THREE.TetrahedronGeometry(0.5, 0),
            new THREE.OctahedronGeometry(0.5, 0),
            new THREE.TorusGeometry(0.3, 0.1, 8, 16),
            new THREE.CapsuleGeometry(0.2, 0.6, 4, 8),
            new THREE.SphereGeometry(0.4, 16, 16)
        ];

        for (let i = 0; i < numObjects; i++) {
            let mesh;
            const type = Math.random();
            // Wider scale variation
            const scale = 0.3 + Math.random() * 1.2;

            // Richer Color Palette
            let color;
            const colorType = Math.random();
            if (colorType < 0.3) {
                // Pastel
                color = new THREE.Color().setHSL(Math.random(), 0.8, 0.8);
            } else if (colorType < 0.6) {
                // Vibrant
                color = new THREE.Color().setHSL(Math.random(), 1.0, 0.5);
            } else if (colorType < 0.8) {
                // Metallic / Gold / Silver
                color = (Math.random() > 0.5) ? new THREE.Color(0xffd700) : new THREE.Color(0xc0c0c0);
            } else {
                // Neon
                color = new THREE.Color().setHSL(Math.random(), 1.0, 0.6);
            }

            if (type < 0.15) {
                // Spring
                mesh = ArtisanObjects.createSpring(scale, new THREE.Color(0xc0c0c0));
            } else if (type < 0.3) {
                // Screw
                mesh = ArtisanObjects.createScrew(scale, new THREE.Color(0xb87333)); // Copper/Bronze
            } else if (type < 0.45) {
                // Twisted Glass Rod
                mesh = ArtisanObjects.createTwistedRod(scale * 1.5, color);
            } else if (type < 0.7) {
                // Charms - Expanded List
                const charmType = Math.random();
                let charmName = 'star';
                if (charmType < 0.15) charmName = 'kitty';
                else if (charmType < 0.30) charmName = 'moon';
                else if (charmType < 0.45) charmName = 'heart';
                else if (charmType < 0.60) charmName = 'lightning';
                else if (charmType < 0.75) charmName = 'cloud';
                else charmName = 'diamond';

                mesh = ArtisanObjects.createCharm(charmName, scale, color);
            } else {
                // Standard Gems/Shapes (Legacy)
                const geom = geometries[Math.floor(Math.random() * geometries.length)];

                // Materials: Glass, Metal, or Plastic
                let material;
                const matType = Math.random();

                if (matType < 0.6) { // Glass / Gem
                    material = new THREE.MeshPhysicalMaterial({
                        color: color,
                        metalness: 0.0,
                        roughness: 0.1,
                        transmission: 0.9, // Glass-like
                        thickness: 1.0,
                        ior: 1.5 + Math.random() * 0.5, // Refractive index
                        clearcoat: 1.0
                    });
                } else if (matType < 0.8) { // Metallic
                    material = new THREE.MeshStandardMaterial({
                        color: color,
                        metalness: 0.9,
                        roughness: 0.2
                    });
                } else { // Matte / Plastic
                    material = new THREE.MeshStandardMaterial({
                        color: color,
                        roughness: 0.6
                    });
                }
                mesh = new THREE.Mesh(geom, material);
            }

            // Random position within a container volume
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

            // Store velocity for animation
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

    update(time) {
        // Slowly rotate the entire group to simulate holding the scope
        this.group.rotation.z = time * 0.1;
        this.group.rotation.x = Math.sin(time * 0.2) * 0.2;

        // Animate individual objects (tumbling)
        this.objects.forEach(obj => {
            obj.position.add(obj.userData.velocity);
            obj.rotation.x += obj.userData.rotVelocity.x;
            obj.rotation.y += obj.userData.rotVelocity.y;
            obj.rotation.z += obj.userData.rotVelocity.z;

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
        this.scene.background.setHSL(hue, 0.3, 0.05);
    }
}
