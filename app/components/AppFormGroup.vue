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
  // --- Base Styles ---
  container-type: inline-size;
  width: 100%;

  &__inner {
    display: flex;
    flex-direction: column;
    gap: var(--gap-component);
    width: 100%;

    // --- Responsive Layout ---
    // If the .c-form-group container is wide enough (>= xs), switch to horizontal layout
    @include cq("xs") {
      flex-direction: row;
      align-items: flex-start;

      .c-form-group__label-wrapper {
        flex-shrink: 0;
        width: 140px;

        // Align label with the text inside a medium input control
        padding-top: calc(
          (
              var(--size-control-md) - var(--line-height-base) *
                var(--font-size-sm)
            ) /
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
    @include flex-start(var(--gap-element));
  }

  &__control {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--gap-element);
  }

  &__error {
    @extend %text-xs;

    color: var(--color-status-danger);

    @include cyber-text-glow(30%, var(--blur-sm), var(--color-status-danger));
  }

  &__help {
    @extend %text-xs;

    color: var(--color-text-muted);
  }
}

// Label Component Styles (Legacy _c-form-label)
.c-form-label {
  @include flex-start(var(--gap-element));

  @extend %text-sm;

  user-select: none;

  font-weight: var(--font-weight-bold);

  // Default state: slightly dimmed
  color: theme-color(var(--color-category-main), 70%);
  text-transform: uppercase;
  letter-spacing: 0.1em;

  transition: var(--transition-base);

  // Cyber glowing dot
  &::before {
    content: "";

    display: inline-block;

    width: var(--size-2);
    height: var(--size-2);
    border: var(--border-width-thick) solid
      theme-color(var(--color-category-main), 70%);
    border-radius: 50%;

    box-shadow: 0 0 var(--blur-sm) theme-color(var(--color-category-main), 30%);

    transition: var(--transition-base);
  }
}

// フォームグループ内がフォーカスされたらラベルを発光させる
.c-form-group:focus-within .c-form-label {
  color: var(--color-category-main);

  @include cyber-text-glow(50%, var(--blur-md), var(--color-category-main));

  &::before {
    border-color: var(--color-category-main);
    box-shadow: 0 0 var(--blur-md) var(--color-category-main);
  }
}

// フォームグループ内にエラー要素（.c-form-group__error や [aria-invalid="true"] 等）が存在する場合、ラベルを赤くする
.c-form-group:has(.c-form-group__error, :invalid, [aria-invalid="true"])
  .c-form-label {
  color: var(--color-status-danger);

  @include cyber-text-glow(50%, var(--blur-md), var(--color-status-danger));

  &::before {
    border-color: var(--color-status-danger);
    box-shadow: 0 0 var(--blur-md) var(--color-status-danger);
  }
}
</style>
