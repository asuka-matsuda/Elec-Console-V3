<script setup lang="ts">
/**
 * Panel
 * コンテンツ領域を囲むパネル枠コンポーネント。
 */
import type { PanelProps } from '~/types/components'

const {
  as = 'div',
  padding = 'normal',
  interactive = false,
  active = false,
  disabled = false,
} = defineProps<PanelProps>()
</script>

<template>
  <component
    :is="as"
    class="panel"
    :class="[
      {
        'p-panel-pad': padding === 'normal',
        'p-panel-pad-compact': padding === 'compact',
        'p-0': padding === 'none',
        'is-interactive': interactive,
        'is-active': active,
        'is-disabled': disabled,
      },
    ]"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.panel {
  isolation: isolate;

  border: var(--border-width-base) solid var(--color-border);

  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--surface-rim-highlight), var(--shadow-elevation-sm);

  transition: var(--transition-panel);

  &.is-interactive {
    position: relative;

    @include state-interactive;

    &::before {
      pointer-events: none;
      content: "";

      position: absolute;
      inset: 0;

      opacity: 0;
      background:
        linear-gradient(
          135deg,
          color-mix(in srgb, var(--theme-accent) 10%, transparent) 0%,
          color-mix(in srgb, var(--theme-accent) 3%, transparent) 45%,
          transparent 80%
        );

      transition: opacity var(--duration-base) var(--ease-base);
    }

    &:hover {
      border-color: color-mix(in srgb, var(--theme-accent) 70%, var(--color-border));
      box-shadow:
        var(--surface-rim-accent),
        var(--shadow-glow-hover);

      &::before {
        opacity: 1;
      }
    }

    &:active {
      transform: scale(0.992);
      border-color: var(--theme-accent);
      box-shadow:
        var(--surface-rim-accent),
        var(--shadow-glow-active);

      &::before {
        opacity: 1;
      }
    }
  }

  &.is-active {
    border-color: var(--theme-accent);
    box-shadow:
      var(--surface-rim-accent),
      var(--shadow-glow-sm);

    &.is-interactive::before {
      opacity: 1;
      background:
        linear-gradient(
          135deg,
          color-mix(in srgb, var(--theme-accent) 14%, transparent) 0%,
          color-mix(in srgb, var(--theme-accent) 6%, transparent) 50%,
          transparent 95%
        );
    }
  }

  @include state-disabled;
}
</style>
