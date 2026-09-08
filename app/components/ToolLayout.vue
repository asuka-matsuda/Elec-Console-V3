<script setup lang="ts">
/**
 * ToolLayout
 * 計算ツールページの全体レイアウトコンポーネント。
 * 条件入力パネルと計算結果パネルの大枠、リセット・保存・計算根拠アクション、
 * およびモバイルドロワー機構を一元管理します。
 */
import { computed, provide, ref, toRef, useSlots } from 'vue'

import { useAsyncActionFeedback } from '~/composables/useAsyncActionFeedback'

const props = withDefaults(
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

const {
  state: saveState,
  buttonVariant: saveButtonVariant,
  currentContent: saveButtonContent,
  execute: handleSave,
} = useAsyncActionFeedback({
  action: () => props.saveFunction ? props.saveFunction() : Promise.resolve(),
  disabled: toRef(props, 'saveDisabled'),
  label: '履歴に保存',
  defaultVariant: 'success',
})

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
  <div class="tool-layout">
    <!-- 免責事項 -->
    <slot name="disclaimer">
      <AtomsDisclaimer />
    </slot>

    <!-- メイングリッド（左: 条件入力 / 右: 計算結果） -->
    <div class="tool-layout__main">
      <!-- 1. 条件入力（PC: 左側 50% / モバイル: 全面表示） -->
      <section class="tool-layout__inputs">
        <AtomsPanel class="flex flex-col gap-[var(--space-panel-gap)] tool-layout__panel">
          <MoleculesSectionHeader
            :title="inputsTitle"
            :icon="inputsIcon"
            variant="tool"
            size="md"
          >
            <template #actions>
              <AtomsButton variant="danger" size="sm" @click="emit('reset')">
                <AtomsIcon name="refresh-cw" size="sm" />
                リセット
              </AtomsButton>
            </template>
          </MoleculesSectionHeader>

          <div class="tool-layout__panel-body">
            <slot name="inputs" :open-basis="openBasisModal" />
          </div>
        </AtomsPanel>
      </section>

      <!-- 2. 計算結果（PC: 右側 50% / モバイル: 下部Stickyドロワー） -->
      <section
        class="tool-layout__results"
        :class="{ 'is-drawer-open': isDrawerOpen }"
      >
        <button
          type="button"
          class="tool-layout__drawer-handle"
          :aria-expanded="isDrawerOpen"
          aria-label="計算結果ドロワーの開閉"
          @click="toggleDrawer"
        >
          <span class="tool-layout__drawer-title">計算結果を見る</span>
          <AtomsIcon
            :name="isDrawerOpen ? 'chevron-down' : 'chevron-up'"
            size="md"
            class="tool-layout__drawer-icon"
          />
        </button>
        <div class="tool-layout__results-inner">
          <AtomsPanel class="flex flex-col gap-[var(--space-panel-gap)] tool-layout__panel">
            <MoleculesSectionHeader
              :title="resultsTitle"
              :icon="resultsIcon"
              variant="tool"
              size="md"
            >
              <template #actions>
                <AtomsButton
                  v-if="hasBasis"
                  variant="secondary"
                  size="sm"
                  @click="openBasisModal"
                >
                  <AtomsIcon name="help-circle" size="sm" />
                  計算根拠
                </AtomsButton>
                <AtomsButton
                  v-if="saveFunction"
                  :variant="saveButtonVariant"
                  size="sm"
                  :disabled="saveDisabled || saveState !== 'idle'"
                  :loading="saveState === 'saving'"
                  @click="handleSave"
                >
                  <AtomsIcon
                    v-if="saveState !== 'saving'"
                    :name="saveButtonContent.icon"
                    size="sm"
                  />
                  {{ saveButtonContent.text }}
                </AtomsButton>
              </template>
            </MoleculesSectionHeader>

            <div class="tool-layout__panel-body">
              <slot name="results" :open-basis="openBasisModal" />
            </div>
          </AtomsPanel>
        </div>
      </section>

      <!-- モバイルドロワー展開時の背景オーバーレイ -->
      <div
        v-if="isDrawerOpen"
        class="tool-layout__overlay"
        @click="toggleDrawer"
      />
    </div>

    <!-- 計算根拠モーダルスロット -->
    <slot name="basis" />
  </div>
</template>

<style scoped lang="scss">
.tool-layout {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-card-gap);

  max-width: 1600px;
  min-height: 0;
  margin: 0 auto;

  // 左右分割（4:3）のメイングリッド: 左に入力、右に結果
  &__main {
    display: grid;
    grid-template-columns: minmax(0, 4fr) minmax(0, 3fr);
    flex: 1;
    gap: var(--space-panel-gap);

    min-height: 0;

    @include mq("md") {
      grid-template-columns: 1fr;
    }
  }

  &__inputs {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &__panel {
    flex: 1;
    min-height: 0;
  }

  &__panel-body {
    --scrollbar-size: var(--space-2);

    overflow-y: auto;
    display: flex;
    flex: 1;
    flex-direction: column;

    min-height: 0;
    padding: var(--space-1) var(--space-2);
  }

  &__results {
    display: flex;
    flex-direction: column;
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
      box-shadow: var(--shadow-elevation-md);

      transition: var(--transition-transform);

      &.is-drawer-open {
        transform: translateY(0);
      }
    }
  }

  &__drawer-handle {
    display: none;

    @include mq("md") {
      cursor: pointer;

      display: flex;
      align-items: center;
      justify-content: space-between;

      width: 100%;
      height: 48px;
      padding: 0 var(--space-3);
      border: none;

      font: inherit;

      background: color-mix(
        in srgb,
        var(--color-category-tool) 10%,
        transparent
      );
    }
  }

  &__drawer-title,
  &__drawer-icon {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: var(--color-category-tool);
  }

  &__results-inner {
    container-type: inline-size;
    display: flex;
    flex: 1;
    flex-direction: column;

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
