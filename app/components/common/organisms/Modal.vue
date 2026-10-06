<script setup lang="ts">
/**
 * Modal (Geist準拠)
 * [Organisms] ネイティブの dialog 要素を使用した軽量モーダルダイアログ。
 * 表示・開閉・レイアウトの提供に特化した純粋なコンテナです。
 * - 直角（border-radius: 0）サイバーサーフェス
 * - サイズバリアント (sm: 400px, md: 560px [デフォルト], lg: 760px, full: 92vw)
 * - 支援アクセシビリティ属性（aria-*, role）はプロジェクト規約により除外
 */
import { ref, watch } from 'vue'

import type { ModalProps } from '~/types/components'

const isOpen = defineModel<boolean>({ default: false })

withDefaults(
  defineProps<ModalProps>(),
  {
    align: 'left',
    closeText: '閉じる',
    size: 'md',
  },
)

const emit = defineEmits<{
  close: []
  cancel: []
}>()

const dialogRef = ref<HTMLDialogElement | null>(null)

const handleClose = () => {
  isOpen.value = false
  emit('close')
  emit('cancel')
}

const onNativeCancel = (e: Event) => {
  e.preventDefault()
  handleClose()
}

watch(
  isOpen,
  (val) => {
    if (!dialogRef.value) return
    if (val && !dialogRef.value.open) {
      dialogRef.value.showModal()
    }
    else if (!val && dialogRef.value.open) {
      dialogRef.value.close()
    }
  },
  { immediate: true, flush: 'post' },
)
</script>

<template>
  <dialog ref="dialogRef" class="modal m-auto p-0 overflow-visible open:flex open:flex-col" :class="`is-${size}`" @cancel="onNativeCancel">
    <div class="modal-window flex flex-1 flex-col gap-panel-gap min-h-0 p-panel-pad">
      <header v-if="title || $slots.header" class="flex items-center justify-between gap-item-gap">
        <slot name="header">
          <h3 class="flex items-center gap-item-gap">
            <Icon v-if="icon" :name="icon" variant="accent" />
            <span>{{ title }}</span>
          </h3>

          <slot name="actions">
            <Button @click="handleClose">{{ closeText }}</Button>
          </slot>
        </slot>
      </header>
      <hr v-if="title || $slots.header" class="divider">

      <div class="modal-body overflow-y-auto flex flex-1 flex-col gap-form-row-gap min-h-0" :class="{ 'text-center': align === 'center' }">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="modal-footer flex items-center justify-end gap-item-gap pt-panel-pad">
        <slot name="footer" />
      </footer>
    </div>
  </dialog>
</template>

<style scoped lang="scss">
.modal {
  --theme-accent: var(--color-category-main);

  pointer-events: none;

  transform: translateY(var(--space-2));

  width: fit-content;
  min-width: min(92vw, 360px);
  max-height: 90vh;
  border: none;
  border-radius: 0;

  opacity: 0;
  background: transparent;

  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    display var(--duration-fast) allow-discrete,
    overlay var(--duration-fast) allow-discrete;

  &.is-sm {
    max-width: min(92vw, 400px);
  }

  &.is-md {
    max-width: min(92vw, 560px);
  }

  &.is-lg {
    max-width: min(92vw, 760px);
  }

  &.is-full {
    width: 92vw;
    max-width: 92vw;
  }

  &:not([open]) {
    display: none;
  }

  &[open] {
    pointer-events: auto;
    transform: translateY(0);
    opacity: 1;

    &::backdrop {
      opacity: 1;
    }
  }

  &::backdrop {
    opacity: 0;
    background-color: var(--color-overlay-dark);
    backdrop-filter: blur(var(--blur-sm));
    transition:
      opacity var(--duration-fast) var(--ease-out),
      display var(--duration-fast) allow-discrete,
      overlay var(--duration-fast) allow-discrete;
  }

  @starting-style {
    &[open] {
      transform: translateY(var(--space-2));
      opacity: 0;

      &::backdrop {
        opacity: 0;
      }
    }
  }
}

.modal-window {
  isolation: isolate;

  border: var(--border-width-base) solid var(--color-border);
  border-radius: 0;

  background-color: var(--surface-bg-elevated);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--shadow-modal);
}

.modal-body {
  line-height: var(--line-height-base);
  color: var(--color-text-secondary);
}

.modal-footer {
  border-top: var(--border-width-base) solid var(--color-border);
}
</style>
