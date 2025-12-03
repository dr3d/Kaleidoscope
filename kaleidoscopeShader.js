export const kaleidoscopeFragmentShader = `
uniform sampler2D tDiffuse;
uniform vec2 uResolution;
uniform float uSegments;
uniform float uAngle;
uniform float uZoom;
uniform float uTime;

varying vec2 vUv;

const float PI = 3.14159265359;

void main() {
    // Normalize UV to -1.0 to 1.0
    vec2 uv = vUv * 2.0 - 1.0;
    
    // Adjust for aspect ratio
    float aspect = uResolution.x / uResolution.y;
    uv.x *= aspect;
    
    // Convert to Polar Coordinates
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    
    // Apply Rotation
    a += uAngle;
    
    // Kaleidoscope Logic
    float segmentAngle = 2.0 * PI / uSegments;
    
    // Wrap angle
    a = mod(a, segmentAngle);
    
    // Mirroring (Fold)
    a = abs(a - segmentAngle / 2.0);
    
    // Convert back to Cartesian
    // We add a slight offset or manipulation to r for more interesting "deep" look if desired
    // But standard mapping is:
    vec2 newUv = vec2(cos(a), sin(a)) * r;
    
    // Zoom
    newUv /= uZoom;
    
    // Pan/Offset to sample different parts of the texture based on time or other factors
    // This makes the center of the kaleidoscope move around the source texture
    vec2 offset = vec2(0.5, 0.5); // Center of source texture
    
    // Map back to 0.0 - 1.0 range for texture sampling
    // We rotate the sampling frame slightly over time to keep it alive
    float timeAngle = uTime * 0.05;
    mat2 rot = mat2(cos(timeAngle), -sin(timeAngle), sin(timeAngle), cos(timeAngle));
    newUv = rot * newUv;
    
    vec2 sampleUv = newUv + offset;
    
    // Vignette / Masking (optional, to make it look like a tube)
    // float mask = smoothstep(1.0, 0.95, r / uZoom); // Simple circular mask
    
    vec4 color = texture2D(tDiffuse, sampleUv);
    
    // Add a bit of chromatic aberration for "glass" feel at edges
    float aberration = 0.005 * r;
    color.r = texture2D(tDiffuse, sampleUv + vec2(aberration, 0.0)).r;
    color.b = texture2D(tDiffuse, sampleUv - vec2(aberration, 0.0)).b;
    
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
