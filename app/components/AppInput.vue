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
  // ① パディング用のローカル変数
  --form-control-px: var(--space-4);
  --form-control-py: var(--space-2);

  // ② ベースのスタイルとタイポグラフィ
  // ※もしサイバー感の演出ならtext-monoでもOKですが、通常は以下がおすすめです
  @include text-desc;
  
  width: 100%;
  padding: var(--form-control-py) var(--form-control-px);
  color: var(--color-text-main); // 💡 入力文字はハッキリした色に！

  // ③ 外部Mixin
  @include form-control-base;
  @include form-placeholder; // 💡 疑似要素(&::placeholder)はMixinに内包されているので直接呼ぶ

  // ④ サイズバリエーション
  &--sm {
    --form-control-px: var(--space-3);
    --form-control-py: var(--space-1);

    @include text-meta;
    height: var(--size-control-sm);
  }

  &--md {
    height: var(--size-control-md);
  }

  // ⑤ Textarea固有のオーバーライド
  &--textarea {
    resize: vertical;
    min-height: calc(var(--size-control-md) * 2);

    // smやmdクラスが付いていても、textareaの場合は高さを固定せずautoにする
    &:is(.c-form-control--sm, .c-form-control--md) {
      height: auto;
    }

    &:disabled {
      resize: none;
    }
  }
}
</style>
