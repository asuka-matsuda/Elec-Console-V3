<script setup lang="ts">
/**
 * OrganismsResultDrawer
 * [Tool Organism] 計算ツールの結果表示エリア全体を包括する独立機能セクション。
 * Panel, SectionHeader, Button, Icon を内包し、
 * PC時は通常パネル、モバイル時は下部Stickyドロワーとして開閉・結果表示・履歴保存・計算根拠呼び出しを提供します。
 */
import { computed, ref, toRef, useSlots } from 'vue'

import { useAsyncActionFeedback } from '~/composables/useAsyncActionFeedback'
import type { IconName } from '~/constants/icons'

const props = withDefaults(
  defineProps<{
    title?: string
    icon?: IconName
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
  toggleBasis: [isShowingBasis: boolean]
}>()

const slots = useSlots()
const isOpen = ref(false)
const isShowingBasis = ref(false)

const toggleDrawer = () => {
  isOpen.value = !isOpen.value
}

const closeDrawer = () => {
  isOpen.value = false
}

const isBasisAvailable = computed(() => {
  if (props.hasBasis !== undefined) return props.hasBasis

  return Boolean(slots.basis)
})

const currentTitle = computed(() => (isShowingBasis.value ? '計算根拠' : props.title))
const currentIcon = computed<IconName>(() => (isShowingBasis.value ? 'book' : props.icon))

const toggleBasisView = () => {
  isShowingBasis.value = !isShowingBasis.value
  emit('toggleBasis', isShowingBasis.value)
  if (isShowingBasis.value) {
    emit('openBasis')
  }
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

defineExpose({
  isOpen,
  isShowingBasis,
  toggle: toggleDrawer,
  close: closeDrawer,
  toggleBasis: toggleBasisView,
})
</script>

<template>
  <!-- ドロワー本体（PC: グリッド右側、モバイル: 下部Sticky） -->
  <section
    class="result-drawer flex flex-col min-h-0 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[80vh] md:z-modal"
    :class="{ 'is-open': isOpen }"
  >
    <!-- モバイル開閉ハンドル -->
    <button
      type="button"
      class="handle hidden max-md:flex items-center justify-between w-full h-12 px-3"
      @click="toggleDrawer"
    >
      <span>{{ drawerTitle }}</span>
      <Icon
        :name="isOpen ? 'chevron-down' : 'chevron-up'"
        size="md"
      />
    </button>

    <!-- ドロワー内コンテンツ（結果パネル） -->
    <div class="content flex flex-1 flex-col min-h-0 max-md:overflow-y-auto max-md:p-3">
      <Panel class="flex flex-1 flex-col gap-panel-gap min-h-0">
        <SectionHeader
          :title="currentTitle"
          :icon="currentIcon"
          tag="h3"
        >
          <template #actions>
            <Button
              v-if="isBasisAvailable"
              :icon="isShowingBasis ? 'arrow-left' : 'help-circle'"
              @click="toggleBasisView"
            >
              {{ isShowingBasis ? '結果に戻る' : '計算根拠' }}
            </Button>
            <Button
              v-if="saveFunction && !isShowingBasis"
              :variant="saveButtonVariant"
              :icon="saveButtonContent.icon"
              :disabled="saveDisabled || saveState !== 'idle'"
              :loading="saveState === 'saving'"
              @click="handleSave"
            >
              {{ saveButtonContent.text }}
            </Button>
          </template>
        </SectionHeader>

        <div
          class="body flex flex-1 flex-col min-h-0 px-2 py-1"
          :class="{
            'overflow-y-hidden': !isShowingBasis,
            'overflow-y-auto': isShowingBasis,
          }"
        >
          <slot v-if="!isShowingBasis" />
          <slot v-else name="basis" />
        </div>
      </Panel>
    </div>
  </section>

  <!-- モバイル展開時の暗幕オーバーレイ -->
  <div
    v-if="isOpen"
    class="overlay fixed inset-0 hidden max-md:block z-[calc(var(--z-index-modal)-1)]"
    @click="closeDrawer"
  />
</template>

<style scoped lang="scss">
.result-drawer {
  @include mq("md") {
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
    cursor: pointer;

    border: none;

    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
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
  background: var(--color-overlay-dark);
  backdrop-filter: blur(var(--blur-sm));
}
</style>
