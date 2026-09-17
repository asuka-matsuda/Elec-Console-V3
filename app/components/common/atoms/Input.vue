<script setup lang="ts">
import { computed, inject, ref, useAttrs } from 'vue'

import type { InputProps } from '~/types/components'
import { FORM_GROUP_KEY } from '~/types/components'

defineOptions({
  inheritAttrs: false,
})

const model = defineModel<string | number | null>()

/**
 * Input
 * テキスト入力や数値入力を提供する最小フォームコントロールコンポーネントです。
 */
const props = withDefaults(defineProps<InputProps>(), {
  type: 'text',
  disabled: false,
  readonly: false,
  error: false,
  required: false,
  clearable: true,
  passwordToggle: true,
})

const emit = defineEmits<{
  (e: 'enter', event: KeyboardEvent): void
  (e: 'clear'): void
  (e: 'focus' | 'blur', event: FocusEvent): void
}>()

const attrs = useAttrs()

const rootAttrs = computed(() => {
  const { class: className, style } = attrs

  return { class: className, style }
})

const inputAttrs = computed(() => {
  const { class: _c, style: _s, ...rest } = attrs

  return rest
})

const formGroup = inject(FORM_GROUP_KEY, null)
const inputId = computed(() => props.id || formGroup?.id.value)
const isError = computed(() => props.error || (formGroup?.hasError.value ?? false))

// 親コンポーネントからのフォーカス操作用 Ref
const inputRef = ref<HTMLInputElement | null>(null)

// パスワード表示トグル状態
const showPassword = ref(false)
const computedType = computed(() => {
  if (props.type === 'password' && showPassword.value) {
    return 'text'
  }

  return props.type
})

// クリアボタン & パスワードトグル表示判定
const isDateTime = computed(() => ['date', 'datetime-local', 'time'].includes(props.type || ''))
const canClear = computed(() => {
  return (
    props.clearable
    && !props.disabled
    && !props.readonly
    && !isDateTime.value
    && model.value !== ''
    && model.value !== null
    && model.value !== undefined
  )
})
const canTogglePassword = computed(() => {
  return props.type === 'password' && props.passwordToggle && !props.disabled
})
const hasActions = computed(() => canClear.value || canTogglePassword.value)

// マウスホイール誤爆防止 (type="number" 時のスクロール値変化を遮断)
const handleWheel = (e: WheelEvent) => {
  if (props.type === 'number') {
    (e.target as HTMLElement)?.blur()
  }
}

// クリア実行
const handleClear = () => {
  model.value = props.type === 'number' ? null : ''
  emit('clear')
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
  <div
    class="relative flex items-center w-full min-w-0 input-container"
    :class="rootAttrs.class"
    :style="rootAttrs.style"
  >
    <input
      :id="inputId"
      ref="inputRef"
      v-model="model"
      v-bind="inputAttrs"
      :type="computedType"
      :name="name"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      :min="min"
      :max="max"
      :step="step"
      :maxlength="maxlength"
      :inputmode="inputmode"
      :autocomplete="autocomplete"
      class="form-control relative z-[1] focus:z-[2] w-full"
      :class="[
        { 'is-error': isError },
        canClear && canTogglePassword ? 'pr-16' : (hasActions ? 'pr-9' : ''),
      ]"
      @wheel="handleWheel"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
      @keydown.enter="emit('enter', $event)"
    />

    <!-- 右端のアクションボタングループ -->
    <div
      v-if="hasActions"
      class="absolute right-2 z-[3] flex items-center gap-1 action-group"
    >
      <!-- クリアボタン -->
      <button
        v-if="canClear"
        type="button"
        tabindex="-1"
        class="action-btn flex items-center justify-center"
        title="クリア"
        @mousedown.prevent
        @click.stop="handleClear"
      >
        <Icon name="x" class="w-3.5 h-3.5" />
      </button>

      <!-- パスワード表示トグルボタン -->
      <button
        v-if="canTogglePassword"
        type="button"
        tabindex="-1"
        class="action-btn flex items-center justify-center"
        :title="showPassword ? 'パスワードを隠す' : 'パスワードを表示'"
        @mousedown.prevent
        @click.stop="showPassword = !showPassword"
      >
        <Icon :name="showPassword ? 'eye-off' : 'eye'" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-control {
  padding-block: 0.3em;
  padding-inline: 1.2em;

  @include form-control-base;

  &::-webkit-search-cancel-button {
    appearance: none;
  }
}

.action-group {
  color: var(--color-text-muted);
}

.action-btn {
  cursor: pointer;

  padding: 0.2em;
  border: none;

  color: inherit;

  background: transparent;

  transition: var(--transition-fast);

  &:hover {
    color: var(--color-text-main);
  }

  &:active {
    transform: scale(0.92);
  }
}
</style>
