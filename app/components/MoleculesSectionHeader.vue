<script setup lang="ts">
/**
 * MoleculesSectionHeader
 * [Molecules] セクションのタイトル、アイコン、アクションボタン、および区切り線を表示するヘッダーコンポーネント。
 */
import { computed } from 'vue'

import type { IconName } from '~/constants/icons'

const props = withDefaults(
  defineProps<{
    title?: string
    tag?: string
    icon?: IconName
    variant?: 'main' | 'border' | 'hud'
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    tag: 'h2',
    variant: 'main',
    size: 'lg',
  },
)

const resolvedDividerColor = computed(() => {
  if (props.variant === 'border' || props.variant === 'hud') {
    return 'var(--color-border)'
  }

  return 'var(--theme-accent)'
})

const isDividerAnimated = computed(() => {
  return props.variant !== 'border' && props.variant !== 'hud'
})

const resolvedIconColor = computed(() => {
  return 'var(--theme-accent)'
})
</script>

<template>
  <header
    class="flex flex-wrap items-center justify-between gap-y-1 gap-x-2 section-header"
    :style="{ '--section-icon-color': resolvedIconColor }"
  >
    <component
      :is="tag || 'h2'"
      class="flex items-center gap-2 title"
      :class="[`is-${size}`]"
    >
      <Icon v-if="icon" :name="icon" class="icon" />
      <slot>{{ title }}</slot>
    </component>

    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>

    <Divider
      :color="resolvedDividerColor"
      :animated="isDividerAnimated"
    />
  </header>
</template>

<style scoped lang="scss">
.section-header {
  .title {
    color: var(--color-text-main);

    &.is-xl {
      font-size: var(--font-size-xl);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
    }

    &.is-lg {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
    }

    &.is-md {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
    }

    &.is-sm {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
    }

    &.is-xs {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
    }
  }

  .icon {
    color: var(--section-icon-color);
  }
}
</style>
