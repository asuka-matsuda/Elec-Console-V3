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
  selected = false,
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
        'p-2': padding === 'sm',
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
  border: var(--border-width-base) solid var(--color-border);

  background: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--surface-rim-highlight), var(--shadow-elevation-sm);

  transition: var(--transition-panel);

  @include state-interactive;
  @include state-selected;
  @include state-disabled;
}
</style>
