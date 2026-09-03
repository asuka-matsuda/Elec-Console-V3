<script setup lang="ts">
/**
 * AppModal
 * ネイティブの dialog 要素を使用したモーダルコンポーネント。
 */
import { onMounted, ref, watch } from 'vue'

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
  outline: none;

  transition:
    opacity var(--duration-modal) var(--ease-smooth),
    transform var(--duration-modal) var(--ease-smooth),
    overlay var(--duration-modal) allow-discrete,
    display var(--duration-modal) allow-discrete;

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

    @include text-caption;

    overflow-y: auto;
    flex: 1;

    &.is-align-center {
      text-align: center;
    }

    &.is-align-left {
      text-align: left;
    }
  }
}
</style>
