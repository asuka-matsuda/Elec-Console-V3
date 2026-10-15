<script setup lang="ts">
/**
 * ResultRack
 * [Tool Organism] ケーブルラック選定ツールの計算・選定結果表示コンポーネント。
 * 1段敷設（平置き・標準）と2段敷設（省スペース）の2段構えで比較表示します。
 */
import { computed } from 'vue'

import { RESULT_BADGE_VARIANT_MAP } from '~/constants/toolOptions'
import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import { formatRackResult } from '~/utils/tools/rack/rackResultPresenter'

const props = defineProps<{
  result: RackCalcResult | null
  size?: 'sm' | 'md'
}>()

const vm = computed(() =>
  formatRackResult({
    result: props.result,
  }),
)
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0" :class="[size === 'sm' ? 'gap-item-gap is-sm' : 'gap-panel-gap']">
    <div class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="[vm.isEmpty ? 'is-empty' : `is-${vm.tier1.panelStatus}`, size === 'sm' && 'is-sm']">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>{{ vm.tier1.title }}</span>
        <Badge v-if="vm.tier1.badgeText" :variant="RESULT_BADGE_VARIANT_MAP[vm.tier1.panelStatus]">{{ vm.tier1.badgeText }}</Badge>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span>{{ vm.tier1.displaySize }}</span>
      </output>
    </div>

    <div class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="[vm.isEmpty ? 'is-empty' : `is-${vm.tier2.panelStatus}`, size === 'sm' && 'is-sm']">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>{{ vm.tier2.title }}</span>
        <Badge v-if="vm.tier2.badgeText" :variant="RESULT_BADGE_VARIANT_MAP[vm.tier2.panelStatus]">{{ vm.tier2.badgeText }}</Badge>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span v-if="vm.tier2.isApplicable">{{ vm.tier2.displaySize }}</span>
        <span v-else class="not-applicable py-inline-gap">{{ vm.tier2.notApplicableText }}</span>
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

<style scoped lang="scss">
.not-applicable {
  font-family: var(--font-base);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-normal);
  color: var(--color-text-muted);
}
</style>
