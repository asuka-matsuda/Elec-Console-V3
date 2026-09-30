<script setup lang="ts">
/**
 * Icon
 * アイコン表示コンポーネント。
 */
import { computed } from 'vue'

import { ICONS } from '~/constants/icons'
import type { IconProps } from '~/types/components'

const props = withDefaults(defineProps<IconProps>(), {
  spin: false,
})

const iconComponent = computed(() => {
  const component = ICONS[props.name]

  if (!component && import.meta.dev) {
    console.warn(`[Icon] Icon "${props.name}" is not registered in ~/constants/icons.ts`)
  }

  return component || null
})
</script>

<template>
  <component
    :is="iconComponent"
    v-if="iconComponent"
    class="inline-block shrink-0 align-middle app-icon"
    :class="[
      props.size && `is-${props.size}`,
      { 'u-spin': props.spin },
    ]"
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

  &.u-spin {
    animation: icon-spin 1s linear infinite;
  }
}

@keyframes icon-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
