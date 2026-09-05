<script setup lang="ts">
/**
 * ToolVoltageResult
 * 電圧降下やケーブルサイズの計算結果を視覚的に表示するコンポーネントです。
 */
import { computed } from 'vue'

import type { VoltageCalcInputs, VoltageCalcResult } from '~/types/voltage'
import { formatVoltageResult } from '~/utils/tools/voltage/voltageResultPresenter'

const props = defineProps<{
  inputs: VoltageCalcInputs
  result: VoltageCalcResult | null
  size?: 'sm' | 'md'
}>()

const view = computed(() => formatVoltageResult(props.inputs, props.result))

const mainBoxStatus = computed(() =>
  view.value.mainStatusClass.replace('is-', '') as 'neutral' | 'success' | 'warning' | 'danger',
)
</script>

<template>
  <div class="c-voltage-result" :class="[size === 'sm' ? 'is-sm' : '']">
    <AppResultBox
      :title="view.mainLabel"
      :status="mainBoxStatus"
      :size="size"
    >
      <template #value>
        <span class="value-text c-voltage-result__main-val">{{ view.mainValue }}</span>
        <span v-if="view.mainUnit" class="value-unit c-voltage-result__main-unit">{{ view.mainUnit }}</span>
        <template v-if="view.mode === 'drop' && view.isReady">
          <span class="value-sep">(</span>
          <span
            class="value-text c-voltage-result__drop-percent"
          >{{ view.dropPercent }}</span>
          <span class="value-unit c-voltage-result__drop-unit">%</span>
          <span class="value-sep">)</span>
        </template>
      </template>
    </AppResultBox>

    <div class="c-voltage-result__metrics">
      <dl class="metric-card">
        <dt class="metric-label">電流チェック (設計 / 許容)</dt>
        <dd class="metric-value" :class="view.ampStatusClass">
          <span class="value-text">{{ view.currentI }}</span>
          <span class="value-sep">/</span>
          <span class="value-text">{{ view.maxI }}</span>
          <span class="value-unit">A</span>
        </dd>
      </dl>

      <dl v-if="view.mode === 'size'" class="metric-card">
        <dt class="metric-label">電圧降下</dt>
        <dd class="metric-value" :class="view.dropStatusClass">
          <span class="value-text">{{ view.dropV }}</span>
          <span class="value-unit">V</span>
          <span class="value-sep">(</span>
          <span class="value-text">{{ view.dropPercent }}</span>
          <span class="value-unit">%</span>
          <span class="value-sep">)</span>
        </dd>
      </dl>

      <dl v-else class="metric-card">
        <dt class="metric-label">選択ケーブル</dt>
        <dd class="metric-value is-neutral">
          <span class="value-text c-voltage-result__drop-cable">{{
            view.dropCableName
          }}</span>
        </dd>
      </dl>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-voltage-result {
  @include flex-start-stretch;

  flex: 1;
  gap: var(--space-card-gap);
  min-height: 0;

  // コンテナ幅が狭い場合 (down <= 600px) は縦積みに切り替え
  @include cq("sm") {
    flex-direction: column;
  }

  // スロット内の自然な折り返しを許可
  :deep(.c-result-box__value) {
    flex-wrap: wrap;
    row-gap: var(--space-1);
  }

  &__main-val {
    @include text-mono("3xl", "bold");
  }

  &__main-unit {
    @include text-body("base");

    color: var(--color-text-secondary);
  }

  &__drop-percent {
    @include text-mono("xl", "bold");
  }

  &__drop-unit {
    @include text-body("sm");

    color: var(--color-text-secondary);
  }

  &__drop-cable {
    @include text-mono("sm", "bold");
  }

  &.is-sm {
    gap: var(--space-3);

    .c-voltage-result__main-val {
      @include text-mono("2xl", "bold");
    }

    .c-voltage-result__drop-percent {
      @include text-mono("base", "bold");
    }

    .c-voltage-result__drop-cable {
      @include text-mono("sm", "bold");
    }

    .metric-card {
      padding: var(--space-1) var(--space-2);
    }
  }

  .is-neutral {
    color: var(--color-text-muted);
  }

  .is-success {
    color: var(--color-status-success);

    @include cyber-text-glow(var(--color-status-success), 40%, var(--blur-md));
  }

  .is-warning {
    color: var(--color-status-warning);

    @include cyber-text-glow(var(--color-status-warning), 40%, var(--blur-md));
  }

  .is-danger {
    color: var(--color-status-danger);

    @include cyber-text-glow(var(--color-status-danger), 40%, var(--blur-md));
  }

  &__metrics {
    @include flex-start-stretch($direction: column);

    flex-shrink: 0;
    gap: var(--space-2);
    min-width: 220px;

    // コンテナ幅が狭い場合 (down <= 600px) は下部に横並び
    @include cq("sm") {
      flex-flow: row wrap;
      min-width: auto;
    }
  }

  .metric-card {
    @include flex-center-center($direction: column);

    flex: 1;
    gap: var(--space-1);
    padding: var(--space-2);

    @include border-base(var(--color-border), $width: var(--border-width-base));
  }

  .metric-label {
    @include text-meta;
  }

  .metric-value {
    @include text-mono("sm", "bold");
    @include flex-display;

    gap: var(--space-1);
    align-items: baseline;
    margin: 0;
  }

  .value-sep {
    @include text-body("sm");

    margin: 0 2px;
    color: var(--color-text-muted);
  }

  .value-unit {
    @include text-body("sm");

    color: var(--color-text-secondary);
  }
}
</style>
