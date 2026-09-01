import { useLocalStorage } from '@vueuse/core'

export const useSettings = () => {
  const themeMode = useLocalStorage<'dark' | 'light'>(
    'elec_theme_mode',
    'dark',
  )

  return {
    themeMode,
  }
}
