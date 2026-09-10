import type { WeightCalcResult } from '~/utils/tools/weight/weightCalcLogic'

export interface WeightResultViewModel {
  isError: boolean
  hasBestDrum: boolean
  boxStatus: 'empty' | 'success' | 'error'
  badgeText?: string
  displayDrum: string
  displayTotalWeight: string
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
  const isNoInput = !result || result.reason === 'cable_not_found' || Boolean(result.error)
  const hasBestDrum = Boolean(result?.bestDrum)
  const isDrumNotFound = Boolean(result && !isNoInput && (!result.bestDrum || result.reason === 'drum_not_found'))

  const boxStatus: WeightResultViewModel['boxStatus'] = isNoInput
    ? 'empty'
    : hasBestDrum
      ? 'success'
      : 'error'

  let displayDrum = '---'
  let displayTotalWeight = '---'
  let badgeText: string | undefined

  if (!isNoInput && result) {
    if (hasBestDrum && result.bestDrum) {
      displayDrum = result.bestDrum.id
      displayTotalWeight = totalWeightVal(result).toFixed(1)
    }
    else if (isDrumNotFound) {
      displayDrum = 'ERROR'
      displayTotalWeight = 'ERROR'
      badgeText = '適合ドラムなし'
    }
  }

  const warningText = ''

  function totalWeightVal(res: WeightCalcResult) {
    const drumEmptyWeight = parseFloat(String(res.bestDrum?.weight || 0))

    return (res.cableWeight || 0) + drumEmptyWeight
  }

  const cableWeight = result?.cableWeight != null ? result.cableWeight.toFixed(1) : 'ーー'
  const drumWeight = result?.bestDrum?.weight != null ? String(result.bestDrum.weight) : 'ーー'
  const totalWeight = result && hasBestDrum ? totalWeightVal(result).toFixed(1) : 'ーー'
  const maxCapacityMeters = result?.maxCapacityMeters != null ? result.maxCapacityMeters.toFixed(1) : 'ーー'

  return {
    isError: isNoInput,
    hasBestDrum,
    boxStatus,
    badgeText,
    displayDrum,
    displayTotalWeight,
    warningText,
    cableWeight,
    drumWeight,
    totalWeight,
    maxCapacityMeters,
  }
}
