import { CONDUIT_UI_LABELS } from '~/constants/conduitConstants'
import { formatVal } from '~/utils/math'
import type { ConduitCalcResult } from '~/utils/tools/conduit/conduitCalcLogic'

export interface ConduitResultViewModel {
  isReady: boolean
  isOversize32: boolean
  isOversize48: boolean
  size32: string
  status32Class: 'is-neutral' | 'is-success' | 'is-danger'
  fill32: string
  allowable32: string
  size48: string
  status48Class: 'is-neutral' | 'is-success' | 'is-danger'
  fill48: string
  allowable48: string
}

/**
 * 配管サイズ計算ツールの計算結果を表示用ViewModelに整形する
 */
export function formatConduitResult(
  result: ConduitCalcResult | null | undefined,
): ConduitResultViewModel {
  const isReady = Boolean(result?.success && !result?.partial)

  if (!isReady || !result) {
    return {
      isReady: false,
      isOversize32: false,
      isOversize48: false,
      size32: CONDUIT_UI_LABELS.EMPTY_TEXT,
      status32Class: 'is-neutral',
      fill32: CONDUIT_UI_LABELS.EMPTY_TEXT,
      allowable32: CONDUIT_UI_LABELS.EMPTY_TEXT,
      size48: CONDUIT_UI_LABELS.EMPTY_TEXT,
      status48Class: 'is-neutral',
      fill48: CONDUIT_UI_LABELS.EMPTY_TEXT,
      allowable48: CONDUIT_UI_LABELS.EMPTY_TEXT,
    }
  }

  const isOversize32 = Boolean(result.isOversize32)
  const size32 = isOversize32
    ? CONDUIT_UI_LABELS.OVERSIZE_TEXT
    : (result.conduit32?.size || CONDUIT_UI_LABELS.EMPTY_TEXT)
  const status32Class: ConduitResultViewModel['status32Class'] = isOversize32
    ? 'is-danger'
    : 'is-success'
  const allowable32 = formatVal(
    result.allowable32,
    CONDUIT_UI_LABELS.EMPTY_TEXT,
    1,
  )
  const fill32 = formatVal(result.fill32, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)

  const isOversize48 = Boolean(result.isOversize48)
  const size48 = isOversize48
    ? CONDUIT_UI_LABELS.OVERSIZE_TEXT
    : (result.conduit48?.size || CONDUIT_UI_LABELS.EMPTY_TEXT)
  const status48Class: ConduitResultViewModel['status48Class'] = isOversize48
    ? 'is-danger'
    : 'is-success'
  const allowable48 = formatVal(
    result.allowable48,
    CONDUIT_UI_LABELS.EMPTY_TEXT,
    1,
  )
  const fill48 = formatVal(result.fill48, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)

  return {
    isReady: true,
    isOversize32,
    isOversize48,
    size32,
    status32Class,
    fill32,
    allowable32,
    size48,
    status48Class,
    fill48,
    allowable48,
  }
}
