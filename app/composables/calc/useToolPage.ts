import { computed, ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { useCalcHistory } from '~/composables/calc/useCalcHistory';
import type { HistoryEntry } from '~/utils/calc/history/types';

export function useToolPage<InputType, ResultType>(
  toolId: string,
  toolTitle: string,
  defaultInputs: InputType,
  calculateFn: (inputs: InputType) => ResultType,
  historyMapper: {
    toHistory: (inputs: InputType, result: ResultType | null) => Omit<HistoryEntry, "id" | "timestamp"> | null;
    fromHistory: (entry: HistoryEntry) => InputType;
  }
) {
  const { saveHistory } = useCalcHistory(`elec_calc_${toolId}_hist`);
  const inputs = useLocalStorage<InputType>(`tool-inputs-${toolId}`, defaultInputs, { mergeDefaults: true });
  const result = computed<ResultType | null>(() => {
    try {
      return calculateFn(inputs.value);
    } catch (e) {
      console.error(`Error calculating ${toolId}:`, e);
      return null;
    }
  });

  const saveToHistory = async () => {
    if (result.value) {
      const entry = historyMapper.toHistory(inputs.value, result.value) as any;
      if (entry) {
        entry.toolId = toolId;
        // 参照を切るためにディープコピーして保存
        entry.rawInputs = JSON.parse(JSON.stringify(inputs.value));
        entry.rawResult = JSON.parse(JSON.stringify(result.value));
        await saveHistory(entry);
      }
    }
  };

  const loadFromHistory = (entry: HistoryEntry) => {
    if (entry.toolName) {
      inputs.value = historyMapper.fromHistory(entry);
    }
  };

  const resetInputs = () => {
    // 深いコピーでリセット
    inputs.value = JSON.parse(JSON.stringify(defaultInputs));
  };

  const isResetModalOpen = ref(false);
  const openResetModal = () => {
    isResetModalOpen.value = true;
  };
  const confirmReset = () => {
    resetInputs();
    isResetModalOpen.value = false;
  };

  return {
    inputs,
    result,
    saveToHistory,
    loadFromHistory,
    resetInputs,
    isResetModalOpen,
    openResetModal,
    confirmReset
  };
}
