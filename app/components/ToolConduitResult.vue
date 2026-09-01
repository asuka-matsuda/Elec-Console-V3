<script setup lang="ts">
/**
 * ToolConduitResult
 * 配管サイズ計算の結果を視覚的に表示する2カラムコンポーネントです。
 */
import { computed } from 'vue'

import { CONDUIT_UI_LABELS } from '~/constants/conduitConstants'
import { formatVal } from '~/utils/math'

const props = defineProps<{
  result: import('~/utils/tools/conduit/conduitCalcLogic').ConduitCalcResult | null
  inputs?: import('~/composables/tools/useConduitCalculator').ConduitInputs
  size?: 'sm' | 'md'
}>()

const isReady = computed(() => props.result?.success && !props.result?.partial)

// --- 32% (異種) ---
const size32 = computed(() => {
  if (!isReady.value) return CONDUIT_UI_LABELS.EMPTY_TEXT

  return props.result!.isOversize32
    ? CONDUIT_UI_LABELS.OVERSIZE_TEXT
    : props.result!.conduit32?.size
})

const status32Class = computed(() => {
  if (!isReady.value) return 'is-neutral'

  return props.result!.isOversize32 ? 'is-danger' : 'is-success'
})

const _allowable32 = computed(() =>
  isReady.value
    ? formatVal(props.result!.allowable32, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)
    : CONDUIT_UI_LABELS.EMPTY_TEXT,
)

const fill32 = computed(() =>
  isReady.value
    ? formatVal(props.result!.fill32, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)
    : CONDUIT_UI_LABELS.EMPTY_TEXT,
)

// --- 48% (同種) ---
const size48 = computed(() => {
  if (!isReady.value) return CONDUIT_UI_LABELS.EMPTY_TEXT

  return props.result!.isOversize48
    ? CONDUIT_UI_LABELS.OVERSIZE_TEXT
    : props.result!.conduit48?.size
})

const status48Class = computed(() => {
  if (!isReady.value) return 'is-neutral'

  return props.result!.isOversize48 ? 'is-danger' : 'is-success'
})

const _allowable48 = computed(() =>
  isReady.value
    ? formatVal(props.result!.allowable48, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)
    : CONDUIT_UI_LABELS.EMPTY_TEXT,
)

const fill48 = computed(() =>
  isReady.value
    ? formatVal(props.result!.fill48, CONDUIT_UI_LABELS.EMPTY_TEXT, 1)
    : CONDUIT_UI_LABELS.EMPTY_TEXT,
)
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
  @include flex-column(var(--space-card-gap));

  flex: 1;
  align-items: stretch;
  min-height: 0;
  padding: var(--space-card-pad);

  &__percent {
    @include text-title("lg");
  }

  &__percent-unit {
    @include text-title("sm");
  }

  // コンテナ幅が xs 以上の場合は横並び2カラム
  @include cq("xs") {
    flex-direction: row;
  }

  &__col {
    @include flex-column(var(--space-card-gap));

    flex: 1;
    min-width: 0;
  }

  .is-neutral {
    color: var(--color-text-muted);
  }

  .is-success {
    color: var(--color-status-success);

    @include cyber-text-glow(var(--color-status-success), 40%, var(--blur-md));
  }

  .is-danger {
    color: var(--color-status-danger);

    @include cyber-text-glow(var(--color-status-danger), 40%, var(--blur-md));
  }

  &.is-sm {
    gap: var(--space-stack-gap);
    padding: 0;

    .c-conduit-result__main {
      padding: var(--space-tag-p);
    }

    .c-conduit-result__main-value .value-text {
      @include text-mono("3xl");

      &.c-conduit-result__percent {
        @include text-mono("base");
      }
    }
  }

  &__main {
    @include flex-column(var(--space-stack-gap-sm));

    flex: 1;
    align-items: center;
    justify-content: center;

    min-width: 0;
    padding: var(--space-result-p);

    @include border-base;
    @include shadow("sink");
  }

  &__main-label {
    @include text-meta;

    color: var(--color-text-secondary);
    text-transform: uppercase;
  }

  &__main-value {
    @include flex-baseline(var(--space-inline-gap));

    .value-text {
      @include text-mono("4xl");

      &.c-conduit-result__percent {
        @include text-title("sm", "normal");
      }
    }

    .value-sep {
      @include text-body("md", "normal");

      margin: 0 2px;
      color: var(--color-text-muted);
    }

    .value-unit {
      @include text-body("md", "bold");

      color: var(--color-text-secondary);
      opacity: 0.8;
    }
  }
}
</style>
