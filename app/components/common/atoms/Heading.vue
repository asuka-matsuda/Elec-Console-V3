<script setup lang="ts">
/**
 * Heading
 * [Atoms] セマンティクス（タグ）とビジュアル（サイズ）を制御する見出しコンポーネント。
 */
import { computed } from 'vue'

import type { HeadingProps, HeadingSize } from '~/types/components'

const props = withDefaults(defineProps<HeadingProps>(), {
  level: 2,
})

const effectiveLevel = computed(() => props.tag ?? props.level)

const normalizedLevel = computed(() => {
  const str = String(effectiveLevel.value)

  return str.startsWith('h') ? str.slice(1) : str
})

const tag = computed(() => `h${normalizedLevel.value}`)

const DEFAULT_SIZES: Record<string, HeadingSize> = {
  1: '3xl',
  2: '2xl',
  3: 'xl',
  4: 'lg',
  5: 'base',
  6: 'base',
}

const computedSize = computed(() => props.size || DEFAULT_SIZES[normalizedLevel.value] || 'base')
</script>

<template>
  <component
    :is="tag"
    class="app-heading"
    :class="`is-${computedSize}`"
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
