/**
 * 回路台帳・盤・設備列の共通見出しマッピングおよび値抽出ユーティリティ (SSoT)
 *
 * @description クライアント・サーバー両用で動作し、Excelシートやレコード値から
 * 系統・盤種別・盤名称・幹線可否・回路番号・回路名称などを誤検知なく正確に抽出します。
 */
import { normalizeHeaderName } from './excelNormalize'

/**
 * 回路台帳の各主要フィールドに対応する認識エイリアス定義
 */
export const CIRCUIT_FIELD_ALIASES = {
  // 1. 系統
  keiTo: {
    exact: ['系統', '系統名', '親系統', '電源系統', '配電系統'],
    fallback: [],
    exclude: ['伝送', '伝送系統'],
  },
  // 2. 盤種別
  banShubetsu: {
    exact: ['盤種別', '種別'],
    fallback: [],
    exclude: ['遮断器', '接地', '相'],
  },
  // 3. 盤名称
  banMeisho: {
    exact: ['盤名称', '分電盤名称', '盤名', '配電盤名称'],
    fallback: ['盤'],
    exclude: ['no', '番号', '容量', '種別', 'サイズ', 'mccb', '遮断器', '子盤', '親盤'],
  },
  // 4. 幹線可否 (幹線判定)
  kansenHantei: {
    exact: ['幹線判定', '幹線/二次側', '幹線/二次', '幹線二次', '幹線フラグ'],
    fallback: ['幹線'],
    exclude: ['番号', '容量', 'サイズ'],
  },
  // 回路番号・記号
  kairoBangou: {
    exact: ['回路番号', '回路no', '回路no.', '回路№', '番号'],
    fallback: [],
    exclude: ['盤', 'mccb', '遮断器', 'リレー', '機器'],
  },
  kairoKigou: {
    exact: ['回路記号', '記号'],
    fallback: [],
    exclude: ['盤', '遮断器'],
  },
  // 回路名称・負荷名称
  kairoMeisho: {
    exact: ['回路名称', '回路名', '負荷名称', '負荷名', '名称'],
    fallback: [],
    exclude: ['盤', '遮断器', 'ケーブル', '電線'],
  },
  // リモコン関連
  densoKeiTo: {
    exact: ['伝送系統', '伝送系統名', '伝送'],
    fallback: [],
    exclude: [],
  },
  fukaAddress: {
    exact: ['負荷アドレス', '負荷ｱﾄﾞﾚｽ', 'アドレス', 'ｱﾄﾞﾚｽ'],
    fallback: [],
    exclude: ['ip', 'mac'],
  },
  relayNumber: {
    exact: ['リレー番号', 'ﾘﾚｰ番号', 'リレーno', '機器番号'],
    fallback: [],
    exclude: ['盤', '回路'],
  },
  // 設備仕様
  haidenHoushiki: {
    exact: ['配電方式'],
    fallback: [],
    exclude: [],
  },
  souShubetsu: {
    exact: ['相種別'],
    fallback: [],
    exclude: [],
  },
  shadankiShubetsu: {
    exact: ['遮断器種別'],
    fallback: [],
    exclude: [],
  },
  shadankiYouryou: {
    exact: ['遮断器容量', '遮断器サイズ', '配電盤遮断器容量'],
    fallback: [],
    exclude: [],
  },
  cable: {
    exact: ['ケーブル', 'ケーブルリスト', '電線', 'ｹｰﾌﾞﾙﾘｽﾄ'],
    fallback: [],
    exclude: ['条数', 'サイズ'],
  },
  haisenJousuu: {
    exact: ['配線条数', '条数'],
    fallback: [],
    exclude: [],
  },
  setsuchiUmu: {
    exact: ['接地有無', '接地'],
    fallback: [],
    exclude: ['種別', 'リスト', '手動', 'c種', 'd種'],
  },
} as const

export interface AliasDefinition {
  exact: readonly string[]
  fallback?: readonly string[]
  exclude?: readonly string[]
}

/**
 * 優先度ルールに基づき、列名マップから最適な値を抽出する共通関数
 */
export function findValueByFieldAlias(
  values: Record<string, string>,
  aliasDef: AliasDefinition,
): string {
  const normEntries = Object.entries(values).map(([col, val]) => ({
    col,
    normCol: normalizeHeaderName(col),
    val,
  }))

  // 1. 完全一致（正規化後の一致）を最優先
  for (const kw of aliasDef.exact) {
    const normKw = normalizeHeaderName(kw)
    const match = normEntries.find(e => e.normCol === normKw && e.val?.trim())

    if (match) return match.val.trim()
  }

  // 2. 部分一致（除外語を含まない候補）
  const allKeywords = [...aliasDef.exact, ...(aliasDef.fallback || [])]
  const excludeWords = (aliasDef.exclude || []).map(normalizeHeaderName)

  for (const kw of allKeywords) {
    const normKw = normalizeHeaderName(kw)

    for (const e of normEntries) {
      if (!e.val?.trim()) continue
      const hasExclude = excludeWords.some(ex => e.normCol.includes(ex))

      if (!hasExclude && e.normCol.includes(normKw)) {
        return e.val.trim()
      }
    }
  }

  return ''
}

/**
 * 系統（親系統名など）の安全な抽出
 */
export function extractKeiToName(values: Record<string, string>, fallback = '未分類'): string {
  return findValueByFieldAlias(values, CIRCUIT_FIELD_ALIASES.keiTo) || fallback
}

/**
 * 盤種別（電灯・動力等）の安全な抽出
 */
export function extractBanShubetsu(values: Record<string, string>, fallback = '未分類'): string {
  return findValueByFieldAlias(values, CIRCUIT_FIELD_ALIASES.banShubetsu) || fallback
}

/**
 * 盤名称の安全な抽出
 */
export function extractBanMeisho(values: Record<string, string>, fallback = '未分類'): string {
  return findValueByFieldAlias(values, CIRCUIT_FIELD_ALIASES.banMeisho) || fallback
}

/**
 * 幹線可否（'幹線' | '二次'）の安全な判定
 */
export function extractKansenHantei(values: Record<string, string>): '幹線' | '二次' {
  const kansenVal = findValueByFieldAlias(values, CIRCUIT_FIELD_ALIASES.kansenHantei)

  if (kansenVal) {
    const isKansen = kansenVal.toLowerCase() === 'true'
      || kansenVal === '1'
      || kansenVal.includes('幹線')

    return isKansen ? '幹線' : '二次'
  }

  const rawKeiTo = findValueByFieldAlias(values, CIRCUIT_FIELD_ALIASES.keiTo)

  return rawKeiTo.includes('幹線') ? '幹線' : '二次'
}

/**
 * 回路番号の安全な抽出
 */
export function extractKairoBangou(values: Record<string, string>): string {
  return findValueByFieldAlias(values, CIRCUIT_FIELD_ALIASES.kairoBangou)
}

/**
 * 回路名称の安全な抽出
 */
export function extractKairoMeisho(values: Record<string, string>): string {
  return findValueByFieldAlias(values, CIRCUIT_FIELD_ALIASES.kairoMeisho)
}

/**
 * ヘッダー名一覧から、指定フィールドに最もマッチする列インデックス（1-indexed）を検出する
 */
export function findMatchingColumnIndex(
  headers: Array<{ name: string, colIndex: number }>,
  aliasDef: AliasDefinition,
): number {
  const normHeaders = headers.map(h => ({
    ...h,
    normName: normalizeHeaderName(h.name),
  }))

  // 1. 完全一致
  for (const kw of aliasDef.exact) {
    const normKw = normalizeHeaderName(kw)
    const match = normHeaders.find(h => h.normName === normKw)

    if (match) return match.colIndex
  }

  // 2. 部分一致（除外語なし）
  const allKeywords = [...aliasDef.exact, ...(aliasDef.fallback || [])]
  const excludeWords = (aliasDef.exclude || []).map(normalizeHeaderName)

  for (const kw of allKeywords) {
    const normKw = normalizeHeaderName(kw)

    for (const h of normHeaders) {
      const hasExclude = excludeWords.some(ex => h.normName.includes(ex))

      if (!hasExclude && h.normName.includes(normKw)) {
        return h.colIndex
      }
    }
  }

  return -1
}
