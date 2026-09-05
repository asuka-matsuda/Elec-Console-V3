import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'

export interface RackResultViewModel {
  isEmpty: boolean
  boxVariant: 'default' | 'error'
  displaySize: string
  isOverflow: boolean
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
  const { result, maxDepth } = params
  const isError = Boolean(result?.error)
  const isEmpty = isError || !result
  const boxVariant: RackResultViewModel['boxVariant'] = isError
    ? 'error'
    : 'default'

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

  const isOverflow = Boolean(result?.isOverflow)
  const overflowWarning = isOverflow
    ? `⚠️ ケーブルの高さがラックの有効高さ(${maxDepth}mm)を超過しています。`
    : ''

  const wStrong = result?.wStrong?.toFixed(1) ?? '0.0'
  const wWeak = result?.wWeak?.toFixed(1) ?? '0.0'
  const showSeparator = false
  const wSep = '0.0'
  const totalWidth = String(result?.totalWidth ? Math.ceil(result.totalWidth) : 0)
  const maxHeight = result?.maxCableStackHeight?.toFixed(1) ?? '0.0'

  return {
    isEmpty,
    boxVariant,
    displaySize,
    isOverflow,
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
