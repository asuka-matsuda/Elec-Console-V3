import { beforeEach, describe, expect, it } from 'vitest'

import { useSettings } from '../../app/composables/useSettings'
import { STORAGE_KEYS } from '../../app/constants/storageKeys'

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('provides default themeMode as "dark" and animationEnabled as true', () => {
    const { themeMode, animationEnabled } = useSettings()

    expect(themeMode.value).toBe('dark')
    expect(animationEnabled.value).toBe(true)
  })

  it('updates animationEnabled and stores in localStorage', async () => {
    const { animationEnabled } = useSettings()

    animationEnabled.value = false
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(localStorage.getItem(STORAGE_KEYS.ANIMATION_ENABLED)).toBe('false')
  })
})
