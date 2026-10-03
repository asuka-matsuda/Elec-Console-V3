<script setup lang="ts">
/**
 * ResultWeight
 * [Tool Organism] ケーブル重量・ドラム選定ツールの計算結果表示コンポーネント。
 */
import { computed } from 'vue'

import type { WeightCalcResult } from '~/utils/tools/weight/weightCalcLogic'
import { formatWeightResult } from '~/utils/tools/weight/weightResultPresenter'

const props = defineProps<{
  result: WeightCalcResult | null
}>()

const vm = computed(() => formatWeightResult(props.result))

const BADGE_COLOR_MAP: Record<string, string> = {
  danger: 'var(--color-status-danger)',
  warning: 'var(--color-status-warning)',
  success: 'var(--color-status-success)',
  neutral: 'var(--color-status-neutral)',
  empty: 'var(--color-status-neutral)',
}
</script>

<template>
  <div class="flex flex-col gap-panel-gap">
    <div
      class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0"
      :class="`is-${vm.panelStatus}`"
    >
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>使用ドラム（想定）</span>
        <span v-if="vm.badgeText" class="badge" :style="{ '--glow-color': BADGE_COLOR_MAP[vm.panelStatus] }">
          {{ vm.badgeText }}
        </span>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span>{{ vm.displayDrum }}</span>
      </output>
    </div>

    <div
      class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0"
      :class="`is-${vm.panelStatus}`"
    >
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>総重量 (ケーブル+ドラム)</span>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span>{{ vm.displayTotalWeight }}</span>
        <span v-if="!vm.isError && vm.hasBestDrum" class="value-unit">kg</span>
      </output>
    </div>

    <dl v-if="vm.details?.length" class="flex flex-col gap-inline-gap w-full details-list">
      <div
        v-for="(item, i) in vm.details"
        :key="i"
        class="flex items-center justify-between"
      >
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

    .value-unit {
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
