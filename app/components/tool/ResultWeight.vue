<script setup lang="ts">
/**
 * ResultWeight
 * [Tool Organism] ケーブル重量・ドラム選定ツールの計算結果表示コンポーネント。
 */
import { computed } from 'vue'

import { RESULT_BADGE_VARIANT_MAP } from '~/constants/toolOptions'
import type { WeightCalcResult } from '~/utils/tools/weight/weightCalcLogic'
import { formatWeightResult } from '~/utils/tools/weight/weightResultPresenter'

const props = defineProps<{
  result: WeightCalcResult | null
  size?: 'sm' | 'md'
}>()

const vm = computed(() => formatWeightResult(props.result))
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0" :class="[size === 'sm' ? 'gap-item-gap is-sm' : 'gap-panel-gap']">
    <div class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="[`is-${vm.panelStatus}`, size === 'sm' && 'is-sm']">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>使用ドラム（想定）</span>
        <Badge v-if="vm.badgeText" :variant="RESULT_BADGE_VARIANT_MAP[vm.panelStatus]">{{ vm.badgeText }}</Badge>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span>{{ vm.displayDrum }}</span>
      </output>
    </div>

    <div class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="[`is-${vm.panelStatus}`, size === 'sm' && 'is-sm']">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>総重量 (ケーブル+ドラム)</span>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span>{{ vm.displayTotalWeight }}</span>
        <span v-if="!vm.isError && vm.hasBestDrum" class="value-unit">kg</span>
      </output>
    </div>

    <dl v-if="vm.details?.length" class="flex flex-col gap-inline-gap w-full details-list">
      <div v-for="(item, i) in vm.details" :key="i" class="flex items-center justify-between">
        <dt>{{ item.label }}</dt>
        <dd class="flex items-center gap-inline-gap">
          <span class="value">{{ item.value }}</span>
          <span v-if="item.unit">{{ item.unit }}</span>
          <span v-if="item.note">{{ item.note }}</span>
        </dd>
      </div>
    </dl>
  </div>
</template>
