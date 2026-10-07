<script setup lang="ts">
/**
 * CollapseGroup (Geist準拠)
 * [Molecules] 複数の Collapse コンポーネントを包括し、状態同期やアコーディオン排他制御を提供するコンテナ。
 * - Geist公式仕様準拠: アコーディオン排他モード、境界線、カードスタイル
 * - provide / inject による子 Collapse との完全同期
 * - 直角（border-radius: 0）サイバーサーフェス
 * - 支援アクセシビリティ属性（aria-*, role）はプロジェクト規約により除外
 */
import { computed, provide, ref, watch } from 'vue'

import {
  COLLAPSE_GROUP_KEY,
  type CollapseGroupContext,
  type CollapseGroupProps,
} from '~/types/components'

const props = withDefaults(defineProps<CollapseGroupProps>(), {
  accordion: false,
  bordered: true,
  card: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue' | 'change', val: string | number | (string | number)[]): void
}>()

// 内部状態（非制御または制御下）
const internalValue = ref<string | number | (string | number)[]>(
  props.modelValue ?? (props.accordion ? '' : []),
)

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== undefined) {
      internalValue.value = newVal
    }
  },
)

const activeKeys = computed<Set<string | number>>(() => {
  const val = props.modelValue !== undefined ? props.modelValue : internalValue.value

  if (Array.isArray(val)) {
    return new Set(val)
  }
  if (val !== undefined && val !== null && val !== '') {
    return new Set([val])
  }

  return new Set()
})

const isItemOpen = (val: string | number): boolean => {
  return activeKeys.value.has(val)
}

const toggleItem = (val: string | number) => {
  let nextValue: string | number | (string | number)[]

  if (props.accordion) {
    nextValue = isItemOpen(val) ? '' : val
  }
  else {
    const set = new Set(activeKeys.value)

    if (set.has(val)) {
      set.delete(val)
    }
    else {
      set.add(val)
    }
    nextValue = Array.from(set)
  }

  internalValue.value = nextValue
  emit('update:modelValue', nextValue)
  emit('change', nextValue)
}

provide<CollapseGroupContext>(COLLAPSE_GROUP_KEY, {
  isItemOpen,
  toggleItem,
  bordered: props.bordered,
  card: props.card,
})
</script>

<template>
  <div class="collapse-group flex flex-col" :class="[{ 'is-bordered': bordered, 'is-card': card }]">
    <slot />
  </div>
</template>

<style scoped lang="scss">
.collapse-group {
  width: 100%;
  border-radius: 0;

  &.is-bordered {
    border: var(--border-width-base) solid var(--color-border);
  }

  &.is-card {
    background-color: var(--surface-bg);
  }
}
</style>
