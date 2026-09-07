<script setup lang="ts">
/**
 * MenuTile
 * ダッシュボードやポータルで機能・現場を選択するためのナビゲーションタイル。
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
    class="c-menu-tile"
    :class="{ 'is-disabled': disabled }"
  >
    <div v-if="icon || title || $slots.badge" class="c-menu-tile__head">
      <div class="c-menu-tile__title-group">
        <AppIcon v-if="icon" :name="icon" class="c-menu-tile__icon" />
        <span v-if="title" class="c-menu-tile__title">{{ title }}</span>
      </div>
      <slot name="badge" />
    </div>

    <p v-if="description" class="c-menu-tile__desc">
      {{ description }}
    </p>

    <slot />
  </component>
</template>

<style scoped lang="scss">
.c-menu-tile {
  cursor: pointer;
  user-select: none;

  position: relative;
  z-index: 1;

  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-panel-gap);

  padding: var(--space-panel-pad);
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
      filter: drop-shadow(0 0 2px var(--theme-accent));
      stroke: var(--theme-accent);
    }
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.5;
    filter: grayscale(100%);
  }

  &__head {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    justify-content: space-between;
  }

  &__title-group {
    display: flex;
    gap: var(--space-1);
    align-items: center;
  }

  &__icon {
    flex-shrink: 0;
    color: var(--theme-accent);
  }

  &__title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: var(--color-text-main);
    letter-spacing: var(--tracking-wide);
    word-break: keep-all;
    line-break: strict;
    overflow-wrap: anywhere;
  }

  &__desc {
    font-size: var(--font-size-sm);
    line-height: var(--line-height-base);
    color: var(--color-text-secondary);
    letter-spacing: var(--tracking-normal);
  }
}
</style>
