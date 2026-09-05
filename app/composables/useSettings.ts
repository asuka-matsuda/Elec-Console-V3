import { useLocalStorage } from '@vueuse/core'

import { STORAGE_KEYS } from '~/constants/storageKeys'

export const useSettings = () => {
  const themeMode = useLocalStorage<'dark' | 'light'>(
    STORAGE_KEYS.THEME_MODE,
    'dark',
  )

  return {
    themeMode,
  }
}
