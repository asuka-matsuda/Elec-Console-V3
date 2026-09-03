<script setup lang="ts">
/**
 * AppSaveButton
 * 非同期の保存処理をトリガーし、ローディング状態や成功状態を視覚的にフィードバックするボタンコンポーネント。
 */
import { computed, ref } from 'vue'

import type { AppButtonProps } from './AppButton.vue'

interface Props extends AppButtonProps {
  saveFunction: () => Promise<void>
  label?: string
}

const props = defineProps<Props>()

const state = ref<'idle' | 'saving' | 'success'>('idle')

const currentContent = computed(() => {
  switch (state.value) {
    case 'saving':
      return { icon: 'loader', text: '保存中...' }
    case 'success':
      return { icon: 'check', text: '保存しました' }
    default:
      return { icon: 'save', text: props.label || '履歴に保存' }
  }
})

const handleClick = async () => {
  if (props.disabled || state.value !== 'idle') return

  state.value = 'saving'
  try {
    await props.saveFunction()
    state.value = 'success'
    setTimeout(() => {
      state.value = 'idle'
    }, 2000)
  }
  catch (e) {
    console.error('Failed to save:', e)
    state.value = 'idle'
  }
}
</script>

<template>
  <AppButton
    v-bind="props"
    :variant="props.variant || 'success'"
    :disabled="disabled || state !== 'idle'"
    class="c-save-button"
    :class="`is-${state}`"
    @click="handleClick"
  >
    <AppIcon
      :name="currentContent.icon"
      :class="{ 'u-spin': state === 'saving' }"
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
}
</style>
