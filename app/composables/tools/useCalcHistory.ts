/**
 * 計算履歴管理 Composable (Database / API 連携)
 *
 * @description 電卓ツール群（電圧降下・電線管・ラック等）の計算結果履歴の保存・読出をサーバー経由で管理します。
 * 端末間でのデータ同期を保証し、LocalStorage は使用しません。
 */

import { getCurrentInstance, onMounted, ref } from 'vue'

import { useNuxtApp } from '#app'
import { useAuth } from '~/composables/useAuth'
import type { HistoryEntry } from '~/types/tools'
import { formatDateTime } from '~/utils/date'

/**
 * 汎用的な計算履歴管理コンポーザブル
 * @param toolKey ツール識別子またはキー (例: 'voltage' または 'elec_calc_voltage_hist')
 */
export function useCalcHistory(toolKey: string) {
  const toolId = toolKey.replace(/^elec_calc_/, '').replace(/_hist$/, '')
  const historyList = ref<HistoryEntry[]>([])
  const isLoading = ref(false)
  const { getAccurateNow } = useAuth()

  const getApi = () => {
    try {
      const { $api } = useNuxtApp()

      return $api
    }
    catch {
      return null
    }
  }

  const fetchHistory = async () => {
    const $api = getApi()

    if (!$api) return

    isLoading.value = true
    try {
      const data = await $api<{ success: boolean, history: HistoryEntry[] }>(
        `/api/calc-history?toolId=${toolId}`,
      )

      if (data && data.history) {
        historyList.value = data.history
      }
    }
    catch (e) {
      console.warn(`[useCalcHistory] Failed to fetch history for ${toolId}:`, e)
    }
    finally {
      isLoading.value = false
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      fetchHistory()
    })
  }

  const saveHistory = async (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    const formattedDate = formatDateTime(getAccurateNow())

    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: formattedDate,
    }

    historyList.value.unshift(newEntry)

    const MAX_HISTORY = 30

    if (historyList.value.length > MAX_HISTORY) {
      historyList.value = historyList.value.slice(0, MAX_HISTORY)
    }

    const $api = getApi()

    if ($api) {
      try {
        await $api('/api/calc-history', {
          method: 'POST',
          body: newEntry,
        })
      }
      catch (e) {
        console.error('[useCalcHistory] Failed to save history:', e)
      }
    }
  }

  const deleteHistory = async (id: string) => {
    historyList.value = historyList.value.filter(item => item.id !== id)

    const $api = getApi()

    if ($api) {
      try {
        await $api(`/api/calc-history?id=${id}`, {
          method: 'DELETE',
        })
      }
      catch (e) {
        console.error('[useCalcHistory] Failed to delete history:', e)
      }
    }
  }

  const clearAll = async () => {
    historyList.value = []

    const $api = getApi()

    if ($api) {
      try {
        await $api(`/api/calc-history?toolId=${toolId}`, {
          method: 'DELETE',
        })
      }
      catch (e) {
        console.error('[useCalcHistory] Failed to clear history:', e)
      }
    }
  }

  return {
    historyList,
    isLoading,
    fetchHistory,
    saveHistory,
    deleteHistory,
    clearAll,
  }
}
