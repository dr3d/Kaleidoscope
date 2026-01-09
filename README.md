# Lumina Scope: A Real-Time 3D Kaleidoscope

An immersive digital kaleidoscope that actually simulates a physical object chamber. Not just colorful noise—this is a fully-realized 3D physics simulation rendered through mathematically accurate kaleidoscope optics, complete with dynamic camera movement, glass front effects, and a generative audio engine that responds to everything happening in the scene.

<video src="preview.mp4" poster="preview.png" controls autoplay loop muted style="width: 100%; max-width: 800px; border-radius: 8px;"></video>

## What Makes This Different

Most digital kaleidoscopes are just 2D patterns with rotation. This one simulates the actual physics:

**3D Object Chamber** → **Real-Time Physics** → **Render to Texture** → **Kaleidoscope Shader** → **Post-Processing**

The objects you see aren't just visuals—they have mass, velocity, collisions, and audio feedback. The camera moves *through* the chamber, inside the tumbling objects. The kaleidoscope pattern rotates independently from your view. Everything is audio-reactive and constantly evolving.

## Recent Major Improvements

### Visual Enhancements
- **Non-linear radial compression** in shader eliminates empty background issues
- **Glass front simulation**: barrel distortion, chromatic aberration, vignetting, fresnel edge glow
- **Balanced bloom system**: no more center hot spots, subtle sparkle without overwhelming
- **Enhanced materials**: 80% glass with proper IOR (1.8-2.2), emissive properties tuned for elegance
- **High-resolution rendering**: 2048x2048 render target with 4x MSAA antialiasing
- **Independent kaleidoscope rotation**: pattern slowly evolves even when static

### Dynamic Camera System
Six camera modes that fundamentally change the viewing experience:

1. **Inside** - Camera weaves *through* the tumbling objects, creating immersive depth
2. **Orbital** - Classic circular sweep with vertical bobbing
3. **Drift** - Organic random walk with soft boundaries and momentum
4. **Figure-8** - Lissajous curve pattern for hypnotic mathematical movement
5. **Follow** - Tracks the nearest object like a chase cam
6. **Static** - Traditional fixed viewpoint for purists

Camera mode randomizes on scope rebuilds and idle resets, ensuring constant visual evolution.

### Audio System Overhaul
- **Fixed bass loop**: Pattern-based sequencing (60-75% density) replaced unreliable random probability
- **Tight audio-visual coupling**: Every visible collision triggers a velocity-based glass chime (removed the 80% gate that was silencing most sounds)
- **Mode differentiation**: Each audio mode now has distinct BPM ranges, reverb decay, and delay timing
  - House: 122-128 BPM, 4s reverb, 8th note delay
  - Exotic Groove: 95-105 BPM, 6s reverb, 4th note delay
  - Algorave: 135-145 BPM, 2s reverb, 16th note delay
  - Choral: 60-80 BPM, 12s reverb, half note delay
  - Tumbling: 80-100 BPM, 8s reverb, quarter note delay
- **Pitch warp idle effect**: PitchShift detunes everything during contemplative idle periods
- **Eastern scales added**: Hirajoshi, Pelog, In Sen for exotic flavor

### UI/UX Polish
- **Status panel**: Real-time display of theme, camera mode, audio mode, scale, tempo
- **Flash notifications**: Status panel briefly appears when moods/themes change, then fades
- **Cursor hiding**: Mouse disappears with UI after 5 seconds of inactivity
- **Smooth rotation inertia**: Reduced deceleration (0.98 decay) and increased momentum (1.5x multiplier)
- **Keyboard shortcuts**: Space (audio toggle), A (audio mode cycle), F (fullscreen), C (camera cycle)
- **Mobile support**: Touch controls, pinch-to-zoom, responsive layout
- **Accessibility**: ARIA labels, focus indicators, semantic HTML

## Technical Architecture

### Core Technologies
- **Three.js** - 3D rendering engine with WebGL
- **GLSL Shaders** - Custom fragment shader for kaleidoscope effect
- **Tone.js** - Web Audio API wrapper for generative synthesis
- **EffectComposer** - Post-processing pipeline with bloom

### Rendering Pipeline

```
ObjectChamber.js (3D Scene)
├── 50-100 physics-simulated objects
├── PerspectiveCamera (FOV 60°, dynamic positioning)
├── Enhanced lighting (backlight + 4 accent lights)
└── Renders to 2048x2048 WebGLRenderTarget

↓

kaleidoscopeShader.js (GLSL)
├── Polar coordinate transformation
├── Kaleidoscope mirroring (4-16 segments)
├── Non-linear radial compression
├── Spiral sampling pattern
├── Glass front effects (distortion, aberration, vignette)
└── Independent rotation animation

↓

Post-Processing
├── UnrealBloomPass (threshold 0.3, strength 0.6, radius 0.6)
├── Audio-reactive bloom modulation (0.6-1.2x)
└── OutputPass to screen
```

### Physics Simulation
- **Collision detection**: O(N²) with velocity-based audio triggers
- **Object distribution**: 4×4×3 unit box for dense, interesting composition
- **Material properties**: Glass (IOR 1.8-2.2, transmission, roughness) and metal (metalness, emissive)
- **Dynamic scaling**: Objects pulse with audio energy in real-time

### Audio Architecture

```javascript
KaleidoscopeAudio.js
├── Sequenced Instruments
│   ├── Bass (MembraneSynth) - pattern-based, not random
│   ├── Chords (PolySynth) - probabilistic with scale locking
│   ├── Melody (MonoSynth) - weighted note selection
│   └── Arpeggio (PolySynth) - mode-dependent patterns
│
├── Collision-Triggered Sounds
│   ├── Glass chimes (velocity-sensitive)
│   ├── Tight coupling to visual collisions
│   └── Lowered threshold (0.003) for more responsiveness
│
├── Effects Chain
│   ├── Reverb (adaptive decay 2-12s)
│   ├── Delay (adaptive timing 16n-4n)
│   ├── PitchShift (idle warp effect)
│   └── Limiter (master output protection)
│
└── Analysis
    ├── FFT (frequency domain)
    ├── Meter (time domain energy)
    └── Normalized output (0-1) drives visual scaling
```

### Idle Behavior System

The kaleidoscope evolves automatically during inactivity:

- **5 seconds**: UI fades out, cursor hides
- **Every ~20 seconds**: 30% chance of camera mode shift
- **Every 30-120 seconds**: Major reset
  - Rebuild entire object chamber
  - Randomize mirror count (4-16)
  - Change camera mode
  - Audio texture reset (fade + restart)
  - Flash status panel with new settings

This ensures the experience never becomes stale during ambient display.

## Key Features

### Visual
- 4-16 adjustable mirror segments
- 50-100 simulated 3D objects
- Real-time physics with collision detection
- Glass and metal materials with proper refractive properties
- Balanced bloom without hot spots
- 6 dynamic camera modes including "inside chamber" view
- Glass front effects (distortion, aberration, vignetting)
- Independent kaleidoscope pattern rotation

### Audio
- 5 generative music modes (House, Exotic, Algorave, Choral, Tumbling)
- Pattern-based sequencing for reliable bass presence
- Velocity-sensitive collision sounds
- Eastern and western scale systems
- Adaptive reverb and delay per mode
- Pitch warp effect during idle periods
- Tight audio-visual coupling

### Interaction
- Mouse drag to rotate kaleidoscope view
- Mouse wheel to zoom
- Touch controls with pinch-to-zoom
- Keyboard shortcuts (Space, A, F, C)
- Theme selector (Gemstone, Enchanted, Monochrome, Celestial)
- Camera mode selector
- Build New Scope button for instant variation
- Debug chamber view toggle

### Polish
- Status panel with real-time state display
- Flash notifications on mood changes
- Auto-hiding UI with cursor fade
- Smooth rotation inertia
- Mobile responsive design
- Accessibility features

## How It Actually Works

### The Shader Math

The kaleidoscope effect uses polar coordinate transformation with a twist:

1. **Normalize UV** coordinates to -1.0 to 1.0 range
2. **Convert to polar**: `r = length(uv)`, `a = atan(uv.y, uv.x)`
3. **Apply rotations**: User drag + independent kaleidoscope spin
4. **Wrap angle**: `a = mod(a, segmentAngle)` divides space into segments
5. **Mirror**: `a = abs(a - segmentAngle/2)` creates symmetry
6. **Non-linear compression**: `radialFactor = pow(r, 0.7)` compresses outer regions more than inner, eliminating empty background
7. **Spiral sampling**: Adds rotating offset based on angle and time to ensure texture content is always sampled
8. **Glass effects**: Barrel distortion, chromatic aberration (separate R/G/B samples), vignette, edge glow, ghosting

This creates seamless, full-coverage kaleidoscope patterns with realistic optical effects.

### The Camera System

Each mode uses parametric equations to define movement:

- **Inside**: Sinusoidal weaving with independent look target
  ```javascript
  x = sin(t * 0.3) * 2.0 + cos(t * 0.7) * 0.5
  y = cos(t * 0.5) * 2.0 + sin(t * 0.9) * 0.5
  z = sin(t * 0.2) * 1.5
  ```

- **Orbital**: Circular path with vertical oscillation
  ```javascript
  x = cos(t * 0.2) * 5.0
  z = sin(t * 0.2) * 5.0
  y = sin(t * 0.3) * 2.0
  ```

- **Drift**: Random walk with velocity dampening and soft boundaries

- **Figure-8**: Lissajous curve (different frequency ratios on X/Y)
  ```javascript
  x = sin(t * 0.3) * 3.5
  y = sin(t * 0.5) * 3.5
  z = cos(t * 0.25) * 2.0
  ```

- **Follow**: Lerp toward nearest object position with offset

### Why Pattern-Based Bass Works

Original implementation used `if (Math.random() > 0.8)` which gave only 20% density—bass was barely audible. The new system uses fixed rhythm patterns:

```javascript
const bassPattern = [1, 0, 1, 1, 0, 1, 1, 0]; // 60% density
```

This guarantees predictable bass presence while maintaining variation through scale/root note randomization. The pattern cycles through, creating recognizable rhythm while the notes themselves vary infinitely.

## What Makes This Special

1. **True 3D simulation**: Not just visual trickery—actual physics with mass, velocity, collisions
2. **Render-to-texture architecture**: The chamber is a real 3D scene, not a flat pattern
3. **Mathematical accuracy**: Polar coordinate transformation mimics real kaleidoscope optics
4. **Dynamic camera**: You're not locked to one viewpoint—the observer moves through the space
5. **Generative audio**: Never the same twice, fully integrated with the visuals
6. **Audio-visual coupling**: Every collision makes sound, every beat causes movement
7. **Continuous evolution**: Idle behavior ensures ambient display never gets boring
8. **Glass front simulation**: Optical effects (distortion, aberration, vignetting) mimic real kaleidoscope construction
9. **Balanced aesthetics**: Bloom and glow without overwhelming—subtle sparkle, not blinding light

## Future Possibilities

### Audio Enhancements
- Audio-reactive camera (zoom pulses with kick, position shifts on crashes)
- Collision camera shake (intensity based on impact velocity)
- Spatial audio (panning based on object position in 3D space)

### Visual Extensions
- Depth of field with focus tracking
- Multiple nested kaleidoscope layers with Moiré interference
- Particle systems for added complexity
- More themes (Cyberpunk, Underwater, Crystalline)

### Interaction Improvements
- Gyroscope control on mobile (tilt to tumble)
- Snapshot/export high-resolution captures
- Camera preset system with smooth transitions
- URL parameter sharing for specific configurations

### Technical Deep Dives
- WebGPU migration for better performance
- VR mode (step inside the kaleidoscope)
- Real-time ray tracing for more accurate glass refraction
- GPU-accelerated collision detection for 200+ objects

---

**Built with Three.js, GLSL, Tone.js, and an obsessive attention to detail.**

*2025-2026*
