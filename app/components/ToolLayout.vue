<script setup lang="ts">
/**
 * ToolLayout
 * 計算ツールページの全体レイアウトコンポーネント。
 * 条件入力パネルと計算結果パネルの大枠、リセット・保存・計算根拠アクション、
 * およびモバイルドロワー機構を一元管理します。
 */
import { computed, provide, ref, useSlots } from 'vue'

withDefaults(
  defineProps<{
    inputsTitle?: string
    inputsIcon?: string
    resultsTitle?: string
    resultsIcon?: string
    saveDisabled?: boolean
    saveFunction?: () => Promise<void>
  }>(),
  {
    inputsTitle: '条件入力',
    inputsIcon: 'edit',
    resultsTitle: '計算結果・選定結果',
    resultsIcon: 'check-square',
    saveDisabled: false,
  },
)

const emit = defineEmits<{
  reset: []
}>()

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

const hasBasis = computed(() => !!slots.basis)

provide('openToolBasis', openBasisModal)
provide('hasToolBasis', hasBasis)
provide('toolBasisModal', {
  isOpen: isBasisModalOpen,
  open: openBasisModal,
  close: closeBasisModal,
})
</script>

<template>
  <div class="l-tool-layout">
    <!-- 免責事項 -->
    <slot name="disclaimer">
      <AppDisclaimer />
    </slot>

    <!-- メイングリッド（左: 条件入力 / 右: 計算結果） -->
    <main class="l-tool-layout__main">
      <!-- 1. 条件入力（PC: 左側 50% / モバイル: 全面表示） -->
      <section class="l-tool-layout__inputs">
        <AppPanel
          class="l-tool-layout__panel"
          :title="inputsTitle"
          :icon="inputsIcon"
          variant="tool"
          size="md"
        >
          <template #actions>
            <AppButton variant="danger" size="sm" @click="emit('reset')">
              <AppIcon name="refresh-cw" size="sm" />
              リセット
            </AppButton>
          </template>

          <slot name="inputs" :open-basis="openBasisModal" />
        </AppPanel>
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
          <AppPanel
            class="l-tool-layout__panel"
            :title="resultsTitle"
            :icon="resultsIcon"
            variant="tool"
            size="md"
          >
            <template #actions>
              <AppButton
                v-if="hasBasis"
                variant="secondary"
                size="sm"
                @click="openBasisModal"
              >
                <AppIcon name="book" size="sm" />
                計算根拠
              </AppButton>
              <AppSaveButton
                v-if="saveFunction"
                :disabled="saveDisabled"
                :save-function="saveFunction"
              />
            </template>

            <slot name="results" :open-basis="openBasisModal" />
          </AppPanel>
        </div>
      </section>

      <!-- モバイルドロワー展開時の背景オーバーレイ -->
      <div
        v-if="isDrawerOpen"
        class="l-tool-layout__overlay"
        @click="toggleDrawer"
      />
    </main>

    <!-- 計算根拠モーダルスロット -->
    <slot name="basis" />
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

  // 左右分割（4:3）のメイングリッド: 左に入力、右に結果
  &__main {
    @include grid(minmax(0, 4fr) minmax(0, 3fr));

    flex: 1;
    min-height: 0;

    @include mq("md") {
      grid-template-columns: 1fr;
    }
  }

  &__inputs {
    @include flex-start-stretch($direction: column);

    min-height: 0;
  }

  &__panel {
    flex: 1;
    min-height: 0;

    :deep(.c-panel__content) {
      overflow-y: auto;
      padding: var(--space-1) var(--space-2);
    }
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

      background: var(--surface-bg-solid, var(--color-main-bg));

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

    container-type: inline-size;
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
