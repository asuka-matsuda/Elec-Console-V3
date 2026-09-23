/**
 * 電線管計算結果プレゼンター
 *
 * 電線管選定結果をUI表示用ViewModelおよび占有率プログレスデータへ整形します。
 */

import { CONDUIT_UI_LABELS } from '~/constants/conduitConstants'
import type { ResultPanelStatus } from '~/types/components'
import { formatVal } from '~/utils/math'
import type { ConduitCalcResult } from '~/utils/tools/conduit/conduitCalcLogic'

export interface ConduitResultViewModel {
  isReady: boolean
  isOversize32: boolean
  isOversize48: boolean
  isOversizeCustom: boolean
  isSameSize: boolean
  isDiffSize: boolean

  // 1行目: 32% (異種)
  size32: string
  status32: ResultPanelStatus
  badge32?: string
  fill32: string
  fillText32?: string
  allowable32: string

  // 2行目: 48% (同種)
  size48: string
  status48: ResultPanelStatus
  badge48?: string
  fill48: string
  fillText48?: string
  allowable48: string

  // 3行目: ユーザー指定
  customFillRate: number
  titleCustom: string
  sizeCustom: string
  statusCustom: ResultPanelStatus
  badgeCustom?: string
  fillCustom: string
  fillTextCustom?: string
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
      status32: 'neutral',
      fill32: CONDUIT_UI_LABELS.EMPTY_TEXT,
      allowable32: CONDUIT_UI_LABELS.EMPTY_TEXT,
      size48: CONDUIT_UI_LABELS.EMPTY_TEXT,
      status48: 'neutral',
      fill48: CONDUIT_UI_LABELS.EMPTY_TEXT,
      allowable48: CONDUIT_UI_LABELS.EMPTY_TEXT,
      customFillRate: 80,
      titleCustom: 'ユーザー指定 (80%)',
      sizeCustom: CONDUIT_UI_LABELS.EMPTY_TEXT,
      statusCustom: 'neutral',
      fillCustom: CONDUIT_UI_LABELS.EMPTY_TEXT,
      allowableCustom: CONDUIT_UI_LABELS.EMPTY_TEXT,
    }
  }

  const isSameSize = Boolean(result.isSameSize)
  const isDiffSize = isReady && !isSameSize

  // 1. 32% (異種)
  const isOversize32 = Boolean(result.isOversize32)
  const size32 = isOversize32
    ? 'ERROR'
    : (result.conduit32?.size || CONDUIT_UI_LABELS.EMPTY_TEXT)
  const status32: ResultPanelStatus = isOversize32 ? 'danger' : 'success'
  const badge32 = isOversize32 ? '規格上限超過' : undefined
  const allowable32 = formatVal(
    result.allowable32,
    CONDUIT_UI_LABELS.EMPTY_TEXT,
    1,
  )
  const fill32 = formatVal(result.fill32, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)
  const fillText32 = !isOversize32 && fill32 !== CONDUIT_UI_LABELS.EMPTY_TEXT
    ? `(${fill32}%)`
    : undefined

  // 2. 48% (同種)
  const isOversize48 = Boolean(result.isOversize48)
  const size48 = isOversize48
    ? 'ERROR'
    : (result.conduit48?.size || CONDUIT_UI_LABELS.EMPTY_TEXT)
  const status48: ResultPanelStatus = isOversize48
    ? 'danger'
    : isDiffSize
      ? 'warning'
      : 'success'
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
  const fillText48 = !isOversize48 && fill48 !== CONDUIT_UI_LABELS.EMPTY_TEXT
    ? `(${fill48}%)`
    : undefined

  // 3. ユーザー指定
  const customFillRate = result.customFillRate || 80
  const isOversizeCustom = Boolean(result.isOversizeCustom)
  const sizeCustom = isOversizeCustom
    ? 'ERROR'
    : (result.conduitCustom?.size || CONDUIT_UI_LABELS.EMPTY_TEXT)
  const statusCustom: ResultPanelStatus = isOversizeCustom ? 'danger' : 'success'
  const badgeCustom = isOversizeCustom ? '規格上限超過' : undefined
  const allowableCustom = formatVal(
    result.allowableCustom,
    CONDUIT_UI_LABELS.EMPTY_TEXT,
    1,
  )
  const fillCustom = formatVal(result.fillCustom, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)
  const fillTextCustom = !isOversizeCustom && fillCustom !== CONDUIT_UI_LABELS.EMPTY_TEXT
    ? `(${fillCustom}%)`
    : undefined
  const titleCustom = `ユーザー指定 (${customFillRate}%)`

  return {
    isReady: true,
    isOversize32,
    isOversize48,
    isOversizeCustom,
    isSameSize,
    isDiffSize,
    size32,
    status32,
    badge32,
    fill32,
    fillText32,
    allowable32,
    size48,
    status48,
    badge48,
    fill48,
    fillText48,
    allowable48,
    customFillRate,
    titleCustom,
    sizeCustom,
    statusCustom,
    badgeCustom,
    fillCustom,
    fillTextCustom,
    allowableCustom,
  }
}
