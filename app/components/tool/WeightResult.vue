<script setup lang="ts">
/**
 * WeightResult
 * [Tool Organism] ケーブル重量・ドラム選定ツールの計算結果表示コンポーネント。
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
  <div class="flex flex-col gap-[var(--space-panel-gap)]">
    <MoleculesResultBox
      title="使用ドラム（想定）"
      :status="vm.boxStatus"
      :is-empty="vm.isError"
    >
      <span class="value-text">{{ vm.displayDrum }}</span>

      <template v-if="vm.warningText" #footer>
        <div class="text-center font-bold text-[var(--font-size-sm)] text-[var(--color-status-danger)]">
          {{ vm.warningText }}
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
