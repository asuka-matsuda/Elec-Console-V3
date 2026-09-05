import { cableData } from '~/constants/data/cableData'
import type { CableData } from '~/types/database'

export interface DropdownOption {
  label: string
  value: string
}

export const STRONG_CURRENT_CATEGORIES = [
  'VVF',
  'IV',
  'CV',
  'CVT',
  '6.6kV CVT',
  'VCTF',
] as const

export const WEAK_CURRENT_CATEGORIES = [
  'CPEV',
  'F-CPEV',
  'HP',
  'AE',
  '同軸',
] as const

/**
 * 重複のないケーブルカテゴリ（種類）のリストを取得する
 * filter を指定することで強電・弱電などのカテゴリに絞り込めます
 */
export function getCableCategories(
  filter?: 'strong' | 'weak' | readonly string[] | string[],
): DropdownOption[] {
  let cats = [...new Set(cableData.map(c => c.category))]

  if (filter === 'strong') {
    cats = cats.filter(c =>
      (STRONG_CURRENT_CATEGORIES as readonly string[]).includes(c),
    )
  }
  else if (filter === 'weak') {
    cats = cats.filter(c =>
      (WEAK_CURRENT_CATEGORIES as readonly string[]).includes(c),
    )
  }
  else if (Array.isArray(filter)) {
    cats = cats.filter(c => filter.includes(c))
  }

  return cats.map(c => ({ label: c, value: c }))
}

/**
 * 指定されたカテゴリ（cableType）に存在するケーブルのリストを取得する
 */
export function getAvailableSizes(category: string): DropdownOption[] {
  if (!category) return []

  // 元の配列におけるインデックスを保持したままフィルタリングする
  const candidates = cableData
    .map((cable, index) => ({ cable, index }))
    .filter(item => item.cable.category === category)

  return candidates.map((item) => {
    const c = item.cable
    const label = c.name || `${c.size} ${c.unit}`

    return {
      label,
      value: `idx_${item.index}`,
    }
  })
}

export function parseCableIndex(cableIdxStr?: string | null): number | null {
  if (!cableIdxStr || !cableIdxStr.startsWith('idx_')) {
    return null
  }
  const idx = parseInt(cableIdxStr.replace('idx_', ''), 10)

  return isNaN(idx) ? null : idx
}

/**
 * 'idx_12' 形式の文字列から cableData 内のケーブル定義を取得する
 */
export function findCableByIndexString(
  cableIdxStr?: string | null,
  sourceData: CableData[] = cableData,
): CableData | null {
  const idx = parseCableIndex(cableIdxStr)

  if (idx === null || idx < 0 || idx >= sourceData.length) {
    return null
  }

  return sourceData[idx] ?? null
}

/**
 * ケーブル外径（数値または "6.2×9.4" 等の平形表記文字列）から
 * 安全側計算に使用する最大長径（実効外径）を数値として取得する
 */
export function getEffectiveCableDiameter(
  diameter: string | number | null | undefined,
): number {
  if (diameter === null || diameter === undefined || diameter === '') {
    return 0
  }

  if (typeof diameter === 'number') {
    return isNaN(diameter) || diameter <= 0 ? 0 : diameter
  }

  const str = String(diameter).trim()

  if (str.includes('×')) {
    const parts = str
      .split('×')
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n) && n > 0)

    return parts.length > 0 ? Math.max(...parts) : 0
  }

  const parsed = parseFloat(str)

  return isNaN(parsed) || parsed <= 0 ? 0 : parsed
}

export function formatCableName(
  cable: CableData | { category: string, size: string | number, cores?: string },
  includeSize = true,
  includeCores = true,
): string {
  if (!cable) return ''
  let name = cable.category

  const sizeStr = String(cable.size ?? '')

  if (includeSize && sizeStr && sizeStr !== '-') {
    name += ` ${sizeStr}`
  }

  const coresStr = String(cable.cores ?? '')

  if (includeCores && coresStr && coresStr !== '1' && coresStr !== '') {
    if (coresStr.includes('P') || coresStr.includes('C')) {
      name += ` ${coresStr}`
    }
    else {
      name += ` ${coresStr}C`
    }
  }

  return name
}

/**
 * ケーブル定義、または入力値から安全に表示用ケーブル名を取得する
 */
export function getCableDisplayName(
  cableDef?: CableData | null,
  fallback?: { category?: string, size?: string | number, cores?: string },
  includeSize = true,
  includeCores = false,
): string {
  if (cableDef) {
    return formatCableName(cableDef, includeSize, includeCores)
  }

  if (fallback?.category) {
    return formatCableName(
      {
        category: fallback.category,
        size: fallback.size ?? '',
        cores: fallback.cores ?? '',
      },
      includeSize,
      includeCores,
    )
  }

  return ''
}
