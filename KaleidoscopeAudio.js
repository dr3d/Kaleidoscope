
const Tone = window.Tone;

export class KaleidoscopeAudio {
    constructor() {
        this.isPlaying = false;
        this.isInitialized = false;

        // Instruments
        this.kick = null;
        this.hihat = null;
        this.snare = null;
        this.crash = null;
        this.bass = null;
        this.poly = null;
        this.aggroLead = null;
        this.glass = null;
        this.choir = null;

        // Effects
        this.masterFilter = null;
        this.delay = null;
        this.reverb = null;
        this.dist = null;
        this.chorus = null;

        // Loops
        this.kickLoop = null;
        this.hihatLoop = null;
        this.snareLoop = null;
        this.bassLoop = null;
        this.chordLoop = null;
        this.glassLoop = null;
        this.windChimeLoop = null;
        this.choirLoop = null;

        // Scheduler
        this.nextSwitchId = null; // Track event ID

        // Journey State
        this.intensity = 0.5; // 0 to 1
        this.beatMode = 'ambient';
        this.rootNote = "C";
        this.currentScaleName = "Major Pentatonic";

        // Extended "Exotic" Scales
        this.scales = {
            "Major Pentatonic": ["C4", "D4", "E4", "G4", "A4", "C5", "E5"],
            "Minor Pentatonic": ["A3", "C4", "D4", "E4", "G4", "A4", "C5"],
            "Hirajoshi": ["C4", "Db4", "F4", "G4", "Ab4", "C5", "Db5"],
            "Phrygian Dominant": ["C3", "Db3", "E3", "F3", "G3", "Ab3", "Bb3", "C4"],
            "Lydian": ["C4", "D4", "E4", "F#4", "G4", "A4", "B4", "C5"],
            "Whole Tone": ["C4", "D4", "E4", "F#4", "Ab4", "Bb4", "C5"],
            "Enigmatic": ["C4", "Db4", "E4", "F#4", "Ab4", "Bb4", "B4", "C5"]
        };
        this.scaleKeys = Object.keys(this.scales);
    }

    async init() {
        if (this.isInitialized) return;

        console.log("Audio initializing...");
        await Tone.start();
        console.log("Audio Context Started");

        // --- Master Effects ---
        this.masterFilter = new Tone.Filter(2000, "lowpass").toDestination();
        const limiter = new Tone.Limiter(-2).connect(this.masterFilter);
        this.reverb = new Tone.Reverb(6).connect(limiter);
        this.delay = new Tone.PingPongDelay("8n.", 0.25).connect(this.reverb);
        this.dist = new Tone.Distortion(0.0).connect(limiter);
        this.chorus = new Tone.Chorus(2.5, 3.5, 0.7).connect(this.reverb).start();

        // --- Analysis ---
        this.meter = new Tone.Meter({ smoothing: 0.8 });
        this.masterFilter.connect(this.meter); // Connect master output to meter

        // --- Instruments ---

        // 1. Kick
        this.kick = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 10,
            oscillator: { type: "sine" },
            envelope: {
                attack: 0.001,
                decay: 0.4,
                sustain: 0.01,
                release: 1.4,
            }
        }).connect(limiter);
        // Boost Kick
        this.kick.volume.value = 0;

        // 2. Snare
        this.snare = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: {
                attack: 0.001,
                decay: 0.2,
                sustain: 0
            }
        }).connect(this.reverb);

        // 3. Crash
        this.crash = new Tone.MetalSynth({
            frequency: 200,
            envelope: {
                attack: 0.001,
                decay: 1.4,
                release: 0.2
            },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).connect(this.reverb);
        this.crash.volume.value = -6; // Boosted from -10

        // 4. HiHat
        this.hihat = new Tone.MetalSynth({
            frequency: 250,
            envelope: {
                attack: 0.001,
                decay: 0.05,
                release: 0.01
            },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }).connect(this.reverb);
        this.hihat.volume.value = -8; // Boosted from -12

        // 5. Bass
        this.bass = new Tone.MonoSynth({
            oscillator: { type: "fmsawtooth", modulationType: "square", modulationIndex: 3 },
            envelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.4,
                release: 0.2
            },
            filterEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.2,
                release: 0.2,
                baseFrequency: 80,
                octaves: 2.5
            }
        }).connect(this.dist);
        this.bass.volume.value = -3; // Boosted from -6

        // 6. Lead (Soft)
        this.poly = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "fatsawtooth",
                count: 3,
                spread: 20
            },
            envelope: {
                attack: 0.2,
                decay: 0.1,
                sustain: 0.3,
                release: 1.5
            }
        }).connect(this.delay);
        this.poly.volume.value = -8; // Slight boost

        // 7. AggroLead (New) - For Algorave
        this.aggroLead = new Tone.MonoSynth({
            oscillator: { type: "sawtooth" },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.5,
                release: 0.1
            },
            filterEnvelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0.1,
                release: 0.5,
                baseFrequency: 500,
                octaves: 4
            }
        }).connect(this.dist);
        this.aggroLead.volume.value = -6;

        // 8. Glass
        this.glass = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: "fmsine", modulationType: "sine", modulationIndex: 20, harmonicity: 3 },
            envelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0.1,
                release: 2
            }
        }).connect(this.delay);
        this.glass.volume.value = -2; // Boosted for collisions

        // 9. Choir
        this.choir = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "amtriangle",
            },
            envelope: {
                attack: 2.0,
                decay: 3.0,
                sustain: 0.8,
                release: 4.0
            }
        }).connect(this.chorus);
        this.choir.volume.value = -8;

        // --- Sequencing ---
        Tone.Transport.bpm.value = 110;

        // Kick Logic
        this.kickLoop = new Tone.Loop(time => {
            if (this.beatMode === 'choral' || this.beatMode === 'tumbling') return;
            // Always play in Algorave/House, random in others if high intensity
            if (this.intensity < 0.1 && this.beatMode !== 'algorave') return;

            if (this.beatMode === 'house' || this.beatMode === 'algorave') {
                this.kick.triggerAttackRelease("C1", "8n", time);
            } else if (this.beatMode === 'breakbeat' || this.beatMode === 'exotic_groove') {
                // Syncopated kick
                const pos16 = parseInt(Tone.Transport.position.toString().split(':')[2]);
                if (pos16 === 0 || pos16 === 2.5) this.kick.triggerAttackRelease("C1", "8n", time);
                else if (Math.random() < 0.3) this.kick.triggerAttackRelease("C1", "8n", time);
            }
        }, "4n");

        // Snare Logic
        this.snareLoop = new Tone.Loop(time => {
            if (this.beatMode === 'choral' || this.beatMode === 'tumbling') return;

            const posBeat = parseInt(Tone.Transport.position.toString().split(':')[1]);

            if (this.beatMode === 'house' || this.beatMode === 'algorave') {
                // Harder snare pattern
                if (posBeat === 1 || posBeat === 3) this.snare.triggerAttackRelease("8n", time);
            } else if (this.beatMode === 'exotic_groove') {
                if (posBeat === 2) this.snare.triggerAttackRelease("8n", time);
            }

            // Random Crash in Algo mode (More Frequent)
            if (this.beatMode === 'algorave' && posBeat === 0) {
                if (Math.random() < 0.5) {
                    this.crash.triggerAttackRelease("C2", "1m", time, 0.8);
                }
            }
        }, "4n");


        // HiHat - More active
        this.hihatLoop = new Tone.Loop(time => {
            if (this.beatMode === 'ambient' || this.beatMode === 'choral' || this.beatMode === 'tumbling') return;

            if (this.beatMode === 'algorave') {
                // 16th notes constant in algorave
                this.hihat.triggerAttackRelease("32n", time, Math.random() * 0.5 + 0.5);
            } else if (Math.random() < this.intensity) {
                this.hihat.triggerAttackRelease("32n", time);
            }
        }, "16n");


        // Bass - Melodic Variation
        this.bassLoop = new Tone.Loop(time => {
            if (this.beatMode === 'choral' || this.beatMode === 'tumbling') return;

            const scale = this.scales[this.currentScaleName];
            if (!scale) return;
            // Play more often in Algo
            if (Math.random() > 0.8 && this.beatMode !== 'algorave') return;

            // Pick a bass note from lower register of current scale
            // Map scale[0] (e.g. C4) down to C2
            const noteIndex = Math.floor(Math.random() * 3); // Use first 3 notes of scale
            const rootNoteStr = scale[noteIndex];
            const note = rootNoteStr.slice(0, -1) + (Math.random() > 0.7 ? "1" : "2");

            this.bass.triggerAttackRelease(note, "16n", time);
        }, "8n");


        // Chords / Melody (Lead)
        this.chordLoop = new Tone.Loop(time => {
            if (this.beatMode === 'choral' || this.beatMode === 'tumbling') return;

            const scale = this.scales[this.currentScaleName];
            if (!scale) return;

            if (this.beatMode === 'algorave') {
                // Aggressive single notes - Arpeggio style
                if (Math.random() < 0.8) {
                    const note = scale[Math.floor(Math.random() * scale.length)];
                    this.aggroLead.triggerAttackRelease(note, "16n", time);
                }
            } else {
                // Soft poly chords
                if (scale.length > 2) {
                    const rootIdx = Math.floor(Math.random() * (scale.length - 2));
                    const chord = [scale[rootIdx], scale[rootIdx + 2]];
                    this.poly.triggerAttackRelease(chord, "1m", time);
                }
            }
        }, "1m");


        // Choir Loop
        this.choirLoop = new Tone.Loop(time => {
            if (this.beatMode === 'tumbling') return;
            if (this.beatMode !== 'choral' && Math.random() > 0.3) return;
            if (this.beatMode === 'algorave') return; // No choir in hard mode

            const scale = this.scales[this.currentScaleName];
            if (!scale) return;

            const notes = [];
            const rootIdx = Math.floor(Math.random() * (scale.length - 3));

            notes.push(scale[rootIdx]);
            notes.push(scale[rootIdx + 2]);
            if (Math.random() > 0.5) notes.push(scale[rootIdx + 4]);

            const duration = (this.beatMode === 'choral') ? "2m" : "1m";
            this.choir.triggerAttackRelease(notes, duration, time);
        }, "2m");


        // Glass: Collision-Like Melody
        this.glassLoop = new Tone.Loop(time => {
            if (this.beatMode === 'tumbling') return;
            if (Math.random() < 0.4) {
                const scale = this.scales[this.currentScaleName];
                const note = scale[Math.floor(Math.random() * scale.length)];
                this.glass.triggerAttackRelease(note, "8n", time);
            }
        }, "8n");

        // Wind Chimes (New): Background Texture
        this.windChimeLoop = new Tone.Loop(time => {
            // Constant tinkling in quiet modes
            const quietModes = ['ambient', 'choral', 'tumbling'];
            if (!quietModes.includes(this.beatMode)) return;

            if (Math.random() < 0.25) {
                const scale = this.scales[this.currentScaleName];
                const note = scale[Math.floor(Math.random() * scale.length)];
                this.glass.triggerAttackRelease(note, "32n", time, 0.3); // Low velocity
            }
        }, "16n");


        // --- Scheduler (Variable Timing) ---
        // Instead of a Loop, we schedule recursively
        this.scheduleNextSwitch = () => {
            if (!this.isPlaying) return;

            // Pick next interval: 4, 8, 12, or 16 bars
            const bars = [4, 8, 12, 16];
            const nextBars = bars[Math.floor(Math.random() * bars.length)];
            const timeString = `+${nextBars}m`;

            console.log(`Next switch in ${nextBars} bars`);

            // Cancel any previous pending switch just in case
            if (this.nextSwitchId !== null) {
                Tone.Transport.clear(this.nextSwitchId);
            }

            this.nextSwitchId = Tone.Transport.scheduleOnce((time) => {
                this.performModeSwitch(time);
                this.scheduleNextSwitch(); // Recurse
            }, timeString);
        };


        // Schedule start
        this.kickLoop.start(0);
        this.snareLoop.start(0);
        this.hihatLoop.start(0);
        this.bassLoop.start(0);
        this.chordLoop.start(0);
        this.glassLoop.start(0);
        this.choirLoop.start(0);
        this.windChimeLoop.start(0);

        this.isInitialized = true;
    }

    performModeSwitch(time) {
        // 1. Cycle Marker Sound
        if (this.crash && this.glass) {
            this.crash.triggerAttackRelease("C2", "2n", time, 0.5); // Accented crash

            const scale = this.scales["Major Pentatonic"];
            if (scale && scale.length >= 5) { // Safety Check
                this.glass.triggerAttackRelease([scale[0], scale[2], scale[4]], "8n", time, 0.4);
            }
        }

        // 2. Logic Update
        const r = Math.random();
        let newMode = 'ambient';

        if (this.intensity > 0.6) {
            if (r < 0.4) newMode = 'algorave';
            else if (r < 0.7) newMode = 'house';
            else newMode = 'exotic_groove';
        } else {
            if (r < 0.3) newMode = 'choral';
            else if (r < 0.5) newMode = 'tumbling';
            else if (r < 0.8) newMode = 'ambient';
            else newMode = 'exotic_groove';
        }

        // Exotic Scale Rotation
        if (Math.random() > 0.4) {
            const keys = this.scaleKeys;
            this.currentScaleName = keys[Math.floor(Math.random() * keys.length)];
        }

        this.beatMode = newMode;
        console.log(`Audio Mode Switch: ${newMode} | Scale: ${this.currentScaleName} | Int: ${this.intensity.toFixed(2)}`);

        // Param Updates
        if (this.beatMode === 'algorave') {
            this.dist.wet.rampTo(0.6, 1);
            Tone.Transport.bpm.rampTo(135 + Math.random() * 10, 2);
        } else if (this.beatMode === 'choral' || this.beatMode === 'tumbling') {
            this.dist.wet.rampTo(0.0, 1);
            Tone.Transport.bpm.rampTo(80, 5);
        } else {
            this.dist.wet.rampTo(0.0, 1);
            Tone.Transport.bpm.rampTo(110, 4);
        }
    }

    start() {
        if (!this.isInitialized) return;
        if (this.isPlaying) return;

        if (Tone.Transport.state !== 'started') {
            Tone.Transport.start();
        }
        this.isPlaying = true;

        // Kick off the variable scheduler
        this.scheduleNextSwitch();
    }

    stop() {
        this.isPlaying = false;
        Tone.Transport.stop();
        // Clear the specific scheduled event
        if (this.nextSwitchId !== null) {
            Tone.Transport.clear(this.nextSwitchId);
            this.nextSwitchId = null;
        }

        if (this.poly) this.poly.releaseAll();
        if (this.glass) this.glass.releaseAll();
        if (this.choir) this.choir.releaseAll();
    }

    updateParams(speedMult, currentTheme) {
        if (!this.isInitialized || !this.isPlaying) return;
        const targetIntensity = Math.min(1.0, speedMult * 0.25);
        this.intensity += (targetIntensity - this.intensity) * 0.05;
        const cutoff = 400 + (Math.pow(this.intensity, 3) * 15000);
        this.masterFilter.frequency.rampTo(cutoff, 0.1);
        const feedback = 0.5 - (this.intensity * 0.3);
        this.delay.feedback.value = Math.max(0.1, feedback);
    }

    triggerInteractionSound() {
        if (!this.isInitialized) return;
        if (this.glass) {
            const scale = this.scales[this.currentScaleName];
            const n1 = scale[Math.floor(Math.random() * scale.length)];
            const n2 = scale[Math.floor(Math.random() * scale.length)];
            this.glass.triggerAttackRelease([n1, n2], "16n");
        }
    }

    triggerCollisionSound(velocity) {
        if (!this.isInitialized || !this.isPlaying) return;
        if (Math.random() > 0.8) return;

        if (this.glass) {
            const scale = this.scales[this.currentScaleName];
            if (!scale) return;
            // Removed velocity check, rely on main.js calling this with valid velocity
            const noteIndex = Math.floor(Math.random() * scale.length);
            const note = scale[noteIndex];
            // Boost velocity slightly for audibility
            const vel = Math.min(1.0, Math.max(0.5, velocity * 100)); // Boost multiplier
            const dur = Math.random() > 0.5 ? "32n" : "16n";
            this.glass.triggerAttackRelease(note, dur, undefined, vel);
        }
    }

    async performTextureReset() {
        if (!this.isInitialized || !this.isPlaying) return;
        console.log("Audio: Performing Texture Reset (Fade & Params)");

        // 1. Fade Out
        Tone.Destination.volume.rampTo(-60, 2);

        return new Promise(resolve => {
            setTimeout(() => {
                // If user stopped it manually, abort
                if (!this.isPlaying) {
                    resolve();
                    return;
                }

                // 2. Randomize State WITHOUT stopping transport
                // This keeps the timeline robust and avoids TickSource errors

                // Pick new Scale/Mode
                const keys = this.scaleKeys;
                this.currentScaleName = keys[Math.floor(Math.random() * keys.length)];
                this.rootNote = Math.random() > 0.5 ? "C" : "A";

                const modes = ['ambient', 'choral', 'house', 'exotic_groove', 'tumbling'];
                this.beatMode = modes[Math.floor(Math.random() * modes.length)];

                this.intensity = 0.3 + Math.random() * 0.4;

                // Force param update immediately
                if (this.beatMode === 'algorave') {
                    this.dist.wet.rampTo(0.6, 1);
                    Tone.Transport.bpm.rampTo(135 + Math.random() * 10, 2);
                } else if (this.beatMode === 'choral' || this.beatMode === 'tumbling') {
                    this.dist.wet.rampTo(0.0, 1);
                    Tone.Transport.bpm.rampTo(80, 5);
                } else {
                    this.dist.wet.rampTo(0.0, 1);
                    Tone.Transport.bpm.rampTo(110, 4);
                }

                console.log(`Audio Reset Complete. New Mode: ${this.beatMode}, Scale: ${this.currentScaleName}`);

                // 3. Fade In
                // We didn't stop, so just ramp volume back up
                Tone.Destination.volume.rampTo(0, 4);

                resolve();
            }, 2100);
        });
    }

    getEnergy() {
        if (!this.isInitialized || !this.meter) return 0;
        // Tone.Meter returns decibels (-Infinity to 0). 
        // We want a normalized 0-1 value for visualization.
        const db = this.meter.getValue();
        // db is usually -60 to 0. 
        // Normalize: -60 -> 0, 0 -> 1
        let energy = (db + 60) / 60;
        energy = Math.max(0, Math.min(1, energy)); // Clamp
        return energy;
    }
}
