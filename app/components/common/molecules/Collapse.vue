<script setup lang="ts">
/**
 * Collapse (Geist準拠)
 * [Molecules] ヘッダーをクリックしてコンテンツを折りたたみ・展開するアコーディオンコンポーネント。
 * - Geist公式仕様準拠: タイトル・サブタイトル・前置アイコン・右側拡張スロット、滑らかなCSS Grid高さアニメーション
 * - 単体動作および CollapseGroup による排他制御（アコーディオン）の両対応
 * - 直角（border-radius: 0）サイバーサーフェス
 * - 支援アクセシビリティ属性（aria-*, role）はプロジェクト規約により除外
 */
import { computed, getCurrentInstance, inject, ref } from 'vue'

import {
  COLLAPSE_GROUP_KEY,
  type CollapseGroupContext,
  type CollapseProps,
} from '~/types/components'

// v-model バインディング (Vue 3.4+)
const modelValue = defineModel<boolean | null>('modelValue')

const props = withDefaults(defineProps<Omit<CollapseProps, 'modelValue'>>(), {
  title: '',
  subtitle: '',
  defaultOpen: false,
  disabled: false,
  bordered: true,
  card: false,
})

const emit = defineEmits<{
  (e: 'change', open: boolean): void
}>()

// 親グループのコンテキスト取得
const group = inject<CollapseGroupContext | null>(COLLAPSE_GROUP_KEY, null)

// 一意識別子の解決（props.value がない場合はコンポーネントuid）
const instance = getCurrentInstance()
const itemKey = computed<string | number>(() => props.value ?? `collapse-${instance?.uid ?? Math.random()}`)

// 親からの v-model / modelValue バインディング有無の判定
const hasModelValueBinding = computed(() => {
  const vProps = instance?.vnode.props

  return Boolean(vProps && ('modelValue' in vProps || 'onUpdate:modelValue' in vProps))
})

// 非制御時のローカル状態（初期値: defaultOpen）
const localOpen = ref<boolean>(props.defaultOpen)

// 現在の開閉状態（グループが存在する場合はグループの状態を優先）
const isOpen = computed<boolean>(() => {
  if (group) {
    return group.isItemOpen(itemKey.value)
  }

  if (hasModelValueBinding.value) {
    return Boolean(modelValue.value)
  }

  return localOpen.value
})

const toggle = () => {
  if (props.disabled) return

  if (group) {
    group.toggleItem(itemKey.value)
  }
  else {
    const nextState = !isOpen.value

    localOpen.value = nextState
    modelValue.value = nextState
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
        <Icon v-if="icon || $slots.icon" :name="icon || 'folder'" size="sm" class="collapse-icon" />
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

    <div class="collapse-content grid transition-all duration-200" :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
      <div class="overflow-hidden">
        <div class="collapse-body">
          <slot />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.collapse-item {
  width: 100%;
  border-radius: 0;
  visibility: visible;
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
    @include state-disabled;
  }
}

.collapse-header {
  padding: var(--space-item-gap) var(--space-panel-gap);
  border: none;

  color: var(--color-text-main);

  background-color: transparent;
  outline: none;

  transition: var(--transition-interactive);

  @include state-interactive;

  &:hover:not(:disabled) {
    background-color: var(--color-bg-hover);

    .collapse-title {
      color: var(--theme-accent);
    }
  }

  &:focus-visible {
    box-shadow: var(--shadow-glow-focus);
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

.collapse-body {
  padding: var(--space-item-gap) var(--space-panel-gap) var(--space-panel-gap);
  border-top: var(--border-width-base) solid var(--color-border-subtle, var(--color-border));
  color: var(--color-text-secondary);
}
</style>
