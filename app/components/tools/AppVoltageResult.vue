<script setup lang="ts">
/**
 * AppVoltageResult
 * 電圧降下やケーブルサイズの計算結果を視覚的に表示するコンポーネントです。
 */
import { computed } from "vue";
import { formatVal } from "~/utils/mathUtils";

const props = defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: Record<string, any> | null;
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
    return props.inputs.I <= props.result!.finalEffAmp
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
  return props.inputs.I <= props.result!.finalEffAmp
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
  <div class="c-voltage-result" :class="[size === 'sm' ? 'is-sm' : '']">
    <div class="c-voltage-result__main">
      <div class="c-voltage-result__main-label">{{ mainLabel }}</div>
      <div class="c-voltage-result__main-value">
        <span class="value-text" :class="mainStatusClass">{{ mainValue }}</span>
        <span v-if="mainUnit" class="value-unit">{{ mainUnit }}</span>
        <template v-if="mode === 'drop' && isReady">
          <span class="value-sep c-voltage-result__drop-paren">(</span>
          <span class="value-text c-voltage-result__drop-percent" :class="mainStatusClass">{{ dropPercent }}</span>
          <span class="value-unit c-voltage-result__drop-unit">%</span>
          <span class="value-sep">)</span>
        </template>
      </div>
    </div>

    <!-- サブ指標 -->
    <div class="c-voltage-result__metrics">
      <!-- 電流チェック -->
      <div class="metric-card">
        <div class="metric-label">電流チェック (設計 / 許容)</div>
        <div class="metric-value" :class="ampStatusClass">
          <span class="value-text">{{ currentI }}</span>
          <span class="value-sep">/</span>
          <span class="value-text">{{ maxI }}</span>
          <span class="value-unit">A</span>
        </div>
      </div>

      <!-- 電圧降下 (sizeモード) -->
      <div v-if="mode === 'size'" class="metric-card">
        <div class="metric-label">電圧降下</div>
        <div class="metric-value" :class="dropStatusClass">
          <span class="value-text">{{ dropV }}</span>
          <span class="value-unit">V</span>
          <span class="value-sep">(</span>
          <span class="value-text">{{ dropPercent }}</span>
          <span class="value-unit">%</span>
          <span class="value-sep">)</span>
        </div>
      </div>

      <!-- 選択ケーブル (dropモード) -->
      <div v-else class="metric-card">
        <div class="metric-label">選択ケーブル</div>
        <div class="metric-value is-neutral">
          <span class="value-text c-voltage-result__drop-cable">{{ dropCableName }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-voltage-result {
  // --- レイアウト・配置 ---
  @include flex-column(var(--gap-section));

  flex: 1;
  align-items: stretch;

  // --- ボックスモデル ---
  min-height: 0;
  padding: var(--pad-component);

  // --- 子要素 ---
  &__drop-paren {
  // --- ボックスモデル ---
  margin-left: var(--gap-component); }

  &__drop-percent {
  // --- 継承 ---
  @extend %text-xl; }

  &__drop-unit {
  // --- 継承 ---
  @extend %text-md; }

  &__drop-cable {
  // --- 継承 ---
  @extend %text-xl; }

  // --- モディファイア ---
  &.is-sm {
    // --- レイアウト・配置 ---
    gap: var(--gap-component);

    // --- ボックスモデル ---
    padding: 0;

    
    // --- 子要素 ---
    
    .c-voltage-result__main {
      // --- ボックスモデル ---
      padding: var(--pad-element) var(--pad-component);
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
      padding: var(--pad-element);
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
    @include flex-column(var(--gap-element));

    flex: 1;
    align-items: center;
    justify-content: center;


    // --- ボックスモデル ---

    min-width: 0;
    padding: var(--pad-component) var(--pad-section);
    border: var(--border-width-base) solid var(--color-border);


    // --- 視覚効果 ---

    box-shadow: var(--shadow-sink);

    @include surface(20%);
  }

  &__main-label {
    // --- 継承 ---
    @extend %text-xs;


    // --- タイポグラフィ ---

    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  &__main-value {
    // --- レイアウト・配置 ---
    display: flex;
    gap: var(--gap-component);
    align-items: baseline;

    // --- タイポグラフィ ---
    font-family: var(--font-family-mono);

    .value-text {
      // --- タイポグラフィ ---
      font-size: 2rem;
      font-weight: var(--font-weight-bold);
      line-height: 1;
    }

    .value-unit {
      // --- 継承 ---
      @extend %text-md;


      // --- タイポグラフィ ---

      font-weight: var(--font-weight-bold);
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
    gap: var(--gap-component);


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
    @include flex-column(var(--gap-element));

    flex: 1;
    align-items: center;
    justify-content: center;


    // --- ボックスモデル ---

    padding: var(--pad-component);
    border: 1px solid var(--color-border);
  }

  .metric-label {
    // --- 継承 ---
    @extend %text-xs;


    // --- タイポグラフィ ---

    color: var(--color-text-muted);
  }

  .metric-value {
    // --- 継承 ---

    @extend %text-md;


    // --- レイアウト・配置 ---

    display: flex;
    gap: var(--gap-element);
    align-items: baseline;


    // --- タイポグラフィ ---

    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);

    .value-sep {
      // --- ボックスモデル ---
      margin: 0 2px;

      // --- タイポグラフィ ---
      font-weight: normal;
      color: var(--color-text-muted);
    }

    .value-unit {
      // --- 継承 ---
      @extend %text-xs;


      // --- タイポグラフィ ---

      color: var(--color-text-secondary);

      // --- 視覚効果 ---
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
