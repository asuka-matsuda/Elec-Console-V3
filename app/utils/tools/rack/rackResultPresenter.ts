import type { ResultBoxStatus, ResultDetailItem } from '~/types/components'
import type { RackCalcResult, RackTierResult } from '~/utils/tools/rack/rackCalcLogic'

export interface RackTierCardViewModel {
  layers: 1 | 2
  title: string
  badgeText?: string
  badgeColor?: string
  displaySize: string
  boxStatus: ResultBoxStatus
  totalWidth: string
  maxHeight: string
  isOverflow: boolean
  isSizeOver: boolean
  isApplicable: boolean
  notApplicableText?: string
}

export interface RackResultViewModel {
  isEmpty: boolean
  tier1: RackTierCardViewModel
  tier2: RackTierCardViewModel
  wStrong: string
  wWeak: string
  maxDepth: string
  details: ResultDetailItem[]
}

export interface RackResultPresenterParams {
  result: RackCalcResult | null | undefined
  maxDepth?: number
  mode?: 'strong' | 'weak'
}

function formatTierCard(
  tier: RackTierResult | undefined,
  isEmpty: boolean,
  _mode?: 'strong' | 'weak',
): RackTierCardViewModel {
  const isTier2 = tier?.layers === 2
  const layers = isTier2 ? 2 : 1
  const title = isTier2 ? '2段敷設（省スペース）' : '1段敷設（平置き・標準）'

  if (isEmpty || !tier || tier.totalWidth === 0) {
    return {
      layers,
      title,
      displaySize: '---',
      boxStatus: 'neutral',
      totalWidth: '0',
      maxHeight: '0.0',
      isOverflow: false,
      isSizeOver: false,
      isApplicable: true,
    }
  }

  // 2段で本数1本のみの場合
  if (isTier2 && !tier.isApplicable) {
    return {
      layers,
      title,
      badgeText: '段積み不可',
      displaySize: '---',
      boxStatus: 'warning',
      totalWidth: String(Math.ceil(tier.totalWidth)),
      maxHeight: tier.maxCableStackHeight.toFixed(1),
      isOverflow: false,
      isSizeOver: false,
      isApplicable: false,
      notApplicableText: 'ケーブルが1本のみのため段積み不可',
    }
  }

  let boxStatus: 'neutral' | 'success' | 'warning' | 'danger' = 'success'
  let badgeText: string | undefined
  let badgeColor: string | undefined

  if (tier.isSizeOver) {
    boxStatus = 'danger'
    badgeText = '規格外'
    badgeColor = 'var(--color-status-danger)'
  }
  else if (tier.isOverflow) {
    boxStatus = 'warning'
    badgeText = '高さ不足'
    badgeColor = 'var(--color-status-warning)'
  }

  const displaySize = tier.selectedSize
    ? `W${tier.selectedSize}`
    : (tier.isSizeOver ? 'ERROR' : '---')

  return {
    layers,
    title,
    badgeText,
    badgeColor,
    displaySize,
    boxStatus,
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

  const tier1 = formatTierCard(result?.tier1, isEmpty, resolvedMode)
  const tier2 = formatTierCard(result?.tier2, isEmpty, resolvedMode)

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
