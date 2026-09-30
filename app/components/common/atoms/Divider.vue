<script setup lang="ts">
/**
 * Divider
 * コンテンツの区切り線（水平・垂直）。
 */
import { computed } from 'vue'

import type { DividerProps } from '~/types/components'

const props = withDefaults(defineProps<DividerProps>(), {
  type: 'fade-side',
  orientation: 'horizontal',
})

const effectiveType = computed(() =>
  props.orientation === 'vertical' ? 'solid' : props.type,
)
</script>

<template>
  <hr
    class="divider shrink-0"
    :class="[
      orientation === 'horizontal'
        ? 'w-full h-px'
        : 'w-px h-full min-h-[1em] self-stretch',
      `is-${effectiveType}`,
      `is-${orientation}`,
    ]"
    :style="color ? { '--divider-custom-color': color } : undefined"
  >
</template>

<style scoped lang="scss">
.divider {
  --divider-accent: var(--divider-custom-color, var(--theme-accent));

  border: none;

  &.is-fade-side {
    background: linear-gradient(
      to right,
      var(--divider-accent) 0%,
      color-mix(in srgb, var(--divider-accent) 35%, transparent) 40%,
      transparent 100%
    );
  }

  &.is-fade-center {
    background: linear-gradient(
      to right,
      transparent 0%,
      var(--divider-accent) 50%,
      transparent 100%
    );
  }

  &.is-solid {
    background-color: var(--divider-custom-color, var(--color-border));
  }
}
</style>
