/**
 * 技術計算ツール共通ページ Composable
 *
 * @description 各計算ツールの入力・結果パネルのレイアウト制御、履歴ドロワー連携、LocalStorage保存を共通化します。
 * @param {string} toolType ツール識別子 ('voltage' | 'conduit' | 'rack' | 'weight')
 */

import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

import { useCalcHistory } from '~/composables/tools/useCalcHistory'
import { useModal } from '~/composables/useModal'
import { STORAGE_KEYS } from '~/constants/storageKeys'
import type { HistoryEntry } from '~/types/history'

export function useToolPage<InputType, ResultType>(
  toolId: string,
  _toolTitle: string,
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
  const { saveHistory } = useCalcHistory(STORAGE_KEYS.TOOL_HISTORY(toolId))
  const inputs = useLocalStorage<InputType>(
    STORAGE_KEYS.TOOL_INPUTS(toolId),
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

  const openResetModal = async (): Promise<boolean> => {
    const isConfirmed = await askConfirm({
      title: 'リセットの確認',
      message: '入力した条件をすべてリセットしますか？',
      confirmText: 'リセットする',
      intent: 'danger',
    })

    if (isConfirmed) {
      resetInputs()
    }

    return isConfirmed
  }

  return {
    inputs,
    result,
    handleSaveHistory: saveToHistory,
    saveToHistory,
    loadFromHistory,
    resetInputs,
    openResetModal,
  }
}
