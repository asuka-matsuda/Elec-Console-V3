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
        <div
          class="c-modal"
          :class="`c-modal--color-${variant}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <!-- Cyber Brackets -->
          <div class="c-modal__brackets"></div>

          <!-- Header -->
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

          <AppDivider :variant="variant" type="default" />

          <!-- Body -->
          <div class="c-modal__body">
            <slot />
          </div>

          <!-- Footer -->
          <footer v-if="$slots.footer" class="c-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
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
  --p-theme-color: var(--color-category-main);
  
  position: relative;
  display: flex;
  flex-direction: column;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  padding: var(--space-4);
  background-color: color-mix(in srgb, var(--color-main-bg) 85%, transparent);
  border: var(--border-width-base) solid #{theme-color(var(--p-theme-color), 50%)};
  box-shadow:
    var(--shadow-elevation-high),
    inset 0 0 20px #{theme-color(var(--p-theme-color), 15%)};
  backdrop-filter: blur(var(--blur-lg));
  
  /* DRY: Color variants mapping */
  &--color-main { --p-theme-color: var(--color-category-main); }
  &--color-tool { --p-theme-color: var(--color-category-tool); }
  &--color-database { --p-theme-color: var(--color-category-database); }
  &--color-reference { --p-theme-color: var(--color-category-reference); }
  &--color-management { --p-theme-color: var(--color-category-management); }
  &--color-danger { --p-theme-color: var(--color-status-danger); }
  &--color-success { --p-theme-color: var(--color-status-success); }

  /* Cyber Brackets (Top-Left & Bottom-Right) */
  &__brackets {
    position: absolute;
    inset: -1px;
    pointer-events: none;
    z-index: -1;

    &::before,
    &::after {
      content: "";
      position: absolute;
      width: var(--space-5);
      height: var(--space-5);
      border: var(--border-width-base) solid #{theme-color(var(--p-theme-color), 80%)};
      filter: drop-shadow(0 0 6px #{theme-color(var(--p-theme-color), 60%)});
    }

    &::before {
      top: 0;
      left: 0;
      border-right: none;
      border-bottom: none;
    }

    &::after {
      bottom: 0;
      right: 0;
      border-top: none;
      border-left: none;
    }
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }

  &__title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: #{theme-color(var(--p-theme-color), 100%)};
    text-shadow: 0 0 var(--blur-md) #{theme-color(var(--p-theme-color), 40%)};
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

    @include custom-scrollbar;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-3);
    margin-top: var(--space-3);
    padding-top: var(--space-3);
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
