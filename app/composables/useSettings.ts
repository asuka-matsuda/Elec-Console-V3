/**
 * アプリケーション共通設定 Composable
 *
 * @description UIテーマ（ダーク/ライト）やユーザー個別表示オプションをLocalStorageと連携して永続管理します。
 */

import { useCookie } from '#app'
import { STORAGE_KEYS } from '~/constants/storageKeys'

export function useSettings() {
  const themeMode = useCookie<'dark' | 'light'>(
    STORAGE_KEYS.THEME_MODE,
    {
      default: () => 'dark',
      sameSite: 'lax',
    },
  )

  const animationEnabled = useCookie<boolean>(
    STORAGE_KEYS.ANIMATION_ENABLED,
    {
      default: () => true,
      sameSite: 'lax',
    },
  )

  return {
    themeMode,
    animationEnabled,
  }
}
