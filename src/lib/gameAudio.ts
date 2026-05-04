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
let ambientProfile: "calm" | "gameplay" = "calm";
let gameplayIntensity = 0.15;

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

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
 * Lo-fi ambient bed sem ruído contínuo:
 * progressão suave com pad filtrado + notas "chime" em pulso lento.
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

  const padLP = c.createBiquadFilter();
  padLP.type = "lowpass";
  padLP.frequency.value = 1650;
  padLP.Q.value = 0.28;
  toDisconnect.push(padLP);

  const padMix = c.createGain();
  padMix.gain.value = 0.34;
  padLP.connect(padMix);
  toDisconnect.push(padMix);

  const padNotes = [146.83, 196.0, 220.0, 293.66];
  for (const freq of padNotes) {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.value = 0.022;
    o.connect(g);
    g.connect(padLP);
    o.start();
    toStop.push(o);
    toDisconnect.push(o, g);
  }

  const lfo = c.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.09;
  const lfoDepth = c.createGain();
  lfoDepth.gain.value = 110;
  lfo.connect(lfoDepth);
  lfoDepth.connect(padLP.frequency);
  lfo.start();
  toStop.push(lfo);
  toDisconnect.push(lfo, lfoDepth);

  // Sequência lo-fi: Dm7 -> G7 -> Cmaj7 -> Am7
  const chordSteps = [
    [146.83, 220.0, 261.63, 293.66],
    [196.0, 246.94, 293.66, 392.0],
    [130.81, 196.0, 246.94, 329.63],
    [110.0, 164.81, 220.0, 261.63],
  ];
  let chordStep = 0;
  const chordMs = 4200;
  const chordId = window.setInterval(() => {
    if (c.state === "closed") return;
    const notes = chordSteps[chordStep % chordSteps.length];
    const t = c.currentTime + 0.03;
    for (let i = 0; i < padNotes.length; i += 1) {
      padNotes[i] = notes[i];
    }
    chordStep += 1;
    // glide para evitar cliques
    for (let i = 0; i < padNotes.length; i += 1) {
      const osc = toStop[i];
      osc.frequency.cancelScheduledValues(t);
      osc.frequency.linearRampToValueAtTime(padNotes[i], t + 0.45);
    }
  }, chordMs);

  const chimeBus = c.createGain();
  chimeBus.gain.value = 0.5;
  toDisconnect.push(chimeBus);

  const chimeBP = c.createBiquadFilter();
  chimeBP.type = "bandpass";
  chimeBP.frequency.value = 1400;
  chimeBP.Q.value = 0.8;
  chimeBus.connect(chimeBP);
  toDisconnect.push(chimeBP);

  const chimeNotes = [293.66, 329.63, 392.0, 440.0, 493.88];
  let chimeStep = 0;
  const chimeId = window.setInterval(() => {
    const t = c.currentTime + 0.02;
    const o = c.createOscillator();
    o.type = "sine";
    o.frequency.value = chimeNotes[chimeStep % chimeNotes.length];
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.032, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0008, t + 0.7);
    o.connect(g);
    g.connect(chimeBus);
    o.start(t);
    o.stop(t + 0.8);
    toDisconnect.push(o, g);
    chimeStep += 1;
  }, 1650);

  const delay = c.createDelay(2.0);
  delay.delayTime.value = 0.42;
  const fb = c.createGain();
  fb.gain.value = 0.2;
  const dry = c.createGain();
  dry.gain.value = 0.8;
  const wet = c.createGain();
  wet.gain.value = 0.22;
  toDisconnect.push(delay, fb, dry, wet);

  padMix.connect(dry);
  chimeBP.connect(dry);
  padMix.connect(delay);
  chimeBP.connect(delay);
  delay.connect(wet);
  delay.connect(fb);
  fb.connect(delay);

  dry.connect(musicBus);
  wet.connect(musicBus);

  ambientTeardown = () => {
    window.clearInterval(chordId);
    window.clearInterval(chimeId);
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

function startGameplayAmbientInternal() {
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

  const hp = c.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 120;
  hp.Q.value = 0.4;
  toDisconnect.push(hp);

  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 2600;
  lp.Q.value = 0.45;
  hp.connect(lp);
  toDisconnect.push(lp);

  const baseMix = c.createGain();
  baseMix.gain.value = 0.24;
  lp.connect(baseMix);
  toDisconnect.push(baseMix);

  const o1 = c.createOscillator();
  o1.type = "triangle";
  o1.frequency.value = 110;
  const g1 = c.createGain();
  g1.gain.value = 0.03;
  o1.connect(g1);
  g1.connect(hp);
  o1.start();

  const o2 = c.createOscillator();
  o2.type = "sawtooth";
  o2.frequency.value = 220;
  const g2 = c.createGain();
  g2.gain.value = 0.012;
  o2.connect(g2);
  g2.connect(hp);
  o2.start();

  toStop.push(o1, o2);
  toDisconnect.push(o1, g1, o2, g2);

  const pulse = c.createGain();
  pulse.gain.value = 0.0001;
  toDisconnect.push(pulse);

  const pulseOsc = c.createOscillator();
  pulseOsc.type = "square";
  pulseOsc.frequency.value = 440;
  pulseOsc.connect(pulse);
  pulse.connect(hp);
  pulseOsc.start();
  toStop.push(pulseOsc);
  toDisconnect.push(pulseOsc);

  const leadNotes = [293.66, 329.63, 392, 440, 392, 329.63];
  let leadStep = 0;
  let leadMs = 300;
  const runLead = () => {
    const t = c.currentTime + 0.02;
    const freq = leadNotes[leadStep % leadNotes.length];
    const intensity = gameplayIntensity;
    pulseOsc.frequency.cancelScheduledValues(t);
    pulseOsc.frequency.setValueAtTime(freq * (1 + intensity * 0.08), t);
    pulse.gain.cancelScheduledValues(t);
    pulse.gain.setValueAtTime(0.0001, t);
    pulse.gain.linearRampToValueAtTime(0.028 + intensity * 0.034, t + 0.012);
    pulse.gain.exponentialRampToValueAtTime(0.0008, t + 0.17 - intensity * 0.04);
    leadStep += 1;
  };
  const leadTick = () => {
    runLead();
    const intensity = gameplayIntensity;
    const next = Math.max(170, 300 - intensity * 110);
    if (Math.abs(next - leadMs) > 8) {
      leadMs = next;
      window.clearInterval(leadId);
      leadId = window.setInterval(leadTick, leadMs);
    }
  };
  let leadId = window.setInterval(leadTick, leadMs);

  const sideId = window.setInterval(() => {
    const t = c.currentTime + 0.01;
    const intensity = gameplayIntensity;
    const low = 0.2 + intensity * 0.14;
    const high = 0.25 + intensity * 0.25;
    baseMix.gain.cancelScheduledValues(t);
    baseMix.gain.setValueAtTime(low, t);
    baseMix.gain.linearRampToValueAtTime(high, t + (0.13 - intensity * 0.05));
  }, 600);

  // Camada "metal": serra distorcida e riffs curtos no fim da partida.
  const metalOsc = c.createOscillator();
  metalOsc.type = "sawtooth";
  metalOsc.frequency.value = 110;
  const metalGain = c.createGain();
  metalGain.gain.value = 0.0001;
  const shaper = c.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i += 1) {
    const x = (i / 255) * 2 - 1;
    curve[i] = Math.tanh(3.2 * x);
  }
  shaper.curve = curve;
  shaper.oversample = "2x";
  const metalLP = c.createBiquadFilter();
  metalLP.type = "lowpass";
  metalLP.frequency.value = 1600;

  metalOsc.connect(metalGain);
  metalGain.connect(shaper);
  shaper.connect(metalLP);
  metalLP.connect(baseMix);
  metalOsc.start();
  toStop.push(metalOsc);
  toDisconnect.push(metalOsc, metalGain, shaper, metalLP);

  const metalPattern = [82.41, 98.0, 110.0, 130.81];
  let metalStep = 0;
  const metalId = window.setInterval(() => {
    const intensity = gameplayIntensity;
    if (intensity < 0.58) return;
    const t = c.currentTime + 0.015;
    const f = metalPattern[metalStep % metalPattern.length];
    metalOsc.frequency.cancelScheduledValues(t);
    metalOsc.frequency.setValueAtTime(f * (1 + intensity * 0.12), t);
    metalGain.gain.cancelScheduledValues(t);
    metalGain.gain.setValueAtTime(0.0001, t);
    metalGain.gain.linearRampToValueAtTime(0.018 + (intensity - 0.58) * 0.045, t + 0.01);
    metalGain.gain.exponentialRampToValueAtTime(0.0009, t + 0.11);
    metalLP.frequency.setValueAtTime(1200 + intensity * 1200, t);
    metalStep += 1;
  }, 240);

  // Drops progressivos: pausa curta + volta forte conforme intensidade.
  let dropCount = 0;
  const dropId = window.setInterval(() => {
    const intensity = gameplayIntensity;
    if (intensity < 0.35) return;
    dropCount += 1;
    const t = c.currentTime + 0.03;
    const dropWindow = 0.07 + intensity * 0.09;
    if (dropCount % 4 !== 0) return;
    baseMix.gain.cancelScheduledValues(t);
    baseMix.gain.setValueAtTime(0.0001, t);
    baseMix.gain.linearRampToValueAtTime(0.24 + intensity * 0.32, t + dropWindow);
    pulse.gain.cancelScheduledValues(t);
    pulse.gain.setValueAtTime(0.0001, t);
    pulse.gain.linearRampToValueAtTime(0.04 + intensity * 0.06, t + dropWindow);
  }, 600);

  const delay = c.createDelay(1.2);
  delay.delayTime.value = 0.24;
  const fb = c.createGain();
  fb.gain.value = 0.14;
  const dry = c.createGain();
  dry.gain.value = 0.86;
  const wet = c.createGain();
  wet.gain.value = 0.18;
  toDisconnect.push(delay, fb, dry, wet);

  baseMix.connect(dry);
  baseMix.connect(delay);
  delay.connect(wet);
  delay.connect(fb);
  fb.connect(delay);

  dry.connect(musicBus);
  wet.connect(musicBus);

  ambientTeardown = () => {
    window.clearInterval(leadId);
    window.clearInterval(sideId);
    window.clearInterval(metalId);
    window.clearInterval(dropId);
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

export function setAmbientProfile(profile: "calm" | "gameplay") {
  if (ambientProfile === profile && isAmbientPlaying()) return;
  ambientProfile = profile;
  stopAmbient();
  if (profile === "gameplay") {
    startGameplayAmbientInternal();
    return;
  }
  startAmbient();
}

export function setGameplayIntensity(progress: number) {
  gameplayIntensity = clamp01(progress);
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
