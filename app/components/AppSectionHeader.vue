<script setup lang="ts">
/**
 * AppSectionHeader
 * セクションのタイトル、アイコン、アクションボタン、および区切り線を表示するヘッダーコンポーネント。
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

const resolvedDividerVariant = computed(() => {
  if (props.variant === 'hud' || props.variant === 'simple') return 'border'

  return props.variant || 'main'
})
</script>

<template>
  <header class="section-header">
    <div class="top-row">
      <component
        :is="tag"
        class="title"
        :class="[`is-${size}`]"
      >
        <AppIcon v-if="icon" :name="icon" class="icon" />
        <slot>{{ title }}</slot>
      </component>
      <div v-if="$slots.actions" class="actions">
        <slot name="actions" />
      </div>
    </div>

    <AppDivider
      :variant="resolvedDividerVariant"
      :type="dividerType === 'default' ? 'solid' : dividerType"
    />
  </header>
</template>

<style scoped lang="scss">
.section-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  .top-row {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
    justify-content: space-between;
  }

  .actions {
    display: flex;
    gap: var(--space-2);
    align-items: center;
  }

  .title {
    display: flex;
    gap: var(--space-2);
    align-items: center;
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
