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
  // --- Base Styles ---
  display: flex;
  flex: 1;
  flex-direction: column; // コンテナ未定義・または狭い場合は縦並び（スモールファースト）
  gap: var(--gap-section);
  align-items: stretch;

  min-height: 0;
  padding: var(--pad-component);
  &__drop-paren { margin-left: var(--gap-component); }
  &__drop-percent { @extend %text-xl; }
  &__drop-unit { @extend %text-md; }
  &__drop-cable { @extend %text-xl; }

  // --- State Modifiers ---
  &.is-sm {
    gap: var(--gap-component);
    padding: 0;
    
    .c-voltage-result__main {
      padding: var(--pad-element) var(--pad-component);
    }
    
    .c-voltage-result__main-value .value-text {
      font-size: 1.5rem;
    }
    
    .c-voltage-result__drop-cable {
      font-size: 1.25rem;
    }
    
    .c-voltage-result__drop-percent {
      font-size: 1rem;
    }
    
    .metric-card {
      padding: var(--pad-element);
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
    @include flex-column(var(--gap-element));
    flex: 1;
    align-items: center;
    justify-content: center;

    min-width: 0;
    padding: var(--pad-component) var(--pad-section);
    border: var(--border-width-base) solid var(--color-border);

    box-shadow: var(--shadow-sink);

    @include surface(20%);
  }

  &__main-label {
    @extend %text-xs;

    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  &__main-value {
    display: flex;
    gap: var(--gap-component);
    align-items: baseline;
    font-family: var(--font-family-mono);

    .value-text {
      font-size: 2rem;
      font-weight: var(--font-weight-bold);
      line-height: 1;
    }

    .value-unit {
      @extend %text-md;

      font-weight: var(--font-weight-bold);
      color: var(--color-text-secondary);
      opacity: 0.8;
    }
  }

  &__metrics {
    display: flex;
    flex-flow: row wrap; // 狭い場合は横並びラップ（スモールファースト）
    flex-shrink: 0;
    gap: var(--gap-component);

    min-width: auto;

    // コンテナの幅が xs 以上の場合は縦積み
    @include cq("xs") {
      flex-flow: column nowrap;
      min-width: 220px;
    }
  }

  .metric-card {
    @include flex-column(var(--gap-element));
    flex: 1;
    align-items: center;
    justify-content: center;

    padding: var(--pad-component);
    border: 1px solid var(--color-border);
  }

  .metric-label {
    @extend %text-xs;

    color: var(--color-text-muted);
  }

  .metric-value {

    @extend %text-md;

    display: flex;
    gap: var(--gap-element);
    align-items: baseline;

    font-family: var(--font-family-mono);
    font-weight: var(--font-weight-bold);

    .value-sep {
      margin: 0 2px;
      font-weight: normal;
      color: var(--color-text-muted);
    }

    .value-unit {
      @extend %text-xs;

      color: var(--color-text-secondary);
      opacity: 0.8;
    }
  }

  // コンテナの幅が xs 以上の場合は横並び
  @include cq("xs") {
    flex-direction: row;
  }
}
</style>
