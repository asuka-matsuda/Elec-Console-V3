<script setup lang="ts">
/**
 * MoleculesFormGroup
 * [Molecules] フォームのラベル、入力項目、エラーメッセージ、ヘルプテキストをグループ化して表示するコンポーネント。
 */
import { computed, provide, useId } from 'vue'

import type { HelpId } from '~/constants/helpConstants'
import { FORM_GROUP_KEY } from '~/types/components'

interface Props {
  label?: string
  required?: boolean
  requiredLabel?: string
  error?: string
  help?: string
  helpId?: HelpId
  helpTip?: string
  forId?: string
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
  requiredLabel: 'REQUIRED',
  helpId: undefined,
  helpTip: undefined,
})

const defaultId = useId()
const fieldId = computed(() => props.forId || defaultId)
const hasError = computed(() => Boolean(props.error))

provide(FORM_GROUP_KEY, {
  id: fieldId,
  hasError,
})
</script>

<template>
  <div class="flex flex-col gap-2 form-group">
    <!-- ラベル領域 -->
    <label
      v-if="label || $slots.label"
      :for="fieldId"
      class="flex items-center gap-2 form-group__label"
    >
      <span class="inline-flex items-center gap-1 label-text">
        <span class="shrink-0 label-bar" />
        <slot name="label">{{ label }}</slot>
      </span>
      <Badge
        v-if="required"
        id="form:required"
      >
        {{ requiredLabel }}
      </Badge>
      <HelpTip
        v-if="helpId || helpTip"
        :help-id="helpId"
        :text="helpTip"
      />
    </label>

    <!-- コントロール領域 -->
    <div class="flex flex-col gap-1 control">
      <slot />

      <!-- エラーメッセージ -->
      <transition name="fade-slide">
        <p v-if="error" class="error">
          {{ error }}
        </p>
      </transition>

      <!-- ヘルプテキスト -->
      <p v-if="help && !error" class="help">
        {{ help }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-group {
  position: relative;
  font-size: var(--font-size-sm);

  &__label {
    user-select: none;
  }

  &:focus-within .label-bar {
    --glow-color: var(--theme-accent);

    transform: scaleY(1.2);
    box-shadow: var(--shadow-glow-sm);
  }

  &:has(.error, .is-error) .label-text {
    color: var(--color-status-danger);

    .label-bar {
      --glow-color: var(--color-status-danger);

      background-color: var(--color-status-danger);
      box-shadow: var(--shadow-glow-sm);
    }
  }
}

.label-text {
  font-size: inherit;
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
  letter-spacing: var(--tracking-wide);

  transition: var(--transition-base);
}

.label-bar {
  width: var(--space-0-5);
  height: 0.9em;
  background-color: var(--theme-accent);
  transition: var(--transition-fast);
}

.control {
  font-size: inherit;
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

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: var(--transition-fast);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
