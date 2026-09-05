import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'

export interface RackResultViewModel {
  isEmpty: boolean
  boxVariant: 'default' | 'error'
  boxStatus: 'neutral' | 'success' | 'warning' | 'danger'
  displaySize: string
  isOverflow: boolean
  isSizeOver: boolean
  overflowWarning: string
  wStrong: string
  wWeak: string
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

/**
 * ケーブルラック計算結果を表示用 ViewModel に整形する
 */
export function formatRackResult(
  params: RackResultPresenterParams,
): RackResultViewModel {
  const { result } = params

  const isSizeOver = Boolean(
    result && result.totalWidth > 0 && (!result.selectedSize || result.totalWidth > 1200),
  )
  const isZeroOrNoInput = !result || result.totalWidth === 0
  const isError = Boolean(result?.error) && !isSizeOver
  const isEmpty = isZeroOrNoInput || isError
  const boxVariant: RackResultViewModel['boxVariant'] = (isError || isSizeOver)
    ? 'error'
    : 'default'

  const isOverflow = Boolean(result?.isOverflow)

  let boxStatus: 'neutral' | 'success' | 'warning' | 'danger' = 'neutral'

  if (!isEmpty && result) {
    if (isSizeOver) {
      boxStatus = 'danger'
    }
    else if (isOverflow) {
      boxStatus = 'warning'
    }
    else {
      boxStatus = 'success'
    }
  }

  let displaySize = '---'

  if (!isEmpty && result) {
    if (result.selectedSize) {
      displaySize = `W${result.selectedSize}`
    }
    else {
      const minRequired = result.totalWidth ? Math.ceil(result.totalWidth) : 0

      displaySize = `規格外 (${minRequired}mm以上)`
    }
  }

  const overflowWarning = ''

  const wStrong = result?.wStrong?.toFixed(1) ?? '0.0'
  const wWeak = result?.wWeak?.toFixed(1) ?? '0.0'
  const showSeparator = false
  const wSep = '0.0'
  const totalWidth = String(result?.totalWidth ? Math.ceil(result.totalWidth) : 0)
  const maxHeight = result?.maxCableStackHeight?.toFixed(1) ?? '0.0'

  return {
    isEmpty,
    boxVariant,
    boxStatus,
    displaySize,
    isOverflow,
    isSizeOver,
    overflowWarning,
    wStrong,
    wWeak,
    showSeparator,
    wSep,
    totalWidth,
    maxHeight,
    isMaxHeightOverflow: isOverflow,
  }
}
