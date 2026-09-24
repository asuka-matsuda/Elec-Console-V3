/**
 * サイドバー（グローバルナビゲーション）開閉状態管理 Composable
 *
 * アプリケーション全体のナビゲーションドロワーの開閉状態と操作を一元管理します。
 */
import { useState } from '#app'

export const useSidebar = () => {
  const isOpen = useState<boolean>('sidebar-open', () => false)

  const openSidebar = () => {
    isOpen.value = true
  }

  const closeSidebar = () => {
    isOpen.value = false
  }

  const toggleSidebar = () => {
    isOpen.value = !isOpen.value
  }

  return {
    isOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  }
}
