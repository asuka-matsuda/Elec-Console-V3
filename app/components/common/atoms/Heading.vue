<script setup lang="ts">
/**
 * Heading
 * 見出しコンポーネント。
 */
import { computed } from 'vue'

import type { HeadingProps, HeadingSize } from '~/types/components'

const {
  level = 2,
  tag: tagProp,
  size,
} = defineProps<HeadingProps>()

const DEFAULT_SIZES: Record<string, HeadingSize> = {
  h1: '3xl',
  h2: '2xl',
  h3: 'xl',
  h4: 'lg',
  h5: 'base',
  h6: 'base',
}

const resolvedTag = computed(() => {
  const target = tagProp ?? level
  const raw = String(target).toLowerCase()

  if (/^[1-6]$/.test(raw)) {
    return `h${raw}`
  }

  return raw
})

const resolvedSize = computed(() => size || DEFAULT_SIZES[resolvedTag.value] || 'base')
</script>

<template>
  <component
    :is="resolvedTag"
    class="app-heading"
    :class="`is-${resolvedSize}`"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.app-heading {
  margin: 0;
  padding: 0;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);

  &.is-3xl {
    font-size: var(--font-size-3xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--tracking-tight);
  }

  &.is-2xl {
    font-size: var(--font-size-2xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--tracking-tight);
  }

  &.is-xl {
    font-size: var(--font-size-xl);
    line-height: var(--line-height-tight);
    letter-spacing: var(--tracking-normal);
  }

  &.is-lg {
    font-size: var(--font-size-lg);
    line-height: var(--line-height-ui);
    letter-spacing: var(--tracking-wide);
  }

  &.is-base {
    font-size: var(--font-size-base);
    line-height: var(--line-height-ui);
    letter-spacing: var(--tracking-wide);
  }
}
</style>
