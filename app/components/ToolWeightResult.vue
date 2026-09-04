<script setup lang="ts">
/**
 * ToolWeightResult
 * ケーブル重量・ドラム選定ツールの計算結果表示コンポーネントです。
 */
import { computed } from 'vue'

import type { WeightCalcResult } from '~/utils/tools/weight/weightCalcLogic'

const props = defineProps<{
  result: WeightCalcResult | null
}>()

const totalWeight = computed(() => {
  if (!props.result || props.result.error || !props.result.bestDrum) return 0

  return (
    (props.result.cableWeight || 0)
    + parseFloat((props.result.bestDrum.weight as unknown as string) || '0')
  )
})
</script>

<template>
  <div class="c-weight-result">
    <AppResultBox
      title="推奨ドラム"
      :status="
        result?.error ? 'empty' : result?.bestDrum ? 'success' : 'error'
      "
      :is-empty="result?.error"
    >
      <template #value>
        <div class="c-weight-result__value-box">
          <div class="c-weight-result__val">
            <template v-if="result?.error"> --- </template>
            <template v-else-if="result?.bestDrum">
              {{ result?.bestDrum?.category }} ({{ result?.bestDrum?.id }})
            </template>
            <template v-else> 選定不可 </template>
          </div>
          <div
            v-if="!result?.error && !result?.bestDrum"
            class="c-weight-result__warning"
          >
            ⚠️ 条件に合うドラムが見つかりませんでした。
          </div>
        </div>
      </template>
    </AppResultBox>

    <ToolResultDetails v-if="!result?.error">
      <ToolResultRow label="ケーブル総重量">
        <strong>{{ result?.cableWeight?.toFixed(1) }}</strong> kg
      </ToolResultRow>
      <template v-if="result?.bestDrum">
        <ToolResultRow label="ドラム空重量">
          <strong>{{ result?.bestDrum?.weight }}</strong> kg
        </ToolResultRow>
        <ToolResultRow label="総重量 (ケーブル+ドラム)" top-border>
          <strong>{{ totalWeight.toFixed(1) }}</strong> kg
        </ToolResultRow>
        <ToolResultRow label="最大巻取可能長" class="u-mt-2">
          <strong>{{ result?.maxCapacityMeters?.toFixed(1) }}</strong> m
        </ToolResultRow>
      </template>
    </ToolResultDetails>
  </div>
</template>

<style scoped lang="scss">
.c-weight-result {
  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);

  &__value-box {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
  }

  &__val {
    @include text-title("xl");
  }

  &__warning {
    @include text-meta("sm", "bold");

    color: var(--color-status-danger);
  }
}
</style>
