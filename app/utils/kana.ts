/**
 * 五十音分類・カナフィルターユーティリティ
 */

export type KanaRowKey
  = | 'a'
    | 'k'
    | 's'
    | 't'
    | 'n'
    | 'h'
    | 'm'
    | 'y'
    | 'r'
    | 'w'
    | 'other'

/**
 * カナ文字列の先頭文字から五十音の行（あ行〜わ行、その他）を判定する
 */
export function getKanaRow(kanaStr: string): KanaRowKey {
  if (!kanaStr) return 'other'
  const firstChar = kanaStr.charAt(0)

  if (/[ぁ-おア-オ]/.test(firstChar)) return 'a'
  if (/[か-こカ-コが-ごガ-ゴ]/.test(firstChar)) return 'k'
  if (/[さ-そサ-ソざ-ぞザ-ゾ]/.test(firstChar)) return 's'
  if (/[た-とタ-トだ-どダ-ド]/.test(firstChar)) return 't'
  if (/[な-のナ-ノ]/.test(firstChar)) return 'n'
  if (
    /[\u306f-\u307b\u30cf-\u30db\u3070-\u307c\u30d0-\u30dc\u3071-\u307d\u30d1-\u30dd]/.test(
      firstChar,
    )
  ) {
    return 'h'
  }
  if (/[\u307e-\u3082\u30de-\u30e2]/.test(firstChar)) return 'm'
  if (/[や-よヤ-ヨ]/.test(firstChar)) return 'y'
  if (/[ら-ろラ-ロ]/.test(firstChar)) return 'r'
  if (/[わ-んワ-ン]/.test(firstChar)) return 'w'

  return 'other'
}

/**
 * カナ順（五十音順）でアイテム配列をソートする
 */
export function sortByKana<T>(
  items: readonly T[],
  kanaSelector: (item: T) => string | undefined,
): T[] {
  return [...items].sort((a, b) =>
    (kanaSelector(a) || '').localeCompare(kanaSelector(b) || '', 'ja'),
  )
}

/**
 * 選択された五十音の行でアイテム配列をフィルタリングする
 * ※ 'w' 行が選択されている場合は 'other'（英数字や記号）も含める
 */
export function filterByKana<T>(
  items: readonly T[],
  activeRows: readonly string[],
  kanaSelector: (item: T) => string | undefined,
): T[] {
  if (activeRows.length === 0) return [...items]

  return items.filter((item) => {
    const row = getKanaRow(kanaSelector(item) || '')

    return (
      activeRows.includes(row)
      || (activeRows.includes('w') && row === 'other')
    )
  })
}

/**
 * アイテム配列に含まれる五十音の行の集合（Set）を収集する
 */
export function collectAvailableKanaRows<T>(
  items: readonly T[],
  kanaSelector: (item: T) => string | undefined,
): Set<string> {
  const rows = new Set<string>()

  items.forEach((item) => {
    rows.add(getKanaRow(kanaSelector(item) || ''))
  })

  return rows
}
