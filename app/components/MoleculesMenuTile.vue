<script setup lang="ts">
/**
 * MoleculesMenuTile
 * [Molecules] ダッシュボードやポータルで機能・現場を選択するためのナビゲーションタイル。
 */
import { computed } from 'vue'

import { NuxtLink } from '#components'

const {
  to,
  href,
  disabled = false,
  title,
  icon,
  description,
} = defineProps<{
  to?: string
  href?: string
  disabled?: boolean
  title?: string
  icon?: string
  description?: string
}>()

const target = computed(() => to || href)
</script>

<template>
  <component
    :is="disabled ? 'button' : NuxtLink"
    :to="!disabled ? target : undefined"
    :type="disabled ? 'button' : undefined"
    :disabled="disabled ? true : undefined"
    class="relative flex flex-col gap-[var(--space-panel-gap)] p-[var(--space-panel-pad)] overflow-hidden menu-tile"
    :class="{ 'is-disabled': disabled }"
  >
    <header v-if="icon || title || $slots.badge" class="flex items-center justify-between gap-2 tile-header">
      <div class="flex items-center gap-1 min-w-0 tile-title">
        <AtomsIcon v-if="icon" :name="icon" class="shrink-0 tile-icon" />
        <span v-if="title">{{ title }}</span>
      </div>
      <slot name="badge" />
    </header>

    <p v-if="description" class="tile-desc">
      {{ description }}
    </p>

    <slot />
  </component>
</template>

<style scoped lang="scss">
.menu-tile {
  cursor: pointer;
  user-select: none;

  z-index: 1;

  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);

  text-decoration: none;

  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-sm));

  transition: var(--transition-base);

  &:hover:not(.is-disabled) {
    border-color: var(--theme-accent);
    box-shadow: var(--shadow-glow-hover);
    transition: var(--transition-glow);
  }

  &:focus-visible:not(.is-disabled) {
    border-color: color-mix(in srgb, var(--theme-accent) 60%, transparent);
    outline: none;
    box-shadow: var(--shadow-glow-focus);
    transition: var(--transition-glow);
  }

  &:active:not(.is-disabled) {
    border-color: var(--theme-accent);
    box-shadow: var(--shadow-glow-active);
    transition: var(--transition-glow);

    svg {
      filter: var(--drop-shadow-glow-xs);
      stroke: var(--theme-accent);
    }
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
    filter: grayscale(100%);
  }

  .tile-title {
    span {
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-bold);
      line-height: var(--line-height-tight);
      color: var(--color-text-main);
      letter-spacing: var(--tracking-wide);
      word-break: keep-all;
      line-break: strict;
      overflow-wrap: anywhere;
    }
  }

  .tile-icon {
    color: var(--theme-accent);
  }

  .tile-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    letter-spacing: var(--tracking-normal);
  }
}
</style>
