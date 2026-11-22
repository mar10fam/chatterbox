/**
 * A short, bright "bling!" synthesised with Web Audio (no audio file).
 *
 * Browsers only allow sound after a user gesture, so call primeDing() from a
 * click/tap handler first (e.g. the mic button). playDing() can then be
 * called later, after an await.
 */

let ctx: AudioContext | null = null;

export function primeDing(): void {
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
}

function chime(ac: AudioContext, out: AudioNode, freq: number, at: number, peak: number, decay: number) {
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(peak, at + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  gain.connect(out);

  // A sine body plus a quiet octave-up triangle for sparkle.
  for (const [type, mult, level] of [
    ["sine", 1, 1],
    ["triangle", 2, 0.18],
  ] as const) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq * mult, at);
    g.gain.value = level;
    osc.connect(g).connect(gain);
    osc.start(at);
    osc.stop(at + decay + 0.05);
  }
}

/** Rising three-note arpeggio: C6 → G6 → C7, ~0.6 s. */
export function playDing(): void {
  if (!ctx) return;
  const ac = ctx;
  const master = ac.createGain();
  master.gain.value = 0.22;
  master.connect(ac.destination);
  const t = ac.currentTime + 0.01;
  chime(ac, master, 1046.5, t, 0.9, 0.35);
  chime(ac, master, 1568.0, t + 0.085, 0.9, 0.4);
  chime(ac, master, 2093.0, t + 0.17, 0.7, 0.55);
}
