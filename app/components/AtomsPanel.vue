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

  background: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));
  box-shadow: var(--shadow-elevation-sm);

  transition: var(--transition-panel);

  @include state-interactive;
  @include state-selected;
  @include state-disabled;
}
</style>
