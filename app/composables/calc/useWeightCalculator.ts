import { computed } from 'vue';
import { calculateWeightAndDrum, generateMathData } from '~/utils/calc/weight/weightCalcLogic';
import type { WeightCalcInputs, WeightCalcResult } from '~/utils/calc/weight/weightCalcLogic';
import { cableData } from '~/utils/data/cableData';
import { drumData } from '~/utils/data/drumData';
import { mapWeightToHistory } from '~/utils/calc/weight/historyMapper';
import { useToolPage } from '~/composables/calc/useToolPage';

const defaultInputs: WeightCalcInputs = {
  category: '',
  cableIdx: '',
  L_input: null,
  K: null
};

export function useWeightCalculator() {

  const {
    inputs,
    result,
    saveToHistory: handleSaveHistory,
    resetInputs,
    isResetModalOpen,
    openResetModal,
    confirmReset,
  } = useToolPage<WeightCalcInputs, WeightCalcResult>(
    'weight',
    'ドラムサイズ・重量計算',
    defaultInputs,
    (inputs) => {
      if (!inputs.category || !inputs.cableIdx || !inputs.L_input || inputs.L_input <= 0 || !inputs.K) {
        return { error: true };
      }
      return calculateWeightAndDrum(inputs, cableData, drumData);
    },
    {
      toHistory: (inputs, res) => mapWeightToHistory(inputs, res!)!,
      fromHistory: () => JSON.parse(JSON.stringify(defaultInputs))
    }
  );

  const mathSteps = computed(() => {
    return generateMathData(inputs.value, result.value, cableData);
  });

  return {
    inputs,
    result,
    reset: resetInputs,
    isResetModalOpen,
    openResetModal,
    confirmReset,
    handleSaveHistory,
    mathSteps
  };
}
