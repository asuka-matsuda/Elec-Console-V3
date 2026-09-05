import { onMounted, onUnmounted, type Ref, ref, watch } from 'vue'

export interface UseFloatingPlacementOptions {
  preferredPlacement?: 'top' | 'bottom'
  maxHeight?: number
  offset?: number
}

/**
 * 画面端のオーバーフローを防ぎ、上下に動的配置するフローティングUI用Composable
 */
export function useFloatingPlacement(
  triggerRef: Ref<HTMLElement | null>,
  dropdownRef: Ref<HTMLElement | null>,
  isOpen: Ref<boolean>,
  options: UseFloatingPlacementOptions = {},
) {
  const dynamicPlacement = ref<'top' | 'bottom'>(
    options.preferredPlacement || 'bottom',
  )
  const dropdownStyle = ref<Record<string, string>>({})
  const teleportTarget = ref<HTMLElement | string>('body')

  const calculatePlacement = () => {
    if (!triggerRef.value || typeof window === 'undefined') return

    const rect = triggerRef.value.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const maxH = options.maxHeight ?? 250
    const offset = options.offset ?? 4

    let placement = options.preferredPlacement

    if (!placement) {
      if (spaceBelow < maxH && spaceAbove > spaceBelow) {
        placement = 'top'
      }
      else {
        placement = 'bottom'
      }
    }

    dynamicPlacement.value = placement

    if (placement === 'top') {
      dropdownStyle.value = {
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + offset}px`,
        left: `${rect.left}px`,
        minWidth: `${rect.width}px`,
      }
    }
    else {
      dropdownStyle.value = {
        position: 'fixed',
        top: `${rect.bottom + offset}px`,
        left: `${rect.left}px`,
        minWidth: `${rect.width}px`,
      }
    }
  }

  const handleGlobalScroll = (e: Event) => {
    if (!isOpen.value) return
    if (dropdownRef.value && dropdownRef.value.contains(e.target as Node)) return
    isOpen.value = false
  }

  watch(isOpen, (newVal) => {
    if (typeof window === 'undefined') return

    if (newVal) {
      window.addEventListener('scroll', handleGlobalScroll, {
        capture: true,
        passive: true,
      })
      calculatePlacement()
    }
    else {
      window.removeEventListener('scroll', handleGlobalScroll, {
        capture: true,
      })
    }
  })

  onMounted(() => {
    if (typeof window === 'undefined') return

    const modal = triggerRef.value?.closest('dialog')

    if (modal) {
      teleportTarget.value = modal as HTMLElement
    }
    window.addEventListener('resize', calculatePlacement, { passive: true })
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return

    window.removeEventListener('scroll', handleGlobalScroll, { capture: true })
    window.removeEventListener('resize', calculatePlacement)
  })

  return {
    dynamicPlacement,
    dropdownStyle,
    teleportTarget,
    calculatePlacement,
  }
}
