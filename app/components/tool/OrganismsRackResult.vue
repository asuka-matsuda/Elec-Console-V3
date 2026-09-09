<script setup lang="ts">
/**
 * OrganismsRackResult
 * [Tool Organism] ケーブルラック選定ツールの計算・選定結果表示コンポーネント。
 * 1段敷設（平置き・標準）と2段敷設（省スペース）の2段構えで比較表示します。
 */
import { computed } from 'vue'

import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import { formatRackResult } from '~/utils/tools/rack/rackResultPresenter'

const props = defineProps<{
  result: RackCalcResult | null
  maxDepth: number
  mode?: 'strong' | 'weak'
}>()

const vm = computed(() =>
  formatRackResult({
    result: props.result,
    maxDepth: props.maxDepth,
    mode: props.mode,
  }),
)
const detailItems = computed(() => [
  {
    label: props.mode === 'strong' ? '強電 必要幅 (1段)' : '強電 必要幅',
    value: vm.value.wStrong,
    unit: 'mm',
  },
  {
    label: props.mode === 'weak' ? '弱電 必要幅 (1段)' : '弱電 必要幅',
    value: vm.value.wWeak,
    unit: 'mm',
  },
  {
    label: 'ラック有効高さ',
    value: props.maxDepth,
    unit: 'mm',
    note: '(親桁 H - 20mm)',
  },
])
</script>

<template>
  <div class="flex flex-col gap-[var(--space-card-gap)]">
    <!-- 1段敷設（平置き・標準） -->
    <MoleculesResultBox
      :status="vm.tier1.boxStatus"
      :is-empty="vm.isEmpty"
    >
      <template #title>
        <span class="flex items-center justify-center gap-[var(--space-2)]">
          {{ vm.tier1.title }}
          <AtomsBadge v-if="vm.tier1.badgeText" :color="vm.tier1.badgeColor">{{
            vm.tier1.badgeText
          }}</AtomsBadge>
        </span>
      </template>

      <template #value>
        {{ vm.tier1.displaySize }}
      </template>

      <template
        v-if="!vm.isEmpty && vm.tier1.totalWidth !== '0'"
        #footer
      >
        必要幅: <strong>{{ vm.tier1.totalWidth }}</strong> mm / 最大高さ: <strong>{{ vm.tier1.maxHeight }}</strong> mm
      </template>
    </MoleculesResultBox>

    <!-- 2段敷設（省スペース） -->
    <MoleculesResultBox
      :status="vm.tier2.boxStatus"
      :is-empty="vm.isEmpty"
    >
      <template #title>
        <span class="flex items-center justify-center gap-[var(--space-2)]">
          {{ vm.tier2.title }}
          <AtomsBadge v-if="vm.tier2.badgeText" :color="vm.tier2.badgeColor">{{
            vm.tier2.badgeText
          }}</AtomsBadge>
        </span>
      </template>

      <template #value>
        <span v-if="vm.tier2.isApplicable">
          {{ vm.tier2.displaySize }}
        </span>
        <span v-else class="not-applicable py-[var(--space-1)]">
          {{ vm.tier2.notApplicableText }}
        </span>
      </template>

      <template
        v-if="vm.tier2.isApplicable && !vm.isEmpty && vm.tier2.totalWidth !== '0'"
        #footer
      >
        必要幅: <strong>{{ vm.tier2.totalWidth }}</strong> mm / 最大高さ: <strong>{{ vm.tier2.maxHeight }}</strong> mm
      </template>
    </MoleculesResultBox>

    <!-- 詳細内訳 -->
    <MoleculesResultDetails :items="detailItems" />
  </div>
</template>
