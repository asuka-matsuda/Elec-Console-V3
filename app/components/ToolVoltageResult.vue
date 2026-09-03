<script setup lang="ts">
/**
 * ToolVoltageResult
 * 電圧降下やケーブルサイズの計算結果を視覚的に表示するコンポーネントです。
 */
import { computed } from 'vue'

import type { VoltageCalcInputs, VoltageCalcResult } from '~/types/voltage'
import { formatVal } from '~/utils/math'

const props = defineProps<{
  inputs: VoltageCalcInputs
  result: VoltageCalcResult | null
  size?: 'sm' | 'md'
}>()

const isReady = computed(() => props.inputs?.isReady && props.result)
const mode = computed(() => props.inputs?.mode || 'drop')

const dropCableName = computed(() => {
  if (!isReady.value) return 'ーー'

  return props.result?.optimal?.name || 'ーー'
})

const mainLabel = computed(() =>
  mode.value === 'size' ? '選定ケーブルサイズ' : '電圧降下',
)

const mainValue = computed(() => {
  if (!isReady.value) return 'ーー'
  if (mode.value === 'size') {
    const size = props.result?.optimal?.size

    return size ? String(size) : '選定不可'
  }
  else {
    return formatVal(props.result!.finalDropV, 'ーー', 2)
  }
})

const mainUnit = computed(() => {
  if (!isReady.value) return mode.value === 'size' ? 'sq' : 'V'
  if (mode.value === 'size') {
    return props.result?.optimal?.unit || 'sq'
  }

  return 'V'
})

const mainStatusClass = computed(() => {
  if (!isReady.value) return 'is-neutral'
  if (mode.value === 'size') {
    return props.result?.optimal ? 'is-success' : 'is-danger'
  }
  else {
    return (props.inputs.I || 0) <= props.result!.finalEffAmp
      ? 'is-success'
      : 'is-danger'
  }
})

const currentI = computed(() =>
  isReady.value ? formatVal(props.inputs.I, 'ーー', 1) : 'ーー',
)
const maxI = computed(() =>
  isReady.value ? formatVal(props.result!.finalEffAmp, 'ーー', 1) : 'ーー',
)

const ampStatusClass = computed(() => {
  if (!isReady.value) return 'is-neutral'

  return (props.inputs.I || 0) <= props.result!.finalEffAmp
    ? 'is-success'
    : 'is-danger'
})

const dropV = computed(() =>
  isReady.value ? formatVal(props.result!.finalDropV, 'ーー', 2) : 'ーー',
)
const dropPercent = computed(() => {
  if (!isReady.value) return 'ーー'
  const v = props.inputs.sys?.voltage

  if (!v) return 'ーー'

  return formatVal((props.result!.finalDropV / v) * 100, 'ーー', 2)
})

const dropStatusClass = computed(() => {
  if (!isReady.value) return 'is-neutral'
  if (mode.value === 'size' && props.inputs.targetDrop) {
    const currentPercent
      = (props.result!.finalDropV / props.inputs.sys!.voltage) * 100

    return currentPercent <= props.inputs.targetDrop
      ? 'is-success'
      : 'is-warning'
  }

  return 'is-success'
})
</script>

<template>
  <div class="c-voltage-result" :class="[size === 'sm' ? 'is-sm' : '']">
    <div class="c-voltage-result__main">
      <div class="c-voltage-result__main-label">
        {{ mainLabel }}
      </div>
      <div class="c-voltage-result__main-value">
        <span class="value-text" :class="mainStatusClass">{{ mainValue }}</span>
        <span v-if="mainUnit" class="value-unit">{{ mainUnit }}</span>
        <template v-if="mode === 'drop' && isReady">
          <span class="value-sep">(</span>
          <span
            class="value-text c-voltage-result__drop-percent"
            :class="mainStatusClass"
          >{{ dropPercent }}</span
          >
          <span class="value-unit c-voltage-result__drop-unit">%</span>
          <span class="value-sep">)</span>
        </template>
      </div>
    </div>

    <div class="c-voltage-result__metrics">
      <dl class="metric-card">
        <dt class="metric-label">電流チェック (設計 / 許容)</dt>
        <dd class="metric-value" :class="ampStatusClass">
          <span class="value-text">{{ currentI }}</span>
          <span class="value-sep">/</span>
          <span class="value-text">{{ maxI }}</span>
          <span class="value-unit">A</span>
        </dd>
      </dl>

      <dl v-if="mode === 'size'" class="metric-card">
        <dt class="metric-label">電圧降下</dt>
        <dd class="metric-value" :class="dropStatusClass">
          <span class="value-text">{{ dropV }}</span>
          <span class="value-unit">V</span>
          <span class="value-sep">(</span>
          <span class="value-text">{{ dropPercent }}</span>
          <span class="value-unit">%</span>
          <span class="value-sep">)</span>
        </dd>
      </dl>

      <dl v-else class="metric-card">
        <dt class="metric-label">選択ケーブル</dt>
        <dd class="metric-value is-neutral">
          <span class="value-text c-voltage-result__drop-cable">{{
            dropCableName
          }}</span>
        </dd>
      </dl>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-voltage-result {
  @include flex-start-stretch($direction: column);

  flex: 1;
  gap: var(--space-card-gap);
  align-items: stretch;

  min-height: 0;
  padding: var(--space-card-pad);

  // コンテナの幅が xs 以上の場合は横並び
  @include cq("xs") {
    flex-direction: row;
  }

  &__drop-percent {
    @include text-title("lg");
  }

  &__drop-unit {
    @include text-title("sm");
  }

  &__drop-cable {
    @include text-title("lg");
  }

  &.is-sm {
    gap: var(--space-3);
    padding: 0;

    .c-voltage-result__main {
      padding: var(--space-1) var(--space-2);
    }

    .c-voltage-result__main-value .value-text {
      @include text-mono("3xl", "bold");
    }

    .c-voltage-result__drop-cable {
      @include text-mono("2xl", "bold");
    }

    .c-voltage-result__drop-percent {
      @include text-mono("base", "bold");
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

  &__main {
    @include flex-start-stretch($direction: column);

    flex: 1;
    gap: var(--space-1);
    align-items: center;
    justify-content: center;

    min-width: 0;
    padding: var(--space-2) var(--space-3);

    @include border-base;
    @include shadow("sink");
  }

  &__main-label {
    @include text-meta;

    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  &__main-value {
    display: flex;
    gap: var(--space-2);
    align-items: baseline;

    .value-text {
      @include text-mono("4xl", "bold");
    }

    .value-unit {
      @include text-title("md");

      color: var(--color-text-secondary);
      opacity: 0.8;
    }
  }

  &__metrics {
    @include flex-start-center;

    flex-flow: row wrap;
    flex-shrink: 0;
    gap: var(--space-2);
    align-items: stretch;

    min-width: auto;

    @include cq("xs") {
      flex-flow: column nowrap;
      min-width: 220px;
    }
  }

  .metric-card {
    @include flex-start-stretch($direction: column);

    flex: 1;
    gap: var(--space-1);
    align-items: center;
    justify-content: center;

    padding: var(--space-2);

    @include border-base(var(--color-border), $width: 1px);
  }

  .metric-label {
    @include text-meta;
  }

  .metric-value {
    @include text-mono("sm", "bold");

    display: flex;
    gap: var(--space-1);
    align-items: baseline;
    margin: 0;

    .value-sep {
      margin: 0 2px;
      color: var(--color-text-muted);
    }

    .value-unit {
      @include text-meta;

      color: var(--color-text-secondary);
      opacity: 0.8;
    }
  }
}
</style>
