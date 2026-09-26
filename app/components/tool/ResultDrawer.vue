<script setup lang="ts">
/**
 * ResultDrawer
 * [Tool Organism] 計算結果パネルおよびモバイル用ボトムドロワー。
 */
import { computed, ref, toRef, useSlots } from 'vue'

import { useAsyncActionFeedback } from '~/composables/useAsyncActionFeedback'
import type { IconName } from '~/constants/icons'

const props = withDefaults(
  defineProps<{
    title?: string
    icon?: IconName
    saveDisabled?: boolean
    saveFunction?: () => Promise<void>
  }>(),
  {
    title: '計算結果・選定結果',
    icon: 'check-square',
    saveDisabled: false,
  },
)

const slots = useSlots()
const isOpen = ref(false)
const isShowingBasis = ref(false)

const isBasisAvailable = computed(() => Boolean(slots.basis))
const currentTitle = computed(() => (isShowingBasis.value ? '計算根拠' : props.title))
const currentIcon = computed<IconName>(() => (isShowingBasis.value ? 'book' : props.icon))

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
</script>

<template>
  <section
    class="result-drawer flex flex-col min-h-0 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[80vh]"
    :class="{ 'is-open': isOpen }"
  >

    <button
      type="button"
      class="handle hidden max-md:flex items-center justify-between w-full h-12 px-panel-pad-compact"
      @click="isOpen = !isOpen"
    >
      <span>計算結果を見る</span>
      <Icon
        :name="isOpen ? 'chevron-down' : 'chevron-up'"
        size="md"
      />
    </button>

    <div class="flex flex-1 flex-col min-h-0 max-md:p-panel-pad-compact">
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
              @click="isShowingBasis = !isShowingBasis"
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

        <div class="body flex flex-1 flex-col min-h-0 px-item-gap py-inline-gap overflow-y-auto">
          <slot v-if="!isShowingBasis" />
          <slot v-else name="basis" />
        </div>
      </Panel>
    </div>
  </section>

  <div
    v-if="isOpen"
    class="overlay fixed inset-0 hidden max-md:block z-[calc(var(--z-index-modal)-1)]"
    @click="isOpen = false"
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

  .body {
    --scrollbar-size: var(--space-2);
  }
}

.overlay {
  background: var(--color-overlay-dark);
  backdrop-filter: blur(var(--blur-sm));
}
</style>
