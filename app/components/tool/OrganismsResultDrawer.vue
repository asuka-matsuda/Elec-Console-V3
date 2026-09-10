<script setup lang="ts">
/**
 * OrganismsResultDrawer
 * [Tool Organism] 計算ツールの結果表示エリア全体を包括する独立機能セクション。
 * AtomsPanel, MoleculesSectionHeader, AtomsButton, AtomsIcon を内包し、
 * PC時は通常パネル、モバイル時は下部Stickyドロワーとして開閉・結果表示・履歴保存・計算根拠呼び出しを提供します。
 */
import { computed, inject, type Ref, ref, toRef } from 'vue'

import { useAsyncActionFeedback } from '~/composables/useAsyncActionFeedback'

const props = withDefaults(
  defineProps<{
    title?: string
    icon?: string
    drawerTitle?: string
    hasBasis?: boolean
    saveDisabled?: boolean
    saveFunction?: () => Promise<void>
  }>(),
  {
    title: '計算結果・選定結果',
    icon: 'check-square',
    drawerTitle: '計算結果を見る',
    hasBasis: undefined,
    saveDisabled: false,
  },
)

const emit = defineEmits<{
  openBasis: []
}>()

const isOpen = ref(false)

const toggleDrawer = () => {
  isOpen.value = !isOpen.value
}

const closeDrawer = () => {
  isOpen.value = false
}

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

const injectedOpenBasis = inject<(() => void) | null>('openToolBasis', null)
const injectedHasBasis = inject<Ref<boolean> | null>('hasToolBasis', null)

const isBasisAvailable = computed(() => {
  if (props.hasBasis !== undefined) return props.hasBasis

  return injectedHasBasis?.value ?? false
})

const handleOpenBasis = () => {
  emit('openBasis')
  if (injectedOpenBasis) {
    injectedOpenBasis()
  }
}

defineExpose({
  isOpen,
  toggle: toggleDrawer,
  close: closeDrawer,
})
</script>

<template>
  <!-- ドロワー本体（PC: グリッド右側、モバイル: 下部Sticky） -->
  <section
    class="result-drawer flex flex-col min-h-0 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[80vh]"
    :class="{ 'is-open': isOpen }"
  >
    <!-- モバイル開閉ハンドル -->
    <button
      type="button"
      class="handle hidden max-md:flex items-center justify-between w-full h-12 px-3 cursor-pointer text-sm font-bold leading-tight"
      :aria-expanded="isOpen"
      aria-label="計算結果ドロワーの開閉"
      @click="toggleDrawer"
    >
      <span>{{ drawerTitle }}</span>
      <AtomsIcon
        :name="isOpen ? 'chevron-down' : 'chevron-up'"
        size="md"
      />
    </button>

    <!-- ドロワー内コンテンツ（結果パネル） -->
    <div class="content flex flex-1 flex-col min-h-0 max-md:overflow-y-auto max-md:p-3">
      <AtomsPanel class="flex flex-1 flex-col gap-panel-gap min-h-0">
        <MoleculesSectionHeader
          :title="title"
          :icon="icon"
          variant="tool"
          size="md"
        >
          <template #actions>
            <AtomsButton
              v-if="isBasisAvailable"
              variant="secondary"
              size="sm"
              @click="handleOpenBasis"
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

        <div class="body flex flex-1 flex-col min-h-0 overflow-y-auto px-2 py-1">
          <slot />
        </div>
      </AtomsPanel>
    </div>
  </section>

  <!-- モバイル展開時の暗幕オーバーレイ -->
  <div
    v-if="isOpen"
    class="overlay fixed inset-0 hidden max-md:block"
    @click="closeDrawer"
  />
</template>

<style scoped lang="scss">
.result-drawer {
  @include mq("md") {
    z-index: var(--z-index-modal);
    transform: translateY(calc(100% - 48px));

    border-top: var(--border-width-base) solid var(--color-category-tool);

    background: var(--surface-bg-solid, var(--color-main-bg));
    box-shadow: var(--shadow-elevation-md);

    transition: var(--transition-transform);

    &.is-open {
      transform: translateY(0);
    }
  }

  .handle {
    border: none;
    font: inherit;
    color: var(--color-category-tool);
    background: color-mix(
      in srgb,
      var(--color-category-tool) 10%,
      transparent
    );
  }

  .content {
    --scrollbar-size: var(--space-2);

    container-type: inline-size;

    .body {
      --scrollbar-size: var(--space-2);
    }
  }
}

.overlay {
  z-index: calc(var(--z-index-modal) - 1);
  background: var(--color-overlay-dark);
  backdrop-filter: blur(var(--blur-sm));
}
</style>
