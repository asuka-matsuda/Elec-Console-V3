<script setup lang="ts">
/**
 * AtomsPanel
 * [Atoms] 背景・枠線・角丸・影などの装飾のみを提供する純粋なサーフェス枠コンポーネント。
 * interactive, selected, disabled による状態管理を一元提供します。
 */
defineProps<{
  as?: string | object
  interactive?: boolean
  selected?: boolean
  disabled?: boolean
}>()
</script>

<template>
  <component
    :is="as || 'section'"
    class="relative z-[1] p-[var(--space-panel-pad)] overflow-hidden panel"
    :class="{
      'is-interactive': interactive,
      'is-selected': selected,
      'is-disabled': disabled,
    }"
  >
    <slot />
  </component>
</template>

<style scoped lang="scss">
.panel {
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  background: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--shadow-elevation-sm);

  transition: var(--transition-panel);

  &.is-interactive:not(.is-disabled) {
    cursor: pointer;
    user-select: none;

    &:hover,
    &:focus-visible {
      border-color: var(--theme-accent);
      background: color-mix(in srgb, var(--theme-accent) 8%, var(--surface-bg));
      box-shadow: var(--shadow-glow-hover);
    }

    &:active {
      transform: scale(0.992);
      background: color-mix(in srgb, var(--theme-accent) 12%, var(--surface-bg));
      box-shadow: var(--shadow-glow-active);
    }
  }

  &.is-selected {
    border-color: var(--theme-accent);
    background: color-mix(in srgb, var(--theme-accent) 12%, var(--surface-bg));
    box-shadow: var(--shadow-glow-sm);

    &.is-interactive:not(.is-disabled) {
      &:hover,
      &:focus-visible {
        background: color-mix(in srgb, var(--theme-accent) 16%, var(--surface-bg));
        box-shadow: var(--shadow-glow-hover);
      }

      &:active {
        background: color-mix(in srgb, var(--theme-accent) 18%, var(--surface-bg));
        box-shadow: var(--shadow-glow-active);
      }
    }
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}
</style>
