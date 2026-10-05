<script setup lang="ts">
/**
 * ResultRack
 * [Tool Organism] ケーブルラック選定ツールの計算・選定結果表示コンポーネント。
 * 1段敷設（平置き・標準）と2段敷設（省スペース）の2段構えで比較表示します。
 */
import { computed } from 'vue'

import type { BadgeVariant } from '~/types/components'
import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import { formatRackResult } from '~/utils/tools/rack/rackResultPresenter'

const props = defineProps<{
  result: RackCalcResult | null
  maxDepth?: number
  mode?: 'strong' | 'weak'
}>()

const vm = computed(() =>
  formatRackResult({
    result: props.result,
    maxDepth: props.maxDepth,
    mode: props.mode,
  }),
)

const BADGE_VARIANT_MAP: Record<string, BadgeVariant> = {
  danger: 'red',
  warning: 'amber',
  success: 'green',
  neutral: 'gray',
  empty: 'gray',
}
</script>

<template>
  <div class="flex flex-col gap-panel-gap">
    <div class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="vm.isEmpty ? 'is-empty' : `is-${vm.tier1.panelStatus}`">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>{{ vm.tier1.title }}</span>
        <Badge v-if="vm.tier1.badgeText" :variant="BADGE_VARIANT_MAP[vm.tier1.panelStatus]">{{ vm.tier1.badgeText }}</Badge>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span>{{ vm.tier1.displaySize }}</span>
      </output>
    </div>

    <div class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="vm.isEmpty ? 'is-empty' : `is-${vm.tier2.panelStatus}`">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>{{ vm.tier2.title }}</span>
        <Badge v-if="vm.tier2.badgeText" :variant="BADGE_VARIANT_MAP[vm.tier2.panelStatus]">{{ vm.tier2.badgeText }}</Badge>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span v-if="vm.tier2.isApplicable">{{ vm.tier2.displaySize }}</span>
        <span v-else class="not-applicable py-inline-gap">{{ vm.tier2.notApplicableText }}</span>
      </output>
    </div>

    <dl v-if="vm.details?.length" class="flex flex-col gap-inline-gap w-full details-list">
      <div v-for="(item, i) in vm.details" :key="i" class="flex items-center justify-between">
        <dt>{{ item.label }}</dt>
        <dd class="flex items-center gap-inline-gap">
          <span class="value">{{ item.value }}</span>
          <span v-if="item.unit">{{ item.unit }}</span>
          <span v-if="item.note">{{ item.note }}</span>
        </dd>
      </div>
    </dl>
  </div>
</template>

<style scoped lang="scss">
.result-tile {
  padding: var(--space-2) var(--space-3);
  border: var(--border-width-base) solid var(--color-border);

  background: var(--surface-bg);
  box-shadow: var(--shadow-sink);

  transition: var(--transition-panel);

  .tile-header {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);
    letter-spacing: var(--tracking-wide);
  }

  .tile-value {
    font-family: var(--font-mono);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
    line-height: var(--line-height-tight);
    color: var(--color-text-main);
  }

  &.is-success { --status-color: var(--color-status-success); }
  &.is-warning { --status-color: var(--color-status-warning); }
  &.is-danger  { --status-color: var(--color-status-danger); }

  &.is-success,
  &.is-warning,
  &.is-danger {
    border-color: color-mix(in srgb, var(--status-color) 40%, transparent);

    .tile-value {
      color: var(--status-color);
    }
  }

  &.is-empty {
    opacity: 0.6;

    .tile-value {
      color: var(--color-text-muted);
    }
  }
}

.not-applicable {
  font-family: var(--font-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
}

.details-list {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-ui);
  color: var(--color-text-muted);

  dt {
    font-weight: var(--font-weight-normal);
  }

  .value {
    font-variant-numeric: tabular-nums;
    color: var(--color-text-main);
  }
}
</style>
