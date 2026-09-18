<script setup lang="ts" generic="T extends string | number = string | number">
/**
 * Tabs
 * [Molecules] タブナビゲーション＆コンテンツ表示コンポーネント。
 * 直角統一規約に準拠した下線スタイル（underline）を標準とし、同一画面内でのパネル切り替えを担います。
 */
import { computed, nextTick, ref, useId, useSlots } from 'vue'

import type { TabOption, TabsProps } from '~/types/components'

const model = defineModel<T>({ required: true })

const props = withDefaults(
  defineProps<TabsProps<T>>(),
  {
    panelClass: '',
    keepAlive: false,
  },
)

const emit = defineEmits<{
  (e: 'change', value: T): void
}>()

const slots = useSlots()
const baseId = useId()

// パネルスロットが存在するかどうかを判定（存在する場合のみ tabpanel 領域を描画）
const hasPanelSlots = computed(() => {
  const slotKeys = Object.keys(slots)

  return slotKeys.some(key => key !== 'tab')
})

const buttonRefs = ref<HTMLButtonElement[]>([])

const setButtonRef = (el: unknown, index: number) => {
  if (el) {
    buttonRefs.value[index] = el as HTMLButtonElement
  }
}

const selectTab = (option: TabOption<T>) => {
  if (option.disabled || model.value === option.value) return
  model.value = option.value
  emit('change', option.value)
}

// キーボードナビゲーション（左右・上下矢印キー、Home, End）
const handleKeydown = (event: KeyboardEvent, currentIndex: number) => {
  const enabledOptions = props.options.filter(opt => !opt.disabled)

  if (enabledOptions.length <= 1) return

  let targetOption: TabOption<T> | undefined

  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown': {
      event.preventDefault()
      // 次の有効なタブを探す
      let nextIdx = (currentIndex + 1) % props.options.length

      while (props.options[nextIdx]?.disabled) {
        nextIdx = (nextIdx + 1) % props.options.length
      }
      targetOption = props.options[nextIdx]
      break
    }
    case 'ArrowLeft':
    case 'ArrowUp': {
      event.preventDefault()
      // 前の有効なタブを探す
      let prevIdx = (currentIndex - 1 + props.options.length) % props.options.length

      while (props.options[prevIdx]?.disabled) {
        prevIdx = (prevIdx - 1 + props.options.length) % props.options.length
      }
      targetOption = props.options[prevIdx]
      break
    }
    case 'Home': {
      event.preventDefault()
      targetOption = props.options.find(opt => !opt.disabled)
      break
    }
    case 'End': {
      event.preventDefault()
      targetOption = [...props.options].reverse().find(opt => !opt.disabled)
      break
    }
  }

  if (targetOption) {
    selectTab(targetOption)
    nextTick(() => {
      const activeBtnIndex = props.options.findIndex(opt => opt.value === targetOption?.value)

      if (activeBtnIndex !== -1 && buttonRefs.value[activeBtnIndex]) {
        buttonRefs.value[activeBtnIndex].focus()
      }
    })
  }
}
</script>

<template>
  <div class="tabs-container flex flex-col gap-4 w-full">
    <!-- タブヘッダーリスト -->
    <div class="overflow-x-auto pb-0.5">
      <nav class="tabs inline-flex items-center gap-1 min-w-full">
        <button
          v-for="(option, index) in options"
          :id="`tab-${baseId}-${option.value}`"
          :key="String(option.value)"
          :ref="(el) => setButtonRef(el, index)"
          type="button"
          :tabindex="model === option.value ? 0 : -1"
          :disabled="option.disabled"
          class="relative z-[1] flex items-center justify-center gap-2 tabs__item"
          :class="{
            'is-active': model === option.value,
          }"
          @click="selectTab(option)"
          @keydown="handleKeydown($event, index)"
        >
          <slot name="tab" :option="option" :is-active="model === option.value">
            <Icon v-if="option.icon" :name="option.icon" class="w-4 h-4 shrink-0" />
            <span>{{ option.label }}</span>
            <Badge
              v-if="option.badge !== undefined"
              :id="option.badgeVariant"
              class="ml-1"
            >
              {{ option.badge }}
            </Badge>
          </slot>
        </button>
      </nav>
    </div>

    <!-- コンテンツパネル -->
    <div
      v-if="hasPanelSlots"
      :id="`panel-${baseId}-${model}`"
      tabindex="0"
      class="tabs__panel flex-1 min-h-0 focus:outline-none"
      :class="panelClass"
    >
      <KeepAlive v-if="keepAlive">
        <div :key="String(model)" class="h-full">
          <slot :name="String(model)" :active-tab="model">
            <!-- 名前付きスロットが指定されていない場合はデフォルトスロットにフォールバック -->
            <slot :active-tab="model" />
          </slot>
        </div>
      </KeepAlive>
      <template v-else>
        <slot :name="String(model)" :active-tab="model">
          <!-- 名前付きスロットが指定されていない場合はデフォルトスロットにフォールバック -->
          <slot :active-tab="model" />
        </slot>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tabs {
  border-bottom: var(--border-width-base) solid var(--color-border);
}

.tabs__item {
  cursor: pointer;
  user-select: none;

  margin-bottom: -1px;
  padding: 0.5em 0.9em;
  border-bottom: var(--border-width-thick, 2px) solid transparent;

  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);

  transition: var(--transition-interactive);

  &:hover:not(:disabled, .is-active) {
    color: var(--color-text-main);
    background:
      linear-gradient(
        to bottom,
        color-mix(in srgb, var(--color-overlay) 6%, transparent) 0%,
        transparent 100%
      );
  }

  &:focus-visible {
    outline: none;
    box-shadow: var(--shadow-glow-focus);
  }

  &.is-active {
    border-bottom-color: transparent;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-main);
    background:
      linear-gradient(
        to top,
        color-mix(in srgb, var(--theme-accent) 8%, transparent) 0%,
        transparent 70%
      );

    &::after {
      content: "";

      position: absolute;
      right: 0;
      bottom: -1px;
      left: 0;

      height: var(--border-width-thick, 2px);

      background:
        linear-gradient(
          90deg,
          transparent 0%,
          var(--theme-accent) 20%,
          var(--theme-accent) 80%,
          transparent 100%
        );
      box-shadow: var(--shadow-glow-sm);
    }
  }

  @include state-disabled;
}
</style>
