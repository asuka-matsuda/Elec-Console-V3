/**
 * ケーブル重量・許容張力計算 Composable
 *
 * @description ケーブル品種・サイズ・条長から総重量および延線時の許容張力を算出します。
 */

import { computed } from 'vue'

import { useToolPage } from '~/composables/tools/useToolPage'
import { cableData } from '~/constants/data/cableData'
import { drumData } from '~/constants/data/drumData'
import { mapWeightToHistory } from '~/utils/tools/weight/historyMapper'
import type {
  WeightCalcInputs,
  WeightCalcResult,
} from '~/utils/tools/weight/weightCalcLogic'
import {
  calculateWeightAndDrum,
  generateMathData,
} from '~/utils/tools/weight/weightCalcLogic'

const defaultInputs: WeightCalcInputs = {
  category: '',
  cableIdx: '',
  L_input: null,
}

export function useWeightCalculator() {
  const {
    inputs,
    result,
    saveToHistory: handleSaveHistory,
    resetInputs,
    openResetModal,
  } = useToolPage<WeightCalcInputs, WeightCalcResult>(
    'weight',
    'ドラムサイズ・重量計算',
    defaultInputs,
    (inputs) => {
      if (
        !inputs.category
        || !inputs.cableIdx
        || !inputs.L_input
        || inputs.L_input <= 0
      ) {
        return { error: true }
      }

      return calculateWeightAndDrum(inputs, cableData, drumData)
    },
    {
      toHistory: (inputs, res) => mapWeightToHistory(inputs, res!)!,
      fromHistory: () => JSON.parse(JSON.stringify(defaultInputs)),
    },
  )

  const mathSteps = computed(() => {
    return generateMathData(inputs.value, result.value, cableData)
  })

  const isSaveDisabled = computed(() => Boolean(result.value?.error))

  return {
    inputs,
    result,
    isSaveDisabled,
    reset: resetInputs,
    resetInputs,
    openResetModal,
    handleSaveHistory,
    mathSteps,
  }
}
