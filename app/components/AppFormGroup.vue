<script setup lang="ts">
/**
 * AppFormGroup
 * フォームのラベル、入力項目、エラーメッセージ、ヘルプテキストをグループ化して表示するコンポーネントです。
 */
withDefaults(
  defineProps<{
    label?: string
    required?: boolean
    error?: string
    help?: string
  }>(),
  {
    required: false,
  },
)
</script>

<template>
  <div class="c-form-group">
    <div class="c-form-group__inner">
      <div
        v-if="label || $slots.label"
        class="c-form-group__label-wrapper"
      >
        <div class="c-form-label">
          <slot name="label">{{ label }}</slot>
        </div>
        <AppBadge
          v-if="required"
          color="danger"
          size="sm"
          class="c-form-group__required"
        >
          REQUIRED
        </AppBadge>
      </div>

      <div class="c-form-group__control">
        <slot />

        <transition name="fade-slide">
          <div
            v-if="error"
            class="c-form-group__error"
          >
            {{ error }}
          </div>
        </transition>

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
    @include flex-start-stretch($direction: column);

    width: 100%;

    @include cq("xs") {
      @include flex-start-start;

      .c-form-group__label-wrapper {
        flex-shrink: 0;
        width: 140px;
        padding-top: calc(
          (
              (var(--font-size-sm) * var(--control-height-ratio)) -
              (var(--line-height-tight) * var(--font-size-base))
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
    @include flex-start-center;
  }

  &__control {
    @include flex-start-stretch($direction: column);

    position: relative;
    gap: var(--space-1);
  }

  &__error {
    @include text-meta;

    color: var(--color-status-danger);

    @include cyber-text-glow(var(--color-status-danger), 30%, var(--blur-sm));
  }

  &__help {
    @include text-meta;
  }

  &:focus-within .c-form-label {
    color: var(--theme-accent);

    @include cyber-text-glow(var(--theme-accent));

    &::before {
      @include state-focus(var(--theme-accent));
    }
  }

  &:has(.c-form-group__error, :invalid, .is-error) .c-form-label {
    color: var(--color-status-danger);

    @include cyber-text-glow(var(--color-status-danger));

    &::before {
      @include state-hover(var(--color-status-danger));
    }
  }
}

.c-form-label {
  @include flex-start-center;
  @include text-label;

  user-select: none;
  gap: var(--space-1);
  color: color-mix(in srgb, var(--theme-accent) 70%, transparent);
  text-transform: uppercase;

  @include state-base;

  &::before {
    --glow-color: color-mix(in srgb, var(--theme-accent) 30%, transparent);

    content: "";

    display: inline-block;

    width: var(--space-2);
    height: var(--space-2);
    border-radius: 50%;

    @include border-base(
      color-mix(in srgb, var(--theme-accent) 70%, transparent),
      var(--border-width-thick)
    );
    @include state-base(none, var(--transition-base), var(--theme-accent));
  }
}
</style>

<style lang="scss">
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: var(--transition-fast);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}
</style>
