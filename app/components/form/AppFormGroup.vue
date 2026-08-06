<script setup lang="ts">
import AppBadge from '../elements/AppBadge.vue'

const props = withDefaults(defineProps<{
  label?: string
  required?: boolean
  error?: string
  help?: string
  horizontal?: boolean
}>(), {
  required: false,
  horizontal: false
})
</script>

<template>
  <div class="c-form-group" :class="{ 'c-form-group--horizontal': horizontal }">
    <!-- Label Area -->
    <div v-if="label || $slots.label" class="c-form-group__label-wrapper">
      <label class="c-form-label">
        <slot name="label">{{ label }}</slot>
      </label>
      <AppBadge v-if="required" variant="danger" size="sm" class="c-form-group__required">
        REQUIRED
      </AppBadge>
    </div>

    <!-- Input Control Area -->
    <div class="c-form-group__control">
      <slot />
      
      <!-- Error Message -->
      <transition name="fade-slide">
        <div v-if="error" class="c-form-group__error">
          {{ error }}
        </div>
      </transition>

      <!-- Help Text -->
      <div v-if="help && !error" class="c-form-group__help">
        {{ help }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 100%;

  // --- Horizontal Layout ---
  &--horizontal {
    flex-direction: row;
    align-items: flex-start;

    .c-form-group__label-wrapper {
      flex-shrink: 0;
      width: 140px;
      // Align label with the text inside a medium input control
      padding-top: calc((var(--size-control-md) - var(--line-height-base) * var(--text-sm)) / 2);
    }

    .c-form-group__control {
      flex: 1;
      min-width: 0;
    }
  }

  // --- Elements ---
  &__label-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  &__control {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    position: relative;
  }

  &__error {
    font-size: var(--text-xs);
    color: var(--color-status-danger);
    @include cyber-text-glow(30%, 4px, var(--color-status-danger));
    margin-top: var(--space-1);
  }

  &__help {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }
}

// Label Component Styles (Legacy _c-form-label)
.c-form-label {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--space-2);
  font-family: var(--font-base);
  font-size: var(--text-sm);
  color: var(--color-category-main);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: var(--font-weight-bold);
  user-select: none;

  // Cyber glowing dot
  &::before {
    display: inline-block;
    width: var(--size-1);
    height: var(--size-1);
    content: '';
    background-color: var(--color-category-main);
    box-shadow: 0 0 var(--blur-sm) var(--color-category-main);
  }
}

// Transition for error messages
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity var(--duration-fast) var(--ease-out),
              transform var(--duration-fast) var(--ease-out);
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
