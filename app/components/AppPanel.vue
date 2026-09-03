<script setup lang="ts">
/**
 * AppPanel
 * ヘッダーや枠線（サイバー風のブラケットなど）を持ち、コンテンツを囲むパネルコンポーネント。
 */
defineProps<{
  title?: string
  icon?: string
  variant?:
    | 'main'
    | 'tool'
    | 'database'
    | 'reference'
    | 'management'
    | 'danger'
    | 'success'
}>()
</script>

<template>
  <section class="c-panel" :class="variant ? `c-panel--color-${variant}` : ''">
    <header v-if="title || $slots.header" class="c-panel__header">
      <slot name="header">
        <AppSectionHeader :title="title" :icon="icon" size="md" />
      </slot>
    </header>

    <div class="c-panel__content">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.c-panel {
  --p-theme-color: var(--theme-accent);

  @include flex-start-stretch($direction: column);

  position: relative;
  gap: var(--space-card-gap);
  padding: var(--space-card-pad);

  @include border-base($color: var(--color-border), $opacity: 50%);
  @include state-base("sm");

  &__content {
    @include flex-start-stretch($direction: column);

    flex: 1;
    gap: var(--space-card-gap);
    min-height: 0;
  }

  &--color-main {
    --p-theme-color: var(--theme-accent);
  }

  &--color-tool {
    --p-theme-color: var(--color-category-tool);
  }

  &--color-database {
    --p-theme-color: var(--color-category-database);
  }

  &--color-reference {
    --p-theme-color: var(--color-category-reference);
  }

  &--color-management {
    --p-theme-color: var(--color-category-management);
  }

  &--color-danger {
    --p-theme-color: var(--color-status-danger);
  }

  &--color-success {
    --p-theme-color: var(--color-status-success);
  }
}
</style>
