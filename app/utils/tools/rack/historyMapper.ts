import type { HistoryEntry } from '~/types/history'
import { findCableByIndexString, getCableDisplayName } from '~/utils/cable'
import type { RackCableUIInput } from '~/utils/tools/rack/rackMapper'

import type { RackCalcResult } from './rackCalcLogic'

export function mapRackToHistory(
  settings: {
    mode: 'strong' | 'weak'
    layers?: number
    rackHeight: number
    maxDepth: number
    otherWidth: number
  },
  cables: RackCableUIInput[],
  result: RackCalcResult,
): Omit<HistoryEntry, 'id' | 'timestamp'> | null {
  if (result.error || (result.tier1.totalWidth === 0 && result.tier2.totalWidth === 0)) return null

  const inputs: { label: string, value: string }[] = []

  const isStrong = settings.mode === 'strong'

  inputs.push({
    label: 'モード',
    value: isStrong ? '強電' : '弱電',
  })

  inputs.push({
    label: 'ラック高さ / 有効高さ',
    value: `${settings.rackHeight} mm / ${settings.maxDepth} mm`,
  })

  cables.forEach((c, i) => {
    if (!c.count || c.count <= 0) return
    const cableDef = findCableByIndexString(c.cableIdx)
    const name = getCableDisplayName(cableDef, { category: c.category }, true, false)

    inputs.push({
      label: `${isStrong ? '強電' : '弱電'}ケーブル ${i + 1}`,
      value: `${name} × ${c.count}本`,
    })
  })

  if (settings.otherWidth > 0) {
    inputs.push({
      label: isStrong ? '弱電必要幅' : '強電必要幅',
      value: `${settings.otherWidth} mm`,
    })
  }

  const t1 = result.tier1
  const t2 = result.tier2

  let status: HistoryEntry['status'] = 'success'

  if (t1.isSizeOver && t2.isSizeOver) {
    status = 'error'
  }
  else if (t1.isOverflow && t2.isOverflow) {
    status = 'warning'
  }

  const results = [
    {
      label: '1段敷設 推奨サイズ',
      value: t1.selectedSize ? `W${t1.selectedSize} (${Math.ceil(t1.totalWidth)}mm)` : '規格外',
      isMain: true as boolean,
    },
    {
      label: '2段敷設 推奨サイズ',
      value: t2.isApplicable
        ? (t2.selectedSize ? `W${t2.selectedSize} (${Math.ceil(t2.totalWidth)}mm)` : '規格外')
        : '適用不可',
    },
    {
      label: '最大ケーブル高さ',
      value: `1段: ${t1.maxCableStackHeight.toFixed(1)}mm / 2段: ${t2.maxCableStackHeight.toFixed(1)}mm`,
    },
  ]

  return {
    toolName: 'ケーブルラック選定',
    status,
    mainResultText: t1.selectedSize ? `W${t1.selectedSize}` : (t2.selectedSize ? `W${t2.selectedSize}` : '規格外'),
    inputs,
    results,
  }
}
