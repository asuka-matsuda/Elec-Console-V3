<script setup lang="ts">
import { ref } from "vue";

// Drawer state for mobile
const isDrawerOpen = ref(false);

const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value;
};
</script>

<template>
  <div class="l-tool-layout">
    <!-- Disclaimer -->
    <div v-if="$slots.disclaimer" class="l-tool-layout__disclaimer">
      <slot name="disclaimer"></slot>
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
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;

  // Override AppPanel padding to be tighter in tools
  :deep(.c-panel) {
    --pad-card: var(--space-3);
    --pad-card-gap: var(--space-3);
  }

  &__disclaimer {
    flex-shrink: 0;
    margin-bottom: var(--space-2);
  }

  &__main {
    flex: 1;
    display: flex;
    min-height: 0;
    gap: var(--space-2);
  }

  &__left {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    gap: var(--space-2);
  }

  &__inputs {
    display: flex;
    flex-direction: column;
    min-height: 0;

    @include mq("lg", "up-strict") {
      flex: 3; // 3/4 ratio on PC
    }

    // パネルの外側（ラッパー）ではなく、パネルの「中身」をスクロールさせる
    :deep(.c-panel__content) {
      overflow-y: auto;
      @include custom-scrollbar();
      
      // スクロール時に要素がpaddingに食い込まないよう調整
      padding-right: var(--space-2);
    }
  }

  &__right {
    display: none; // Cut on mobile

    @include mq("lg", "up-strict") {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;
      overflow-y: hidden; // No vertical scroll per user request
    }
  }

  /* --------------------------------------------------------- */
  /* Mobile Drawer & PC Results Layout */
  /* --------------------------------------------------------- */
  &__results {
    display: flex;
    flex-direction: column;

    // Mobile: Sticky Drawer
    @include mq("md", "down") {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: var(--z-index-modal);
      background: var(--color-bg-base);
      border-top: var(--border-width-base) solid var(--color-category-tool);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.5);
      transition: transform var(--transition-base);
      transform: translateY(calc(100% - 48px)); // Show only handle
      max-height: 80vh;

      &.is-drawer-open {
        transform: translateY(0);
      }
    }

    // PC: Top 1/4 layout
    @include mq("lg", "up-strict") {
      flex: 1; // 1/4 ratio on PC
      min-height: 0;
    }
  }

  &__drawer-handle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    padding: 0 var(--space-4);
    cursor: pointer;
    background: color-mix(in srgb, var(--color-category-tool) 10%, transparent);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;

    @include mq("lg", "up-strict") {
      display: none; // Hidden on PC
    }
  }

  &__drawer-title {
    font-weight: var(--font-weight-bold);
    color: var(--color-category-tool);
  }

  &__drawer-icon {
    width: var(--icon-size-md);
    height: var(--icon-size-md);
    color: var(--color-category-tool);
  }

  &__results-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;

    @include mq("md", "down") {
      padding: var(--space-4);
      overflow-y: auto;
      @include custom-scrollbar();
    }
  }

  &__overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: calc(var(--z-index-modal) - 1);
    backdrop-filter: blur(2px);

    @include mq("lg", "up-strict") {
      display: none; // Hidden on PC
    }
  }
}
</style>
