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
  <div class="weight-result">
    <MoleculesResultBox
      title="推奨ドラム"
      :status="vm.boxStatus"
      :is-empty="vm.isError"
    >
      <template #value>
        <div class="value-box">
          <div class="val">
            {{ vm.displayDrum }}
          </div>
          <div
            v-if="vm.warningText"
            class="warning"
          >
            {{ vm.warningText }}
          </div>
        </div>
      </template>
    </MoleculesResultBox>

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
        <ToolResultRow label="最大巻取可能長">
          <strong>{{ vm.maxCapacityMeters }}</strong> m
        </ToolResultRow>
      </template>
    </ToolResultDetails>
  </div>
</template>

<style scoped lang="scss">
.weight-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-panel-gap);

  .value-box {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    align-items: center;
    justify-content: flex-start;
  }

  .val {
    font-family: var(--font-mono);
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
  }

  .warning {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-status-danger);
  }
}
</style>
