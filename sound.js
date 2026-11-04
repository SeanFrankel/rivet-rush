"use strict";
// Tiny original synth patches. Audio starts only after a deliberate player gesture.
class YardSound {
  constructor() {
    this.enabled = true;
    this.seen = new Set();
    try {
      this.enabled = localStorage.getItem("rivet-sound") !== "off";
    } catch {}
  }
  unlock() {
    if (!this.enabled) return;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    try {
      this.audio ||= new Audio();
      if (this.audio.state === "suspended") this.audio.resume().catch(() => {});
    } catch {
      this.enabled = false;
    }
  }
  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem("rivet-sound", this.enabled ? "on" : "off");
    } catch {}
    this.unlock();
    this.tone(440, 660, 0.09, "sine", 0.06);
    return this.enabled;
  }
  tone(from, to, seconds, type, volume, delay = 0) {
    if (!this.enabled || this.audio?.state !== "running") return;
    const t = this.audio.currentTime + delay,
      osc = this.audio.createOscillator(),
      gain = this.audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, t);
    osc.frequency.exponentialRampToValueAtTime(to, t + seconds);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain);
    gain.connect(this.audio.destination);
    osc.start(t);
    osc.stop(t + seconds + 0.01);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
  event(kind, near = true) {
    const amp = near ? 1 : 0.32;
    const patches = {
      kick: [220, 420, 0.08, "sine", 0.045],
      dash: [210, 680, 0.13, "triangle", 0.09],
      lunge: [115, 510, 0.15, "sawtooth", 0.055],
      strike: [540, 95, 0.12, "square", 0.035],
      prime: [100, 360, 0.16, "triangle", 0.11],
      pulse: [170, 54, 0.24, "sawtooth", 0.07],
      slam: [130, 32, 0.32, "sawtooth", 0.09],
      burst: [125, 36, 0.2, "triangle", 0.1],
      rivet: [410, 135, 0.055, "square", 0.028],
      rally: [245, 596, 0.24, "triangle", 0.05],
      salvage: [740, 940, 0.07, "sine", 0.032],
      shield: [170, 235, 0.09, "sine", 0.035],
    };
    const patch = patches[kind];
    if (patch) this.tone(patch[0], patch[1], patch[2], patch[3], patch[4] * amp);
  }
  observe(m) {
    if (!this.enabled || !this.audio) return;
    const active = new Set();
    for (const f of m.fx) {
      active.add(f.id);
      if (!this.seen.has(f.id) && Math.abs(f.x - m.player.x) < 520)
        this.event(f.kind, Math.abs(f.x - m.player.x) < 180);
    }
    for (const s of m.shots) {
      if (s.source !== m.player.id) continue;
      active.add(s.id);
      if (!this.seen.has(s.id)) this.event("rivet");
    }
    this.seen = active;
  }
  finish(won) {
    for (const [i, hz] of (won ? [330, 440, 660] : [292, 245, 165]).entries())
      this.tone(hz, hz + 0.1, 0.22, "triangle", 0.065, i * 0.12);
  }
}
