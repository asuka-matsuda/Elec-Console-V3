<script setup lang="ts">
/**
 * AppPanel
 * ヘッダーや枠線（サイバー風のブラケットなど）を持ち、コンテンツを囲むパネルコンポーネント。
 */
withDefaults(
  defineProps<{
    title?: string;
    bracketColor?:
      | "main"
      | "tool"
      | "database"
      | "reference"
      | "management"
      | "danger"
      | "success";
    variant?: "hud" | "simple" | "gradient" | "hybrid";
    density?: "normal" | "compact";
  }>(),
  {
    bracketColor: "main",
    variant: "hud",
    density: "normal",
  },
);
</script>

<template>
  <section
    class="c-panel"
    :class="[
      `c-panel--${variant}`,
      `c-panel--color-${bracketColor}`,
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
  --p-border-image: none;
  --p-box-shadow: none;
  --p-bracket-display: none;
  --p-bracket-size: var(--space-4);
  --p-bracket-color: var(--color-border);
  --p-bracket-glow: none;
  --p-theme-color: var(--color-category-main);

  position: relative;
  padding: var(--space-card-pad);
  border-image: var(--p-border-image);

  // Cyber Brackets (Top-Left & Bottom-Right)

  &::before,
  &::after {
    pointer-events: none;
    content: "";

    position: absolute;

    display: var(--p-bracket-display);

    width: var(--p-bracket-size);
    height: var(--p-bracket-size);

    @include border-base(var(--p-bracket-color), var(--border-width-thick));

    filter: var(--p-bracket-glow);
  }

  &::before {
    top: -1px;
    left: -1px;
    border-right: none;
    border-bottom: none;
  }

  &::after {
    right: -1px;
    bottom: -1px;
    border-top: none;
    border-left: none;
  }

  // 密度モディファイア
  &--density-compact {
    padding: var(--space-card-pad-md);

    @include flex-column(var(--space-card-gap-sm));

    .c-panel__content {
      @include flex-column(var(--space-card-gap-sm));
    }
  }

  /* Header & Title */

  &__title {
    @include text-title-md;

    color: #{theme-color(var(--p-theme-color), 100%)};
    text-shadow: 0 0 var(--blur-md) #{theme-color(var(--p-theme-color), 40%)};
  }

  &__content {
    @include flex-column(var(--space-card-gap));

    flex: 1;
    min-height: 0;
  }

  &--color-main {
    --p-theme-color: var(--color-category-main);
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
    --p-border-color: #{theme-color(var(--color-border), 50%)};
    --p-box-shadow:
      inset 0 0 0 1px var(--color-main-bg), inset 0 0 0 2px var(--color-border),
      var(--shadow-elevation-sm);
    --p-bracket-display: block;
    --p-bracket-size: var(--space-4);
    --p-bracket-color: #{theme-color(var(--p-theme-color), 60%)};
  }

  &--simple {
    --p-border-color: #{theme-color(var(--color-border), 50%)};
    --p-box-shadow:
      inset 1px 1px 2px var(--color-border), inset -1px -1px 2px transparent,
      var(--shadow-elevation-sm);
    --p-bracket-display: none;
  }

  &--gradient {
    --p-border-color: transparent;
    --p-border-image: linear-gradient(
        135deg,
        var(--color-border) 0%,
        transparent 100%
      )
      1;
    --p-box-shadow:
      inset 1px 1px 2px var(--color-border), inset -1px -1px 2px transparent,
      var(--shadow-elevation-sm);
    --p-bracket-display: block;
    --p-bracket-size: var(--space-3);
    --p-bracket-color: #{theme-color(var(--p-theme-color), 40%)};
  }

  &--hybrid {
    --p-border-color: transparent;
    --p-border-image: linear-gradient(
        135deg,
        var(--color-border) 0%,
        transparent 100%
      )
      1;
    --p-box-shadow:
      inset 0 0 0 1px var(--color-main-bg), inset 0 0 0 2px var(--color-border),
      var(--shadow-elevation-sm);
    --p-bracket-display: block;
    --p-bracket-size: var(--space-4);
    --p-bracket-color: #{theme-color(var(--p-theme-color), 80%)};
    --p-bracket-glow: drop-shadow(
      0 0 var(--blur-md) #{theme-color(var(--p-theme-color), 60%)}
    );
  }

  @include flex-column(var(--space-card-gap));

  // Apply visual base
  @include border-base(var(--p-border-color), var(--border-width-base));
  @include state-base(var(--p-box-shadow));
}
</style>
