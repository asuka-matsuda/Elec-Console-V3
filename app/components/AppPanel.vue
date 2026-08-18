<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    bracketColor?: "main" | "tool" | "database" | "reference" | "management" | "danger" | "success";
    variant?: "hud" | "simple" | "gradient" | "hybrid";
  }>(),
  {
    bracketColor: "main",
    variant: "hud",
  },
);
</script>

<template>
  <section
    class="c-panel"
    :class="[`c-panel--${variant}`, `c-panel--color-${bracketColor}`]"
  >
    <header v-if="title || $slots.header" class="c-panel__header">
      <slot name="header">
        <h2 class="c-panel__title">{{ title }}</h2>
      </slot>
    </header>

    <div class="c-panel__content">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.c-panel {
  // Base properties (overridden by variants)
  --p-border-color: var(--color-border);
  --p-border-image: none;
  --p-box-shadow: none;
  --p-bracket-display: none;
  --p-bracket-size: var(--space-4);
  --p-bracket-color: var(--color-border);
  --p-bracket-glow: none;
  --p-theme-color: var(--color-category-main);

  position: relative;
  display: flex;
  flex-direction: column;
  padding: var(--pad-container, var(--space-4));
  gap: var(--pad-container-gap, var(--space-4));

  // Apply visual base
  border: var(--border-width-base) solid var(--p-border-color);
  border-image: var(--p-border-image);
  box-shadow: var(--p-box-shadow);
  transition: var(--transition-base);

  // ---------------------------------------------------------
  // Cyber Brackets (Top-Left & Bottom-Right)
  // ---------------------------------------------------------
  &::before,
  &::after {
    position: absolute;
    display: var(--p-bracket-display);
    width: var(--p-bracket-size);
    height: var(--p-bracket-size);
    pointer-events: none;
    content: "";
    border: var(--border-width-thick) solid var(--p-bracket-color);
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

  /* --------------------------------------------------------- */

  /* Header & Title */

  /* --------------------------------------------------------- */
  &__header {
    // 削除: margin-bottom: var(--pad-container-gap, var(--space-4));
  }

  &__title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: #{theme-color(var(--p-theme-color), 100%)};
    text-shadow: 0 0 var(--blur-md) #{theme-color(var(--p-theme-color), 40%)};
  }

  &__content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--pad-container-gap, var(--space-4));
    min-height: 0;
  }

  /* --------------------------------------------------------- */

  /* Color Variants */

  /* --------------------------------------------------------- */
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

  /* --------------------------------------------------------- */

  /* Style Variants (Ported from original _themes.scss) */

  /* --------------------------------------------------------- */
  &--hud {
    --p-border-color: #{theme-color(var(--color-border), 50%)};
    --p-box-shadow:
      inset 0 0 0 1px var(--color-main-bg), inset 0 0 0 2px var(--color-border),
      inset 0 0 0 1px color-mix(in srgb, black 8%, transparent),
      var(--shadow-elevation-base);
    --p-bracket-display: block;
    --p-bracket-size: var(--space-4);
    --p-bracket-color: #{theme-color(var(--p-theme-color), 60%)};
  }

  &--simple {
    --p-border-color: #{theme-color(var(--color-border), 50%)};
    --p-box-shadow:
      inset 1px 1px 2px var(--color-border), inset -1px -1px 2px transparent,
      inset 0 0 0 1px color-mix(in srgb, black 8%, transparent),
      var(--shadow-elevation-base);
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
      inset 0 0 0 1px color-mix(in srgb, black 8%, transparent),
      var(--shadow-elevation-base);
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
      inset 0 0 0 1px color-mix(in srgb, black 8%, transparent),
      var(--shadow-elevation-base);
    --p-bracket-display: block;
    --p-bracket-size: var(--space-4);
    --p-bracket-color: #{theme-color(var(--p-theme-color), 80%)};
    --p-bracket-glow: drop-shadow(
      0 0 6px #{theme-color(var(--p-theme-color), 60%)}
    );
  }
}
</style>
