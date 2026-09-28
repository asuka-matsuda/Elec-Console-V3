/**
 * 計算ツール履歴一覧画面 Composable
 *
 * @description 電圧降下・管径・ラック・重量の各計算履歴の一括表示、種別フィルタ、削除を管理します。
 * LocalStorage は使用せず、サーバーAPI経由で一元管理されます。
 */

import { getCurrentInstance, onMounted, ref, watch } from 'vue'

import { useNuxtApp } from '#app'
import { useModal } from '~/composables/useModal'
import type { HistoryEntry } from '~/types/tools'

const CALC_HISTORY_TABS = [
  { value: 'voltage', label: '電圧降下計算' },
  { value: 'conduit', label: '配管サイズ' },
  { value: 'rack', label: 'ケーブルラック' },
  { value: 'weight', label: '重量・ドラム' },
]

export function useCalculationHistoryPage() {
  const currentTab = ref('voltage')
  const { askConfirm } = useModal()
  const historyList = ref<HistoryEntry[]>([])
  const isLoading = ref(false)

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
        `/api/calc-history?toolId=${currentTab.value}`,
      )

      if (data && data.history) {
        historyList.value = data.history
      }
      else {
        historyList.value = []
      }
    }
    catch (e) {
      console.warn('[useCalculationHistoryPage] Failed to fetch history:', e)
      historyList.value = []
    }
    finally {
      isLoading.value = false
    }
  }

  watch(currentTab, () => {
    fetchHistory()
  })

  if (getCurrentInstance()) {
    onMounted(() => {
      fetchHistory()
    })
  }

  const deleteHistory = async (id: string) => {
    historyList.value = historyList.value.filter(item => item.id !== id)
    const $api = getApi()

    if ($api) {
      try {
        await $api(`/api/calc-history?id=${id}`, { method: 'DELETE' })
      }
      catch (e) {
        console.error('[useCalculationHistoryPage] Failed to delete item:', e)
      }
    }
  }

  const handleClearAll = async () => {
    const isConfirmed = await askConfirm({
      title: '履歴をすべて削除',
      message: '全ての履歴を削除しますか？この操作は取り消せません。',
      confirmText: '削除する',
      intent: 'danger',
    })

    if (isConfirmed) {
      historyList.value = []
      const $api = getApi()

      if ($api) {
        try {
          await $api(`/api/calc-history?toolId=${currentTab.value}`, { method: 'DELETE' })
        }
        catch (e) {
          console.error('[useCalculationHistoryPage] Failed to clear items:', e)
        }
      }
    }
  }

  const openDeleteModal = async (id: string) => {
    const isConfirmed = await askConfirm({
      title: '履歴を削除',
      message: 'この履歴を削除しますか？',
      confirmText: '削除する',
      intent: 'danger',
    })

    if (isConfirmed) {
      await deleteHistory(id)
    }
  }

  return {
    tabs: CALC_HISTORY_TABS,
    currentTab,
    historyList,
    isLoading,
    fetchHistory,
    handleClearAll,
    openDeleteModal,
    deleteHistory,
  }
}
