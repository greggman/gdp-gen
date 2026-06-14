/**
 * Curated CJK character pools.
 *
 * Sampling the whole CJK Unified Ideographs block produces characters that are
 * wrong for a given language: kanji not used in Japanese, or a mix of
 * Traditional and Simplified Chinese forms. Those stick out immediately to a
 * native reader. Instead each language draws from a hand-picked set of common,
 * unambiguous characters:
 *  - JAPANESE_KANJI: common Jōyō kanji in Japanese (shinjitai) forms.
 *  - CHINESE_SIMPLIFIED / CHINESE_TRADITIONAL: common hanzi, kept in separate
 *    pools so a design never mixes the two writing standards.
 *
 * These are decorative-text pools, not exhaustive dictionaries.
 */

export const JAPANESE_KANJI =
  '日月火水木金土年時間分人大中小山川田力男女子目口手足耳心体名前私先生学校友父母兄弟家国語本読書見聞言話行来帰出入立休食飲買売持待思知会社員仕事店屋道路駅車電気天雨雪風空海花草林森石町村市県東西南北上下左右内外多少高低長短新古明暗白黒赤青色音楽絵地図写真物事所場方向今朝昼夜春夏秋冬数字一二三四五六七八九十百千万円';

export const CHINESE_SIMPLIFIED =
  '的一是不了人我在有他这中大来上国个到说们为子和你地出道也时年得就那要下以生会自着去之过家学对可她里后小么心多天而能好都然没日起成事只作当想看文手十用主行方又如前所本面公同三已老从民分外但身高等新社正反院海物无开见经头动两长样现将与关点觉该话记实业内数题门问间给边应风电车区写师习书东马鸟鱼龙爱县园图团报观难队阳际专转续总历称价钱银铁';

export const CHINESE_TRADITIONAL =
  '的一是不了人我在有他這中大來上國個到說們為子和你地出道也時年得就那要下以生會自著去之過家學對可她裡後小麼心多天而能好都然沒日起成事只作當想看文手十用主行方又如前所本面公同三已老從民分外但身高等新社正反院海物無開見經頭動兩長樣現將與關點覺該話記實業內數題門問間給邊應風電車區寫師習書東馬鳥魚龍愛縣園圖團報觀難隊陽際專轉續總歷稱價錢銀鐵';
