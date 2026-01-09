# Experimental Changes - Camera Movement & Bloom Fix

**Date:** 2026-01-09
**Status:** ✅ Ready for testing

---

## 🔧 BLOOM FIXES

### Problem
- Excessive bloom creating a hot spot in center screen
- Everything was glowing too much

### Solution
**Bloom Parameters Adjusted:**
- Threshold: 0.1 → **0.3** (only bright things glow)
- Strength: 1.5 → **0.6** (less intense)
- Radius: 0.8 → **0.6** (tighter spread)
- Audio-reactive range: 1.5-3.0 → **0.6-1.2** (more subtle)

**Lighting Adjusted:**
- Backlight intensity: 8.0 → **4.0** (was causing hot spot)
- Glass emissive: 0.3-0.5 → **0.1-0.25** (less self-illumination)
- Metal emissive: 0.2 → **0.1** (more subtle)

**Result:** Balanced glow that highlights without overwhelming

---

## 🎥 DYNAMIC CAMERA SYSTEM

### New Feature: Observer Inside the Chamber!

The camera now **moves through the observation space** with 6 different modes:

### Camera Modes

1. **Inside** (Default for new sessions)
   - Camera moves **INSIDE the object chamber**
   - Weaves through the tumbling objects
   - Creates an immersive "being inside the kaleidoscope" experience
   - Position oscillates in 3D space (2 unit radius)
   - Look target moves independently for dynamic framing

2. **Orbital**
   - Camera orbits around the center point
   - Bobs up and down as it circles
   - Classic "looking at" perspective
   - 5 unit orbit radius with vertical oscillation

3. **Drift**
   - Slow random walk with momentum
   - Camera wanders naturally through space
   - Soft boundaries keep it in view (6 unit limit)
   - Velocity dampening creates smooth motion
   - Most organic, unpredictable movement

4. **Figure-8**
   - Lissajous curve pattern (figure-8 shape)
   - Different frequencies on X and Y axes
   - Hypnotic, mathematical movement
   - 3.5 unit scale with depth oscillation

5. **Follow**
   - Camera tracks the closest object
   - Stays behind the object (+3 Z offset)
   - Smooth lerp following (2% per frame)
   - Creates a sense of "riding along" with objects

6. **Static**
   - Original fixed position (0, 0, 7)
   - Traditional kaleidoscope view
   - Available if you prefer the classic experience

### How Camera Modes Work

**Random on Load:**
- Each time you load or build a new scope, a random camera mode is selected
- Check the **status panel** (top-left) to see current mode

**Manual Control:**
- New **Camera dropdown** in controls panel
- Switch between modes anytime
- Mode is displayed in real-time status panel

**Automatic Cycling:**
- During idle major resets (every 30-120s), camera mode changes automatically
- Creates constantly evolving experience
- Console logs camera mode changes

---

## 🌀 INDEPENDENT KALEIDOSCOPE ROTATION

### New Effect: Kaleidoscope Spins On Its Own

**What Changed:**
- Added `uKaleidoSpin` uniform to shader
- Kaleidoscope mirror pattern now **rotates continuously**
- Rotation speed: 0.05 radians per second (very slow)
- Independent from user drag rotation
- Creates subtle evolution even when idle

**Why It's Cool:**
- The kaleidoscope pattern slowly turns while camera moves
- Decouples pattern rotation from camera/object movement
- Adds another layer of dynamic variation
- Especially effective with "Inside" and "Follow" camera modes

---

## 🎮 NEW UI CONTROLS

### Status Panel Updates
- Added **Camera** status indicator
- Shows current camera mode in real-time
- Updates automatically when mode changes

### Camera Mode Selector
- New dropdown in controls panel
- Select from 6 camera modes
- Changes take effect immediately
- Position: Between Mirrors slider and View Chamber toggle

---

## 🧪 WHAT TO TEST

### Bloom Testing
- [ ] Load page - bloom should be visible but not excessive
- [ ] No bright hot spot in center
- [ ] Glass objects should sparkle but not blind
- [ ] Audio reactivity - bloom should pulse gently, not overwhelm

### Camera Mode Testing
- [ ] **Inside Mode** - Camera should weave through objects, creating immersive depth
- [ ] **Orbital Mode** - Camera should circle smoothly around center
- [ ] **Drift Mode** - Camera should wander randomly but stay in bounds
- [ ] **Figure-8 Mode** - Camera should trace a figure-8 pattern
- [ ] **Follow Mode** - Camera should track nearest object
- [ ] **Static Mode** - Camera should stay fixed (original behavior)

### Camera Selector Testing
- [ ] Change mode via dropdown - should take effect immediately
- [ ] Status panel should update to show new mode
- [ ] Try all 6 modes to see different perspectives

### Kaleidoscope Rotation Testing
- [ ] Pattern should slowly rotate even when not dragging
- [ ] Rotation should be independent from camera movement
- [ ] Combines with camera movement for complex motion

### Idle Behavior Testing
- [ ] Wait 30-120 seconds idle
- [ ] Should trigger major reset with new camera mode
- [ ] Console should log the new camera mode
- [ ] Visual experience should shift dramatically

---

## 🎨 CREATIVE COMBINATIONS

Try these combinations for interesting effects:

1. **Inside + Follow**
   - Camera inside chamber tracking closest object
   - Creates a "chase" feeling through the kaleidoscope

2. **Orbital + Low Mirrors (4-6)**
   - Simple pattern with sweeping camera view
   - Classic kaleidoscope feel with movement

3. **Drift + High Mirrors (12-16)**
   - Complex pattern with wandering perspective
   - Most hypnotic combination

4. **Figure-8 + Algorave Audio**
   - Mathematical camera with high-energy music
   - Rhythmic and geometric

5. **Follow + Tumbling Audio**
   - Track objects through chaotic soundscape
   - Intimate object-focused experience

---

## 📝 TECHNICAL NOTES

### Files Modified
1. **ObjectChamber.js**
   - Lines 71-85: Camera system initialization
   - Lines 291-292: Camera update call
   - Lines 490-600: Camera movement implementation
   - Lines 594-608: Camera mode setter

2. **main.js**
   - Lines 29-37: Added uKaleidoSpin uniform
   - Lines 52-56: Reduced bloom parameters
   - Lines 406-408: Reduced audio-reactive bloom
   - Lines 89-109: Updated status display for camera
   - Lines 531-532: Independent kaleidoscope rotation
   - Lines 510-514: Camera mode cycling on idle reset
   - Lines 210-223: Camera selector handler

3. **kaleidoscopeShader.js**
   - Line 8: Added uKaleidoSpin uniform
   - Lines 44-45: Apply independent rotation

4. **index.html**
   - Lines 373-380: Added camera to status panel
   - Lines 420-429: Camera mode selector dropdown
   - Lines 333-348: Select control CSS

---

## 🎯 DESIGN PHILOSOPHY

**Bloom Fix:**
- Less is more - subtle glow highlights beauty without overwhelming
- Hot spot removed by reducing backlight and emissive values
- Maintains sparkle while staying elegant

**Camera Movement:**
- **Immersive perspective** - Being inside the chamber creates depth
- **Variety** - 6 modes ensure fresh experience
- **Automatic evolution** - Idle cycling prevents staleness
- **User control** - Manual selector for preferred mode

**Independent Rotation:**
- **Subtle complexity** - Pattern evolves independent of camera
- **Layered motion** - Multiple simultaneous movements create richness
- **Slow pace** - 0.05 rad/s is meditative, not dizzying

---

## 🚀 WHAT'S NEXT (If Desired)

Additional experimental ideas not yet implemented:

1. **Audio-Reactive Camera**
   - Camera movement speed tied to bass/energy
   - Zoom pulses with kick drum
   - Position shifts on crashes

2. **Collision Camera Shake**
   - Camera briefly shakes when objects collide
   - Intensity based on collision velocity
   - Creates tactile feedback

3. **Depth of Field**
   - Blur objects at different depths
   - Focus follows camera movement
   - Adds cinematic quality

4. **Multiple Kaleidoscope Layers**
   - Nested patterns at different segments/speeds
   - Complex Moiré interference patterns
   - Adjustable layer opacity

5. **Camera Presets**
   - Save/load favorite camera modes with specific parameters
   - Smooth transitions between presets
   - Preset sharing via URL

Let me know which direction you'd like to explore! 🎨✨

---

## 💡 KEYBOARD SHORTCUT IDEA

Could add:
- **V** key to cycle through camera modes
- **B** key to toggle bloom on/off
- **R** key to randomize camera mode

Shall I implement these?
