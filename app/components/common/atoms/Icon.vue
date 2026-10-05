<script setup lang="ts">
/**
 * Icon
 * アイコン表示コンポーネント。
 */
import { computed } from 'vue'

import { ICONS } from '~/constants/icons'
import type { IconProps } from '~/types/components'

const {
  name,
  size,
  variant,
  spin = false,
} = defineProps<IconProps>()

const iconComponent = computed(() => {
  const component = ICONS[name]

  if (!component && import.meta.dev) {
    console.warn(`[Icon] Icon "${name}" is not registered in ~/constants/icons.ts`)
  }

  return component || null
})
</script>

<template>
  <component :is="iconComponent" v-if="iconComponent" class="inline-block shrink-0 align-middle app-icon" :class="[size && `is-${size}`, variant && `is-${variant}`, { 'u-spin': spin }]" />
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

  &.is-primary {
    color: var(--theme-accent, var(--color-category-main));
  }

  &.is-secondary {
    color: var(--color-text-secondary);
  }

  &.is-accent {
    color: var(--theme-accent, var(--color-accent-main));
  }

  &.is-success {
    color: var(--color-status-success);
  }

  &.is-warning {
    color: var(--color-status-warning);
  }

  &.is-danger {
    color: var(--color-status-danger);
  }

  &.is-muted {
    color: var(--color-text-muted);
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
