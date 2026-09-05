import { findCableByIndexString, getEffectiveCableDiameter } from '~/utils/cable'
import type {
  RackCableInput,
  RackCalcInputs,
} from '~/utils/tools/rack/rackCalcLogic'

export type RackMode = 'strong' | 'weak'

export interface RackCableUIInput {
  id: string
  category: string
  cableIdx: string
  count: number | null
}

export interface RackInputs {
  mode: RackMode
  rackHeight: number | null
  lStrong: number | null
  lWeak: number | null
  otherWidth: number | null
  strongCablesUI: RackCableUIInput[]
  weakCablesUI: RackCableUIInput[]
}

export function convertUIToRackCable(
  uiInput: RackCableUIInput,
): RackCableInput {
  const def = findCableByIndexString(uiInput.cableIdx)
  const d = def ? getEffectiveCableDiameter(def.diameter) : 0

  return { d, n: uiInput.count ?? 0 }
}

export function mapFormToRackCalcInputs(inputs: RackInputs): RackCalcInputs {
  const rH = inputs.rackHeight ?? 0
  const maxDepth = Math.max(1, rH - 10)
  const isStrong = inputs.mode === 'strong'

  return {
    mode: inputs.mode,
    layers: isStrong ? (inputs.lStrong ?? 1) : (inputs.lWeak ?? 1),
    rackHeight: rH,
    maxDepth,
    cables: isStrong
      ? inputs.strongCablesUI.map(convertUIToRackCable)
      : inputs.weakCablesUI.map(convertUIToRackCable),
    otherWidth: inputs.otherWidth ?? 0,
  }
}
