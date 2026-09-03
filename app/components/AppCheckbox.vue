<script setup lang="ts">
/**
 * AppCheckbox
 * 真偽値を選択するためのチェックボックスコンポーネント
 */
import { useId } from 'vue'

const model = defineModel<boolean | unknown[]>()

defineProps<{
  value?: unknown
  label?: string
  disabled?: boolean
  indeterminate?: boolean
}>()

const inputId = useId()
</script>

<template>
  <label class="c-checkbox" :for="inputId">
    <input
      :id="inputId"
      v-model="model"
      type="checkbox"
      .indeterminate="indeterminate"
      class="c-checkbox__input"
      :value="value"
      :disabled="disabled"
    />
    <div class="c-checkbox__box">
      <AppIcon name="check" class="c-checkbox__icon c-checkbox__icon--check" />
      <AppIcon name="minus" class="c-checkbox__icon c-checkbox__icon--dash" />
    </div>
    <span v-if="label || $slots.default" class="c-checkbox__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.c-checkbox {
  --checkbox-color: var(--theme-accent);

  @include flex-start-center($is-inline: true);
  @include text-desc;
  @include click-enabled;

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
        ~ .c-checkbox__label {
          color: color-mix(in srgb, var(--checkbox-color) 90%, transparent);

          @include cyber-text-glow(var(--checkbox-color), 20%, var(--blur-sm));
        }

        &:not(:focus-visible, :active, :checked, :indeterminate) ~ .c-checkbox__box {
          @include state-hover(var(--checkbox-color));
        }
      }

      &:active ~ .c-checkbox__box {
        @include state-active(var(--checkbox-color));
      }
    }

    &:disabled {
      ~ .c-checkbox__box,
      ~ .c-checkbox__label {
        @include disabled;
      }
    }

    &:focus-visible ~ .c-checkbox__box {
      @include state-focus(var(--checkbox-color));
      @include cyber-text-glow(var(--checkbox-color));
    }

    &:is(:checked, :indeterminate) ~ .c-checkbox__box {
      @include state-active(var(--checkbox-color));

      .c-checkbox__icon {
        filter: drop-shadow(0 0 var(--blur-sm) var(--checkbox-color));
      }
    }

    &:checked ~ .c-checkbox__box .c-checkbox__icon--check :deep(polyline),
    &:indeterminate ~ .c-checkbox__box .c-checkbox__icon--dash :deep(line) {
      stroke-dashoffset: 0;
    }
  }

  &__box {
    @include flex-center-center;

    position: relative;
    flex-shrink: 0;
    width: 1.4em;
    height: 1.4em;

    @include border-base($opacity: 30%);
    @include state-base;

    .c-checkbox__icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);

      width: 70%;
      height: 70%;

      color: var(--checkbox-color);

      :deep(svg) {
        stroke-linecap: square;
        stroke-linejoin: miter;
        stroke-width: 3;
      }

      :deep(:is(polyline, line)) {
        stroke-dasharray: 24;
        stroke-dashoffset: 24;
        transition: stroke-dashoffset var(--duration-base) var(--ease-base);
      }
    }
  }

  &__label {
    @include state-base;
  }
}
</style>
