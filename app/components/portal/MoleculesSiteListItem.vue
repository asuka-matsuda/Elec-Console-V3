<script setup lang="ts">
/**
 * MoleculesSiteListItem
 * [Portal Molecules] 現場一覧の1現場カード/アイテム。
 * 選択状態のハイライト、現場名、ID、ステータスバッジ、有効/無効化操作を提供します。
 */
import type { Site } from '~/types/admin'
import {
  getSiteStatusColor,
  getSiteStatusLabel,
} from '~/utils/portal'

defineProps<{
  site: Site
  isSelected?: boolean
}>()

const emit = defineEmits<{
  (e: 'select' | 'toggle-disable', site: Site): void
}>()
</script>

<template>
  <div
    class="site-item flex items-center justify-between gap-3 p-3"
    :class="{
      'is-active': isSelected,
      'is-disabled': !!site.disabledAt,
    }"
    @click="emit('select', site)"
  >
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <span class="site-name">
          {{ site.name }}
        </span>
        <AtomsBadge :color="getSiteStatusColor(site.status)">
          {{ getSiteStatusLabel(site.status) }}
        </AtomsBadge>
        <AtomsBadge v-if="site.disabledAt" color="var(--color-status-danger)">
          無効
        </AtomsBadge>
      </div>
      <div class="site-id">
        ID: {{ site.id }}
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-1" @click.stop>
      <AtomsButton
        :variant="site.disabledAt ? 'success' : 'danger'"
        @click="emit('toggle-disable', site)"
      >
        {{ site.disabledAt ? '有効化' : '無効化' }}
      </AtomsButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.site-item {
  cursor: pointer;
  user-select: none;

  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);

  background-color: var(--color-bg-subtle);

  transition: var(--transition-base);

  &:hover {
    border-color: var(--theme-accent);
    background-color: color-mix(in srgb, var(--theme-accent) 5%, var(--color-bg-subtle));
  }

  &.is-active {
    border-color: var(--theme-accent);
    background-color: color-mix(in srgb, var(--theme-accent) 8%, var(--color-bg-subtle));
    box-shadow: inset 2px 0 0 var(--theme-accent), var(--shadow-glow-sm, 0 0 6px rgb(47 129 247 / 20%));
  }

  &.is-disabled {
    opacity: 0.65;
  }

  .site-name {
    overflow: hidden;

    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold, 700);
    color: var(--color-text-main);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .site-id {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
}
</style>
