<script setup lang="ts">
/**
 * OrganismsModal
 * [Organisms] ネイティブの dialog 要素を使用したモーダルダイアログ。
 * AtomsPanel, MoleculesSectionHeader, AtomsButton を組み合わせた独立機能セクション。
 */
import { onMounted, ref, watch } from 'vue'

const isOpen = defineModel<boolean>({ default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    icon?: string
    variant?:
      | 'main'
      | 'tool'
      | 'database'
      | 'reference'
      | 'management'
      | 'danger'
      | 'success'
    align?: 'left' | 'center'
    size?: 'sm' | 'md' | 'lg'
    submitFn?: () => Promise<void>
    submitText?: string
    cancelText?: string
  }>(),
  {
    variant: 'main',
    size: 'md',
    submitText: '保存する',
    cancelText: 'キャンセル',
  },
)

const dialogRef = ref<HTMLDialogElement | null>(null)
const isSubmitting = ref(false)
const errorMsg = ref('')

const close = () => {
  isOpen.value = false
}

const onNativeClose = () => {
  if (isOpen.value) {
    isOpen.value = false
  }
}

const handleSubmit = async () => {
  if (!props.submitFn) return

  errorMsg.value = ''
  isSubmitting.value = true
  try {
    await props.submitFn()
    isOpen.value = false
  }
  catch (e: unknown) {
    errorMsg.value = (e as Error).message || '処理に失敗しました。'
  }
  finally {
    isSubmitting.value = false
  }
}

watch(
  isOpen,
  (newVal) => {
    if (newVal) {
      errorMsg.value = ''
      if (!dialogRef.value?.open) {
        dialogRef.value?.showModal()
      }
    }
    else {
      if (dialogRef.value?.open) {
        dialogRef.value?.close()
      }
    }
  },
  { flush: 'post' },
)

onMounted(() => {
  if (isOpen.value) {
    dialogRef.value?.showModal()
  }
})
</script>

<template>
  <dialog
    ref="dialogRef"
    class="modal w-[90vw] max-h-[90vh] m-auto p-0 border-none outline-none"
    :class="{
      'max-w-[420px]': size === 'sm',
      'max-w-[540px]': size === 'md',
      'max-w-[760px]': size === 'lg',
    }"
    @close="onNativeClose"
    @click.self="close"
    @cancel.prevent="close"
  >
    <AtomsPanel class="flex flex-1 flex-col gap-4 min-h-0 modal-panel">
      <MoleculesSectionHeader
        v-if="title"
        :title="title"
        :icon="icon"
        :variant="variant"
      />
      <div
        class="overflow-y-auto flex flex-1 flex-col gap-[var(--space-3)] min-h-0 modal-body"
        :class="align === 'center' ? 'text-center' : undefined"
      >
        <div v-if="errorMsg" class="px-[var(--space-3)] py-[var(--space-2)] modal-error">
          {{ errorMsg }}
        </div>

        <slot />
      </div>

      <footer v-if="$slots.footer" class="flex items-center justify-end gap-2">
        <slot name="footer" />
      </footer>

      <footer v-else-if="submitFn" class="flex items-center justify-end gap-2">
        <AtomsButton
          variant="secondary"
          :disabled="isSubmitting"
          @click="close"
        >
          {{ cancelText }}
        </AtomsButton>
        <AtomsButton
          variant="primary"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          {{ isSubmitting ? "処理中..." : submitText }}
        </AtomsButton>
      </footer>
    </AtomsPanel>
  </dialog>
</template>

<style scoped lang="scss">
.modal {
  pointer-events: none;

  transform: translateY(var(--space-2));

  overflow: visible;
  display: none;

  opacity: 0;

  transition:
    opacity var(--duration-modal) var(--ease-smooth),
    transform var(--duration-modal) var(--ease-smooth),
    overlay var(--duration-modal) allow-discrete,
    display var(--duration-modal) allow-discrete;

  &:not([open]) {
    pointer-events: none;
    display: none;
  }

  &::backdrop {
    opacity: 0;
    backdrop-filter: blur(var(--blur-md));
    transition:
      opacity var(--duration-modal) var(--ease-smooth),
      overlay var(--duration-modal) allow-discrete,
      display var(--duration-modal) allow-discrete;
  }

  &[open] {
    pointer-events: auto;

    transform: translateY(0);

    display: flex;
    flex-direction: column;

    opacity: 1;

    &::backdrop {
      opacity: 1;

      @starting-style {
        opacity: 0;
      }
    }

    @starting-style {
      transform: translateY(var(--space-2));
      opacity: 0;
    }
  }

  .modal-panel {
    box-shadow: var(--shadow-modal);
  }

  .modal-body {
    --scrollbar-size: var(--space-2);

    font-size: var(--font-size-sm);
  }

  .modal-error {
    border: var(--border-width-base) solid color-mix(in srgb, var(--color-status-danger) 30%, transparent);
    border-radius: var(--radius-sm);

    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-status-danger);

    backdrop-filter: blur(var(--blur-sm));
  }
}
</style>
