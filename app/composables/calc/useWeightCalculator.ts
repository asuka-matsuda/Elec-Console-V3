import { ref, computed } from 'vue';
import { calculateWeightAndDrum } from '~/utils/calc/weight/weightCalcLogic';
import type { WeightCalcInputs, WeightCalcResult } from '~/utils/calc/weight/weightCalcLogic';
import { cableData } from '~/utils/data/cableData';
import { drumData } from '~/utils/data/drumData';
import { useCalcHistory } from './useCalcHistory';
import { mapWeightToHistory } from '~/utils/calc/weight/historyMapper';

export function useWeightCalculator() {
  const category = ref('');
  const size = ref('');
  const cores = ref('');
  const L_input = ref(100);
  const K = ref(0.85);

  const { saveHistory } = useCalcHistory("elec_calc_weight_hist");

  const result = computed<WeightCalcResult>(() => {
    if (!category.value || !size.value || !cores.value || L_input.value <= 0) {
      return { error: true };
    }
    const inputs: WeightCalcInputs = {
      category: category.value,
      size: size.value,
      cores: cores.value,
      L_input: L_input.value,
      K: K.value
    };
    return calculateWeightAndDrum(inputs, cableData, drumData);
  });

  function reset() {
    category.value = '';
    size.value = '';
    cores.value = '';
    L_input.value = 100;
    K.value = 0.85;
  }

  function handleSaveHistory() {
    if (result.value.error) return;
    const historyData = mapWeightToHistory(
      {
        category: category.value,
        size: size.value,
        cores: cores.value,
        L_input: L_input.value,
        K: K.value
      },
      result.value
    );
    if (historyData) {
      saveHistory(historyData);
    }
  }

  return {
    category,
    size,
    cores,
    L_input,
    K,
    result,
    reset,
    handleSaveHistory
  };
}
