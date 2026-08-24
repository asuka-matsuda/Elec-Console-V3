<script setup lang="ts">
/**
 * AppToolLayout
 * ツールページの全体レイアウト（免責事項、入力欄、結果表示、計算根拠パネルなど）を提供するレイアウト用コンポーネントです。
 */
import { ref } from "vue";

/** Drawer state for mobile */
const isDrawerOpen = ref(false);

const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value;
};
</script>

<template>
  <div class="l-tool-layout">
    <!-- Disclaimer -->
    <div class="l-tool-layout__disclaimer">
      <slot name="disclaimer">
        <AppDisclaimer />
      </slot>
    </div>

    <div class="l-tool-layout__main">
      <!-- Left Column -->
      <div class="l-tool-layout__left">
        <!-- Results (Top 1/4 on PC, Drawer on Mobile) -->
        <div
          class="l-tool-layout__results"
          :class="{ 'is-drawer-open': isDrawerOpen }"
        >
          <!-- Mobile Drawer Handle -->
          <div class="l-tool-layout__drawer-handle" @click="toggleDrawer">
            <span class="l-tool-layout__drawer-title">計算結果を見る</span>
            <AppIcon
              :name="isDrawerOpen ? 'chevron-down' : 'chevron-up'"
              class="l-tool-layout__drawer-icon"
            />
          </div>
          <!-- Results Content -->
          <div class="l-tool-layout__results-content">
            <slot name="results"></slot>
          </div>
        </div>

        <!-- Mobile Overlay -->
        <div
          v-if="isDrawerOpen"
          class="l-tool-layout__overlay"
          @click="toggleDrawer"
        ></div>

        <!-- Inputs (Bottom 3/4 on PC, Full on Mobile) -->
        <div class="l-tool-layout__inputs">
          <slot name="inputs"></slot>
        </div>
      </div>

      <!-- Right Column (Formulas - Hidden on Mobile) -->
      <div class="l-tool-layout__right">
        <slot name="basis"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.l-tool-layout {
  // --- レイアウト・配置 ---
  @include flex-column(var(--gap-component));

  flex: 1;


  // --- ボックスモデル ---

  width: 100%;
  max-width: 1600px;
  min-height: 0;
  margin: 0 auto;

  // Override AppPanel padding to be tighter in tools

  // --- 疑似クラス ---
  :deep(.c-panel) {
    // --- CSSカスタムプロパティ ---
    --pad-container: var(--space-3);
    --pad-container-gap: var(--gap-section);
  }


  // --- 子要素 ---

  &__disclaimer {
    // --- レイアウト・配置 ---
    flex-shrink: 0;
  }

  &__main {
    // --- レイアウト・配置 ---
    display: flex;
    flex: 1;
    gap: var(--gap-component);

    // --- ボックスモデル ---
    min-height: 0;
  }

  &__left {
    // --- レイアウト・配置 ---
    container-type: inline-size;

    @include flex-column(var(--gap-component));

    flex: 1;

    // --- ボックスモデル ---
    min-height: 0;
  }

  &__inputs {
    // --- レイアウト・配置 ---
    @include flex-column(0);

    flex: 3; // 3/4 ratio on PC (Default)

    // --- ボックスモデル ---
    min-height: 0;

    @include mq("md") {
      // --- レイアウト・配置 ---
      flex: none; // Reset on mobile
    }

    // パネルの外側（ラッパー）ではなく、パネルの「中身」をスクロールさせる

    // --- 疑似クラス ---
    :deep(.c-panel__content) {
      // --- CSSカスタムプロパティ ---

      --scrollbar-size: var(--size-2);


      // --- その他 ---

      overflow-y: auto;

      // スクロール時に要素がpaddingに食い込まないよう調整

      // --- ボックスモデル ---
      padding-right: var(--pad-component);
    }
  }

  &__right {
    // --- その他 ---
    overflow-y: hidden; // No vertical scroll per user request


    // --- レイアウト・配置 ---

    @include flex-column(0);

    flex: 1;

    // --- ボックスモデル ---
    min-height: 0;

    @include mq("md") {
      // --- レイアウト・配置 ---
      display: none; // Cut on mobile
    }
  }

  /* Mobile Drawer & PC Results Layout */
  &__results {
    // --- レイアウト・配置 ---
    container-type: inline-size;

    @include flex-column(0);

    flex: none; // コンテンツの高さに合わせて自動調整

    // --- ボックスモデル ---
    min-height: 0;

    // Mobile: Sticky Drawer
    @include mq("md") {
      // --- レイアウト・配置 ---
      position: fixed;
      z-index: var(--z-index-modal);
      right: 0;
      bottom: 0;
      left: 0;

      // --- 視覚効果 ---
      transform: translateY(calc(100% - 48px)); // Show only handle


      // --- レイアウト・配置 ---

      flex: none;


      // --- ボックスモデル ---

      max-height: 80vh;
      border-top: var(--border-width-base) solid var(--color-category-tool);


      // --- 視覚効果 ---

      background: var(--color-bg-base);

      @include state-base(var(--shadow-elevation-md), transform var(--transition-base));


      // --- モディファイア ---

      &.is-drawer-open {
        // --- 視覚効果 ---
        transform: translateY(0);
      }
    }
  }

  &__drawer-handle {
    // --- レイアウト・配置 ---
    display: none; // Hidden on PC

    @include mq("md") {
      // --- その他 ---
      cursor: pointer;


      // --- レイアウト・配置 ---

      @include flex-between;


      // --- ボックスモデル ---

      height: 48px;
      padding: var(--pad-container);

      // --- 視覚効果 ---
      background: theme-color(var(--color-category-tool), 10%);
    }
  }

  &__drawer-title {
    // --- タイポグラフィ ---
    font-weight: var(--font-weight-bold);
    color: var(--color-category-tool);
  }

  &__drawer-icon {
    // --- ボックスモデル ---
    width: var(--icon-size-md);
    height: var(--icon-size-md);

    // --- タイポグラフィ ---
    color: var(--color-category-tool);
  }

  &__results-content {
    // --- レイアウト・配置 ---
    @include flex-column(0);

    flex: 1;

    // --- ボックスモデル ---
    min-height: 0;

    @include mq("md") {
      // --- CSSカスタムプロパティ ---

      --scrollbar-size: var(--size-2);


      // --- その他 ---

      overflow-y: auto;

      // --- ボックスモデル ---
      padding: var(--pad-container);
    }
  }

  &__overlay {
    // --- レイアウト・配置 ---
    display: none; // Hidden on PC

    @include mq("md") {
      // --- レイアウト・配置 ---
      position: fixed;
      z-index: calc(var(--z-index-modal) - 1);
      inset: 0;

      display: block; // Show on mobile


      // --- 視覚効果 ---

      background: var(--color-overlay-dark);
      backdrop-filter: blur(var(--blur-sm));
    }
  }
}
</style>
