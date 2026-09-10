<script setup lang="ts">
/**
 * OrganismsWeightResult
 * [Tool Organism] ケーブル重量・ドラム選定ツールの計算結果表示コンポーネント。
 */
import { computed } from 'vue'

import type { ResultDetailItem } from '~/types/components'
import type { WeightCalcResult } from '~/utils/tools/weight/weightCalcLogic'
import { formatWeightResult } from '~/utils/tools/weight/weightResultPresenter'

const props = defineProps<{
  result: WeightCalcResult | null
}>()

const vm = computed(() => formatWeightResult(props.result))

const detailItems = computed(() => {
  const items: ResultDetailItem[] = [
    {
      label: 'ケーブル重量',
      value: vm.value.cableWeight,
      unit: vm.value.cableWeight !== 'ーー' ? 'kg' : undefined,
    },
    {
      label: 'ドラム重量',
      value: vm.value.drumWeight,
      unit: vm.value.drumWeight !== 'ーー' ? 'kg' : undefined,
    },
    {
      label: '最大巻取可能長',
      value: vm.value.maxCapacityMeters,
      unit: vm.value.maxCapacityMeters !== 'ーー' ? 'm' : undefined,
    },
  ]

  return items
})
</script>

<template>
  <div class="flex flex-col gap-[var(--space-card-gap)]">
    <!-- メイン結果 1: 使用ドラム（想定） -->
    <MoleculesResultBox
      title="使用ドラム（想定）"
      :status="vm.boxStatus"
      :badge="vm.badgeText"
      :is-empty="vm.isError"
    >
      <span class="value-text">{{ vm.displayDrum }}</span>
    </MoleculesResultBox>

    <!-- メイン結果 2: 総重量 (ケーブル+ドラム) -->
    <MoleculesResultBox
      title="総重量 (ケーブル+ドラム)"
      :status="vm.boxStatus"
      :is-empty="vm.isError"
    >
      <span class="value-text">{{ vm.displayTotalWeight }}</span>
      <small v-if="!vm.isError && vm.hasBestDrum" class="unit">kg</small>
    </MoleculesResultBox>

    <!-- サブ情報（ケーブル重量、ドラム重量、最大巻取可能長） -->
    <MoleculesResultDetails :items="detailItems" />
  </div>
</template>
