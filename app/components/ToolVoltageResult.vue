<script setup lang="ts">
/**
 * ToolVoltageResult
 * 電圧降下やケーブルサイズの計算結果を視覚的に表示するコンポーネントです。
 */
import { computed } from "vue";
import { formatVal } from "~/utils/math";

const props = defineProps<{
  inputs: import('~/types/voltage').VoltageCalcInputs;
  result: import('~/types/voltage').VoltageCalcResult | null;
  size?: "sm" | "md";
}>();

const isReady = computed(() => props.inputs?.isReady && props.result);
const mode = computed(() => props.inputs?.mode || "drop");

const dropCableName = computed(() => {
  if (!isReady.value) return "ーー";
  return props.result?.optimal?.name || "ーー";
});

const mainLabel = computed(() =>
  mode.value === "size" ? "選定ケーブルサイズ" : "電圧降下",
);

const mainValue = computed(() => {
  if (!isReady.value) return "ーー";
  if (mode.value === "size") {
    const size = props.result?.optimal?.size;
    return size ? String(size) : "選定不可";
  } else {
    return formatVal(props.result!.finalDropV, "ーー", 2);
  }
});

const mainUnit = computed(() => {
  if (!isReady.value) return mode.value === "size" ? "sq" : "V";
  if (mode.value === "size") {
    return props.result?.optimal?.unit || "sq";
  }
  return "V";
});

const mainStatusClass = computed(() => {
  if (!isReady.value) return "is-neutral";
  if (mode.value === "size") {
    return props.result?.optimal ? "is-success" : "is-danger";
  } else {
    return (props.inputs.I || 0) <= props.result!.finalEffAmp
      ? "is-success"
      : "is-danger";
  }
});

const currentI = computed(() =>
  isReady.value ? formatVal(props.inputs.I, "ーー", 1) : "ーー",
);
const maxI = computed(() =>
  isReady.value ? formatVal(props.result!.finalEffAmp, "ーー", 1) : "ーー",
);

const ampStatusClass = computed(() => {
  if (!isReady.value) return "is-neutral";
  return (props.inputs.I || 0) <= props.result!.finalEffAmp
    ? "is-success"
    : "is-danger";
});

const dropV = computed(() =>
  isReady.value ? formatVal(props.result!.finalDropV, "ーー", 2) : "ーー",
);
const dropPercent = computed(() => {
  if (!isReady.value) return "ーー";
  const v = props.inputs.sys?.voltage;
  if (!v) return "ーー";
  return formatVal((props.result!.finalDropV / v) * 100, "ーー", 2);
});

const dropStatusClass = computed(() => {
  if (!isReady.value) return "is-neutral";
  if (mode.value === "size" && props.inputs.targetDrop) {
    const currentPercent =
      (props.result!.finalDropV / props.inputs.sys!.voltage) * 100;
    return currentPercent <= props.inputs.targetDrop
      ? "is-success"
      : "is-warning";
  }
  return "is-success";
});
</script>

<template>
  <div
    class="c-voltage-result"
    :class="[size === 'sm' ? 'is-sm' : '']"
  >
    <div class="c-voltage-result__main">
      <div class="c-voltage-result__main-label">
        {{ mainLabel }}
      </div>
      <div class="c-voltage-result__main-value">
        <span
          class="value-text"
          :class="mainStatusClass"
        >{{ mainValue }}</span>
        <span
          v-if="mainUnit"
          class="value-unit"
        >{{ mainUnit }}</span>
        <template v-if="mode === 'drop' && isReady">
          <span class="value-sep c-voltage-result__drop-paren">(</span>
          <span
            class="value-text c-voltage-result__drop-percent"
            :class="mainStatusClass"
          >{{ dropPercent }}</span>
          <span class="value-unit c-voltage-result__drop-unit">%</span>
          <span class="value-sep">)</span>
        </template>
      </div>
    </div>

    <!-- サブ指標 -->
    <div class="c-voltage-result__metrics">
      <!-- 電流チェック -->
      <dl class="metric-card">
        <dt class="metric-label">
          電流チェック (設計 / 許容)
        </dt>
        <dd
          class="metric-value"
          :class="ampStatusClass"
        >
          <span class="value-text">{{ currentI }}</span>
          <span class="value-sep">/</span>
          <span class="value-text">{{ maxI }}</span>
          <span class="value-unit">A</span>
        </dd>
      </dl>

      <!-- 電圧降下 (sizeモード) -->
      <dl
        v-if="mode === 'size'"
        class="metric-card"
      >
        <dt class="metric-label">
          電圧降下
        </dt>
        <dd
          class="metric-value"
          :class="dropStatusClass"
        >
          <span class="value-text">{{ dropV }}</span>
          <span class="value-unit">V</span>
          <span class="value-sep">(</span>
          <span class="value-text">{{ dropPercent }}</span>
          <span class="value-unit">%</span>
          <span class="value-sep">)</span>
        </dd>
      </dl>

      <!-- 選択ケーブル (dropモード) -->
      <dl
        v-else
        class="metric-card"
      >
        <dt class="metric-label">
          選択ケーブル
        </dt>
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
  // --- レイアウト・配置 ---
  @include flex-column(var(--space-card-gap));

  flex: 1;
  align-items: stretch;

  // --- ボックスモデル ---
  min-height: 0;
  padding: var(--space-card-pad);

  // --- 子要素 ---
  &__drop-percent {
    // --- 継承 ---
    @include text-title-lg;
  }

  &__drop-unit {
    // --- 継承 ---
    @include text-title-sm;
  }

  &__drop-cable {
    // --- 継承 ---
    @include text-title-lg;
  }

  // --- モディファイア ---
  &.is-sm {
    // --- レイアウト・配置 ---
    gap: var(--space-stack-gap);

    // --- ボックスモデル ---
    padding: 0;

    // --- 子要素 ---
    .c-voltage-result__main {
      // --- ボックスモデル ---
      padding: var(--space-tag-p);
    }

    .c-voltage-result__main-value .value-text {
      // --- タイポグラフィ ---
      font-size: 1.5rem;
    }

    .c-voltage-result__drop-cable {
      // --- タイポグラフィ ---
      font-size: 1.25rem;
    }

    .c-voltage-result__drop-percent {
      // --- タイポグラフィ ---
      font-size: 1rem;
    }

    .metric-card {
      // --- ボックスモデル ---
      padding: var(--space-tag-p);
    }
  }

  .is-neutral {
    // --- タイポグラフィ ---
    color: var(--color-text-muted);
  }

  .is-success {
    // --- タイポグラフィ ---
    color: var(--color-status-success);

    // --- 視覚効果 ---
    @include cyber-text-glow(var(--color-status-success), 40%, var(--blur-md));
  }

  .is-warning {
    // --- タイポグラフィ ---
    color: var(--color-status-warning);

    // --- 視覚効果 ---
    @include cyber-text-glow(var(--color-status-warning), 40%, var(--blur-md));
  }

  .is-danger {
    // --- タイポグラフィ ---
    color: var(--color-status-danger);

    // --- 視覚効果 ---
    @include cyber-text-glow(var(--color-status-danger), 40%, var(--blur-md));
  }

  // --- 子要素 ---
  &__main {
    // --- レイアウト・配置 ---
    @include flex-column(var(--space-stack-gap-sm));

    flex: 1;
    align-items: center;
    justify-content: center;

    // --- ボックスモデル ---
    min-width: 0;
    padding: var(--space-result-p);

    @include border-base;

    // --- 視覚効果 ---
    box-shadow: var(--shadow-sink);

    @include border-base;
  }

  &__main-label {
    // --- 継承 ---
    @include text-meta;

    // --- タイポグラフィ ---
    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  &__main-value {
    // --- レイアウト・配置 ---
    display: flex;
    gap: var(--space-inline-gap);
    align-items: baseline;

    // --- タイポグラフィ ---
    font-family: var(--font-mono);

    .value-text {
      // --- タイポグラフィ ---
      font-size: 2rem;
      font-weight: var(--font-weight-bold);
      line-height: 1;
    }

    .value-unit {
      // --- 継承 ---
      @include text-title-md;

      color: var(--color-text-secondary);

      // --- 視覚効果 ---
      opacity: 0.8;
    }
  }

  &__metrics {
    // --- レイアウト・配置 ---
    display: flex;
    flex-flow: row wrap; // 狭い場合は横並びラップ（スモールファースト）
    flex-shrink: 0;
    gap: var(--space-inline-gap);

    // --- ボックスモデル ---
    min-width: auto;

    // コンテナの幅が xs 以上の場合は縦積み
    @include cq("xs") {
      flex-flow: column nowrap;

      // --- ボックスモデル ---
      min-width: 220px;
    }
  }

  .metric-card {
    // --- レイアウト・配置 ---
    @include flex-column(var(--space-stack-gap-sm));

    flex: 1;
    align-items: center;
    justify-content: center;

    // --- ボックスモデル ---
    padding: var(--space-card-pad-sm);

    @include border-base(var(--color-border), 1px);
  }

  .metric-label {
    // --- 継承 ---
    @include text-meta;
  }

  .metric-value {
    display: flex;
    gap: var(--space-1);
    align-items: baseline;

    margin: 0;

    font-family: var(--font-mono);

    @include text-title-sm;

    .value-sep {
      margin: 0 2px;
      font-weight: normal;
      color: var(--color-text-muted);
    }

    .value-unit {
      @include text-meta;

      color: var(--color-text-secondary);
      opacity: 0.8;
    }
  }

  // コンテナの幅が xs 以上の場合は横並び
  @include cq("xs") {
    // --- レイアウト・配置 ---
    flex-direction: row;
  }
}
</style>
