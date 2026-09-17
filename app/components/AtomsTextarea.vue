<script setup lang="ts">
/**
 * AtomsTextarea
 * [Atoms] 複数行のテキスト入力エリアを提供する最小フォームコントロールコンポーネント。
 */
import { computed, inject, ref } from 'vue'

import { FORM_GROUP_KEY } from '~/types/components'

export interface AtomsTextareaProps {
  /** プレースホルダー */
  placeholder?: string
  /** 無効化状態 */
  disabled?: boolean
  /** 読み取り専用 */
  readonly?: boolean
  /** エラー状態フラグ */
  error?: boolean
  /** 必須入力 */
  required?: boolean
  /** 行数 */
  rows?: number
  /** 最大文字数 */
  maxlength?: number
  /** HTML id属性 */
  id?: string
  /** HTML name属性 */
  name?: string
  /** 自動補完 */
  autocomplete?: string
}

const model = defineModel<string | null>()

const props = withDefaults(
  defineProps<AtomsTextareaProps>(),
  {
    disabled: false,
    readonly: false,
    error: false,
    required: false,
    rows: 4,
  },
)

const formGroup = inject(FORM_GROUP_KEY, null)
const textareaId = computed(() => props.id || formGroup?.id.value)
const isError = computed(() => props.error || (formGroup?.hasError.value ?? false))

const textareaRef = ref<HTMLTextAreaElement | null>(null)

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
    :class="{ 'is-error': isError }"
  />
</template>

<style scoped lang="scss">
.form-control {
  resize: vertical;

  min-height: calc(var(--control-height-ratio) * 2em);
  padding-block: 0.5em;
  padding-inline: 1.2em;

  line-height: var(--line-height-base);

  @include form-control-base;

  &:read-only:not(:disabled) {
    resize: none;
  }

  &[disabled] {
    resize: none;
  }
}
</style>
