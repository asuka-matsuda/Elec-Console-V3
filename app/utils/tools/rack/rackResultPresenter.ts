/**
 * ケーブルラック計算結果プレゼンター
 *
 * ラック幅計算結果、敷設段数比較、および数式ステップをUI表示用ViewModelへ整形します。
 */

import { BADGE_PRESETS } from '~/constants/badgeConfig'
import { getToolError } from '~/constants/toolErrorConstants'
import type { ResultDetailItem, ResultPanelStatus } from '~/types/components'
import type { RackCalcResult, RackTierResult } from '~/utils/tools/rack/rackCalcLogic'

interface RackTierPanelViewModel {
  layers: 1 | 2
  title: string
  badgeText?: string
  displaySize: string
  panelStatus: ResultPanelStatus
  totalWidth: string
  maxHeight: string
  isOverflow: boolean
  isSizeOver: boolean
  isApplicable: boolean
  notApplicableText?: string
}

interface RackResultViewModel {
  isEmpty: boolean
  tier1: RackTierPanelViewModel
  tier2: RackTierPanelViewModel
  wStrong: string
  wWeak: string
  maxDepth: string
  details: ResultDetailItem[]
}

interface RackResultPresenterParams {
  result: RackCalcResult | null | undefined
  maxDepth?: number
  mode?: 'strong' | 'weak'
}

function formatTierPanel(
  tier: RackTierResult | undefined,
  isEmpty: boolean,
  _mode?: 'strong' | 'weak',
): RackTierPanelViewModel {
  const isTier2 = tier?.layers === 2
  const layers = isTier2 ? 2 : 1
  const title = isTier2 ? '2段敷設（省スペース）' : '1段敷設（平置き・標準）'

  if (isEmpty || !tier || tier.totalWidth === 0) {
    return {
      layers,
      title,
      displaySize: '---',
      panelStatus: 'neutral',
      totalWidth: '0',
      maxHeight: '0.0',
      isOverflow: false,
      isSizeOver: false,
      isApplicable: true,
    }
  }

  // 2段で本数1本のみの場合
  if (isTier2 && !tier.isApplicable) {
    const errorInfo = getToolError('RACK_TIER2_NOT_APPLICABLE')

    return {
      layers,
      title,
      badgeText: errorInfo?.title ?? '段積み不可',
      displaySize: '---',
      panelStatus: 'warning',
      totalWidth: String(Math.ceil(tier.totalWidth)),
      maxHeight: tier.maxCableStackHeight.toFixed(1),
      isOverflow: false,
      isSizeOver: false,
      isApplicable: false,
      notApplicableText: 'ケーブルが1本のみのため段積み不可',
    }
  }

  let panelStatus: 'neutral' | 'success' | 'warning' | 'danger' = 'success'
  let badgeText: string | undefined

  if (tier.isSizeOver) {
    panelStatus = 'danger'
    badgeText = BADGE_PRESETS['tool:size-over'].label
  }
  else if (tier.isOverflow) {
    panelStatus = 'warning'
    badgeText = BADGE_PRESETS['tool:overflow'].label
  }

  const displaySize = tier.selectedSize
    ? `W${tier.selectedSize}`
    : (tier.isSizeOver ? 'ERROR' : '---')

  return {
    layers,
    title,
    badgeText,
    displaySize,
    panelStatus,
    totalWidth: String(Math.ceil(tier.totalWidth)),
    maxHeight: tier.maxCableStackHeight.toFixed(1),
    isOverflow: tier.isOverflow,
    isSizeOver: tier.isSizeOver,
    isApplicable: true,
  }
}

/**
 * ケーブルラック計算結果を表示用 ViewModel に整形する
 */
export function formatRackResult(
  params: RackResultPresenterParams,
): RackResultViewModel {
  const { result } = params
  const resolvedMaxDepth = result?.maxDepth ?? params.maxDepth ?? 80
  const resolvedMode = result?.mode ?? params.mode ?? 'strong'

  const isSizeOver = Boolean(
    result?.tier1?.isSizeOver
    || result?.tier2?.isSizeOver,
  )
  const isZeroOrNoInput = !result || (result.tier1.totalWidth === 0 && result.tier2.totalWidth === 0)
  const isError = Boolean(result?.error) && !isSizeOver
  const isEmpty = isZeroOrNoInput || isError

  const tier1 = formatTierPanel(result?.tier1, isEmpty, resolvedMode)
  const tier2 = formatTierPanel(result?.tier2, isEmpty, resolvedMode)

  const wStrong = (resolvedMode === 'strong' ? result?.tier1?.wMain : result?.tier1?.wOther)?.toFixed(1) ?? '0.0'
  const wWeak = (resolvedMode === 'strong' ? result?.tier1?.wOther : result?.tier1?.wMain)?.toFixed(1) ?? '0.0'

  const details: ResultDetailItem[] = [
    {
      label: 'ラック有効高さ',
      value: resolvedMaxDepth,
      unit: 'mm',
      note: '(親桁 H - 20mm)',
    },
  ]

  return {
    isEmpty,
    tier1,
    tier2,
    wStrong,
    wWeak,
    maxDepth: String(resolvedMaxDepth),
    details,
  }
}
