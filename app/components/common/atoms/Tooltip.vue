<script setup lang="ts">
/**
 * Tooltip
 * ホバー・フォーカス・タップで補足説明を即座に浮遊表示するツールチップコンポーネント。
 * - ルート要素をインラインな span で構成し、buttonネストやブロック要素混入などのDOM仕様違反を完全に防止
 * - Teleport により親の overflow: hidden（テーブルセルやパネル等）によるクリッピングを回避
 * - タッチ端末（iPad等）でのタップ表示・画面外タップ検知に対応
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import type { TooltipProps } from '~/types/components'

const {
  text,
  placement = 'top',
  disabled = false,
} = defineProps<TooltipProps>()

const isVisible = ref(false)
const isMounted = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)

const actualPlacement = ref(placement)
const coords = ref({ top: 0, left: 0 })

const updatePosition = () => {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const offset = 8
  const estimatedBubbleHeight = 36
  const estimatedBubbleWidth = 80

  // 画面端の衝突検知（自動反転）
  let targetPlacement = placement

  if (targetPlacement === 'top' && rect.top - estimatedBubbleHeight - offset < 0) {
    targetPlacement = 'bottom'
  }
  else if (targetPlacement === 'bottom' && rect.bottom + estimatedBubbleHeight + offset > window.innerHeight) {
    targetPlacement = 'top'
  }
  else if (targetPlacement === 'left' && rect.left - estimatedBubbleWidth - offset < 0) {
    targetPlacement = 'right'
  }
  else if (targetPlacement === 'right' && rect.right + estimatedBubbleWidth + offset > window.innerWidth) {
    targetPlacement = 'left'
  }

  actualPlacement.value = targetPlacement

  let top = 0
  let left = 0

  if (targetPlacement === 'top') {
    top = rect.top - offset
    left = rect.left + rect.width / 2
  }
  else if (targetPlacement === 'bottom') {
    top = rect.bottom + offset
    left = rect.left + rect.width / 2
  }
  else if (targetPlacement === 'left') {
    top = rect.top + rect.height / 2
    left = rect.left - offset
  }
  else if (targetPlacement === 'right') {
    top = rect.top + rect.height / 2
    left = rect.right + offset
  }

  coords.value = { top, left }

  // 描画後に実際のサイズでクランプ微調整（画面外へのはみ出しを完全防止）
  void nextTick(() => {
    if (!tooltipRef.value) return
    const bubbleRect = tooltipRef.value.getBoundingClientRect()
    const padding = 8

    if (bubbleRect.left < padding) {
      coords.value.left += (padding - bubbleRect.left)
    }
    else if (bubbleRect.right > window.innerWidth - padding) {
      coords.value.left -= (bubbleRect.right - (window.innerWidth - padding))
    }

    if (bubbleRect.top < padding) {
      coords.value.top += (padding - bubbleRect.top)
    }
    else if (bubbleRect.bottom > window.innerHeight - padding) {
      coords.value.top -= (bubbleRect.bottom - (window.innerHeight - padding))
    }
  })
}

const show = () => {
  if (disabled || !text) return
  updatePosition()
  isVisible.value = true
}

const hide = () => {
  isVisible.value = false
}

const toggle = () => {
  if (isVisible.value) {
    hide()
  }
  else {
    show()
  }
}

const handleDocumentClick = (e: MouseEvent) => {
  if (!isVisible.value) return
  const target = e.target as Node | null

  if (
    triggerRef.value
    && !triggerRef.value.contains(target)
    && tooltipRef.value
    && !tooltipRef.value.contains(target)
  ) {
    hide()
  }
}

const handleScrollOrResize = () => {
  if (isVisible.value) {
    updatePosition()
  }
}

onMounted(() => {
  isMounted.value = true
  document.addEventListener('click', handleDocumentClick, true)
  window.addEventListener('scroll', handleScrollOrResize, true)
  window.addEventListener('resize', handleScrollOrResize)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick, true)
  window.removeEventListener('scroll', handleScrollOrResize, true)
  window.removeEventListener('resize', handleScrollOrResize)
})

const tooltipStyle = computed(() => {
  let transform = 'translate(-50%, -100%)'

  if (actualPlacement.value === 'bottom') {
    transform = 'translate(-50%, 0)'
  }
  else if (actualPlacement.value === 'left') {
    transform = 'translate(-100%, -50%)'
  }
  else if (actualPlacement.value === 'right') {
    transform = 'translate(0, -50%)'
  }

  return {
    top: `${coords.value.top}px`,
    left: `${coords.value.left}px`,
    transform,
    zIndex: 'var(--z-index-tooltip, 1070)',
  }
})
</script>

<template>
  <span ref="triggerRef" class="tooltip-wrapper" @mouseenter="show" @mouseleave="hide" @focusin="show" @focusout="hide" @click="toggle">
    <slot />

    <Teleport v-if="isMounted && !disabled && text" to="body">
      <Transition name="tooltip">
        <span v-if="isVisible" ref="tooltipRef" class="tooltip-bubble" :class="`is-${actualPlacement}`" :style="tooltipStyle">{{ text }}</span>
      </Transition>
    </Teleport>
  </span>
</template>

<style scoped lang="scss">
.tooltip-wrapper {
  cursor: inherit;
  display: inline-flex;
  vertical-align: middle;
}

.tooltip-bubble {
  pointer-events: none;

  position: fixed;

  width: max-content;
  max-width: 280px;
  padding: var(--space-1) var(--space-2);
  border: var(--border-width-base) solid var(--theme-accent, var(--color-border));

  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
  word-break: break-all;
  white-space: pre-wrap;

  background-color: var(--surface-bg-solid);
  backdrop-filter: blur(var(--blur-md));
  box-shadow: var(--shadow-elevation-md),
              0 0 10px color-mix(in srgb, var(--theme-accent, var(--color-border)) 25%, transparent);
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity var(--duration-fast) var(--ease-base);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
