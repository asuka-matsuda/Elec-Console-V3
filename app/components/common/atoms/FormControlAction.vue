<script setup lang="ts">
/**
 * FormControlAction
 * [Atoms] フォームコントロール（Input / Select 等）の末尾に配置されるアイコン・アクションボタン。
 * クリア（×）、パスワード表示切替（目玉）、展開矢印（∨）などの末尾アクションを一元管理します。
 * アイコンサイズは親要素の文字サイズ（em）に自動連動します。
 */
import type { FormControlActionProps } from '~/types/components'

const props = withDefaults(defineProps<FormControlActionProps>(), {
  interactive: true,
  disabled: false,
  rotate: false,
  tabindex: -1,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const handleClick = (event: MouseEvent) => {
  if (!props.interactive || props.disabled) return
  event.stopPropagation()
  emit('click', event)
}
</script>

<template>
  <span
    :tabindex="disabled ? undefined : tabindex"
    :title="title"
    class="inline-flex shrink-0 items-center justify-center p-[0.2em] form-control-action"
    :class="{
      'is-rotated': rotate,
      'is-non-interactive': !interactive,
      'is-disabled': disabled,
    }"
    @mousedown.prevent
    @click="handleClick"
  >
    <Icon :name="icon" />
  </span>
</template>

<style scoped lang="scss">
.form-control-action {
  cursor: pointer;
  user-select: none;

  border: none;

  font-size: inherit;
  color: var(--color-text-muted);

  transition: var(--transition-fast);

  &:hover {
    color: var(--color-text-main);
  }

  &:active {
    transform: scale(0.92);
  }

  &.is-rotated {
    transform: rotate(180deg);
  }

  &.is-non-interactive {
    pointer-events: none;
    cursor: default;

    &:active {
      transform: none;
    }
  }

  @include state-disabled;
}
</style>
