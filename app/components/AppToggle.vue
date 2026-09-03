<script setup lang="ts">
/**
 * AppToggle
 * トグルスイッチ（チェックボックス）のUIを提供するコンポーネントです。ON/OFFの切り替えに使用されます。
 */
const model = defineModel<boolean>()

defineProps<{
  label?: string
  disabled?: boolean
}>()
</script>

<template>
  <label class="c-toggle">
    <input
      v-model="model"
      type="checkbox"
      class="c-toggle__input"
      :disabled="disabled"
    />
    <div class="c-toggle__track">
      <div class="c-toggle__thumb" />
    </div>
    <span v-if="label || $slots.default" class="c-toggle__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.c-toggle {
  --toggle-color: var(--theme-accent);
  --track-w: 44px;
  --track-h: var(--space-5);
  --thumb-w: var(--space-5);

  @include text-desc;
  @include click-enabled;
  @include flex-start-center($is-inline: true);

  position: relative;
  gap: var(--space-2);

  &__input {
    cursor: inherit;

    position: absolute;
    z-index: 1;
    inset: 0;

    width: 100%;
    height: 100%;

    opacity: 0;

    &:not(:disabled) {
      &:hover {
        ~ .c-toggle__label {
          color: color-mix(in srgb, var(--toggle-color) 90%, transparent);

          @include cyber-text-glow(var(--toggle-color), 20%, var(--blur-sm));
        }

        &:not(:focus-visible, :active, :checked) ~ .c-toggle__track {
          @include state-hover(var(--toggle-color));
        }
      }

      &:active {
        ~ .c-toggle__track {
          transform: scale(0.95);
          transition: transform var(--duration-slow) var(--ease-base);

          .c-toggle__thumb {
            @include shadow("sink");
          }
        }
      }
    }

    &:disabled {
      ~ .c-toggle__track,
      ~ .c-toggle__label {
        @include disabled;
      }
    }

    &:focus-visible ~ .c-toggle__track {
      @include state-focus(var(--toggle-color));
      @include cyber-text-glow(var(--toggle-color));
    }

    &:checked ~ .c-toggle__track {
      @include state-active(var(--toggle-color));

      .c-toggle__thumb {
        transform: translateX(calc(var(--track-w) - var(--thumb-w)));

        @include state-hover(var(--toggle-color));
      }
    }
  }

  &__track {
    position: relative;
    flex-shrink: 0;
    width: var(--track-w);
    height: var(--track-h);

    @include border-base;
    @include state-base("sink", var(--transition-glow));
  }

  &__thumb {
    position: absolute;
    z-index: 1;
    top: -1px;
    left: -1px;

    width: var(--thumb-w);
    height: var(--track-h);

    transition:
      transform var(--duration-base) var(--ease-smooth),
      background-color var(--duration-base) var(--ease-base),
      box-shadow var(--duration-base) var(--ease-base),
      border-color var(--duration-base) var(--ease-base);

    @include border-base;
    @include shadow("sm");
  }

}
</style>
