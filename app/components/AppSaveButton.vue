<script setup lang="ts">
/**
 * AppSaveButton
 * 非同期の保存処理をトリガーし、ローディング状態や成功状態を視覚的にフィードバックするボタンコンポーネント。
 */
import { computed, toRef } from 'vue'

import { useAsyncActionFeedback } from '~/composables/useAsyncActionFeedback'
import type { AppButtonProps } from '~/types/components'

interface Props extends AppButtonProps {
  saveFunction: () => Promise<void>
  label?: string
}

const props = defineProps<Props>()

const {
  state,
  buttonVariant,
  currentContent,
  execute: handleClick,
} = useAsyncActionFeedback({
  action: () => props.saveFunction(),
  disabled: toRef(props, 'disabled'),
  label: toRef(props, 'label'),
  defaultVariant: toRef(props, 'variant'),
})

const buttonProps = computed(() => {
  const { saveFunction: _, label: __, ...rest } = props

  return rest
})
</script>

<template>
  <AppButton
    v-bind="buttonProps"
    :variant="buttonVariant"
    :disabled="disabled || state !== 'idle'"
    :loading="state === 'saving'"
    class="c-save-button"
    :class="`is-${state}`"
    @click="handleClick"
  >
    <AppIcon
      v-if="state !== 'saving'"
      :name="currentContent.icon"
    />
    {{ currentContent.text }}
  </AppButton>
</template>

<style scoped lang="scss">
.c-save-button {
  &.is-success {
    --btn-color: var(--color-status-success);

    pointer-events: none;
    border-color: var(--color-status-success);
    color: var(--color-status-success);
  }

  &.is-error {
    --btn-color: var(--color-status-danger);

    border-color: var(--color-status-danger);
    color: var(--color-status-danger);
  }
}
</style>
