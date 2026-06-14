/** Registries for compositions and generators, with weighted selection. */
import {Composition, Generator} from './types.js';
import {Rng} from './rng.js';

const compositions: Composition[] = [];
const generators: Generator[] = [];

/** Registers one or more composition algorithms. */
export function registerComposition(...items: Composition[]): void {
  compositions.push(...items);
}

/** Registers one or more generators. */
export function registerGenerator(...items: Generator[]): void {
  generators.push(...items);
}

export function allCompositions(): readonly Composition[] {
  return compositions;
}

export function allGenerators(): readonly Generator[] {
  return generators;
}

function weightsOf(items: readonly {weight?: number}[]): number[] {
  return items.map(i => i.weight ?? 1);
}

/** Picks a composition by weight. Throws if none are registered. */
export function pickComposition(rng: Rng): Composition {
  if (!compositions.length) throw new Error('no compositions registered');
  return rng.weighted(compositions, weightsOf(compositions));
}

/** Picks a generator by weight, optionally filtered by category. */
export function pickGenerator(rng: Rng, category?: string): Generator {
  const pool = category
    ? generators.filter(g => g.category === category)
    : generators;
  if (!pool.length) throw new Error(`no generators${category ? ` in ${category}` : ''}`);
  return rng.weighted(pool, weightsOf(pool));
}

/** Finds a generator by exact name. */
export function getGenerator(name: string): Generator | undefined {
  return generators.find(g => g.name === name);
}
