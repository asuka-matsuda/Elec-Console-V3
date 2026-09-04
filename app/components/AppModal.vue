<script setup lang="ts">
/**
 * AppModal
 * ネイティブの dialog 要素を使用したモーダルコンポーネント。
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
    class="c-modal"
    :class="size ? `c-modal--${size}` : ''"
    @close="onNativeClose"
    @click.self="close"
    @cancel.prevent="close"
  >
    <AppPanel
      class="c-modal__panel"
      :title="title"
      :icon="icon"
      :variant="variant"
    >
      <div
        class="c-modal__body"
        :class="align ? `is-align-${align}` : undefined"
      >
        <div v-if="errorMsg" class="c-modal__error">
          {{ errorMsg }}
        </div>

        <slot />
      </div>

      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>

      <template v-else-if="submitFn" #footer>
        <AppButton
          variant="secondary"
          :disabled="isSubmitting"
          @click="close"
        >
          {{ cancelText }}
        </AppButton>
        <AppButton
          variant="primary"
          :disabled="isSubmitting"
          @click="handleSubmit"
        >
          {{ isSubmitting ? "処理中..." : submitText }}
        </AppButton>
      </template>
    </AppPanel>
  </dialog>
</template>

<style scoped lang="scss">
.c-modal {
  transform: translateY(var(--space-2));

  overflow: visible;

  width: 90vw;
  max-width: 540px;
  max-height: 90vh;
  margin: auto;
  padding: 0;
  border: none;

  opacity: 0;
  outline: none;

  transition:
    opacity var(--duration-modal) var(--ease-smooth),
    transform var(--duration-modal) var(--ease-smooth),
    overlay var(--duration-modal) allow-discrete,
    display var(--duration-modal) allow-discrete;

  &--sm {
    max-width: 420px;
  }

  &--md {
    max-width: 540px;
  }

  &--lg {
    max-width: 760px;
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
    transform: translateY(0);
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

  &__panel {
    @include shadow("modal");
  }

  &__body {
    --scrollbar-size: var(--space-2);

    @include flex-start-stretch($direction: column);
    @include text-caption;

    overflow-y: auto;
    flex: 1;
    gap: var(--space-3);

    &.is-align-center {
      text-align: center;
    }
  }

  &__error {
    @include text-desc("md", "bold");

    padding: var(--space-2) var(--space-3);
    color: var(--color-status-danger);
    backdrop-filter: blur(var(--blur-sm));

    @include border-base(var(--color-status-danger), 30%);
  }
}
</style>
