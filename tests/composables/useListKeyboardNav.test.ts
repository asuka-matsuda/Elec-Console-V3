import { describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { useListKeyboardNav } from '../../app/composables/useListKeyboardNav'

describe('useListKeyboardNav', () => {
  const options = ref([
    { label: 'Option 1', value: '1' },
    { label: 'Option 2 (Disabled)', value: '2', disabled: true },
    { label: 'Option 3', value: '3' },
  ])

  it('should navigate forward and skip disabled items', () => {
    const isOpen = ref(true)
    const onSelect = vi.fn()
    const { focusedIndex, focusNext } = useListKeyboardNav({
      options,
      isOpen,
      onSelect,
    })

    expect(focusedIndex.value).toBe(-1)
    focusNext()
    expect(focusedIndex.value).toBe(0) // Option 1
    focusNext()
    expect(focusedIndex.value).toBe(2) // Option 3 (Option 2 was skipped)
    focusNext()
    expect(focusedIndex.value).toBe(2) // End of list
  })

  it('should navigate backward and skip disabled items', () => {
    const isOpen = ref(true)
    const onSelect = vi.fn()
    const { focusedIndex, focusPrev, resetFocus } = useListKeyboardNav({
      options,
      isOpen,
      onSelect,
    })

    resetFocus(2)
    expect(focusedIndex.value).toBe(2)
    focusPrev()
    expect(focusedIndex.value).toBe(0) // Option 1 (Option 2 was skipped)
    focusPrev()
    expect(focusedIndex.value).toBe(0) // Top of list
  })

  it('should trigger onSelect on Enter key when opened', () => {
    const isOpen = ref(true)
    const onSelect = vi.fn()
    const { focusNext, handleKeydown } = useListKeyboardNav({
      options,
      isOpen,
      onSelect,
    })

    focusNext() // focusedIndex = 0 (Option 1)
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })

    handleKeydown(enterEvent)

    expect(onSelect).toHaveBeenCalledWith(options.value[0])
  })

  it('should open dropdown on ArrowDown when closed', () => {
    const isOpen = ref(false)
    const onSelect = vi.fn()
    const { handleKeydown } = useListKeyboardNav({
      options,
      isOpen,
      onSelect,
    })

    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' })

    handleKeydown(arrowDownEvent)

    expect(isOpen.value).toBe(true)
  })

  it('should close dropdown on Escape', () => {
    const isOpen = ref(true)
    const onSelect = vi.fn()
    const { handleKeydown } = useListKeyboardNav({
      options,
      isOpen,
      onSelect,
    })

    const escEvent = new KeyboardEvent('keydown', { key: 'Escape' })

    handleKeydown(escEvent)

    expect(isOpen.value).toBe(false)
  })
})
