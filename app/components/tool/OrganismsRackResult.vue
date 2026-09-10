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
      :title="vm.tier1.title"
      :status="vm.tier1.boxStatus"
      :badge="vm.tier1.badgeText"
      :is-empty="vm.isEmpty"
    >
      <template #value>
        {{ vm.tier1.displaySize }}
      </template>
    </MoleculesResultBox>

    <!-- 2段敷設（省スペース） -->
    <MoleculesResultBox
      :title="vm.tier2.title"
      :status="vm.tier2.boxStatus"
      :badge="vm.tier2.badgeText"
      :is-empty="vm.isEmpty"
    >
      <template #value>
        <span v-if="vm.tier2.isApplicable">
          {{ vm.tier2.displaySize }}
        </span>
        <span v-else class="not-applicable py-[var(--space-1)]">
          {{ vm.tier2.notApplicableText }}
        </span>
      </template>
    </MoleculesResultBox>

    <!-- 詳細内訳 -->
    <MoleculesResultDetails :items="detailItems" />
  </div>
</template>
