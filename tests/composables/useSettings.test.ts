import { describe, expect, it } from 'vitest'

import { useSettings } from '../../app/composables/useSettings'

describe('useSettings', () => {
  it('provides default themeMode as "dark"', () => {
    const { themeMode } = useSettings()

    expect(themeMode.value).toBe('dark')
  })
})
