<script setup lang="ts">
/**
 * ToolLayout
 * 計算ツールページの全体レイアウトコンポーネント。
 * 左側に「条件入力」、右側に「計算結果」を広々と配置し、
 * 「計算根拠」はモーダルダイアログとして呼び出せる構成を提供します。
 */
import { computed, provide, ref, useSlots } from 'vue'

const slots = useSlots()
const isDrawerOpen = ref(false)
const isBasisModalOpen = ref(false)

const toggleDrawer = () => {
  isDrawerOpen.value = !isDrawerOpen.value
}

const openBasisModal = () => {
  isBasisModalOpen.value = true
}

const closeBasisModal = () => {
  isBasisModalOpen.value = false
}

provide('openToolBasis', openBasisModal)
provide('hasToolBasis', computed(() => !!slots.basis))
</script>

<template>
  <div class="l-tool-layout">
    <!-- 免責事項 -->
    <header class="l-tool-layout__disclaimer">
      <slot name="disclaimer">
        <AppDisclaimer />
      </slot>
    </header>

    <!-- メイングリッド（左: 条件入力 / 右: 計算結果） -->
    <main class="l-tool-layout__main">
      <!-- 1. 条件入力（PC: 左側 50% / モバイル: 全面表示） -->
      <section class="l-tool-layout__inputs">
        <slot name="inputs" :open-basis="openBasisModal" />
      </section>

      <!-- 2. 計算結果（PC: 右側 50% / モバイル: 下部Stickyドロワー） -->
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
          <slot name="results" :open-basis="openBasisModal" />
        </div>
      </section>

      <!-- モバイルドロワー展開時の背景オーバーレイ -->
      <div
        v-if="isDrawerOpen"
        class="l-tool-layout__overlay"
        @click="toggleDrawer"
      />
    </main>

    <!-- 計算根拠モーダル -->
    <AppModal
      v-if="$slots.basis"
      v-model="isBasisModalOpen"
      title="計算根拠"
      icon="book"
      variant="tool"
      size="lg"
    >
      <slot name="basis" />

      <template #footer>
        <AppButton variant="secondary" size="sm" @click="closeBasisModal">
          閉じる
        </AppButton>
      </template>
    </AppModal>
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

  // 左右二等分（1:1）のメイングリッド: 左に入力、右に結果
  &__main {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    flex: 1;
    gap: var(--space-card-gap);

    min-height: 0;

    @include mq("md") {
      grid-template-columns: 1fr;
    }
  }

  &__inputs {
    @include flex-start-stretch($direction: column);

    min-height: 0;
  }

  &__results {
    @include flex-start-stretch($direction: column);

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
