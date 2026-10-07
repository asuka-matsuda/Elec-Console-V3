<script setup lang="ts">
/**
 * Collapse (Geist準拠)
 * [Molecules] ヘッダーをクリックしてコンテンツを折りたたみ・展開するアコーディオンコンポーネント。
 * - Geist公式仕様準拠: タイトル・サブタイトル・前置アイコン・右側拡張スロット、滑らかなCSS Grid高さアニメーション
 * - 単体動作および CollapseGroup による排他制御（アコーディオン）の両対応
 * - 直角（border-radius: 0）サイバーサーフェス
 * - 支援アクセシビリティ属性（aria-*, role）はプロジェクト規約により除外
 */
import { computed, getCurrentInstance, inject, ref, watch } from 'vue'

import {
  COLLAPSE_GROUP_KEY,
  type CollapseGroupContext,
  type CollapseProps,
} from '~/types/components'

const props = withDefaults(defineProps<CollapseProps>(), {
  title: '',
  subtitle: '',
  modelValue: undefined,
  defaultOpen: false,
  disabled: false,
  bordered: true,
  card: false,
  value: undefined,
})

const emit = defineEmits<{
  (e: 'update:modelValue', open: boolean): void
  (e: 'change', open: boolean): void
}>()

// 親グループのコンテキスト取得
const group = inject<CollapseGroupContext | null>(COLLAPSE_GROUP_KEY, null)

// 一意識別子の解決（props.value がない場合はコンポーネントuid）
const instance = getCurrentInstance()
const itemKey = computed<string | number>(() => props.value ?? `collapse-${instance?.uid ?? Math.random()}`)

// 単体時の内部状態
const internalOpen = ref<boolean>(props.modelValue ?? props.defaultOpen)

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== undefined) {
      internalOpen.value = newVal
    }
  },
)

// 現在の開閉状態（グループが存在する場合はグループの状態を優先）
const isOpen = computed<boolean>(() => {
  if (group) {
    return group.isItemOpen(itemKey.value)
  }

  return props.modelValue !== undefined ? props.modelValue : internalOpen.value
})

const toggle = () => {
  if (props.disabled) return

  if (group) {
    group.toggleItem(itemKey.value)
  }
  else {
    const nextState = !isOpen.value

    internalOpen.value = nextState
    emit('update:modelValue', nextState)
    emit('change', nextState)
  }
}

// 境界線やカードの適用（グループ内ならグループ側の設定を継承）
const effectiveBordered = computed(() => {
  if (group) {
    return !group.bordered && props.bordered
  }

  return props.bordered
})

const effectiveCard = computed(() => {
  if (group) {
    return false
  }

  return props.card
})
</script>

<template>
  <div
    class="collapse-item flex flex-col"
    :class="[
      {
        'is-open': isOpen,
        'is-disabled': disabled,
        'is-bordered': effectiveBordered,
        'is-card': effectiveCard,
        'is-in-group': Boolean(group),
      },
    ]"
  >
    <button
      type="button"
      class="collapse-header flex items-center justify-between gap-item-gap w-full text-left"
      :disabled="disabled"
      @click="toggle"
    >
      <div class="flex items-center gap-item-gap min-w-0 flex-1">
        <Icon v-if="icon || $slots.icon" :name="icon || 'folder'" size="sm" class="collapse-icon shrink-0" />
        <div class="flex flex-col min-w-0 flex-1">
          <div class="collapse-title flex items-center gap-inline-gap min-w-0">
            <slot name="title">{{ title }}</slot>
          </div>
          <div v-if="subtitle || $slots.subtitle" class="collapse-subtitle">
            <slot name="subtitle">{{ subtitle }}</slot>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-item-gap shrink-0">
        <slot name="extra" />
        <Icon name="chevron-down" size="sm" class="collapse-chevron" />
      </div>
    </button>

    <div class="collapse-content" :class="{ 'is-open': isOpen }">
      <div class="collapse-content-inner">
        <div class="collapse-body">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.collapse-item {
  visibility: visible;
  width: 100%;
  border-radius: 0;
  transition: var(--transition-base);

  &.is-bordered:not(.is-in-group) {
    border: var(--border-width-base) solid var(--color-border);
  }

  &.is-in-group {
    border-bottom: var(--border-width-base) solid var(--color-border);

    &:last-child {
      border-bottom: none;
    }
  }

  &.is-card {
    border: var(--border-width-base) solid var(--color-border);
    background-color: var(--surface-bg);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: var(--opacity-disabled);
  }
}

.collapse-header {
  cursor: pointer;

  padding: var(--space-item-gap) var(--space-panel-gap);
  border: none;

  color: var(--color-text-main);

  background-color: transparent;
  outline: none;

  transition: var(--transition-interactive);

  &:hover:not(:disabled) {
    background-color: var(--color-bg-hover);

    .collapse-title {
      color: var(--theme-accent);
    }
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--theme-accent);
  }
}

.collapse-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-main);
  transition: var(--transition-interactive);
}

.collapse-subtitle {
  margin-top: 2px;
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.collapse-icon {
  color: var(--color-text-muted);
}

.collapse-chevron {
  color: var(--color-text-muted);
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  .collapse-item.is-open & {
    transform: rotate(180deg);
  }
}

.collapse-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s cubic-bezier(0.16, 1, 0.3, 1);

  &.is-open {
    grid-template-rows: 1fr;
  }
}

.collapse-content-inner {
  overflow: hidden;
}

.collapse-body {
  padding: var(--space-item-gap) var(--space-panel-gap) var(--space-panel-gap);
  border-top: var(--border-width-base) solid var(--color-border-subtle, var(--color-border));
  color: var(--color-text-secondary);
}
</style>
