<script setup lang="ts">
import { useId, onMounted, onUnmounted, watch } from "vue";

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

const close = () => {
  emit("update:modelValue", false);
};

// Handle Escape key to close
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && props.modelValue) {
    close();
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

// Prevent background scrolling when modal is open
watch(
  () => props.modelValue,
  (isOpen) => {
    // Only handle if we are in browser
    if (typeof window !== "undefined") {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
  },
  { immediate: true }
);

const modalId = useId();
const titleId = `modal-title-${modalId}`;
</script>

<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="modelValue" class="c-modal-overlay" @click.self="close">
        <AppPanel
          class="c-modal"
          :bracket-color="variant"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
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

          <!-- Body -->
          <div class="c-modal__body">
            <slot />
          </div>

          <!-- Footer -->
          <footer v-if="$slots.footer" class="c-modal__footer">
            <slot name="footer" />
          </footer>
        </AppPanel>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped lang="scss">
.c-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;

  /* 背景色はなし、backdrop-filterのみ */
  backdrop-filter: blur(var(--blur-md));
}

.c-modal {
  /* AppPanelとしての幅と背景の上書き */
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  background-color: color-mix(in srgb, var(--color-main-bg) 85%, transparent);
  backdrop-filter: blur(var(--blur-lg));

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
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

  &__body {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-3) 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-main);
    line-height: 1.6;

    --scrollbar-size: var(--size-2);
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-3);
  }
}

/* Modal Transition */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;

  .c-modal {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;

  .c-modal {
    transform: scale(0.95) translateY(10px);
  }
}
</style>
