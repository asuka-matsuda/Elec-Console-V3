<script setup lang="ts">
/**
 * ResultVoltage
 * [Tool Organism] 電圧降下やケーブルサイズの計算結果を視覚的に表示するコンポーネント。
 */
import { computed } from 'vue'

import type { BadgeVariant } from '~/types/components'
import type { VoltageCalcInputs, VoltageCalcResult } from '~/types/voltage'
import { formatVoltageResult } from '~/utils/tools/voltage/voltageResultPresenter'

const props = defineProps<{
  inputs: VoltageCalcInputs
  result: VoltageCalcResult | null
  size?: 'sm' | 'md'
}>()

const vm = computed(() => formatVoltageResult(props.inputs, props.result))

const BADGE_VARIANT_MAP: Record<string, BadgeVariant> = {
  danger: 'red',
  warning: 'amber',
  success: 'green',
  neutral: 'gray',
  empty: 'gray',
}
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0" :class="[size === 'sm' ? 'gap-item-gap is-sm' : 'gap-panel-gap']">
    <div class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="[`is-${vm.mainStatus}`, size === 'sm' && 'is-sm']">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>{{ vm.mainLabel }}</span>
        <Badge v-if="vm.mainBadgeText" :variant="BADGE_VARIANT_MAP[vm.mainStatus]">{{ vm.mainBadgeText }}</Badge>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span>{{ vm.mainValue }}</span>
        <span v-if="vm.mainUnit" class="value-unit">{{ vm.mainUnit }}</span>
      </output>
    </div>

    <div class="result-tile is-sm flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="`is-${vm.ampStatus}`">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>電流チェック (設計 / 許容)</span>
        <Badge v-if="vm.ampBadgeText" :variant="BADGE_VARIANT_MAP[vm.ampStatus]">{{ vm.ampBadgeText }}</Badge>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span v-if="vm.isAmpError">ERROR</span>
        <template v-else>
          <span>{{ vm.currentI }}</span>
          <span class="value-sep">/</span>
          <span>{{ vm.maxI }}</span>
          <span class="value-unit">A</span>
        </template>
      </output>
    </div>

    <div v-if="vm.mode === 'size'" class="result-tile is-sm flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="`is-${vm.dropStatus}`">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>電圧降下</span>
        <Badge v-if="vm.dropBadgeText" :variant="BADGE_VARIANT_MAP[vm.dropStatus]">{{ vm.dropBadgeText }}</Badge>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span v-if="vm.isDropError">ERROR</span>
        <template v-else>
          <span>{{ vm.dropV }}</span>
          <span class="value-unit">V</span>
          <span v-if="vm.dropPercentText" class="value-unit">{{ vm.dropPercentText }}</span>
        </template>
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

  &.is-sm {
    padding: var(--space-1) var(--space-2);

    .tile-value {
      font-size: var(--font-size-2xl);
    }
  }

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

    .value-unit,
    .value-sep {
      font-family: var(--font-base);
      font-size: var(--font-size-sm);
      font-weight: var(--font-weight-normal);
      color: var(--color-text-secondary);
    }
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
