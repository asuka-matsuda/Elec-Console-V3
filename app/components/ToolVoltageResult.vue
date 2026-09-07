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
  <div class="voltage-result" :class="[size === 'sm' ? 'is-sm' : '']">
    <AppResultBox
      :title="view.mainLabel"
      :status="mainBoxStatus"
      :size="size"
    >
      <template #value>
        <span class="value-text main-val">{{ view.mainValue }}</span>
        <span v-if="view.mainUnit" class="value-unit main-unit">{{ view.mainUnit }}</span>
        <template v-if="view.mode === 'drop' && view.isReady">
          <span class="value-sep">(</span>
          <span
            class="value-text drop-percent"
          >{{ view.dropPercent }}</span>
          <span class="value-unit drop-unit">%</span>
          <span class="value-sep">)</span>
        </template>
      </template>
    </AppResultBox>

    <div class="metrics">
      <dl class="metric-box">
        <dt class="metric-label">電流チェック (設計 / 許容)</dt>
        <dd class="metric-value" :class="view.ampStatusClass">
          <span class="value-text">{{ view.currentI }}</span>
          <span class="value-sep">/</span>
          <span class="value-text">{{ view.maxI }}</span>
          <span class="value-unit">A</span>
        </dd>
      </dl>

      <dl v-if="view.mode === 'size'" class="metric-box">
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

      <dl v-else class="metric-box">
        <dt class="metric-label">選択ケーブル</dt>
        <dd class="metric-value is-neutral">
          <span class="value-text drop-cable">{{
            view.dropCableName
          }}</span>
        </dd>
      </dl>
    </div>
  </div>
</template>

<style scoped lang="scss">
.voltage-result {
  display: flex;
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

  &.is-sm {
    gap: var(--space-3);

    .main-val {
      font-size: var(--font-size-2xl);
    }

    .drop-percent {
      font-size: var(--font-size-base);
    }

    .drop-cable {
      font-size: var(--font-size-sm);
    }

    .metric-box {
      padding: var(--space-1) var(--space-2);
    }
  }

  .is-neutral {
    color: var(--color-text-muted);
  }

  .is-success {
    --glow-color: var(--color-status-success);

    color: var(--color-status-success);
    text-shadow: var(--text-glow-md);
  }

  .is-warning {
    --glow-color: var(--color-status-warning);

    color: var(--color-status-warning);
    text-shadow: var(--text-glow-md);
  }

  .is-danger {
    --glow-color: var(--color-status-danger);

    color: var(--color-status-danger);
    text-shadow: var(--text-glow-md);
  }
}

.main-val {
  font-family: var(--font-mono);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.main-unit {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
}

.drop-percent {
  font-family: var(--font-mono);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.drop-unit {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.drop-cable {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.metrics {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: var(--space-2);

  min-width: 220px;

  // コンテナ幅が狭い場合 (down <= 600px) は下部に横並び
  @include cq("sm") {
    flex-flow: row wrap;
    min-width: auto;
  }
}

.metric-box {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;

  padding: var(--space-2);
  border: var(--border-width-base) solid var(--color-border);
  border-radius: var(--radius-sm);
}

.metric-label {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.metric-value {
  display: flex;
  gap: var(--space-1);
  align-items: baseline;

  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
}

.value-sep {
  margin: 0 2px;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.value-unit {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
