import { describe, expect, it } from 'vitest'

import { useSettings } from '../../app/composables/useSettings'

describe('useSettings', () => {
  it('provides default themeMode as "dark" and animationEnabled as true', () => {
    const { themeMode, animationEnabled } = useSettings()

    expect(themeMode.value).toBe('dark')
    expect(animationEnabled.value).toBe(true)
  })

  it('updates animationEnabled reactively', () => {
    const { animationEnabled } = useSettings()

    animationEnabled.value = false
    expect(animationEnabled.value).toBe(false)
  })
})
