<script setup lang="ts">
/**
 * MoleculesDashboardMenuTile
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
  <AtomsPanel
    :as="disabled ? 'div' : NuxtLink"
    :to="!disabled ? to : undefined"
    interactive
    :disabled="disabled"
    class="flex flex-col gap-panel-gap menu-tile"
  >
    <header v-if="icon || title" class="flex items-center gap-1 min-w-0 tile-title">
      <AtomsIcon v-if="icon" :name="icon" class="shrink-0" />
      <span v-if="title">{{ title }}</span>
    </header>

    <p v-if="description" class="tile-desc">
      {{ description }}
    </p>
  </AtomsPanel>
</template>

<style scoped lang="scss">
.menu-tile {
  text-decoration: none;

  .tile-title {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    line-height: var(--line-height-tight);
    color: var(--theme-accent);
    letter-spacing: var(--tracking-wide);
    word-break: keep-all;
    line-break: strict;
    overflow-wrap: anywhere;
  }

  .tile-desc {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    letter-spacing: var(--tracking-normal);
  }
}
</style>
