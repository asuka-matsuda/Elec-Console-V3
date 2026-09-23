<script setup lang="ts">
/**
 * Modal
 * [Organisms] ネイティブの dialog 要素を使用した軽量モーダルダイアログ。
 * 表示・開閉・アクセシビリティ・レイアウトの提供に特化した純粋なコンテナです。
 */
import { ref, watch } from 'vue'

import type { ModalProps } from '~/types/components'

const isOpen = defineModel<boolean>({ default: false })

withDefaults(
  defineProps<ModalProps>(),
  {
    align: 'left',
    closeText: '閉じる',
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
  <dialog
    ref="dialogRef"
    class="modal m-auto p-0 w-fit min-w-[min(92vw,380px)] max-w-[min(92vw,640px)] max-h-[90vh] overflow-visible open:flex open:flex-col"
    @cancel="onNativeCancel"
  >
    <Panel class="modal-panel flex flex-1 flex-col gap-4 min-h-0">
      <SectionHeader
        v-if="title"
        :title="title"
        :icon="icon"
      >
        <template #actions>
          <slot name="actions">
            <Button
              @click="handleClose"
            >
              {{ closeText }}
            </Button>
          </slot>
        </template>
      </SectionHeader>

      <div
        class="modal-body overflow-y-auto flex flex-1 flex-col gap-3 min-h-0"
        :class="{ 'text-center': align === 'center' }"
      >
        <slot />
      </div>
    </Panel>
  </dialog>
</template>

<style scoped lang="scss">
.modal {
  --theme-accent: var(--color-category-main);

  pointer-events: none;

  transform: translateY(var(--space-2));

  border: none;

  opacity: 0;
  background: transparent;

  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    display var(--duration-fast) allow-discrete,
    overlay var(--duration-fast) allow-discrete;

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

.modal-panel {
  box-shadow: var(--shadow-modal);
}

.modal-body {
  line-height: var(--line-height-relaxed);
  color: var(--color-text-secondary);
}
</style>
