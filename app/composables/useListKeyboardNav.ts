import { type ComputedRef, type Ref, ref } from 'vue'

export type NavigableOption = {
  disabled?: boolean
}

export interface UseListKeyboardNavOptions<T extends NavigableOption> {
  options: Ref<T[]> | ComputedRef<T[]>
  isOpen: Ref<boolean>
  onSelect: (option: T) => void
  onClear?: () => void
  disabled?: Ref<boolean | undefined> | ComputedRef<boolean | undefined>
}

/**
 * リストやセレクトボックス用のキーボードナビゲーションComposable
 */
export function useListKeyboardNav<T extends NavigableOption>({
  options,
  isOpen,
  onSelect,
  onClear,
  disabled,
}: UseListKeyboardNavOptions<T>) {
  const focusedIndex = ref(-1)

  const focusNext = () => {
    const list = options.value
    let nextIndex = focusedIndex.value + 1

    while (nextIndex < list.length) {
      if (!list[nextIndex]?.disabled) {
        focusedIndex.value = nextIndex

        return
      }
      nextIndex++
    }
  }

  const focusPrev = () => {
    const list = options.value
    let prevIndex = focusedIndex.value - 1

    while (prevIndex >= 0) {
      if (!list[prevIndex]?.disabled) {
        focusedIndex.value = prevIndex

        return
      }
      prevIndex--
    }
  }

  const resetFocus = (selectedIndex = -1) => {
    if (selectedIndex >= 0 && selectedIndex < options.value.length) {
      focusedIndex.value = selectedIndex
    }
    else {
      focusedIndex.value = -1
      focusNext()
    }
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (disabled?.value) return

    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        event.preventDefault()
        if (onClear) {
          onClear()
        }
        isOpen.value = false
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (isOpen.value) {
          const list = options.value

          if (focusedIndex.value >= 0 && focusedIndex.value < list.length) {
            onSelect(list[focusedIndex.value]!)
          }
          else {
            isOpen.value = false
          }
        }
        else {
          isOpen.value = true
        }
        break
      case 'Escape':
        if (isOpen.value) {
          isOpen.value = false
          event.stopPropagation()
        }
        break
      case 'ArrowDown':
        event.preventDefault()
        if (!isOpen.value) {
          isOpen.value = true
        }
        else {
          focusNext()
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (!isOpen.value) {
          isOpen.value = true
        }
        else {
          focusPrev()
        }
        break
    }
  }

  return {
    focusedIndex,
    focusNext,
    focusPrev,
    resetFocus,
    handleKeydown,
  }
}
