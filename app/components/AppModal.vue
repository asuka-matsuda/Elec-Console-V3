<script setup lang="ts">
import { useId, ref, watch, onMounted } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
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
  }>(),
  {
    variant: "main",
  },
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
  { flush: "post" },
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
    <AppPanel class="c-modal__panel" :bracket-color="variant">
      <!-- Header -->
      <template #header>
        <header class="c-modal__header">
          <h2 :id="titleId" class="c-modal__title">
            <AppIcon v-if="icon" :name="icon" class="c-modal__icon" />
            <slot name="title">{{ title }}</slot>
          </h2>
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
  /* Sizing based on original AppPanel overlay */
  width: 90vw;
  max-width: 500px;
  max-height: 90vh;

  /* Native Dialog Resets */
  margin: auto;
  overflow: visible;
  outline: none;
  border: none;

  /* Animation */
  opacity: 0;
  transform: translateY(var(--space-2));
  transition:
    opacity var(--duration-modal) ease,
    transform var(--duration-modal) var(--ease-modal),
    display var(--duration-modal) allow-discrete,
    overlay var(--duration-modal) allow-discrete;

  /* Native Backdrop Styling */
  &::backdrop {
    opacity: 0;
    backdrop-filter: blur(var(--blur-md));
    transition:
      opacity var(--duration-modal) ease,
      backdrop-filter var(--duration-modal) ease,
      display var(--duration-modal) allow-discrete,
      overlay var(--duration-modal) allow-discrete;
  }

  &[open] {
    opacity: 1;
    transform: translateY(0);

    @starting-style {
      opacity: 0;
      transform: translateY(var(--space-2));
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
    @include flex-start(var(--space-2));

    margin: 0;
    
    @extend %text-heading;
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
    flex: 1;
    padding: var(--pad-container) 0;
    overflow-y: auto;
    color: var(--color-text-main);
    
    @extend %text-caption;

    --scrollbar-size: var(--size-2);
  }

  &__footer {
    display: flex;
    gap: var(--gap-element);
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
