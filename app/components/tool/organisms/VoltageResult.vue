<script setup lang="ts">
/**
 * VoltageResult
 * [Tool Organism] 電圧降下やケーブルサイズの計算結果を視覚的に表示するコンポーネント。
 */
import { computed } from 'vue'

import type { VoltageCalcInputs, VoltageCalcResult } from '~/types/voltage'
import { formatVoltageResult } from '~/utils/tools/voltage/voltageResultPresenter'

const props = defineProps<{
  inputs: VoltageCalcInputs
  result: VoltageCalcResult | null
  size?: 'sm' | 'md'
}>()

const vm = computed(() => formatVoltageResult(props.inputs, props.result))
</script>

<template>
  <div
    class="flex flex-1 flex-col min-h-0"
    :class="[size === 'sm' ? 'gap-3 is-sm' : 'gap-panel-gap']"
  >
    <!-- 主結果 (電圧降下 or 電線サイズ) -->
    <ResultBox
      :title="vm.mainLabel"
      :status="vm.mainStatus"
      :badge="vm.mainBadgeText"
      :size="size"
    >
      <span>{{ vm.mainValue }}</span>
      <small v-if="vm.mainUnit">{{ vm.mainUnit }}</small>
    </ResultBox>

    <!-- サブ結果 1: 電流チェック (設計 / 許容) -->
    <ResultBox
      title="電流チェック (設計 / 許容)"
      :status="vm.ampStatus"
      :badge="vm.ampBadgeText"
      size="sm"
    >
      <span v-if="vm.isAmpError">ERROR</span>
      <template v-else>
        <span>{{ vm.currentI }}</span>
        <small>/</small>
        <span>{{ vm.maxI }}</span>
        <small>A</small>
      </template>
    </ResultBox>

    <!-- サブ結果 2: 電圧降下（導体断面積モード時のみ表示） -->
    <ResultBox
      v-if="vm.mode === 'size'"
      title="電圧降下"
      :status="vm.dropStatus"
      :badge="vm.dropBadgeText"
      size="sm"
    >
      <span v-if="vm.isDropError">ERROR</span>
      <template v-else>
        <span>{{ vm.dropV }}</span>
        <small>V</small>
        <small v-if="vm.dropPercentText">{{ vm.dropPercentText }}</small>
      </template>
    </ResultBox>

    <!-- サブ情報（電圧降下モード時のみ表示） -->
    <ToolResultDetails
      v-if="vm.details"
      :items="vm.details"
    />
  </div>
</template>
