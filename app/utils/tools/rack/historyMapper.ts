import type { HistoryEntry } from '~/types/history'
import { findCableByIndexString, getCableDisplayName } from '~/utils/cable'
import type { RackCableUIInput } from '~/utils/tools/rack/rackMapper'

import type { RackCalcResult } from './rackCalcLogic'

export function mapRackToHistory(
  settings: {
    mode: 'strong' | 'weak'
    layers: number
    rackHeight: number
    maxDepth: number
    otherWidth: number
  },
  cables: RackCableUIInput[],
  result: RackCalcResult,
): Omit<HistoryEntry, 'id' | 'timestamp'> | null {
  if (result.error || result.totalWidth === 0) return null

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

  inputs.push({
    label: '段積み数',
    value: `${settings.layers} 段`,
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

  let status: HistoryEntry['status'] = 'success'

  if (result.isOverflow) {
    status = 'error'
  }
  else if (!result.selectedSize) {
    status = 'warning'
  }

  const results = [
    {
      label: '選定ラック幅',
      value: result.selectedSize ? `W${result.selectedSize}` : '規格外',
      isMain: true as boolean,
    },
    {
      label: '合計必要幅',
      value: `${Math.ceil(result.totalWidth)} mm`,
    },
    {
      label: '最大ケーブル高さ',
      value: `${result.maxCableStackHeight.toFixed(1)} mm`,
    },
  ]

  return {
    toolName: 'ケーブルラック選定',
    status,
    mainResultText: result.selectedSize ? `W${result.selectedSize}` : '規格外',
    inputs,
    results,
  }
}
