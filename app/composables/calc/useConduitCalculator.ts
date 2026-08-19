import { ref, computed } from 'vue';
const uuidv4 = () => crypto.randomUUID();
import { calculateConduitSize, generateMathData } from '~/utils/calc/conduit/conduitCalcLogic';
import type { CableInput, ConduitCalcResult } from '~/utils/calc/conduit/conduitCalcLogic';
import { cableData } from '~/utils/data/cableData';
import { conduitData } from '~/utils/data/conduitData';
import { mapConduitToHistory } from '~/utils/calc/conduit/historyMapper';
import { useToolPage } from '~/composables/calc/useToolPage';

export interface ConduitInputs {
  conduitCategory: string;
  inputCables: CableInput[];
}

const defaultInputs: ConduitInputs = {
  conduitCategory: '',
  inputCables: [{ id: uuidv4(), category: '', cableIdx: '', count: null as any }]
};

export function useConduitCalculator() {
  const {
    inputs,
    result,
    saveToHistory: saveHistory,
    resetInputs,
    isResetModalOpen,
    openResetModal,
    confirmReset,
  } = useToolPage<ConduitInputs, ConduitCalcResult>(
    'conduit',
    '配管サイズ自動選定',
    defaultInputs,
    (inputs) => calculateConduitSize(inputs.conduitCategory, inputs.inputCables, conduitData, cableData),
    {
      toHistory: (inputs, res) => mapConduitToHistory(inputs.conduitCategory, inputs.inputCables, res!)!,
      fromHistory: () => {
        return JSON.parse(JSON.stringify(defaultInputs));
      }
    }
  );

  // VueUseのuseLocalStorageで初期化される際にidが重複しないようにする等の対処は必要に応じて行う
  if (!inputs.value.inputCables || inputs.value.inputCables.length === 0) {
    inputs.value.inputCables = [{ id: uuidv4(), category: '', cableIdx: '', count: null }];
  }

  // 操作
  function addCable() {
    inputs.value.inputCables.push({
      id: uuidv4(),
      category: '',
      cableIdx: '',
      count: 1
    });
  }

  function removeCable(id: string) {
    if (inputs.value.inputCables.length <= 1) return;
    inputs.value.inputCables = inputs.value.inputCables.filter(c => c.id !== id);
  }

  const mathSteps = computed(() => {
    return generateMathData(inputs.value.conduitCategory, inputs.value.inputCables, result.value);
  });

  return {
    inputs,
    result,
    addCable,
    removeCable,
    reset: resetInputs,
    saveHistory,
    isResetModalOpen,
    openResetModal,
    confirmReset,
    mathSteps
  };
}
