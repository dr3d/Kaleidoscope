
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
        this.pitchWarpLoop = null;
        this.schedulerLoop = null;

        // Scheduler
        this.nextSwitchId = null; // Track event ID

        // Timing tracking for monophonic instruments
        this.lastHihatTime = 0;

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
            "Enigmatic": ["C4", "Db4", "E4", "F#4", "Ab4", "Bb4", "B4", "C5"],
            "Byzantine": ["C4", "Db4", "E4", "F4", "G4", "Ab4", "B4", "C5"],
            "Hungarian Minor": ["C4", "D4", "Eb4", "F#4", "G4", "Ab4", "B4", "C5"],
            "Iwato": ["C4", "Db4", "F4", "Gb4", "Bb4", "C5", "Db5"],
            "Kumoi": ["C4", "D4", "Eb4", "G4", "A4", "C5", "D5"]
        };
        this.scaleKeys = Object.keys(this.scales);
    }

    async init() {
        if (this.isInitialized) return;

        console.log("Audio initializing...");
        await Tone.start();
        console.log("Audio Context Started");

        // --- Master Effects ---
        // --- Master Effects ---
        this.masterFilter = new Tone.Filter(2000, "lowpass").toDestination();

        // PitchShifter (Insert Effect)
        // windowSize 0.1 is standard, delayTime 0 minimizes latency
        this.pitchShifter = new Tone.PitchShift({
            pitch: 0,
            windowSize: 0.1,
            delayTime: 0,
            feedback: 0
        }).connect(this.masterFilter);

        // Limiter feeds into PitchShifter -> MasterFilter
        const limiter = new Tone.Limiter(-2).connect(this.pitchShifter);

        // Removed PitchShift (Was inaudible). Replaced with Global Synth Detune.

        this.reverb = new Tone.Reverb(6).connect(limiter);
        this.delay = new Tone.PingPongDelay("8n.", 0.25).connect(this.reverb);
        this.dist = new Tone.Distortion(0.0).connect(limiter);
        this.chorus = new Tone.Chorus(2.5, 3.5, 0.7).connect(this.reverb).start();

        // --- Analysis ---
        this.meter = new Tone.Meter({ smoothing: 0.8 });
        this.masterFilter.connect(this.meter);

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
        this.crash.volume.value = -6;

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
        this.hihat.volume.value = -8;

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
        this.bass.volume.value = -3;

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
        this.poly.volume.value = -8;

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
        this.aggroLead.volume.value = -3; // Boosted for EDM presence

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
        this.glass.volume.value = -2;

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
            // STRICTLY NO KICK IN TUMBLING/CHORAL
            if (this.beatMode === 'choral' || this.beatMode === 'tumbling') return;
            // Always play in Algorave/House
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
            // STRICTLY NO SNARE IN TUMBLING
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
                    this.crash.triggerAttackRelease("C2", "1m", time + 0.03, 0.8);
                }
            }
        }, "4n");

        // HiHat - More active
        this.hihatLoop = new Tone.Loop(time => {
            // STRICTLY NO HIHAT IN AMBIENT/CHORAL
            if (this.beatMode === 'ambient' || this.beatMode === 'choral') return;

            if (this.beatMode === 'tumbling') {
                return; // Handled by glassLoop now
            }

            // Ensure hihat timing is always strictly increasing
            const safeTime = Math.max(time, this.lastHihatTime + 0.01);
            this.lastHihatTime = safeTime;

            if (this.beatMode === 'algorave') {
                this.hihat.triggerAttackRelease(200, "32n", safeTime, Math.random() * 0.5 + 0.5);
            } else if (Math.random() < this.intensity) {
                this.hihat.triggerAttackRelease(200, "32n", safeTime);
            }
        }, "16n");

        // Bass - Melodic Variation (FIXED: Pattern-based instead of random probability)
        this.bassPatternIndex = 0;
        this.bassLoop = new Tone.Loop(time => {
            // STRICTLY NO BASS IN TUMBLING
            if (this.beatMode === 'choral' || this.beatMode === 'tumbling') return;

            const scale = this.scales[this.currentScaleName];
            if (!scale) return;

            // Pattern-based bass (60-80% density instead of 20%)
            const bassPattern = [1, 0, 1, 1, 0, 1, 1, 0]; // 60% density pattern
            const algoPattern = [1, 1, 0, 1, 1, 1, 0, 1]; // 75% density for algorave

            const pattern = (this.beatMode === 'algorave') ? algoPattern : bassPattern;
            const shouldPlay = pattern[this.bassPatternIndex % pattern.length];
            this.bassPatternIndex++;

            if (!shouldPlay) return;

            // Pick a bass note from lower register of current scale
            const noteIndex = Math.floor(Math.random() * 3); // Use first 3 notes of scale
            const rootNoteStr = scale[noteIndex];
            const note = rootNoteStr.slice(0, -1) + (Math.random() > 0.7 ? "1" : "2");

            try {
                this.bass.triggerAttackRelease(note, "16n", time);
            } catch (e) { }
        }, "8n");

        // Chords / Melody (Lead)
        this.chordLoop = new Tone.Loop(time => {
            // Tumbling gets NO chords, just texture
            if (this.beatMode === 'choral' || this.beatMode === 'tumbling') return;

            const scale = this.scales[this.currentScaleName];
            if (!scale) return;

            if (this.beatMode === 'algorave') {
                // Aggressive single notes - Arpeggio style
                if (Math.random() < 0.8) {
                    const note = scale[Math.floor(Math.random() * scale.length)];
                    try {
                        this.aggroLead.triggerAttackRelease(note, "16n", time);
                    } catch (e) { }
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
            // ENABLED for Choral ONLY (Disabled in Tumbling to differentiate)
            if (this.beatMode === 'algorave' || this.beatMode === 'tumbling') return;
            if (this.beatMode !== 'choral' && Math.random() > 0.3) return;

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
            // Special TUMBLING Logic: Chaotic Bursts
            if (this.beatMode === 'tumbling') {
                if (Math.random() < 0.6) { // High chance to play something
                    const scale = this.scales[this.currentScaleName];
                    // Play a BURST of 4-8 notes (Denser)
                    const count = 4 + Math.floor(Math.random() * 4);

                    // Collect events first to sort them by time
                    // This prevents "time must be greater than last scheduled time" on monophonic HiHat
                    const events = [];
                    for (let i = 0; i < count; i++) {
                        events.push({
                            note: scale[Math.floor(Math.random() * scale.length)],
                            offset: Math.random() * 0.25,
                            vel: 0.5 + Math.random() * 0.5
                        });
                    }

                    // Sort by offset time (CRITICAL FIX for Monophonic Synth)
                    events.sort((a, b) => a.offset - b.offset);

                    events.forEach(ev => {
                        // Ensure scheduling time is always in the future
                        const baseScheduleTime = Math.max(time + ev.offset, Tone.now() + 0.01);

                        // 1. Tonal Body (Glass Synth - Poly, can overlap)
                        // Randomly shift up an octave for sparkles
                        const playNote = (Math.random() > 0.5) ? Tone.Frequency(ev.note).transpose(12) : ev.note;
                        this.glass.triggerAttackRelease(playNote, "16n", baseScheduleTime, ev.vel);

                        // 2. Metallic Transient (HiHat - Monophonic, needs strictly increasing times)
                        if (this.hihat) {
                            // Ensure each hihat trigger is strictly after the previous one AND after current time
                            const hihatTime = Math.max(baseScheduleTime, this.lastHihatTime + 0.01);
                            this.hihat.triggerAttackRelease(2000 + Math.random() * 3000, "64n", hihatTime, ev.vel * 0.7);
                            this.lastHihatTime = hihatTime;
                        }
                    });
                }
                return;
            }

            // Standard Logic
            if (Math.random() < 0.4) {
                const scale = this.scales[this.currentScaleName];
                const note = scale[Math.floor(Math.random() * scale.length)];
                this.glass.triggerAttackRelease(note, "8n", time);
            }
        }, "8n");

        // Wind Chimes
        this.windChimeLoop = new Tone.Loop(time => {
            const quietModes = ['ambient', 'choral', 'tumbling'];
            if (!quietModes.includes(this.beatMode)) return;

            if (Math.random() < 0.25) {
                const scale = this.scales[this.currentScaleName];
                const note = scale[Math.floor(Math.random() * scale.length)];
                this.glass.triggerAttackRelease(note, "32n", time, 0.3);
            }
        }, "4m");

        this.isIdle = false; // New state

        // Pitch Warp Loop - GLOBAL DETUNE (Only in IDLE)
        this.pitchWarpLoop = new Tone.Loop(time => {
            if (!this.isPlaying) return;

            // STRICTLY ONLY WHEN IDLE
            if (!this.isIdle) return;

            // Higher chance during idle to make it noticeable
            if (Math.random() < 0.7) {
                const attackBars = 0.5 + Math.random() * 3.5;
                const holdBars = 1 + Math.random() * 2;
                const dir = Math.random() > 0.5 ? 1 : -1;
                const semitones = (Math.random() * 6 + 6) * dir;
                this.triggerGlobalPitchWarp(semitones, attackBars, holdBars);
            }
        }, "4m");

        // --- Scheduler (Countdown Loop) ---
        this.remainingBars = 4; // Initial wait

        this.schedulerLoop = new Tone.Loop(time => {
            if (!this.isPlaying) return;

            console.log(`Audio: Next mode switch in ${this.remainingBars} measures`);
            this.remainingBars--;

            if (this.remainingBars <= 0) {
                this.performModeSwitch(time);
                // Pick next duration
                const bars = [4, 8, 12];
                this.remainingBars = bars[Math.floor(Math.random() * bars.length)];
                console.log(`(Timer Reset: Waiting ${this.remainingBars} bars)`);
            }
        }, "1m");

        // Schedule start
        this.kickLoop.start(0);
        this.snareLoop.start(0);
        this.hihatLoop.start(0);
        this.bassLoop.start(0);
        this.chordLoop.start(0);
        this.glassLoop.start(0);
        this.choirLoop.start(0);
        this.windChimeLoop.start(0);
        this.pitchWarpLoop.start(1);
        this.schedulerLoop.start(0);

        this.isInitialized = true;
    }

    setIdle(state) {
        if (this.isIdle !== state) {
            this.isIdle = state;
            console.log(`Audio: Idle State Changed to ${state}`);

            // Immediate trigger on entering idle?
            if (state && this.isPlaying) {
                this.triggerGlobalPitchWarp(-12, 1, 2); // Drop octave immediately
            }
        }
    }

    start() {
        if (!this.isInitialized) return;
        if (this.isPlaying) return;

        // Randomize settings on start
        this.randomizeSession();

        if (Tone.Transport.state !== 'started') {
            Tone.Transport.start();
        }

        // Initialize hihat timing to current time
        this.lastHihatTime = Tone.now();

        this.isPlaying = true;
    }

    randomizeSession() {
        // Pick new Scale/Mode
        const keys = this.scaleKeys;
        this.currentScaleName = keys[Math.floor(Math.random() * keys.length)];
        this.rootNote = Math.random() > 0.5 ? "C" : "A";

        // Include all modes
        const modes = ['ambient', 'choral', 'house', 'exotic_groove', 'tumbling', 'algorave'];
        this.beatMode = modes[Math.floor(Math.random() * modes.length)];

        // Randomize intensity slightly
        this.intensity = 0.3 + Math.random() * 0.4;

        console.log(`Audio Started with Mode: ${this.beatMode}, Scale: ${this.currentScaleName}`);

        // Apply settings immediately
        if (this.beatMode === 'algorave') {
            this.dist.wet.value = 0.8;
            Tone.Transport.bpm.value = 135 + Math.random() * 10;
            if (this.reverb) this.reverb.decay = 2;
            if (this.delay) this.delay.delayTime.value = "16n";
        } else if (this.beatMode === 'house') {
            this.dist.wet.value = 0.3;
            Tone.Transport.bpm.value = 122 + Math.random() * 6;
            if (this.reverb) this.reverb.decay = 4;
            if (this.delay) this.delay.delayTime.value = "8n";
        } else if (this.beatMode === 'choral' || this.beatMode === 'tumbling') {
            this.dist.wet.value = 0.0;
            Tone.Transport.bpm.value = 80;
            if (this.reverb) this.reverb.decay = 12;
            if (this.delay) this.delay.delayTime.value = "4n";
        } else if (this.beatMode === 'exotic_groove') {
            this.dist.wet.value = 0.1;
            Tone.Transport.bpm.value = 95 + Math.random() * 10;
            if (this.reverb) this.reverb.decay = 5;
            if (this.delay) this.delay.delayTime.value = "8n.";
        } else { // ambient
            this.dist.wet.value = 0.0;
            Tone.Transport.bpm.value = 110;
            if (this.reverb) this.reverb.decay = 8;
            if (this.delay) this.delay.delayTime.value = "4n";
        }

        // Signal to main.js that mode changed (for camera randomization)
        if (window.onAudioModeChange) {
            window.onAudioModeChange(this.beatMode);
        }
    }

    stop() {
        this.isPlaying = false;
        Tone.Transport.stop();

        if (this.poly) this.poly.releaseAll();
        if (this.glass) this.glass.releaseAll();
        if (this.choir) this.choir.releaseAll();
    }

    performModeSwitch(time) {
        // 1. Cycle Marker Sound
        if (this.crash && this.glass) {
            this.crash.triggerAttackRelease("C2", "2n", time, 0.5);
            const scale = this.scales["Major Pentatonic"];
            if (scale && scale.length >= 5) {
                this.glass.triggerAttackRelease([scale[0], scale[2], scale[4]], "8n", time, 0.4);
            }
        }

        // 2. Logic Update
        let newMode = this.beatMode;
        let attempts = 0;

        // Try up to 5 times to pick a DIFFERENT mode
        while (newMode === this.beatMode && attempts < 5) {
            attempts++;
            const r = Math.random();
            if (this.intensity > 0.6) {
                // Boosted Algorave Chance
                if (r < 0.6) newMode = 'algorave'; // Was 0.4
                else if (r < 0.8) newMode = 'house';
                else newMode = 'exotic_groove';
            } else {
                if (r < 0.3) newMode = 'choral';
                else if (r < 0.5) newMode = 'tumbling';
                else if (r < 0.7) newMode = 'ambient';
                else if (r < 0.8) newMode = 'algorave'; // Surprise Algo!
                else newMode = 'exotic_groove';
            }
        }

        // Failsafe
        if (newMode === this.beatMode) {
            const allModes = ['ambient', 'choral', 'tumbling', 'algorave', 'house', 'exotic_groove'];
            const others = allModes.filter(m => m !== this.beatMode);
            newMode = others[Math.floor(Math.random() * others.length)];
        }

        // Exotic Scale Rotation
        if (Math.random() > 0.4) {
            const keys = this.scaleKeys;
            this.currentScaleName = keys[Math.floor(Math.random() * keys.length)];
        }

        this.beatMode = newMode;
        console.log(`Audio Mode Switch: ${newMode} | Scale: ${this.currentScaleName} | Int: ${this.intensity.toFixed(2)}`);

        // Signal to main.js that mode changed (for camera randomization)
        if (window.onAudioModeChange) {
            window.onAudioModeChange(newMode);
        }

        // Param Updates (ENHANCED: Mode-specific reverb/delay/distortion)
        if (this.beatMode === 'algorave') {
            this.dist.wet.rampTo(0.8, 1); // Harder distortion for EDM
            Tone.Transport.bpm.rampTo(135 + Math.random() * 10, 2);
            this.reverb.decay = 2; // Short reverb for clarity
            this.delay.delayTime.value = "16n"; // Fast delay
        } else if (this.beatMode === 'house') {
            this.dist.wet.rampTo(0.3, 1); // Mild distortion
            Tone.Transport.bpm.rampTo(122 + Math.random() * 6, 3); // House tempo (122-128)
            this.reverb.decay = 4; // Medium reverb
            this.delay.delayTime.value = "8n"; // Classic house delay
        } else if (this.beatMode === 'choral' || this.beatMode === 'tumbling') {
            this.dist.wet.rampTo(0.0, 1);
            Tone.Transport.bpm.rampTo(80, 5);
            this.reverb.decay = 12; // Long, spacious reverb
            this.delay.delayTime.value = "4n"; // Slow delay
        } else if (this.beatMode === 'exotic_groove') {
            this.dist.wet.rampTo(0.1, 1); // Clean
            Tone.Transport.bpm.rampTo(95 + Math.random() * 10, 4); // Slower groove (95-105)
            this.reverb.decay = 5; // Medium-long reverb
            this.delay.delayTime.value = "8n.";
        } else { // ambient
            this.dist.wet.rampTo(0.0, 1);
            Tone.Transport.bpm.rampTo(110, 4);
            this.reverb.decay = 8; // Spacious ambient reverb
            this.delay.delayTime.value = "4n";
        }
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

        // FIXED: Removed 80% probability gate - let main.js handle filtering via velocity threshold
        // Only skip if velocity is truly negligible
        if (velocity < 0.003) return;

        if (this.glass) {
            const scale = this.scales[this.currentScaleName];
            if (!scale) return;
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

        // Reset the countdown logic
        this.remainingBars = 4; // Reset to short interval initially

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

                // Force param update immediately (ENHANCED: Apply same adaptive settings)
                if (this.beatMode === 'algorave') {
                    this.dist.wet.rampTo(0.8, 1);
                    Tone.Transport.bpm.rampTo(135 + Math.random() * 10, 2);
                    this.reverb.decay = 2;
                    this.delay.delayTime.value = "16n";
                } else if (this.beatMode === 'house') {
                    this.dist.wet.rampTo(0.3, 1);
                    Tone.Transport.bpm.rampTo(122 + Math.random() * 6, 3);
                    this.reverb.decay = 4;
                    this.delay.delayTime.value = "8n";
                } else if (this.beatMode === 'choral' || this.beatMode === 'tumbling') {
                    this.dist.wet.rampTo(0.0, 1);
                    Tone.Transport.bpm.rampTo(80, 5);
                    this.reverb.decay = 12;
                    this.delay.delayTime.value = "4n";
                } else if (this.beatMode === 'exotic_groove') {
                    this.dist.wet.rampTo(0.1, 1);
                    Tone.Transport.bpm.rampTo(95 + Math.random() * 10, 4);
                    this.reverb.decay = 5;
                    this.delay.delayTime.value = "8n.";
                } else { // ambient
                    this.dist.wet.rampTo(0.0, 1);
                    Tone.Transport.bpm.rampTo(110, 4);
                    this.reverb.decay = 8;
                    this.delay.delayTime.value = "4n";
                }

                console.log(`Audio Reset Complete. New Mode: ${this.beatMode}, Scale: ${this.currentScaleName}`);

                // 3. Fade In
                // We didn't stop, so just ramp volume back up
                Tone.Destination.volume.rampTo(0, 4);

                // IMPORTANT: Restart logic
                if (this.nextSwitchId) Tone.Transport.clear(this.nextSwitchId);
                // Also reset scheduler loop state if needed
                this.remainingBars = 4;

                // Signal to main.js that mode changed (for camera randomization AND speed slider)
                if (window.onAudioModeChange) {
                    window.onAudioModeChange(this.beatMode);
                }

                resolve();
            }, 2100);
        });
    }

    triggerGlobalPitchWarp(semitones, attackBars, holdBars) {
        if (!this.isInitialized || !this.isPlaying) return;

        const bpm = Tone.Transport.bpm.value; // Approximate current BPM
        const spm = (60 / Math.max(1, bpm)) * 4;

        const attackDur = attackBars * spm;
        const holdDur = holdBars * spm;
        const totalDur = attackDur + holdDur;

        const amountCents = semitones * 100;
        const now = Tone.now();

        console.log(`Audio: Pitch Warp! ${semitones.toFixed(1)}st (${amountCents.toFixed(0)} cents) over ${attackBars.toFixed(1)} bars`);



        if (this.pitchShifter) {
            try {
                // Use Tone.js 'rampTo' which handles Signals/Params safely
                // rampTo(value, rampTime, startTime)

                // 1. Reset/Start
                // Note: rampTo cancels previous scheduled values automatically in newer Tone versions, 
                // but we can just schedule the moves.

                const p = this.pitchShifter.pitch;

                if (p && typeof p.rampTo === 'function') {
                    p.rampTo(semitones, attackDur, now);
                    p.rampTo(0, holdDur, now + attackDur);
                } else {
                    // Fallback
                    this.pitchShifter.pitch = semitones;
                    // setTimeout to reset? risky if bpm changes, but better than crash
                }

            } catch (e) {
                console.warn("PitchWarp automation failed:", e);
            }
        }

        /* 
        // LEGACY DETUNE LOGIC (Proven Inaudible)
        const instruments = [
            this.kick, this.bass, this.poly,
            this.aggroLead, this.glass, this.choir,
            this.crash, this.hihat
        ];

        instruments.forEach(inst => { ... });
        */
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
