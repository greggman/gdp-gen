/**
 * Made-up text generation. Output is decorative nonsense, but orthographically
 * plausible: words follow per-language shape patterns (see scripts.ts) and
 * bicameral scripts are cased consistently per phrase rather than per glyph.
 */
import {Rng} from '../core/rng.js';
import {CharClass, Script, scriptByName, WordPattern} from './scripts.js';

/**
 * A single random glyph from a character class (explicit pool or ranges). When
 * `leading`, characters in `cls.noLeading` are excluded (so a run never begins
 * with a small kana, the long-vowel mark, etc.).
 */
function glyphFrom(rng: Rng, cls: CharClass, leading = false): string {
  if (cls.chars) {
    let pool = Array.from(cls.chars);
    if (leading && cls.noLeading) {
      const bad = new Set(Array.from(cls.noLeading));
      pool = pool.filter(c => !bad.has(c));
    }
    return pool[rng.int(0, pool.length - 1)];
  }
  const [lo, hi] = rng.pick(cls.ranges);
  return String.fromCodePoint(rng.int(lo, hi));
}

const ONSETS = [
  'b', 'c', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v',
  'w', 'z', 'br', 'cr', 'dr', 'fl', 'gr', 'pl', 'pr', 'st', 'tr', 'th', 'ch', 'sh',
];
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'ae', 'ou', 'ia', 'eo'];
const CODAS = ['', '', '', 'n', 'r', 's', 't', 'm', 'l', 'x', 'ng', 'sk', 'rt'];

/** A pronounceable, lowercase fake Latin word. */
function latinWord(rng: Rng): string {
  const syllables = rng.int(1, 3);
  let out = '';
  for (let i = 0; i < syllables; i++) {
    out += rng.pick(ONSETS) + rng.pick(VOWELS) + (rng.chance(0.4) ? rng.pick(CODAS) : '');
  }
  return out;
}

function classByName(script: Script, name: string): CharClass {
  return script.classes.find(c => c.name === name) ?? script.classes[0];
}

/** Builds a word from a chosen pattern (lowercase for bicameral scripts). */
export function makeWord(rng: Rng, script: Script): string {
  if (script.name === 'latin') return latinWord(rng);
  const pattern = rng.weighted<WordPattern>(
    script.wordPatterns,
    script.wordPatterns.map(p => p.weight ?? 1),
  );
  let out = '';
  let first = true; // the first glyph of the whole word can't be a noLeading char
  for (const seg of pattern.segments) {
    const cls = classByName(script, seg.cls);
    const len = rng.int(seg.len[0], seg.len[1]);
    for (let i = 0; i < len; i++) {
      out += glyphFrom(rng, cls, first);
      first = false;
    }
  }
  return out;
}

/** Consistent casing styles for a whole phrase (never per-glyph mixing). */
export type Casing = 'lower' | 'upper' | 'title' | 'sentence';

function applyCasing(words: string[], casing: Casing): string[] {
  const title = (w: string) =>
    w ? w[0].toLocaleUpperCase() + w.slice(1).toLocaleLowerCase() : w;
  switch (casing) {
    case 'lower':
      return words.map(w => w.toLocaleLowerCase());
    case 'upper':
      return words.map(w => w.toLocaleUpperCase());
    case 'title':
      return words.map(title);
    case 'sentence':
      return words.map((w, i) => (i === 0 ? title(w) : w.toLocaleLowerCase()));
  }
}

export interface PhraseOptions {
  words?: number;
  /** Casing for bicameral scripts; ignored otherwise. */
  casing?: Casing;
}

/** A line of made-up text: several words joined per the script's rules. */
export function makePhrase(rng: Rng, script: Script, opts: PhraseOptions = {}): string {
  const count = opts.words ?? rng.int(1, 4);
  let words: string[] = [];
  for (let i = 0; i < count; i++) words.push(makeWord(rng, script));
  if (script.bicameral) {
    words = applyCasing(words, opts.casing ?? 'lower');
  }
  return words.join(script.spaceWords ? ' ' : '');
}

/** A short number/code label (years, editions) -- script-neutral. */
export function makeLabel(rng: Rng): string {
  const kinds = [
    () => String(rng.int(1960, 2030)),
    () => `No.${rng.int(1, 99)}`,
    () => `${rng.int(1, 12)}/${rng.int(1, 28)}`,
    () => `Vol.${rng.int(1, 40)}`,
    () => rng.pick(['I', 'II', 'III', 'IV', 'V', 'VI', 'X']),
  ];
  return rng.pick(kinds)();
}

/** Picks a display casing (titles favor UPPER/Title) for bicameral scripts. */
function displayCasing(rng: Rng): Casing {
  return rng.weighted<Casing>(['upper', 'title', 'lower'], [3, 2, 1]);
}

/**
 * A bundle of text for a design: a headline plus optional supporting lines, in
 * the chosen script, optionally paired with an English line.
 */
export interface TextBundle {
  headline: string;
  sub: string;
  body: string[];
  label: string;
  english?: string;
}

export function makeBundle(rng: Rng, scriptName: string, withEnglish: boolean): TextBundle {
  const script = scriptByName(scriptName);
  const bodyLines = rng.int(2, 5);
  const body: string[] = [];
  for (let i = 0; i < bodyLines; i++) {
    body.push(makePhrase(rng, script, {words: rng.int(3, 7), casing: 'sentence'}));
  }
  const latin = scriptByName('latin');
  return {
    headline: makePhrase(rng, script, {words: rng.int(1, 3), casing: displayCasing(rng)}),
    sub: makePhrase(rng, script, {words: rng.int(2, 4), casing: 'title'}),
    body,
    label: makeLabel(rng),
    english: withEnglish
      ? makePhrase(rng, latin, {words: rng.int(1, 3), casing: displayCasing(rng)})
      : undefined,
  };
}
