<script setup lang="ts">
import { useId, ref, watch, onMounted } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    icon?: string;
    variant?: "main" | "tool" | "database" | "reference" | "management" | "danger" | "success";
  }>(),
  {
    variant: "main",
  }
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

const dialogRef = ref<HTMLDialogElement | null>(null);

const close = () => {
  emit("update:modelValue", false);
};

// watch props.modelValue to open/close native dialog
watch(
  () => props.modelValue,
  (isOpen) => {
    if (isOpen) {
      dialogRef.value?.showModal();
    } else {
      dialogRef.value?.close();
    }
  },
  { flush: "post" }
);

// 初期状態で開いている場合への対応
onMounted(() => {
  if (props.modelValue) {
    dialogRef.value?.showModal();
  }
});

const modalId = useId();
const titleId = `modal-title-${modalId}`;
</script>

<template>
  <dialog
    ref="dialogRef"
    class="c-modal"
    :aria-labelledby="titleId"
    @click.self="close"
    @cancel.prevent="close"
  >
    <AppPanel
      class="c-modal__panel"
      :bracket-color="variant"
    >
      <!-- Header -->
      <template #header>
        <header class="c-modal__header">
          <h2 :id="titleId" class="c-modal__title">
            <AppIcon v-if="icon" :name="icon" class="c-modal__icon" />
            <slot name="title">{{ title }}</slot>
          </h2>
          <button
            type="button"
            class="c-modal__close-btn"
            aria-label="Close modal"
            @click="close"
          >
            <AppIcon name="x" size="sm" />
          </button>
        </header>
      </template>

      <AppDivider :variant="variant" />

      <div class="c-modal__layout">
        <!-- Body -->
        <div class="c-modal__body">
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
  /* Native Dialog Resets */
  margin: auto;
  padding: 0;
  border: none;
  background: transparent;
  outline: none;
  overflow: visible;

  /* Sizing based on original AppPanel overlay */
  width: 90vw;
  max-width: 500px;
  max-height: 90vh;

  /* Native Backdrop Styling */
  &::backdrop {
    background: transparent;
    backdrop-filter: blur(var(--blur-md));
    opacity: 0;
    transition: opacity var(--duration-modal) ease, backdrop-filter var(--duration-modal) ease, display var(--duration-modal) allow-discrete, overlay var(--duration-modal) allow-discrete;
  }

  /* Animation */
  opacity: 0;
  transform: scale(0.95) translateY(10px);
  transition: opacity var(--duration-modal) ease, transform var(--duration-modal) var(--ease-modal), display var(--duration-modal) allow-discrete, overlay var(--duration-modal) allow-discrete;

  &[open] {
    opacity: 1;
    transform: scale(1) translateY(0);
    
    @starting-style {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
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
    background-color: color-mix(in srgb, var(--color-main-bg) 85%, transparent);
    backdrop-filter: blur(var(--blur-lg));
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--gap-element);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__icon {
    flex-shrink: 0;
  }

  &__close-btn {
    @extend %click-enabled;

    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--size-4);
    height: var(--size-4);
    padding: 0;
    color: var(--color-text-muted);
    background: transparent;
    border: none;
    cursor: pointer;
    transition: var(--transition-base);

    &:hover,
    &:focus-visible {
      color: var(--color-status-danger);
      outline: none;
    }
  }

  &__layout {
    display: flex;
    flex-direction: column;
    gap: var(--gap-component);
    flex: 1;
    min-height: 0;
  }

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: var(--pad-container) 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-main);
    line-height: 1.6;

    --scrollbar-size: var(--size-2);
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--gap-element);
  }
}
</style>