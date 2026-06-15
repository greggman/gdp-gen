/**
 * Curated kana pools for Japanese.
 *
 * Sampling the raw hiragana/katakana Unicode blocks emits characters that look
 * wrong to a Japanese reader:
 *  - obsolete kana (ゐ ゑ ヰ ヱ ヲ and rare bikamoji like ヷヸヹヺ ゕ ゖ) that are
 *    not used in modern Japanese;
 *  - small kana (ぁ ぅ っ ゃ ... ) and the long-vowel mark ー, which never BEGIN a
 *    word -- they only follow another kana.
 *
 * So we use explicit modern pools, and a `*_NOLEAD` set marks the characters
 * that may not start a run (used by textgen to keep word-starts valid).
 */

// Modern hiragana: full-size set + common small kana. No ゐ/ゑ/ゕ/ゖ.
const HIRAGANA_LARGE =
  'あいうえおかきくけこがぎぐげごさしすせそざじずぜぞただちつてとだぢづでど' +
  'なにぬねのはひふへほばびぶべぼぱぴぷぺぽまみむめもやゆよらりるれろわをんゔ';
export const HIRAGANA_NOLEAD = 'ぁぃぅぇぉっゃゅょ';
export const HIRAGANA = HIRAGANA_LARGE + HIRAGANA_NOLEAD;

// Modern katakana: full-size set + common small kana + the long-vowel mark ー
// (very common in loanwords, but only mid-word). No ヰ/ヱ/ヲ/ヷ-ヺ/ヵ/ヶ.
const KATAKANA_LARGE =
  'アイウエオカキクケコガギグゲゴサシスセソザジズゼゾタチツテトダヂヅデド' +
  'ナニヌネノハヒフヘホバビブベボパピプペポマミムメモヤユヨラリルレロワンヴ';
export const KATAKANA_NOLEAD = 'ァィゥェォッャュョー';
export const KATAKANA = KATAKANA_LARGE + KATAKANA_NOLEAD;
