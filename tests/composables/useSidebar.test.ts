import { describe, expect, it } from 'vitest'

import { useSidebar } from '../../app/composables/useSidebar'

describe('useSidebar', () => {
  it('初期状態は false（閉じている）', () => {
    const { isOpen, closeSidebar } = useSidebar()

    closeSidebar()
    expect(isOpen.value).toBe(false)
  })

  it('openSidebar() で true になる', () => {
    const { isOpen, openSidebar } = useSidebar()

    openSidebar()
    expect(isOpen.value).toBe(true)
  })

  it('closeSidebar() で false になる', () => {
    const { isOpen, openSidebar, closeSidebar } = useSidebar()

    openSidebar()
    expect(isOpen.value).toBe(true)

    closeSidebar()
    expect(isOpen.value).toBe(false)
  })

  it('toggleSidebar() で開閉状態が反転する', () => {
    const { isOpen, closeSidebar, toggleSidebar } = useSidebar()

    closeSidebar()
    expect(isOpen.value).toBe(false)

    toggleSidebar()
    expect(isOpen.value).toBe(true)

    toggleSidebar()
    expect(isOpen.value).toBe(false)
  })
})
