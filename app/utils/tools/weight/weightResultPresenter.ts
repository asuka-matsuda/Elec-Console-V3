/**
 * ケーブル重量・ドラム選定結果プレゼンター
 *
 * ドラム選定結果、最大巻取条長、および導出根拠をUI表示用ViewModelへ整形します。
 */

import type { ResultDetailItem, ResultPanelStatus } from '~/types/components'
import type { WeightCalcResult } from '~/utils/tools/weight/weightCalcLogic'

export interface WeightResultViewModel {
  isError: boolean
  hasBestDrum: boolean
  panelStatus: ResultPanelStatus
  badgeText?: string
  displayDrum: string
  displayTotalWeight: string
  warningText: string
  cableWeight: string
  drumWeight: string
  totalWeight: string
  maxCapacityMeters: string
  details: ResultDetailItem[]
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

  const panelStatus: ResultPanelStatus = isNoInput
    ? 'empty'
    : hasBestDrum
      ? 'success'
      : 'danger'

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

  const details: ResultDetailItem[] = [
    {
      label: 'ケーブル重量',
      value: cableWeight,
      unit: cableWeight !== 'ーー' ? 'kg' : undefined,
    },
    {
      label: 'ドラム重量',
      value: drumWeight,
      unit: drumWeight !== 'ーー' ? 'kg' : undefined,
    },
    {
      label: '最大巻取可能長',
      value: maxCapacityMeters,
      unit: maxCapacityMeters !== 'ーー' ? 'm' : undefined,
    },
  ]

  return {
    isError: isNoInput,
    hasBestDrum,
    panelStatus,
    badgeText,
    displayDrum,
    displayTotalWeight,
    warningText,
    cableWeight,
    drumWeight,
    totalWeight,
    maxCapacityMeters,
    details,
  }
}
