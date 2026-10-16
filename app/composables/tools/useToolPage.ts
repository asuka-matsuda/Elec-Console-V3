/**
 * 技術計算ツール共通ページ Composable
 *
 * @description 各計算ツールの入力・結果パネルのレイアウト制御、履歴ドロワー連携、LocalStorage保存を共通化します。
 * @param toolType ツール識別子 ('voltage' | 'conduit' | 'rack' | 'weight')
 */

import { useSessionStorage } from '@vueuse/core'
import { computed, getCurrentInstance, ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

import { useCalcHistory } from '~/composables/tools/useCalcHistory'
import { useModal } from '~/composables/useModal'
import { useToast } from '~/composables/useToast'
import { STORAGE_KEYS } from '~/constants/storageKeys'
import type { HistoryEntry } from '~/types/tools'

export function useToolPage<InputType, ResultType>(
  toolId: string,
  defaultInputs: InputType,
  calculateFn: (inputs: InputType) => ResultType,
  historyMapper: {
    toHistory: (
      inputs: InputType,
      result: ResultType | null,
    ) => Omit<HistoryEntry, 'id' | 'timestamp'> | null
  },
) {
  const { saveHistory } = useCalcHistory(STORAGE_KEYS.TOOL_HISTORY(toolId))
  const toast = useToast()
  const sessionKey = `tool-inputs-${toolId}`
  const inputs = useSessionStorage<InputType>(
    sessionKey,
    defaultInputs,
    { mergeDefaults: true },
  )

  const isShowingBasis = ref(false)
  const isSaving = ref(false)

  if (getCurrentInstance()) {
    try {
      onBeforeRouteLeave(() => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(sessionKey)
        }
      })
    }
    catch {
      // Non-router / test context fallback
    }
  }
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

  const handleSave = async () => {
    if (isSaving.value) return

    isSaving.value = true
    try {
      await saveToHistory()
      toast.success('計算履歴に保存しました')
    }
    catch {
      toast.error('履歴の保存に失敗しました')
    }
    finally {
      isSaving.value = false
    }
  }

  const { askConfirm } = useModal()

  const resetInputs = () => {
    inputs.value = JSON.parse(JSON.stringify(defaultInputs))
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(sessionKey)
    }
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
    isShowingBasis,
    isSaving,
    handleSave,
    openResetModal,
  }
}
