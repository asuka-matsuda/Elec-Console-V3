import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

import { useCalcHistory } from '~/composables/tools/useCalcHistory'
import { useModal } from '~/composables/useModal'
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

  const { askConfirm } = useModal()

  const resetInputs = () => {
    inputs.value = JSON.parse(JSON.stringify(defaultInputs))
  }

  const isResetModalOpen = ref(false)
  const openResetModal = async () => {
    const isConfirmed = await askConfirm({
      title: 'リセットの確認',
      message: '入力した条件をすべてリセットしますか？',
      confirmText: 'リセットする',
      intent: 'danger',
    })

    if (isConfirmed) {
      resetInputs()
    }
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
