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
  <label
    class="c-checkbox"
    :class="{ 'is-disabled': disabled }"
    :for="inputId"
  >
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
      <!-- Checkmark SVG -->
      <svg
        class="c-checkbox__icon c-checkbox__icon--check"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="square"
        stroke-linejoin="miter"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <!-- Indeterminate (Dash) SVG -->
      <svg
        class="c-checkbox__icon c-checkbox__icon--dash"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="square"
        stroke-linejoin="miter"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </div>
    <span
      v-if="label || $slots.default"
      class="c-checkbox__label"
    >
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped lang="scss">
.c-checkbox {
  --checkbox-color: var(--theme-accent);

  position: relative;

  @include flex-start-center($is-inline: true);

  gap: var(--space-inline-gap);

  @include text-desc;
  @include click-enabled;

  &.is-disabled {
    @include disabled;
  }

  &:hover:not(.is-disabled) {
    .c-checkbox__label {
      color: color-mix(in srgb, var(--checkbox-color) 90%, transparent);

      @include cyber-text-glow(var(--checkbox-color), 20%, var(--blur-sm));
    }

    .c-checkbox__input:not(:focus-visible, :active, :checked)
      + .c-checkbox__box {
      @include state-hover(var(--checkbox-color));
    }
  }

  &:active:not(.is-disabled) .c-checkbox__box {
    @include state-active(var(--checkbox-color));
  }

  &__input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;

    &:focus-visible + .c-checkbox__box {
      @include state-focus(var(--checkbox-color));
      @include cyber-text-glow(var(--checkbox-color));
    }

    &:checked + .c-checkbox__box,
    &:indeterminate + .c-checkbox__box {
      @include state-active(var(--checkbox-color));
    }

    &:checked + .c-checkbox__box .c-checkbox__icon--check {
      opacity: 1;
      filter: drop-shadow(0 0 var(--blur-sm) var(--checkbox-color));
      stroke-dashoffset: 0;
    }

    &:indeterminate + .c-checkbox__box .c-checkbox__icon--dash {
      opacity: 1;
      filter: drop-shadow(0 0 var(--blur-sm) var(--checkbox-color));
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
    @include state-base(var(--shadow-sink));

    .c-checkbox__icon {
      position: absolute;

      width: 70%;
      height: 70%;

      opacity: 0;

      stroke: var(--checkbox-color);
      stroke-dasharray: 24;
      stroke-dashoffset: 24;

      @include state-base;
    }
  }

  &__label {
    @include state-base;
  }
}
</style>
