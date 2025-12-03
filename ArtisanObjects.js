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
            // Center it roughly
            const positions = shape.getPoints();
            // (Simplification: just shift it down a bit)
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
    }
};
