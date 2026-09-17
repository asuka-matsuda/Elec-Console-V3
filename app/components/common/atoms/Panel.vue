<script setup lang="ts">
/**
 * Panel
 * [Atoms] 背景・枠線・影などの装飾のみを提供する純粋なサーフェス枠コンポーネント。
 * interactive, selected, disabled による状態管理を一元提供します。
 */
import type { PanelProps } from '~/types/components'

const {
  as = 'div',
  interactive = false,
  selected = false,
  disabled = false,
  overflow = 'hidden',
} = defineProps<PanelProps>()
</script>

<template>
  <component
    :is="as"
    class="relative z-[1] panel"
    :class="[
      `is-overflow-${overflow}`,
      {
        'is-interactive': interactive,
        'is-selected': selected,
        'is-disabled': disabled,
      },
    ]"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.panel {
  padding: var(--panel-padding, var(--space-panel-pad));
  border: var(--border-width-base) solid var(--color-border);

  background: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--shadow-elevation-sm);

  transition: var(--transition-panel);

  @include state-interactive;
  @include state-selected;

  &.is-overflow-hidden {
    overflow: hidden;
  }

  &.is-overflow-visible {
    overflow: visible;
  }

  &.is-overflow-auto {
    overflow: auto;
  }

  @include state-disabled;
}
</style>
