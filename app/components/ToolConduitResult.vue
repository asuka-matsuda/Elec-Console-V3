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

const status32 = computed(() =>
  vm.value.status32Class.replace('is-', '') as 'neutral' | 'success' | 'danger',
)
const status48 = computed(() =>
  vm.value.status48Class.replace('is-', '') as 'neutral' | 'success' | 'danger',
)
</script>

<template>
  <div class="c-conduit-result" :class="[size === 'sm' ? 'is-sm' : '']">
    <!-- Left Column: 32% -->
    <div class="c-conduit-result__col">
      <AppResultBox
        :title="CONDUIT_UI_LABELS.TITLE_32"
        :status="status32"
        :size="size"
      >
        <template #value>
          <span class="value-text">{{ vm.size32 }}</span>
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
        </template>
      </AppResultBox>
    </div>

    <div class="c-conduit-result__col">
      <AppResultBox
        :title="CONDUIT_UI_LABELS.TITLE_48"
        :status="status48"
        :size="size"
      >
        <template #value>
          <span class="value-text">{{ vm.size48 }}</span>
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
        </template>
      </AppResultBox>
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

    .c-conduit-result__percent {
      @include text-mono("base");
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
</style>
