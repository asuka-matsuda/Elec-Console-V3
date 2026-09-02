<script setup lang="ts">
/**
 * AppToggle
 * トグルスイッチ（チェックボックス）のUIを提供するコンポーネントです。ON/OFFの切り替えに使用されます。
 */
import { useId } from 'vue'

const model = defineModel<boolean>()

defineProps<{
  label?: string
  disabled?: boolean
}>()

const inputId = useId()
</script>

<template>
  <label
    class="c-toggle"
    :for="inputId"
  >
    <input
      :id="inputId"
      v-model="model"
      type="checkbox"
      class="c-toggle__input"
      :disabled="disabled"
    />
    <div class="c-toggle__track">
      <div class="c-toggle__thumb" />
    </div>
    <span
      v-if="label || $slots.default"
      class="c-toggle__label"
    >
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

  &:has(.c-toggle__input:disabled) {
    @include disabled;
  }

  &__input {
    /* Hide native input visually, but keep accessible for keyboard focus */
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;

    /* 1. Keyboard Focus State */

    &:focus-visible + .c-toggle__track {
      @include state-focus(var(--toggle-color));
      @include cyber-text-glow(var(--toggle-color));
    }

    /* 2. Checked State (ON) */
    &:checked + .c-toggle__track {
      @include state-active(var(--toggle-color));

      /* Slide and glow the thumb */

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

  /* --- インタラクション (Disabled時以外) --- */
  &:not(:has(.c-toggle__input:disabled)) {
    /* 3. Hover State */
    &:hover {
      .c-toggle__label {
        color: color-mix(in srgb, var(--toggle-color) 90%, transparent);
        @include cyber-text-glow(var(--toggle-color), 20%, var(--blur-sm));
      }

      /* Hover時の箱発光 (FocusやActive/Checkedでない時) */
      .c-toggle__input:not(:focus-visible, :active, :checked) + .c-toggle__track {
        @include state-hover(var(--toggle-color));
      }
    }

    /* 4. Active (Press) State */
    &:active {
      .c-toggle__track {
        transform: scale(0.95);
        transition: transform var(--duration-slow) var(--ease-base);
      }

      .c-toggle__thumb {
        @include shadow("sink");
      }
    }
  }
}
</style>
