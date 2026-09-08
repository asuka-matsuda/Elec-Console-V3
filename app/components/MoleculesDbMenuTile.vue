<script setup lang="ts">
/**
 * MoleculesDbMenuTile
 * [Molecules] ダッシュボード（Dashboard）で各機能を選択するための専用ナビゲーションタイル。
 */
import { NuxtLink } from '#components'

const {
  to,
  disabled = false,
  title,
  icon,
  description,
} = defineProps<{
  to?: string
  disabled?: boolean
  title?: string
  icon?: string
  description?: string
}>()
</script>

<template>
  <component
    :is="disabled ? 'div' : NuxtLink"
    :to="!disabled ? to : undefined"
    class="relative z-[1] flex flex-col gap-[var(--space-panel-gap)] p-[var(--space-panel-pad)] overflow-hidden menu-tile"
    :class="{ 'is-disabled': disabled }"
    :aria-disabled="disabled ? 'true' : undefined"
  >
    <header v-if="icon || title" class="flex items-center gap-1 min-w-0 tile-title">
      <AtomsIcon v-if="icon" :name="icon" class="shrink-0" />
      <span v-if="title">{{ title }}</span>
    </header>

    <p v-if="description" class="tile-desc">
      {{ description }}
    </p>
  </component>
</template>

<style scoped lang="scss">
.menu-tile {
  cursor: pointer;
  user-select: none;

  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  text-decoration: none;

  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));

  transition: var(--transition-base);

  // 非活性状態
  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
    filter: grayscale(100%);
  }

  // 通常時のインタラクション状態
  &:not(.is-disabled) {
    &:hover {
      border-color: var(--theme-accent);
      box-shadow: var(--shadow-glow-hover);
      transition: var(--transition-glow);
    }

    &:focus-visible {
      border-color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
      outline: none;
      box-shadow: var(--shadow-glow-focus);
      transition: var(--transition-glow);
    }

    &:active {
      border-color: var(--theme-accent);
      box-shadow: var(--shadow-glow-active);
      transition: var(--transition-glow);

      svg {
        filter: var(--drop-shadow-glow-xs);
        stroke: var(--theme-accent);
      }
    }
  }

  .tile-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: var(--theme-accent);
    letter-spacing: var(--tracking-wide);
    word-break: keep-all;
    line-break: strict;
    overflow-wrap: anywhere;
  }

  .tile-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    letter-spacing: var(--tracking-normal);
  }
}
</style>
