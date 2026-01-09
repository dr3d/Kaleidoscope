# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Lumina Scope** is an artisan digital kaleidoscope that combines real-time 3D graphics, generative audio, and physics simulation. Unlike mathematical kaleidoscopes, it simulates a physical "Object Chamber" filled with tumbling 3D objects (glass rods, charms, gems) that are rendered to a texture, then mirrored through custom GLSL shaders to create the kaleidoscope effect.

## Architecture

### Core Components

1. **main.js** - Application entry point and orchestration
   - Initializes Three.js renderer with post-processing (UnrealBloomPass for glow)
   - Manages the main animation loop and user interaction
   - Coordinates between the Object Chamber, Kaleidoscope Shader, and Audio Engine
   - Handles idle detection (30s threshold) with procedural "wandering" rotation and periodic resets (30-120s)
   - UI inactivity fade logic (5s)

2. **ObjectChamber.js** - The 3D "Source" scene
   - Renders 30-60 physics-simulated 3D objects to a 1024x1024 texture
   - Implements basic collision detection (O(N²)) with elastic bounce response
   - Five themes: 'christmas', 'halloween', 'industrial', 'fruity', 'gemstone'
   - Dynamic environment mapping with procedural HDR backgrounds (hue-based)
   - Objects have velocity, rotation velocity, and 70% are audio-reactive (scale pulsing)
   - During idle: swaps 1-2 objects every 2s to keep content fresh

3. **kaleidoscopeShader.js** - GLSL Fragment/Vertex shaders
   - Polar coordinate transformation for kaleidoscope mirroring
   - Supports 4-16 mirror segments (adjustable)
   - Chromatic aberration for "glass" effect at edges
   - Applies rotation, zoom, and time-based rotation to the texture sampling

4. **KaleidoscopeAudio.js** - Generative audio engine (Tone.js)
   - Six beat modes: 'ambient', 'choral', 'tumbling', 'house', 'algorave', 'exotic_groove'
   - Eleven exotic scales including Hirajoshi, Phrygian Dominant, Byzantine, Hungarian Minor, etc.
   - Mode switching every 4-12 bars with automatic scale rotation
   - Physics-aware: collision sounds (glass chimes) triggered by relative velocity
   - Audio reactivity: Kick/bass energy feeds back into object scaling
   - Idle state detection triggers **PitchWarp** - global pitch shifting (-12 to +12 semitones) via Tone.PitchShift
   - Instruments: MembraneSynth (kick), NoiseSynth (snare), MetalSynth (hihat/crash), MonoSynth (bass/aggro lead), PolySynth (chords/glass/choir)
   - Master effects chain: Distortion → Reverb → PitchShift → Filter → Destination

5. **ArtisanObjects.js** - 3D object generators
   - Parametric curves (HelixCurve, TwistedRodCurve) for springs and glass rods
   - Extruded 2D shapes for charms (star, moon, heart, diamond, lightning, cloud, kitty)
   - Fruit objects (cherry with stem, grape cluster)
   - Industrial objects (screws with threads, colored springs)
   - All use PBR materials: MeshPhysicalMaterial for glass (high transmission, clearcoat), MeshStandardMaterial for metals

## Key Technical Details

### Render Pipeline
```
ObjectChamber (3D Scene)
  → Render to Texture (1024x1024)
  → Kaleidoscope Shader (Polar mirroring)
  → EffectComposer (RenderPass → UnrealBloomPass → OutputPass)
  → Screen
```

### Audio-Visual Binding
- ObjectChamber.update() reads audio energy via `audio.getEnergy()` (0-1 normalized from Tone.Meter dB)
- Reactive objects pulse: `scale = baseScale * (1.0 + max(0, energy - 0.2) * 0.8)`
- Collision detection triggers `audio.triggerCollisionSound(relativeVelocity)` when impact > 0.005

### Idle Behavior
- **Minor Idle** (30s): Procedural rotation, breathing zoom, hue cycling, dynamic object swapping
- **Major Idle** (30-120s random): Rebuilds chamber, resets audio (fade out/in), randomizes mirror count
- Audio PitchWarp only active during idle state

## Running the Project

This is a vanilla JavaScript project using CDN imports for Three.js and Tone.js.

### Development
```bash
# Serve with any static file server
# For example, with Python:
python -m http.server 8000

# Or with Node.js http-server:
npx http-server -p 8000
```

Open `http://localhost:8000` in browser. **Important**: Must serve over HTTP/localhost - direct `file://` protocol will block ES module imports.

### Building/Testing
No build step required. Changes to `.js` files are reflected on browser refresh (note cache-busting `?v=` params in HTML).

## Common Development Patterns

### Adding New Themes
1. Add theme name to `themes` array in `ObjectChamber.js:93`
2. Implement object distribution logic in `buildNew()` method (~line 109)
3. Add color palette in `getThemeColor()` method (~line 177)
4. Optionally add new object types in `ArtisanObjects.js`

### Adding Audio Modes
1. Add mode to selection logic in `performModeSwitch()` (~line 501)
2. Modify loop conditions in sequencer loops (kickLoop, snareLoop, etc.) to handle new mode
3. Add parameter updates (distortion, BPM) for new mode

### Modifying Physics
- Collision threshold is at `distSq < (radiusA + radiusB)²` (~line 271)
- Boundary sphere radius is 4.5 units (~line 307)
- Velocity damping on collision uses lerp factor 0.8 (~line 283)

### Shader Modifications
- Segment mirroring logic: `mod(angle, segmentAngle)` then `abs(angle - segmentAngle/2)` (~line 32-35)
- Chromatic aberration amount: `0.005 * r` (~line 63)
- Time rotation speed: `uTime * 0.05` (~line 51)

## File Naming Conventions
- Cache-busting via query params: `?v=100`, `?v=102` in HTML imports
- JavaScript files use PascalCase for classes (ObjectChamber, KaleidoscopeAudio)
- Shader exports use camelCase with suffix (kaleidoscopeFragmentShader)

## Browser Compatibility Notes
- Requires WebGL 2.0 for MeshPhysicalMaterial (transmission)
- Tone.js requires user gesture to start AudioContext (Start Audio button)
- Performance: Caps pixel ratio at 2x for mobile (`Math.min(devicePixelRatio, 2)`)

## Debug Features
- `window.chamber` and `window.audio` exposed for console debugging
- `?ui_debug=true` query param keeps UI always visible
- `check-chamber` toggle switches from kaleidoscope to raw 3D chamber view
- Global error handler displays errors as red overlay div
