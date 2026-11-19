"use client";

/**
 * Short sounds for things worth hearing at a busy stall: a sale saved, a UPI
 * payment arriving, closing time. Made with Web Audio, so there are no sound
 * files to download and they work offline. On by default; switched per phone.
 */

export type Cue = "sale" | "expense" | "payment" | "alert";

/** [frequency in Hz, start in seconds, length in seconds] for each note. */
const NOTES: Record<Cue, ReadonlyArray<readonly [number, number, number]>> = {
  sale: [
    [880, 0, 0.12],
    [1318.5, 0.09, 0.26],
  ],
  expense: [
    [587.3, 0, 0.12],
    [440, 0.1, 0.22],
  ],
  payment: [
    [1046.5, 0, 0.12],
    [1318.5, 0.1, 0.12],
    [1568, 0.2, 0.34],
  ],
  alert: [
    [880, 0, 0.2],
    [659.3, 0.24, 0.2],
    [880, 0.48, 0.2],
    [659.3, 0.72, 0.34],
  ],
};

const VIBRATE: Partial<Record<Cue, number[]>> = {
  payment: [120, 60, 120],
  alert: [300, 120, 300, 120, 300],
};

const STORAGE_KEY = "stall-sounds";
const listeners = new Set<() => void>();
let context: AudioContext | undefined;

export function soundsOn(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundsOn(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Storage blocked: the choice lasts until the page closes.
  }
  for (const listener of listeners) listener();
}

export function subscribeSounds(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Browsers only let a page make sound after the person has tapped it once.
 * Unknown (older browsers): try anyway.
 */
function mayPlay(): boolean {
  const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
    .userActivation;
  return activation ? activation.hasBeenActive : true;
}

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  if (context.state === "suspended") void context.resume().catch(() => {});
  return context;
}

/**
 * Plays a cue (and vibrates for payments and alerts) if sounds are on.
 * Returns false when it could not: switched off, or the page was never tapped.
 */
export function playCue(cue: Cue, { force = false }: { force?: boolean } = {}): boolean {
  if ((!force && !soundsOn()) || !mayPlay()) return false;
  try {
    const ctx = audio();
    if (ctx) {
      const start = ctx.currentTime + 0.02;
      for (const [frequency, at, length] of NOTES[cue]) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = cue === "alert" ? "triangle" : "sine";
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, start + at);
        gain.gain.exponentialRampToValueAtTime(0.3, start + at + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + at + length);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start + at);
        osc.stop(start + at + length + 0.05);
      }
    }
    const pattern = VIBRATE[cue];
    if (pattern) navigator.vibrate?.(pattern);
    return true;
  } catch {
    return false; // sound is a nicety; never let it break a save
  }
}
