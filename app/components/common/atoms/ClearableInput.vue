<script setup lang="ts">
/**
 * ClearableInput
 * Geist デザインシステム準拠のクリアボタン付き1行テキスト入力コンポーネント（Atoms）。
 * - 3段階のサイズ展開（sm: 32px, md: 40px [デフォルト], lg: 48px）
 * - 値が存在する時のみインラインのクリアボタン（×アイコン）を表示
 * - クリア実行後も input 要素へのフォーカスを自動維持（作業の中断を防止）
 * - 完全直角規約（border-radius: 0）およびフォーカス発光トークン
 */
import { computed, ref, useId } from 'vue'

import type { ClearableInputProps } from '~/types/components'

const [model, modifiers] = defineModel<string | number | null>({
  set(value) {
    if (modifiers.number || type === 'number') {
      if (value === '' || value === null || value === undefined) return null

      const n = Number(value)

      return isNaN(n) ? value : n
    }

    return value
  },
})

const {
  id,
  name,
  type = 'text',
  placeholder,
  size = 'md',
  disabled = false,
  readonly = false,
  error = false,
  icon,
  prefix,
  suffix,
  trim = false,
  clearTitle = '入力をクリア',
  min,
  max,
  step,
  inputmode,
  autocomplete,
  maxlength,
  title,
} = defineProps<ClearableInputProps>()

const emit = defineEmits<{
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  change: [event: Event]
  clear: []
}>()

const defaultId = useId()
const inputId = computed(() => id || defaultId)
const isFocused = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const hasValue = computed(() => {
  if (model.value === null || model.value === undefined) return false

  return String(model.value).length > 0
})

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false

  if (trim && typeof model.value === 'string') {
    model.value = model.value.trimEnd()
  }

  emit('blur', event)
}

const handleClear = () => {
  if (disabled || readonly) return

  model.value = ''
  emit('clear')

  // Geist 仕様: クリア後も即座に入力を継続できるようフォーカスを維持
  inputRef.value?.focus()
}

defineExpose({
  /** input 要素へのフォーカス */
  focus: (options?: FocusOptions) => inputRef.value?.focus(options),
  /** input 要素のフォーカス解除 */
  blur: () => inputRef.value?.blur(),
  /** 入力テキストの全選択 */
  select: () => inputRef.value?.select(),
  /** input DOM 要素本体 */
  inputRef,
})
</script>

<template>
  <div class="input-container flex items-center" :class="[`input--${size}`, { 'is-focused': isFocused, 'is-disabled': disabled, 'is-readonly': readonly, 'is-error': error }]" :title="title">
    <span v-if="icon || prefix || $slots.prefix" class="input-affix input-prefix inline-flex items-center shrink-0">
      <Icon v-if="icon" :name="icon" class="affix-icon" />
      <slot name="prefix">{{ prefix }}</slot>
    </span>

    <input :id="inputId" ref="inputRef" v-model="model" :type="type" :name="name" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" :min="min" :max="max" :step="step" :inputmode="inputmode" :autocomplete="autocomplete" :maxlength="maxlength" class="form-control input-native flex-1" :class="{ 'is-disabled': disabled, 'is-readonly': readonly, 'is-error': error }" @blur="handleBlur" @focus="handleFocus" @change="emit('change', $event)">

    <button v-if="hasValue && !disabled && !readonly" type="button" class="clear-btn inline-flex items-center justify-center shrink-0" :title="clearTitle" tabindex="-1" @mousedown.prevent @click.stop="handleClear">
      <Icon name="x" class="clear-icon" />
    </button>

    <span v-if="suffix || $slots.suffix" class="input-affix input-suffix inline-flex items-center shrink-0">
      <slot name="suffix">{{ suffix }}</slot>
    </span>
  </div>
</template>

<style scoped lang="scss">
.input-container {
  --input-height: 2.5rem; // md: 40px
  --input-font-size: var(--font-size-sm);
  --input-padding-x: var(--space-3);
  --input-affix-gap: var(--space-2);
  --glow-color: var(--theme-accent, var(--color-category-main));

  @include control-glow-tokens;

  position: relative;

  width: 100%;
  min-width: 0;
  height: var(--input-height);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0; // 直角規約

  font-family: inherit;
  font-size: var(--input-font-size);
  color: var(--color-text-main);

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-interactive);

  // --- サイズ展開 (Geist準拠: sm 32px / md 40px / lg 48px) ---
  &.input--sm {
    --input-height: 2rem; // 32px
    --input-font-size: var(--font-size-xs);
    --input-padding-x: var(--space-2);
    --input-affix-gap: var(--space-1);
  }

  &.input--md {
    --input-height: 2.5rem; // 40px
    --input-font-size: var(--font-size-sm);
    --input-padding-x: var(--space-3);
    --input-affix-gap: var(--space-2);
  }

  &.input--lg {
    --input-height: 3rem; // 48px
    --input-font-size: var(--font-size-base);
    --input-padding-x: var(--space-4);
    --input-affix-gap: var(--space-3);
  }

  &:hover:not(.is-disabled) {
    border-color: var(--glow-color);
    box-shadow: var(--shadow-glow-hover);
  }

  &.is-focused {
    border-color: color-mix(in srgb, var(--glow-color) 70%, transparent);
    outline: none;
    box-shadow: var(--shadow-glow-focus);
  }

  &.is-error {
    --glow-color: var(--color-status-danger);

    border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
  }

  &.is-readonly {
    cursor: default;
    border-style: dashed;
    opacity: 0.85;
  }

  @include state-disabled;
}

.input-native {
  width: 100%;
  min-width: 0;
  height: 100%;
  padding-block: 0;
  padding-inline: var(--input-padding-x);
  border: 0;
  border-radius: 0;

  font-family: inherit;
  font-size: inherit;
  font-variant-numeric: tabular-nums;
  color: inherit;

  background: transparent;
  outline: none;
  box-shadow: none;

  &::placeholder {
    color: color-mix(in srgb, var(--color-text-muted) 50%, transparent);
    opacity: 1;
  }

  &::-webkit-search-cancel-button {
    appearance: none;
  }
}

.input-affix {
  user-select: none;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);

  &.input-prefix {
    gap: var(--input-affix-gap);
    padding-left: var(--input-padding-x);

    + .input-native {
      padding-left: var(--input-affix-gap);
    }
  }

  &.input-suffix {
    gap: var(--input-affix-gap);
    padding-right: var(--input-padding-x);
  }
}

.affix-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted);
}

.clear-btn {
  width: 1.25rem;
  height: 1.25rem;
  margin-right: var(--space-2);
  padding: 0;
  border: 0;
  border-radius: var(--radius-circle);

  color: var(--color-text-muted);

  background: color-mix(in srgb, var(--color-text-muted) 15%, transparent);

  transition: var(--transition-interactive);

  @include state-interactive;

  &:hover {
    color: var(--color-text-main);
    background: color-mix(in srgb, var(--color-text-muted) 30%, transparent);
  }

  &:active {
    transform: scale(0.92);
  }
}

.clear-icon {
  width: 0.75rem;
  height: 0.75rem;
}
</style>
