import type { RackCalcResult, RackTierResult } from '~/utils/tools/rack/rackCalcLogic'

export interface RackTierCardViewModel {
  layers: 1 | 2
  title: string
  badgeText?: string
  badgeColor?: 'success' | 'warning' | 'danger'
  displaySize: string
  boxStatus: 'neutral' | 'success' | 'warning' | 'danger'
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
  // 後方互換性用フィールド
  boxVariant: 'default' | 'error'
  boxStatus: 'neutral' | 'success' | 'warning' | 'danger'
  displaySize: string
  isOverflow: boolean
  isSizeOver: boolean
  overflowWarning: string
  showSeparator: boolean
  wSep: string
  totalWidth: string
  maxHeight: string
  isMaxHeightOverflow: boolean
}

export interface RackResultPresenterParams {
  result: RackCalcResult | null | undefined
  maxDepth: number
  mode?: 'strong' | 'weak'
}

function formatTierCard(
  tier: RackTierResult | undefined,
  isEmpty: boolean,
  mode?: 'strong' | 'weak',
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
      badgeText: '適用不可',
      displaySize: '---',
      boxStatus: 'neutral',
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
  let badgeColor: 'success' | 'warning' | 'danger' | undefined

  if (tier.isSizeOver) {
    boxStatus = 'danger'
    badgeText = '規格外'
    badgeColor = 'danger'
  }
  else if (tier.isOverflow) {
    boxStatus = 'warning'
    badgeText = '高さ不足'
    badgeColor = 'warning'
  }
  else if (!isTier2 && mode === 'strong') {
    badgeText = '放熱推奨'
    badgeColor = 'success'
  }

  let displaySize = '---'

  if (tier.selectedSize) {
    displaySize = `W${tier.selectedSize}`
  }
  else {
    const minRequired = tier.totalWidth ? Math.ceil(tier.totalWidth) : 0

    displaySize = `規格外 (${minRequired}mm以上)`
  }

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
  const { result, maxDepth, mode } = params

  const isSizeOver = Boolean(
    result?.tier1?.isSizeOver
    || result?.tier2?.isSizeOver
    || (result?.selectedSize === null && (result?.totalWidth ?? 0) > 0),
  )
  const isZeroOrNoInput = !result || result.totalWidth === 0
  const isError = Boolean(result?.error) && !isSizeOver
  const isEmpty = isZeroOrNoInput || isError

  // tier1 が直接渡されていない場合のフォールバック（旧モックデータや後方互換対応）
  const effectiveTier1: RackTierResult | undefined = result?.tier1 ?? (result && result.totalWidth > 0 ? {
    layers: 1,
    title: '1段敷設（平置き・標準）',
    isApplicable: true,
    wMain: result.wStrong ?? 0,
    wOther: result.wWeak ?? 0,
    totalWidth: result.totalWidth,
    selectedSize: result.selectedSize,
    isOverflow: result.isOverflow ?? false,
    isSizeOver: result.selectedSize === null && result.totalWidth > 0,
    maxCableStackHeight: result.maxCableStackHeight ?? 0,
    stackHeightDetailStr: result.maxStackDetailStr ?? '',
    cablesWidth: result.sumStrong ?? 0,
    cablesCount: 1,
  } : undefined)

  const effectiveTier2: RackTierResult | undefined = result?.tier2

  const tier1 = formatTierCard(effectiveTier1, isEmpty, mode)
  const tier2 = formatTierCard(effectiveTier2, isEmpty, mode)

  const wStrong = result?.wStrong?.toFixed(1) ?? '0.0'
  const wWeak = result?.wWeak?.toFixed(1) ?? '0.0'

  return {
    isEmpty,
    tier1,
    tier2,
    wStrong,
    wWeak,
    maxDepth: String(maxDepth),
    // 後方互換用フィールド（tier1平置き基準）
    boxVariant: (isError || tier1.boxStatus === 'danger') ? 'error' : 'default',
    boxStatus: tier1.boxStatus,
    displaySize: tier1.displaySize,
    isOverflow: tier1.isOverflow,
    isSizeOver: tier1.isSizeOver,
    overflowWarning: '',
    showSeparator: false,
    wSep: '0.0',
    totalWidth: tier1.totalWidth,
    maxHeight: tier1.maxHeight,
    isMaxHeightOverflow: tier1.isOverflow,
  }
}
