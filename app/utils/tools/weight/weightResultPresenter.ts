import type { WeightCalcResult } from '~/utils/tools/weight/weightCalcLogic'

export interface WeightResultViewModel {
  isError: boolean
  hasBestDrum: boolean
  boxStatus: 'empty' | 'success' | 'error'
  displayDrum: string
  warningText: string
  cableWeight: string
  drumWeight: string
  totalWeight: string
  maxCapacityMeters: string
}

/**
 * ケーブル重量・ドラム選定計算結果を表示用 ViewModel に整形する
 */
export function formatWeightResult(
  result: WeightCalcResult | null | undefined,
): WeightResultViewModel {
  const isError = Boolean(!result || result.error)
  const hasBestDrum = Boolean(result?.bestDrum)
  const boxStatus: WeightResultViewModel['boxStatus'] = isError
    ? 'empty'
    : hasBestDrum
      ? 'success'
      : 'error'

  let displayDrum = '---'

  if (!isError && result) {
    if (hasBestDrum && result.bestDrum) {
      displayDrum = `${result.bestDrum.category} (${result.bestDrum.id})`
    }
    else {
      displayDrum = '選定不可'
    }
  }

  const warningText
    = !isError && !hasBestDrum
      ? '⚠️ 条件に合うドラムが見つかりませんでした。'
      : ''

  const drumEmptyWeight = parseFloat(String(result?.bestDrum?.weight || 0))
  const totalWeightVal = (result?.cableWeight || 0) + drumEmptyWeight

  const cableWeight = result?.cableWeight?.toFixed(1) ?? '0.0'
  const drumWeight = String(result?.bestDrum?.weight ?? '0')
  const totalWeight = totalWeightVal.toFixed(1)
  const maxCapacityMeters = result?.maxCapacityMeters?.toFixed(1) ?? '0.0'

  return {
    isError,
    hasBestDrum,
    boxStatus,
    displayDrum,
    warningText,
    cableWeight,
    drumWeight,
    totalWeight,
    maxCapacityMeters,
  }
}
