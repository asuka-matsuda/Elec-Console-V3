<script setup lang="ts">
/**
 * ToolVoltageResult
 * 電圧降下やケーブルサイズの計算結果を視覚的に表示するコンポーネントです。
 */
import { computed } from 'vue'

import type { ResultBoxStatus } from '~/types/components'
import type { VoltageCalcInputs, VoltageCalcResult } from '~/types/voltage'
import { formatVoltageResult } from '~/utils/tools/voltage/voltageResultPresenter'

const props = defineProps<{
  inputs: VoltageCalcInputs
  result: VoltageCalcResult | null
  size?: 'sm' | 'md'
}>()

const view = computed(() => formatVoltageResult(props.inputs, props.result))

const mainBoxStatus = computed(() =>
  (view.value.mainStatusClass?.replace('is-', '') || 'neutral') as ResultBoxStatus,
)

const ampStatus = computed(() =>
  (view.value.ampStatusClass?.replace('is-', '') || 'neutral') as ResultBoxStatus,
)

const dropStatus = computed(() =>
  (view.value.dropStatusClass?.replace('is-', '') || 'neutral') as ResultBoxStatus,
)
</script>

<template>
  <div class="flex flex-1 flex-col gap-[var(--space-card-gap)] voltage-result" :class="[size === 'sm' ? 'is-sm' : '']">
    <!-- 主結果 (電圧降下 or 電線サイズ) -->
    <MoleculesResultBox
      :title="view.mainLabel"
      :status="mainBoxStatus"
      :size="size"
    >
      <span class="value-text main-val">{{ view.mainValue }}</span>
      <span v-if="view.mainUnit" class="value-unit main-unit">{{ view.mainUnit }}</span>
      <template v-if="view.mode === 'drop' && view.isReady">
        <span class="value-sep">(</span>
        <span class="value-text drop-percent">{{ view.dropPercent }}</span>
        <span class="value-unit drop-unit">%</span>
        <span class="value-sep">)</span>
      </template>

      <!-- エラー・警告時のサジェストフッター -->
      <template v-if="view.errorInfo" #footer>
        <div class="voltage-error-box text-center leading-tight">
          <p class="font-medium text-[var(--font-size-2xs)] text-[var(--color-status-danger)]">
            {{ view.errorInfo.message }}
          </p>
          <p v-if="view.errorInfo.suggestion" class="mt-0.5 text-[10px] text-[var(--color-text-muted)]">
            {{ view.errorInfo.suggestion }}
          </p>
        </div>
      </template>
    </MoleculesResultBox>

    <!-- サブ結果 1: 電流チェック (設計 / 許容) -->
    <MoleculesResultBox
      title="電流チェック (設計 / 許容)"
      :status="ampStatus"
      size="sm"
    >
      <span class="value-text">{{ view.currentI }}</span>
      <span class="value-sep">/</span>
      <span class="value-text">{{ view.maxI }}</span>
      <span class="value-unit">A</span>
    </MoleculesResultBox>

    <!-- サブ結果 2: 電圧降下 または 選択ケーブル -->
    <MoleculesResultBox
      v-if="view.mode === 'size'"
      title="電圧降下"
      :status="dropStatus"
      size="sm"
    >
      <span class="value-text">{{ view.dropV }}</span>
      <span class="value-unit">V</span>
      <span class="value-sep">(</span>
      <span class="value-text">{{ view.dropPercent }}</span>
      <span class="value-unit">%</span>
      <span class="value-sep">)</span>
    </MoleculesResultBox>

    <MoleculesResultBox
      v-else
      title="選択ケーブル"
      status="neutral"
      size="sm"
    >
      <span class="value-text drop-cable">{{ view.dropCableName }}</span>
    </MoleculesResultBox>
  </div>
</template>

<style scoped lang="scss">
.voltage-result {
  min-height: 0;

  // スロット内の自然な折り返しを許可
  :deep(.result-box__value) {
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

.value-sep {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.value-unit {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
