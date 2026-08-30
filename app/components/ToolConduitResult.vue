<script setup lang="ts">
/**
 * ToolConduitResult
 * 配管サイズ計算の結果を視覚的に表示する2カラムコンポーネントです。
 */
import { computed } from "vue";
import { formatVal } from "~/utils/math";
import { CONDUIT_UI_LABELS } from "~/constants/conduitConstants";

const props = defineProps<{
  result: import('~/utils/tools/conduit/conduitCalcLogic').ConduitCalcResult | null;
  inputs?: import('~/composables/tools/useConduitCalculator').ConduitInputs;
  size?: "sm" | "md";
}>();

const isReady = computed(() => props.result?.success && !props.result?.partial);

// --- 32% (異種) ---
const size32 = computed(() => {
  if (!isReady.value) return CONDUIT_UI_LABELS.EMPTY_TEXT;
  return props.result!.isOversize32
    ? CONDUIT_UI_LABELS.OVERSIZE_TEXT
    : props.result!.conduit32?.size;
});

const status32Class = computed(() => {
  if (!isReady.value) return "is-neutral";
  return props.result!.isOversize32 ? "is-danger" : "is-success";
});

const _allowable32 = computed(() =>
  isReady.value
    ? formatVal(props.result!.allowable32, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)
    : CONDUIT_UI_LABELS.EMPTY_TEXT,
);

const fill32 = computed(() =>
  isReady.value
    ? formatVal(props.result!.fill32, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)
    : CONDUIT_UI_LABELS.EMPTY_TEXT,
);

// --- 48% (同種) ---
const size48 = computed(() => {
  if (!isReady.value) return CONDUIT_UI_LABELS.EMPTY_TEXT;
  return props.result!.isOversize48
    ? CONDUIT_UI_LABELS.OVERSIZE_TEXT
    : props.result!.conduit48?.size;
});

const status48Class = computed(() => {
  if (!isReady.value) return "is-neutral";
  return props.result!.isOversize48 ? "is-danger" : "is-success";
});

const _allowable48 = computed(() =>
  isReady.value
    ? formatVal(props.result!.allowable48, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)
    : CONDUIT_UI_LABELS.EMPTY_TEXT,
);

const fill48 = computed(() =>
  isReady.value
    ? formatVal(props.result!.fill48, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)
    : CONDUIT_UI_LABELS.EMPTY_TEXT,
);
</script>

<template>
  <div
    class="c-conduit-result"
    :class="[size === 'sm' ? 'is-sm' : '']"
  >
    <!-- Left Column: 32% -->
    <div class="c-conduit-result__col">
      <div class="c-conduit-result__main">
        <div class="c-conduit-result__main-label">
          {{ CONDUIT_UI_LABELS.TITLE_32 }}
        </div>
        <div class="c-conduit-result__main-value">
          <span
            class="value-text"
            :class="status32Class"
          >{{ size32 }}</span>
          <template v-if="isReady && !result!.isOversize32">
            <span class="value-sep c-conduit-result__paren">(</span>
            <span class="value-text c-conduit-result__percent is-neutral">{{
              fill32
            }}</span>
            <span class="value-unit c-conduit-result__percent-unit">{{
              CONDUIT_UI_LABELS.UNIT_PERCENT
            }}</span>
            <span class="value-sep">)</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Right Column: 48% -->
    <div class="c-conduit-result__col">
      <div class="c-conduit-result__main">
        <div class="c-conduit-result__main-label">
          {{ CONDUIT_UI_LABELS.TITLE_48 }}
        </div>
        <div class="c-conduit-result__main-value">
          <span
            class="value-text"
            :class="status48Class"
          >{{ size48 }}</span>
          <template v-if="isReady && !result!.isOversize48">
            <span class="value-sep c-conduit-result__paren">(</span>
            <span class="value-text c-conduit-result__percent is-neutral">{{
              fill48
            }}</span>
            <span class="value-unit c-conduit-result__percent-unit">{{
              CONDUIT_UI_LABELS.UNIT_PERCENT
            }}</span>
            <span class="value-sep">)</span>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-conduit-result {
  // --- レイアウト・配置 ---
  @include flex-column(var(--gap-section));

  flex: 1;
  align-items: stretch;

  // --- ボックスモデル ---
  min-height: 0;
  padding: var(--pad-component);

  // --- 子要素 ---
  &__paren {
    // --- ボックスモデル ---
    margin-left: var(--gap-component);
  }

  &__percent {
    // --- 継承 ---
    @include text-title-lg;
  }

  &__percent-unit {
    // --- 継承 ---
    @include text-title-sm;
  }

  // コンテナ幅が xs 以上の場合は横並び2カラム
  @include cq("xs") {
    // --- レイアウト・配置 ---
    flex-direction: row;
  }

  &__col {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-section));

    flex: 1;

    // --- ボックスモデル ---
    min-width: 0;
  }

  // --- モディファイア ---
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

  .is-danger {
    // --- タイポグラフィ ---
    color: var(--color-status-danger);

    // --- 視覚効果 ---
    @include cyber-text-glow(var(--color-status-danger), 40%, var(--blur-md));
  }

  &.is-sm {
    // --- レイアウト・配置 ---
    gap: var(--gap-component);

    // --- ボックスモデル ---
    padding: 0;

    // --- 子要素 ---
    .c-conduit-result__main {
      // --- ボックスモデル ---
      padding: var(--pad-element) var(--pad-component);
    }

    .c-conduit-result__main-value .value-text {
      // --- タイポグラフィ ---
      font-size: 1.5rem;

      // --- 子要素 ---
      &.c-conduit-result__percent {
        // --- タイポグラフィ ---
        font-size: 1rem;
      }
    }
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
    gap: var(--gap-component);
    align-items: baseline;

    // --- タイポグラフィ ---
    font-family: var(--font-family-mono);

    .value-text {
      // --- タイポグラフィ ---
      font-size: 2rem;
      line-height: 1;

      // --- 子要素 ---
      &.c-conduit-result__percent {
        // --- 継承 ---
        @include text-title-sm;

        // --- タイポグラフィ ---
        font-weight: normal;
      }
    }

    .value-sep {
      // --- ボックスモデル ---
      margin: 0 2px;

      // --- タイポグラフィ ---
      font-weight: normal;
      color: var(--color-text-muted);
    }

    .value-unit {
      // --- タイポグラフィ ---
      font-weight: var(--font-weight-bold);
      color: var(--color-text-secondary);

      // --- 視覚効果 ---
      opacity: 0.8;
    }
  }
}
</style>
