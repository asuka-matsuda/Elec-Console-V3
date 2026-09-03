import { cableData } from '~/constants/data/cableData'
import type { CableData } from '~/types/database'
import type {
  RackCableInput,
  RackCalcInputs,
} from '~/utils/tools/rack/rackCalcLogic'

export interface RackCableUIInput {
  id: string
  category: string
  cableIdx: string
  count: number | null
}

export interface RackInputs {
  isStrong: boolean
  isWeak: boolean
  lStrong: number | null
  lWeak: number | null
  rackHeight: number | null
  separatorWidth: number | null
  strongCablesUI: RackCableUIInput[]
  weakCablesUI: RackCableUIInput[]
}

export function convertUIToRackCable(
  uiInput: RackCableUIInput,
): RackCableInput {
  let def: CableData | undefined

  if (uiInput.cableIdx && uiInput.cableIdx.startsWith('idx_')) {
    const idx = parseInt(uiInput.cableIdx.replace('idx_', ''), 10)

    def = cableData[idx]
  }
  let d = 0

  if (def) {
    if (typeof def.diameter === 'string' && def.diameter.includes('×')) {
      d = Math.max(
        ...def.diameter.split('×').map((s: string) => parseFloat(s.trim())),
      )
    }
    else {
      d = parseFloat(String(def.diameter))
    }
  }

  return { d, n: uiInput.count ?? 0 }
}

export function mapFormToRackCalcInputs(inputs: RackInputs): RackCalcInputs {
  const rH = inputs.rackHeight ?? 0
  const maxDepth = Math.max(1, rH - 10)

  return {
    isStrong: inputs.isStrong,
    isWeak: inputs.isWeak,
    lStrong: inputs.lStrong ?? 1,
    lWeak: inputs.lWeak ?? 1,
    rackHeight: rH,
    maxDepth: maxDepth,
    strongCables: inputs.strongCablesUI.map(convertUIToRackCable),
    weakCables: inputs.weakCablesUI.map(convertUIToRackCable),
    separatorWidth: inputs.separatorWidth ?? 0,
  }
}
