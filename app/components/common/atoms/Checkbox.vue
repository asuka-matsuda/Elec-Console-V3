<script setup lang="ts">
/**
 * Checkbox
 * Geist デザインシステム準拠のチェックボックスコンポーネント（Atoms）。
 * 二値（checked / unchecked）および不確定（indeterminate）状態に対応します。
 */
import { computed, onMounted, ref, useId, watch } from 'vue'

import type { CheckboxProps } from '~/types/components'

const model = defineModel<boolean | (string | number | boolean)[]>()

const {
  id,
  value,
  label,
  disabled = false,
  error = false,
  indeterminate = false,
  color,
  title,
} = defineProps<CheckboxProps>()

const emit = defineEmits<{
  change: [value: boolean | (string | number | boolean)[] | undefined]
}>()

const defaultId = useId()
const checkboxId = computed(() => id || defaultId)
const inputRef = ref<HTMLInputElement | null>(null)

const handleChange = () => {
  if (disabled) return
  emit('change', model.value)
}

// ネイティブ input 要素の indeterminate プロパティと同期
const syncIndeterminate = () => {
  if (inputRef.value) {
    inputRef.value.indeterminate = Boolean(indeterminate)
  }
}

onMounted(syncIndeterminate)
watch(() => indeterminate, syncIndeterminate)

const customStyle = computed(() => {
  if (color) {
    return { '--control-checked-bg': color }
  }

  return undefined
})
</script>

<template>
  <label class="relative inline-flex items-center gap-item-gap checkbox" :class="{ 'is-disabled': disabled, 'is-error': error, 'is-indeterminate': indeterminate }" :style="customStyle" :title="title">
    <input :id="checkboxId" ref="inputRef" v-model="model" type="checkbox" :value="value" :disabled="disabled" @change="handleChange">
    <span class="grid shrink-0 place-items-center box">
      <Icon :name="indeterminate ? 'minus' : 'check'" class="icon" />
    </span>
    <span v-if="label || $slots.default" class="label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.checkbox {
  --control-checked-bg: var(--theme-accent);
  --glow-color: var(--theme-accent, var(--color-category-main));

  @include control-glow-tokens;

  font-size: inherit;
  color: var(--color-text-main);
  letter-spacing: var(--tracking-normal);

  @include state-interactive;

  &.is-error {
    --glow-color: var(--color-status-danger);
    --control-checked-bg: var(--color-status-danger);

    .box {
      border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
    }
  }

  &:hover:not(.is-disabled) .box {
    border-color: var(--control-checked-bg);
    box-shadow: var(--shadow-glow-hover);
  }

  input {
    pointer-events: none;

    position: absolute;

    width: 0;
    height: 0;

    opacity: 0;

    &:focus-visible ~ .box {
      border-color: var(--control-checked-bg);
      box-shadow: var(--shadow-glow-focus);
    }

    &:active ~ .box {
      box-shadow: var(--shadow-glow-active);
    }

    &:checked ~ .box,
    &:indeterminate ~ .box {
      border-color: var(--control-checked-bg);
      background-color: var(--control-checked-bg);
      box-shadow: var(--shadow-glow-active);

      .icon {
        transform: scale(1);
        opacity: 1;
      }
    }
  }

  .box {
    width: 1.125rem;
    height: 1.125rem;
    border: var(--border-width-base) solid var(--color-border);
    border-radius: 0; // 直角規約

    background-color: var(--surface-bg-elevated);

    transition: var(--transition-interactive);
  }

  .icon {
    transform: scale(0.4);

    grid-area: 1 / 1;

    width: 0.875rem;
    height: 0.875rem;

    color: var(--control-checked-icon);

    opacity: 0;

    transition:
      transform var(--duration-fast) var(--ease-spring),
      opacity var(--duration-fast) var(--ease-base);
  }

  .label {
    user-select: text;
  }

  @include state-disabled;
}
</style>
