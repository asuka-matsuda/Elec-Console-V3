<script setup lang="ts">
/**
 * ResultWeight
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
  <output class="flex flex-col gap-panel-gap">

    <ResultPanel
      title="使用ドラム（想定）"
      :status="vm.panelStatus"
      :badge="vm.badgeText"
    >
      <span class="value-text">{{ vm.displayDrum }}</span>
    </ResultPanel>

    <ResultPanel
      title="総重量 (ケーブル+ドラム)"
      :status="vm.panelStatus"
    >
      <span class="value-text">{{ vm.displayTotalWeight }}</span>
      <small v-if="!vm.isError && vm.hasBestDrum">kg</small>
    </ResultPanel>

    <ToolResultDetails :items="vm.details" />
  </output>
</template>
