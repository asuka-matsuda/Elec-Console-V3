<script setup lang="ts">
/**
 * Tooltip (Geist準拠)
 * ホバー・フォーカス・タップで補足説明（Why / 制約 / スコープ）を浮遊表示するツールチップ。
 * - Vercel Geist 仕様: デフォルト 150ms 遅延によるチラつき防止、Escapeキーによる即時クローズ
 * - 直角規約: border-radius: 0 のサイバーサーフェス描画
 * - Teleport により親の overflow: hidden によるクリッピングを完全回避
 * - タッチ端末でのタップ表示・画面外タップ検知に対応
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useSlots } from 'vue'

import type { TooltipPlacement, TooltipProps } from '~/types/components'

const {
  text,
  content,
  placement = 'top',
  type = 'default',
  delay = 150,
  enterDelay,
  leaveDelay = 0,
  hideArrow = false,
  desktopOnly = false,
  disabled = false,
} = defineProps<TooltipProps>()

const slots = useSlots()

const isVisible = ref(false)
const isMounted = ref(false)
const isTouchDevice = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)

let enterTimer: ReturnType<typeof setTimeout> | null = null
let leaveTimer: ReturnType<typeof setTimeout> | null = null

const actualPlacement = ref<TooltipPlacement>(placement)
const coords = ref({ top: 0, left: 0 })

const displayText = computed(() => text || content || '')
const hasContent = computed(() => Boolean(displayText.value || slots.content))

const effectiveEnterDelay = computed(() => (enterDelay !== undefined ? enterDelay : delay))

const clearTimers = () => {
  if (enterTimer) {
    clearTimeout(enterTimer)
    enterTimer = null
  }
  if (leaveTimer) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
}

const updatePosition = () => {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const offset = 8
  const estimatedBubbleHeight = 36
  const estimatedBubbleWidth = 100

  // 基準方向とアライメントの分解
  const parts = placement.split('-')
  const baseSide = parts[0] as 'top' | 'bottom' | 'left' | 'right'
  const align = parts[1] as 'start' | 'end' | undefined

  let targetSide = baseSide

  // 画面端の衝突検知（自動反転）
  if (targetSide === 'top' && rect.top - estimatedBubbleHeight - offset < 0) {
    targetSide = 'bottom'
  }
  else if (targetSide === 'bottom' && rect.bottom + estimatedBubbleHeight + offset > window.innerHeight) {
    targetSide = 'top'
  }
  else if (targetSide === 'left' && rect.left - estimatedBubbleWidth - offset < 0) {
    targetSide = 'right'
  }
  else if (targetSide === 'right' && rect.right + estimatedBubbleWidth + offset > window.innerWidth) {
    targetSide = 'left'
  }

  const resolvedPlacement = (align ? `${targetSide}-${align}` : targetSide) as TooltipPlacement

  actualPlacement.value = resolvedPlacement

  let top = 0
  let left = 0

  if (targetSide === 'top') {
    top = rect.top - offset
    if (align === 'start') left = rect.left
    else if (align === 'end') left = rect.right
    else left = rect.left + rect.width / 2
  }
  else if (targetSide === 'bottom') {
    top = rect.bottom + offset
    if (align === 'start') left = rect.left
    else if (align === 'end') left = rect.right
    else left = rect.left + rect.width / 2
  }
  else if (targetSide === 'left') {
    left = rect.left - offset
    if (align === 'start') top = rect.top
    else if (align === 'end') top = rect.bottom
    else top = rect.top + rect.height / 2
  }
  else if (targetSide === 'right') {
    left = rect.right + offset
    if (align === 'start') top = rect.top
    else if (align === 'end') top = rect.bottom
    else top = rect.top + rect.height / 2
  }

  coords.value = { top, left }

  // 描画後に実際のサイズでクランプ微調整（画面外へのはみ出しを防止）
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
  if (disabled || !hasContent.value) return
  if (desktopOnly && isTouchDevice.value) return

  clearTimers()

  const wait = effectiveEnterDelay.value

  if (wait <= 0) {
    updatePosition()
    isVisible.value = true
  }
  else {
    enterTimer = setTimeout(() => {
      updatePosition()
      isVisible.value = true
    }, wait)
  }
}

const hide = () => {
  clearTimers()

  if (leaveDelay <= 0) {
    isVisible.value = false
  }
  else {
    leaveTimer = setTimeout(() => {
      isVisible.value = false
    }, leaveDelay)
  }
}

const closeImmediate = () => {
  clearTimers()
  isVisible.value = false
}

const toggle = () => {
  if (isVisible.value) {
    closeImmediate()
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
    closeImmediate()
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isVisible.value) {
    closeImmediate()
  }
}

const handleScrollOrResize = () => {
  if (isVisible.value) {
    updatePosition()
  }
}

onMounted(() => {
  isMounted.value = true
  isTouchDevice.value = window.matchMedia('(pointer: coarse)').matches

  document.addEventListener('click', handleDocumentClick, true)
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('scroll', handleScrollOrResize, true)
  window.addEventListener('resize', handleScrollOrResize)
})

onBeforeUnmount(() => {
  clearTimers()
  document.removeEventListener('click', handleDocumentClick, true)
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('scroll', handleScrollOrResize, true)
  window.removeEventListener('resize', handleScrollOrResize)
})

const tooltipStyle = computed(() => {
  const parts = actualPlacement.value.split('-')
  const baseSide = parts[0]
  const align = parts[1]

  let translateX = '-50%'
  let translateY = '-50%'

  if (baseSide === 'top') {
    translateY = '-100%'
    if (align === 'start') translateX = '0%'
    else if (align === 'end') translateX = '-100%'
    else translateX = '-50%'
  }
  else if (baseSide === 'bottom') {
    translateY = '0%'
    if (align === 'start') translateX = '0%'
    else if (align === 'end') translateX = '-100%'
    else translateX = '-50%'
  }
  else if (baseSide === 'left') {
    translateX = '-100%'
    if (align === 'start') translateY = '0%'
    else if (align === 'end') translateY = '-100%'
    else translateY = '-50%'
  }
  else if (baseSide === 'right') {
    translateX = '0%'
    if (align === 'start') translateY = '0%'
    else if (align === 'end') translateY = '-100%'
    else translateY = '-50%'
  }

  return {
    top: `${coords.value.top}px`,
    left: `${coords.value.left}px`,
    transform: `translate(${translateX}, ${translateY})`,
    zIndex: 'var(--z-index-tooltip, 1070)',
  }
})
</script>

<template>
  <span ref="triggerRef" class="tooltip-wrapper" @mouseenter="show" @mouseleave="hide" @focusin="show" @focusout="hide" @click="toggle">
    <slot />

    <Teleport v-if="isMounted && !disabled && hasContent" to="body">
      <Transition name="tooltip">
        <span v-if="isVisible" ref="tooltipRef" class="tooltip-bubble" :class="[`is-${actualPlacement}`, `is-type-${type}`, { 'has-arrow': !hideArrow }]" :style="tooltipStyle">
          <slot name="content">{{ displayText }}</slot>
        </span>
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
  user-select: none;

  position: fixed;

  width: max-content;
  max-width: 280px;
  padding: 0.35em 0.65em;
  border-radius: 0;

  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-tight);
  letter-spacing: 0.01em;
  overflow-wrap: break-word;
  white-space: pre-wrap;

  transition: opacity var(--duration-fast, 150ms) var(--ease-base, ease-out);

  // Geist デフォルト: 深いサイバーブラックサーフェス + 白テキスト
  &.is-type-default {
    border: var(--border-width-base, 1px) solid var(--color-border);
    color: var(--color-text-main);
    background-color: var(--surface-bg-solid);
    box-shadow: var(--shadow-elevation-md);
  }

  &.is-type-invert {
    border: var(--border-width-base, 1px) solid var(--color-border);
    color: var(--surface-bg-solid);
    background-color: var(--color-text-main);
    box-shadow: var(--shadow-elevation-md);
  }

  &.is-type-secondary {
    border: var(--border-width-base, 1px) solid var(--color-border-subtle);
    color: var(--color-text-secondary);
    background-color: var(--surface-bg-elevated);
    box-shadow: var(--shadow-elevation-md);
  }

  &.is-type-warning {
    border: var(--border-width-base, 1px) solid var(--color-status-warning);
    color: var(--color-text-on-emphasis);
    background-color: color-mix(in srgb, var(--color-status-warning) 25%, var(--surface-bg-solid));
    box-shadow: var(--shadow-elevation-md);
  }

  &.is-type-error {
    border: var(--border-width-base, 1px) solid var(--color-status-danger);
    color: var(--color-text-on-emphasis);
    background-color: color-mix(in srgb, var(--color-status-danger) 25%, var(--surface-bg-solid));
    box-shadow: var(--shadow-elevation-md);
  }

  &.is-type-success {
    border: var(--border-width-base, 1px) solid var(--color-status-success);
    color: var(--color-text-on-emphasis);
    background-color: color-mix(in srgb, var(--color-status-success) 25%, var(--surface-bg-solid));
    box-shadow: var(--shadow-elevation-md);
  }
}

.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity var(--duration-fast, 150ms) var(--ease-base, ease-out);
}

.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
