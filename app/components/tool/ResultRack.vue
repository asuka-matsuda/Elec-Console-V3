<script setup lang="ts">
/**
 * ResultRack
 * [Tool Organism] ケーブルラック選定ツールの計算・選定結果表示コンポーネント。
 * 1段敷設（平置き・標準）と2段敷設（省スペース）の2段構えで比較表示します。
 */
import { computed } from 'vue'

import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import { formatRackResult } from '~/utils/tools/rack/rackResultPresenter'

const props = defineProps<{
  result: RackCalcResult | null
  maxDepth?: number
  mode?: 'strong' | 'weak'
}>()

const vm = computed(() =>
  formatRackResult({
    result: props.result,
    maxDepth: props.maxDepth,
    mode: props.mode,
  }),
)
</script>

<template>
  <output class="flex flex-col gap-panel-gap">

    <ResultPanel
      :title="vm.tier1.title"
      :status="vm.tier1.panelStatus"
      :badge="vm.tier1.badgeText"
      :is-empty="vm.isEmpty"
    >
      <template #value>
        {{ vm.tier1.displaySize }}
      </template>
    </ResultPanel>

    <ResultPanel
      :title="vm.tier2.title"
      :status="vm.tier2.panelStatus"
      :badge="vm.tier2.badgeText"
      :is-empty="vm.isEmpty"
    >
      <template #value>
        <span v-if="vm.tier2.isApplicable">
          {{ vm.tier2.displaySize }}
        </span>
        <span v-else class="not-applicable py-inline-gap">
          {{ vm.tier2.notApplicableText }}
        </span>
      </template>
    </ResultPanel>

    <ToolResultDetails :items="vm.details" />
  </output>
</template>

<style scoped lang="scss">
.not-applicable {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
