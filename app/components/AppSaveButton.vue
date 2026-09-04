<script setup lang="ts">
/**
 * AppSaveButton
 * 非同期の保存処理をトリガーし、ローディング状態や成功状態を視覚的にフィードバックするボタンコンポーネント。
 */
import { computed, onUnmounted, ref } from 'vue'

import type { AppButtonProps } from '~/types/components'

interface Props extends AppButtonProps {
  saveFunction: () => Promise<void>
  label?: string
}

const props = defineProps<Props>()

const state = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
let resetTimer: ReturnType<typeof setTimeout> | null = null

const clearTimer = () => {
  if (resetTimer) {
    clearTimeout(resetTimer)
    resetTimer = null
  }
}

onUnmounted(() => {
  clearTimer()
})

const buttonVariant = computed(() => {
  if (state.value === 'error') return 'danger'
  if (state.value === 'success') return 'success'

  return props.variant || 'success'
})

const buttonProps = computed(() => {
  const { saveFunction: _, label: __, ...rest } = props

  return rest
})

const currentContent = computed(() => {
  switch (state.value) {
    case 'saving':
      return { icon: 'loader', text: '保存中...' }
    case 'success':
      return { icon: 'check', text: '保存しました' }
    case 'error':
      return { icon: 'alert-circle', text: '保存に失敗しました' }
    default:
      return { icon: 'save', text: props.label || '履歴に保存' }
  }
})

const handleClick = async () => {
  if (props.disabled || state.value !== 'idle') return

  clearTimer()
  state.value = 'saving'
  try {
    await props.saveFunction()
    state.value = 'success'
    resetTimer = setTimeout(() => {
      state.value = 'idle'
      resetTimer = null
    }, 2000)
  }
  catch (e) {
    console.error('Failed to save:', e)
    state.value = 'error'
    resetTimer = setTimeout(() => {
      state.value = 'idle'
      resetTimer = null
    }, 3000)
  }
}
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
