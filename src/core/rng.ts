/**
 * Seeded pseudo-random number generator and sampling helpers.
 *
 * Uses mulberry32: tiny, fast, and good enough for visual generation. A fixed
 * seed always produces the same stream, which makes designs reproducible.
 */

/** Hashes a string into a 32-bit unsigned integer seed. */
export function hashSeed(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A deterministic random source bound to a seed. */
export class Rng {
  private state: number;

  constructor(readonly seed: number) {
    this.state = seed >>> 0 || 1;
  }

  /** Returns a float in [0, 1). */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /** True with the given probability (default 0.5). */
  chance(probability = 0.5): boolean {
    return this.next() < probability;
  }

  /** Returns a uniformly chosen element. */
  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length)];
  }

  /** Returns an element chosen by relative weights (same length as items). */
  weighted<T>(items: readonly T[], weights: readonly number[]): T {
    let total = 0;
    for (const w of weights) total += w;
    let r = this.next() * total;
    for (let i = 0; i < items.length; i++) {
      r -= weights[i];
      if (r < 0) return items[i];
    }
    return items[items.length - 1];
  }

  /** Approximately Gaussian value via the central-limit trick. */
  gaussian(mean = 0, stdDev = 1): number {
    const u = (this.next() + this.next() + this.next() + this.next()) / 4;
    return mean + (u - 0.5) * 2 * Math.sqrt(3) * 2 * stdDev;
  }

  /** Fisher-Yates shuffle returning a new array. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** Picks `count` distinct elements (or all, if count exceeds length). */
  sample<T>(items: readonly T[], count: number): T[] {
    return this.shuffle(items).slice(0, Math.min(count, items.length));
  }
}

/** Creates an Rng from a string or numeric seed. */
export function makeRng(seed: string | number): Rng {
  return new Rng(typeof seed === 'number' ? seed >>> 0 : hashSeed(seed));
}
