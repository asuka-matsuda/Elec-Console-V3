/**
 * 不可分文字列結合（改行防止）ユーティリティ
 *
 * 指定単語の途中で不自然な改行が発生しないよう Word Joiner (\u2060) を挿入して保護します。
 */

// 文字間に挿入する Word Joiner（不可視の改行禁止制御文字）
export const WORD_JOINER = '\u2060'
// 改行禁止ハイフン（Non-breaking hyphen）
export const NO_BREAK_HYPHEN = '\u2011'

/**
 * 文字列の各文字間に Word Joiner (\u2060) を挿入して不可分な1単語として結合する
 */
export function joinWithWordJoiner(word: string): string {
  if (!word || word.length <= 1) return word
  // 既存の \u2060 を一旦除去して二重結合を防止
  const clean = word.replaceAll(WORD_JOINER, '')

  return clean.split('').join(WORD_JOINER)
}

/**
 * テキストに対して改行禁止処理を適用する純粋関数
 * 1. 〇-〇（英数字・ハイフン結合記号: 1-1, 1L-1, A-2 など）の改行禁止化
 * 2. 〇〇盤（漢字・カタカナ・英数字＋盤: 分電盤, 電灯盤, 動力盤 など）の自動改行禁止化
 * 3. カスタム登録ワードの改行禁止化
 */
export function applyNoBreakToText(val: unknown, customWords: readonly string[] = []): unknown {
  if (typeof val !== 'string' || !val) return val

  let result = val

  // 1. 〇-〇 パターン（1-1, 1L-1, A-2 など）
  result = result.replace(/([a-zA-Z0-9]+)-([a-zA-Z0-9]+)/g, (_, p1, p2) => {
    return joinWithWordJoiner(`${p1}${NO_BREAK_HYPHEN}${p2}`)
  })

  // 2. 〇〇盤 パターン
  result = result.replace(/(分電盤|電灯盤|動力盤|配電盤|制御盤|受電盤|高圧盤|開閉盤|変電盤|コンセント盤|継電器盤|整流器盤|端子盤|通信盤|火報盤|保安盤|ゲート盤|[一-龠]{2,3}盤|[ァ-ヴー]{2,4}盤)/g, (match) => {
    return joinWithWordJoiner(match)
  })

  // 3. 手動登録ワード（文字数降順でマッチング）
  if (customWords.length > 0) {
    const sortedWords = [...customWords].sort((a, b) => b.length - a.length)

    for (const word of sortedWords) {
      if (!word || word.length < 2) continue
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(escaped, 'g')

      result = result.replace(regex, match => joinWithWordJoiner(match))
    }
  }

  return result
}
