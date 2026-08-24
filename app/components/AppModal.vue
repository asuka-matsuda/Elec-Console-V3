<script setup lang="ts">
/**
 * AppModal
 * ネイティブの dialog 要素を使用した、アクセシビリティ対応のモーダルコンポーネント。
 */
import { useId, ref, watch, onMounted } from "vue";

const isOpen = defineModel<boolean>({ default: false });

withDefaults(
  defineProps<{
    title?: string;
    icon?: string;
    variant?:
      | "main"
      | "tool"
      | "database"
      | "reference"
      | "management"
      | "danger"
      | "success";
    align?: "left" | "center";
  }>(),
  {
    variant: "main",
  },
);

const dialogRef = ref<HTMLDialogElement | null>(null);
const isClosing = ref(false);
let closeTimeout: ReturnType<typeof setTimeout> | null = null;

const close = () => {
  isOpen.value = false;
};

// Handle native close event (e.g., if closed via script or devtools directly)
const onNativeClose = () => {
  if (isOpen.value) {
    isOpen.value = false;
  }
};

/** Watch isOpen to open/close native dialog with animation support */
watch(
  isOpen,
  (newVal) => {
    if (newVal) {
      if (closeTimeout) {
        clearTimeout(closeTimeout);
        closeTimeout = null;
      }
      isClosing.value = false;
      if (!dialogRef.value?.open) {
        dialogRef.value?.showModal();
      }
    } else {
      if (dialogRef.value?.open) {
        isClosing.value = true;
        closeTimeout = setTimeout(() => {
          dialogRef.value?.close();
          isClosing.value = false;
          closeTimeout = null;
        }, 300); // 300ms matches typical transition duration
      }
    }
  },
  { flush: "post" }
);

/** Support opening dialog initially if isOpen is true */
onMounted(() => {
  if (isOpen.value) {
    dialogRef.value?.showModal();
  }
});

const modalId = useId();
const titleId = `modal-title-${modalId}`;
</script>

<template>
  <dialog
    ref="dialogRef"
    :aria-labelledby="titleId"
    class="c-modal"
    :class="{ 'is-closing': isClosing }"
    @close="onNativeClose"
    @click.self="close"
    @cancel.prevent="close"
  >
    <AppPanel class="c-modal__panel" :bracket-color="variant">
      <!-- Header -->
      <template #header>
        <div class="c-modal__header-wrapper">
          <header class="c-modal__header">
            <h2 :id="titleId" class="c-modal__title">
              <AppIcon v-if="icon" :name="icon" class="c-modal__icon" />
              <slot name="title">{{ title }}</slot>
            </h2>
          </header>
          <AppDivider type="fade-center" variant="border" />
        </div>
      </template>

      <div class="c-modal__layout">
        <!-- Body -->
        <div class="c-modal__body" :class="align === 'center' ? 'c-modal__body--align-center' : ''">
          <slot />
        </div>

        <!-- Footer -->
        <footer v-if="$slots.footer" class="c-modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </AppPanel>
  </dialog>
</template>

<style scoped lang="scss">
.c-modal {
  // --- Base Styles ---
  transform: translateY(var(--space-2));

  overflow: visible;

  /* Sizing based on original AppPanel overlay */
  width: 90vw;
  max-width: 500px;
  max-height: 90vh;

  /* Native Dialog Resets */
  margin: auto;
  border: none;

  /* Animation */
  opacity: 0;
  outline: none;

  transition:
    opacity var(--duration-modal) var(--ease-smooth),
    transform var(--duration-modal) var(--ease-smooth);

  /* Native Backdrop Styling */
  &::backdrop {
    opacity: 0;
    backdrop-filter: blur(var(--blur-md));
    transition:
      opacity var(--duration-modal) var(--ease-smooth),
      backdrop-filter var(--duration-modal) var(--ease-smooth);
  }

  // --- State Modifiers ---
  &[open] {
    transform: translateY(0);
    opacity: 1;

    @starting-style {
      transform: translateY(var(--space-2));
      opacity: 0;
    }

    &::backdrop {
      opacity: 1;

      @starting-style {
        opacity: 0;
      }
    }
  }

  /* Internal Panel */
  &__panel {
    width: 100%;
    height: 100%;
    max-height: 90vh;
    backdrop-filter: blur(var(--blur-lg));
  }

  &__header {
    @include flex-between(var(--gap-element));

    align-items: flex-start;
  }

  &__title {
    @extend %text-heading;

    @include flex-start(var(--gap-component));
  }

  &__icon {
    flex-shrink: 0;
  }

  &__layout {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--gap-component);

    min-height: 0;
  }

  &__body {
    --scrollbar-size: var(--size-2);

    @extend %text-caption;

    overflow-y: auto;
    flex: 1;
    padding: var(--pad-container) 0;

    &--align-center {
      text-align: center;
    }
  }

  &__footer {
    display: flex;
    gap: var(--gap-element);
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
