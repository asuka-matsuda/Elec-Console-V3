<script setup lang="ts">
/**
 * OrganismsModal
 * [Organisms] ネイティブの dialog 要素を使用したモーダルダイアログ。
 * AtomsPanel, MoleculesSectionHeader, Button を組み合わせた独立機能セクション。
 * 標準的なイベント駆動（@submit, @cancel, :loading）および非同期関数（:submit-fn）の両方に対応します。
 */
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue'

import type { ButtonVariant } from '~/types/components'

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
    submitVariant?: ButtonVariant
    loading?: boolean
    errorMessage?: string
    showFooter?: boolean
  }>(),
  {
    variant: 'main',
    size: 'md',
    submitText: '保存する',
    cancelText: 'キャンセル',
    submitVariant: undefined,
    loading: false,
    errorMessage: '',
    showFooter: undefined,
  },
)

const emit = defineEmits<{
  submit: []
  cancel: []
}>()

const instance = getCurrentInstance()
const hasSubmitListener = computed(() => {
  const vnodeProps = instance?.vnode.props || {}

  return Boolean(vnodeProps.onSubmit)
})

const shouldShowDefaultFooter = computed(() => {
  if (props.showFooter !== undefined) return props.showFooter

  return Boolean(props.submitFn || hasSubmitListener.value)
})

const dialogRef = ref<HTMLDialogElement | null>(null)
const isInternalSubmitting = ref(false)
const internalErrorMsg = ref('')

const isBusy = computed(() => props.loading || isInternalSubmitting.value)
const displayError = computed(() => props.errorMessage || internalErrorMsg.value)

const close = () => {
  emit('cancel')
  isOpen.value = false
}

const onNativeClose = () => {
  if (isOpen.value) {
    emit('cancel')
    isOpen.value = false
  }
}

const handleSubmit = async () => {
  emit('submit')

  if (!props.submitFn) return

  internalErrorMsg.value = ''
  isInternalSubmitting.value = true
  try {
    await props.submitFn()
    isOpen.value = false
  }
  catch (e: unknown) {
    internalErrorMsg.value = (e as Error).message || '処理に失敗しました。'
  }
  finally {
    isInternalSubmitting.value = false
  }
}

watch(
  isOpen,
  (newVal) => {
    if (newVal) {
      internalErrorMsg.value = ''
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
    class="modal w-[90vw] max-h-[90vh] m-auto p-0 open:flex open:flex-col"
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
        class="overflow-y-auto flex flex-1 flex-col gap-3 min-h-0 modal-body"
        :class="{ 'text-center': align === 'center' }"
      >
        <div v-if="displayError" class="px-3 py-2 modal-error">
          {{ displayError }}
        </div>

        <slot />
      </div>

      <footer v-if="$slots.footer" class="flex items-center justify-end gap-2">
        <slot name="footer" />
      </footer>

      <footer v-else-if="shouldShowDefaultFooter" class="flex items-center justify-end gap-2">
        <Button
          :disabled="isBusy"
          @click="close"
        >
          {{ cancelText }}
        </Button>
        <Button
          :variant="submitVariant || (variant === 'danger' ? 'danger' : 'success')"
          :loading="isBusy"
          @click="handleSubmit"
        >
          {{ isBusy ? "処理中..." : submitText }}
        </Button>
      </footer>
    </AtomsPanel>
  </dialog>
</template>

<style scoped lang="scss">
.modal {
  pointer-events: none;

  transform: translateY(var(--space-2));

  overflow: visible;

  border: none;

  opacity: 0;
  background: transparent;

  transition:
    opacity var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    display var(--duration-fast) allow-discrete,
    overlay var(--duration-fast) allow-discrete;

  &:not([open]) {
    pointer-events: none;
    display: none;
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

  &[open] {
    pointer-events: auto;
    transform: translateY(0);
    display: flex;
    opacity: 1;

    &::backdrop {
      opacity: 1;
    }
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

.modal-error {
  border: var(--border-width-base) solid var(--color-status-danger);
  font-size: var(--font-size-xs);
  color: var(--color-status-danger);
  background-color: color-mix(
    in srgb,
    var(--color-status-danger) 10%,
    transparent
  );
}
</style>
