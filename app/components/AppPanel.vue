<script setup lang="ts">
/**
 * AppPanel
 * ヘッダーや枠線（サイバー風のブラケットなど）を持ち、コンテンツを囲むパネルコンポーネント。
 */
withDefaults(
  defineProps<{
    title?: string
    variant?: 'hud' | 'simple' | 'gradient' | 'hybrid'
    density?: 'normal' | 'compact'
  }>(),
  {
    variant: 'hud',
    density: 'normal',
  },
)
</script>

<template>
  <section
    class="c-panel"
    :class="[
      `c-panel--${variant}`,
      `c-panel--density-${density}`,
    ]"
  >
    <header
      v-if="title || $slots.header"
      class="c-panel__header"
    >
      <slot name="header">
        <h2 class="c-panel__title">
          {{ title }}
        </h2>
      </slot>
    </header>

    <div class="c-panel__content">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.c-panel {
  --p-border-color: var(--color-border);
  --p-box-shadow: none;
  --p-theme-color: var(--theme-accent);

  @include flex-start-stretch($direction: column);

  position: relative;
  gap: var(--space-card-gap);
  padding: var(--space-card-pad);

  // Apply visual base
  @include border-base(var(--p-border-color), $width: var(--border-width-base));
  @include state-base(var(--p-box-shadow));

  // 密度モディファイア
  &--density-compact {
    @include flex-start-stretch($direction: column);

    gap: var(--space-2);
    padding: var(--space-3);

    .c-panel__content {
      @include flex-start-stretch($direction: column);

      gap: var(--space-2);
    }
  }

  /* Header & Title */

  &__title {
    @include text-title("md");

    color: color-mix(in srgb, var(--p-theme-color) 100%, transparent);
    text-shadow: 0 0 var(--blur-md) color-mix(in srgb, var(--p-theme-color) 40%, transparent);
  }

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

  &--hud {
    --p-border-color: color-mix(in srgb, var(--color-border) 50%, transparent);
    --p-box-shadow:
      inset 0 0 0 1px var(--color-main-bg), inset 0 0 0 2px var(--color-border),
      var(--shadow-elevation-sm);
  }

  &--simple {
    --p-border-color: color-mix(in srgb, var(--color-border) 50%, transparent);
    --p-box-shadow:
      inset 1px 1px 2px var(--color-border), inset -1px -1px 2px transparent,
      var(--shadow-elevation-sm);
  }

  &--gradient {
    --p-border-color: color-mix(in srgb, var(--p-theme-color) 40%, transparent);
    --p-box-shadow:
      inset 1px 1px 2px var(--color-border), inset -1px -1px 2px transparent,
      var(--shadow-elevation-sm);
  }

  &--hybrid {
    --p-border-color: color-mix(in srgb, var(--p-theme-color) 80%, transparent);
    --p-box-shadow:
      inset 0 0 0 1px var(--color-main-bg), inset 0 0 0 2px var(--color-border),
      var(--shadow-elevation-sm);
  }
}
</style>
