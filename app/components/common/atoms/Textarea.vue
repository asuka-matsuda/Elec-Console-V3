<script setup lang="ts">
/**
 * Textarea
 * Geist デザインシステム準拠の複数行テキスト入力コンポーネント。
 * コミットメッセージ、説明文、備考等の長文入力に使用します。
 */
import { computed, ref, useId } from 'vue'

import type { TextareaProps } from '~/types/components'

const model = defineModel<string | null>()

const {
  id,
  name,
  size = 'md',
  rows = 4,
  resize = 'vertical',
  autoResize = false,
  trim = false,
  placeholder,
  disabled = false,
  readonly = false,
  error = false,
  maxlength,
  title,
} = defineProps<TextareaProps>()

const emit = defineEmits<{
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  change: [event: Event]
}>()

const defaultId = useId()
const textareaId = computed(() => id || defaultId)

const textareaRef = ref<HTMLTextAreaElement | null>(null)

const isError = computed(() => Boolean(error))

const resizeClass = computed(() => {
  if (autoResize) {
    return 'resize-none'
  }

  switch (resize) {
    case 'none':
      return 'resize-none'
    case 'horizontal':
      return 'resize-x'
    case 'both':
      return 'resize'
    case 'vertical':
    default:
      return 'resize-y'
  }
})

const handleBlur = (event: FocusEvent) => {
  if (trim && typeof model.value === 'string') {
    model.value = model.value.trim()
  }

  emit('blur', event)
}

const handleChange = (event: Event) => {
  if (trim && typeof model.value === 'string') {
    model.value = model.value.trim()
  }

  emit('change', event)
}

defineExpose({
  /** textarea 要素へのフォーカス */
  focus: (options?: FocusOptions) => textareaRef.value?.focus(options),
  /** textarea 要素のフォーカス解除 */
  blur: () => textareaRef.value?.blur(),
  /** 入力テキストの全選択 */
  select: () => textareaRef.value?.select(),
  /** textarea DOM 要素本体 */
  textareaRef,
})
</script>

<template>
  <textarea :id="textareaId" ref="textareaRef" v-model="model" :name="name" :rows="rows" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" :maxlength="maxlength" :title="title" class="form-control relative z-[1] focus:z-[2] w-full" :class="[`textarea--${size}`, { 'is-error': isError, 'is-auto-resize': autoResize }, resizeClass]" @blur="handleBlur" @focus="emit('focus', $event)" @change="handleChange" />
</template>

<style scoped lang="scss">
.form-control {
  --glow-color: var(--theme-accent, var(--color-category-main));

  @include control-glow-tokens;

  resize: vertical;

  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0;

  font-family: inherit;
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-base);
  color: var(--color-text-main);

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-interactive);

  // --- Sizes ---
  &.textarea--sm {
    min-height: calc(var(--control-height-ratio) * 2.8em);
    padding-block: 0.35em;
    padding-inline: 0.8em;
    font-size: var(--font-size-xs);
  }

  &.textarea--md {
    min-height: calc(var(--control-height-ratio) * 3.5em);
    padding-block: 0.5em;
    padding-inline: 1em;
    font-size: var(--font-size-sm);
  }

  &.textarea--lg {
    min-height: calc(var(--control-height-ratio) * 4.2em);
    padding-block: 0.65em;
    padding-inline: 1.2em;
    font-size: var(--font-size-base);
  }

  &.is-error {
    --glow-color: var(--color-status-danger);

    border-color: color-mix(in srgb, var(--glow-color) 60%, transparent);
  }

  &:hover {
    border-color: var(--glow-color);
    box-shadow: var(--shadow-glow-hover);
  }

  &:active {
    border-color: var(--glow-color);
    box-shadow: var(--shadow-glow-active);
  }

  &:focus,
  &:focus-visible {
    border-color: color-mix(in srgb, var(--glow-color) 70%, transparent);
    outline: none;
    box-shadow: var(--shadow-glow-focus);
  }

  &:is(:read-only, .is-readonly) {
    cursor: default;
    resize: none;
    border-style: dashed;
    opacity: 0.85;
  }

  &::placeholder {
    color: color-mix(in srgb, var(--color-text-muted) 50%, transparent);
    opacity: 1;
  }

  &.is-auto-resize {
    resize: none;
    field-sizing: content;
    min-height: calc(var(--control-height-ratio) * 1.3em);
    padding-block: 0.35em;
  }

  @include state-disabled;
}
</style>
