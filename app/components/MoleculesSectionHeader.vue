<script setup lang="ts">
/**
 * MoleculesSectionHeader
 * [Molecules] セクションのタイトル、アイコン、アクションボタン、および区切り線を表示するヘッダーコンポーネント。
 */
import { computed } from 'vue'

import type { MenuSection } from '~/constants/data/menuData'

const props = withDefaults(
  defineProps<{
    title?: string
    tag?: string
    icon?: string
    variant?:
      | MenuSection['accent']
      | 'danger'
      | 'success'
      | 'border'
      | 'hud'
      | 'simple'
    size?: 'xs' | 'sm' | 'md' | 'lg'
    dividerType?: 'default' | 'fade-side' | 'fade-center'
  }>(),
  {
    tag: 'h2',
    variant: 'main',
    size: 'lg',
    dividerType: 'default',
  },
)

const dividerColorMap: Record<string, string> = {
  main: 'var(--theme-accent)',
  tool: 'var(--color-category-tool)',
  database: 'var(--color-category-database)',
  reference: 'var(--color-category-reference)',
  management: 'var(--color-category-management)',
  border: 'var(--color-border)',
  danger: 'var(--color-danger, #ef4444)',
  success: 'var(--color-success, #22c55e)',
}

const resolvedDividerColor = computed(() => {
  if (props.variant === 'hud' || props.variant === 'simple') return 'var(--color-border)'

  return dividerColorMap[props.variant] || 'var(--theme-accent)'
})
</script>

<template>
  <header class="flex flex-wrap items-center justify-between gap-y-1 gap-x-2 section-header">
    <component
      :is="tag || 'h2'"
      class="flex items-center gap-2 title"
      :class="[`is-${size}`]"
    >
      <AtomsIcon v-if="icon" :name="icon" class="icon" />
      <slot>{{ title }}</slot>
    </component>

    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>

    <AtomsDivider
      :color="resolvedDividerColor"
      :type="dividerType === 'default' ? 'solid' : dividerType"
    />
  </header>
</template>

<style scoped lang="scss">
.section-header {
  .title {
    color: var(--color-text-main);

    &.is-lg,
    &.is-md {
      font-size: var(--font-size-lg);
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
    color: var(--theme-accent);
  }
}
</style>
