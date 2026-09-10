<script setup lang="ts">
/**
 * OrganismsVoltageResult
 * [Tool Organism] 電圧降下やケーブルサイズの計算結果を視覚的に表示するコンポーネント。
 */
import { computed } from 'vue'

import type { ResultBoxStatus } from '~/types/components'
import type { VoltageCalcInputs, VoltageCalcResult } from '~/types/voltage'
import { formatVoltageResult } from '~/utils/tools/voltage/voltageResultPresenter'

const props = defineProps<{
  inputs: VoltageCalcInputs
  result: VoltageCalcResult | null
  size?: 'sm' | 'md'
}>()

const view = computed(() => formatVoltageResult(props.inputs, props.result))

const mainBoxStatus = computed(() =>
  (view.value.mainStatusClass?.replace('is-', '') || 'neutral') as ResultBoxStatus,
)

const ampStatus = computed(() =>
  (view.value.ampStatusClass?.replace('is-', '') || 'neutral') as ResultBoxStatus,
)

const dropStatus = computed(() =>
  (view.value.dropStatusClass?.replace('is-', '') || 'neutral') as ResultBoxStatus,
)
</script>

<template>
  <div
    class="flex flex-1 flex-col min-h-0"
    :class="[size === 'sm' ? 'gap-3 is-sm' : 'gap-[var(--space-card-gap)]']"
  >
    <!-- 主結果 (電圧降下 or 電線サイズ) -->
    <MoleculesResultBox
      :title="view.mainLabel"
      :status="mainBoxStatus"
      :badge="view.mainBadgeText"
      :size="size"
    >
      <span>{{ view.mainValue }}</span>
      <small v-if="view.mainUnit" class="unit">{{ view.mainUnit }}</small>
    </MoleculesResultBox>

    <!-- サブ結果 1: 電流チェック (設計 / 許容) -->
    <MoleculesResultBox
      title="電流チェック (設計 / 許容)"
      :status="ampStatus"
      :badge="view.ampBadgeText"
      size="sm"
    >
      <span v-if="view.currentI === 'ERROR'">ERROR</span>
      <template v-else>
        <span>{{ view.currentI }}</span>
        <small class="sep">/</small>
        <span>{{ view.maxI }}</span>
        <small class="unit">A</small>
      </template>
    </MoleculesResultBox>

    <!-- サブ結果 2: 電圧降下（導体断面積モード時のみ表示） -->
    <MoleculesResultBox
      v-if="view.mode === 'size'"
      title="電圧降下"
      :status="dropStatus"
      :badge="view.dropBadgeText"
      size="sm"
    >
      <span v-if="view.dropV === 'ERROR'">ERROR</span>
      <template v-else>
        <span>{{ view.dropV }}</span>
        <small class="unit">V</small>
        <small class="sep">(</small>
        <span>{{ view.dropPercent }}</span>
        <small class="unit">%</small>
        <small class="sep">)</small>
      </template>
    </MoleculesResultBox>

    <!-- サブ情報（電圧降下モード時のみ表示） -->
    <MoleculesResultDetails
      v-if="view.mode === 'drop'"
      :items="[
        { label: '選択ケーブル', value: view.dropCableName },
        { label: '電圧降下率', value: view.dropRateText },
      ]"
    />
  </div>
</template>
