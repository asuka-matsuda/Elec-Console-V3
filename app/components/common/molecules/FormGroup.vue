<script setup lang="ts">
/**
 * FormGroup
 * [Molecules] フォームのラベル、入力項目、エラーメッセージ、ヘルプテキストを統合するグループコンポーネント。
 */
import { computed, provide, useId } from 'vue'

import { FORM_GROUP_KEY } from '~/constants/injectionKeys'
import type { FormGroupProps } from '~/types/components'

const props = withDefaults(defineProps<FormGroupProps>(), {
  required: false,
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
  <div class="flex flex-col gap-inline-gap form-group" :class="{ 'is-error': hasError }">

    <label
      v-if="label || $slots.label"
      :for="fieldId"
      class="inline-flex items-center gap-inline-gap label"
    >
      <slot name="label">{{ label }}</slot>
      <span v-if="required" class="req-mark">＊</span>
      <HelpTip v-if="helpId" :help-id="helpId" />
    </label>

    <div v-if="addon" class="flex items-center gap-inline-gap w-full min-w-0">
      <div class="flex-1 min-w-0">
        <slot />
      </div>
      <span class="shrink-0 form-group__addon">
        {{ addon }}
      </span>
    </div>
    <slot v-else />

    <p v-if="error" class="error-text">
      {{ error }}
    </p>

    <p v-if="help" class="help-text">
      {{ help }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.form-group {
  font-size: var(--font-size-sm);

  .label {
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

      background-color: var(--glow-color);

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

      box-shadow: var(--shadow-glow-sm);
    }
  }

  .req-mark {
    font-weight: var(--font-weight-bold);
    line-height: 1;
    color: var(--color-status-danger);
  }

  .error-text {
    font-size: 0.85em;
    color: var(--color-status-danger);
    letter-spacing: var(--tracking-wide);
  }

  .help-text {
    font-size: 0.85em;
    color: var(--color-text-muted);
    letter-spacing: var(--tracking-wide);
  }

  &__addon {
    font-size: 0.9em;
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
    white-space: nowrap;
  }
}
</style>
