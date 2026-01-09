import * as THREE from 'three';

// --- Helper Curves ---

class HelixCurve extends THREE.Curve {
    constructor(scale = 1, turns = 5) {
        super();
        this.scale = scale;
        this.turns = turns;
    }

    getPoint(t, optionalTarget = new THREE.Vector3()) {
        const angle = 2 * Math.PI * t * this.turns;
        const radius = 0.2 * this.scale;
        const height = (t - 0.5) * 2 * this.scale;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = height;

        return optionalTarget.set(x, y, z);
    }
}

class TwistedRodCurve extends THREE.Curve {
    constructor(scale = 1) {
        super();
        this.scale = scale;
    }

    getPoint(t, optionalTarget = new THREE.Vector3()) {
        const angle = 2 * Math.PI * t * 2; // 2 twists
        const radius = 0.05 * this.scale; // Slight wobble
        const height = (t - 0.5) * 3 * this.scale;

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = height;

        return optionalTarget.set(x, y, z);
    }
}

// --- Object Generators ---

export const ArtisanObjects = {
    createSpring: (scale = 1, color) => {
        const path = new HelixCurve(scale, 8);
        const geometry = new THREE.TubeGeometry(path, 64, 0.05 * scale, 8, false);
        const material = new THREE.MeshStandardMaterial({
            color: color || 0xaaaaaa,
            metalness: 0.9,
            roughness: 0.3
        });
        return new THREE.Mesh(geometry, material);
    },

    createScrew: (scale = 1, color) => {
        const group = new THREE.Group();

        // Shaft
        const shaftGeom = new THREE.CylinderGeometry(0.1 * scale, 0.1 * scale, 1.0 * scale, 16);
        const material = new THREE.MeshStandardMaterial({
            color: color || 0x888888,
            metalness: 0.8,
            roughness: 0.4
        });
        const shaft = new THREE.Mesh(shaftGeom, material);
        shaft.rotation.x = Math.PI / 2;
        group.add(shaft);

        // Head
        const headGeom = new THREE.CylinderGeometry(0.2 * scale, 0.2 * scale, 0.2 * scale, 6); // Hex head
        const head = new THREE.Mesh(headGeom, material);
        head.rotation.x = Math.PI / 2;
        head.position.z = 0.5 * scale;
        group.add(head);

        // Threads (Texture or simple rings) - keeping it simple for now with rings
        for (let i = 0; i < 5; i++) {
            const threadGeom = new THREE.TorusGeometry(0.1 * scale, 0.02 * scale, 8, 16);
            const thread = new THREE.Mesh(threadGeom, material);
            thread.position.z = -0.4 * scale + (i * 0.15 * scale);
            group.add(thread);
        }

        return group;
    },

    createTwistedRod: (scale = 1, color) => {
        // A glass rod that looks twisted
        const path = new TwistedRodCurve(scale);
        const geometry = new THREE.TubeGeometry(path, 64, 0.1 * scale, 8, false);

        const material = new THREE.MeshPhysicalMaterial({
            color: color || 0xffffff,
            metalness: 0.0,
            roughness: 0.0,
            transmission: 1.0,
            thickness: 2.0,
            ior: 1.5,
            clearcoat: 1.0,
            attenuationColor: new THREE.Color(color),
            attenuationDistance: 0.5
        });

        return new THREE.Mesh(geometry, material);
    },

    createCharm: (type, scale = 1, color) => {
        const shape = new THREE.Shape();

        if (type === 'kitty') {
            // Simple Kitty Head
            shape.moveTo(-0.3, -0.2);
            shape.lineTo(0.3, -0.2); // Chin
            shape.quadraticCurveTo(0.4, -0.2, 0.4, 0.1); // Right cheek
            shape.lineTo(0.5, 0.4); // Right Ear tip
            shape.lineTo(0.2, 0.3); // Right Ear base
            shape.quadraticCurveTo(0, 0.35, -0.2, 0.3); // Forehead
            shape.lineTo(-0.5, 0.4); // Left Ear tip
            shape.lineTo(-0.4, 0.1); // Left Ear base
            shape.quadraticCurveTo(-0.4, -0.2, -0.3, -0.2); // Left cheek
        } else if (type === 'star') {
            const outerRadius = 0.4;
            const innerRadius = 0.2;
            const points = 5;
            for (let i = 0; i < points * 2; i++) {
                const r = (i % 2 === 0) ? outerRadius : innerRadius;
                const a = (i / (points * 2)) * Math.PI * 2;
                const x = Math.cos(a) * r;
                const y = Math.sin(a) * r;
                if (i === 0) shape.moveTo(x, y);
                else shape.lineTo(x, y);
            }
            shape.closePath();
        } else if (type === 'moon') {
            shape.absarc(0, 0, 0.4, 0.5 * Math.PI, 1.5 * Math.PI, true); // Outer
            shape.absarc(0.2, 0, 0.3, 1.5 * Math.PI, 0.5 * Math.PI, false); // Inner cutout
        } else if (type === 'heart') {
            const x = 0, y = 0;
            shape.moveTo(x + 0.25, y + 0.25);
            shape.bezierCurveTo(x + 0.25, y + 0.25, x + 0.20, y, x, y);
            shape.bezierCurveTo(x - 0.30, y, x - 0.30, y + 0.35, x - 0.30, y + 0.35);
            shape.bezierCurveTo(x - 0.30, y + 0.55, x - 0.10, y + 0.77, x + 0.25, y + 0.95);
            shape.bezierCurveTo(x + 0.60, y + 0.77, x + 0.80, y + 0.55, x + 0.80, y + 0.35);
            shape.bezierCurveTo(x + 0.80, y + 0.35, x + 0.80, y, x + 0.50, y);
            shape.bezierCurveTo(x + 0.35, y, x + 0.25, y + 0.25, x + 0.25, y + 0.25);
        } else if (type === 'lightning') {
            shape.moveTo(-0.1, 0.5);
            shape.lineTo(0.1, 0.1);
            shape.lineTo(0.3, 0.1);
            shape.lineTo(-0.1, -0.5);
            shape.lineTo(0.0, -0.1);
            shape.lineTo(-0.2, -0.1);
            shape.closePath();
        } else if (type === 'cloud') {
            shape.moveTo(-0.4, 0);
            shape.bezierCurveTo(-0.5, 0, -0.5, 0.3, -0.4, 0.3);
            shape.bezierCurveTo(-0.4, 0.5, -0.1, 0.5, -0.1, 0.3);
            shape.bezierCurveTo(0, 0.5, 0.3, 0.5, 0.3, 0.3);
            shape.bezierCurveTo(0.5, 0.3, 0.5, 0, 0.4, 0);
            shape.lineTo(-0.4, 0);
        } else if (type === 'diamond') {
            shape.moveTo(0, 0.5);
            shape.lineTo(0.3, 0);
            shape.lineTo(0, -0.5);
            shape.lineTo(-0.3, 0);
            shape.closePath();
        }

        const extrudeSettings = {
            steps: 1,
            depth: 0.1 * scale,
            bevelEnabled: true,
            bevelThickness: 0.02 * scale,
            bevelSize: 0.02 * scale,
            bevelSegments: 2
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

        // Center the geometry
        geometry.center();

        const material = new THREE.MeshPhysicalMaterial({
            color: color || 0xff00ff,
            metalness: 0.2,
            roughness: 0.1,
            transmission: 0.6, // Semi-transparent charms
            thickness: 0.5,
            ior: 1.4,
            clearcoat: 1.0
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(scale, scale, scale);
        return mesh;
    },

    createFruit: (type, scale = 1) => {
        const group = new THREE.Group();

        if (type === 'cherry') {
            // Cherry Body
            const bodyGeom = new THREE.SphereGeometry(0.2 * scale, 16, 16);
            const bodyMat = new THREE.MeshPhysicalMaterial({
                color: 0xcc0000,
                roughness: 0.1,
                transmission: 0.2,
                clearcoat: 1.0
            });
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            group.add(body);

            // Stem
            const stemPath = new THREE.CatmullRomCurve3([
                new THREE.Vector3(0, 0.15 * scale, 0),
                new THREE.Vector3(0.05 * scale, 0.3 * scale, 0),
                new THREE.Vector3(0.1 * scale, 0.4 * scale, 0)
            ]);
            const stemGeom = new THREE.TubeGeometry(stemPath, 8, 0.02 * scale, 4, false);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x00aa00, roughness: 0.8 });
            const stem = new THREE.Mesh(stemGeom, stemMat);
            group.add(stem);
        } else if (type === 'grape') {
            // Cluster of small spheres
            const grapeGeom = new THREE.SphereGeometry(0.08 * scale, 8, 8);
            const grapeMat = new THREE.MeshPhysicalMaterial({
                color: 0x663399,
                roughness: 0.2,
                transmission: 0.6,
                thickness: 0.5
            });

            for (let i = 0; i < 8; i++) {
                const grape = new THREE.Mesh(grapeGeom, grapeMat);
                grape.position.set(
                    (Math.random() - 0.5) * 0.2 * scale,
                    (Math.random() - 0.5) * 0.2 * scale - (i * 0.05 * scale),
                    (Math.random() - 0.5) * 0.2 * scale
                );
                group.add(grape);
            }
        }
        return group;
    },

    createColoredSpring: (scale = 1, color) => {
        // Same as createSpring but accepts color
        const path = new HelixCurve(scale, 8);
        const geometry = new THREE.TubeGeometry(path, 64, 0.05 * scale, 8, false);
        const material = new THREE.MeshStandardMaterial({
            color: color || 0xaaaaaa,
            metalness: 0.9,
            roughness: 0.3
        });
        return new THREE.Mesh(geometry, material);
    },

    createBead: (scale = 1, color) => {
        // Simple Torus or Sphere with hole
        const geometry = new THREE.TorusGeometry(0.15 * scale, 0.08 * scale, 12, 24);
        const material = new THREE.MeshPhysicalMaterial({
            color: color || 0x00ffff,
            roughness: 0.1,
            transmission: 0.8,
            thickness: 0.5,
            clearcoat: 1.0
        });
        return new THREE.Mesh(geometry, material);
    },

    // ===== AQUARIUM OBJECTS =====

    createFish: (type = 'tropical', scale = 1, color) => {
        const group = new THREE.Group();

        // Body (ellipsoid)
        const bodyGeom = new THREE.SphereGeometry(0.25 * scale, 16, 12);
        bodyGeom.scale(1.2, 0.8, 0.6); // Elongate
        const bodyMat = new THREE.MeshPhysicalMaterial({
            color: color || 0xff6600,
            roughness: 0.2,
            metalness: 0.4,
            clearcoat: 1.0,
            emissive: color || 0xff6600,
            emissiveIntensity: 0.1
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        group.add(body);

        // Tail
        const tailGeom = new THREE.ConeGeometry(0.15 * scale, 0.3 * scale, 8);
        const tail = new THREE.Mesh(tailGeom, bodyMat);
        tail.rotation.z = Math.PI / 2;
        tail.position.x = -0.35 * scale;
        group.add(tail);

        // Fins
        const finGeom = new THREE.ConeGeometry(0.08 * scale, 0.2 * scale, 6);
        const topFin = new THREE.Mesh(finGeom, bodyMat);
        topFin.rotation.z = Math.PI;
        topFin.position.y = 0.2 * scale;
        group.add(topFin);

        const sideFin = new THREE.Mesh(finGeom, bodyMat);
        sideFin.rotation.y = Math.PI / 2;
        sideFin.position.z = 0.15 * scale;
        sideFin.position.x = 0.05 * scale;
        group.add(sideFin);

        return group;
    },

    createJellyfish: (scale = 1, color) => {
        const group = new THREE.Group();

        // Bell (hemisphere)
        const bellGeom = new THREE.SphereGeometry(0.2 * scale, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const bellMat = new THREE.MeshPhysicalMaterial({
            color: color || 0xff00ff,
            roughness: 0.0,
            transmission: 0.9,
            thickness: 1.0,
            ior: 1.4,
            opacity: 0.6,
            transparent: true,
            emissive: color || 0xff00ff,
            emissiveIntensity: 0.3
        });
        const bell = new THREE.Mesh(bellGeom, bellMat);
        group.add(bell);

        // Tentacles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const tentaclePath = new THREE.CatmullRomCurve3([
                new THREE.Vector3(Math.cos(angle) * 0.15 * scale, -0.05 * scale, Math.sin(angle) * 0.15 * scale),
                new THREE.Vector3(Math.cos(angle) * 0.12 * scale, -0.2 * scale, Math.sin(angle) * 0.12 * scale),
                new THREE.Vector3(Math.cos(angle) * 0.08 * scale, -0.4 * scale, Math.sin(angle) * 0.08 * scale)
            ]);
            const tentacleGeom = new THREE.TubeGeometry(tentaclePath, 8, 0.01 * scale, 4, false);
            const tentacleMat = new THREE.MeshPhysicalMaterial({
                color: color || 0xff00ff,
                roughness: 0.3,
                transmission: 0.6,
                emissive: color || 0xff00ff,
                emissiveIntensity: 0.2
            });
            const tentacle = new THREE.Mesh(tentacleGeom, tentacleMat);
            group.add(tentacle);
        }

        return group;
    },

    createSeahorse: (scale = 1, color) => {
        const group = new THREE.Group();

        // Body curve (S-shape)
        const bodyPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.4 * scale, 0),
            new THREE.Vector3(0.05 * scale, 0.2 * scale, 0),
            new THREE.Vector3(-0.05 * scale, 0, 0),
            new THREE.Vector3(0, -0.2 * scale, 0),
            new THREE.Vector3(0.1 * scale, -0.4 * scale, 0)
        ]);

        const bodyGeom = new THREE.TubeGeometry(bodyPath, 32, 0.05 * scale, 8, false);
        const bodyMat = new THREE.MeshPhysicalMaterial({
            color: color || 0xffaa00,
            roughness: 0.4,
            metalness: 0.3,
            clearcoat: 0.5
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        group.add(body);

        // Head (snout)
        const headGeom = new THREE.SphereGeometry(0.08 * scale, 12, 12);
        headGeom.scale(1, 1.5, 0.8);
        const head = new THREE.Mesh(headGeom, bodyMat);
        head.position.y = 0.45 * scale;
        group.add(head);

        return group;
    },

    createShell: (type = 'spiral', scale = 1, color) => {
        if (type === 'spiral') {
            // Spiral conch shell
            const points = [];
            for (let i = 0; i < 50; i++) {
                const t = i / 50;
                const angle = t * Math.PI * 6;
                const radius = t * 0.3 * scale;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * radius,
                    t * 0.5 * scale,
                    Math.sin(angle) * radius
                ));
            }
            const path = new THREE.CatmullRomCurve3(points);
            const geometry = new THREE.TubeGeometry(path, 64, 0.05 * scale, 8, false);
            const material = new THREE.MeshPhysicalMaterial({
                color: color || 0xffe4b5,
                roughness: 0.3,
                clearcoat: 0.8
            });
            return new THREE.Mesh(geometry, material);
        } else {
            // Scallop shell
            const geometry = new THREE.SphereGeometry(0.2 * scale, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const material = new THREE.MeshPhysicalMaterial({
                color: color || 0xffdab9,
                roughness: 0.5,
                clearcoat: 0.5
            });
            const shell = new THREE.Mesh(geometry, material);

            // Add ridges
            for (let i = 0; i < 8; i++) {
                const ridgeGeom = new THREE.BoxGeometry(0.25 * scale, 0.02 * scale, 0.02 * scale);
                const ridge = new THREE.Mesh(ridgeGeom, material);
                ridge.position.y = -0.05 * scale;
                ridge.rotation.z = (i / 8) * Math.PI;
                shell.add(ridge);
            }
            return shell;
        }
    },

    createStarfish: (scale = 1, color) => {
        const group = new THREE.Group();
        const numArms = 5;

        for (let i = 0; i < numArms; i++) {
            const angle = (i / numArms) * Math.PI * 2;
            const armGeom = new THREE.ConeGeometry(0.08 * scale, 0.3 * scale, 8);
            const armMat = new THREE.MeshPhysicalMaterial({
                color: color || 0xff4500,
                roughness: 0.7,
                clearcoat: 0.3
            });
            const arm = new THREE.Mesh(armGeom, armMat);
            arm.rotation.z = Math.PI / 2;
            arm.position.x = Math.cos(angle) * 0.15 * scale;
            arm.position.z = Math.sin(angle) * 0.15 * scale;
            arm.rotation.y = -angle;
            group.add(arm);
        }

        // Center body
        const centerGeom = new THREE.SphereGeometry(0.08 * scale, 12, 12);
        centerGeom.scale(1, 0.5, 1);
        const center = new THREE.Mesh(centerGeom, group.children[0].material);
        group.add(center);

        return group;
    },

    createCoral: (scale = 1, color) => {
        const group = new THREE.Group();

        // Branching coral structure
        function addBranch(parent, depth, pos, angle) {
            if (depth > 3) return;

            const branchPath = new THREE.CatmullRomCurve3([
                pos,
                new THREE.Vector3(
                    pos.x + Math.cos(angle) * 0.15 * scale,
                    pos.y + 0.15 * scale,
                    pos.z + Math.sin(angle) * 0.15 * scale
                )
            ]);

            const branchGeom = new THREE.TubeGeometry(branchPath, 8, 0.02 * scale * (4 - depth) / 4, 6, false);
            const branchMat = new THREE.MeshPhysicalMaterial({
                color: color || 0xff69b4,
                roughness: 0.6
            });
            const branch = new THREE.Mesh(branchGeom, branchMat);
            parent.add(branch);

            // Add sub-branches
            if (Math.random() > 0.3) {
                const endPos = branchPath.getPoint(1);
                addBranch(parent, depth + 1, endPos, angle + (Math.random() - 0.5));
                addBranch(parent, depth + 1, endPos, angle + Math.PI / 3 + (Math.random() - 0.5));
            }
        }

        addBranch(group, 0, new THREE.Vector3(0, 0, 0), 0);
        addBranch(group, 0, new THREE.Vector3(0, 0, 0), Math.PI * 2 / 3);
        addBranch(group, 0, new THREE.Vector3(0, 0, 0), Math.PI * 4 / 3);

        return group;
    },

    // ===== OUTER SPACE OBJECTS =====

    createPlanet: (type = 'rocky', scale = 1, color) => {
        const group = new THREE.Group();

        const planetGeom = new THREE.SphereGeometry(0.3 * scale, 32, 32);
        const planetMat = new THREE.MeshPhysicalMaterial({
            color: color || 0x8b4513,
            roughness: type === 'gas' ? 0.3 : 0.8,
            metalness: 0.2,
            emissive: type === 'gas' ? (color || 0x8b4513) : 0x000000,
            emissiveIntensity: type === 'gas' ? 0.1 : 0
        });
        const planet = new THREE.Mesh(planetGeom, planetMat);
        group.add(planet);

        // Add rings for gas giants
        if (type === 'ringed') {
            const ringGeom = new THREE.RingGeometry(0.35 * scale, 0.5 * scale, 32);
            const ringMat = new THREE.MeshPhysicalMaterial({
                color: 0xccaa88,
                roughness: 0.5,
                transparent: true,
                opacity: 0.7,
                side: THREE.DoubleSide
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }

        // Craters for rocky planets
        if (type === 'cratered') {
            for (let i = 0; i < 8; i++) {
                const craterGeom = new THREE.SphereGeometry(0.05 * scale, 8, 8);
                const craterMat = new THREE.MeshPhysicalMaterial({
                    color: 0x444444,
                    roughness: 0.9
                });
                const crater = new THREE.Mesh(craterGeom, craterMat);
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                crater.position.set(
                    0.3 * scale * Math.sin(phi) * Math.cos(theta),
                    0.3 * scale * Math.sin(phi) * Math.sin(theta),
                    0.3 * scale * Math.cos(phi)
                );
                crater.scale.set(1, 0.3, 1);
                group.add(crater);
            }
        }

        return group;
    },

    createAsteroid: (scale = 1, color) => {
        // Irregular rocky chunk
        const geometry = new THREE.DodecahedronGeometry(0.2 * scale, 0);

        // Randomize vertices for irregular shape
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            positions.setXYZ(
                i,
                positions.getX(i) * (0.7 + Math.random() * 0.6),
                positions.getY(i) * (0.7 + Math.random() * 0.6),
                positions.getZ(i) * (0.7 + Math.random() * 0.6)
            );
        }
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhysicalMaterial({
            color: color || 0x666666,
            roughness: 0.9,
            metalness: 0.3
        });

        return new THREE.Mesh(geometry, material);
    },

    createComet: (scale = 1, color) => {
        const group = new THREE.Group();

        // Head (icy nucleus)
        const headGeom = new THREE.SphereGeometry(0.15 * scale, 16, 16);
        const headMat = new THREE.MeshPhysicalMaterial({
            color: color || 0xaaccff,
            roughness: 0.2,
            transmission: 0.5,
            ior: 1.3,
            emissive: 0xaaccff,
            emissiveIntensity: 0.3
        });
        const head = new THREE.Mesh(headGeom, headMat);
        group.add(head);

        // Tail (cone trail)
        const tailGeom = new THREE.ConeGeometry(0.15 * scale, 0.8 * scale, 16);
        const tailMat = new THREE.MeshPhysicalMaterial({
            color: 0xccddff,
            transparent: true,
            opacity: 0.4,
            emissive: 0xccddff,
            emissiveIntensity: 0.2
        });
        const tail = new THREE.Mesh(tailGeom, tailMat);
        tail.rotation.z = -Math.PI / 2;
        tail.position.x = -0.5 * scale;
        group.add(tail);

        return group;
    },

    createSpaceStar: (points = 5, scale = 1, color) => {
        // 3D star shape
        const geometry = new THREE.SphereGeometry(0.15 * scale, 8, 8);
        const material = new THREE.MeshPhysicalMaterial({
            color: color || 0xffff00,
            emissive: color || 0xffff00,
            emissiveIntensity: 0.8,
            roughness: 0.2,
            metalness: 0.5
        });

        const star = new THREE.Mesh(geometry, material);

        // Add point spikes
        const group = new THREE.Group();
        group.add(star);

        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const spikeGeom = new THREE.ConeGeometry(0.05 * scale, 0.2 * scale, 6);
            const spike = new THREE.Mesh(spikeGeom, material);
            spike.rotation.z = Math.PI / 2;
            spike.position.x = Math.cos(angle) * 0.15 * scale;
            spike.position.z = Math.sin(angle) * 0.15 * scale;
            spike.rotation.y = -angle;
            group.add(spike);
        }

        return group;
    },

    // ===== MICROSCOPIC OBJECTS =====

    createCell: (scale = 1, color) => {
        const group = new THREE.Group();

        // Cell membrane (semi-transparent sphere)
        const membraneGeom = new THREE.SphereGeometry(0.3 * scale, 32, 32);
        const membraneMat = new THREE.MeshPhysicalMaterial({
            color: color || 0x88ff88,
            roughness: 0.2,
            transmission: 0.7,
            thickness: 0.5,
            ior: 1.3,
            transparent: true,
            opacity: 0.6
        });
        const membrane = new THREE.Mesh(membraneGeom, membraneMat);
        group.add(membrane);

        // Nucleus
        const nucleusGeom = new THREE.SphereGeometry(0.12 * scale, 16, 16);
        const nucleusMat = new THREE.MeshPhysicalMaterial({
            color: 0x4444ff,
            roughness: 0.3,
            transmission: 0.4,
            emissive: 0x4444ff,
            emissiveIntensity: 0.2
        });
        const nucleus = new THREE.Mesh(nucleusGeom, nucleusMat);
        group.add(nucleus);

        // Organelles (mitochondria, etc.)
        for (let i = 0; i < 5; i++) {
            const organelleGeom = new THREE.SphereGeometry(0.04 * scale, 8, 8);
            organelleGeom.scale(1.5, 1, 1);
            const organelleMat = new THREE.MeshPhysicalMaterial({
                color: 0xff8844,
                roughness: 0.4
            });
            const organelle = new THREE.Mesh(organelleGeom, organelleMat);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = 0.15 * scale;
            organelle.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            group.add(organelle);
        }

        return group;
    },

    createBacteria: (type = 'rod', scale = 1, color) => {
        if (type === 'rod') {
            // Bacillus (rod-shaped)
            const geometry = new THREE.CapsuleGeometry(0.08 * scale, 0.4 * scale, 8, 16);
            const material = new THREE.MeshPhysicalMaterial({
                color: color || 0x00ff00,
                roughness: 0.5,
                emissive: color || 0x00ff00,
                emissiveIntensity: 0.1
            });
            return new THREE.Mesh(geometry, material);
        } else if (type === 'spiral') {
            // Spirochete (spiral-shaped)
            const path = new HelixCurve(scale * 0.6, 4);
            const geometry = new THREE.TubeGeometry(path, 32, 0.04 * scale, 8, false);
            const material = new THREE.MeshPhysicalMaterial({
                color: color || 0xffff00,
                roughness: 0.4,
                emissive: color || 0xffff00,
                emissiveIntensity: 0.15
            });
            return new THREE.Mesh(geometry, material);
        } else {
            // Coccus (sphere)
            const geometry = new THREE.SphereGeometry(0.15 * scale, 16, 16);
            const material = new THREE.MeshPhysicalMaterial({
                color: color || 0xff00ff,
                roughness: 0.5,
                emissive: color || 0xff00ff,
                emissiveIntensity: 0.1
            });
            return new THREE.Mesh(geometry, material);
        }
    },

    createVirus: (scale = 1, color) => {
        const group = new THREE.Group();

        // Capsid (icosahedron core)
        const capsidGeom = new THREE.IcosahedronGeometry(0.15 * scale, 0);
        const capsidMat = new THREE.MeshPhysicalMaterial({
            color: color || 0xff0066,
            roughness: 0.3,
            metalness: 0.2,
            emissive: color || 0xff0066,
            emissiveIntensity: 0.2
        });
        const capsid = new THREE.Mesh(capsidGeom, capsidMat);
        group.add(capsid);

        // Spike proteins
        for (let i = 0; i < 20; i++) {
            const spikeGeom = new THREE.ConeGeometry(0.02 * scale, 0.12 * scale, 6);
            const spike = new THREE.Mesh(spikeGeom, capsidMat);
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const r = 0.15 * scale;
            spike.position.set(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.sin(phi) * Math.sin(theta),
                r * Math.cos(phi)
            );
            spike.lookAt(0, 0, 0);
            spike.rotateX(Math.PI);
            group.add(spike);
        }

        return group;
    },

    createDNA: (scale = 1, color1, color2) => {
        const group = new THREE.Group();

        // Double helix strands
        const numPairs = 8;
        for (let i = 0; i < numPairs; i++) {
            const t = i / numPairs;
            const angle = t * Math.PI * 4; // 2 full turns
            const height = (t - 0.5) * 0.8 * scale;

            // Base pair rungs
            const rungGeom = new THREE.CylinderGeometry(0.01 * scale, 0.01 * scale, 0.15 * scale, 6);
            const rungMat = new THREE.MeshPhysicalMaterial({
                color: 0xcccccc,
                roughness: 0.4
            });
            const rung = new THREE.Mesh(rungGeom, rungMat);
            rung.position.y = height;
            rung.rotation.z = Math.PI / 2;
            rung.rotation.y = angle;
            group.add(rung);

            // Backbone nodes
            const node1Geom = new THREE.SphereGeometry(0.03 * scale, 8, 8);
            const node1Mat = new THREE.MeshPhysicalMaterial({
                color: color1 || 0x0088ff,
                roughness: 0.3,
                emissive: color1 || 0x0088ff,
                emissiveIntensity: 0.2
            });
            const node1 = new THREE.Mesh(node1Geom, node1Mat);
            node1.position.set(
                Math.cos(angle) * 0.075 * scale,
                height,
                Math.sin(angle) * 0.075 * scale
            );
            group.add(node1);

            const node2 = node1.clone();
            node2.material = new THREE.MeshPhysicalMaterial({
                color: color2 || 0xff8800,
                roughness: 0.3,
                emissive: color2 || 0xff8800,
                emissiveIntensity: 0.2
            });
            node2.position.multiplyScalar(-1);
            node2.position.y = height;
            group.add(node2);
        }

        return group;
    },

    createDiatom: (scale = 1, color) => {
        // Geometric algae with intricate pattern
        const geometry = new THREE.CylinderGeometry(0.2 * scale, 0.2 * scale, 0.1 * scale, 8);
        const material = new THREE.MeshPhysicalMaterial({
            color: color || 0x88ffbb,
            roughness: 0.2,
            transmission: 0.6,
            thickness: 0.3,
            ior: 1.5,
            clearcoat: 1.0
        });
        const diatom = new THREE.Mesh(geometry, material);

        const group = new THREE.Group();
        group.add(diatom);

        // Add decorative ridges
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const ridgeGeom = new THREE.BoxGeometry(0.25 * scale, 0.02 * scale, 0.02 * scale);
            const ridge = new THREE.Mesh(ridgeGeom, material);
            ridge.rotation.y = angle;
            group.add(ridge);
        }

        return group;
    },

    // ===== FELINE OBJECTS =====

    createCatHead: (scale = 1, color) => {
        const group = new THREE.Group();

        // Head
        const headGeom = new THREE.SphereGeometry(0.2 * scale, 16, 16);
        headGeom.scale(1, 1.1, 0.9);
        const headMat = new THREE.MeshPhysicalMaterial({
            color: color || 0xff8844,
            roughness: 0.8
        });
        const head = new THREE.Mesh(headGeom, headMat);
        group.add(head);

        // Ears
        const earGeom = new THREE.ConeGeometry(0.08 * scale, 0.15 * scale, 6);
        const leftEar = new THREE.Mesh(earGeom, headMat);
        leftEar.position.set(-0.12 * scale, 0.2 * scale, 0);
        leftEar.rotation.z = -0.3;
        group.add(leftEar);

        const rightEar = leftEar.clone();
        rightEar.position.x = 0.12 * scale;
        rightEar.rotation.z = 0.3;
        group.add(rightEar);

        // Snout
        const snoutGeom = new THREE.SphereGeometry(0.08 * scale, 12, 12);
        snoutGeom.scale(1, 0.6, 1);
        const snout = new THREE.Mesh(snoutGeom, headMat);
        snout.position.set(0, -0.08 * scale, 0.15 * scale);
        group.add(snout);

        // Nose
        const noseGeom = new THREE.SphereGeometry(0.025 * scale, 8, 8);
        const noseMat = new THREE.MeshPhysicalMaterial({
            color: 0xff1493,
            roughness: 0.4
        });
        const nose = new THREE.Mesh(noseGeom, noseMat);
        nose.position.set(0, -0.06 * scale, 0.22 * scale);
        group.add(nose);

        return group;
    },

    createYarnBall: (scale = 1, color) => {
        // Wrapped yarn texture
        const geometry = new THREE.SphereGeometry(0.2 * scale, 16, 16);
        const material = new THREE.MeshPhysicalMaterial({
            color: color || 0xff00ff,
            roughness: 0.9
        });
        const ball = new THREE.Mesh(geometry, material);

        // Add yarn strand wrapping
        const group = new THREE.Group();
        group.add(ball);

        const strandPath = new HelixCurve(scale * 0.25, 12);
        const strandGeom = new THREE.TubeGeometry(strandPath, 64, 0.015 * scale, 6, false);
        const strand = new THREE.Mesh(strandGeom, material);
        group.add(strand);

        return group;
    },

    createPaw: (scale = 1, color) => {
        const group = new THREE.Group();

        // Pad
        const padGeom = new THREE.SphereGeometry(0.15 * scale, 12, 12);
        padGeom.scale(1.2, 0.6, 1);
        const padMat = new THREE.MeshPhysicalMaterial({
            color: color || 0xffaacc,
            roughness: 0.7
        });
        const pad = new THREE.Mesh(padGeom, padMat);
        group.add(pad);

        // Toe beans
        for (let i = 0; i < 4; i++) {
            const toeGeom = new THREE.SphereGeometry(0.05 * scale, 8, 8);
            const toe = new THREE.Mesh(toeGeom, padMat);
            const angle = ((i / 4) * Math.PI) - Math.PI / 2;
            toe.position.set(
                Math.cos(angle) * 0.12 * scale,
                0.08 * scale,
                Math.sin(angle) * 0.12 * scale
            );
            group.add(toe);
        }

        return group;
    },

    createMouseToy: (scale = 1, color) => {
        const group = new THREE.Group();

        // Body
        const bodyGeom = new THREE.SphereGeometry(0.12 * scale, 12, 12);
        bodyGeom.scale(1.5, 1, 1);
        const bodyMat = new THREE.MeshPhysicalMaterial({
            color: color || 0xcccccc,
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        group.add(body);

        // Ears
        const earGeom = new THREE.CircleGeometry(0.08 * scale, 8);
        const leftEar = new THREE.Mesh(earGeom, bodyMat);
        leftEar.position.set(-0.08 * scale, 0.08 * scale, 0.08 * scale);
        leftEar.rotation.y = -Math.PI / 4;
        group.add(leftEar);

        const rightEar = leftEar.clone();
        rightEar.position.x = 0.08 * scale;
        rightEar.rotation.y = Math.PI / 4;
        group.add(rightEar);

        // Tail
        const tailPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-0.15 * scale, 0, 0),
            new THREE.Vector3(-0.25 * scale, 0.05 * scale, 0),
            new THREE.Vector3(-0.3 * scale, 0.1 * scale, 0)
        ]);
        const tailGeom = new THREE.TubeGeometry(tailPath, 8, 0.01 * scale, 6, false);
        const tail = new THREE.Mesh(tailGeom, bodyMat);
        group.add(tail);

        return group;
    }
};
