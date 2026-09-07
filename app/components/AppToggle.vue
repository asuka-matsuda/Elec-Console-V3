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

  cursor: pointer;
  user-select: none;

  position: relative;

  display: inline-flex;
  gap: var(--space-2);
  align-items: center;

  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);

  &__input {
    cursor: inherit;

    position: absolute;
    z-index: 1;
    inset: 0;

    width: 100%;
    height: 100%;

    opacity: 0;

    &:checked ~ .c-toggle__track .c-toggle__thumb {
      transform: translateX(calc(var(--track-w) - var(--thumb-w)));
    }

    &:disabled {
      ~ .c-toggle__track,
      ~ .c-toggle__label {
        cursor: not-allowed;
        opacity: 0.5;
      }
    }

    &:not(:disabled) {
      &:hover {
        ~ .c-toggle__label {
          color: color-mix(in srgb, var(--toggle-color) 90%, transparent);
          text-shadow: 0 0 var(--blur-sm) color-mix(in srgb, var(--toggle-color) 20%, transparent);
        }

        &:not(:checked) ~ .c-toggle__track {
          border-color: var(--toggle-color);
          box-shadow:
            0 0 4px color-mix(in srgb, var(--toggle-color) 45%, transparent),
            0 0 8px color-mix(in srgb, var(--toggle-color) 20%, transparent);
          transition: var(--transition-glow);
        }
      }

      &:focus-visible ~ .c-toggle__track {
        border-color: color-mix(in srgb, var(--toggle-color) 60%, transparent);

        text-shadow: 0 0 var(--blur-md) color-mix(in srgb, var(--toggle-color) 50%, transparent);

        outline: none;
        box-shadow:
          0 0 0 1px color-mix(in srgb, var(--toggle-color) 70%, transparent),
          0 0 6px color-mix(in srgb, var(--toggle-color) 50%, transparent),
          0 0 12px color-mix(in srgb, var(--toggle-color) 20%, transparent);

        transition: var(--transition-glow);
      }

      &:active ~ .c-toggle__track {
        transform: scale(0.95);

        .c-toggle__thumb {
          box-shadow: var(--shadow-sink);
        }
      }

      &:checked ~ .c-toggle__track {
        border-color: var(--toggle-color);
        box-shadow:
          0 0 4px color-mix(in srgb, var(--toggle-color) 60%, transparent),
          0 0 8px color-mix(in srgb, var(--toggle-color) 30%, transparent),
          inset 0 0 2px color-mix(in srgb, var(--toggle-color) 40%, transparent);
        transition: var(--transition-glow);

        .c-toggle__thumb {
          border-color: var(--toggle-color);
          box-shadow:
            0 0 4px color-mix(in srgb, var(--toggle-color) 45%, transparent),
            0 0 8px color-mix(in srgb, var(--toggle-color) 20%, transparent);
          transition: var(--transition-glow);
        }
      }
    }
  }

  &__track {
    position: relative;
    z-index: 1;

    flex-shrink: 0;

    width: var(--track-w);
    height: var(--track-h);
    border: var(--border-width-base) solid var(--color-border);
    border-radius: var(--radius-sm);

    box-shadow: var(--shadow-sink);

    transition: var(--transition-fast);
  }

  &__thumb {
    position: absolute;
    z-index: 1;
    top: -1px;
    left: -1px;

    width: var(--thumb-w);
    height: var(--track-h);
    border: var(--border-width-base) solid var(--color-border);
    border-radius: var(--radius-sm);

    box-shadow: var(--shadow-elevation-sm);

    transition: var(--transition-base);
  }
}
</style>
