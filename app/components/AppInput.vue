<script setup lang="ts">
/**
 * AppInput
 * テキスト入力やテキストエリアを提供するフォームコントロールコンポーネントです。
 */
import { useId } from 'vue'

const model = defineModel<string | number | null>()

withDefaults(
  defineProps<{
    type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url' | 'textarea'
    placeholder?: string
    disabled?: boolean
    error?: boolean
    size?: 'sm' | 'md'
    rows?: number
  }>(),
  {
    type: 'text',
    size: 'md',
    rows: 4,
  },
)

const inputId = useId()
</script>

<template>
  <textarea
    v-if="type === 'textarea'"
    :id="inputId"
    v-model="model"
    class="c-form-control c-form-control--textarea"
    :class="[`c-form-control--${size}`, { 'is-error': error }]"
    :placeholder="placeholder"
    :disabled="disabled"
    :rows="rows"
  />
  <input
    v-else
    :id="inputId"
    v-model="model"
    :type="type"
    class="c-form-control"
    :class="[`c-form-control--${size}`, { 'is-error': error }]"
    :placeholder="placeholder"
    :disabled="disabled"
  />
</template>

<style scoped lang="scss">
.c-form-control {
  @include text-desc;
  
  width: 100%;
  
  // AppButtonと同様にem単位を使用し、フォントサイズに合わせて箱のサイズが自動可変するように
  min-height: 2.6em;
  padding-block: 0.3em;
  padding-inline: 1.2em;

  color: var(--color-text-main);

  @include form-control-base;
  @include form-placeholder;

  &--sm {
    @include text-meta;
    // フォントサイズが下がることで、em指定の高さ・余白も自動的に縮小されます
  }

  &--md {
    // デフォルト（text-desc）のフォントサイズのまま自動計算されます
  }

  &--textarea {
    resize: vertical;
    // textareaは文字行数に応じて最低限の高さを確保（2行分相当）
    min-height: 5.2em;

    &:disabled {
      resize: none;
    }
  }
}
</style>
