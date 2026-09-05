<script setup lang="ts">
/**
 * AppFormGroup
 * フォームのラベル、入力項目、エラーメッセージ、ヘルプテキストをグループ化して表示するコンポーネントです。
 */
withDefaults(
  defineProps<{
    label?: string
    required?: boolean
    requiredLabel?: string
    error?: string
    help?: string
    layout?: 'vertical' | 'horizontal'
  }>(),
  {
    required: false,
    requiredLabel: 'REQUIRED',
    layout: 'vertical',
  },
)
</script>

<template>
  <div class="c-form-group" :class="`is-${layout}`">
    <label v-if="label || $slots.label" class="c-form-group__label">
      <span class="c-form-group__label-text">
        <slot name="label">{{ label }}</slot>
      </span>
      <AppBadge
        v-if="required"
        color="danger"
        size="sm"
      >
        {{ requiredLabel }}
      </AppBadge>
    </label>

    <div class="c-form-group__control">
      <slot />

      <transition name="fade-slide">
        <div v-if="error" class="c-form-group__error">
          {{ error }}
        </div>
      </transition>

      <div v-if="help && !error" class="c-form-group__help">
        {{ help }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-form-group {
  &.is-horizontal {
    @include flex-start-start;
  }

  &.is-vertical {
    @include flex-start-stretch($direction: column);
  }

  &__label {
    @include flex-start-center;

    cursor: pointer;
    user-select: none;

    .is-horizontal & {
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

    .is-vertical & {
      width: 100%;
      margin-bottom: var(--space-2);
    }
  }

  &__label-text {
    @include text-label("sm");
    @include flex-start-center($is-inline: true);

    gap: var(--space-1);
    color: var(--color-text-main);
    letter-spacing: var(--tracking-wide);

    @include state-base;

    &::before {
      content: "";

      flex-shrink: 0;

      width: var(--space-0-5);
      height: var(--font-size-xs);
      border-radius: var(--radius-sm);

      background-color: var(--theme-accent);

      transition: var(--transition-fast);
    }
  }

  &__control {
    position: relative;
    gap: var(--space-1);

    .is-horizontal & {
      flex: 1;
      min-width: 0;
    }

    .is-vertical & {
      @include flex-start-stretch($direction: column);
    }
  }

  &__error {
    @include text-meta;

    color: var(--color-status-danger);

    @include cyber-text-glow(var(--color-status-danger), 30%, var(--blur-sm));
  }

  &__help {
    @include text-meta;
  }

  &:focus-within &__label-text {
    color: var(--theme-accent);

    &::before {
      transform: scaleY(1.2);
      background-color: var(--theme-accent);
      box-shadow: 0 0 var(--blur-sm) var(--theme-accent);
    }
  }

  &:has(.c-form-group__error, .is-error) &__label-text {
    color: var(--color-status-danger);

    &::before {
      background-color: var(--color-status-danger);
      box-shadow: 0 0 var(--blur-sm) var(--color-status-danger);
    }
  }
}

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
