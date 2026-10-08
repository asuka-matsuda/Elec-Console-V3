import { describe, expect, it } from 'vitest'

import { useAppState } from '../../app/composables/useAppState'
import { STATE_KEYS } from '../../app/constants/storageKeys'

describe('useAppState (Type-Safe State Composable)', () => {
  it('should initialize and hold boolean state for SIDEBAR_OPEN', () => {
    const sidebar = useAppState(STATE_KEYS.SIDEBAR_OPEN, () => false)

    expect(sidebar.value).toBe(false)
    sidebar.value = true
    expect(sidebar.value).toBe(true)
  })

  it('should initialize and hold nullable user state for CURRENT_USER', () => {
    const user = useAppState(STATE_KEYS.CURRENT_USER, () => null)

    expect(user.value).toBeNull()
  })
})
