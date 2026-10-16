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
const CIRCUIT_FIELD_ALIASES = {
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
  // 回路番号
  kairoBangou: {
    exact: ['回路番号', '回路no', '回路no.', '回路№', '番号'],
    fallback: [],
    exclude: ['盤', 'mccb', '遮断器', 'リレー', '機器'],
  },
  // 回路名称・負荷名称
  kairoMeisho: {
    exact: ['回路名称', '回路名', '負荷名称', '負荷名', '名称'],
    fallback: [],
    exclude: ['盤', '遮断器', 'ケーブル', '電線'],
  },
} as const

interface AliasDefinition {
  exact: readonly string[]
  fallback?: readonly string[]
  exclude?: readonly string[]
}

/**
 * 優先度ルールに基づき、列名マップから最適な値を抽出する共通関数
 */
function findValueByFieldAlias(
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
