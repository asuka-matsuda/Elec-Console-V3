/**
 * ケーブルラックサイズ選定計算 Composable
 *
 * @description 敷設ケーブルの幅・外径から必要ラック幅・親桁高さ・段数を自動算出し、積載率を検証します。
 */

import { computed } from 'vue'

import { useToolPage } from '~/composables/tools/useToolPage'
import { STANDARD_RACK_SIZES } from '~/constants/rackConstants'
import { generateUuid } from '~/utils/crypto'
import { mapRackToHistory } from '~/utils/tools/rack/historyMapper'
import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import {
  calculateRackSize,
  generateRackMathData,
} from '~/utils/tools/rack/rackCalcLogic'
import type { RackInputs } from '~/utils/tools/rack/rackMapper'
import { mapFormToRackCalcInputs } from '~/utils/tools/rack/rackMapper'

const defaultInputs: RackInputs = {
  mode: 'strong',
  rackHeight: 100,
  otherWidth: null,
  marginRate: 1.2,
  cableSpacing: 10,
  sideMargin: 60,
  strongCablesUI: [
    { id: generateUuid(), category: '', cableIdx: '', count: 1 },
  ],
  weakCablesUI: [
    { id: generateUuid(), category: '', cableIdx: '', count: 1 },
  ],
}

export function useRackCalculator() {
  const {
    inputs,
    result,
    isShowingBasis,
    isSaving,
    handleSave,
    openResetModal,
  } = useToolPage<RackInputs, RackCalcResult>(
    'rack',
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
            rackHeight: logicInputs.rackHeight,
            maxDepth: logicInputs.maxDepth,
            otherWidth: logicInputs.otherWidth,
          },
          isStrong ? inputs.strongCablesUI : inputs.weakCablesUI,
          res!,
        )!
      },
    },
  )

  function addStrongCable() {
    inputs.value.strongCablesUI.push({
      id: generateUuid(),
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
      id: generateUuid(),
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

    return generateRackMathData(logicInputs, result.value)
  })

  const isSaveDisabled = computed(() =>
    Boolean(result.value?.error) || !result.value || (result.value.tier1.totalWidth === 0 && result.value.tier2.totalWidth === 0),
  )

  return {
    inputs,
    result,
    isSaveDisabled,
    isShowingBasis,
    isSaving,
    handleSave,
    addStrongCable,
    removeStrongCable,
    addWeakCable,
    removeWeakCable,
    openResetModal,
    mathSteps,
  }
}
