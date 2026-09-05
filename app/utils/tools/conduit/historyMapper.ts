import type { HistoryEntry } from '~/types/history'
import { findCableByIndexString, getCableDisplayName } from '~/utils/cable'

import type { CableInput, ConduitCalcResult } from './conduitCalcLogic'

export function mapConduitToHistory(
  conduitCategory: string,
  inputCables: CableInput[],
  result: ConduitCalcResult,
  customFillRate?: number | null,
): Omit<HistoryEntry, 'id' | 'timestamp'> | null {
  if (!result || result.partial || !result.success) return null

  const inputs = [
    { label: '配管種類', value: conduitCategory },
    { label: '指定占積率', value: `${customFillRate || 80}%` },
  ]

  inputCables.forEach((c, i) => {
    const cableDef = findCableByIndexString(c.cableIdx)
    const name = getCableDisplayName(cableDef, { category: c.category }, true, false)

    inputs.push({
      label: `ケーブル ${i + 1}`,
      value: `${name} × ${c.count}本`,
    })
  })

  let status: HistoryEntry['status'] = 'success'

  if (result.isOversize32 && result.isOversize48 && result.isOversizeCustom) {
    status = 'error'
  }
  else if (result.isOversize32 || result.isOversize48 || result.isOversizeCustom) {
    status = 'warning'
  }

  const size32Str = result.isOversize32
    ? 'サイズ超過'
    : result.conduit32?.size || '---'
  const size48Str = result.isOversize48
    ? 'サイズ超過'
    : result.conduit48?.size || '---'
  const sizeCustomStr = result.isOversizeCustom
    ? 'サイズ超過'
    : result.conduitCustom?.size || '---'

  const rateStr = customFillRate || 80

  const results = [
    { label: '32%以下 (異種)', value: size32Str, isMain: true as boolean },
    {
      label: '占積率 (32%)',
      value: `${result.fill32?.toFixed(1) || 0}%`,
    },
    { label: '48%以下 (同種)', value: size48Str, isMain: true as boolean },
    {
      label: '占積率 (48%)',
      value: `${result.fill48?.toFixed(1) || 0}%`,
    },
    { label: `指定 (${rateStr}%)`, value: sizeCustomStr, isMain: true as boolean },
    {
      label: `占積率 (${rateStr}%)`,
      value: `${result.fillCustom?.toFixed(1) || 0}%`,
    },
    { label: '総断面積', value: `${result.totalArea.toFixed(1)} mm²` },
  ]

  return {
    toolName: '配管サイズ自動選定',
    status,
    mainResultText: `32%: ${size32Str} / 48%: ${size48Str} / ${rateStr}%: ${sizeCustomStr}`,
    inputs,
    results,
  }
}
