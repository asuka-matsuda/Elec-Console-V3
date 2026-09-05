<script setup lang="ts">
/**
 * ToolWeightResult
 * ケーブル重量・ドラム選定ツールの計算結果表示コンポーネントです。
 */
import { computed } from 'vue'

import type { WeightCalcResult } from '~/utils/tools/weight/weightCalcLogic'
import { formatWeightResult } from '~/utils/tools/weight/weightResultPresenter'

const props = defineProps<{
  result: WeightCalcResult | null
}>()

const vm = computed(() => formatWeightResult(props.result))
</script>

<template>
  <div class="c-weight-result">
    <AppResultBox
      title="推奨ドラム"
      :status="vm.boxStatus"
      :is-empty="vm.isError"
    >
      <template #value>
        <div class="c-weight-result__value-box">
          <div class="c-weight-result__val">
            {{ vm.displayDrum }}
          </div>
          <div
            v-if="vm.warningText"
            class="c-weight-result__warning"
          >
            {{ vm.warningText }}
          </div>
        </div>
      </template>
    </AppResultBox>

    <ToolResultDetails v-if="!vm.isError">
      <ToolResultRow label="ケーブル総重量">
        <strong>{{ vm.cableWeight }}</strong> kg
      </ToolResultRow>
      <template v-if="vm.hasBestDrum">
        <ToolResultRow label="ドラム空重量">
          <strong>{{ vm.drumWeight }}</strong> kg
        </ToolResultRow>
        <ToolResultRow label="総重量 (ケーブル+ドラム)" top-border>
          <strong>{{ vm.totalWeight }}</strong> kg
        </ToolResultRow>
        <ToolResultRow label="最大巻取可能長" class="u-mt-2">
          <strong>{{ vm.maxCapacityMeters }}</strong> m
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
    @include flex-start-center($direction: column);

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
