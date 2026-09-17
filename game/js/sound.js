const AudioCtx = window.AudioContext || window.webkitAudioContext;

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new AudioCtx();
            this.initialized = true;
        } catch (e) { /* no audio support */ }
    }

    toggle() {
        this.muted = !this.muted;
        return this.muted;
    }

    _play(frequency, duration, type = 'sine', volume = 0.3, ramp = true) {
        if (this.muted || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.value = volume;
        if (ramp) {
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        }
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    _noise(duration, volume = 0.15) {
        if (this.muted || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * volume;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.value = 1;
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    }

    launch() {
        this._play(300, 0.15, 'sine', 0.3);
        setTimeout(() => this._play(500, 0.1, 'sine', 0.2), 50);
    }

    collision(intensity = 1) {
        this._noise(0.08 * intensity, 0.2 * intensity);
        this._play(150 * intensity, 0.1, 'triangle', 0.15 * intensity);
    }

    destroy() {
        this._noise(0.15, 0.25);
        this._play(100, 0.2, 'sawtooth', 0.15);
    }

    explosion() {
        this._noise(0.4, 0.4);
        this._play(60, 0.3, 'sawtooth', 0.25);
        setTimeout(() => this._noise(0.2, 0.2), 100);
    }

    pigSqueal() {
        this._play(600, 0.15, 'sine', 0.2);
        setTimeout(() => this._play(800, 0.1, 'sine', 0.15), 50);
    }

    victory() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this._play(freq, 0.2, 'sine', 0.2), i * 120);
        });
    }

    defeat() {
        this._play(300, 0.3, 'sine', 0.2);
        setTimeout(() => this._play(200, 0.4, 'sine', 0.2), 200);
    }

    click() {
        this._play(800, 0.05, 'sine', 0.15);
    }

    stretch(pull) {
        this._play(200 + pull * 3, 0.05, 'triangle', 0.08, false);
    }
}
