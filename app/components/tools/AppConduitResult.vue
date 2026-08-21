<script setup lang="ts">
/**
 * AppConduitResult
 * 配管サイズ計算の結果を視覚的に表示する2カラムコンポーネントです。
 */
import { computed } from "vue";
import { formatVal } from "~/utils/mathUtils";
import { CONDUIT_UI_LABELS } from "~/utils/constants/conduitConstants";

const props = defineProps<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result: Record<string, any> | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs?: Record<string, any>;
  size?: "sm" | "md";
}>();

const isReady = computed(() => props.result?.success && !props.result?.partial);

// --- 32% (異種) ---
const size32 = computed(() => {
  if (!isReady.value) return CONDUIT_UI_LABELS.EMPTY_TEXT;
  return props.result!.isOversize32 ? CONDUIT_UI_LABELS.OVERSIZE_TEXT : props.result!.conduit32?.size;
});

const status32Class = computed(() => {
  if (!isReady.value) return "is-neutral";
  return props.result!.isOversize32 ? "is-danger" : "is-success";
});

const allowable32 = computed(() => 
  isReady.value ? formatVal(props.result!.allowable32, CONDUIT_UI_LABELS.EMPTY_TEXT, 1) : CONDUIT_UI_LABELS.EMPTY_TEXT
);

const fill32 = computed(() => 
  isReady.value ? formatVal(props.result!.fill32, CONDUIT_UI_LABELS.EMPTY_TEXT, 1) : CONDUIT_UI_LABELS.EMPTY_TEXT
);

// --- 48% (同種) ---
const size48 = computed(() => {
  if (!isReady.value) return CONDUIT_UI_LABELS.EMPTY_TEXT;
  return props.result!.isOversize48 ? CONDUIT_UI_LABELS.OVERSIZE_TEXT : props.result!.conduit48?.size;
});

const status48Class = computed(() => {
  if (!isReady.value) return "is-neutral";
  return props.result!.isOversize48 ? "is-danger" : "is-success";
});

const allowable48 = computed(() => 
  isReady.value ? formatVal(props.result!.allowable48, CONDUIT_UI_LABELS.EMPTY_TEXT, 1) : CONDUIT_UI_LABELS.EMPTY_TEXT
);

const fill48 = computed(() => 
  isReady.value ? formatVal(props.result!.fill48, CONDUIT_UI_LABELS.EMPTY_TEXT, 1) : CONDUIT_UI_LABELS.EMPTY_TEXT
);

</script>

<template>
  <div class="c-conduit-result" :class="[size === 'sm' ? 'is-sm' : '']">
    
    <!-- Left Column: 32% -->
    <div class="c-conduit-result__col">
      <div class="c-conduit-result__main">
        <div class="c-conduit-result__main-label">{{ CONDUIT_UI_LABELS.TITLE_32 }}</div>
        <div class="c-conduit-result__main-value">
          <span class="value-text" :class="status32Class">{{ size32 }}</span>
          <template v-if="isReady && !result!.isOversize32">
            <span class="value-sep c-conduit-result__paren">(</span>
            <span class="value-text c-conduit-result__percent is-neutral">{{ fill32 }}</span>
            <span class="value-unit c-conduit-result__percent-unit">{{ CONDUIT_UI_LABELS.UNIT_PERCENT }}</span>
            <span class="value-sep">)</span>
          </template>
        </div>
      </div>
    </div>

    <!-- Right Column: 48% -->
    <div class="c-conduit-result__col">
      <div class="c-conduit-result__main">
        <div class="c-conduit-result__main-label">{{ CONDUIT_UI_LABELS.TITLE_48 }}</div>
        <div class="c-conduit-result__main-value">
          <span class="value-text" :class="status48Class">{{ size48 }}</span>
          <template v-if="isReady && !result!.isOversize48">
            <span class="value-sep c-conduit-result__paren">(</span>
            <span class="value-text c-conduit-result__percent is-neutral">{{ fill48 }}</span>
            <span class="value-unit c-conduit-result__percent-unit">{{ CONDUIT_UI_LABELS.UNIT_PERCENT }}</span>
            <span class="value-sep">)</span>
          </template>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped lang="scss">
.c-conduit-result {
  // --- Base Styles ---
  display: flex;
  flex: 1;
  flex-direction: column; // スモールファースト
  gap: var(--space-3);
  align-items: stretch;

  min-height: 0;
  padding: var(--pad-component);

  &__paren { margin-left: var(--space-2); }
  &__percent { @extend %text-xl; }
  &__percent-unit { @extend %text-md; }

  // コンテナ幅が xs 以上の場合は横並び2カラム
  @include cq("xs") {
    flex-direction: row;
  }

  &__col {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-3);

    min-width: 0;
  }

  // --- State Modifiers ---
  .is-neutral {
    color: var(--color-text-muted);
  }

  .is-success {
    color: var(--color-status-success);

    @include cyber-text-glow(40%, var(--blur-md), var(--color-status-success));
  }

  .is-danger {
    color: var(--color-status-danger);

    @include cyber-text-glow(40%, var(--blur-md), var(--color-status-danger));
  }

  &.is-sm {
    gap: var(--space-2);
    padding: 0;
    
    .c-conduit-result__main {
      padding: var(--pad-element) var(--pad-component);
    }
    
    .c-conduit-result__main-value .value-text {
      font-size: 1.5rem;
      
      &.c-conduit-result__percent {
        font-size: 1rem;
      }
    }
  }

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--gap-element);
    align-items: center;
    justify-content: center;

    min-width: 0;
    padding: var(--pad-component) var(--pad-section);
    border: var(--border-width-base) solid var(--color-border);

    @include sink;
    @include surface(20%);
  }

  &__main-label {
    @extend %text-xs;

    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  &__main-value {
    display: flex;
    gap: var(--space-2);
    align-items: baseline;
    font-family: var(--font-family-mono);

    .value-text {
      font-size: 2rem;
      font-weight: var(--font-weight-bold);
      line-height: 1;
      
      &.c-conduit-result__percent {
        @extend %text-md;

        font-weight: normal;
      }
    }

    .value-sep {
      margin: 0 2px;
      font-weight: normal;
      color: var(--color-text-muted);
    }

    .value-unit {
      font-weight: var(--font-weight-bold);
      color: var(--color-text-secondary);
      opacity: 0.8;
    }
  }
}
</style>
