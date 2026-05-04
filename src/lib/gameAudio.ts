/**
 * Procedural game audio via Web Audio API — no external assets, works offline.
 */

const AC = typeof window !== "undefined"
  ? window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  : undefined;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicBus: GainNode | null = null;
let sfxBus: GainNode | null = null;
let ambientTeardown: (() => void) | null = null;

function ensureGraph() {
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);

    musicBus = ctx.createGain();
    musicBus.gain.value = 0.16;
    musicBus.connect(master);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.32;
    sfxBus.connect(master);
  }
  return ctx;
}

export async function resumeAudio(): Promise<void> {
  const c = ensureGraph();
  if (!c) return;
  if (c.state === "suspended") await c.resume();
}

export function setMusicMuted(muted: boolean) {
  if (!musicBus) ensureGraph();
  if (musicBus) musicBus.gain.value = muted ? 0 : 0.16;
}

export function setSfxMuted(muted: boolean) {
  if (!sfxBus) ensureGraph();
  if (sfxBus) sfxBus.gain.value = muted ? 0 : 0.32;
}

export function isAmbientPlaying() {
  return ambientTeardown !== null;
}

export function stopAmbient() {
  if (ambientTeardown) {
    ambientTeardown();
    ambientTeardown = null;
  }
}

/**
 * Ambient bed: A minor pad + harmonic shimmer + slow arpeggio + light delay.
 * Tuned to read as “música” (melodia/harmonia), não textura tipo ruído.
 */
export function startAmbient() {
  const c = ensureGraph();
  if (!c || !musicBus || ambientTeardown) return;

  const toStop: OscillatorNode[] = [];
  const toDisconnect: AudioNode[] = [];

  const disconnectAll = () => {
    for (const n of toDisconnect) {
      try {
        n.disconnect();
      } catch {
        /* noop */
      }
    }
  };

  // ── Warm static tone stack (Am): raiz + quinta + terça + oitavas ───────
  const toneLP = c.createBiquadFilter();
  toneLP.type = "lowpass";
  toneLP.frequency.value = 2400;
  toneLP.Q.value = 0.35;
  toDisconnect.push(toneLP);

  const toneSum = c.createGain();
  toneSum.gain.value = 0.42;
  toneLP.connect(toneSum);
  toDisconnect.push(toneSum);

  /** A2, E3, A3, C4, E4 — volumes equilibrados, triângulo suave */
  const padChord: { f: number; g: number }[] = [
    { f: 110.0, g: 0.07 },
    { f: 164.81, g: 0.055 },
    { f: 220.0, g: 0.048 },
    { f: 261.63, g: 0.038 },
    { f: 329.63, g: 0.03 },
  ];

  for (const { f, g: gv } of padChord) {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = gv;
    o.connect(g);
    g.connect(toneLP);
    o.start();
    toStop.push(o);
    toDisconnect.push(o, g);
  }

  // Harmónicos discretos no grave (corpo, não “zumbido”)
  for (const mult of [2, 3] as const) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = 110 * mult;
    const g = c.createGain();
    g.gain.value = mult === 2 ? 0.018 : 0.01;
    o.connect(g);
    g.connect(toneLP);
    o.start();
    toStop.push(o);
    toDisconnect.push(o, g);
  }

  // ── Arpejo lento Am7: A3 → C4 → E4 → G4 (loop ~5.2s) ───────────────────
  const arpLP = c.createBiquadFilter();
  arpLP.type = "lowpass";
  arpLP.frequency.value = 5200;
  arpLP.Q.value = 0.45;
  toDisconnect.push(arpLP);

  const arpMix = c.createGain();
  arpMix.gain.value = 0.55;
  arpLP.connect(arpMix);
  toDisconnect.push(arpMix);

  const arpNotes = [220.0, 261.63, 329.63, 392.0];
  const arpGains: GainNode[] = [];
  for (const f of arpNotes) {
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.value = 0;
    o.connect(g);
    g.connect(arpLP);
    o.start();
    arpGains.push(g);
    toStop.push(o);
    toDisconnect.push(o, g);
  }

  const arpMs = 1380;
  let arpStep = 0;
  const arpId = window.setInterval(() => {
    if (c.state === "closed") return;
    const t = c.currentTime + 0.03;
    const idx = arpStep % arpGains.length;
    const g = arpGains[idx];
    try {
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.072, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0006, t + 1.05);
    } catch {
      /* noop */
    }
    arpStep += 1;
  }, arpMs);

  // ── Delay paralelo (espaço / “sala”) — feedback baixo para não embaciar ─
  const maxDelay = 2.2;
  const delay = c.createDelay(maxDelay);
  delay.delayTime.value = 0.56;
  toDisconnect.push(delay);

  const fb = c.createGain();
  fb.gain.value = 0.24;
  toDisconnect.push(fb);

  const dry = c.createGain();
  dry.gain.value = 0.74;
  const wet = c.createGain();
  wet.gain.value = 0.36;
  toDisconnect.push(dry, wet);

  const dryPan = c.createStereoPanner();
  dryPan.pan.value = -0.1;
  const wetPan = c.createStereoPanner();
  wetPan.pan.value = 0.12;
  toDisconnect.push(dryPan, wetPan);

  const busIn = c.createGain();
  busIn.gain.value = 1;
  toneSum.connect(busIn);
  arpMix.connect(busIn);
  toDisconnect.push(busIn);

  busIn.connect(dry);
  busIn.connect(delay);
  delay.connect(wet);
  delay.connect(fb);
  fb.connect(delay);

  dry.connect(dryPan);
  wet.connect(wetPan);
  dryPan.connect(musicBus);
  wetPan.connect(musicBus);

  ambientTeardown = () => {
    window.clearInterval(arpId);
    for (const o of toStop) {
      try {
        o.stop();
      } catch {
        /* noop */
      }
    }
    disconnectAll();
  };
}

function connectSfx(node: AudioNode) {
  if (!sfxBus) ensureGraph();
  if (sfxBus) node.connect(sfxBus);
}

function pinkNoiseBuffer(c: AudioContext): AudioBuffer {
  const len = Math.floor(c.sampleRate * 0.25);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0,
    b3 = 0,
    b4 = 0,
    b5 = 0,
    b6 = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    d[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
    d[i] *= 0.11;
    b6 = white * 0.115926;
  }
  return buf;
}

/** Short UI tap */
export function playClick() {
  const c = ensureGraph();
  if (!c || !sfxBus) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(660, t);
  o.frequency.exponentialRampToValueAtTime(990, t + 0.04);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.12, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.07);
  o.connect(g);
  connectSfx(g);
  o.start(t);
  o.stop(t + 0.08);
}

/** Timer urgency (last seconds) */
export function playTick() {
  const c = ensureGraph();
  if (!c || !sfxBus) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(420, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.06, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.05);
  o.connect(g);
  connectSfx(g);
  o.start(t);
  o.stop(t + 0.06);
}

/** Correct answer — bright major arpeggio */
export function playCorrect() {
  const c = ensureGraph();
  if (!c || !sfxBus) return;
  const t = c.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    const st = t + i * 0.055;
    g.gain.setValueAtTime(0, st);
    g.gain.linearRampToValueAtTime(0.11, st + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, st + 0.28);
    o.connect(g);
    connectSfx(g);
    o.start(st);
    o.stop(st + 0.3);
  });
}

/** Wrong — low descending blurp */
export function playWrong() {
  const c = ensureGraph();
  if (!c || !sfxBus) return;
  const t = c.currentTime;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = "sawtooth";
  o.frequency.setValueAtTime(220, t);
  o.frequency.exponentialRampToValueAtTime(90, t + 0.22);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 700;
  o.connect(f);
  f.connect(g);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.07, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.25);
  connectSfx(g);
  o.start(t);
  o.stop(t + 0.28);
}

/** New question screen — filtered noise sweep */
export function playWhoosh() {
  const c = ensureGraph();
  if (!c || !sfxBus) return;
  const t = c.currentTime;
  const buf = pinkNoiseBuffer(c);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(500, t);
  filter.frequency.exponentialRampToValueAtTime(2200, t + 0.16);
  filter.Q.value = 1.4;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.07, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0008, t + 0.2);
  src.connect(filter);
  filter.connect(g);
  connectSfx(g);
  src.start(t);
  src.stop(t + 0.22);
}

/** Ranking / podium sting */
export function playRankingSting() {
  const c = ensureGraph();
  if (!c || !sfxBus) return;
  const t = c.currentTime;
  const freqs = [392, 493.88, 587.33];
  freqs.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "triangle";
    o.frequency.value = f;
    const st = t + i * 0.07;
    g.gain.setValueAtTime(0, st);
    g.gain.linearRampToValueAtTime(0.08, st + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0008, st + 0.45);
    o.connect(g);
    connectSfx(g);
    o.start(st);
    o.stop(st + 0.5);
  });
}

/** Game start / fanfare lite */
export function playGameStart() {
  const c = ensureGraph();
  if (!c || !sfxBus) return;
  const t = c.currentTime;
  const seq = [261.63, 329.63, 392, 523.25];
  seq.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = f;
    const st = t + i * 0.06;
    g.gain.setValueAtTime(0, st);
    g.gain.linearRampToValueAtTime(0.1, st + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0008, st + 0.35);
    o.connect(g);
    connectSfx(g);
    o.start(st);
    o.stop(st + 0.38);
  });
}

/** Victory flourish (final screen) */
export function playVictory() {
  const c = ensureGraph();
  if (!c || !sfxBus) return;
  const t = c.currentTime;
  const notes = [392, 493.88, 587.33, 783.99, 987.77];
  notes.forEach((f, i) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = "sine";
    o.frequency.value = f;
    const st = t + i * 0.065;
    g.gain.setValueAtTime(0, st);
    g.gain.linearRampToValueAtTime(0.09, st + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, st + 0.4);
    o.connect(g);
    connectSfx(g);
    o.start(st);
    o.stop(st + 0.42);
  });
}
