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
  if (vm.value.isError) return []

  const items: ResultDetailItem[] = [
    { label: 'ケーブル総重量', value: vm.value.cableWeight, unit: 'kg' },
  ]

  if (vm.value.hasBestDrum) {
    items.push(
      { label: 'ドラム空重量', value: vm.value.drumWeight, unit: 'kg' },
      { label: '総重量 (ケーブル+ドラム)', value: vm.value.totalWeight, unit: 'kg', topBorder: true },
      { label: '最大巻取可能長', value: vm.value.maxCapacityMeters, unit: 'm' },
    )
  }

  return items
})
</script>

<template>
  <div class="flex flex-col gap-[var(--space-card-gap)]">
    <MoleculesResultBox
      title="使用ドラム（想定）"
      :status="vm.boxStatus"
      :is-empty="vm.isError"
    >
      <span class="value-text">{{ vm.displayDrum }}</span>

      <template v-if="vm.warningText" #footer>
        {{ vm.warningText }}
      </template>
    </MoleculesResultBox>

    <MoleculesResultDetails v-if="!vm.isError && detailItems.length > 0" :items="detailItems" />
  </div>
</template>
