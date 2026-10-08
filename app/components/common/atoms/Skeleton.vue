<script setup lang="ts">
/**
 * Skeleton
 * Geist デザインシステム準拠のスケルトンローディングコンポーネント。
 * 非同期データ読み込み中のレイアウト崩れ（CLS）を防ぐプレースホルダーを提供します。
 * 単体表示（width/height指定）に加え、子要素をラップして自動寸法でシマー表示することも可能です。
 */
import { computed, useSlots } from 'vue'

import type { SkeletonProps } from '~/types/components'

const {
  width,
  height,
  boxHeight,
  circle = false,
  pill = false,
  squared = false,
  show = true,
  animated = true,
  button = false,
  as = 'span',
} = defineProps<SkeletonProps>()

const slots = useSlots()
const hasChildren = computed(() => Boolean(slots.default))

const isCircle = computed(() => !squared && (circle || pill))

const toCssSize = (val?: number | string) => {
  if (val === undefined || val === null || val === '') return undefined

  return typeof val === 'number' ? `${val}px` : val
}

const styleObject = computed(() => {
  const styles: Record<string, string> = {}

  const w = toCssSize(width)
  const h = toCssSize(height)
  const bh = toCssSize(boxHeight)

  if (w) styles.width = w
  if (h) styles.height = h
  if (bh) styles.minHeight = bh

  if (!hasChildren.value && !h && !isCircle.value) {
    styles.height = '1.2em'
  }

  if (isCircle.value) {
    const size = w || h || '2.5rem'

    styles.width = size
    styles.height = size
    styles.borderRadius = 'var(--radius-circle)'
  }

  return styles
})
</script>

<template>
  <component :is="as" v-if="hasChildren" class="skeleton skeleton--wrapper relative overflow-hidden" :class="[{ 'is-loading': show, 'is-circle': isCircle, 'is-animated': animated, 'is-button': button }]" :style="styleObject">
    <div class="skeleton-content inline-flex" :class="{ 'is-hidden': show }">
      <slot />
    </div>
    <span v-if="show" class="skeleton-overlay absolute inset-0" />
  </component>
  <component :is="as" v-else-if="show" class="skeleton skeleton--standalone" :class="[{ 'is-circle': isCircle, 'is-animated': animated, 'is-button': button }]" :style="styleObject" />
</template>

<style scoped lang="scss">
.skeleton {
  position: relative;
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;

  &--standalone {
    border: var(--border-width-base) solid var(--color-border);
    border-radius: 0;
    background-color: var(--surface-bg-elevated);

    &.is-animated::after {
      pointer-events: none;
      will-change: transform;
      content: '';

      position: absolute;
      inset: 0;
      transform: translateX(-100%);

      background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in srgb, var(--color-overlay) 28%, transparent) 50%,
        transparent 100%
      );

      animation: skeleton-shimmer-gpu 1.2s ease-in-out infinite;
    }
  }

  &--wrapper {
    display: inline-flex;

    &.is-loading {
      border: var(--border-width-base) solid var(--color-border);
    }

    .skeleton-content {
      &.is-hidden {
        pointer-events: none;
        user-select: none;
        visibility: hidden;
      }
    }

    .skeleton-overlay {
      pointer-events: none;

      position: absolute;
      inset: 0;

      overflow: hidden;

      border-radius: 0;

      background-color: var(--surface-bg-elevated);
    }

    &.is-animated .skeleton-overlay::after {
      pointer-events: none;
      will-change: transform;
      content: '';

      position: absolute;
      inset: 0;
      transform: translateX(-100%);

      background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in srgb, var(--color-overlay) 28%, transparent) 50%,
        transparent 100%
      );

      animation: skeleton-shimmer-gpu 1.2s ease-in-out infinite;
    }
  }

  &.is-circle {
    border-radius: var(--radius-circle);

    .skeleton-overlay,
    &--standalone::after,
    .skeleton-overlay::after {
      border-radius: var(--radius-circle);
    }
  }

  &.is-button {
    margin: -1px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton--standalone::after,
  .skeleton-overlay::after {
    display: none;
    animation: none;
  }
}

@keyframes skeleton-shimmer-gpu {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
}
</style>
