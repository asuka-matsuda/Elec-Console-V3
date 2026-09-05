<script setup lang="ts">
/**
 * ToolConduitResult
 * 配管サイズ計算の結果を視覚的に表示する2カラムコンポーネントです。
 */
import { computed } from 'vue'

import type { ConduitInputs } from '~/composables/tools/useConduitCalculator'
import { CONDUIT_UI_LABELS } from '~/constants/conduitConstants'
import type { ConduitCalcResult } from '~/utils/tools/conduit/conduitCalcLogic'
import { formatConduitResult } from '~/utils/tools/conduit/conduitResultPresenter'

const props = defineProps<{
  result: ConduitCalcResult | null
  inputs?: ConduitInputs
  size?: 'sm' | 'md'
}>()

const vm = computed(() => formatConduitResult(props.result))
</script>

<template>
  <div class="c-conduit-result" :class="[size === 'sm' ? 'is-sm' : '']">
    <!-- Left Column: 32% -->
    <div class="c-conduit-result__col">
      <div class="c-conduit-result__main">
        <div class="c-conduit-result__main-label">
          {{ CONDUIT_UI_LABELS.TITLE_32 }}
        </div>
        <div class="c-conduit-result__main-value">
          <span class="value-text" :class="vm.status32Class">{{
            vm.size32
          }}</span>
          <template v-if="vm.isReady && !vm.isOversize32">
            <span class="value-sep">(</span>
            <span class="value-text c-conduit-result__percent is-neutral">{{
              vm.fill32
            }}</span>
            <span class="value-unit c-conduit-result__percent-unit">{{
              CONDUIT_UI_LABELS.UNIT_PERCENT
            }}</span>
            <span class="value-sep">)</span>
          </template>
        </div>
      </div>
    </div>

    <div class="c-conduit-result__col">
      <div class="c-conduit-result__main">
        <div class="c-conduit-result__main-label">
          {{ CONDUIT_UI_LABELS.TITLE_48 }}
        </div>
        <div class="c-conduit-result__main-value">
          <span class="value-text" :class="vm.status48Class">{{
            vm.size48
          }}</span>
          <template v-if="vm.isReady && !vm.isOversize48">
            <span class="value-sep">(</span>
            <span class="value-text c-conduit-result__percent is-neutral">{{
              vm.fill48
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
  @include flex-start-stretch($direction: column);

  flex: 1;
  gap: var(--space-card-gap);
  align-items: stretch;
  min-height: 0;

  @include cq("xs") {
    flex-direction: row;
  }

  &__percent {
    @include text-title("lg");
  }

  &__percent-unit {
    @include text-title("sm");
  }

  &__col {
    @include flex-start-stretch($direction: column);

    flex: 1;
    gap: var(--space-card-gap);
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
    gap: var(--space-3);

    .c-conduit-result__main {
      padding: var(--space-1) var(--space-2);
    }

    .c-conduit-result__main-value .value-text {
      @include text-mono("3xl");

      &.c-conduit-result__percent {
        @include text-mono("base");
      }
    }
  }

  &__main {
    @include flex-center-center($direction: column);

    flex: 1;
    gap: var(--space-1);
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
    @include flex-display;

    gap: var(--space-2);
    align-items: baseline;

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
