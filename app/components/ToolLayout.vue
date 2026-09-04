<script setup lang="ts">
/**
 * ToolLayout
 * 計算ツールページの全体レイアウトコンポーネント。
 * CSS Grid により、左右2分割（1:1）、左側を上下（1:3）で
 * 計算結果・条件入力・計算根拠の3エリアを配置・管理します。
 */
import { ref } from 'vue'

const isDrawerOpen = ref(false)

const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value
}
</script>

<template>
  <div class="l-tool-layout">
    <!-- 免責事項 -->
    <header class="l-tool-layout__disclaimer">
      <slot name="disclaimer">
        <AppDisclaimer />
      </slot>
    </header>

    <!-- メイングリッド（左右1:1、左上下1:3） -->
    <main class="l-tool-layout__main">
      <!-- 1. 計算結果（PC: 左上 1fr / モバイル: 下部Stickyドロワー） -->
      <section
        class="l-tool-layout__results"
        :class="{ 'is-drawer-open': isDrawerOpen }"
      >
        <div class="l-tool-layout__drawer-handle" @click="toggleDrawer">
          <span class="l-tool-layout__drawer-title">計算結果を見る</span>
          <AppIcon
            :name="isDrawerOpen ? 'chevron-down' : 'chevron-up'"
            size="md"
            class="l-tool-layout__drawer-icon"
          />
        </div>
        <div class="l-tool-layout__results-inner">
          <slot name="results" />
        </div>
      </section>

      <!-- 2. 条件入力（PC: 左下 3fr / モバイル: 全面表示） -->
      <section class="l-tool-layout__inputs">
        <slot name="inputs" />
      </section>

      <!-- 3. 計算根拠（PC: 右全面 / モバイル: 非表示） -->
      <aside class="l-tool-layout__basis">
        <slot name="basis" />
      </aside>

      <!-- モバイルドロワー展開時の背景オーバーレイ -->
      <div
        v-if="isDrawerOpen"
        class="l-tool-layout__overlay"
        @click="toggleDrawer"
      />
    </main>
  </div>
</template>

<style scoped lang="scss">
.l-tool-layout {
  @include flex-start-stretch($direction: column);

  flex: 1;
  gap: var(--space-card-gap);

  max-width: 1600px;
  min-height: 0;
  margin: 0 auto;

  &__disclaimer {
    flex-shrink: 0;
  }

  // 左右二等分（1:1）、左側上下（1:3）のグリッド制御
  &__main {
    display: grid;
    grid-template:
      "results basis" minmax(0, 1fr)
      "inputs  basis" minmax(0, 3fr) / minmax(0, 1fr) minmax(0, 1fr);
    flex: 1;
    gap: var(--space-card-gap);

    min-height: 0;

    @include mq("md") {
      grid-template: "inputs" 1fr / 1fr;
    }
  }

  &__results {
    @include flex-start-stretch($direction: column);

    grid-area: results;
    min-height: 0;

    // モバイル: 下部Stickyドロワー
    @include mq("md") {
      position: fixed;
      z-index: var(--z-index-modal);
      right: 0;
      bottom: 0;
      left: 0;
      transform: translateY(calc(100% - 48px));

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
    display: none;

    @include mq("md") {
      @include flex-between-center;

      cursor: pointer;
      height: 48px;
      padding: 0 var(--space-3);
      background: color-mix(
        in srgb,
        var(--color-category-tool) 10%,
        transparent
      );
    }
  }

  &__drawer-title,
  &__drawer-icon {
    @include text-title("sm");

    color: var(--color-category-tool);
  }

  &__results-inner {
    @include flex-start-stretch($direction: column);

    flex: 1;
    min-height: 0;

    @include mq("md") {
      --scrollbar-size: var(--space-2);

      overflow-y: auto;
      padding: var(--space-3);
    }
  }

  &__inputs {
    @include flex-start-stretch($direction: column);

    grid-area: inputs;
    min-height: 0;
  }

  &__basis {
    @include flex-start-stretch($direction: column);

    grid-area: basis;
    min-height: 0;

    @include mq("md") {
      display: none;
    }
  }

  &__overlay {
    display: none;

    @include mq("md") {
      position: fixed;
      z-index: calc(var(--z-index-modal) - 1);
      inset: 0;

      display: block;

      background: var(--color-overlay-dark);
      backdrop-filter: blur(var(--blur-sm));
    }
  }
}
</style>
