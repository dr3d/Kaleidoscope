export const kaleidoscopeFragmentShader = `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uSegments;
uniform float uAngle;
uniform float uZoom;
uniform float uTime;
uniform float uKaleidoSpin;

varying vec2 vUv;

const float PI = 3.14159265359;

// Glass front simulation functions
vec2 applyBarrelDistortion(vec2 uv, float strength) {
    vec2 center = vec2(0.5, 0.5);
    vec2 delta = uv - center;
    float r = length(delta);
    float factor = 1.0 + strength * r * r;
    return center + delta * factor;
}

float calculateVignette(vec2 uv, float strength) {
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(uv, center);
    return 1.0 - smoothstep(0.4, 1.0, dist) * strength;
}

void main() {
    // Normalize UV to -1.0 to 1.0
    vec2 uv = vUv * 2.0 - 1.0;

    // Adjust for aspect ratio
    float aspect = uResolution.x / uResolution.y;
    uv.x *= aspect;

    // Convert to Polar Coordinates
    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // Apply Rotation (user interaction)
    a += uAngle;

    // Add independent kaleidoscope spin
    a += uKaleidoSpin;

    // Kaleidoscope Logic
    float segmentAngle = 2.0 * PI / uSegments;

    // Wrap angle
    a = mod(a, segmentAngle);

    // Mirroring (Fold)
    a = abs(a - segmentAngle / 2.0);

    // Convert back to Cartesian with NON-LINEAR RADIAL COMPRESSION
    // This fixes the empty background issue by compressing outer regions
    float radialFactor = pow(r, 0.7); // Compress outer regions to fill space
    vec2 newUv = vec2(cos(a), sin(a)) * radialFactor;

    // Zoom
    newUv /= uZoom;

    // Pan/Offset to sample different parts of the texture based on time or other factors
    vec2 offset = vec2(0.5, 0.5); // Center of source texture

    // Add spiral sampling pattern to always hit texture content
    float spiralPhase = atan(newUv.y, newUv.x);
    float spiralRadius = length(newUv);
    vec2 spiralOffset = vec2(
        cos(spiralPhase + uTime * 0.1) * 0.15 * spiralRadius,
        sin(spiralPhase + uTime * 0.1) * 0.15 * spiralRadius
    );

    // Map back to 0.0 - 1.0 range for texture sampling
    float timeAngle = uTime * 0.05;
    mat2 rot = mat2(cos(timeAngle), -sin(timeAngle), sin(timeAngle), cos(timeAngle));
    newUv = rot * newUv;
    vec2 sampleUv = newUv + offset + spiralOffset;

    // Ensure wrapping for seamless tiling
    sampleUv = fract(sampleUv);

    // Apply lens distortion (barrel/pincushion) for glass front effect
    sampleUv = applyBarrelDistortion(sampleUv, 0.15);

    vec4 color = texture2D(tDiffuse, sampleUv);

    // Enhanced radial chromatic aberration for glass effect
    vec2 aberrationDir = normalize(uv);
    float aberration = 0.008 * r * r; // Quadratic falloff
    color.r = texture2D(tDiffuse, applyBarrelDistortion(sampleUv + aberrationDir * aberration, 0.15)).r;
    color.g = texture2D(tDiffuse, applyBarrelDistortion(sampleUv, 0.15)).g;
    color.b = texture2D(tDiffuse, applyBarrelDistortion(sampleUv - aberrationDir * aberration, 0.15)).b;

    // Apply vignette for tube effect
    float vignette = calculateVignette(sampleUv, 0.3);
    color.rgb *= vignette;

    // Fresnel-like edge glow
    float edgeGlow = pow(1.0 - vignette, 2.0) * 0.3;
    color.rgb += edgeGlow;

    // Simulate internal reflections (subtle ghosting)
    vec2 ghostUv = sampleUv * 0.98 + 0.01;
    vec4 ghost = texture2D(tDiffuse, ghostUv) * 0.15;
    color = mix(color, color + ghost, r * 0.3);

    gl_FragColor = color;
}
`;

export const kaleidoscopeVertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
