<script setup lang="ts">
/**
 * Textarea
 * 複数行テキスト入力コンポーネント。
 */
import { computed, ref, useId } from 'vue'

import type { TextareaProps } from '~/types/components'

const model = defineModel<string | null>()

const {
  id,
  name,
  rows = 4,
  resize = 'vertical',
  autoResize = false,
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
  <textarea :id="textareaId" ref="textareaRef" v-model="model" :name="name" :rows="rows" :placeholder="placeholder" :disabled="disabled" :readonly="readonly" :maxlength="maxlength" :title="title" class="form-control relative z-[1] focus:z-[2] w-full" :class="[{ 'is-error': error, 'is-auto-resize': autoResize }, resizeClass]" @blur="emit('blur', $event)" @focus="emit('focus', $event)" @change="emit('change', $event)" />
</template>

<style scoped lang="scss">
.form-control {
  --glow-color: var(--theme-accent, var(--color-category-main));

  @include control-glow-tokens;

  resize: vertical;

  min-height: calc(var(--control-height-ratio) * 2em);
  padding-block: 0.5em;
  padding-inline: 1.2em;
  border: var(--border-width-base) solid var(--color-border);

  font-size: inherit;
  font-variant-numeric: tabular-nums;
  line-height: var(--line-height-base);
  color: var(--color-text-main);

  background-color: var(--surface-bg-elevated);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-interactive);

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
