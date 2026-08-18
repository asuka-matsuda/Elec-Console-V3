<script setup lang="ts">
import { computed } from "vue";
import { formatVal } from "~/utils/mathUtils";

const props = defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: Record<string, any> | null;
}>();

// ==========================================
// 判定・フォーマットロジック
// ==========================================

const isReady = computed(() => props.inputs?.isReady && props.result);
const mode = computed(() => props.inputs?.mode || "drop");

// 1. メイン結果（ケーブルサイズ or 判定OK/NG）
const mainLabel = computed(() =>
  mode.value === "size" ? "選定ケーブルサイズ" : "判定結果",
);

const mainValue = computed(() => {
  if (!isReady.value) return "ーー";
  if (mode.value === "size") {
    const size = props.result?.optimal?.size;
    return size ? String(size) : "選定不可";
  } else {
    // 電圧降下確認モードの場合
    if (props.result!.finalEffAmp === 0) return "データ未登録";
    const isAmpOk = props.inputs.I <= props.result!.finalEffAmp;
    return isAmpOk ? "OK" : "NG (容量不足)";
  }
});

const mainUnit = computed(() => {
  if (!isReady.value) return mode.value === "size" ? "sq" : "";
  if (mode.value === "size") {
    return props.result?.optimal?.unit || "sq";
  }
  return "";
});

const mainStatusClass = computed(() => {
  if (!isReady.value) return "is-neutral";
  if (mode.value === "size") {
    return props.result?.optimal ? "is-success" : "is-danger";
  } else {
    if (props.result!.finalEffAmp === 0) return "is-neutral";
    return props.inputs.I <= props.result!.finalEffAmp
      ? "is-success"
      : "is-danger";
  }
});

// 2. 電流チェック (設計電流 / 許容電流)
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

// 3. 電圧降下
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
  <div class="c-voltage-result">
    <!-- メイン結果 -->
    <div class="c-voltage-result__main">
      <div class="c-voltage-result__main-label">{{ mainLabel }}</div>
      <div class="c-voltage-result__main-value" :class="mainStatusClass">
        <span class="value-text">{{ mainValue }}</span>
        <span v-if="mainUnit" class="value-unit">{{ mainUnit }}</span>
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

      <!-- 電圧降下 -->
      <div class="metric-card">
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
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-voltage-result {
  display: flex;
  flex-direction: row; // デフォルトはPC用（横並び）
  align-items: stretch;
  gap: var(--space-3);
  padding: var(--space-2);
  flex: 1;
  min-height: 0;

  // md以下（モバイル）のスタイル
  @include mq("md") {
    flex-direction: column; // モバイルは縦並び
  }

  // ステータスカラー定義
  .is-neutral {
    color: var(--color-text-muted);
  }

  .is-success {
    color: var(--color-status-success);
    text-shadow: 0 0 8px rgb(34 197 94 / 40%);
  }

  .is-warning {
    color: var(--color-status-warning);
    text-shadow: 0 0 8px rgb(234 179 8 / 40%);
  }

  .is-danger {
    color: var(--color-status-danger);
    text-shadow: 0 0 8px rgb(239 68 68 / 40%);
  }

  &__main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-2) var(--space-3);
    background: rgb(0 0 0 / 20%);
    border: 1px solid var(--color-border);
    box-shadow: inset 0 0 20px rgb(0 0 0 / 50%);
    flex: 1;
    min-width: 0;
  }

  &__main-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-1);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__main-value {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    font-family: var(--font-family-mono);

    .value-text {
      font-size: 2rem;
      font-weight: var(--font-weight-bold);
      line-height: 1;
    }

    .value-unit {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-bold);
      opacity: 0.8;
    }
  }

  &__metrics {
    display: flex;
    flex-direction: column; // PCは縦積み
    gap: var(--space-2);
    min-width: 220px;
    flex-shrink: 0;

    // md以下（モバイル）のスタイル
    @include mq("md") {
      flex-flow: row wrap; // モバイルは横並び
      min-width: auto;
    }
  }

  .metric-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-2);
    border: 1px solid var(--color-border);
    flex: 1;
  }

  .metric-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    margin-bottom: var(--space-1);
  }

  .metric-value {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
    font-family: var(--font-family-mono);
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);

    .value-sep {
      color: var(--color-text-muted);
      margin: 0 2px;
      font-weight: normal;
    }

    .value-unit {
      font-size: var(--font-size-xs);
      opacity: 0.8;
    }
  }
}
</style>
