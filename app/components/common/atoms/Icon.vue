<script setup lang="ts">
/**
 * Icon
 * [Atoms] @lucide/vue をベースにしたモダンなアイコンコンポーネントです。
 * v-html を使用せず、Vue のコンポーネントとして最適化された SVG を描画します。
 */
import { computed } from 'vue'

import { ICONS } from '~/constants/icons'
import type { IconProps } from '~/types/components'

const props = withDefaults(defineProps<IconProps>(), {
  size: undefined,
  strokeWidth: 2,
  spin: false,
})

const iconComponent = computed(() => {
  return ICONS[props.name] || null
})
</script>

<template>
  <component
    :is="iconComponent"
    v-if="iconComponent"
    class="inline-block shrink-0 align-middle app-icon icon"
    :class="[
      props.size && `is-${props.size}`,
      { 'u-spin': props.spin },
    ]"
    :stroke-width="props.strokeWidth"
  />
</template>

<style scoped lang="scss">
.app-icon {
  width: 1.2em;
  height: 1.2em;

  &.is-sm {
    width: var(--icon-size-sm);
    height: var(--icon-size-sm);
  }

  &.is-md {
    width: var(--icon-size-md);
    height: var(--icon-size-md);
  }

  &.is-lg {
    width: var(--icon-size-lg);
    height: var(--icon-size-lg);
  }

  &.is-xl {
    width: var(--icon-size-xl);
    height: var(--icon-size-xl);
  }

  &.is-xxl {
    width: var(--icon-size-xxl);
    height: var(--icon-size-xxl);
  }
}
</style>
