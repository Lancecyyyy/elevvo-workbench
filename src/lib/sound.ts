/**
 * Synthesized mechanical-key click (Web Audio API, zero audio files).
 * Ported from lance-portfolio so the two projects feel like the same machine.
 */
let ctx: AudioContext | null = null;
let enabled = true;

type WindowWithWebkit = Window & { webkitAudioContext?: typeof AudioContext };

export function setSoundEnabled(on: boolean) {
  enabled = on;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined" || !enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as WindowWithWebkit).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function noiseBurst(audio: AudioContext, freq: number, duration: number, gainAmount: number) {
  const size = Math.floor(audio.sampleRate * duration);
  const buffer = audio.createBuffer(1, size, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
  const src = audio.createBufferSource();
  src.buffer = buffer;
  const bp = audio.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = 0.9;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(gainAmount, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  src.connect(bp).connect(gain).connect(audio.destination);
  src.start();
  src.stop(audio.currentTime + duration);
}

function tick(audio: AudioContext, freq: number, duration: number, gainAmount: number) {
  const osc = audio.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(freq, audio.currentTime);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, audio.currentTime + duration);
  const gain = audio.createGain();
  gain.gain.setValueAtTime(gainAmount, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.connect(gain).connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

let last = 0;
export function playClick(strength: "soft" | "normal" | "hard" = "normal") {
  const audio = getCtx();
  if (!audio) return;
  const now = performance.now();
  if (now - last < 25) return;
  last = now;
  const j = 0.92 + Math.random() * 0.16;
  const b = strength === "hard" ? 1.15 : strength === "soft" ? 0.7 : 1;
  noiseBurst(audio, 1500 * j, 0.045 * b, 0.42 * b);
  tick(audio, 220 * j, 0.03 * b, 0.15 * b);
}

export function playChime() {
  const audio = getCtx();
  if (!audio) return;
  [660, 880, 1320].forEach((freq, i) => {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const gain = audio.createGain();
    const start = audio.currentTime + i * 0.06;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.1, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + 0.32);
  });
}

export function installGlobalClickSound() {
  const handler = (e: PointerEvent) => {
    const t = e.target instanceof Element ? e.target : null;
    if (t?.closest("[data-silent]")) return;
    playClick(t?.closest("button, a, [role=button], input, select, textarea, label") ? "normal" : "soft");
  };
  document.addEventListener("pointerdown", handler, { capture: true });
  return () => document.removeEventListener("pointerdown", handler, { capture: true });
}
