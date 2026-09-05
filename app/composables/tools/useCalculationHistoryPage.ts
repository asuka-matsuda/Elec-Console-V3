import { computed, ref, watch } from 'vue'

import { useModal } from '~/composables/useModal'
import type { HistoryEntry } from '~/types/history'

export const CALC_HISTORY_TABS = [
  { value: 'voltage', label: '電圧降下計算' },
  { value: 'conduit', label: '配管サイズ' },
]

export function useCalculationHistoryPage() {
  const currentTab = ref('voltage')
  const historyList = ref<HistoryEntry[]>([])
  const { askConfirm } = useModal()

  const storageKey = computed(() => `elec_calc_${currentTab.value}_hist`)

  const loadHistory = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(storageKey.value)

      if (stored) {
        try {
          historyList.value = JSON.parse(stored)
        }
        catch {
          historyList.value = []
        }
      }
      else {
        historyList.value = []
      }
    }
  }

  const deleteHistory = (id: string) => {
    historyList.value = historyList.value.filter(item => item.id !== id)
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
      deleteHistory(id)
    }
  }

  watch(
    currentTab,
    () => {
      loadHistory()
    },
    { immediate: true },
  )

  watch(
    historyList,
    (newVal) => {
      if (import.meta.client) {
        localStorage.setItem(storageKey.value, JSON.stringify(newVal))
      }
    },
    { deep: true },
  )

  return {
    tabs: CALC_HISTORY_TABS,
    currentTab,
    historyList,
    handleClearAll,
    openDeleteModal,
  }
}
