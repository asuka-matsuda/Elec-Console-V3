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
      :size="size"
    >
      <span>{{ view.mainValue }}</span>
      <small v-if="view.mainUnit" class="unit">{{ view.mainUnit }}</small>
      <template v-if="view.mode === 'drop' && view.isReady">
        <small class="sep">(</small>
        <span class="sub-val">{{ view.dropPercent }}</span>
        <small class="unit">%</small>
        <small class="sep">)</small>
      </template>

      <!-- エラー・警告時のサジェストフッター -->
      <template v-if="view.errorInfo" #footer>
        <div class="flex flex-col items-center leading-tight">
          <p>{{ view.errorInfo.message }}</p>
          <small v-if="view.errorInfo.suggestion">{{ view.errorInfo.suggestion }}</small>
        </div>
      </template>
    </MoleculesResultBox>

    <!-- サブ結果 1: 電流チェック (設計 / 許容) -->
    <MoleculesResultBox
      title="電流チェック (設計 / 許容)"
      :status="ampStatus"
      size="sm"
    >
      <span>{{ view.currentI }}</span>
      <small class="sep">/</small>
      <span>{{ view.maxI }}</span>
      <small class="unit">A</small>
    </MoleculesResultBox>

    <!-- サブ結果 2: 電圧降下 または 選択ケーブル -->
    <MoleculesResultBox
      v-if="view.mode === 'size'"
      title="電圧降下"
      :status="dropStatus"
      size="sm"
    >
      <span>{{ view.dropV }}</span>
      <small class="unit">V</small>
      <small class="sep">(</small>
      <span class="sub-val">{{ view.dropPercent }}</span>
      <small class="unit">%</small>
      <small class="sep">)</small>
    </MoleculesResultBox>

    <MoleculesResultBox
      v-else
      title="選択ケーブル"
      status="neutral"
      size="sm"
    >
      <span class="cable-name">{{ view.dropCableName }}</span>
    </MoleculesResultBox>
  </div>
</template>

<style scoped lang="scss">
.sub-val {
  font-size: var(--font-size-xl);
}

.cable-name {
  font-size: var(--font-size-sm);
}

.is-sm {
  .sub-val {
    font-size: var(--font-size-base);
  }
}
</style>
