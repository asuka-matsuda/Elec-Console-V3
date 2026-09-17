<script setup lang="ts">
/**
 * Textarea
 * [Atoms] 複数行のテキスト入力エリアを提供する最小フォームコントロールコンポーネント。
 */
import { computed, inject, ref } from 'vue'

import type { TextareaProps } from '~/types/components'
import { FORM_GROUP_KEY } from '~/types/components'

const model = defineModel<string | null>()

const props = withDefaults(
  defineProps<TextareaProps>(),
  {
    disabled: false,
    readonly: false,
    error: false,
    required: false,
    rows: 4,
    resize: 'vertical',
  },
)

const emit = defineEmits<{
  (e: 'focus' | 'blur', event: FocusEvent): void
  (e: 'submit-shortcut', event: KeyboardEvent): void
}>()

const formGroup = inject(FORM_GROUP_KEY, null)
const textareaId = computed(() => props.id || formGroup?.id.value)
const isError = computed(() => props.error || (formGroup?.hasError.value ?? false))

const textareaRef = ref<HTMLTextAreaElement | null>(null)

// Ctrl+Enter / Cmd+Enter ショートカット
const handleKeydown = (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    emit('submit-shortcut', event)
  }
}

// リサイズクラス
const resizeClass = computed(() => {
  if (props.disabled || props.readonly) {
    return 'resize-none'
  }

  switch (props.resize) {
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
  <textarea
    :id="textareaId"
    ref="textareaRef"
    v-model="model"
    :name="name"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    :rows="rows"
    :maxlength="maxlength"
    :autocomplete="autocomplete"
    class="form-control relative z-[1] focus:z-[2] w-full"
    :class="[
      { 'is-error': isError },
      resizeClass,
    ]"
    @focus="emit('focus', $event)"
    @blur="emit('blur', $event)"
    @keydown="handleKeydown"
  />
</template>

<style scoped lang="scss">
.form-control {
  padding-block: 0.5em;
  padding-inline: 1.2em;
  line-height: var(--line-height-base);

  @include form-control-base(calc(var(--control-height-ratio) * 2em));

  &:read-only:not(:disabled),
  &:disabled,
  &.is-disabled {
    resize: none;
  }
}
</style>
