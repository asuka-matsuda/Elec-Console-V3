import { computed } from 'vue'

import { useToolPage } from '~/composables/tools/useToolPage'
import { STANDARD_RACK_SIZES } from '~/constants/rackConstants'
import { mapRackToHistory } from '~/utils/tools/rack/historyMapper'
import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import {
  calculateRackSize,
  generateMathData,
} from '~/utils/tools/rack/rackCalcLogic'
import type { RackInputs } from '~/utils/tools/rack/rackMapper'
import { mapFormToRackCalcInputs } from '~/utils/tools/rack/rackMapper'

const defaultInputs: RackInputs = {
  mode: 'strong',
  lStrong: 1,
  lWeak: 1,
  rackHeight: null,
  otherWidth: null,
  strongCablesUI: [
    { id: crypto.randomUUID(), category: '', cableIdx: '', count: null },
  ],
  weakCablesUI: [
    { id: crypto.randomUUID(), category: '', cableIdx: '', count: null },
  ],
}

export function useRackCalculator() {
  const {
    inputs,
    result,
    saveToHistory: handleSaveHistory,
    resetInputs,
    isResetModalOpen,
    openResetModal,
    confirmReset,
  } = useToolPage<RackInputs, RackCalcResult>(
    'rack',
    'ケーブルラック選定',
    defaultInputs,
    (inputs) => {
      const logicInputs = mapFormToRackCalcInputs(inputs)

      return calculateRackSize(logicInputs, STANDARD_RACK_SIZES)
    },
    {
      toHistory: (inputs, res) => {
        const logicInputs = mapFormToRackCalcInputs(inputs)
        const isStrong = inputs.mode === 'strong'

        return mapRackToHistory(
          {
            mode: logicInputs.mode,
            layers: logicInputs.layers,
            rackHeight: logicInputs.rackHeight,
            maxDepth: logicInputs.maxDepth,
            otherWidth: logicInputs.otherWidth,
          },
          isStrong ? inputs.strongCablesUI : inputs.weakCablesUI,
          res!,
        )!
      },
      fromHistory: () => JSON.parse(JSON.stringify(defaultInputs)),
    },
  )

  const maxDepth = computed(() =>
    Math.max(1, (inputs.value.rackHeight ?? 0) - 20),
  )

  function addStrongCable() {
    inputs.value.strongCablesUI.push({
      id: crypto.randomUUID(),
      category: '',
      cableIdx: '',
      count: 1,
    })
  }

  function removeStrongCable(id: string) {
    if (inputs.value.strongCablesUI.length <= 1) return
    inputs.value.strongCablesUI = inputs.value.strongCablesUI.filter(
      c => c.id !== id,
    )
  }

  function addWeakCable() {
    inputs.value.weakCablesUI.push({
      id: crypto.randomUUID(),
      category: '',
      cableIdx: '',
      count: 1,
    })
  }

  function removeWeakCable(id: string) {
    if (inputs.value.weakCablesUI.length <= 1) return
    inputs.value.weakCablesUI = inputs.value.weakCablesUI.filter(
      c => c.id !== id,
    )
  }

  const mathSteps = computed(() => {
    const logicInputs = mapFormToRackCalcInputs(inputs.value)

    return generateMathData(logicInputs, result.value)
  })

  return {
    inputs,
    maxDepth,
    result,
    addStrongCable,
    removeStrongCable,
    addWeakCable,
    removeWeakCable,
    reset: resetInputs,
    isResetModalOpen,
    openResetModal,
    confirmReset,
    handleSaveHistory,
    mathSteps,
  }
}
