/**
 * アプリケーション共通設定 Composable
 *
 * @description UIテーマ（ダーク/ライト）やユーザー個別表示オプションをLocalStorageと連携して永続管理します。
 */

import { useLocalStorage } from '@vueuse/core'

import { STORAGE_KEYS } from '~/constants/storageKeys'

export const useSettings = () => {
  const themeMode = useLocalStorage<'dark' | 'light'>(
    STORAGE_KEYS.THEME_MODE,
    'dark',
  )

  const animationEnabled = useLocalStorage<boolean>(
    STORAGE_KEYS.ANIMATION_ENABLED,
    true,
  )

  return {
    themeMode,
    animationEnabled,
  }
}
