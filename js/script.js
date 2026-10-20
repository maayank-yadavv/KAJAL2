        // ==========================================
        // ROBUST DOM READY HELPER
        // ==========================================
        function onDOMReady(fn) {
            if (document.readyState === 'interactive' || document.readyState === 'complete') {
                setTimeout(fn, 0);
            } else {
                document.addEventListener('DOMContentLoaded', fn);
            }
        }

        // ==========================================
        // AMBIENT SAKURA & LIQUID STARDUST CANVAS (Crash-Proof)
        // ==========================================
        let canvas = null;
        let ctx = null;
        let particles = [];
        let isPageVisible = true;
        let isAmbientPaused = false;

        const STAR_ANGLES = [];
        for (let i = 0; i < 4; i++) {
            const a1 = (i * 90) * Math.PI / 180;
            const a2 = (i * 90 + 45) * Math.PI / 180;
            STAR_ANGLES.push({
                cos1: Math.cos(a1), sin1: Math.sin(a1),
                cos2: Math.cos(a2), sin2: Math.sin(a2)
            });
        }

        function getAmbientCtx() {
            if (!canvas) {
                canvas = document.getElementById('ambientCanvas');
            }
            if (canvas && !ctx) {
                try { ctx = canvas.getContext('2d'); } catch (e) { }
            }
            return ctx;
        }

        function resizeCanvas() {
            if (!canvas) {
                canvas = document.getElementById('ambientCanvas');
            }
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resizeCanvas, 120);
        }, { passive: true });

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                const w = canvas ? canvas.width : window.innerWidth;
                this.x = Math.random() * w;
                this.y = -20;
                this.isStar = Math.random() > 0.65;
                this.size = this.isStar ? Math.random() * 3.5 + 2 : Math.random() * 8 + 4;
                this.speedY = Math.random() * 0.6 + 0.3;
                this.speedX = (Math.random() - 0.5) * 0.6;
                this.rotation = Math.random() * 360;
                this.rotationSpeed = (Math.random() - 0.5) * 1.5;
                this.twinklePhase = Math.random() * Math.PI * 2;
                this.twinkleSpeed = Math.random() * 0.04 + 0.02;
                this.baseOpacity = Math.random() * 0.45 + 0.25;
            }
            update() {
                const w = canvas ? canvas.width : window.innerWidth;
                const h = canvas ? canvas.height : window.innerHeight;
                this.y += this.speedY;
                this.x += this.speedX + Math.sin(this.y * 0.008) * 0.4;
                this.rotation += this.rotationSpeed;
                this.twinklePhase += this.twinkleSpeed;
                if (this.y > h + 20 || this.x < -20 || this.x > w + 20) {
                    this.reset();
                }
            }
            draw() {
                const context = getAmbientCtx();
                if (!context) return;
                const currentOpacity = Math.max(0.12, Math.min(0.85, this.baseOpacity + Math.sin(this.twinklePhase) * 0.2));
                context.save();
                context.translate(this.x, this.y);
                context.rotate((this.rotation * Math.PI) / 180);

                if (this.isStar) {
                    // Golden twinkle star (precomputed trigonometric points for 60fps mobile smoothness)
                    context.fillStyle = `rgba(251, 191, 36, ${currentOpacity})`;
                    context.beginPath();
                    const rOuter = this.size;
                    const rInner = this.size * 0.38;
                    for (let i = 0; i < 4; i++) {
                        const pt = STAR_ANGLES[i];
                        context.lineTo(pt.cos1 * rOuter, pt.sin1 * rOuter);
                        context.lineTo(pt.cos2 * rInner, pt.sin2 * rInner);
                    }
                    context.closePath();
                    context.fill();
                } else {
                    // Soft rose falling petal
                    context.fillStyle = `rgba(251, 113, 133, ${currentOpacity})`;
                    context.beginPath();
                    context.ellipse(0, 0, this.size, this.size * 0.55, 0, 0, Math.PI * 2);
                    context.fill();
                }
                context.restore();
            }
        }

        function initAmbientCanvas() {
            canvas = document.getElementById('ambientCanvas');
            if (!canvas) return;
            resizeCanvas();
            const isMobileScreen = window.innerWidth < 640;
            const particleCount = isMobileScreen ? 5 : 18;
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                const p = new Particle();
                p.y = Math.random() * (canvas.height || window.innerHeight);
                particles.push(p);
            }
            requestAnimationFrame(animateAmbient);
        }

        document.addEventListener('visibilitychange', () => {
            isPageVisible = !document.hidden;
            if (isPageVisible && !isAmbientPaused) {
                requestAnimationFrame(animateAmbient);
            }
        });

        function animateAmbient() {
            if (!isPageVisible || isAmbientPaused) return;
            const context = getAmbientCtx();
            if (!context || !canvas) return;
            context.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
            requestAnimationFrame(animateAmbient);
        }

        onDOMReady(initAmbientCanvas);

        // Reading Progress Indicator (Optimized with requestAnimationFrame & DOM cache)
        let scrollTicking = false;
        let readingBarEl = null;
        let mobileScrollPauseTimer = null;

        window.addEventListener('scroll', () => {
            if (!scrollTicking) {
                requestAnimationFrame(() => {
                    if (!readingBarEl) readingBarEl = document.getElementById('readingProgressBar');
                    const winScroll = window.scrollY || document.documentElement.scrollTop;
                    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                    if (height > 0 && readingBarEl) {
                        readingBarEl.style.width = ((winScroll / height) * 100) + "%";
                    }
                    scrollTicking = false;
                });
                scrollTicking = true;
            }

            // Pause ambient canvas draws on mobile during active scroll for 60fps silky smooth scrolling
            if (window.innerWidth < 768 && !isAmbientPaused) {
                isAmbientPaused = true;
                clearTimeout(mobileScrollPauseTimer);
                mobileScrollPauseTimer = setTimeout(() => {
                    isAmbientPaused = false;
                    if (isPageVisible) requestAnimationFrame(animateAmbient);
                }, 130);
            }
        }, { passive: true });

        // ==========================================
        // FAIRY DUST SPARKLE TRAIL (Desktop Mouse Only - Zero Touchscreen Pop-up Effect)
        // ==========================================
        let lastSparkleTime = 0;

        function createSparkle(x, y) {
            // Strictly desktop only: prevent unwanted popping effects and DOM churn on touchscreens
            if (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches) return;

            const now = Date.now();
            if (now - lastSparkleTime < 130) return;
            lastSparkleTime = now;

            const el = document.createElement('div');
            el.className = 'sparkle-particle';
            const sparkles = ['✨', '💖', '🌸', '⭐', '🤍'];
            el.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
            el.style.left = x + 'px';
            el.style.top = y + 'px';
            el.style.fontSize = (Math.random() * 8 + 10) + 'px';
            document.body.appendChild(el);

            setTimeout(() => {
                if (el.parentNode) el.parentNode.removeChild(el);
            }, 600);
        }

        // Only listen for cursor movement on fine-pointer devices (mice/trackpads)
        if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            window.addEventListener('mousemove', (e) => {
                createSparkle(e.clientX, e.clientY);
            }, { passive: true });
        }

        // ==========================================
        // WEB AUDIO SYNTHESIZER: WARM PIANO & SOUND EFFECTS
        // ==========================================
        let audioCtx = null;
        let isBgmPlaying = false;
        let bgmTimer = null;

        function getAudioCtx() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            return audioCtx;
        }

        // Musical note synthesis for full alphabet keyboard
        const letterFrequencies = {
            'a': 261.63, 'b': 293.66, 'c': 329.63, 'd': 349.23, 'e': 392.00,
            'f': 440.00, 'g': 493.88, 'h': 523.25, 'i': 587.33, 'j': 659.25,
            'k': 698.46, 'l': 783.99, 'm': 880.00, 'n': 932.33, 'o': 987.77,
            'p': 1046.50, 'q': 1108.73, 'r': 1174.66, 's': 1244.51, 't': 1318.51,
            'u': 1396.91, 'v': 1479.98, 'w': 1567.98, 'x': 1661.22, 'y': 1760.00,
            'z': 1864.66
        };

        function playLetterTone(char) {
            try {
                const ctx = getAudioCtx();
                const now = ctx.currentTime;
                const freq = letterFrequencies[char.toLowerCase()] || 600;

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now);

                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.32);
            } catch (e) { }
        }

        function playErrorTone() {
            try {
                const ctx = getAudioCtx();
                const now = ctx.currentTime;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.linearRampToValueAtTime(140, now + 0.28);

                gain.gain.setValueAtTime(0.05, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.28);
            } catch (e) { }
        }

        // Cute Bubble Pop Sound
        function playBubblePop() {
            try {
                const ctx = getAudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const now = ctx.currentTime;

                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);

                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start(now);
                osc.stop(now + 0.1);
            } catch (e) { }
        }

        // Crystal Chime Sound
        function playChimeSound() {
            try {
                const ctx = getAudioCtx();
                const now = ctx.currentTime;
                const freqs = [880, 1174.66, 1479.98]; // A5, D6, F#6

                freqs.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.04);

                    gain.gain.setValueAtTime(0.06, now + i * 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.04 + 0.8);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start(now + i * 0.04);
                    osc.stop(now + i * 0.04 + 0.8);
                });
            } catch (e) { }
        }

        // Dreamy Arpeggiated Celestial Harp Tone
        function playHarpTone() {
            try {
                const ctx = getAudioCtx();
                const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
                notes.forEach((freq, idx) => {
                    setTimeout(() => {
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        const t = ctx.currentTime;

                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, t);

                        gain.gain.setValueAtTime(0.08, t);
                        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);

                        osc.connect(gain);
                        gain.connect(ctx.destination);

                        osc.start(t);
                        osc.stop(t + 1.5);
                    }, idx * 75);
                });
            } catch (e) { }
        }

        // Rich Warm Piano Chords with bass foundation (Gentle, emotive 6-chord cycle)
        const chordProgressions = [
            { bass: 130.81, notes: [261.63, 329.63, 392.00, 493.88] }, // Cmaj7
            { bass: 98.00, notes: [196.00, 246.94, 293.66, 392.00] },  // G
            { bass: 110.00, notes: [220.00, 261.63, 329.63, 392.00] }, // Am7
            { bass: 82.41, notes: [164.81, 246.94, 329.63, 392.00] },  // Em7
            { bass: 87.31, notes: [174.61, 261.63, 329.63, 349.23] },  // Fmaj7
            { bass: 98.00, notes: [196.00, 261.63, 293.66, 392.00] }   // Gsus4
        ];
        let currentChordIndex = 0;

        function playPianoChord(chord) {
            if (!isBgmPlaying) return;
            try {
                const ctx = getAudioCtx();
                const now = ctx.currentTime;

                // Bass
                const bassOsc = ctx.createOscillator();
                const bassGain = ctx.createGain();
                bassOsc.type = 'sine';
                bassOsc.frequency.setValueAtTime(chord.bass, now);
                bassGain.gain.setValueAtTime(0.0001, now);
                bassGain.gain.linearRampToValueAtTime(0.035, now + 0.2);
                bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);
                bassOsc.connect(bassGain);
                bassGain.connect(ctx.destination);
                bassOsc.start(now);
                bassOsc.stop(now + 3.8);

                // Notes
                chord.notes.forEach((freq, idx) => {
                    setTimeout(() => {
                        if (!isBgmPlaying) return;
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();

                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(freq, ctx.currentTime);

                        const t = ctx.currentTime;
                        gain.gain.setValueAtTime(0.0001, t);
                        gain.gain.linearRampToValueAtTime(0.045, t + 0.12);
                        gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);

                        osc.connect(gain);
                        gain.connect(ctx.destination);

                        osc.start(t);
                        osc.stop(t + 3.2);
                    }, idx * 130);
                });
            } catch (e) { }
        }

        function triggerNextChord() {
            if (!isBgmPlaying) return;
            playPianoChord(chordProgressions[currentChordIndex]);
            currentChordIndex = (currentChordIndex + 1) % chordProgressions.length;
            bgmTimer = setTimeout(triggerNextChord, 3600);
        }

        function toggleBgmMusic() {
            const visualizer = document.getElementById('eqVisualizer');
            const label = document.getElementById('bgMusicLabel');

            if (isBgmPlaying) {
                isBgmPlaying = false;
                clearTimeout(bgmTimer);
                if (visualizer) visualizer.classList.remove('eq-playing');
                if (label) label.textContent = 'Piano BGM';
                showToast("Soft melody paused", "⏸️");
            } else {
                getAudioCtx();
                isBgmPlaying = true;
                if (visualizer) visualizer.classList.add('eq-playing');
                if (label) label.textContent = 'Playing...';
                triggerNextChord();
                showToast("Playing gentle soothing piano for you 🤍", "🎵");
            }
        }

        function shootPetals() {
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 50,
                    spread: 80,
                    colors: ['#f43f5e', '#fb7185', '#fda4af', '#fff1f2', '#fecdd3'],
                    origin: { y: 0.6 }
                });
            }
        }

        function shootHearts() {
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 65,
                    spread: 90,
                    shapes: ['circle'],
                    colors: ['#e11d48', '#f43f5e', '#fbcfe8', '#f59e0b', '#fb7185'],
                    origin: { y: 0.65 }
                });
            }
        }

        function sendVirtualHug() {
            playBubblePop();
            playHarpTone();
            shootHearts();
            shootPetals();
            showToast("Sent the warmest virtual hug to Kajal Didi! 🥹🫂❤️", "🫂");
        }

        // ==========================================
        // BIRTHDAY SPECIAL CELEBRATIONS & AUDIO
        // ==========================================
        function shootConfettiBlast() {
            if (typeof confetti === 'function') {
                const colors = ['#f43f5e', '#ec4899', '#f59e0b', '#3b82f6', '#10b981', '#fbbf24', '#ffffff'];
                const isMobile = window.innerWidth < 640;

                if (isMobile) {
                    // Mobile lightweight celebratory burst: high festive punch with zero frame lag
                    confetti({
                        particleCount: 35,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: colors
                    });
                    setTimeout(() => {
                        confetti({
                            particleCount: 20,
                            angle: 60,
                            spread: 50,
                            origin: { x: 0.1, y: 0.65 },
                            colors: colors
                        });
                        confetti({
                            particleCount: 20,
                            angle: 120,
                            spread: 50,
                            origin: { x: 0.9, y: 0.65 },
                            colors: colors
                        });
                    }, 250);
                } else {
                    const duration = 2.0 * 1000;
                    const end = Date.now() + duration;

                    (function frame() {
                        confetti({
                            particleCount: 4,
                            angle: 60,
                            spread: 55,
                            origin: { x: 0 },
                            colors: colors
                        });
                        confetti({
                            particleCount: 4,
                            angle: 120,
                            spread: 55,
                            origin: { x: 1 },
                            colors: colors
                        });

                        if (Date.now() < end) {
                            requestAnimationFrame(frame);
                        }
                    }());

                    confetti({
                        particleCount: 75,
                        spread: 95,
                        origin: { y: 0.6 },
                        colors: colors
                    });
                }
            }
        }

        // Happy Birthday Synth Melody using Web Audio API
        function playHappyBirthdaySong() {
            try {
                const ctx = getAudioCtx();
                const now = ctx.currentTime + 0.05;
                const beat = 0.32;

                const melody = [
                    { f: 261.63, d: 0.75 }, // Hap-
                    { f: 261.63, d: 0.25 }, // py
                    { f: 293.66, d: 1.0 },  // Birth-
                    { f: 261.63, d: 1.0 },  // day
                    { f: 349.23, d: 1.0 },  // to
                    { f: 329.63, d: 2.0 },  // you

                    { f: 261.63, d: 0.75 }, // Hap-
                    { f: 261.63, d: 0.25 }, // py
                    { f: 293.66, d: 1.0 },  // Birth-
                    { f: 261.63, d: 1.0 },  // day
                    { f: 392.00, d: 1.0 },  // to
                    { f: 349.23, d: 2.0 },  // you

                    { f: 261.63, d: 0.75 }, // Hap-
                    { f: 261.63, d: 0.25 }, // py
                    { f: 523.25, d: 1.0 },  // Birth-
                    { f: 440.00, d: 1.0 },  // day
                    { f: 349.23, d: 1.0 },  // dear
                    { f: 329.63, d: 1.0 },  // Ka-
                    { f: 293.66, d: 2.0 },  // jal

                    { f: 466.16, d: 0.75 }, // Hap-
                    { f: 466.16, d: 0.25 }, // py
                    { f: 440.00, d: 1.0 },  // Birth-
                    { f: 349.23, d: 1.0 },  // day
                    { f: 392.00, d: 1.0 },  // to
                    { f: 349.23, d: 2.5 }   // you!
                ];

                let curTime = now;
                melody.forEach(item => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();

                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(item.f, curTime);

                    const noteDuration = item.d * beat;
                    gain.gain.setValueAtTime(0.0001, curTime);
                    gain.gain.linearRampToValueAtTime(0.09, curTime + 0.04);
                    gain.gain.exponentialRampToValueAtTime(0.0001, curTime + noteDuration - 0.02);

                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    osc.start(curTime);
                    osc.stop(curTime + noteDuration);

                    curTime += noteDuration + 0.03;
                });
            } catch (e) { }
        }

        let isCandleBlown = false;
        function blowOutBirthdayCandle() {
            const flame = document.getElementById('candleFlame');
            const smoke = document.getElementById('candleSmoke');
            const btnText = document.getElementById('candleBtnText');

            if (!isCandleBlown) {
                isCandleBlown = true;
                if (flame) flame.classList.add('opacity-0', 'scale-0');
                if (smoke) {
                    smoke.classList.remove('hidden');
                    setTimeout(() => smoke.classList.add('hidden'), 2500);
                }
                if (btnText) btnText.innerHTML = "✨ Wish Sent To The Stars! Sparkle Again? 🎂";

                playBubblePop();
                playChimeSound();
                playHappyBirthdaySong();
                shootConfettiBlast();
                showToast("🎂 Yayyy! Happy Birthday Kajal Didi! May your wish come true! 💖✨", "🎉");
            } else {
                isCandleBlown = false;
                if (flame) flame.classList.remove('opacity-0', 'scale-0');
                if (btnText) btnText.innerHTML = "💨 Blow The Candle & Make A Wish!";
                playChimeSound();
                shootPetals();
                showToast("🕯️ Candle relit! Make another sweet wish, Didi!", "✨");
            }
        }

        function scrollToCake() {
            playBubblePop();
            const cakeSec = document.getElementById('birthdayCakeSection');
            if (cakeSec) {
                cakeSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
                shootConfettiBlast();
                showToast("🎂 Welcome to Kajal Didi's Birthday Cake!", "✨");
            }
        }

        function scrollToWishes() {
            playBubblePop();
            const wishesSec = document.getElementById('birthdayWishesCardSection');
            if (wishesSec) {
                wishesSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
                shootPetals();
                playChimeSound();
                showToast("💌 Special Birthday Wishes for Kajal Didi! 🌸", "🎂");
            }
        }

        function copySpecialWishes() {
            playBubblePop();
            const wishText = `Happy Birthday, Kajal didi 🥳🎂❤️🫶🏻✨\n\nI hope aapki life hamesha happiness, peace aur lots of love se bhari rahe 🥹💗. May God bless you with everything you truly deserve, aap hamesha smile karti raho aur aapki life mein kabhi khushiyon ki kami na ho 🧿🌸🤍\n\nAapke saare dreams pure ho, har din aapke liye kuch beautiful lekar aaye, and may you always stay the same lovely person you are 🫶🏻🥰💐\n\nOnce again, happiest birthday, didi! 🎉🎂❤️ I hope aapka ye special day aapke liye bahut saari beautiful memories lekar aaye. Keep smiling, keep shining and always stay happy! 🥹🫂💖✨\n\nLots of love and best wishes for you, didi! ❤️🎀🧿🎂🌷`;
            navigator.clipboard.writeText(wishText).then(() => {
                playChimeSound();
                shootConfettiBlast();
                showToast("Birthday wishes copied to clipboard! 📋", "🎂");
            }).catch(() => {
                const tempArea = document.createElement('textarea');
                tempArea.value = wishText;
                document.body.appendChild(tempArea);
                tempArea.select();
                document.execCommand('copy');
                document.body.removeChild(tempArea);
                playChimeSound();
                shootConfettiBlast();
                showToast("Birthday wishes copied to clipboard! 📋", "🎂");
            });
        }

        // ==========================================
        // PASSWORD CRACKING LOGIC (PASSWORD: "mishku")
        // ==========================================
        const SECRET_PASSWORD = "mishku";
        const ACCEPTED_PASSWORDS = ["mishku"];
        // Non-linear reveal order to require brain power to deduce the word
        // Position #3 (S), Position #5 (K), Position #1 (M), Position #2 (I), Position #4 (H), Position #6 (U)
        const REVEAL_ORDER = [2, 4, 0, 1, 3, 5];
        let isPasscodeCracked = false;
        let wrongAttempts = 0;
        let hintClickCount = 0;

        const hintsList = [
            "Riddle: \"It's something given by you, and that is very special for me.\" 💌",
            "Clue 1: It cannot be bought with coins or wrapped in paper — a special identity you bestowed.",
            "Clue 2: A word of deep sibling affection that makes Bhai smile every time he hears it.",
            "Clue 3: Every 10 wrong attempts reveals one of the 6 letters in scrambled order. Use your brain to assemble them!",
            "Clue 4: Look closely at the revealed letters in the clues and pronounce their sounds together."
        ];

        function getRevealedMask() {
            const revealedCount = Math.min(6, Math.floor(wrongAttempts / 10));
            const mask = ['_', '_', '_', '_', '_', '_'];
            for (let step = 0; step < revealedCount; step++) {
                const pos = REVEAL_ORDER[step];
                mask[pos] = SECRET_PASSWORD[pos].toUpperCase();
            }
            return mask.join(' ');
        }

        function updateMysterySlots() {
            const revealedCount = Math.min(6, Math.floor(wrongAttempts / 10));
            const statusMsg = document.getElementById('passcodeStatusMsg');
            if (revealedCount >= 6 && statusMsg && !isPasscodeCracked) {
                statusMsg.innerHTML = `All 6 cipher letters decoded! 🧸 Secret code: <strong class="text-rose-600 font-extrabold tracking-widest">MISHKU</strong>`;
                statusMsg.className = "text-xs font-bold text-rose-600";
            }
        }

        function appendLetter(char) {
            const input = document.getElementById('passcodeTextInput');
            if (!input || isPasscodeCracked) return;

            playLetterTone(char);
            input.value += char;

            const statusMsg = document.getElementById('passcodeStatusMsg');
            if (statusMsg) {
                statusMsg.textContent = "Testing cipher code...";
                statusMsg.className = "text-[11px] sm:text-xs font-bold text-slate-600";
            }
        }

        function deleteLetter() {
            const input = document.getElementById('passcodeTextInput');
            if (!input || isPasscodeCracked || input.value.length === 0) return;

            playBubblePop();
            input.value = input.value.slice(0, -1);
        }

        function clearInput() {
            const input = document.getElementById('passcodeTextInput');
            if (input) {
                playBubblePop();
                input.value = "";
                input.focus();
            }
        }

        function showPasscodeHint() {
            playChimeSound();
            shootPetals();

            const statusMsg = document.getElementById('passcodeStatusMsg');
            const hintText = hintsList[hintClickCount % hintsList.length];
            hintClickCount++;

            if (statusMsg) {
                statusMsg.textContent = hintText;
                statusMsg.className = "text-[11px] sm:text-xs font-black text-amber-600 animate-pulse";
            }

            showToast(hintText, "💡");
        }

        function showBrainTeaserTip() {
            playChimeSound();
            showToast("🧠 Brain Tip: Every 10 wrong attempts reveals a letter in the clue. Test words and assemble the letters!", "🧩");
            const statusMsg = document.getElementById('passcodeStatusMsg');
            if (statusMsg) {
                const revealedCount = Math.min(6, Math.floor(wrongAttempts / 10));
                if (revealedCount > 0) {
                    statusMsg.innerHTML = `Tip: Assemble the letters: <strong class="text-amber-700 tracking-widest">${getRevealedMask()}</strong>`;
                } else {
                    statusMsg.textContent = "Tip: Test words or reflect on the riddle to unlock Bhai's special nickname!";
                }
                statusMsg.className = "text-[11px] sm:text-xs font-bold text-amber-700";
            }
        }

        // Secret bypass (double-click lock icon) for testing without visible giveaways
        function bhaiSecretBypass() {
            playChimeSound();
            const input = document.getElementById('passcodeTextInput');
            if (input) {
                input.value = "mishku";
                submitPasscode();
            }
        }

        function submitPasscode() {
            const input = document.getElementById('passcodeTextInput');
            const vaultCard = document.getElementById('vaultCardElement');
            const statusMsg = document.getElementById('passcodeStatusMsg');
            const lockIcon = document.getElementById('lockStatusIcon');

            if (!input) return;
            const entered = input.value.trim().toLowerCase();

            if (entered === SECRET_PASSWORD || ACCEPTED_PASSWORDS.includes(entered)) {
                // SUCCESS: Code Cracked!
                isPasscodeCracked = true;

                if (lockIcon) {
                    lockIcon.textContent = "🔓";
                    lockIcon.classList.add('scale-125');
                }

                input.classList.remove('border-rose-300/80');
                input.classList.add('border-amber-400', 'bg-amber-50/80', 'text-amber-800');

                if (statusMsg) {
                    statusMsg.textContent = "🎂 Happy Birthday Kajal Didi! Vault Unlocked 🥳❤️";
                    statusMsg.className = "text-xs sm:text-sm font-black text-rose-600";
                }

                playHarpTone();
                playChimeSound();
                playHappyBirthdaySong();
                shootConfettiBlast();
                shootHearts();

                // Smoothly dismiss the lock screen and launch the Sequential Games Quest instantly
                setTimeout(() => {
                    const welcome = document.getElementById('welcomeFrontScreen');
                    if (welcome) {
                        welcome.classList.add('hidden');
                        welcome.style.setProperty('display', 'none', 'important');
                    }
                    const lockScreen = document.getElementById('passcodeLockScreen');
                    if (lockScreen) {
                        lockScreen.classList.add('hidden', 'opacity-0', 'pointer-events-none');
                        lockScreen.style.setProperty('display', 'none', 'important');
                    }
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    startSequentialGamesQuest();
                    showToast("🔐 Password Accepted! Welcome to the Birthday Arcade Quest! 🎮", "👑");
                }, 250);

            } else {
                // WRONG PASSWORD: Track attempts & progressive scrambled reveal
                playErrorTone();

                const prevRevealed = Math.min(6, Math.floor(wrongAttempts / 10));
                wrongAttempts++;
                const newRevealed = Math.min(6, Math.floor(wrongAttempts / 10));

                if (vaultCard) {
                    vaultCard.classList.remove('animate-wobble');
                    void vaultCard.offsetWidth; // trigger reflow
                    vaultCard.classList.add('animate-wobble');
                }

                input.classList.add('border-red-400', 'bg-red-50/80');
                setTimeout(() => {
                    input.classList.remove('border-red-400', 'bg-red-50/80');
                }, 800);

                if (newRevealed > prevRevealed) {
                    // Reached milestone (10, 20, 30, 40, 50, 60)
                    playChimeSound();
                    playHarpTone();
                    shootPetals();
                    const unlockedPos = REVEAL_ORDER[newRevealed - 1];
                    const unlockedLetter = SECRET_PASSWORD[unlockedPos].toUpperCase();
                    const maskStr = getRevealedMask();
                    if (statusMsg) {
                        statusMsg.innerHTML = `🧩 Milestone! Letter #${unlockedPos + 1} decoded: '<strong class="text-rose-600">${unlockedLetter}</strong>' • [ ${maskStr} ]`;
                        statusMsg.className = "text-xs sm:text-sm font-black text-amber-600 animate-pulse";
                    }
                    showToast(`✨ Letter #${unlockedPos + 1} decoded: '${unlockedLetter}'! Pattern: ${maskStr}`, "💡");
                } else {
                    const remaining = 10 - (wrongAttempts % 10);
                    const maskStr = getRevealedMask();
                    if (statusMsg) {
                        const maskNotice = newRevealed > 0 ? ` • [ ${maskStr} ]` : '';
                        statusMsg.textContent = `Not quite right! Brain power activated 🧠 (${remaining} ${remaining === 1 ? 'try' : 'tries'} to next letter)${maskNotice}`;
                        statusMsg.className = "text-xs font-bold text-rose-600";
                    }
                }

                updateMysterySlots();
            }
        }

        function lockScreenAgain() {
            playBubblePop();
            isPasscodeCracked = false;
            closeSurpriseFlow();

            const input = document.getElementById('passcodeTextInput');
            if (input) {
                input.value = "";
                input.classList.remove('border-amber-400', 'bg-amber-50/80', 'text-amber-800');
            }

            const lockIcon = document.getElementById('lockStatusIcon');
            if (lockIcon) {
                lockIcon.textContent = "🔒";
                lockIcon.classList.remove('scale-125');
            }

            const statusMsg = document.getElementById('passcodeStatusMsg');
            if (statusMsg) {
                statusMsg.textContent = "Type with keyboard or tap the keys below";
                statusMsg.className = "text-[11px] sm:text-xs font-bold text-slate-500";
            }

            const mainContent = document.getElementById('mainCelebrationContent');
            if (mainContent) {
                mainContent.classList.add('hidden');
                mainContent.style.setProperty('display', 'none', 'important');
            }
            const welcome = document.getElementById('welcomeFrontScreen');
            if (welcome) {
                welcome.classList.add('hidden');
                welcome.style.setProperty('display', 'none', 'important');
            }

            const lockScreen = document.getElementById('passcodeLockScreen');
            if (lockScreen) {
                lockScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none', 'scale-105');
                lockScreen.style.setProperty('display', 'flex', 'important');
            }

            updateMysterySlots();

            window.scrollTo({ top: 0, behavior: 'instant' });
            showToast("Screen locked! Enter password to unlock 🔐", "🔒");
        }

        // Support Enter key submission inside input & initialize hints
        onDOMReady(() => {
            const input = document.getElementById('passcodeTextInput');
            if (input) {
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        submitPasscode();
                    } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                        playLetterTone(e.key);
                    }
                });
            }
            updateMysterySlots();
        });

        // ==========================================
        // SWEET SISTER PERKS & SMILE GENERATOR
        // ==========================================
        const sisterSmileMessages = [
            { icon: "🌸", title: "You Are Irreplaceable, Didi!", msg: "No matter how busy life gets, knowing I have a sister like you makes every hard day brighter. Love you always, Mishku!" },
            { icon: "☕", title: "Bhai Coffee & Momos Voucher", msg: "This voucher guarantees 1 free meal or coffee date on your little brother whenever you want it. No expiry date!" },
            { icon: "🛡️", title: "The Forever Guardian", msg: "If anyone ever makes you feel small or upset, remember you have a brother who thinks you are absolute royalty!" },
            { icon: "🃏", title: "Official Uno Referee Statement", msg: "Even when you draw 4 cards on me and laugh hysterically, you're still my favorite sister to play games with!" },
            { icon: "🤍", title: "A Gentle Reminder", msg: "You have survived 100% of your hardest days. Take a breath, you are doing wonderfully, Didi!" }
        ];

        function triggerSisterPerk(perkId) {
            playBubblePop();
            playChimeSound();
            shootHearts();

            if (perkId === 1) {
                openSisterSmileModal("☕", "Bhai's Coffee & Treats Pass", "Kajal Didi, this voucher has been officially redeemed in Bhai's ledger! Just text me what treat you want today. 🥰🍕☕");
            } else if (perkId === 2) {
                openSisterSmileModal("🛡️", "The Brother Shield", "Your Little Brother is always 1 call away. No issue is too silly, no problem is too small. I am always in your corner!");
            } else if (perkId === 3) {
                openSisterSmileModal("🃏", "The Uno War Accord", "Listen Didi, I still think you secretly had that +4 card hidden in your sleeve... but I'll let you win anyway! 😂🎮❤️");
            } else if (perkId === 4) {
                openSisterSmileModal("🌙", "Late Night Heart-to-Heart", "Whenever your head feels full or life feels heavy, you can talk to me for hours. Dil ki baatein are always safe here.");
            }
        }

        function triggerSisterSurpriseSmile() {
            playBubblePop();
            playHarpTone();
            shootHearts();
            const randomItem = sisterSmileMessages[Math.floor(Math.random() * sisterSmileMessages.length)];
            openSisterSmileModal(randomItem.icon, randomItem.title, randomItem.msg);
        }

        function openSisterSmileModal(icon, title, msg) {
            const modal = document.getElementById('sisterSmileModal');
            const dialog = document.getElementById('sisterSmileDialog');
            document.getElementById('smileModalIcon').textContent = icon;
            document.getElementById('smileModalTitle').textContent = title;
            document.getElementById('smileModalMsg').textContent = msg;

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                dialog.classList.remove('scale-95');
                dialog.classList.add('scale-100');
            }, 20);
        }

        function closeSisterSmileModal() {
            playBubblePop();
            const modal = document.getElementById('sisterSmileModal');
            const dialog = document.getElementById('sisterSmileDialog');

            dialog.classList.remove('scale-100');
            dialog.classList.add('scale-95');
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                isAmbientPaused = false;
                requestAnimationFrame(animateAmbient);
            }, 300);
        }

        onDOMReady(() => {
            const smileModal = document.getElementById('sisterSmileModal');
            if (smileModal) {
                smileModal.addEventListener('click', function (e) {
                    if (e.target === this) {
                        closeSisterSmileModal();
                    }
                });
            }
        });

        // ==========================================
        // BROTHER'S 7 SACRED LIFETIME VOWS
        // ==========================================
        const brotherVows = [
            {
                icon: "👶🏻❤️",
                title: "Always Your Chhota Bhai",
                tag: "Vow #1 • Lifetime Bond",
                short: "Chahe main 50 saal ka bhi ho jaaun...",
                vow: "Didi, chahe main 50 saal ka bhi ho jaaun, aur chahe kitna bhi mature banne ki koshish karoon... aapke saamne main hamesha wahi chhota bhai rahunga jo bina wajah aapke sar par chadh kar baithega, choti-moti baaton par chidhaega, aur aapki ek muskaan dekh kar sabse zyada khush hoga! 🥹❤️"
            },
            {
                icon: "🛡️🤍",
                title: "Aapki Khamoshi Ka Pehredaar",
                tag: "Vow #2 • Unshakable Shield",
                short: "Agar poori duniya khilaaf ho...",
                vow: "Agar kabhi zindagi ke kisi mod par lage ki sab akele face karna pad raha hai, toh bas ek baar peeche mudkar dekhna. Aapka bhai bina kisi sawal ke, bina kisi condition ke, ek chattan ki tarah aapke peeche khada milega. You are never, ever alone, Didi! 🫂🕊️"
            },
            {
                icon: "🕊️🥺",
                title: "Safe Haven for Your Tears",
                tag: "Vow #3 • Zero Judgment",
                short: "Strong banne ki zaroorat nahi hai...",
                vow: "Aapko sabke saamne strong aur samjhdar banne ki aadat ho sakti hai Didi, lekin mere saamne aapko strong banne ka drama karne ki koi zaroorat nahi hai. Jab dil bhare, bina darre ro lena... bhai ka kandha aur bhai ke kaan hamesha aapke liye khule hain. 🤍"
            },
            {
                icon: "🌍✨",
                title: "Dooriyan Bas Ek Number Hain",
                tag: "Vow #4 • Always Connected",
                short: "Chahe cities door ho jaayein...",
                vow: "Kal ko hum dono apni-apni lives mein kitne bhi busy ho jaayein, chahe kitne bhi kilometer door ho jaayein... bas ek phone call ki doori rahegi. Bhai aapke liye hamesha time nikaalega, no matter what! 📞✨"
            },
            {
                icon: "🍫🫂",
                title: "Pehle Manaunga, Baad Mein Ladunga",
                tag: "Vow #5 • Ego-Free Bond",
                short: "Kabhi koi narazgi ho bhi jaaye...",
                vow: "Kabhi misunderstanding ho ya koi narazgi, main ego ko humare is pyare rishte ke beech kabhi nahi aane doonga. Ek baar door jaane ki galti karke dekh liya... ab rab gawah hai, aisi bewakoofi kabhi nahi dohraunga. Pehle sorry bolkar gale lagaunga! 🥹🫶🏻"
            },
            {
                icon: "🌟🥹",
                title: "Aapko Fakr Mehsoos Karwaunga",
                tag: "Vow #6 • Brother's Pride",
                short: "Sar hamesha fakr se ooncha rahega...",
                vow: "Main apni life mein itni mehnat karunga aur itna acha insaan banunga ki ek din aap fakr se duniya ko keh sako: 'Dekho, yeh mera chhota bhai hai, aur mujhe is par garv hai!' Main aapka sar kabhi jhukne nahi doonga, Didi. 🌸🏅"
            },
            {
                icon: "🌸♾️",
                title: "Irreplaceable Kajal Didi",
                tag: "Vow #7 • Sacred & Eternal",
                short: "Meri har dua mein aapka naam...",
                vow: "You are truly irreplaceable, Kajal Didi. Meri life ki har dua mein aapki khushi, aapki sehat aur aapki lambi umar pehle aayegi. Till my very last breath, I will protect, love and respect my Kajal Didi. Love you endlessly, always! ❤️🫂✨"
            }
        ];

        function renderBrotherVows() {
            const container = document.getElementById('vowsGridContainer');
            if (!container) return;

            container.innerHTML = brotherVows.map((item, idx) => `
                <div id="vowCard${idx}" onclick="toggleVowCard(${idx})"
                    class="vow-card p-4 sm:p-5 flex flex-col justify-between transition-all duration-300">
                    <div class="space-y-2">
                        <div class="flex items-center justify-between gap-2">
                            <span class="text-2xl">${item.icon}</span>
                            <span class="text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                                ${item.tag}
                            </span>
                        </div>
                        <h4 class="font-serif-title font-bold text-slate-900 text-sm sm:text-base">
                            ${item.title}
                        </h4>
                        <p class="text-xs text-slate-600 italic">
                            ${item.short}
                        </p>
                    </div>

                    <div id="vowContent${idx}" class="hidden mt-3 pt-3 border-t border-amber-200/90 space-y-2">
                        <p class="text-xs sm:text-sm text-slate-900 font-semibold leading-relaxed bg-white/90 p-3 rounded-xl border border-amber-200 shadow-sm">
                            ${item.vow}
                        </p>
                    </div>

                    <div class="mt-3 flex items-center justify-between pt-1">
                        <span id="vowBtnLabel${idx}" class="text-[11px] sm:text-xs font-black text-amber-900 flex items-center gap-1">
                            <span>📜 Tap to read full vow</span>
                        </span>
                        <span class="text-xs text-amber-600 font-bold">✨</span>
                    </div>
                </div>
            `).join('');
        }

        function toggleVowCard(index) {
            playBubblePop();
            playHarpTone();
            shootHearts();

            const card = document.getElementById(`vowCard${index}`);
            const content = document.getElementById(`vowContent${index}`);
            const btnLabel = document.getElementById(`vowBtnLabel${index}`);

            if (!card || !content) return;

            const isCurrentlyOpen = !content.classList.contains('hidden');

            if (isCurrentlyOpen) {
                content.classList.add('hidden');
                card.classList.remove('active-vow');
                if (btnLabel) btnLabel.innerHTML = '<span>📜 Tap to read full vow</span>';
            } else {
                content.classList.remove('hidden');
                card.classList.add('active-vow');
                if (btnLabel) btnLabel.innerHTML = '<span class="text-rose-700 font-black">🤍 Sealed in Bhai\'s Heart 🤞</span>';
                showToast(`🤞 ${brotherVows[index].title} — Bhai's Sacred Vow! 💖`, "🌸");
            }
        }

        function scrollToVows() {
            playBubblePop();
            const section = document.getElementById('brotherVowsSection');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                showToast("🤞 Welcome to Bhai's Sacred Lifetime Vows! 💖", "✨");
            }
        }

        // ==========================================
        // SISTER EMERGENCY EMOTIONAL AID LOGIC
        // ==========================================
        const emergencyKitData = {
            1: {
                icon: "💌",
                tag: "Heartstrings Connection 🕊️",
                title: "Jab Bhai Ki Bahut Yaad Aaye... 🥺",
                msg: "Didi, aankhein band karo aur ek gehri saans lo... aapka bhai dil se bilkul aapke paas hai. Chupchap WhatsApp pe ek dil wala emoji '❤️' bhej do, ya seedha call ghumao. Bhai chahe kitna bhi busy ho, aapke liye hamesha hazir hai! 🫂✨",
                action: "whatsapp_miss"
            },
            2: {
                icon: "🌧️",
                tag: "Unconditional Strength 🛡️",
                title: "Jab Lag Raha Ho Ki Sab Mushkil Hai... 💪",
                msg: "Didi, ek baat hamesha yaad rakhna: aap itni pyaari, kind aur strong soul ho ki koi bhi mushkil waqt aapko hara nahi sakta. Aur jab tak aapka bhai zinda hai, aap kisi bhi cheez se akele nahi ladogi. Hum dono milkar har toofan paar kar lenge! 🤍🕊️",
                action: "hug"
            },
            3: {
                icon: "🥺",
                tag: "Tears & Healing Sanctuary 🕊️",
                title: "Jab Dil Bahut Bhari Ho Aur Rona Aaye... 🫂",
                msg: "Didi, ro lo... rona kamzori nahi hoti, dil ka bojh halka karne ka tareeka hota hai. Bhai ke saamne aapko strong banne ka drama nahi karna padega. Ek bohot bohot bada warm tight virtual hug meri taraf se 🫂❤️. Main hoon na aapke saath!",
                action: "hug"
            },
            4: {
                icon: "🍫",
                tag: "Instant Smile Prescription 🌸",
                title: "Jab Gussa Aaye Aur Mood Off Ho... 🍨",
                msg: "Uh-oh! Meri Kajal Didi ka mood off? Chalo Bhai ki taraf se unlimited chocolates, waffles, aur favorite chai treat officially sanction kar di gayi hai! Aur agar mujh par gussa ho, toh do chapat maarne ki permission bhi granted! Ab thoda muskura do na please? 🥹🍨",
                action: "whatsapp_treat"
            }
        };

        let currentEmergencyAction = "hug";

        function openEmergencyAid(id) {
            playBubblePop();
            playHarpTone();
            playChimeSound();
            shootHearts();

            const data = emergencyKitData[id];
            if (!data) return;

            currentEmergencyAction = data.action;

            const modal = document.getElementById('emergencyAidModal');
            const dialog = document.getElementById('emergencyAidDialog');
            const icon = document.getElementById('emergencyAidIcon');
            const tag = document.getElementById('emergencyAidTag');
            const title = document.getElementById('emergencyAidTitle');
            const msg = document.getElementById('emergencyAidMsg');
            const actionBtn = document.getElementById('emergencyAidActionBtn');

            if (icon) icon.textContent = data.icon;
            if (tag) tag.textContent = data.tag;
            if (title) title.textContent = data.title;
            if (msg) msg.textContent = data.msg;

            if (actionBtn) {
                if (data.action === 'whatsapp_miss') {
                    actionBtn.innerHTML = '<span>📱 Ping Bhai "Miss You" on WhatsApp</span>';
                } else if (data.action === 'whatsapp_treat') {
                    actionBtn.innerHTML = '<span>☕ Order Bhai Chai & Chocolate Treat</span>';
                } else {
                    actionBtn.innerHTML = '<span>🫂 Take Tight Virtual Hug</span>';
                }
            }

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                if (dialog) {
                    dialog.classList.remove('scale-95');
                    dialog.classList.add('scale-100');
                }
            }, 20);
        }

        function closeEmergencyAidModal() {
            playBubblePop();
            const modal = document.getElementById('emergencyAidModal');
            const dialog = document.getElementById('emergencyAidDialog');
            if (!modal) return;

            if (dialog) {
                dialog.classList.remove('scale-100');
                dialog.classList.add('scale-95');
            }
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                isAmbientPaused = false;
                requestAnimationFrame(animateAmbient);
            }, 300);
        }

        function handleEmergencyAction() {
            playBubblePop();
            playHarpTone();
            shootHearts();
            shootPetals();

            if (currentEmergencyAction === 'whatsapp_miss') {
                const text = encodeURIComponent("Bhai... I was looking at your letter and just missing you! Sending you a tight hug 🥺❤️🫂");
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
            } else if (currentEmergencyAction === 'whatsapp_treat') {
                const text = encodeURIComponent("Heyyy Bhai! 🍨 My emergency mood kit says you owe me an official coffee/chocolate treat right now! ☕🍫❤️");
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
            } else {
                sendVirtualHug();
            }
            closeEmergencyAidModal();
        }

        onDOMReady(() => {
            const emergencyModalEl = document.getElementById('emergencyAidModal');
            if (emergencyModalEl) {
                emergencyModalEl.addEventListener('click', function (e) {
                    if (e.target === this) closeEmergencyAidModal();
                });
            }
        });

        // ==========================================
        // SISTER SURPRISE INTERACTIVE FLOW LOGIC
        // ==========================================
        let currentSurpriseStep = 1;
        let selectedMysteryBox = null;

        const mysteryBoxData = {
            1: {
                icon: "🎂",
                badge: "Birthday Queen Privilege Pass 🍨",
                title: "Sweet Birthday Sister Perks! 🎂",
                msg: "Birthday Perks Unlocked: 10,000 Birthday Hugs 🫂 + Lifetime Birthday Cake, Ice-Cream & Chai treats fully sponsored by your little brother! 🍦☕ Kajal Didi, you are genuinely the sweetest and most caring sister anyone could ever ask for. Happy Birthday!"
            },
            2: {
                icon: "👑",
                badge: "Birthday Royal Citation 🥇",
                title: "Certified Best Sister Multiverse Award! 👑",
                msg: "Official Birthday Proclamation: Awarded to Kajal Didi on her special birthday for being the absolute #1 Best Sister across all 7 continents & infinite universes! 💖✨ No matter how much I tease you, no one in the world compares to you!"
            },
            3: {
                icon: "🎁",
                badge: "Bhai's Birthday Gift Vow 🤞",
                title: "Bhai's Forever Birthday Promise! 💌",
                msg: "Signed with pure sibling love: No matter how old we grow, where life takes us, or what challenges come along, your little brother will ALWAYS protect you, stand beside you, and pray for your endless happiness and long life! Happy Birthday Didi! 🤍🫂"
            }
        };

        function playSadDramaticSound() {
            try {
                const ctx = getAudioCtx();
                const now = ctx.currentTime;
                // Descending sad cartoon "wah-wah-wah" notes: Eb4 -> D4 -> Db4 -> C4
                const notes = [311.13, 293.66, 277.18, 261.63];
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    const t = now + idx * 0.22;
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(freq, t);
                    osc.frequency.linearRampToValueAtTime(freq - 15, t + 0.2);
                    gain.gain.setValueAtTime(0.06, t);
                    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.21);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(t);
                    osc.stop(t + 0.22);
                });
            } catch (e) { }
        }

        let surpriseFlowPurpose = 'letter';

        function openSurpriseFlow(startStep = 1, purpose = 'letter') {
            const modal = document.getElementById('sisterSurpriseFlowModal');
            const dialog = document.getElementById('surpriseDialogCard');
            if (!modal) return;

            surpriseFlowPurpose = purpose;
            isAmbientPaused = true;
            resetSurpriseSteps(startStep);

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                if (dialog) {
                    dialog.classList.remove('scale-95');
                    dialog.classList.add('scale-100');
                }
            }, 30);

            playHarpTone();
            playChimeSound();
        }

        function closeSurpriseFlow() {
            const modal = document.getElementById('sisterSurpriseFlowModal');
            const dialog = document.getElementById('surpriseDialogCard');
            if (!modal) return;

            if (dialog) {
                dialog.classList.remove('scale-100');
                dialog.classList.add('scale-95');
            }
            modal.classList.add('opacity-0');
            setTimeout(() => {
                modal.classList.add('hidden');
                isAmbientPaused = false;
                requestAnimationFrame(animateAmbient);

                if (surpriseFlowPurpose === 'games') {
                    surpriseFlowPurpose = 'letter';
                    startSequentialGamesQuest();
                }
            }, 350);
        }

        function resetSurpriseSteps(step = 1) {
            currentSurpriseStep = step;
            selectedMysteryBox = null;

            const step1 = document.getElementById('surpriseStep1');
            const step1Normal = document.getElementById('surpriseStep1Normal');
            const step1Hurt = document.getElementById('surpriseStep1Hurt');
            const step2 = document.getElementById('surpriseStep2');
            const step3 = document.getElementById('surpriseStep3');
            const boxesGrid = document.getElementById('mysteryBoxesGrid');
            const resultCard = document.getElementById('mysteryBoxResultCard');

            if (step1Normal) step1Normal.classList.remove('hidden');
            if (step1Hurt) step1Hurt.classList.add('hidden');

            if (step1) step1.classList.toggle('hidden', step !== 1);
            if (step2) step2.classList.toggle('hidden', step !== 2);
            if (step3) step3.classList.toggle('hidden', step !== 3);

            if (boxesGrid) boxesGrid.classList.remove('hidden');
            if (resultCard) resultCard.classList.add('hidden');

            [1, 2, 3].forEach(id => {
                const card = document.getElementById(`mysteryBoxCard${id}`);
                if (card) {
                    card.classList.remove('ring-4', 'ring-rose-400', 'scale-105', 'opacity-40');
                }
            });
        }

        function showSurpriseHurtScreen() {
            playSadDramaticSound();
            playErrorTone();

            const normal = document.getElementById('surpriseStep1Normal');
            const hurt = document.getElementById('surpriseStep1Hurt');

            if (normal) normal.classList.add('hidden');
            if (hurt) {
                hurt.classList.remove('hidden');
                hurt.classList.remove('animate-wobble');
                void hurt.offsetWidth; // re-trigger animation
                hurt.classList.add('animate-wobble');
            }

            showToast("Arey re! Dil toot gaya bhai ka! 😭💔", "🥺");
        }

        function goToSurpriseStep(step) {
            playBubblePop();
            playChimeSound();

            const step1 = document.getElementById('surpriseStep1');
            const step2 = document.getElementById('surpriseStep2');
            const step3 = document.getElementById('surpriseStep3');

            currentSurpriseStep = step;

            if (step1) step1.classList.toggle('hidden', step !== 1);
            if (step2) step2.classList.toggle('hidden', step !== 2);
            if (step3) step3.classList.toggle('hidden', step !== 3);

            if (step === 2) {
                shootHearts();
                showToast("I knew you couldn't say no! 🤭💖", "✨");
            } else if (step === 3) {
                shootPetals();
                playHarpTone();
                showToast("Choose your lucky mystery box! 🎁✨", "🔮");
            }
        }

        function chooseExcitedOption(choiceText) {
            playBubblePop();
            playChimeSound();
            playHarpTone();
            shootHearts();
            shootPetals();
            showToast(`${choiceText} That's my Didi! 🥳❤️`, "🔥");
            setTimeout(() => {
                goToSurpriseStep(3);
            }, 300);
        }

        function openMysteryBox(boxNum) {
            selectedMysteryBox = boxNum;
            const data = mysteryBoxData[boxNum];
            if (!data) return;

            playBubblePop();
            playChimeSound();
            playHarpTone();
            shootHearts();
            shootPetals();

            // Highlight chosen box and dim others
            [1, 2, 3].forEach(id => {
                const card = document.getElementById(`mysteryBoxCard${id}`);
                if (card) {
                    if (id === boxNum) {
                        card.classList.add('ring-4', 'ring-rose-400', 'scale-105');
                        card.classList.remove('opacity-40');
                    } else {
                        card.classList.remove('ring-4', 'ring-rose-400', 'scale-105');
                        card.classList.add('opacity-40');
                    }
                }
            });

            const badge = document.getElementById('mysteryRevealedBadge');
            const icon = document.getElementById('mysteryRevealedIcon');
            const title = document.getElementById('mysteryRevealedTitle');
            const msg = document.getElementById('mysteryRevealedMsg');
            const resultCard = document.getElementById('mysteryBoxResultCard');

            if (badge) badge.textContent = data.badge;
            if (icon) icon.textContent = data.icon;
            if (title) title.textContent = data.title;
            if (msg) msg.textContent = data.msg;

            if (resultCard) {
                resultCard.classList.remove('hidden');
                resultCard.classList.remove('animate-scale-up');
                void resultCard.offsetWidth;
                resultCard.classList.add('animate-scale-up');
                resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            showToast(`🎁 Box #${boxNum} Unwrapped! Check out your message! 💖`, "🎉");
        }

        function finishSurpriseAndOpenPost() {
            playBubblePop();
            playHarpTone();
            playChimeSound();
            shootHearts();
            shootPetals();

            closeSurpriseFlow();

            if (surpriseFlowPurpose === 'games') {
                surpriseFlowPurpose = 'letter';
                setTimeout(() => {
                    startSequentialGamesQuest();
                    showToast("🎮 Your lucky box opened the 7-game Birthday Quest!", "🎁");
                }, 400);
                return;
            }

            // Keep envelope sealed and scroll to it so the user can manually tap/click to open it
            setTimeout(() => {
                const envelopeWrapper = document.getElementById('envelopeWrapper');
                if (envelopeWrapper) {
                    envelopeWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                showToast("💌 Your special envelope is waiting! Tap to break the wax seal 🌹", "💖");
            }, 400);
        }

        // ==========================================
        // ENVELOPE OPEN, TOGGLE & MESSAGE REVEAL LOGIC
        // ==========================================
        let isLetterOpen = false;

        function toggleEnvelopeState(e) {
            if (e) {
                e.stopPropagation();
            }
            if (isLetterOpen) {
                foldLetterBackUp();
            } else {
                openEnvelopeAndShowLetter();
            }
        }

        function handleLetterCardClick(e) {
            if (e) {
                e.stopPropagation();
            }
            if (!isLetterOpen) {
                openEnvelopeAndShowLetter();
            } else {
                // If already open, clicking the letter card opens the luxury modal letter!
                openLetterModal();
            }
        }

        function openEnvelopeAndShowLetter() {
            const envelopeInner = document.getElementById('envelopeInner');
            const letterSection = document.getElementById('letterSection');
            const replySection = document.getElementById('replySection');
            const openBtnText = document.getElementById('openBtnText');
            const hintText = document.getElementById('envelopeHintText');

            playBubblePop();
            playHarpTone();
            shootPetals();
            shootHearts();

            // 1. Open envelope flap & elevate letter card in 3D
            if (envelopeInner) {
                envelopeInner.classList.add('open');
            }

            // 2. Reveal letter section with animation
            if (letterSection) {
                letterSection.classList.remove('hidden');
                letterSection.classList.add('letter-unfolding');
            }
            if (replySection) {
                replySection.classList.remove('hidden');
            }

            if (openBtnText) {
                openBtnText.textContent = "Envelope Unfolded! (Tap to Fold) ✉️";
            }
            if (hintText) {
                hintText.innerHTML = "<span>✨</span> Envelope opened! Tap card to expand or scroll below <span>💌</span>";
                renderTwemoji(hintText);
            }

            isLetterOpen = true;

            showToast("💌 Envelope opened! Scroll below or tap card for full letter 🌹", "❤️");

            // 3. Smooth scroll down to letter after comfortable delay so opening is fully enjoyed
            setTimeout(() => {
                if (isLetterOpen && letterSection) {
                    letterSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 1200);
        }

        function foldLetterBackUp() {
            const envelopeInner = document.getElementById('envelopeInner');
            const letterSection = document.getElementById('letterSection');
            const replySection = document.getElementById('replySection');
            const openBtnText = document.getElementById('openBtnText');
            const hintText = document.getElementById('envelopeHintText');

            playChimeSound();

            if (envelopeInner) {
                envelopeInner.classList.remove('open');
            }
            if (letterSection) {
                letterSection.classList.add('hidden');
            }
            if (replySection) {
                replySection.classList.add('hidden');
            }
            if (openBtnText) {
                openBtnText.textContent = "Break Wax Seal & Open Envelope";
            }
            if (hintText) {
                hintText.innerHTML = "<span>👇</span> Tap the envelope or wax seal to open your birthday letter <span>👇</span>";
                renderTwemoji(hintText);
            }

            isLetterOpen = false;

            showToast("✉️ Envelope folded back! Tap anytime to reopen 💌", "🌸");
        }

        // Font size adjuster
        let currentFontSizeLevel = 1; // 0: Compact, 1: Normal, 2: Large, 3: Extra Large
        const fontLevelStyles = [
            { label: "Compact", size: "0.95rem", line: "1.75" },
            { label: "Normal", size: "1.08rem", line: "1.88" },
            { label: "Large", size: "1.22rem", line: "1.92" },
            { label: "Extra Large", size: "1.38rem", line: "2.0" }
        ];

        function adjustLetterFontSize(delta) {
            playBubblePop();
            const content = document.getElementById('letterContentText');
            if (!content) return;

            currentFontSizeLevel = Math.max(0, Math.min(fontLevelStyles.length - 1, currentFontSizeLevel + delta));
            const activeLevel = fontLevelStyles[currentFontSizeLevel];
            content.style.fontSize = activeLevel.size;
            content.style.lineHeight = activeLevel.line;
            showToast(`Text size: ${activeLevel.label}`, "🔍");
        }

        // ==========================================
        // FULL-SCREEN POPUP MODAL
        // ==========================================
        function openLetterModal() {
            playBubblePop();
            playHarpTone();
            shootPetals();

            const modalBody = document.getElementById('modalLetterBody');
            const sourceContent = document.getElementById('letterContentText');
            if (modalBody && sourceContent) {
                modalBody.innerHTML = `
                    <div class="pb-6 mb-6 border-b border-rose-200/90 flex justify-between items-start flex-wrap gap-3">
                        <div class="space-y-1">
                            <div class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-slate-700 font-extrabold">
                                <span>💌</span> Handcrafted Birthday Letter • To Kajal Didi
                            </div>
                            <h2 class="font-serif-title font-extrabold text-2xl sm:text-3xl text-slate-900">
                                Happy Birthday, My Dearest Didi 🎂❤️
                            </h2>
                            <p class="text-xs text-rose-700 font-bold">From your little brother • With infinite love & blessings 🤍</p>
                        </div>
                        <div class="border-2 border-dashed border-rose-500 px-3.5 py-1.5 rounded-xl text-xs font-black text-rose-700 tracking-wider uppercase bg-rose-100 rotate-[-2deg]">
                            BIRTHDAY SPECIAL 🎂
                        </div>
                    </div>
                    ${sourceContent.innerHTML}
                `;
            }

            const modal = document.getElementById('letterModal');
            const dialog = document.getElementById('letterDialog');

            isAmbientPaused = true;
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                dialog.classList.remove('scale-95');
                dialog.classList.add('scale-100');
            }, 20);

            showToast("💌 Full-Screen view opened!", "🌹");
        }

        function toggleBrowserFullscreen() {
            playBubblePop();
            if (!document.fullscreenElement) {
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => { });
                } else if (document.documentElement.webkitRequestFullscreen) {
                    document.documentElement.webkitRequestFullscreen();
                }
                showToast("Entered Fullscreen ⛶", "✨");
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen().catch(() => { });
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
                showToast("Exited Fullscreen 🗗", "✨");
            }
        }

        function closeLetterModal() {
            playBubblePop();
            playChimeSound();

            const modal = document.getElementById('letterModal');
            const dialog = document.getElementById('letterDialog');

            dialog.classList.remove('scale-100');
            dialog.classList.add('scale-95');
            modal.classList.add('opacity-0');

            setTimeout(() => {
                modal.classList.add('hidden');
                isAmbientPaused = false;
                requestAnimationFrame(animateAmbient);
            }, 300);
        }

        onDOMReady(() => {
            const letterModalEl = document.getElementById('letterModal');
            if (letterModalEl) {
                letterModalEl.addEventListener('click', function (e) {
                    if (e.target === this) {
                        closeLetterModal();
                    }
                });
            }
        });

        // Toast Helper
        let toastTimeout;
        function showToast(message, icon = "✨") {
            const box = document.getElementById('toastBox');
            const msg = document.getElementById('toastMessage');
            const ico = document.getElementById('toastIcon');

            msg.textContent = message;
            ico.textContent = icon;

            box.classList.remove('translate-y-36');
            clearTimeout(toastTimeout);
            toastTimeout = setTimeout(() => {
                box.classList.add('translate-y-36');
            }, 3500);
        }

        // Full Raw Birthday Letter Text
        const fullLetterRawText = `Happy Birthday, Kajal didi 🥳🎂❤️🫶🏻✨

I hope aapki life hamesha happiness, peace aur lots of love se bhari rahe 🥹💗. May God bless you with everything you truly deserve, aap hamesha smile karti raho aur aapki life mein kabhi khushiyon ki kami na ho 🧿🌸🤍

Aapke saare dreams pure ho, har din aapke liye kuch beautiful lekar aaye, and may you always stay the same lovely person you are 🫶🏻🥰💐

Once again, happiest birthday, didi! 🎉🎂❤️ I hope aapka ye special day aapke liye bahut saari beautiful memories lekar aaye. Keep smiling, keep shining and always stay happy! 🥹🫂💖✨

Lots of love and best wishes for you, didi! ❤️🎀🧿🎂🌷

---

Heyyyyy, Kajal Didi! 🎂🎉🥳
Happy, Happy Birthday to the Most Wonderful Sister in the Whole Universe! 🥹🫶🏻❤️

Today is not just another date on the calendar, Didi. Today is the day the most beautiful, kind-hearted, and pure soul was born into this world! On this very special day, your little brother wanted to make sure you feel truly celebrated, truly cherished, and truly loved. Happy Birthday, Kajal Didi! 🎂✨🌸

Didi, honestly, jab main sochna shuru karta hoon ki aap meri life mein kya importance rakhti ho, toh mere paas words kam pad jaate hain. Zindagi mein bohot log aate hain aur jaate hain, lekin ek 'Didi' ka rishta aisa hota hai jo Rab ka sabse anmol tohfa hota hai. Ek aisi elder sister jo maa jaisa pyaar bhi deti hai, ek best friend jaisa support bhi karti hai, aur har situation mein bina judge kiye sunti hai. 🥹🤍✨

Aapne humesha mujhe ek bachhe ki tarah samjha, meri choti-choti baaton ko patiently handle kiya, aur chahe main kitna bhi ziddi ya silly kyu na behave karoon, aapne humesha apna bada dil dikhaya. Mujhe nahi pata ki main kitna acha bhai ban paaya hoon, lekin ek baat main 1000% claim ke saath keh sakta hoon: Rab ne mujhe duniya ki sabse caring aur pyari didi di hai! 👑❤️

🎂 Bhai's Sincere Birthday Wish For You:
"May every single dream of yours turn into reality this year, Kajal Didi! 🌟"
Meri har dua mein Rab se yahi maangta hoon ki aapke chehre par hamesha woh pyari si muskaan rahe. Aapko kabhi koi dukh ya udaasi chhoo bhi na sake. Aapki life khushiyon, achhi sehat, peace of mind aur successful achievements se bhar jaaye! 🌸🕊️

Didi, main jaanta hoon ki aapne apni life mein bohot kuch dekha aur face kiya hai. Aapne bina shor machaye bohot si cheezon ko akele jhela hai, aur har situation mein apne aap ko sambhala hai. Aapki woh strength, aapka woh soft aur loving nature, aur dusron ke liye care karne ka jazba... yeh sab cheezein aapko sach mein ek angel banati hain. 🥹🤍

Lekin aaj aapka birthday hai, aur aaj main chahta hoon ki aap bas relax karo, dil kholkar muskurao, aur yeh realize karo ki aap kitni precious ho. Aaj ka din sirf aur sirf aapki khushiyon ka din hai! 🎈🍰

🍰 Sweet Moments Ahead: May your life be sweeter than chocolate cake and full of sweet surprises!
🛡️ Bhai's Unbreakable Shield: No matter how old we grow, your little brother will always stand by you!
🍫 Endless Treat Passes: All coffees, pastries, and treats are forever on me!
🕊️ Zero Judgments Safe Zone: Whenever your heart feels heavy, your brother's ears and shoulder are always open!

Bhai Ke 7 Lifetime Birthday Promises:
1. Always Your Chhota Bhai — Chahe main 50 saal ka bhi ho jaaun, aapke saamne wahi chhota bhai rahunga!
2. Aapki Khamoshi Ka Pehredaar — Poori duniya mein kahin bhi, bhai chattan ki tarah peeche khada milega.
3. Safe Haven for Your Tears — Strong banne ka drama nahi karna padega, bhai hamesha sunega.
4. Dooriyan Bas Ek Number Hain — Distance kitna bhi ho, bas ek phone call ki doori rahegi.
5. Pehle Manaunga, Baad Mein Ladunga — No ego ever between us; pehle sorry bolkar gale lagaunga!
6. Aapko Fakr Mehsoos Karwaunga — Acha insaan bankar aapka sar hamesha fakr se ooncha rakhunga!
7. Irreplaceable Kajal Didi — You are irreplaceable. Till my last breath, I love and respect you endlessly!

Happy Birthday once again, Kajal Didi! 🎂🎉🥳
Enjoy your day to the fullest, eat lots of cake, and never forget that you have a brother who loves you, respects you, and prays for you every single day! 🤍🫂✨`;

        function copyLetterText() {
            playBubblePop();
            const letterEl = document.getElementById('letterContentText');
            const letterTextToCopy = (letterEl && letterEl.innerText.trim().length > 100)
                ? letterEl.innerText.trim()
                : fullLetterRawText;

            navigator.clipboard.writeText(letterTextToCopy).then(() => {
                playChimeSound();
                shootConfettiBlast();
                showToast("Full birthday letter copied to clipboard with love! 📋", "🎂");
            }).catch(() => {
                const tempArea = document.createElement('textarea');
                tempArea.value = letterTextToCopy;
                document.body.appendChild(tempArea);
                tempArea.select();
                document.execCommand('copy');
                document.body.removeChild(tempArea);
                playChimeSound();
                shootConfettiBlast();
                showToast("Full birthday letter copied to clipboard! 📋", "🎂");
            });
        }

        function replyOnWhatsApp() {
            playBubblePop();
            const defaultMsg = encodeURIComponent("Heyyy Bhai! 🥹❤️ Thank you so much for this beautiful birthday website and letter! It made my birthday so extra special! Love you so much chote bhai 🎂🎉🫂✨");
            window.open(`https://api.whatsapp.com/send?text=${defaultMsg}`, '_blank');
        }

        function sendDidiReplyWhatsApp() {
            playBubblePop();
            const input = document.getElementById('replyNoteInput');
            const userMsg = input.value.trim() || "Awww Bhai, thank you for the wonderful birthday surprise! 🎂🎉 It made me smile so much! Best brother ever 🥹❤️🫂";
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(userMsg)}`, '_blank');
        }

        function copyDidiReply() {
            playBubblePop();
            const input = document.getElementById('replyNoteInput');
            const userMsg = input.value.trim() || "Awww Bhai, thank you for the wonderful birthday surprise! 🎂🎉 It made me smile so much! Best brother ever 🥹❤️🫂";
            navigator.clipboard.writeText(userMsg).then(() => {
                playChimeSound();
                showToast("Birthday reply copied! You can paste in chat now. 🎂", "📋");
            });
        }

        // ==========================================
        // FRONT WELCOME SCREEN & REDIRECT TO PASSCODE
        // ==========================================
        function goToPasscodeScreen() {
            playBubblePop();
            playChimeSound();
            shootConfettiBlast();
            shootHearts();

            currentFlowState = FLOW_STATES.PASSCODE;
            sessionStorage.setItem('kajal_didi_flow_state', 'passcode');

            const welcomeScreen = document.getElementById('welcomeFrontScreen');
            const passcodeScreen = document.getElementById('passcodeLockScreen');
            const mainContent = document.getElementById('mainCelebrationContent');

            if (mainContent) {
                mainContent.classList.add('hidden');
                mainContent.style.setProperty('display', 'none', 'important');
            }

            if (welcomeScreen) {
                welcomeScreen.classList.add('welcome-fadeout');
                setTimeout(() => {
                    welcomeScreen.classList.add('hidden');
                    welcomeScreen.style.setProperty('display', 'none', 'important');
                    welcomeScreen.classList.remove('welcome-fadeout');

                    if (passcodeScreen) {
                        passcodeScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none', 'scale-105');
                        passcodeScreen.style.setProperty('display', 'flex', 'important');
                        window.scrollTo({ top: 0, behavior: 'instant' });

                        const vaultCard = document.getElementById('vaultCardElement');
                        if (vaultCard) {
                            vaultCard.classList.remove('animate-wobble');
                            void vaultCard.offsetWidth;
                            vaultCard.classList.add('animate-wobble');
                        }
                        const input = document.getElementById('passcodeTextInput');
                        if (input) {
                            setTimeout(() => {
                                try { input.focus(); } catch (e) { }
                            }, 150);
                        }
                        renderTwemoji(passcodeScreen);
                        showToast("🔐 Step 2: Solve Bhai's Cipher to unlock your surprise! 🎂", "💡");
                    }
                }, 320);
            } else if (passcodeScreen) {
                passcodeScreen.classList.remove('hidden', 'opacity-0', 'pointer-events-none', 'scale-105');
                passcodeScreen.style.setProperty('display', 'flex', 'important');
                window.scrollTo({ top: 0, behavior: 'instant' });
                renderTwemoji(passcodeScreen);
            }
        }

        function returnToWelcomeScreen() {
            playBubblePop();
            playChimeSound();
            shootPetals();

            currentFlowState = FLOW_STATES.BANNER;
            sessionStorage.setItem('kajal_didi_flow_state', 'banner');

            const welcomeScreen = document.getElementById('welcomeFrontScreen');
            const passcodeScreen = document.getElementById('passcodeLockScreen');
            const mainContent = document.getElementById('mainCelebrationContent');

            if (mainContent) {
                mainContent.classList.add('hidden');
                mainContent.style.setProperty('display', 'none', 'important');
            }
            if (passcodeScreen) {
                passcodeScreen.classList.add('hidden');
                passcodeScreen.style.setProperty('display', 'none', 'important');
            }
            if (welcomeScreen) {
                welcomeScreen.classList.remove('hidden', 'welcome-fadeout');
                welcomeScreen.style.setProperty('display', 'flex', 'important');
                window.scrollTo({ top: 0, behavior: 'instant' });
                renderTwemoji(welcomeScreen);
                showToast("✨ Welcome back to Kajal Didi's Birthday Page! 🌸", "👑");
            }
        }

        function openWelcomeFrontScreen() {
            returnToWelcomeScreen();
        }

        let isWelcomeCakeBlown = false;
        function blowWelcomeCake() {
            const flame = document.getElementById('welcomeCandleFlame');
            const cakeStatus = document.getElementById('welcomeCakeStatus');
            playChimeSound();
            playHarpTone();
            shootConfettiBlast();
            shootHearts();

            if (flame) {
                if (!isWelcomeCakeBlown) {
                    flame.innerHTML = '💨';
                    renderTwemoji(flame);
                    setTimeout(() => {
                        flame.innerHTML = '✨';
                        renderTwemoji(flame);
                    }, 700);
                    if (cakeStatus) {
                        cakeStatus.innerHTML = '🎂 <strong>Woohoo! Candle blown!</strong> Wish sent to the stars! ⭐💖';
                        renderTwemoji(cakeStatus);
                    }
                    showToast("🕯️ Candle blown! May all your heartfelt wishes come true, Didi! 💖✨", "🎉");
                    isWelcomeCakeBlown = true;
                } else {
                    flame.innerHTML = '🔥';
                    renderTwemoji(flame);
                    if (cakeStatus) {
                        cakeStatus.textContent = 'Tap here to blow out the candle flame and send your dream to the stars! ✨';
                        renderTwemoji(cakeStatus);
                    }
                    showToast("🕯️ Candle re-lit! Make another wish anytime! 🎂", "✨");
                    isWelcomeCakeBlown = false;
                }
            }
        }

        // ==========================================
        // BHAI'S FINAL SECRET VAULT (Password: "noor")
        // ==========================================
        const FINAL_VAULT_PASSWORD = "noor";

        function toggleFinalVaultPassVisibility() {
            playBubblePop();
            const input = document.getElementById('finalVaultPassInput');
            const icon = document.getElementById('finalVaultEyeIcon');
            if (!input || !icon) return;
            if (input.type === 'password') {
                input.type = 'text';
                icon.textContent = '🙈';
            } else {
                input.type = 'password';
                icon.textContent = '👁️';
            }
        }

        function unlockFinalSecretVault() {
            const input = document.getElementById('finalVaultPassInput');
            const statusMsg = document.getElementById('finalVaultStatusMsg');
            const vaultCard = document.getElementById('finalVaultCard');
            const lockedView = document.getElementById('finalVaultLockedView');
            const unlockedView = document.getElementById('finalVaultUnlockedView');
            const lockIcon = document.getElementById('finalVaultLockIcon');

            if (!input) return;
            const entered = input.value.trim().toLowerCase();

            if (entered === FINAL_VAULT_PASSWORD) {
                // Correct Password!
                playChimeSound();
                playHarpTone();
                shootHearts();
                shootConfettiBlast();

                if (lockIcon) {
                    lockIcon.textContent = "🔓";
                    lockIcon.classList.add('scale-125');
                }

                if (statusMsg) {
                    statusMsg.textContent = "✨ Secret Key Accepted! Unlocking... 💖";
                    statusMsg.className = "text-xs font-black text-emerald-600 animate-pulse";
                }

                setTimeout(() => {
                    if (lockedView) lockedView.classList.add('hidden');
                    if (unlockedView) {
                        unlockedView.classList.remove('hidden');
                        renderTwemoji(unlockedView);
                    }
                    const msgBox = document.getElementById('finalSecretMessageBox');
                    if (msgBox) {
                        msgBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    showToast("✨ Secret Vault Unlocked! Bhai's letter box revealed 💌", "🔓");
                }, 350);

            } else {
                // Incorrect Password!
                playErrorTone();
                if (vaultCard) {
                    vaultCard.classList.remove('animate-wobble');
                    void vaultCard.offsetWidth; // force reflow
                    vaultCard.classList.add('animate-wobble');
                }
                input.classList.add('border-red-400', 'bg-red-50/80');
                setTimeout(() => {
                    input.classList.remove('border-red-400', 'bg-red-50/80');
                }, 800);

                if (statusMsg) {
                    statusMsg.textContent = "Incorrect secret key! 🔑 Try again (Hint: 4-letter special word)";
                    statusMsg.className = "text-xs font-bold text-rose-600";
                }
                showToast("Incorrect key! Ask Bhai for the password 🔐", "❌");
            }
        }

        function lockFinalSecretVault() {
            playBubblePop();
            const lockedView = document.getElementById('finalVaultLockedView');
            const unlockedView = document.getElementById('finalVaultUnlockedView');
            const input = document.getElementById('finalVaultPassInput');
            const statusMsg = document.getElementById('finalVaultStatusMsg');
            const lockIcon = document.getElementById('finalVaultLockIcon');

            if (unlockedView) unlockedView.classList.add('hidden');
            if (lockedView) lockedView.classList.remove('hidden');

            if (input) {
                input.value = "";
                input.type = "password";
            }
            const eyeIcon = document.getElementById('finalVaultEyeIcon');
            if (eyeIcon) eyeIcon.textContent = '👁️';

            if (lockIcon) {
                lockIcon.textContent = "🔒";
                lockIcon.classList.remove('scale-125');
            }

            if (statusMsg) {
                statusMsg.textContent = "Enter secret password to open";
                statusMsg.className = "text-xs font-bold text-slate-500";
            }

            const vaultSec = document.getElementById('finalSecretVaultSection');
            if (vaultSec) {
                vaultSec.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            showToast("Secret Vault locked! 🔐", "🔒");
        }

        function scrollToSecretVault() {
            playBubblePop();
            const sec = document.getElementById('finalSecretVaultSection');
            if (sec) {
                sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        onDOMReady(() => {

            // Final Secret Vault Enter Key listener
            const vaultInput = document.getElementById('finalVaultPassInput');
            if (vaultInput) {
                vaultInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        unlockFinalSecretVault();
                    }
                });
            }

            // Ensure the newly supplied photo is active everywhere (clear stale cache)
            try {
                localStorage.removeItem('kajal_didi_custom_photo');
            } catch (e) { }

            renderBrotherVows();

            // Celebratory entrance confetti blast & greeting
            setTimeout(() => {
                try {
                    shootConfettiBlast();
                    showToast("🎂 Happy Birthday to Kajal Didi! 💖🌸", "👑");
                } catch (e) { }
            }, 600);

            const options = { month: 'long', day: 'numeric', year: 'numeric' };
            const todayStr = new Date().toLocaleDateString(undefined, options);

            const dateDisplay = document.getElementById('todayDateStr');
            if (dateDisplay) dateDisplay.textContent = todayStr;

            const inlineDate = document.getElementById('letterInlineDate');
            if (inlineDate) inlineDate.textContent = `Penned with warmth • ${todayStr}`;

            // Pre-populate modalLetterBody so Full-Screen Mode instantly has the full message
            const modalBody = document.getElementById('modalLetterBody');
            const sourceContent = document.getElementById('letterContentText');
            if (modalBody && sourceContent) {
                modalBody.innerHTML = `
                    <div class="pb-6 mb-6 border-b border-rose-200/90 flex justify-between items-start flex-wrap gap-3">
                        <div class="space-y-1">
                            <div class="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest text-slate-700 font-extrabold">
                                <span>💌</span> Handcrafted Birthday Letter • To Kajal Didi
                            </div>
                            <h2 class="font-serif-title font-extrabold text-2xl sm:text-3xl text-slate-900">
                                Happy Birthday, My Dearest Didi 🎂❤️
                            </h2>
                            <p class="text-xs text-rose-700 font-bold">From your little brother • With infinite love & blessings 🤍</p>
                        </div>
                        <div class="border-2 border-dashed border-rose-500 px-3.5 py-1.5 rounded-xl text-xs font-black text-rose-700 tracking-wider uppercase bg-rose-100 rotate-[-2deg]">
                            BIRTHDAY SPECIAL 🎂
                        </div>
                    </div>
                    ${sourceContent.innerHTML}
                `;
            }

            // Initialize Birthday Games Arcade safely
            try {
                initTicTacToe();
                initFortuneWheel();
            } catch (e) {
                console.warn('Initial game load notice:', e);
            }

            // Restore Sequential Flow State on Page Refresh
            try {
                const savedFlow = sessionStorage.getItem('kajal_didi_flow_state');
                const savedUnlocked = sessionStorage.getItem('kajal_didi_unlocked_games');
                if (savedUnlocked) {
                    try { unlockedQuestGames = JSON.parse(savedUnlocked); } catch (e) { }
                }

                if (savedFlow === 'celebration') {
                    unlockFinalCelebration(true);
                } else if (savedFlow && ['zerocross', 'wordfinder', 'memory', 'balloon', 'wheel', 'quiz', 'wishes'].includes(savedFlow)) {
                    isPasscodeCracked = true;
                    const welcome = document.getElementById('welcomeFrontScreen');
                    if (welcome) {
                        welcome.classList.add('hidden');
                        welcome.style.setProperty('display', 'none', 'important');
                    }
                    const lockScreen = document.getElementById('passcodeLockScreen');
                    if (lockScreen) {
                        lockScreen.classList.add('hidden');
                        lockScreen.style.setProperty('display', 'none', 'important');
                    }
                    isQuestActive = true;
                    currentFlowState = savedFlow;
                    const mainContent = document.getElementById('mainCelebrationContent');
                    if (mainContent) {
                        mainContent.classList.add('quest-mode');
                        mainContent.classList.remove('hidden');
                        mainContent.style.setProperty('display', 'flex', 'important');
                    }
                    const arcade = document.getElementById('sisterGamesArcadeSection');
                    if (arcade) {
                        arcade.classList.remove('hidden');
                        arcade.style.removeProperty('display');
                    }

                    // Unlock already completed tabs
                    unlockedQuestGames.forEach(k => {
                        const btn = document.getElementById(`tabBtn_${k}`);
                        if (btn) btn.classList.remove('locked');
                        const ico = document.getElementById(`tabIcon_${k}`);
                        if (ico) {
                            const defaultIcons = {
                                zerocross: "⭕❌",
                                wordfinder: "🔤",
                                memory: "🃏",
                                balloon: "🎈",
                                wheel: "🎡",
                                quiz: "🧠",
                                wishes: "💌"
                            };
                            ico.textContent = defaultIcons[k] || "🎮";
                        }
                    });

                    updateQuestProgressBar(savedFlow);
                    switchArcadeGame(savedFlow, false);
                }
            } catch (e) { }

            // Render crisp emojis (optimized for instant mobile rendering)
            renderTwemoji();
        });

        // ==========================================
        // TWEMOJI COLOR EMOJI VECTOR PARSER (Mobile High-Performance Native Fallback)
        // ==========================================
        function renderTwemoji(targetEl) {
            // Mobile operating systems (iOS and Android) have hardware-accelerated, high-resolution
            // native color emoji fonts (Apple Color Emoji, Google Noto Color Emoji).
            // Replacing them with 150+ individual remote SVGs blocks the mobile network queue and freezes the main thread.
            const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
            if (isMobileDevice) {
                return;
            }
            try {
                if (typeof twemoji !== 'undefined') {
                    twemoji.parse(targetEl || document.body, {
                        folder: 'svg',
                        ext: '.svg',
                        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
                    });
                }
            } catch (e) {
                console.warn('Twemoji parser notice:', e);
            }
        }

        // ========================================================
        // KAJAL DIDI'S BIRTHDAY GAMES ARCADE LOGIC
        // 1. Zero Cross (Tic-Tac-Toe: Didi vs Bhai)
        // 2. Word Finder (Sister Birthday Word Search)
        // 3. Memory Match (Birthday Pair Match)
        // 4. Balloon Pop Carnival
        // 5. Wheel of Birthday Fortunes
        // ========================================================

        // ========================================================
        // SEQUENTIAL BIRTHDAY GAMES QUEST STATE MACHINE
        // Order: BANNER -> PASSCODE -> ZERO CROSS -> WORD FINDER
        //        -> MEMORY MATCH -> BALLOON POP -> FORTUNE WHEEL -> CELEBRATION
        // ========================================================
        const FLOW_STATES = {
            BANNER: 'banner',
            PASSCODE: 'passcode',
            GAME_1: 'zerocross',
            GAME_2: 'wordfinder',
            GAME_3: 'memory',
            GAME_4: 'balloon',
            GAME_5: 'wheel',
            GAME_6: 'quiz',
            GAME_7: 'wishes',
            CELEBRATION: 'celebration'
        };

        const QUEST_GAME_SEQUENCE = ['zerocross', 'wordfinder', 'memory', 'balloon', 'wheel', 'quiz', 'wishes'];
        let currentFlowState = FLOW_STATES.BANNER;
        let isQuestActive = true;
        let unlockedQuestGames = ['zerocross'];
        let currentActiveArcadeGame = 'zerocross';

        function scrollToGamesArcade(gameTab = null) {
            playBubblePop();
            const sec = document.getElementById('sisterGamesArcadeSection');
            if (sec) {
                sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            if (gameTab) {
                switchArcadeGame(gameTab, true);
            }
        }

        function startSequentialGamesQuest() {
            isQuestActive = true;
            currentFlowState = FLOW_STATES.GAME_1;
            try {
                sessionStorage.setItem('kajal_didi_flow_state', 'zerocross');
            } catch (e) { }

            window.scrollTo({ top: 0, behavior: 'instant' });

            const welcome = document.getElementById('welcomeFrontScreen');
            if (welcome) {
                welcome.classList.add('hidden');
                welcome.style.setProperty('display', 'none', 'important');
            }
            const lockScreen = document.getElementById('passcodeLockScreen');
            if (lockScreen) {
                lockScreen.classList.add('hidden');
                lockScreen.style.setProperty('display', 'none', 'important');
            }

            const mainContent = document.getElementById('mainCelebrationContent');
            if (mainContent) {
                mainContent.classList.add('quest-mode');
                mainContent.classList.remove('hidden');
                mainContent.style.setProperty('display', 'flex', 'important');
            }

            const arcade = document.getElementById('sisterGamesArcadeSection');
            if (arcade) {
                arcade.classList.remove('hidden');
                arcade.style.removeProperty('display');
            }

            // Ensure first game tab is unlocked
            if (!unlockedQuestGames.includes('zerocross')) {
                unlockedQuestGames.push('zerocross');
            }
            const tabBtnZero = document.getElementById('tabBtn_zerocross');
            if (tabBtnZero) tabBtnZero.classList.remove('locked');

            updateQuestProgressBar('zerocross');
            switchArcadeGame('zerocross', false);

            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                if (arcade) {
                    arcade.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                showToast("🎮 Challenge 1 of 7: Defeat Bhai in Zero Cross! 🌸", "👑");
            }, 100);
        }

        function markQuestGameComplete(currentKey, nextKey) {
            const banner = document.getElementById(`questNextBanner_${currentKey}`);
            if (banner) {
                banner.classList.remove('hidden');
            }
            const tabBtn = document.getElementById(`tabBtn_${currentKey}`);
            if (tabBtn) {
                tabBtn.classList.add('completed');
            }
            if (nextKey && nextKey !== 'celebration') {
                if (!unlockedQuestGames.includes(nextKey)) {
                    unlockedQuestGames.push(nextKey);
                    sessionStorage.setItem('kajal_didi_unlocked_games', JSON.stringify(unlockedQuestGames));
                }
                const nextTabBtn = document.getElementById(`tabBtn_${nextKey}`);
                if (nextTabBtn) {
                    nextTabBtn.classList.remove('locked');
                    const iconEl = document.getElementById(`tabIcon_${nextKey}`);
                    if (iconEl) {
                        const defaultIcons = {
                            zerocross: "⭕❌",
                            wordfinder: "🔤",
                            memory: "🃏",
                            balloon: "🎈",
                            wheel: "🎡",
                            quiz: "🧠",
                            wishes: "💌"
                        };
                        iconEl.textContent = defaultIcons[nextKey] || "🎮";
                    }
                }
            } else if (nextKey === 'celebration') {
                const grandBanner = document.getElementById('questNextBanner_wishes');
                if (grandBanner) grandBanner.classList.remove('hidden');
            }
        }

        function advanceToNextQuestGame(nextGameKey) {
            playBubblePop();
            playChimeSound();

            if (!unlockedQuestGames.includes(nextGameKey)) {
                unlockedQuestGames.push(nextGameKey);
                sessionStorage.setItem('kajal_didi_unlocked_games', JSON.stringify(unlockedQuestGames));
            }
            const nextTabBtn = document.getElementById(`tabBtn_${nextGameKey}`);
            if (nextTabBtn) {
                nextTabBtn.classList.remove('locked');
            }

            currentFlowState = nextGameKey;
            sessionStorage.setItem('kajal_didi_flow_state', nextGameKey);

            updateQuestProgressBar(nextGameKey);
            switchArcadeGame(nextGameKey, false);

            const arcadeSec = document.getElementById('sisterGamesArcadeSection');
            if (arcadeSec) {
                arcadeSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            showToast(`✨ Next Challenge Unlocked: ${nextGameKey.toUpperCase()}! 💖`, "🎮");
        }

        function skipCurrentArcadeGame() {
            playBubblePop();
            playChimeSound();

            const sequence = ['zerocross', 'wordfinder', 'memory', 'balloon', 'wheel', 'quiz', 'wishes'];

            // Find current active game from currentActiveArcadeGame or visible panel
            let currentGame = currentActiveArcadeGame;
            if (!currentGame || !sequence.includes(currentGame)) {
                for (const k of sequence) {
                    const p = document.getElementById(`gamePanel_${k}`);
                    if (p && !p.classList.contains('hidden')) {
                        currentGame = k;
                        break;
                    }
                }
            }
            if (!currentGame) currentGame = 'zerocross';

            const currentIndex = sequence.indexOf(currentGame);

            // Clean up any running state in the skipped game
            try {
                if (typeof isAITurn !== 'undefined') isAITurn = false;
                if (typeof wfSelectedCoords !== 'undefined') wfSelectedCoords = [];
                if (typeof memoryIsLocked !== 'undefined') memoryIsLocked = false;
                if (typeof memoryFlippedIndices !== 'undefined') memoryFlippedIndices = [];
                if (typeof balloonIsRunning !== 'undefined') {
                    balloonIsRunning = false;
                    if (typeof balloonInterval !== 'undefined') clearInterval(balloonInterval);
                }
                if (typeof isWheelSpinning !== 'undefined') isWheelSpinning = false;
            } catch (e) {}

            // Mark skipped game's tab as completed
            const curTab = document.getElementById(`tabBtn_${currentGame}`);
            if (curTab) {
                curTab.classList.remove('locked');
                curTab.classList.add('completed');
            }

            const gameTitles = {
                zerocross: "Zero Cross 🌸",
                wordfinder: "Word Finder 🔍",
                memory: "Memory Match 🃏",
                balloon: "Balloon Pop 🎈",
                wheel: "Fortune Wheel 🎡",
                quiz: "Birthday Quiz 🧠",
                wishes: "Wish Builder 💌"
            };

            if (currentIndex < sequence.length - 1) {
                const nextGame = sequence[currentIndex + 1];

                if (isQuestActive) {
                    markQuestGameComplete(currentGame, nextGame);
                    advanceToNextQuestGame(nextGame);
                } else {
                    switchArcadeGame(nextGame, false);
                    updateQuestProgressBar(nextGame);
                }

                shootHearts();
                setTimeout(() => {
                    showToast(`⏩ Skipped to Challenge ${currentIndex + 2}: ${gameTitles[nextGame] || nextGame}! 💖`, "⏭️");
                }, 150);
            } else {
                // If on the 7th game (wishes), skipping clears all games and unlocks the celebration!
                if (isQuestActive) {
                    markQuestGameComplete('wishes', 'celebration');
                    unlockFinalCelebration(false);
                } else {
                    switchArcadeGame(sequence[0], false);
                    updateQuestProgressBar(sequence[0]);
                }
                shootConfettiBlast();
                setTimeout(() => {
                    showToast("👑 All Birthday Challenges Cleared! Welcome Didi! 🎂🎉", "✨");
                }, 150);
            }
        }
        window.skipCurrentArcadeGame = skipCurrentArcadeGame;

        function updateQuestProgressBar(gameKey) {
            const sequence = ['zerocross', 'wordfinder', 'memory', 'balloon', 'wheel', 'quiz', 'wishes'];
            const idx = sequence.indexOf(gameKey);
            const stepNum = idx !== -1 ? idx + 1 : 1;
            const titles = {
                zerocross: "Zero Cross 🌸",
                wordfinder: "Word Finder 🔍",
                memory: "Memory Match 🃏",
                balloon: "Balloon Pop 🎈",
                wheel: "Fortune Wheel 🎡",
                quiz: "Birthday Quiz 🧠",
                wishes: "Wish Builder 💌"
            };

            const stepNumEl = document.getElementById('questCurrentStepNum');
            const titleEl = document.getElementById('questCurrentGameTitle');
            const percentEl = document.getElementById('questPercentLabel');
            const fillEl = document.getElementById('questProgressBarFill');

            if (stepNumEl) stepNumEl.textContent = stepNum;
            if (titleEl) titleEl.textContent = titles[gameKey] || "Birthday Quest";
            const progress = Math.round(stepNum / sequence.length * 100);
            if (percentEl) percentEl.textContent = `${progress}%`;
            if (fillEl) fillEl.style.width = `${progress}%`;
        }

        function unlockFinalCelebration(isSilentRestore = false) {
            isQuestActive = false;
            currentFlowState = FLOW_STATES.CELEBRATION;
            sessionStorage.setItem('kajal_didi_flow_state', 'celebration');

            // Hide initial welcome & passcode screens
            const welcome = document.getElementById('welcomeFrontScreen');
            if (welcome) {
                welcome.classList.add('hidden');
                welcome.style.setProperty('display', 'none', 'important');
            }
            const lockScreen = document.getElementById('passcodeLockScreen');
            if (lockScreen) {
                lockScreen.classList.add('hidden');
                lockScreen.style.setProperty('display', 'none', 'important');
            }

            // Remove quest-mode so all celebration-exclusive sections appear
            const mainContent = document.getElementById('mainCelebrationContent');
            if (mainContent) {
                mainContent.classList.remove('quest-mode', 'hidden');
                mainContent.style.setProperty('display', 'flex', 'important');
            }

            // Unhide Bhai's Floating Collage Quick Pill Button
            const pillBtn = document.getElementById('bhaiFloatingPillBtn');
            if (pillBtn) {
                pillBtn.classList.remove('hidden');
            }

            // Unlock all game tabs for free replay
            const allGames = ['zerocross', 'wordfinder', 'memory', 'balloon', 'wheel', 'quiz', 'wishes'];
            const defaultIcons = {
                zerocross: "⭕❌",
                wordfinder: "🔤",
                memory: "🃏",
                balloon: "🎈",
                wheel: "🎡",
                quiz: "🧠",
                wishes: "💌"
            };
            allGames.forEach(key => {
                const btn = document.getElementById(`tabBtn_${key}`);
                if (btn) {
                    btn.classList.remove('locked');
                    btn.classList.add('completed');
                }
                const ico = document.getElementById(`tabIcon_${key}`);
                if (ico) ico.textContent = defaultIcons[key];
            });

            // Update quest tracker banner to completed badge
            const tracker = document.getElementById('questProgressTracker');
            if (tracker) {
                tracker.innerHTML = `
                    <div class="flex items-center justify-between text-xs font-black text-emerald-800 uppercase tracking-wider">
                        <span class="flex items-center gap-1.5">
                            <span>👑</span>
                            <span>ALL 7 CHALLENGES CONQUERED • PLAY ANYTIME DIDI!</span>
                            <span>🌸</span>
                        </span>
                        <span class="text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-full">100% ✓</span>
                    </div>
                `;
            }

            if (!isSilentRestore) {
                // Celebratory music and fanfare
                playChimeSound();
                playHarpTone();
                playHappyBirthdaySong();
                shootConfettiBlast();
                shootHearts();

                // Scroll smoothly to hero celebration header
                setTimeout(() => {
                    const hero = document.getElementById('celebrationPrimarySections') || mainContent;
                    if (hero) {
                        hero.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                    resizeCanvas();
                    openSurpriseFlow(1);
                }, 450);

                showToast("🎂 Welcome to Kajal Didi's Full Birthday Celebration! 💖🌸", "🎉");
            } else {
                resizeCanvas();
            }
        }

        function switchArcadeGame(gameKey, isUserClick = true) {
            if (isQuestActive && isUserClick) {
                if (!unlockedQuestGames.includes(gameKey)) {
                    playBubblePop();
                    playErrorTone();
                    showToast("🔒 Complete the current challenge first to unlock this game!", "🔐");
                    return;
                }
            }

            playBubblePop();
            currentActiveArcadeGame = gameKey;
            if (isQuestActive) {
                updateQuestProgressBar(gameKey);
            }

            // If switching away from balloon, pause balloon spawner cleanly
            if (gameKey !== 'balloon' && typeof balloonIsRunning !== 'undefined' && balloonIsRunning) {
                balloonIsRunning = false;
                if (typeof balloonInterval !== 'undefined') clearInterval(balloonInterval);
                const overlay = document.getElementById('balloonStartOverlay');
                if (overlay) overlay.classList.remove('hidden');
            }

            const games = ['zerocross', 'wordfinder', 'memory', 'balloon', 'wheel', 'quiz', 'wishes'];
            games.forEach(key => {
                const btn = document.getElementById(`tabBtn_${key}`);
                const panel = document.getElementById(`gamePanel_${key}`);
                if (btn) {
                    if (key === gameKey) {
                        btn.classList.add('active');
                    } else {
                        btn.classList.remove('active');
                    }
                }
                if (panel) {
                    if (key === gameKey) {
                        panel.classList.remove('hidden');
                        panel.style.removeProperty('display');
                    } else {
                        panel.classList.add('hidden');
                    }
                }
            });

            // Lazy initialize selected game safely
            try {
                if (gameKey === 'zerocross') {
                    initTicTacToe();
                } else if (gameKey === 'wordfinder') {
                    initWordFinder();
                } else if (gameKey === 'memory') {
                    if (!memoryInitialized || memoryCards.length === 0) {
                        initMemoryGame();
                    } else {
                        renderMemoryGrid();
                    }
                } else if (gameKey === 'balloon') {
                    const overlay = document.getElementById('balloonStartOverlay');
                    if (overlay && !balloonIsRunning) overlay.classList.remove('hidden');
                } else if (gameKey === 'wheel') {
                    drawFortuneWheel();
                    setTimeout(() => drawFortuneWheel(), 60);
                }
            } catch (err) {
                console.warn("Game initialization notice:", err);
            }
        }

        // --------------------------------------------------------
        // 6–7. SHORT BIRTHDAY FINALE CHALLENGES
        // --------------------------------------------------------
        let birthdayWishesCollected = new Set();

        function answerBirthdayQuiz(isCorrect) {
            const status = document.getElementById('quizStatus');
            if (!isCorrect) {
                playErrorTone();
                if (status) status.textContent = 'Cute answer, but the real superpower is her kind heart! Try again. 💖';
                return;
            }
            playChimeSound();
            shootHearts();
            if (status) status.textContent = 'Exactly! Kindness makes every day feel like a celebration. 👑';
            if (isQuestActive) markQuestGameComplete('quiz', 'wishes');
        }

        function collectBirthdayWish(wish) {
            birthdayWishesCollected.add(wish);
            const button = document.getElementById(`wishBtn_${wish}`);
            if (button) {
                button.classList.add('ring-2', 'ring-rose-400', 'scale-105', 'bg-white');
                button.disabled = true;
            }
            playBubblePop();
            const status = document.getElementById('wishStatus');
            if (status) status.textContent = `${birthdayWishesCollected.size} of 3 blessings collected.`;
            if (birthdayWishesCollected.size === 3) {
                playHarpTone();
                shootConfettiBlast();
                if (status) status.textContent = 'Perfect! Your complete birthday wish is ready. 💌';
                if (isQuestActive) markQuestGameComplete('wishes', 'celebration');
            }
        }

        // --------------------------------------------------------
        // 1. ZERO CROSS (TIC-TAC-TOE: DIDI VS BHAI)
        // --------------------------------------------------------
        let tttBoard = Array(9).fill(null);
        let tttCurrentTurn = 'didi'; // 'didi' (🌸) or 'bhai' (👑)
        let tttMode = 'ai'; // 'ai' or '2p'
        let tttGameOver = false;
        let tttInitialized = false;
        let tttScoreDidi = 0;
        let tttScoreBhai = 0;
        let tttScoreTies = 0;

        const TTT_WINNING_COMBOS = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        function initTicTacToe() {
            tttInitialized = true;
            renderTicTacToeBoard();
        }

        function setTicTacToeMode(mode) {
            playBubblePop();
            tttMode = mode;
            const btnAi = document.getElementById('tttModeVsAi');
            const btn2p = document.getElementById('tttMode2P');
            if (mode === 'ai') {
                if (btnAi) btnAi.className = 'px-2.5 py-1 rounded-lg font-black transition text-rose-800 bg-white shadow-xs';
                if (btn2p) btn2p.className = 'px-2.5 py-1 rounded-lg font-bold transition text-slate-600 hover:text-rose-800';
            } else {
                if (btn2p) btn2p.className = 'px-2.5 py-1 rounded-lg font-black transition text-rose-800 bg-white shadow-xs';
                if (btnAi) btnAi.className = 'px-2.5 py-1 rounded-lg font-bold transition text-slate-600 hover:text-rose-800';
            }
            resetTicTacToe(true);
        }

        function renderTicTacToeBoard() {
            const container = document.getElementById('tttBoardGrid');
            if (!container) return;
            container.innerHTML = '';

            for (let i = 0; i < 9; i++) {
                const cell = document.createElement('div');
                cell.className = 'ttt-cell';
                cell.id = `tttCell_${i}`;
                if (tttBoard[i]) {
                    cell.textContent = tttBoard[i] === 'X' ? '🌸' : '👑';
                    cell.classList.add('taken');
                }
                cell.onclick = () => handleTicTacToeCellClick(i);
                container.appendChild(cell);
            }
        }

        function handleTicTacToeCellClick(idx) {
            if (tttGameOver || tttBoard[idx]) return;

            if (tttMode === 'ai' && tttCurrentTurn !== 'didi') return;

            makeTicTacToeMove(idx, tttCurrentTurn === 'didi' ? 'X' : 'O');

            const winResult = checkTicTacToeWin(tttBoard);
            if (winResult) {
                handleTicTacToeWin(winResult);
                return;
            }

            if (tttBoard.every(cell => cell !== null)) {
                handleTicTacToeTie();
                return;
            }

            if (tttMode === 'ai') {
                tttCurrentTurn = 'bhai';
                const statusEl = document.getElementById('tttStatusText');
                if (statusEl) statusEl.textContent = '👑 Bhai is planning his move... 🤔';

                setTimeout(() => {
                    bhaiAiMove();
                }, 380);
            } else {
                tttCurrentTurn = tttCurrentTurn === 'didi' ? 'bhai' : 'didi';
                const statusEl = document.getElementById('tttStatusText');
                if (statusEl) {
                    statusEl.textContent = tttCurrentTurn === 'didi' 
                        ? "🌸 Didi's turn! Place your flower!" 
                        : "👑 Bhai's turn! Place your crown!";
                }
            }
        }

        function makeTicTacToeMove(idx, mark) {
            tttBoard[idx] = mark;
            playBubblePop();
            const cell = document.getElementById(`tttCell_${idx}`);
            if (cell) {
                cell.textContent = mark === 'X' ? '🌸' : '👑';
                cell.classList.add('taken', 'animate-scale-up');
            }
        }

        function bhaiAiMove() {
            if (tttGameOver) return;

            // 1. Check if Bhai can win this turn (with playful restraint so Didi can shine!)
            let move = -1;
            if (Math.random() > 0.4) {
                move = findWinningMove('O');
            }
            // 2. Check if Didi can win and block her (with 45% playful blunder so Didi wins easily!)
            if (move === -1 && Math.random() > 0.45) {
                move = findWinningMove('X');
            }
            // 3. Prefer center if available
            if (move === -1 && tttBoard[4] === null && Math.random() > 0.35) move = 4;
            // 4. Prefer corners
            if (move === -1) {
                const corners = [0, 2, 6, 8].filter(i => tttBoard[i] === null);
                if (corners.length > 0 && Math.random() > 0.4) {
                    move = corners[Math.floor(Math.random() * corners.length)];
                }
            }
            // 5. Any open cell
            if (move === -1) {
                const available = tttBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
                if (available.length > 0) {
                    move = available[Math.floor(Math.random() * available.length)];
                }
            }

            if (move !== -1) {
                makeTicTacToeMove(move, 'O');

                const winResult = checkTicTacToeWin(tttBoard);
                if (winResult) {
                    handleTicTacToeWin(winResult);
                    return;
                }

                if (tttBoard.every(cell => cell !== null)) {
                    handleTicTacToeTie();
                    return;
                }

                tttCurrentTurn = 'didi';
                const statusEl = document.getElementById('tttStatusText');
                if (statusEl) statusEl.textContent = "🌸 Didi's turn! Make your royal move!";
            }
        }

        function findWinningMove(mark) {
            for (let combo of TTT_WINNING_COMBOS) {
                const [a, b, c] = combo;
                const vals = [tttBoard[a], tttBoard[b], tttBoard[c]];
                if (vals.filter(v => v === mark).length === 2 && vals.filter(v => v === null).length === 1) {
                    if (tttBoard[a] === null) return a;
                    if (tttBoard[b] === null) return b;
                    if (tttBoard[c] === null) return c;
                }
            }
            return -1;
        }

        function checkTicTacToeWin(board) {
            for (let combo of TTT_WINNING_COMBOS) {
                const [a, b, c] = combo;
                if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                    return { winner: board[a], combo };
                }
            }
            return null;
        }

        function handleTicTacToeWin(result) {
            tttGameOver = true;
            result.combo.forEach(idx => {
                const cell = document.getElementById(`tttCell_${idx}`);
                if (cell) cell.classList.add('winner-cell');
            });

            const statusEl = document.getElementById('tttStatusText');
            if (result.winner === 'X') {
                // Didi Won!
                tttScoreDidi++;
                document.getElementById('tttScoreDidi').textContent = tttScoreDidi;
                playChimeSound();
                playHarpTone();
                shootConfettiBlast();
                shootHearts();
                if (statusEl) {
                    statusEl.textContent = '👑 DIDI WINS! The Birthday Queen reigns supreme! 🌸💖';
                }
                showToast("👑 Didi won the match! Birthday Queen superpower! 🌸", "🎉");
                if (isQuestActive) {
                    markQuestGameComplete('zerocross', 'wordfinder');
                }
            } else {
                // Bhai Won!
                tttScoreBhai++;
                document.getElementById('tttScoreBhai').textContent = tttScoreBhai;
                playLetterTone();
                if (statusEl) {
                    statusEl.textContent = 'Bhai sneaked a lucky win! Rematch Didi? 😜';
                }
                showToast("Bhai won this round! Tap New Round for revenge! ⚔️", "😜");
            }
        }

        function handleTicTacToeTie() {
            tttGameOver = true;
            tttScoreTies++;
            document.getElementById('tttScoreTies').textContent = tttScoreTies;
            playChimeSound();
            const statusEl = document.getElementById('tttStatusText');
            if (statusEl) {
                statusEl.textContent = "🤝 It's a Tie! Perfect Sibling Harmony! ✨";
            }
            showToast("It's a draw! Perfect sibling bond! 🤝✨", "🎀");
            // Sibling bond victory: A tie also counts towards unlocking the next challenge!
            if (isQuestActive) {
                setTimeout(() => {
                    markQuestGameComplete('zerocross', 'wordfinder');
                }, 600);
            }
        }

        function resetTicTacToe(isNewRound = true) {
            playBubblePop();
            tttBoard = Array(9).fill(null);
            tttGameOver = false;
            tttCurrentTurn = 'didi';
            renderTicTacToeBoard();
            const statusEl = document.getElementById('tttStatusText');
            if (statusEl) {
                statusEl.textContent = "🌸 Didi's turn! Tap any box to place your flower!";
            }
        }

        function resetTicTacToeScores() {
            playBubblePop();
            tttScoreDidi = 0;
            tttScoreBhai = 0;
            tttScoreTies = 0;
            document.getElementById('tttScoreDidi').textContent = 0;
            document.getElementById('tttScoreBhai').textContent = 0;
            document.getElementById('tttScoreTies').textContent = 0;
            resetTicTacToe(true);
            showToast("Scores reset! Ready for a fresh tournament! 🎮", "🔄");
        }

        // --------------------------------------------------------
        // 2. WORD FINDER (SISTER BIRTHDAY WORD SEARCH)
        // --------------------------------------------------------
        const WF_WORDS = [
            { id: 'kajal', word: "KAJAL", emoji: "🌸", coords: [[9,2],[9,3],[9,4],[9,5],[9,6]] },
            { id: 'noor', word: "NOOR", emoji: "✨", coords: [[0,8],[0,7],[0,6],[0,5]] },
            { id: 'doraemon', word: "DORAEMON", emoji: "🔔", coords: [[7,11],[6,10],[5,9],[4,8],[3,7],[2,6],[1,5],[0,4]] },
            { id: 'sister', word: "SISTER", emoji: "👑", coords: [[2,3],[3,3],[4,3],[5,3],[6,3],[7,3]] },
            { id: 'trust', word: "TRUST", emoji: "💎", coords: [[3,1],[4,1],[5,1],[6,1],[7,1]] },
            { id: 'love', word: "LOVE", emoji: "💖", coords: [[2,8],[3,9],[4,10],[5,11]] },
            { id: 'smile', word: "SMILE", emoji: "😊", coords: [[11,4],[11,5],[11,6],[11,7],[11,8]] },
            { id: 'memories', word: "MEMORIES", emoji: "📸", coords: [[9,7],[8,7],[7,7],[6,7],[5,7],[4,7],[3,7],[2,7]] },
            { id: 'blushqueen', word: "BLUSHQUEEN", emoji: "👸", coords: [[1,0],[2,1],[3,2],[4,3],[5,4],[6,5],[7,6],[8,7],[9,8],[10,9]] },
            { id: 'forever', word: "FOREVER", emoji: "🤍", coords: [[10,6],[10,5],[10,4],[10,3],[10,2],[10,1],[10,0]] }
        ];

        const WF_GRID = [
            ['P', 'A', 'S', 'T', 'N', 'R', 'O', 'O', 'N', 'W', 'X', 'B'],
            ['B', 'G', 'Y', 'H', 'K', 'O', 'Z', 'X', 'C', 'P', 'Q', 'U'],
            ['W', 'L', 'Y', 'S', 'P', 'M', 'M', 'S', 'L', 'Q', 'T', 'V'],
            ['V', 'T', 'U', 'I', 'A', 'Z', 'N', 'E', 'G', 'O', 'Y', 'B'],
            ['I', 'R', 'W', 'S', 'E', 'D', 'U', 'I', 'A', 'K', 'V', 'R'],
            ['O', 'U', 'X', 'T', 'H', 'K', 'L', 'R', 'E', 'R', 'H', 'E'],
            ['A', 'S', 'F', 'E', 'A', 'Q', 'W', 'O', 'P', 'B', 'O', 'C'],
            ['L', 'T', 'B', 'R', 'N', 'J', 'U', 'M', 'H', 'X', 'Y', 'D'],
            ['C', 'D', 'P', 'A', 'Z', 'T', 'W', 'E', 'Y', 'K', 'L', 'U'],
            ['Y', 'V', 'K', 'A', 'J', 'A', 'L', 'M', 'E', 'Z', 'N', 'B'],
            ['R', 'E', 'V', 'E', 'R', 'O', 'F', 'P', 'A', 'N', 'X', 'G'],
            ['W', 'B', 'T', 'P', 'S', 'M', 'I', 'L', 'E', 'H', 'Q', 'F']
        ];

        let wfFoundWords = new Set();
        let wfSelectedCells = [];
        let wfInitialized = false;

        function initWordFinder() {
            wfInitialized = true;
            renderWordFinderGrid();
            renderWordFinderBadges();
        }

        function renderWordFinderGrid() {
            const gridEl = document.getElementById('wsGrid');
            if (!gridEl) return;
            gridEl.innerHTML = '';
            gridEl.style.gridTemplateColumns = `repeat(${WF_GRID[0].length}, 1fr)`;

            for (let r = 0; r < WF_GRID.length; r++) {
                for (let c = 0; c < WF_GRID[r].length; c++) {
                    const cell = document.createElement('div');
                    cell.className = 'ws-cell';
                    cell.id = `wsCell_${r}_${c}`;
                    cell.textContent = WF_GRID[r][c];

                    // Check if already in found words
                    const isFound = isCellInFoundWords(r, c);
                    if (isFound) cell.classList.add('ws-found');

                    cell.onclick = () => handleWordFinderCellClick(r, c);
                    gridEl.appendChild(cell);
                }
            }
        }

        function isCellInFoundWords(r, c) {
            for (let wordObj of WF_WORDS) {
                if (wfFoundWords.has(wordObj.id)) {
                    if (wordObj.coords.some(([cr, cc]) => cr === r && cc === c)) {
                        return true;
                    }
                }
            }
            return false;
        }

        function renderWordFinderBadges() {
            const container = document.getElementById('wfWordBadges');
            if (!container) return;
            container.innerHTML = '';

            WF_WORDS.forEach(item => {
                const badge = document.createElement('span');
                badge.className = `ws-word-badge ${wfFoundWords.has(item.id) ? 'found' : ''}`;
                badge.id = `wfBadge_${item.id}`;
                badge.innerHTML = `${item.emoji} ${item.word} ${wfFoundWords.has(item.id) ? '✓' : ''}`;
                container.appendChild(badge);
            });

            const countEl = document.getElementById('wfFoundCount');
            if (countEl) countEl.textContent = wfFoundWords.size;
        }

        function handleWordFinderCellClick(r, c) {
            playBubblePop();

            // Toggle cell selection
            const cellIdx = wfSelectedCells.findIndex(cell => cell.r === r && cell.c === c);
            const cellEl = document.getElementById(`wsCell_${r}_${c}`);

            if (cellIdx !== -1) {
                // Deselect cleanly
                wfSelectedCells.splice(cellIdx, 1);
                if (cellEl) cellEl.classList.remove('ws-selected');
            } else {
                // Select
                wfSelectedCells.push({ r, c, letter: WF_GRID[r][c] });
                if (cellEl) cellEl.classList.add('ws-selected');
            }

            updateWordFinderSelectionUI();
            checkWordFinderMatch();
        }

        function updateWordFinderSelectionUI() {
            const txtEl = document.getElementById('wfCurrentWordText');
            const clearBtn = document.getElementById('wfClearSelectionBtn');

            if (wfSelectedCells.length === 0) {
                if (txtEl) txtEl.textContent = 'Tap letters in order to build words! 👇';
                if (clearBtn) clearBtn.classList.add('hidden');
            } else {
                const str = wfSelectedCells.map(c => c.letter).join('');
                if (txtEl) txtEl.textContent = `Selected: "${str}"`;
                if (clearBtn) clearBtn.classList.remove('hidden');
            }
        }

        function clearWordFinderSelection() {
            playBubblePop();
            wfSelectedCells.forEach(({ r, c }) => {
                const el = document.getElementById(`wsCell_${r}_${c}`);
                if (el) el.classList.remove('ws-selected');
            });
            wfSelectedCells = [];
            updateWordFinderSelectionUI();
        }

        function checkWordFinderMatch() {
            if (wfSelectedCells.length < 3) return;

            const selectedWord = wfSelectedCells.map(c => c.letter).join('');
            const reversedWord = selectedWord.split('').reverse().join('');

            for (let item of WF_WORDS) {
                if (wfFoundWords.has(item.id)) continue;

                if (selectedWord === item.word || reversedWord === item.word) {
                    // Check if coordinates match
                    const selectedCoords = wfSelectedCells.map(c => `${c.r},${c.c}`).sort().join(';');
                    const expectedCoords = item.coords.map(([r, c]) => `${r},${c}`).sort().join(';');

                    if (selectedCoords === expectedCoords) {
                        // Word Found!
                        wfFoundWords.add(item.id);
                        playChimeSound();
                        shootHearts();

                        // Mark cells as found
                        item.coords.forEach(([r, c]) => {
                            const el = document.getElementById(`wsCell_${r}_${c}`);
                            if (el) {
                                el.classList.remove('ws-selected');
                                el.classList.add('ws-found');
                            }
                        });

                        wfSelectedCells = [];
                        updateWordFinderSelectionUI();
                        renderWordFinderBadges();

                        showToast(`✨ Found: "${item.word}"! Great eye, Didi! 💖`, "🌸");

                        // Check all words found
                        if (wfFoundWords.size === WF_WORDS.length) {
                            setTimeout(() => {
                                playHarpTone();
                                shootConfettiBlast();
                                showToast("🎉 YOU FOUND ALL 10 WORDS! Word Queen Didi! 👑✨", "🏆");
                                const txtEl = document.getElementById('wfCurrentWordText');
                                if (txtEl) txtEl.textContent = "🏆 ALL WORDS FOUND! You're a Genius, Didi! 👑";
                                if (isQuestActive) {
                                    markQuestGameComplete('wordfinder', 'memory');
                                }
                            }, 400);
                        }
                        return;
                    }
                }
            }
        }

        let wfHintIndex = 0;
        function hintWordFinder() {
            playBubblePop();
            const unfound = WF_WORDS.filter(w => !wfFoundWords.has(w.id));
            if (unfound.length === 0) {
                showToast("All words already discovered, Didi! 👑", "✨");
                return;
            }
            const target = unfound[wfHintIndex % unfound.length];
            wfHintIndex++;

            target.coords.forEach(([r, c]) => {
                const cellEl = document.getElementById(`wsCell_${r}_${c}`);
                if (cellEl) {
                    cellEl.classList.remove('ws-hint');
                    void cellEl.offsetWidth; // force reflow
                    cellEl.classList.add('ws-hint');
                }
            });
            showToast(`💡 Hint: "${target.word}" starts with '${target.word[0]}' (Row ${target.coords[0][0] + 1})!`, "🔍");
        }

        function autoRevealNextWord() {
            playBubblePop();
            const unfound = WF_WORDS.filter(w => !wfFoundWords.has(w.id));
            if (unfound.length === 0) {
                showToast("All words already discovered, Didi! 👑", "✨");
                return;
            }
            const target = unfound[0];
            wfFoundWords.add(target.id);
            playChimeSound();
            shootHearts();

            target.coords.forEach(([r, c]) => {
                const el = document.getElementById(`wsCell_${r}_${c}`);
                if (el) {
                    el.classList.remove('ws-selected');
                    el.classList.add('ws-found');
                }
            });

            wfSelectedCells = [];
            updateWordFinderSelectionUI();
            renderWordFinderBadges();
            showToast(`🪄 Revealed: "${target.word}"! 🌸`, "✨");

            if (wfFoundWords.size === WF_WORDS.length) {
                setTimeout(() => {
                    playHarpTone();
                    shootConfettiBlast();
                    showToast("🎉 YOU FOUND ALL 10 WORDS! Word Queen Didi! 👑✨", "🏆");
                    const txtEl = document.getElementById('wfCurrentWordText');
                    if (txtEl) txtEl.textContent = "🏆 ALL WORDS FOUND! You're a Genius, Didi! 👑";
                    if (isQuestActive) {
                        markQuestGameComplete('wordfinder', 'memory');
                    }
                }, 400);
            }
        }
        window.autoRevealNextWord = autoRevealNextWord;

        function resetWordFinder() {
            playBubblePop();
            wfFoundWords.clear();
            wfSelectedCells = [];
            renderWordFinderGrid();
            renderWordFinderBadges();
            updateWordFinderSelectionUI();
            showToast("Word Finder puzzle reset! Happy hunting! 🔍", "🔄");
        }

        // --------------------------------------------------------
        // 3. MEMORY MATCH (15 PAIRS / 30 CARDS - 25 MOVES LIMIT)
        // --------------------------------------------------------
        const MEMORY_PAIRS_DATA = [
            { icon: '🎂', label: 'Cake' },
            { icon: '👑', label: 'Queen' },
            { icon: '🌸', label: 'Sakura' },
            { icon: '💖', label: 'Love' },
            { icon: '🎁', label: 'Gift' },
            { icon: '🌙', label: 'Moon' },
            { icon: '🧸', label: 'Bhai' },
            { icon: '🍓', label: 'Berry' },
            { icon: '💎', label: 'Diamond' },
            { icon: '✨', label: 'Sparkle' },
            { icon: '🦋', label: 'Butterfly' },
            { icon: '🍫', label: 'Choco' },
            { icon: '🌈', label: 'Rainbow' },
            { icon: '☀️', label: 'Sunshine' },
            { icon: '🎈', label: 'Balloon' }
        ];

        const MEMORY_TOTAL_PAIRS = 15;

        let memoryCards = [];
        let memoryFlippedIndices = [];
        let memoryMatchedCount = 0;
        let memoryMoves = 0;
        let memoryIsLocked = false;
        let memoryIsGameOver = false;
        let memoryInitialized = false;

        function restartMemoryGame() {
            playBubblePop();
            initMemoryGame();
            showToast("Deck reshuffled! Find all 15 pairs to unlock the next challenge! 🃏✨", "🔄");
        }

        function peekMemoryCards() {
            if (memoryIsGameOver || memoryIsLocked) return;
            playBubblePop();
            playChimeSound();

            // Find an unmatched pair
            const unmatched = [];
            memoryCards.forEach((c, idx) => {
                const el = document.getElementById(`memCard_${idx}`);
                if (el && !el.classList.contains('matched') && !el.classList.contains('flipped')) {
                    unmatched.push({ idx, pairId: c.pairId });
                }
            });

            if (unmatched.length === 0) return;

            const first = unmatched[0];
            const second = unmatched.find(c => c.pairId === first.pairId && c.idx !== first.idx);
            const revealIndices = second ? [first.idx, second.idx] : [first.idx];

            revealIndices.forEach(idx => {
                const el = document.getElementById(`memCard_${idx}`);
                if (el) el.classList.add('flipped');
            });
            memoryIsLocked = true;

            showToast("💡 Peek Hint: Revealed a matching pair! 👀✨", "🃏");

            setTimeout(() => {
                revealIndices.forEach(idx => {
                    const el = document.getElementById(`memCard_${idx}`);
                    if (el && !el.classList.contains('matched') && !memoryFlippedIndices.includes(idx)) {
                        el.classList.remove('flipped');
                    }
                });
                memoryIsLocked = false;
            }, 1200);
        }
        window.peekMemoryCards = peekMemoryCards;

        function initMemoryGame() {
            memoryInitialized = true;
            memoryFlippedIndices = [];
            memoryMatchedCount = 0;
            memoryMoves = 0;
            memoryIsLocked = false;
            memoryIsGameOver = false;

            const matchesEl = document.getElementById('memMatchesCount');
            if (matchesEl) matchesEl.textContent = 0;
            const movesEl = document.getElementById('memMovesCount');
            if (movesEl) movesEl.textContent = 0;
            const statusEl = document.getElementById('memStatusText');
            if (statusEl) statusEl.innerHTML = "Match all 15 pairs to unlock Challenge 4! Tap 2 cards to begin! 🎁✨";

            const nextBanner = document.getElementById('questNextBanner_memory');
            if (nextBanner) nextBanner.classList.add('hidden');

            // Duplicate to 30 cards (15 pairs)
            const deck = [];
            MEMORY_PAIRS_DATA.forEach((item, id) => {
                deck.push({ ...item, pairId: id });
                deck.push({ ...item, pairId: id });
            });

            // Fisher-Yates Random Shuffle
            for (let i = deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            memoryCards = deck;

            renderMemoryGrid();
        }

        function renderMemoryGrid() {
            const container = document.getElementById('memoryCardsGrid');
            if (!container) return;
            container.innerHTML = '';

            memoryCards.forEach((card, idx) => {
                const cardEl = document.createElement('div');
                cardEl.className = 'memory-card';
                cardEl.id = `memCard_${idx}`;

                cardEl.innerHTML = `
                    <div class="memory-card-inner">
                        <div class="memory-card-back">
                            <span class="text-lg sm:text-xl">✨</span>
                            <span class="text-[8px] font-black text-rose-500 uppercase tracking-tighter mt-0.5">TAP</span>
                        </div>
                        <div class="memory-card-front">
                            <span class="text-xl sm:text-2xl">${card.icon}</span>
                            <span class="text-[9px] font-black text-slate-800 mt-0.5 truncate max-w-full px-0.5">${card.label}</span>
                        </div>
                    </div>
                `;

                cardEl.onclick = () => handleMemoryCardClick(idx);
                container.appendChild(cardEl);
            });
        }

        function handleMemoryCardClick(idx) {
            // Disable interactions after game ends or while locked
            if (memoryIsGameOver) {
                showToast("All pairs already matched! Tap 'Restart' if you want to play again 🔄", "🎉");
                return;
            }
            if (memoryIsLocked) return;

            const cardEl = document.getElementById(`memCard_${idx}`);
            if (!cardEl) return;
            if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

            playBubblePop();
            cardEl.classList.add('flipped');
            memoryFlippedIndices.push(idx);

            if (memoryFlippedIndices.length === 2) {
                memoryMoves++;
                const movesEl = document.getElementById('memMovesCount');
                if (movesEl) movesEl.textContent = memoryMoves;

                const [i1, i2] = memoryFlippedIndices;
                const card1 = memoryCards[i1];
                const card2 = memoryCards[i2];

                if (card1.pairId === card2.pairId) {
                    // Match found!
                    memoryMatchedCount++;
                    const matchesEl = document.getElementById('memMatchesCount');
                    if (matchesEl) matchesEl.textContent = memoryMatchedCount;
                    playChimeSound();

                    const el1 = document.getElementById(`memCard_${i1}`);
                    const el2 = document.getElementById(`memCard_${i2}`);
                    if (el1) el1.classList.add('matched');
                    if (el2) el2.classList.add('matched');

                    memoryFlippedIndices = [];

                    const statusEl = document.getElementById('memStatusText');

                    if (memoryMatchedCount === MEMORY_TOTAL_PAIRS) {
                        // VICTORY! All 15 pairs matched!
                        memoryIsGameOver = true;
                        memoryIsLocked = true;
                        setTimeout(() => {
                            playHarpTone();
                            shootConfettiBlast();
                            shootHearts();
                            if (statusEl) {
                                statusEl.innerHTML = `<span class="text-emerald-700 font-black">🎉 VICTORY! All 15 Pairs Matched in ${memoryMoves} Moves! Flawless, Didi! 👑🏆</span>`;
                            }
                            showToast(`👑 Incredible! All 15 pairs matched in ${memoryMoves} moves! Victory! 💖`, "🏆");
                            if (isQuestActive) {
                                markQuestGameComplete('memory', 'balloon');
                            }
                        }, 350);
                    } else {
                        if (statusEl) {
                            statusEl.textContent = `Matched ${card1.icon} ${card1.label}! (${memoryMatchedCount}/${MEMORY_TOTAL_PAIRS} pairs found) ✨`;
                        }
                    }
                } else {
                    // Not a match
                    memoryIsLocked = true;
                    const statusEl = document.getElementById('memStatusText');
                    if (statusEl) statusEl.textContent = `Not a match! (${memoryMatchedCount}/${MEMORY_TOTAL_PAIRS} pairs found) 🙈`;

                    setTimeout(() => {
                        const el1 = document.getElementById(`memCard_${i1}`);
                        const el2 = document.getElementById(`memCard_${i2}`);
                        if (el1) el1.classList.remove('flipped');
                        if (el2) el2.classList.remove('flipped');
                        memoryFlippedIndices = [];
                        memoryIsLocked = false;
                        if (statusEl && !memoryIsGameOver) {
                            statusEl.textContent = `Keep going, Didi! ${memoryMatchedCount}/${MEMORY_TOTAL_PAIRS} pairs matched so far! 💖`;
                        }
                    }, 650);
                }
            }
        }

        // --------------------------------------------------------
        // 4. BIRTHDAY BALLOON POP CARNIVAL
        // --------------------------------------------------------
        let balloonPoppedCount = 0;
        let balloonScore = 0;
        let balloonInterval = null;
        let balloonIsRunning = false;

        const BALLOON_COLORS = [
            'linear-gradient(135deg, #f43f5e, #fb7185)',
            'linear-gradient(135deg, #ec4899, #f472b6)',
            'linear-gradient(135deg, #f59e0b, #fbbf24)',
            'linear-gradient(135deg, #8b5cf6, #a78bfa)',
            'linear-gradient(135deg, #06b6d4, #22d3ee)'
        ];

        const SISTER_PRAISES = [
            "Didi is the sweetest! 🌸",
            "Royal Queen Energy! 👑",
            "Best Sister in the World! 💖",
            "Purest Heart & Smile! 😊",
            "Bhai's Lifelong Blessing! 🤍",
            "Cutest Didi Ever! 🎂",
            "Forever Loved & Cherished! ✨",
            "Radiant & Brilliant! 🌟"
        ];

        function startBalloonPopGame() {
            playBubblePop();
            playChimeSound();

            balloonPoppedCount = 0;
            balloonScore = 0;
            balloonIsRunning = true;

            const poppedEl = document.getElementById('balloonPoppedCount');
            if (poppedEl) poppedEl.textContent = 0;
            const scoreEl = document.getElementById('balloonScoreCount');
            if (scoreEl) scoreEl.textContent = 0;

            const overlay = document.getElementById('balloonStartOverlay');
            if (overlay) overlay.classList.add('hidden');

            const btnText = document.getElementById('balloonPlayBtnText');
            if (btnText) btnText.textContent = 'Restart';

            const arena = document.getElementById('balloonArena');
            if (arena) {
                // Clear existing balloons
                const old = arena.querySelectorAll('.floating-balloon, .balloon-pop-burst');
                old.forEach(el => el.remove());
            }

            if (balloonInterval) clearInterval(balloonInterval);
            // Spawn initial balloons
            for (let i = 0; i < 4; i++) {
                setTimeout(spawnFloatingBalloon, i * 250);
            }
            balloonInterval = setInterval(spawnFloatingBalloon, 750);
        }

        function spawnFloatingBalloon() {
            if (!balloonIsRunning) return;
            const arena = document.getElementById('balloonArena');
            if (!arena) return;

            const balloon = document.createElement('div');
            balloon.className = 'floating-balloon';

            const size = Math.floor(Math.random() * 18) + 48; // 48px to 66px
            const leftPercent = Math.floor(Math.random() * 80) + 8; // 8% to 88%
            const duration = (Math.random() * 2.2 + 4.2).toFixed(2); // 4.2s to 6.4s
            const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
            const emojis = ['🎈', '🌸', '🎂', '👑', '💖', '✨'];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];

            balloon.style.width = `${size}px`;
            balloon.style.height = `${Math.floor(size * 1.25)}px`;
            balloon.style.left = `${leftPercent}%`;
            balloon.style.background = color;
            balloon.style.borderRadius = '50% 50% 50% 50% / 40% 40% 60% 60%';
            balloon.style.animationDuration = `${duration}s`;
            balloon.style.display = 'flex';
            balloon.style.alignItems = 'center';
            balloon.style.justifyContent = 'center';
            balloon.style.fontSize = `${Math.floor(size * 0.42)}px`;
            balloon.innerHTML = `<span>${emoji}</span>`;

            balloon.onclick = (e) => popSingleBalloon(e, balloon);

            balloon.addEventListener('animationend', () => {
                balloon.remove();
            });

            arena.appendChild(balloon);
        }

        function popSingleBalloon(e, balloonEl) {
            if (!balloonIsRunning) return;
            e.stopPropagation();

            playBubblePop();
            balloonPoppedCount++;
            const points = 10 + Math.floor(Math.random() * 15);
            balloonScore += points;

            document.getElementById('balloonPoppedCount').textContent = balloonPoppedCount;
            document.getElementById('balloonScoreCount').textContent = balloonScore;

            const rect = balloonEl.getBoundingClientRect();
            const arenaRect = document.getElementById('balloonArena').getBoundingClientRect();
            const posX = rect.left - arenaRect.left;
            const posY = rect.top - arenaRect.top;

            // Remove balloon
            balloonEl.remove();

            // Spawn burst message
            const praise = SISTER_PRAISES[Math.floor(Math.random() * SISTER_PRAISES.length)];
            const burst = document.createElement('div');
            burst.className = 'balloon-pop-burst';
            burst.style.left = `${posX}px`;
            burst.style.top = `${posY}px`;
            burst.innerHTML = `<span>+${points} ✨ ${praise}</span>`;

            const arena = document.getElementById('balloonArena');
            if (arena) arena.appendChild(burst);
            setTimeout(() => burst.remove(), 700);

            const msgEl = document.getElementById('balloonLastMessage');
            if (msgEl) msgEl.textContent = praise;

            if (balloonPoppedCount >= 20) {
                // Victory!
                balloonIsRunning = false;
                clearInterval(balloonInterval);
                playChimeSound();
                playHarpTone();
                shootConfettiBlast();
                shootHearts();

                const overlay = document.getElementById('balloonStartOverlay');
                if (overlay) {
                    overlay.classList.remove('hidden');
                    overlay.innerHTML = `
                        <div class="text-4xl animate-bounce">🏆 🎈 🎉</div>
                        <h3 class="font-serif-title font-extrabold text-xl text-slate-900">
                            Carnival Champion, Didi!
                        </h3>
                        <p class="text-xs text-rose-700 font-bold max-w-xs">
                            You popped 20 balloons and scored <span class="text-base font-black text-amber-600">${balloonScore} points!</span>
                        </p>
                        <button onclick="startBalloonPopGame()"
                            class="bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-xs sm:text-sm px-6 py-2.5 rounded-full shadow-md hover:shadow-lg transition active:scale-95">
                            Play Again! 🔄
                        </button>
                    `;
                }
                showToast(`🏆 Balloon Carnival Master! Scored ${balloonScore} pts! 🎈`, "🎉");
                if (isQuestActive) {
                    markQuestGameComplete('balloon', 'wheel');
                }
            }
        }

        // --------------------------------------------------------
        // 5. WHEEL OF BIRTHDAY FORTUNES (SISTER WISHES SPINNER)
        // --------------------------------------------------------
        const FORTUNE_PRIZES = [
            { title: "🍕 Free Pizza Treat on Bhai!", desc: "Bhai will order Didi's favorite pizza whenever she asks! 🍕🥤", icon: "🍕", color: "#ffe4e6", textColor: "#9f1239" },
            { title: "👑 Royal Queen Pass!", desc: "Bhai will fulfill 1 special wish or demand today without arguing! 👑💖", icon: "👑", color: "#fef3c7", textColor: "#78350f" },
            { title: "🍫 Chocolate Box Feast!", desc: "A sweet box of Didi's favorite chocolates on the way! 🍫✨", icon: "🍫", color: "#fce7f3", textColor: "#831843" },
            { title: "🛍️ Sibling Shopping Pass!", desc: "Bhai will sponsor Didi's next favorite shopping cart item! 🛍️👗", icon: "🛍️", color: "#f3e8ff", textColor: "#581c87" },
            { title: "🫂 1000 Virtual Hugs & Protection!", desc: "Unlimited love, lifelong sibling protection and infinite hugs! 🫂🤍", icon: "🫂", color: "#ffe4e6", textColor: "#9f1239" },
            { title: "🚗 Personal Chauffeur Duty!", desc: "Bhai handles all outdoor chores and errands for Didi today! 🚗⚡", icon: "🚗", color: "#fef3c7", textColor: "#78350f" },
            { title: "🍰 Extra Large Cake Slice!", desc: "Double sweet celebration guaranteed for the Birthday Queen! 🍰🎂", icon: "🍰", color: "#fce7f3", textColor: "#831843" },
            { title: "🌟 Golden Sister Blessing!", desc: "May all your dreams turn into reality this year, Kajal Didi! 🌟🌸", icon: "🌟", color: "#f3e8ff", textColor: "#581c87" }
        ];

        let wheelCurrentAngle = 0;
        let wheelIsSpinning = false;
        let lastWonPrize = null;

        function initFortuneWheel() {
            drawFortuneWheel();
            setTimeout(() => drawFortuneWheel(), 100);
        }

        function drawFortuneWheel() {
            const canvas = document.getElementById('fortuneWheelCanvas');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            const numSlices = FORTUNE_PRIZES.length;
            const sliceAngle = (2 * Math.PI) / numSlices;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const radius = cx - 8;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(wheelCurrentAngle);

            for (let i = 0; i < numSlices; i++) {
                const angle = i * sliceAngle;
                const prize = FORTUNE_PRIZES[i];

                // Draw Slice
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, radius, angle, angle + sliceAngle);
                ctx.closePath();
                ctx.fillStyle = prize.color;
                ctx.fill();

                // Slice border
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
                ctx.stroke();

                // Draw Text & Emoji
                ctx.save();
                ctx.rotate(angle + sliceAngle / 2);
                ctx.textAlign = 'right';
                ctx.fillStyle = prize.textColor;
                ctx.font = 'bold 13px Poppins, sans-serif';
                ctx.fillText(prize.title.split(' ')[1] || prize.title, radius - 28, 4);

                ctx.font = '22px sans-serif';
                ctx.fillText(prize.icon, radius - 6, 6);
                ctx.restore();
            }

            // Outer ring
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            ctx.lineWidth = 6;
            ctx.strokeStyle = '#f43f5e';
            ctx.stroke();

            ctx.restore();
        }

        function spinFortuneWheel() {
            if (wheelIsSpinning) return;
            wheelIsSpinning = true;

            playBubblePop();
            playChimeSound();

            const resultCard = document.getElementById('wheelResultCard');
            if (resultCard) resultCard.classList.add('hidden');

            const spinBtn = document.getElementById('spinWheelBtn');
            if (spinBtn) spinBtn.classList.add('scale-95', 'opacity-80');

            const totalRotations = Math.floor(Math.random() * 4) + 6; // 6 to 9 rotations
            const targetSlice = Math.floor(Math.random() * FORTUNE_PRIZES.length);
            const sliceAngle = (2 * Math.PI) / FORTUNE_PRIZES.length;

            // Pointer is at TOP (angle -PI/2)
            // When slice i is at top: (i * sliceAngle + currentAngle) mod 2PI should point to -PI/2
            const targetAngle = (totalRotations * 2 * Math.PI) + ((FORTUNE_PRIZES.length - targetSlice) * sliceAngle) - (sliceAngle / 2) - (Math.PI / 2);

            const startAngle = wheelCurrentAngle;
            const diffAngle = targetAngle - (startAngle % (2 * Math.PI));
            const duration = 4000;
            const startTime = performance.now();

            let lastTickSlice = -1;

            function animateSpin(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(1, elapsed / duration);

                // Cubic ease-out
                const easeOut = 1 - Math.pow(1 - progress, 3);
                wheelCurrentAngle = startAngle + diffAngle * easeOut;

                // Ticking sound as slices pass the top pointer
                const normalizedAngle = (wheelCurrentAngle + Math.PI / 2) % (2 * Math.PI);
                const currentSlice = Math.floor((2 * Math.PI - (normalizedAngle < 0 ? normalizedAngle + 2 * Math.PI : normalizedAngle)) / sliceAngle) % FORTUNE_PRIZES.length;
                if (currentSlice !== lastTickSlice) {
                    lastTickSlice = currentSlice;
                    playLetterTone();
                }

                drawFortuneWheel();

                if (progress < 1) {
                    requestAnimationFrame(animateSpin);
                } else {
                    wheelIsSpinning = false;
                    if (spinBtn) spinBtn.classList.remove('scale-95', 'opacity-80');

                    // Determine winning prize
                    lastWonPrize = FORTUNE_PRIZES[targetSlice];

                    playChimeSound();
                    playHarpTone();
                    shootConfettiBlast();
                    shootHearts();

                    if (resultCard) {
                        resultCard.classList.remove('hidden');
                        document.getElementById('wheelWonTitle').textContent = lastWonPrize.title;
                        document.getElementById('wheelWonDesc').textContent = lastWonPrize.desc;
                        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }

                    showToast(`🎉 You Won: ${lastWonPrize.title}! Bhai's treat! 💖`, "🎁");
                    if (isQuestActive) {
                        markQuestGameComplete('wheel', 'quiz');
                    }
                }
            }

            requestAnimationFrame(animateSpin);
        }

        function claimWheelPrizeWhatsApp() {
            if (!lastWonPrize) return;
            playBubblePop();
            const text = encodeURIComponent(`Hey Bhai! 🥳 I just spun the Birthday Fortune Wheel on your website and won: "${lastWonPrize.title}"! ${lastWonPrize.desc} Now fulfill your promise! 💖👑`);
            window.open(`https://wa.me/?text=${text}`, '_blank');
        }

        function copyWheelPrize() {
            if (!lastWonPrize) return;
            playBubblePop();
            navigator.clipboard.writeText(`🎉 I won on Birthday Fortune Wheel: "${lastWonPrize.title}" - ${lastWonPrize.desc}`);
            showToast("Copied to clipboard! Send it to Bhai! 💌", "📋");
        }

        // =========================================================================
        // BHAI'S PHOTO COLLAGE, HEART MOSAIC & SWIPEABLE STORIES (13 MEMORIES)
        // =========================================================================
        const BHAI_PHOTO_COLLECTION = [
            {
                id: "cozy_selfie",
                title: "Sweet Bedtime Smile 🧸",
                tag: "Innocent & Gentle",
                caption: "No matter how long or tiring the day was, your sweet innocent smile always brings comfort, warmth, and peace to our home.",
                web: "images/photo1.webp",
                webJpg: "images/photo1.jpg",
                thumb: "images/photo1_thumb.webp",
                note: "“Didi, you are the calm in every storm.”",
                sticker: "Sleepy Queen 💤",
                pos: "center 38%"
            },
            {
                id: "royal_gold",
                title: "The Royal Queen 👑",
                tag: "Traditional Royalty",
                caption: "Looking like absolute royalty in traditional gold jhumkas and black Banarasi saree. The most graceful sister in the entire universe!",
                web: "images/photo2.webp",
                webJpg: "images/photo2.jpg",
                thumb: "images/photo2_thumb.webp",
                note: "“Nobody wears grace quite like Kajal Didi.”",
                sticker: "Royal Highness 👑",
                pos: "center 20%"
            },
            {
                id: "teal_saree",
                title: "Bangles & Mischief 🩵",
                tag: "Playful & Radiant",
                caption: "Hiding your shy smile behind colorful bangles! Your laughter and mischievous teasing are the real joy of our childhood.",
                web: "images/photo3.webp",
                webJpg: "images/photo3.jpg",
                thumb: "images/photo3_thumb.webp",
                note: "“The remote control fights & endless laughs!”",
                sticker: "Naughty Sister 🤭",
                pos: "center 25%"
            },
            {
                id: "golden_sunlight",
                title: "Golden Hour Sunshine ☀️",
                tag: "Pure Radiance",
                caption: "Golden sunlight streaming across your hair—you radiate pure positivity, inner strength, and warmth wherever you step.",
                web: "images/photo4.webp",
                webJpg: "images/photo4.jpg",
                thumb: "images/photo4_thumb.webp",
                note: "“Keep shining your bright golden light, Didi.”",
                sticker: "Sunshine Girl 🌻",
                pos: "center 22%"
            },
            {
                id: "maroon_saree",
                title: "Maroon Radiance & Grace 🌹",
                tag: "Timeless Elegance",
                caption: "Draped in deep maroon Banarasi silk with royal grace. I will always be the proudest little brother standing by your side.",
                web: "images/photo5.webp",
                webJpg: "images/photo5.jpg",
                thumb: "images/photo5_thumb.webp",
                note: "“A sister who inspires me every single day.”",
                sticker: "Pure Elegance 🌹",
                pos: "center 25%"
            },
            {
                id: "courtyard_cafe",
                title: "Modern Poise & Style 🏛️",
                tag: "Chic & Unstoppable",
                caption: "Confident, fashionable, and ambitious! You teach me to walk tall with self-respect and to always aim for the stars.",
                web: "images/photo6.webp",
                webJpg: "images/photo6.jpg",
                thumb: "images/photo6_thumb.webp",
                note: "“My biggest role model and coolest mentor.”",
                sticker: "Boss Lady ✨",
                pos: "center 22%"
            },
            {
                id: "pastel_sasha",
                title: "Childhood Sweetness — Sasha 🌸",
                tag: "Forever Sasha",
                caption: "My sweetest Sasha! Wearing your cozy sweater with that cute shy smile. A piece of our childhood that will never fade away.",
                web: "images/photo7.webp",
                webJpg: "images/photo7.jpg",
                thumb: "images/photo7_thumb.webp",
                note: "“Sasha will always be Bhai’s favorite person!”",
                sticker: "Sweet Sasha 🧸",
                pos: "center 28%"
            },
            {
                id: "sunlit_pink",
                title: "Pink Dupatta Glow ✨",
                tag: "Golden Hour Triptych",
                caption: "Golden hour hues and pink embroidery. Three frames capturing your genuine happiness, peace, and that lovely little dimple.",
                web: "images/photo8.webp",
                webJpg: "images/photo8.jpg",
                thumb: "images/photo8_thumb.webp",
                note: "“Your happiness is the greatest gift to our family.”",
                sticker: "Pink Blossom 🌸",
                pos: "center 25%"
            },
            {
                id: "twilight_garden",
                title: "Twilight Dreamer 🌿",
                tag: "Peaceful Evening",
                caption: "Lost in sweet thoughts amidst the evening garden breeze. May every silent wish in your pure heart come true this year.",
                web: "images/photo9.webp",
                webJpg: "images/photo9.jpg",
                thumb: "images/photo9_thumb.webp",
                note: "“May God fulfill every secret dream of yours.”",
                sticker: "Dreamy Soul 🌙",
                pos: "center 24%"
            },
            {
                id: "rooftop_bouquet",
                title: "Birthday Queen with Flowers 💐",
                tag: "Celebration Moment",
                caption: "Holding your celebration flowers against the evening sky! This unforgettable smile is the reason behind this entire website.",
                web: "images/photo10.webp",
                webJpg: "images/photo10.jpg",
                thumb: "images/photo10_thumb.webp",
                note: "“Happy Birthday to the center of my world!”",
                sticker: "Birthday Queen 🎂",
                pos: "center 22%"
            },
            {
                id: "rooftop_dupatta",
                title: "Evening Breeze & Starlight 🌆",
                tag: "City Twilight",
                caption: "Standing above the glittering city skyline with the dupatta dancing in the wind. You belong among the highest stars!",
                web: "images/photo12.webp",
                webJpg: "images/photo12.jpg",
                thumb: "images/photo12_thumb.webp",
                note: "“You shine brighter than the entire city lights.”",
                sticker: "Starlight ⭐",
                pos: "center 22%"
            },
            {
                id: "rooftop_hairtoss",
                title: "Carefree & Joyful 💃",
                tag: "Pure Joy",
                caption: "That carefree, joyful hair toss on the terrace! May you live every moment of your life laughing freely without a single worry.",
                web: "images/photo11.webp",
                webJpg: "images/photo11.jpg",
                thumb: "images/photo11_thumb.webp",
                note: "“Never lose this infectious, crazy laugh!”",
                sticker: "Carefree Spirit 🦋",
                pos: "center 18%"
            },
            {
                id: "watercolor_hibiscus",
                title: "A Living Masterpiece 🌺",
                tag: "Artistic Tribute",
                caption: "Surrounded by blooming red hibiscus flowers. You have a heart of pure gold, and you make the world around you so much more beautiful.",
                web: "images/photo13.webp",
                webJpg: "images/photo13.jpg",
                thumb: "images/photo13_thumb.webp",
                note: "“A masterpiece of kindness, love, and grace.”",
                sticker: "Masterpiece 🎨",
                pos: "center 18%"
            }
        ];

        let currentBhaiPhotoIndex = 0;
        let bhaiCurrentTab = 'heart';
        let bhaiHeartReactionCount = 28;
        let isBhaiCuratedGridBuilt = false;
        let isBhaiHeartGridBuilt = false;
        let isBhaiScrapbookBuilt = false;
        let isBhaiSliderBuilt = false;

        function openBhaiHeartCollageModal(photoIndex = -1) {
            playChimeSound();
            playHarpTone();
            shootHearts();

            const modal = document.getElementById('bhaiHeartCollageModal');
            const dialog = document.getElementById('bhaiHeartCollageDialog');
            if (!modal || !dialog) return;

            // Ensure curated grid, heart grid, scrapbook, and hardware-accelerated slider track are constructed
            if (!isBhaiCuratedGridBuilt) buildBhaiCuratedGrid();
            if (!isBhaiHeartGridBuilt) buildBhaiHeartGrid();
            if (!isBhaiScrapbookBuilt) buildBhaiScrapbookGrid();
            if (!isBhaiSliderBuilt) buildBhaiSliderTrack();
            buildBhaiThumbnailStrip();

            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            requestAnimationFrame(() => {
                modal.classList.remove('opacity-0');
                dialog.classList.remove('scale-95');
                dialog.classList.add('scale-100');
            });

            if (photoIndex >= 0 && photoIndex < BHAI_PHOTO_COLLECTION.length) {
                currentBhaiPhotoIndex = photoIndex;
                setBhaiCollageTab('swipe');
                updateBhaiSlider(false);
            } else {
                setBhaiCollageTab(bhaiCurrentTab || 'heart');
                if (bhaiCurrentTab === 'swipe') {
                    updateBhaiSlider(false);
                }
            }

            setupBhaiSwipeGestures();
        }

        function closeBhaiHeartCollageModal() {
            playBubblePop();
            const modal = document.getElementById('bhaiHeartCollageModal');
            const dialog = document.getElementById('bhaiHeartCollageDialog');
            if (!modal || !dialog) return;

            modal.classList.add('opacity-0');
            dialog.classList.remove('scale-100');
            dialog.classList.add('scale-95');

            setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.display = 'none';
            }, 300);
        }

        function setBhaiCollageTab(tabName) {
            bhaiCurrentTab = tabName;
            playBubblePop();

            const tabs = ['heart', 'swipe', 'scrapbook'];
            tabs.forEach(t => {
                const btn = document.getElementById(`bhaiTabBtn_${t}`);
                const view = document.getElementById(`bhaiCollageTab_${t}`);
                if (btn) {
                    if (t === tabName) {
                        btn.className = "bhai-tab-btn active";
                    } else {
                        btn.className = "bhai-tab-btn";
                    }
                }
                if (view) {
                    if (t === tabName) {
                        view.classList.remove('hidden');
                    } else {
                        view.classList.add('hidden');
                    }
                }
            });

            if (tabName === 'swipe') {
                updateBhaiSlider(false);
            }
        }

        // Sub-View Switcher on Tab 1: Square Photo Grid vs Heart Mosaic
        function switchCollageSubView(view) {
            playBubblePop();
            const gridView = document.getElementById('bhaiCollageGridView');
            const heartView = document.getElementById('bhaiCollageHeartView');
            const gridBtn = document.getElementById('bhaiCollageSubViewBtn_grid');
            const heartBtn = document.getElementById('bhaiCollageSubViewBtn_heart');

            if (view === 'grid') {
                if (gridView) gridView.classList.remove('hidden');
                if (heartView) heartView.classList.add('hidden');
                if (gridBtn) gridBtn.classList.add('active');
                if (heartBtn) heartBtn.classList.remove('active');
            } else {
                if (gridView) gridView.classList.add('hidden');
                if (heartView) heartView.classList.remove('hidden');
                if (!isBhaiHeartGridBuilt) buildBhaiHeartGrid();
                if (gridBtn) gridBtn.classList.remove('active');
                if (heartBtn) heartBtn.classList.add('active');
            }
        }

        // 1A. Curated Square Photo Grid (Mobile & Desktop Optimized Magazine Layout)
        function buildBhaiCuratedGrid() {
            const gridEl = document.getElementById('bhaiCollageGridView');
            if (!gridEl) return;

            let html = '';
            BHAI_PHOTO_COLLECTION.forEach((photo, idx) => {
                const isHero = idx === 0;
                html += `
                    <div class="bhai-curated-card group ${isHero ? 'bhai-curated-card-hero' : ''}"
                        onclick="openBhaiSwipeAt(${idx})" title="${photo.title} • Tap to view on Side Slider!">
                        <!-- Ambient blurred backdrop -->
                        <img src="${photo.thumb}" alt="" class="bhai-curated-ambient-bg" />
                        <!-- Sharp Photo with centered face -->
                        <img src="${isHero ? photo.web : photo.thumb}" alt="${photo.title}" class="bhai-curated-photo" style="object-position: ${photo.pos};" loading="${idx < 4 ? 'eager' : 'lazy'}" />
                        <!-- Sleek Pill Sticker Tag Top-Left -->
                        <span class="bhai-curated-sticker">
                            ${photo.sticker}
                        </span>
                        <!-- Quick View Zoom Hint Top-Right -->
                        <span class="bhai-curated-zoom-pill" title="Open story">
                            <span>✨</span>
                        </span>
                        <!-- Bottom Gradient Title Banner -->
                        <div class="bhai-curated-banner">
                            <span class="bhai-curated-tag-chip">${photo.tag}</span>
                            <p class="bhai-curated-title">
                                ${photo.title}
                            </p>
                            <p class="bhai-curated-hint">
                                <span>Tap to view story</span> <span class="bhai-curated-arrow">➔</span>
                            </p>
                        </div>
                    </div>
                `;
            });

            gridEl.innerHTML = html;
            isBhaiCuratedGridBuilt = true;
        }

        // 1B. 7-Column Heart Mosaic
        function buildBhaiHeartGrid() {
            const gridEl = document.getElementById('bhaiHeartGridEl');
            if (!gridEl) return;

            // 7 Columns Heart Matrix Map (row-by-row indices into BHAI_PHOTO_COLLECTION)
            // 'CENTER' = Center Badge (span 3)
            // null = empty placeholder cell
            const heartLayout = [
                // Row 1 (4 lobes)
                null, 1, 12, null, 9, 3, null,
                // Row 2 (full row of 7)
                4, 5, 7, 6, 2, 8, 11,
                // Row 3 (outer wings + center badge span 3)
                10, 0, 'CENTER', 1, 9,
                // Row 4 (5 cells centered)
                null, 4, 12, 2, 7, 3, null,
                // Row 5 (3 cells centered)
                null, null, 6, 0, 8, null, null,
                // Row 6 (1 cell tip)
                null, null, null, 10, null, null, null
            ];

            let html = '';
            heartLayout.forEach((item) => {
                if (item === null) {
                    html += `<div class="aspect-square opacity-0 pointer-events-none"></div>`;
                } else if (item === 'CENTER') {
                    html += `
                        <div class="bhai-heart-center-badge" onclick="setBhaiCollageTab('swipe')" title="Click to open Side Slider stories!">
                            <span class="bhai-heart-crown animate-bounce">👑</span>
                            <span class="bhai-heart-center-title">Kajal Didi 🌸</span>
                            <span class="bhai-heart-center-sub">Open Stories ➔</span>
                        </div>
                    `;
                } else {
                    const photo = BHAI_PHOTO_COLLECTION[item];
                    if (photo) {
                        html += `
                            <div class="bhai-heart-tile group" onclick="openBhaiSwipeAt(${item})" title="${photo.title} • Tap to view on side slider!">
                                <img src="${photo.thumb}" alt="${photo.title}" style="object-position: ${photo.pos};" loading="lazy" />
                                <span class="bhai-heart-tile-overlay"></span>
                            </div>
                        `;
                    }
                }
            });

            gridEl.innerHTML = html;
            isBhaiHeartGridBuilt = true;
        }

        // 2. High-Performance Hardware-Accelerated Side Slider Track with Square Sized & Fully Visible Photos
        function buildBhaiSliderTrack() {
            const track = document.getElementById('bhaiSliderTrack');
            const dotsContainer = document.getElementById('bhaiSliderDots');
            if (!track) return;

            let trackHtml = '';
            let dotsHtml = '';

            BHAI_PHOTO_COLLECTION.forEach((photo, idx) => {
                trackHtml += `
                    <div class="bhai-slider-slide" data-index="${idx}">
                        <div class="bhai-slider-slide-box">
                            <!-- Square Frame with Ambient Blur & Full Uncropped Photo (100% visible, never cut off!) -->
                            <div class="bhai-slider-square-frame">
                                <!-- Ambient blurred backdrop for aesthetic fill -->
                                <img src="${photo.thumb}" alt="" class="bhai-slider-ambient-bg" />
                                <!-- Sharp Photo: Completely visible with zero cropping -->
                                <img src="${photo.web}" alt="${photo.title}" class="bhai-slider-main-photo" style="object-position: ${photo.pos};" loading="${idx < 3 ? 'eager' : 'lazy'}" />
                                <span class="bhai-slider-sticker-tag">
                                    ${photo.sticker}
                                </span>
                            </div>
                            <!-- Story Content Side -->
                            <div class="bhai-slider-info-col">
                                <div class="bhai-slider-text-header">
                                    <div class="bhai-slider-badge-row">
                                        <span class="bhai-slider-tag-pill">
                                            ${photo.tag}
                                        </span>
                                        <span class="bhai-slider-num-pill">
                                            Memory #${idx + 1} of ${BHAI_PHOTO_COLLECTION.length}
                                        </span>
                                    </div>
                                    <h4 class="bhai-slider-title">
                                        ${photo.title}
                                    </h4>
                                    <p class="bhai-slider-caption">
                                        ${photo.caption}
                                    </p>
                                </div>
                                <div class="bhai-slider-quote-card">
                                    <span class="bhai-slider-quote-mark">“</span>
                                    <p class="bhai-slider-note">
                                        ${photo.note.replace(/^“|”$/g, '')}
                                    </p>
                                </div>
                                <div class="bhai-slider-footer-bar">
                                    <span>Story #${idx + 1} of ${BHAI_PHOTO_COLLECTION.length}</span>
                                    <span>Swipe or use ◀ Side Slider ▶</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                dotsHtml += `
                    <button type="button" onclick="goToBhaiPhoto(${idx})" class="bhai-slider-dot ${idx === 0 ? 'active' : ''}" title="Slide ${idx + 1}" aria-label="Go to slide ${idx + 1}"></button>
                `;
            });

            track.innerHTML = trackHtml;
            if (dotsContainer) dotsContainer.innerHTML = dotsHtml;
            isBhaiSliderBuilt = true;
        }

        function updateBhaiSlider(animate = true) {
            if (!isBhaiSliderBuilt) {
                buildBhaiSliderTrack();
            }
            const track = document.getElementById('bhaiSliderTrack');
            const counterEl = document.getElementById('bhaiSwipeCounter');
            const tagEl = document.getElementById('bhaiSwipeTag');

            const photo = BHAI_PHOTO_COLLECTION[currentBhaiPhotoIndex];
            if (!photo) return;

            if (track) {
                if (!animate) {
                    track.style.transition = 'none';
                } else {
                    track.style.transition = 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)';
                }
                track.style.transform = `translate3d(-${currentBhaiPhotoIndex * 100}%, 0, 0)`;
            }

            if (counterEl) counterEl.textContent = `Photo ${currentBhaiPhotoIndex + 1} of ${BHAI_PHOTO_COLLECTION.length}`;
            if (tagEl) tagEl.textContent = photo.tag;

            // Update Slide Dots
            const dots = document.querySelectorAll('.bhai-slider-dot');
            dots.forEach((dot, idx) => {
                if (idx === currentBhaiPhotoIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });

            // Highlight thumbnail
            BHAI_PHOTO_COLLECTION.forEach((_, idx) => {
                const t = document.getElementById(`bhaiThumbItem_${idx}`);
                if (t) {
                    if (idx === currentBhaiPhotoIndex) {
                        t.classList.add('active');
                        t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                    } else {
                        t.classList.remove('active');
                    }
                }
            });
        }

        // Backward compatibility alias
        function renderBhaiSwipeCard() {
            updateBhaiSlider(true);
        }

        function buildBhaiThumbnailStrip() {
            const stripEl = document.getElementById('bhaiThumbStrip');
            if (!stripEl) return;

            let html = '';
            BHAI_PHOTO_COLLECTION.forEach((photo, idx) => {
                const isActive = idx === currentBhaiPhotoIndex;
                html += `
                    <button type="button" onclick="goToBhaiPhoto(${idx})" id="bhaiThumbItem_${idx}"
                        class="bhai-thumb-item ${isActive ? 'active' : ''}"
                        title="View ${photo.title}" aria-label="Go to memory ${idx + 1}">
                        <img src="${photo.thumb}" alt="${photo.title}" class="bhai-thumb-img" style="object-position: ${photo.pos};" />
                        <span class="bhai-thumb-badge">${idx + 1}</span>
                    </button>
                `;
            });
            stripEl.innerHTML = html;
        }

        function openBhaiSwipeAt(index) {
            currentBhaiPhotoIndex = index;
            setBhaiCollageTab('swipe');
            updateBhaiSlider(false);
            playBubblePop();
        }

        function nextBhaiPhoto() {
            currentBhaiPhotoIndex = (currentBhaiPhotoIndex + 1) % BHAI_PHOTO_COLLECTION.length;
            playBubblePop();
            updateBhaiSlider(true);
        }

        function prevBhaiPhoto() {
            currentBhaiPhotoIndex = (currentBhaiPhotoIndex - 1 + BHAI_PHOTO_COLLECTION.length) % BHAI_PHOTO_COLLECTION.length;
            playBubblePop();
            updateBhaiSlider(true);
        }

        function goToBhaiPhoto(idx) {
            if (idx >= 0 && idx < BHAI_PHOTO_COLLECTION.length) {
                currentBhaiPhotoIndex = idx;
                playBubblePop();
                updateBhaiSlider(true);
            }
        }

        function sendHeartReactionToBhai(event) {
            bhaiHeartReactionCount++;
            const countEl = document.getElementById('bhaiHeartReactionCount');
            if (countEl) countEl.textContent = bhaiHeartReactionCount;

            playHarpTone();
            triggerFloatingHeartBurst(event);
            showToast("💖 Love sent to Bhai! He loves you endlessly, Didi! 🥰", "💝");
        }

        function triggerFloatingHeartBurst(e) {
            const emojis = ['💖', '❤️', '💕', '🌸', '✨', '👑', '🥰'];
            const startX = e && e.clientX ? e.clientX : window.innerWidth / 2;
            const startY = e && e.clientY ? e.clientY : window.innerHeight / 2;

            for (let i = 0; i < 15; i++) {
                const heart = document.createElement('div');
                heart.className = 'flying-reaction-heart';
                heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                heart.style.left = `${startX + (Math.random() * 40 - 20)}px`;
                heart.style.top = `${startY + (Math.random() * 20 - 10)}px`;
                heart.style.fontSize = `${Math.floor(Math.random() * 16 + 20)}px`;

                const tx = (Math.random() * 160 - 80);
                const tx2 = tx * 1.5;
                const rot = (Math.random() * 60 - 30);
                const rot2 = -rot;

                heart.style.setProperty('--tx', `${tx}px`);
                heart.style.setProperty('--tx2', `${tx2}px`);
                heart.style.setProperty('--rot', `${rot}deg`);
                heart.style.setProperty('--rot2', `${rot2}deg`);

                document.body.appendChild(heart);
                setTimeout(() => {
                    heart.remove();
                }, 1400);
            }
        }

        function buildBhaiScrapbookGrid() {
            const gridEl = document.getElementById('bhaiScrapbookGrid');
            if (!gridEl) return;

            const rotations = ['bhai-rot-neg-2', 'bhai-rot-pos-1', 'bhai-rot-neg-1', 'bhai-rot-pos-2', 'bhai-rot-neg-3', 'bhai-rot-pos-3'];
            let html = '';

            BHAI_PHOTO_COLLECTION.forEach((photo, idx) => {
                const rotClass = rotations[idx % rotations.length];
                html += `
                    <div class="bhai-scrapbook-card ${rotClass}"
                        onclick="openBhaiSwipeAt(${idx})" title="Tap to view full story on side slider!">
                        <div class="bhai-scrapbook-tape"></div>
                        <div class="bhai-scrapbook-photo-wrap">
                            <!-- Ambient blur backdrop -->
                            <img src="${photo.thumb}" alt="" class="bhai-scrapbook-ambient-bg" />
                            <!-- Sharp square photo with centered face -->
                            <img src="${photo.web}" alt="${photo.title}" class="bhai-scrapbook-photo" style="object-position: ${photo.pos};" loading="lazy" />
                            <span class="bhai-scrapbook-sticker">
                                ${photo.sticker}
                            </span>
                        </div>
                        <div class="bhai-scrapbook-caption-wrap">
                            <p class="bhai-scrapbook-title">
                                ${photo.title}
                            </p>
                            <p class="bhai-scrapbook-note">
                                ${photo.note}
                            </p>
                        </div>
                    </div>
                `;
            });

            gridEl.innerHTML = html;
            isBhaiScrapbookBuilt = true;
        }

        // Hardware-Accelerated Interactive Side Slider Gestures
        let bhaiIsDragging = false;
        let bhaiDragStartX = 0;
        let bhaiDragCurrentX = 0;
        let bhaiDragStartY = 0;
        let bhaiIsHorizontalGesture = null;

        function setupBhaiSwipeGestures() {
            const viewport = document.getElementById('bhaiSliderViewport') || document.getElementById('bhaiCollageTab_swipe');
            const track = document.getElementById('bhaiSliderTrack');
            if (!viewport || viewport._hasSwipeListeners || !track) return;

            viewport.addEventListener('touchstart', (e) => {
                if (e.touches.length !== 1) return;
                bhaiIsDragging = true;
                bhaiIsHorizontalGesture = null;
                bhaiDragStartX = e.touches[0].clientX;
                bhaiDragCurrentX = bhaiDragStartX;
                bhaiDragStartY = e.touches[0].clientY;
                track.style.transition = 'none';
            }, { passive: true });

            viewport.addEventListener('touchmove', (e) => {
                if (!bhaiIsDragging || e.touches.length !== 1) return;
                bhaiDragCurrentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const diffX = bhaiDragCurrentX - bhaiDragStartX;
                const diffY = currentY - bhaiDragStartY;

                if (bhaiIsHorizontalGesture === null) {
                    if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
                        bhaiIsHorizontalGesture = Math.abs(diffX) > Math.abs(diffY);
                    }
                }

                if (bhaiIsHorizontalGesture) {
                    const viewportWidth = viewport.clientWidth || 360;
                    const percentOffset = (diffX / viewportWidth) * 100;
                    const basePercent = -currentBhaiPhotoIndex * 100;
                    track.style.transform = `translate3d(${basePercent + percentOffset}%, 0, 0)`;
                }
            }, { passive: true });

            viewport.addEventListener('touchend', () => {
                if (!bhaiIsDragging) return;
                bhaiIsDragging = false;
                const diffX = bhaiDragCurrentX - bhaiDragStartX;

                if (bhaiIsHorizontalGesture && Math.abs(diffX) > 40) {
                    if (diffX < 0) {
                        nextBhaiPhoto();
                    } else {
                        prevBhaiPhoto();
                    }
                } else {
                    updateBhaiSlider(true);
                }
                bhaiIsHorizontalGesture = null;
            }, { passive: true });

            viewport._hasSwipeListeners = true;
        }

        // Global Keydown Listener for Modal (Escape / C to Cut Screen, Left/Right for Side Slider)
        window.addEventListener('keydown', (e) => {
            const modal = document.getElementById('bhaiHeartCollageModal');
            if (!modal || modal.classList.contains('hidden') || modal.style.display === 'none') return;

            if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
                closeBhaiHeartCollageModal();
            } else if (e.key === 'ArrowRight') {
                nextBhaiPhoto();
            } else if (e.key === 'ArrowLeft') {
                prevBhaiPhoto();
            }
        });
