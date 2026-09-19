<script setup lang="ts">
/**
 * OrganismsWeightResult
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
  <div class="flex flex-col gap-panel-gap">
    <!-- メイン結果 1: 使用ドラム（想定） -->
    <ResultBox
      title="使用ドラム（想定）"
      :status="vm.boxStatus"
      :badge="vm.badgeText"
    >
      <span class="value-text">{{ vm.displayDrum }}</span>
    </ResultBox>

    <!-- メイン結果 2: 総重量 (ケーブル+ドラム) -->
    <ResultBox
      title="総重量 (ケーブル+ドラム)"
      :status="vm.boxStatus"
    >
      <span class="value-text">{{ vm.displayTotalWeight }}</span>
      <small v-if="!vm.isError && vm.hasBestDrum">kg</small>
    </ResultBox>

    <!-- サブ情報（ケーブル重量、ドラム重量、最大巻取可能長） -->
    <ToolResultDetails :items="vm.details" />
  </div>
</template>
