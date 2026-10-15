/**
 * 計算ツール履歴一覧画面 Composable
 *
 * @description 電圧降下・管径・ラック・重量の各計算履歴の一括表示、種別フィルタ、削除を管理します。
 * LocalStorage は使用せず、サーバーAPI経由で一元管理されます。
 */

import { ref, watch } from 'vue'

import { useCalcHistory } from '~/composables/tools/useCalcHistory'
import { useModal } from '~/composables/useModal'

const CALC_HISTORY_TABS = [
  { value: 'voltage', label: '電圧降下計算' },
  { value: 'conduit', label: '配管サイズ' },
  { value: 'rack', label: 'ケーブルラック' },
  { value: 'weight', label: '重量・ドラム' },
]

export function useCalculationHistoryPage() {
  const currentTab = ref('voltage')
  const { askConfirm } = useModal()
  const {
    historyList,
    isLoading,
    fetchHistory: fetchByTool,
    deleteHistory,
    clearAll,
  } = useCalcHistory(currentTab.value)

  const fetchHistory = async () => {
    await fetchByTool(currentTab.value)
  }

  watch(currentTab, () => {
    fetchHistory()
  })

  const handleClearAll = async () => {
    const isConfirmed = await askConfirm({
      title: '履歴をすべて削除',
      message: '全ての履歴を削除しますか？この操作は取り消せません。',
      confirmText: '削除する',
      intent: 'danger',
    })

    if (isConfirmed) {
      await clearAll(currentTab.value)
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
