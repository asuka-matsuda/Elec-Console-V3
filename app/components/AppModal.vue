<script setup lang="ts">
/**
 * AppModal
 * ネイティブの dialog 要素を使用したモーダルコンポーネント。
 */
import { onMounted, onUnmounted, ref, watch } from 'vue'

const isOpen = defineModel<boolean>({ default: false })

withDefaults(
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
  }>(),
  {
    variant: 'main',
  },
)

const dialogRef = ref<HTMLDialogElement | null>(null)
const isClosing = ref(false)
let closeTimeout: ReturnType<typeof setTimeout> | null = null

const close = () => {
  isOpen.value = false
}

const onNativeClose = () => {
  if (isOpen.value) {
    isOpen.value = false
  }
}

watch(
  isOpen,
  (newVal) => {
    if (newVal) {
      if (closeTimeout) {
        clearTimeout(closeTimeout)
        closeTimeout = null
      }
      isClosing.value = false
      if (!dialogRef.value?.open) {
        dialogRef.value?.showModal()
      }
    }
    else {
      if (dialogRef.value?.open) {
        isClosing.value = true
        closeTimeout = setTimeout(() => {
          dialogRef.value?.close()
          isClosing.value = false
          closeTimeout = null
        }, 300)
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

onUnmounted(() => {
  if (closeTimeout) {
    clearTimeout(closeTimeout)
    closeTimeout = null
  }
})
</script>

<template>
  <dialog
    ref="dialogRef"
    class="c-modal"
    :class="{ 'is-closing': isClosing }"
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
        :class="{ 'is-center': align === 'center' }"
      >
        <slot />
      </div>

      <template v-if="$slots.footer" #footer>
        <slot name="footer" />
      </template>
    </AppPanel>
  </dialog>
</template>

<style scoped lang="scss">
.c-modal {
  transform: translateY(var(--space-2));

  overflow: visible;

  width: 90vw;
  max-width: 500px;
  max-height: 90vh;
  margin: auto;
  padding: 0;
  border: none;

  opacity: 0;
  background: transparent;
  outline: none;

  transition:
    opacity var(--duration-modal) var(--ease-smooth),
    transform var(--duration-modal) var(--ease-smooth);

  &::backdrop {
    opacity: 0;
    backdrop-filter: blur(var(--blur-md));
    transition:
      opacity var(--duration-modal) var(--ease-smooth),
      backdrop-filter var(--duration-modal) var(--ease-smooth);
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

  &.is-closing {
    transform: translateY(var(--space-2));
    opacity: 0;

    &::backdrop {
      opacity: 0;
    }
  }

  &__panel {
    backdrop-filter: blur(var(--blur-lg));

    @include shadow("modal");
  }

  &__body {
    --scrollbar-size: var(--space-2);

    @include text-caption;

    overflow-y: auto;
    flex: 1;

    &.is-center {
      text-align: center;
    }
  }
}
</style>
