<script setup lang="ts">
/**
 * FormGroup
 * [Molecules] フォームのラベル、入力項目、エラーメッセージ、ヘルプテキストを統合するグループコンポーネント。
 */
import { computed, provide, useId } from 'vue'

import { FORM_GROUP_KEY, type FormGroupProps } from '~/types/components'

const props = withDefaults(defineProps<FormGroupProps>(), {
  id: undefined,
  label: undefined,
  required: false,
  error: undefined,
  help: undefined,
  helpId: undefined,
})

const defaultId = useId()
const fieldId = computed(() => props.id || defaultId)
const hasError = computed(() => Boolean(props.error))

provide(FORM_GROUP_KEY, {
  id: fieldId,
  hasError,
})
</script>

<template>
  <div class="flex flex-col gap-1.5 form-group" :class="{ 'is-error': hasError }">

    <label
      v-if="label || $slots.label"
      :for="fieldId"
      class="inline-flex items-center gap-1.5 label"
    >
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="req-mark">＊</span>
      <HelpTip v-if="helpId" :help-id="helpId" />
    </label>

    <slot />

    <p v-if="error" class="error m-0">
      {{ error }}
    </p>

    <p v-if="help" class="help m-0">
      {{ help }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.form-group {
  font-size: var(--font-size-sm);

  .label {
    user-select: none;

    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: var(--color-text-main);
    letter-spacing: var(--tracking-wide);

    &::before {
      --glow-color: var(--theme-accent);

      content: '';

      display: inline-block;

      width: var(--space-0-5);
      height: 0.85em;

      background-color: var(--theme-accent);

      transition: var(--transition-fast);
    }
  }

  &:focus-within .label::before {
    transform: scaleY(1.2);
    box-shadow: var(--shadow-glow-sm);
  }

  &.is-error .label {
    color: var(--color-status-danger);

    &::before {
      --glow-color: var(--color-status-danger);

      background-color: var(--color-status-danger);
      box-shadow: var(--shadow-glow-sm);
    }
  }

  .req-mark {
    font-weight: var(--font-weight-bold);
    line-height: 1;
    color: var(--color-status-danger);
  }

  .error {
    font-size: 0.85em;
    color: var(--color-status-danger);
    letter-spacing: var(--tracking-wide);
  }

  .help {
    font-size: 0.85em;
    color: var(--color-text-muted);
    letter-spacing: var(--tracking-wide);
  }
}
</style>
