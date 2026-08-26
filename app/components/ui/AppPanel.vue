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
  // --- CSSカスタムプロパティ ---
  --p-border-color: var(--color-border);
  --p-border-image: none;
  --p-box-shadow: none;
  --p-bracket-display: none;
  --p-bracket-size: var(--space-4);
  --p-bracket-color: var(--color-border);
  --p-bracket-glow: none;
  --p-theme-color: var(--color-category-main);

  // --- レイアウト・配置 ---
  position: relative;

  @include flex-column(var(--pad-container-gap, var(--pad-container)));

  // --- ボックスモデル ---
  padding: var(--pad-container, var(--pad-container));

  // Apply visual base
  @include border-base(var(--p-border-color), var(--border-width-base));

  border-image: var(--p-border-image);

  // --- 視覚効果 ---
  @include state-base(var(--p-box-shadow));

  // Cyber Brackets (Top-Left & Bottom-Right)

  // --- 疑似要素 ---
  &::before,
  &::after {
    // --- その他 ---
    pointer-events: none;
    content: "";

    // --- レイアウト・配置 ---
    position: absolute;

    display: var(--p-bracket-display);

    // --- ボックスモデル ---
    width: var(--p-bracket-size);
    height: var(--p-bracket-size);

    @include border-base(var(--p-bracket-color), var(--border-width-thick));

    // --- 視覚効果 ---
    filter: var(--p-bracket-glow);
  }

  &::before {
    // --- レイアウト・配置 ---
    top: -1px;
    left: -1px;

    // --- ボックスモデル ---
    border-right: none;
    border-bottom: none;
  }

  &::after {
    // --- レイアウト・配置 ---
    right: -1px;
    bottom: -1px;

    // --- ボックスモデル ---
    border-top: none;
    border-left: none;
  }

  /* Header & Title */

  // --- 子要素 ---
  &__title {
    // --- 継承 ---
    @extend %text-title-md;

    color: #{theme-color(var(--p-theme-color), 100%)};
    text-shadow: 0 0 var(--blur-md) #{theme-color(var(--p-theme-color), 40%)};
  }

  &__content {
    // --- レイアウト・配置 ---
    @include flex-column(var(--pad-container-gap, var(--pad-container)));

    flex: 1;

    // --- ボックスモデル ---
    min-height: 0;
  }

  // --- モディファイア ---
  &--color-main {
    // --- CSSカスタムプロパティ ---
    --p-theme-color: var(--color-category-main);
  }

  &--color-tool {
    // --- CSSカスタムプロパティ ---
    --p-theme-color: var(--color-category-tool);
  }

  &--color-database {
    // --- CSSカスタムプロパティ ---
    --p-theme-color: var(--color-category-database);
  }

  &--color-reference {
    // --- CSSカスタムプロパティ ---
    --p-theme-color: var(--color-category-reference);
  }

  &--color-management {
    // --- CSSカスタムプロパティ ---
    --p-theme-color: var(--color-category-management);
  }

  &--color-danger {
    // --- CSSカスタムプロパティ ---
    --p-theme-color: var(--color-status-danger);
  }

  &--color-success {
    // --- CSSカスタムプロパティ ---
    --p-theme-color: var(--color-status-success);
  }

  &--hud {
    // --- CSSカスタムプロパティ ---
    --p-border-color: #{theme-color(var(--color-border), 50%)};
    --p-box-shadow:
      inset 0 0 0 1px var(--color-main-bg), inset 0 0 0 2px var(--color-border),
      var(--shadow-elevation-sm);
    --p-bracket-display: block;
    --p-bracket-size: var(--space-4);
    --p-bracket-color: #{theme-color(var(--p-theme-color), 60%)};
  }

  &--simple {
    // --- CSSカスタムプロパティ ---
    --p-border-color: #{theme-color(var(--color-border), 50%)};
    --p-box-shadow:
      inset 1px 1px 2px var(--color-border), inset -1px -1px 2px transparent,
      var(--shadow-elevation-sm);
    --p-bracket-display: none;
  }

  &--gradient {
    // --- CSSカスタムプロパティ ---
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
    // --- CSSカスタムプロパティ ---
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
}
</style>
