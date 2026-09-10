import { CONDUIT_UI_LABELS } from '~/constants/conduitConstants'
import { formatVal } from '~/utils/math'
import type { ConduitCalcResult } from '~/utils/tools/conduit/conduitCalcLogic'

export interface ConduitResultViewModel {
  isReady: boolean
  isOversize32: boolean
  isOversize48: boolean
  isOversizeCustom: boolean
  isSameSize: boolean
  isDiffSize: boolean
  size32: string
  status32Class: 'is-neutral' | 'is-success' | 'is-danger'
  badge32?: string
  fill32: string
  allowable32: string
  size48: string
  status48Class: 'is-neutral' | 'is-success' | 'is-warning' | 'is-danger'
  badge48?: string
  fill48: string
  allowable48: string
  customFillRate: number
  titleCustom: string
  sizeCustom: string
  statusCustomClass: 'is-neutral' | 'is-success' | 'is-danger'
  badgeCustom?: string
  fillCustom: string
  allowableCustom: string
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
      isOversizeCustom: false,
      isSameSize: false,
      isDiffSize: false,
      size32: CONDUIT_UI_LABELS.EMPTY_TEXT,
      status32Class: 'is-neutral',
      fill32: CONDUIT_UI_LABELS.EMPTY_TEXT,
      allowable32: CONDUIT_UI_LABELS.EMPTY_TEXT,
      size48: CONDUIT_UI_LABELS.EMPTY_TEXT,
      status48Class: 'is-neutral',
      fill48: CONDUIT_UI_LABELS.EMPTY_TEXT,
      allowable48: CONDUIT_UI_LABELS.EMPTY_TEXT,
      customFillRate: 80,
      titleCustom: 'ユーザー指定 (80%)',
      sizeCustom: CONDUIT_UI_LABELS.EMPTY_TEXT,
      statusCustomClass: 'is-neutral',
      fillCustom: CONDUIT_UI_LABELS.EMPTY_TEXT,
      allowableCustom: CONDUIT_UI_LABELS.EMPTY_TEXT,
    }
  }

  const isSameSize = Boolean(result.isSameSize)
  const isDiffSize = isReady && !isSameSize

  const isOversize32 = Boolean(result.isOversize32)
  const size32 = isOversize32
    ? 'ERROR'
    : (result.conduit32?.size || CONDUIT_UI_LABELS.EMPTY_TEXT)
  const status32Class: ConduitResultViewModel['status32Class'] = isOversize32
    ? 'is-danger'
    : 'is-success'
  const badge32 = isOversize32 ? '規格上限超過' : undefined
  const allowable32 = formatVal(
    result.allowable32,
    CONDUIT_UI_LABELS.EMPTY_TEXT,
    1,
  )
  const fill32 = formatVal(result.fill32, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)

  const isOversize48 = Boolean(result.isOversize48)
  const size48 = isOversize48
    ? 'ERROR'
    : (result.conduit48?.size || CONDUIT_UI_LABELS.EMPTY_TEXT)
  const status48Class: ConduitResultViewModel['status48Class'] = isOversize48
    ? 'is-danger'
    : isDiffSize
      ? 'is-warning'
      : 'is-success'
  const badge48 = isOversize48
    ? '規格上限超過'
    : isDiffSize
      ? '異種混在'
      : undefined
  const allowable48 = formatVal(
    result.allowable48,
    CONDUIT_UI_LABELS.EMPTY_TEXT,
    1,
  )
  const fill48 = formatVal(result.fill48, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)

  const customFillRate = result.customFillRate || 80
  const isOversizeCustom = Boolean(result.isOversizeCustom)
  const sizeCustom = isOversizeCustom
    ? 'ERROR'
    : (result.conduitCustom?.size || CONDUIT_UI_LABELS.EMPTY_TEXT)
  const statusCustomClass: ConduitResultViewModel['statusCustomClass'] = isOversizeCustom
    ? 'is-danger'
    : 'is-success'
  const badgeCustom = isOversizeCustom ? '規格上限超過' : undefined
  const allowableCustom = formatVal(
    result.allowableCustom,
    CONDUIT_UI_LABELS.EMPTY_TEXT,
    1,
  )
  const fillCustom = formatVal(result.fillCustom, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)
  const titleCustom = `ユーザー指定 (${customFillRate}%)`

  return {
    isReady: true,
    isOversize32,
    isOversize48,
    isOversizeCustom,
    isSameSize,
    isDiffSize,
    size32,
    status32Class,
    badge32,
    fill32,
    allowable32,
    size48,
    status48Class,
    badge48,
    fill48,
    allowable48,
    customFillRate,
    titleCustom,
    sizeCustom,
    statusCustomClass,
    badgeCustom,
    fillCustom,
    allowableCustom,
  }
}
