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

// 選択ケーブル（dropモード時のサブ指標用）
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
    <div class="c-voltage-result__main">
      <div class="c-voltage-result__main-label">{{ mainLabel }}</div>
      <div class="c-voltage-result__main-value">
        <span class="value-text" :class="mainStatusClass">{{ mainValue }}</span>
        <span v-if="mainUnit" class="value-unit">{{ mainUnit }}</span>
        <template v-if="mode === 'drop' && isReady">
          <span class="value-sep" style="margin-left: 0.5rem">(</span>
          <span class="value-text" :class="mainStatusClass" style="font-size: 1.25rem">{{ dropPercent }}</span>
          <span class="value-unit" style="font-size: 1rem">%</span>
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
          <span class="value-text" style="font-size: 1.25rem;">{{ dropCableName }}</span>
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
    text-shadow: 0 0 8px hsl(var(--color-status-success-base) / 40%);
  }

  .is-warning {
    color: var(--color-status-warning);
    text-shadow: 0 0 8px hsl(var(--color-status-warning-base) / 40%);
  }

  .is-danger {
    color: var(--color-status-danger);
    text-shadow: 0 0 8px hsl(var(--color-status-danger-base) / 40%);
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
