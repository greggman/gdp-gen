/**
 * World scripts used for the (made-up) text in designs.
 *
 * The text is decorative nonsense, but it must still look *orthographically
 * plausible* for its writing system -- not just random codepoints. Two rules
 * drive that:
 *
 *  1. Words are built from per-language *patterns* over named character
 *     classes, not by sampling every character independently. For example
 *     Japanese words are a hiragana run, a katakana run, a kanji compound, or a
 *     kanji stem + hiragana okurigana -- never "HKHKCHK" gibberish.
 *  2. Bicameral scripts (Latin, Greek, Cyrillic, Armenian) are generated in
 *     lowercase and cased *consistently per phrase* (all-lower / Title / UPPER /
 *     Sentence), never mixed case mid-word ("aAaaAa").
 *  3. CJK draws from curated per-language character pools (see cjk.ts), never a
 *     raw codepoint range, so Japanese uses only Japanese kanji and Simplified
 *     vs Traditional Chinese stay separate.
 */
import {CHINESE_SIMPLIFIED, CHINESE_TRADITIONAL, JAPANESE_KANJI} from './cjk.js';

/** A named set of glyphs to sample from: codepoint ranges or an explicit pool. */
export interface CharClass {
  name: string;
  /** Inclusive [start, end] codepoint ranges (ignored when `chars` is set). */
  ranges: Array<[number, number]>;
  /**
   * An explicit pool of characters to sample from. Use this for scripts where a
   * raw codepoint range would emit invalid characters (e.g. CJK, where the block
   * mixes languages and Traditional/Simplified forms). Overrides `ranges`.
   */
  chars?: string;
}

/** One segment of a word: pick `len` glyphs from character class `cls`. */
export interface WordSegment {
  cls: string;
  len: [number, number];
}

/** A plausible word shape: a sequence of segments. */
export interface WordPattern {
  segments: WordSegment[];
  weight?: number;
}

export interface Script {
  name: string;
  /** Right-to-left script (affects text-anchor and `direction`). */
  rtl?: boolean;
  /** Glyphs are roughly full-width (CJK) -- affects width estimates. */
  fullWidth?: boolean;
  /** BCP-47 language tag, set as xml:lang so Han-unified glyphs render per locale. */
  lang?: string;
  /** Whether words are separated by spaces (CJK usually are not). */
  spaceWords: boolean;
  /**
   * Bicameral: glyphs are sampled in lowercase and case is applied per phrase
   * via toUpperCase/toLowerCase. Latin uses a syllable model instead of classes.
   */
  bicameral?: boolean;
  classes: CharClass[];
  wordPatterns: WordPattern[];
  /** Relative likelihood of being chosen. */
  weight?: number;
}

/** Builds a single-class, single-pattern script (the common case). */
function simpleScript(
  name: string,
  ranges: Array<[number, number]>,
  len: [number, number],
  extra: Partial<Script> = {},
): Script {
  return {
    name,
    spaceWords: true,
    classes: [{name: 'base', ranges}],
    wordPatterns: [{segments: [{cls: 'base', len}]}],
    ...extra,
  };
}

// Selection weights (used by chooseText) approximate how often each script is
// seen "in the wild", but FLOORED so rare scripts still appear for variety:
// Latin ~36%, Chinese (Simplified+Traditional) ~16%, the rest sharing ~48% with
// a gentle prevalence lean down to a ~3% floor. Tweak these to taste.
export const SCRIPTS: Script[] = [
  // Latin is special-cased in textgen (syllable model); classes are unused but
  // present for shape consistency.
  {
    name: 'latin',
    spaceWords: true,
    bicameral: true,
    weight: 36,
    classes: [{name: 'base', ranges: [[0x61, 0x7a]]}],
    wordPatterns: [{segments: [{cls: 'base', len: [3, 9]}]}],
  },
  // Chinese: Simplified and Traditional are SEPARATE scripts (different curated
  // pools) so a design never mixes the two writing standards.
  {
    name: 'chinese',
    fullWidth: true,
    spaceWords: false,
    weight: 11,
    lang: 'zh-Hans',
    classes: [{name: 'kanji', ranges: [], chars: CHINESE_SIMPLIFIED}],
    // Real Chinese words are mostly 1-2 characters; occasionally longer.
    wordPatterns: [
      {segments: [{cls: 'kanji', len: [2, 2]}], weight: 4},
      {segments: [{cls: 'kanji', len: [1, 1]}], weight: 2},
      {segments: [{cls: 'kanji', len: [3, 4]}], weight: 1},
    ],
  },
  {
    name: 'chinese-traditional',
    fullWidth: true,
    spaceWords: false,
    weight: 5,
    lang: 'zh-Hant',
    classes: [{name: 'kanji', ranges: [], chars: CHINESE_TRADITIONAL}],
    wordPatterns: [
      {segments: [{cls: 'kanji', len: [2, 2]}], weight: 4},
      {segments: [{cls: 'kanji', len: [1, 1]}], weight: 2},
      {segments: [{cls: 'kanji', len: [3, 4]}], weight: 1},
    ],
  },
  {
    name: 'japanese',
    fullWidth: true,
    spaceWords: false,
    weight: 5,
    lang: 'ja',
    classes: [
      {name: 'hira', ranges: [[0x3041, 0x3096]]},
      {name: 'kata', ranges: [[0x30a1, 0x30fa]]},
      // Curated Japanese kanji only -- never the raw CJK block.
      {name: 'kanji', ranges: [], chars: JAPANESE_KANJI},
    ],
    // Plausible word shapes: hiragana word, katakana loanword, kanji compound,
    // or kanji stem + hiragana okurigana.
    wordPatterns: [
      {segments: [{cls: 'hira', len: [2, 4]}], weight: 3},
      {segments: [{cls: 'kata', len: [3, 6]}], weight: 2},
      {segments: [{cls: 'kanji', len: [2, 3]}], weight: 3},
      {segments: [{cls: 'kanji', len: [1, 2]}, {cls: 'hira', len: [1, 2]}], weight: 2},
    ],
  },
  simpleScript('korean', [[0xac00, 0xd7a3]], [2, 4], {weight: 4, fullWidth: true}),
  // Thai consonants only (no lone combining marks); not space-separated.
  simpleScript('thai', [[0x0e01, 0x0e2e]], [3, 8], {weight: 4, spaceWords: false}),
  {
    name: 'arabic',
    rtl: true,
    spaceWords: true,
    weight: 7,
    classes: [{name: 'base', ranges: [[0x0621, 0x063a], [0x0641, 0x064a]]}],
    wordPatterns: [{segments: [{cls: 'base', len: [3, 7]}]}],
  },
  simpleScript('devanagari', [[0x0905, 0x0939]], [3, 7], {weight: 7}),
  simpleScript('hebrew', [[0x05d0, 0x05ea]], [3, 7], {rtl: true, weight: 3}),
  // Bicameral: sample lowercase, case per phrase.
  simpleScript('greek', [[0x03b1, 0x03c9]], [3, 8], {bicameral: true, weight: 3}),
  simpleScript('cyrillic', [[0x0430, 0x044f]], [3, 9], {bicameral: true, weight: 5}),
  simpleScript('armenian', [[0x0561, 0x0586]], [3, 8], {bicameral: true, weight: 3}),
  simpleScript('georgian', [[0x10d0, 0x10fa]], [3, 8], {weight: 3}),
  // Tamil vowels + a contiguous run of consonants (avoids unassigned gaps).
  simpleScript('tamil', [[0x0b85, 0x0b8a], [0x0bae, 0x0bb9]], [2, 6], {weight: 4}),
];

export function scriptByName(name: string): Script {
  return SCRIPTS.find(s => s.name === name) ?? SCRIPTS[0];
}
