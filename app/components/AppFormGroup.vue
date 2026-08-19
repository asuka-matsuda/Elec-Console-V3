<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string;
    required?: boolean;
    error?: string;
    help?: string;
  }>(),
  {
    required: false,
  },
);
</script>

<template>
  <div class="c-form-group">
    <div class="c-form-group__inner">
      <!-- Label Area -->
      <div v-if="label || $slots.label" class="c-form-group__label-wrapper">
        <label class="c-form-label">
          <slot name="label">{{ label }}</slot>
        </label>
        <AppBadge
          v-if="required"
          variant="danger"
          size="sm"
          class="c-form-group__required"
        >
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
  </div>
</template>

<style scoped lang="scss">
.c-form-group {
  width: 100%;
  container-type: inline-size;

  &__inner {
    display: flex;
    flex-direction: column;
    gap: var(--gap-component);
    width: 100%;

    // --- Responsive Layout ---
    // If the .c-form-group container is wide enough (>= 480px), switch to horizontal layout
    @container (min-width: 480px) {
      flex-direction: row;
      align-items: flex-start;

      .c-form-group__label-wrapper {
        flex-shrink: 0;
        width: 140px;

        // Align label with the text inside a medium input control
        padding-top: calc(
          (var(--size-control-md) - var(--line-height-base) * var(--font-size-sm)) /
            2
        );
      }

      .c-form-group__control {
        flex: 1;
        min-width: 0;
      }
    }
  }

  // --- Elements ---
  &__label-wrapper {
    display: flex;
    align-items: center;
    gap: var(--gap-element);
  }

  &__control {
    display: flex;
    flex-direction: column;
    gap: var(--gap-element);
    position: relative;
  }

  &__error {
    font-size: var(--font-size-xs);
    color: var(--color-status-danger);

    @include cyber-text-glow(30%, var(--blur-sm), var(--color-status-danger));
  }

  &__help {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
}

// Label Component Styles (Legacy _c-form-label)
.c-form-label {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--gap-element);
  font-size: var(--font-size-sm);
  color: var(--color-category-main);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: var(--font-weight-bold);
  user-select: none;

  // Cyber glowing dot
  &::before {
    display: inline-block;
    width: var(--size-2);
    height: var(--size-2);
    content: "";
    border: var(--border-width-thick) solid var(--color-category-main);
    border-radius: 50%;
    box-shadow: 0 0 var(--blur-sm) var(--color-category-main);
  }
}
</style>
