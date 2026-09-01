<script setup lang="ts">
/**
 * ToolLayout
 * ツールページの全体レイアウト（免責事項、入力欄、結果表示、計算根拠パネルなど）を提供するレイアウト用コンポーネントです。
 */
import { ref } from 'vue'

/** Drawer state for mobile */
const isDrawerOpen = ref(false)

const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value
}
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
          <div
            class="l-tool-layout__drawer-handle"
            @click="toggleDrawer"
          >
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
  @include flex-column;

  flex: 1;

  width: 100%;
  max-width: 1600px;
  min-height: 0;
  margin: 0 auto;

  &__disclaimer {
    flex-shrink: 0;
  }

  &__main {
    display: flex;
    flex: 1;
    gap: var(--space-card-gap);
    min-height: 0;
  }

  &__left {
    container-type: inline-size;

    @include flex-column;

    flex: 1;
    min-height: 0;
  }

  &__inputs {
    @include flex-column(0);

    flex: 3; // 3/4 ratio on PC (Default)
    min-height: 0;

    @include mq("md") {
      flex: none; // Reset on mobile
    }

    // パネルの外側（ラッパー）ではなく、パネルの「中身」をスクロールさせる
    :deep(.c-panel__content) {
      --scrollbar-size: var(--space-2);

      overflow-y: auto;

      // スクロール時に要素がpaddingに食い込まないよう調整
      padding-right: var(--space-2);
    }
  }

  &__right {
    overflow-y: hidden; // No vertical scroll per user request

    @include flex-column(0);

    flex: 1;
    min-height: 0;

    @include mq("md") {
      display: none; // Cut on mobile
    }
  }

  /* Mobile Drawer & PC Results Layout */
  &__results {
    container-type: inline-size;

    @include flex-column(0);

    flex: none; // コンテンツの高さに合わせて自動調整
    min-height: 0;

    // Mobile: Sticky Drawer
    @include mq("md") {
      position: fixed;
      z-index: var(--z-index-modal);
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateY(calc(100% - 48px)); // Show only handle

      flex: none;

      max-height: 80vh;
      border-top: var(--border-width-base) solid var(--color-category-tool);

      background: var(--color-main-bg);

      @include state-base(
        var(--shadow-elevation-md),
        transform var(--transition-base)
      );

      &.is-drawer-open {
        transform: translateY(0);
      }
    }
  }

  &__drawer-handle {
    display: none; // Hidden on PC

    @include mq("md") {
      cursor: pointer;

      @include flex-between;

      height: 48px;
      padding: 0 var(--space-card-pad-md);
      background: color-mix(in srgb, var(--color-category-tool) 10%, transparent);
    }
  }

  &__drawer-title {
    @include text-title("sm");

    color: var(--color-category-tool);
  }

  &__drawer-icon {
    width: var(--icon-size-md);
    height: var(--icon-size-md);
    color: var(--color-category-tool);
  }

  &__results-content {
    @include flex-column(0);

    flex: 1;
    min-height: 0;

    @include mq("md") {
      --scrollbar-size: var(--space-2);

      overflow-y: auto;
      padding: var(--space-card-pad-md);
    }
  }

  &__overlay {
    display: none; // Hidden on PC

    @include mq("md") {
      position: fixed;
      z-index: calc(var(--z-index-modal) - 1);
      inset: 0;

      display: block; // Show on mobile

      background: var(--color-overlay-dark);
      backdrop-filter: blur(var(--blur-sm));
    }
  }
}
</style>
