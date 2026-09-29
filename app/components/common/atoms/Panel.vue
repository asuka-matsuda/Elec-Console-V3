<script setup lang="ts">
/**
 * Panel
 * [Atoms] 背景・枠線・影などの装飾のみを提供する純粋なサーフェス枠コンポーネント。
 * interactive, selected, disabled による状態管理を一元提供します。
 */
import type { PanelOverflow, PanelProps } from '~/types/components'

const {
  as = 'div',
  interactive = false,
  active = false,
  disabled = false,
  overflow = 'hidden',
  padding = 'normal',
} = defineProps<PanelProps>()

const OVERFLOW_CLASSES: Record<PanelOverflow, string> = {
  hidden: 'overflow-hidden',
  visible: 'overflow-visible',
  auto: 'overflow-auto',
}
</script>

<template>
  <component
    :is="as"
    class="relative z-[1] panel"
    :class="[
      OVERFLOW_CLASSES[overflow],
      {
        'p-panel-pad': padding === 'normal',
        'p-panel-pad-compact': padding === 'compact',
        'p-item-gap': padding === 'sm',
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
  border: var(--border-width-base) solid var(--color-border);

  background: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--surface-rim-highlight), var(--shadow-elevation-sm);

  transition: var(--transition-panel);

  @include state-interactive {
    &:hover {
      border-color: color-mix(in srgb, var(--theme-accent) 70%, var(--color-border));
      background:
        linear-gradient(
          135deg,
          color-mix(in srgb, var(--theme-accent) 9%, transparent) 0%,
          color-mix(in srgb, var(--theme-accent) 3%, transparent) 45%,
          transparent 80%
        ),
        var(--surface-bg);
      box-shadow:
        var(--surface-rim-accent),
        var(--shadow-glow-hover);
    }

    &:active {
      transform: scale(0.992);
      border-color: var(--theme-accent);
      box-shadow:
        var(--surface-rim-accent),
        var(--shadow-glow-active);
    }
  }

  &.is-active {
    border-color: var(--theme-accent);
    box-shadow:
      var(--surface-rim-accent),
      var(--shadow-glow-sm);

    @include state-interactive {
      background:
        linear-gradient(
          135deg,
          color-mix(in srgb, var(--theme-accent) 14%, transparent) 0%,
          color-mix(in srgb, var(--theme-accent) 6%, transparent) 50%,
          transparent 95%
        ),
        var(--surface-bg);
    }
  }

  @include state-disabled;
}
</style>
