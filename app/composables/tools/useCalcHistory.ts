import { useLocalStorage } from '@vueuse/core'

import type { HistoryEntry } from '~/types/history'
import { formatDateTime } from '~/utils/date'

/**
 * 汎用的な計算履歴管理コンポーザブル
 * @param storageKey ローカルストレージの保存先キー (例: 'elec_calc_voltage_hist')
 */
export function useCalcHistory(storageKey: string) {
  const historyList = useLocalStorage<HistoryEntry[]>(storageKey, [])

  const saveHistory = async (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    // 処理中アニメーションを見せるため、意図的に少し待機する（UX向上）
    await new Promise(resolve => setTimeout(resolve, 600))

    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: formatDateTime(new Date()),
    }

    historyList.value.unshift(newEntry)

    const MAX_HISTORY = 30

    if (historyList.value.length > MAX_HISTORY) {
      historyList.value = historyList.value.slice(0, MAX_HISTORY)
    }
  }

  const deleteHistory = (id: string) => {
    historyList.value = historyList.value.filter(item => item.id !== id)
  }

  const clearAll = () => {
    historyList.value = []
  }

  return {
    historyList,
    saveHistory,
    deleteHistory,
    clearAll,
  }
}
