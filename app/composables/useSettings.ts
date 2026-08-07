import { useLocalStorage } from '@vueuse/core'

export const useSettings = () => {
  const themeMode = useLocalStorage<'dark' | 'light'>('elec_theme_mode', 'dark')
  const baseBgStyle = useLocalStorage<'aurora' | 'grid' | 'gradient' | 'solid'>('elec_base_bg_style', 'aurora')

  return {
    themeMode,
    baseBgStyle
  }
}
