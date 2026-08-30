<script setup lang="ts">
/**
 * AppFormGroup
 * フォームのラベル、入力項目、エラーメッセージ、ヘルプテキストをグループ化して表示するコンポーネントです。
 */
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
      <div
        v-if="label || $slots.label"
        class="c-form-group__label-wrapper"
      >
        <label class="c-form-label">
          <slot name="label">{{ label }}</slot>
        </label>
        <AppBadge
          v-if="required"
          color="danger"
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
          <div
            v-if="error"
            class="c-form-group__error"
          >
            {{ error }}
          </div>
        </transition>

        <!-- Help Text -->
        <div
          v-if="help && !error"
          class="c-form-group__help"
        >
          {{ help }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-form-group {
  container-type: inline-size;
  width: 100%;

  &__inner {
    @include flex-column;

    width: 100%;

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

  &__label-wrapper {
    @include flex-start;
  }

  &__control {
    position: relative;

    @include flex-column(var(--space-1));
  }

  &__error {
    @include text-meta;

    color: var(--color-status-danger);

    @include cyber-text-glow(var(--color-status-danger), 30%, var(--blur-sm));
  }

  &__help {
    @include text-meta;
  }
}

// Label Component Styles (Legacy _c-form-label)
.c-form-label {
  @include flex-start;
  @include text-label;

  user-select: none;

  // Default state: slightly dimmed
  color: theme-color(var(--color-category-main), 70%);
  text-transform: uppercase;

  @include state-base;

  // Cyber glowing dot

  &::before {
    --glow-color: theme-color(var(--color-category-main), 30%);

    content: "";

    display: inline-block;

    width: var(--space-2);
    height: var(--space-2);

    @include border-base(
      theme-color(var(--color-category-main), 70%),
      var(--border-width-thick)
    );

    border-radius: 50%;

    @include state-base(var(--shadow-glow-sm));
  }
}

// フォームグループ内がフォーカスされたらラベルを発光させる
.c-form-group:focus-within .c-form-label {
  color: var(--color-category-main);

  @include cyber-text-glow;

  &::before {
    border-color: var(--color-category-main);
    box-shadow: var(--shadow-glow-md);
  }
}

// フォームグループ内にエラー要素（.c-form-group__error や .is-error 等）が存在する場合、ラベルを赤くする
.c-form-group:has(.c-form-group__error, :invalid, .is-error) .c-form-label {
  color: var(--color-status-danger);

  @include cyber-text-glow(var(--color-status-danger));

  &::before {
    --glow-color: var(--color-status-danger);

    border-color: var(--color-status-danger);
    box-shadow: var(--shadow-glow-md);
  }
}
</style>

<style lang="scss">
// --- Fade Slide ---
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity var(--duration-fast) var(--ease-base),
    transform var(--duration-fast) var(--ease-base);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
