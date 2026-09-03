import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

import { useCalcHistory } from '~/composables/tools/useCalcHistory'
import type { HistoryEntry } from '~/types/history'

export function useToolPage<InputType, ResultType>(
  toolId: string,
  toolTitle: string,
  defaultInputs: InputType,
  calculateFn: (inputs: InputType) => ResultType,
  historyMapper: {
    toHistory: (
      inputs: InputType,
      result: ResultType | null,
    ) => Omit<HistoryEntry, 'id' | 'timestamp'> | null
    fromHistory: (entry: HistoryEntry) => InputType
  },
) {
  const { saveHistory } = useCalcHistory(`elec_calc_${toolId}_hist`)
  const inputs = useLocalStorage<InputType>(
    `tool-inputs-${toolId}`,
    defaultInputs,
    { mergeDefaults: true },
  )
  const result = computed<ResultType | null>(() => {
    try {
      return calculateFn(inputs.value)
    }
    catch (e) {
      console.error(`Error calculating ${toolId}:`, e)

      return null
    }
  })

  const saveToHistory = async () => {
    if (result.value) {
      const entryData = historyMapper.toHistory(inputs.value, result.value)

      if (entryData) {
        const entry: Omit<HistoryEntry, 'id' | 'timestamp'> = {
          ...entryData,
          toolId,
          rawInputs: JSON.parse(JSON.stringify(inputs.value)),
          rawResult: JSON.parse(JSON.stringify(result.value)),
        }

        await saveHistory(entry)
      }
    }
  }

  const loadFromHistory = (entry: HistoryEntry) => {
    if (entry.toolName) {
      inputs.value = historyMapper.fromHistory(entry)
    }
  }

  const resetInputs = () => {
    // 深いコピーでリセット
    inputs.value = JSON.parse(JSON.stringify(defaultInputs))
  }

  const isResetModalOpen = ref(false)
  const openResetModal = () => {
    isResetModalOpen.value = true
  }
  const confirmReset = () => {
    resetInputs()
    isResetModalOpen.value = false
  }

  return {
    inputs,
    result,
    saveToHistory,
    loadFromHistory,
    resetInputs,
    isResetModalOpen,
    openResetModal,
    confirmReset,
  }
}
