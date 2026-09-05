<script setup lang="ts">
/**
 * ToolRackResult
 * ケーブルラック選定ツールの計算・選定結果表示コンポーネントです。
 * 1段敷設（平置き・標準）と2段敷設（省スペース）の2段構えで比較表示します。
 */
import { computed } from 'vue'

import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import { formatRackResult } from '~/utils/tools/rack/rackResultPresenter'

const props = defineProps<{
  result: RackCalcResult | null
  maxDepth: number
  mode?: 'strong' | 'weak'
}>()

const vm = computed(() =>
  formatRackResult({
    result: props.result,
    maxDepth: props.maxDepth,
    mode: props.mode,
  }),
)
</script>

<template>
  <div class="c-rack-result">
    <!-- 1段敷設（平置き・標準） -->
    <AppResultBox
      :status="vm.tier1.boxStatus"
      :is-empty="vm.isEmpty"
    >
      <template #title>
        <span class="c-rack-result__box-title">
          {{ vm.tier1.title }}
          <AppBadge v-if="vm.tier1.badgeText" :color="vm.tier1.badgeColor">{{
            vm.tier1.badgeText
          }}</AppBadge>
        </span>
      </template>

      <template #value>
        <div class="c-rack-result__value-box">
          <div class="value-text c-rack-result__val">
            {{ vm.tier1.displaySize }}
          </div>
          <div
            v-if="!vm.isEmpty && vm.tier1.totalWidth !== '0'"
            class="c-rack-result__sub-val"
          >
            必要幅: <strong>{{ vm.tier1.totalWidth }}</strong> mm / 最大高さ: <strong>{{ vm.tier1.maxHeight }}</strong> mm
          </div>
        </div>
      </template>
    </AppResultBox>

    <!-- 2段敷設（省スペース） -->
    <AppResultBox
      :status="vm.tier2.boxStatus"
      :is-empty="vm.isEmpty"
    >
      <template #title>
        <span class="c-rack-result__box-title">
          {{ vm.tier2.title }}
          <AppBadge v-if="vm.tier2.badgeText" :color="vm.tier2.badgeColor">{{
            vm.tier2.badgeText
          }}</AppBadge>
        </span>
      </template>

      <template #value>
        <div class="c-rack-result__value-box">
          <template v-if="vm.tier2.isApplicable">
            <div class="value-text c-rack-result__val">
              {{ vm.tier2.displaySize }}
            </div>
            <div
              v-if="!vm.isEmpty && vm.tier2.totalWidth !== '0'"
              class="c-rack-result__sub-val"
            >
              必要幅: <strong>{{ vm.tier2.totalWidth }}</strong> mm / 最大高さ: <strong>{{ vm.tier2.maxHeight }}</strong> mm
            </div>
          </template>
          <div v-else class="c-rack-result__not-applicable">
            {{ vm.tier2.notApplicableText }}
          </div>
        </div>
      </template>
    </AppResultBox>

    <!-- 詳細内訳 -->
    <ToolResultDetails>
      <ToolResultRow :label="mode === 'strong' ? '強電 必要幅 (1段)' : '強電 必要幅'">
        <strong>{{ vm.wStrong }}</strong> mm
      </ToolResultRow>
      <ToolResultRow :label="mode === 'weak' ? '弱電 必要幅 (1段)' : '弱電 必要幅'">
        <strong>{{ vm.wWeak }}</strong> mm
      </ToolResultRow>
      <ToolResultRow label="ラック有効高さ">
        <strong>{{ maxDepth }}</strong> mm
        <span class="c-rack-result__depth-note">(親桁 H - 20mm)</span>
      </ToolResultRow>
    </ToolResultDetails>
  </div>
</template>

<style scoped lang="scss">
.c-rack-result {
  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);

  &__box-title {
    @include flex-center-center;

    gap: var(--space-2);
  }

  &__value-box {
    @include flex-start-center($direction: column);

    gap: var(--space-1);
    width: 100%;
  }

  &__val {
    @include text-mono("3xl", "bold");
  }

  &__sub-val {
    @include text-meta("xs", "regular");

    color: var(--color-text-secondary);

    strong {
      color: var(--color-text-main);
      font-weight: var(--font-weight-bold);
    }
  }

  &__not-applicable {
    @include text-meta("xs", "regular");

    color: var(--color-text-muted);
    padding: var(--space-1) 0;
  }

  &__depth-note {
    @include text-meta("2xs", "regular");

    color: var(--color-text-muted);
    margin-left: var(--space-1);
  }
}
</style>
