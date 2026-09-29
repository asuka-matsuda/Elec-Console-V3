<script setup lang="ts">
/**
 * FormControlAction
 * [Atoms] フォームコントロール（Input / Select 等）の末尾に配置されるインラインアクションボタン。
 * クリア（×）、パスワード表示切替（目玉）などの末尾アクションを提供します。
 * アイコンサイズは親要素の文字サイズ（em）に自動連動します。
 */
import type { FormControlActionProps } from '~/types/components'

const props = withDefaults(defineProps<FormControlActionProps>(), {
  disabled: false,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const handleClick = (event: MouseEvent) => {
  if (props.disabled) return
  event.stopPropagation()
  emit('click', event)
}
</script>

<template>
  <span
    class="form-control-action"
    :class="{ 'is-disabled': disabled }"
    @mousedown.prevent
    @click="handleClick"
  >
    <Icon :name="icon" />
  </span>
</template>

<style scoped lang="scss">
.form-control-action {
  display: inline-flex;

  padding: 0.2em;

  font-size: inherit;
  line-height: 1;
  color: var(--color-text-muted);

  transition: var(--transition-fast);

  @include state-interactive;

  &:hover {
    color: var(--color-text-main);
  }

  &:active {
    transform: scale(0.92);
  }

  @include state-disabled;
}
</style>
