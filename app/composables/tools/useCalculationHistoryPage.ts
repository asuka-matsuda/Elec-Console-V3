/**
 * 計算ツール履歴一覧画面 Composable
 *
 * @description 電圧降下・管径・ラック・重量の各計算履歴の一括表示、種別フィルタ、検索、ページネーションを管理します。
 */

import { useLocalStorage } from '@vueuse/core'
import { computed, ref } from 'vue'

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

  const storageKey = computed(() => `elec_calc_${currentTab.value}_hist`)
  const historyList = useLocalStorage<HistoryEntry[]>(storageKey, [])

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

  return {
    tabs: CALC_HISTORY_TABS,
    currentTab,
    historyList,
    handleClearAll,
    openDeleteModal,
  }
}
