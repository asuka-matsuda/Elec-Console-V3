<script setup lang="ts">
/**
 * ResultConduit
 * [Tool Organism] 配管サイズ計算の結果を視覚的に表示する3段縦積みコンポーネント。
 * 内線規程勧告（32%, 48%）およびユーザー指定占積率の結果を表示し、
 * フッターに内線規程の勧告根拠を表示します。
 */
import { computed } from 'vue'

import { CONDUIT_UI_LABELS } from '~/constants/conduitConstants'
import { RESULT_BADGE_VARIANT_MAP } from '~/constants/toolOptions'
import type { ConduitCalcResult } from '~/utils/tools/conduit/conduitCalcLogic'
import { formatConduitResult } from '~/utils/tools/conduit/conduitResultPresenter'

const props = defineProps<{
  result: ConduitCalcResult | null
  size?: 'sm' | 'md'
}>()

const vm = computed(() => formatConduitResult(props.result))
</script>

<template>
  <div class="flex flex-1 flex-col min-h-0" :class="[size === 'sm' ? 'gap-item-gap' : 'gap-panel-gap']">
    <div class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="[`is-${vm.status32}`, size === 'sm' && 'is-sm']">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>{{ CONDUIT_UI_LABELS.TITLE_32 }}</span>
        <Badge v-if="vm.badge32" :variant="RESULT_BADGE_VARIANT_MAP[vm.status32]">{{ vm.badge32 }}</Badge>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span>{{ vm.size32 }}</span>
        <span v-if="vm.fillText32" class="value-sub">{{ vm.fillText32 }}</span>
      </output>
    </div>

    <div class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="[`is-${vm.status48}`, size === 'sm' && 'is-sm']">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>{{ CONDUIT_UI_LABELS.TITLE_48 }}</span>
        <Badge v-if="vm.badge48" :variant="RESULT_BADGE_VARIANT_MAP[vm.status48]">{{ vm.badge48 }}</Badge>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span>{{ vm.size48 }}</span>
        <span v-if="vm.fillText48" class="value-sub">{{ vm.fillText48 }}</span>
      </output>
    </div>

    <div class="result-tile flex flex-1 flex-col items-center justify-center gap-inline-gap w-full min-w-0" :class="[`is-${vm.statusCustom}`, size === 'sm' && 'is-sm']">
      <header class="tile-header flex items-center justify-center gap-inline-gap">
        <span>{{ vm.titleCustom }}</span>
        <Badge v-if="vm.badgeCustom" :variant="RESULT_BADGE_VARIANT_MAP[vm.statusCustom]">{{ vm.badgeCustom }}</Badge>
      </header>
      <output class="tile-value flex items-center justify-center gap-item-gap">
        <span>{{ vm.sizeCustom }}</span>
        <span v-if="vm.fillTextCustom" class="value-sub">{{ vm.fillTextCustom }}</span>
      </output>
    </div>

    <ul class="flex flex-col gap-inline-gap conduit-notes">
      <li>3110-6 (32%以下): 異なる太さの絶縁電線を同一管内に収める場合（原則）</li>
      <li>3110-5 (48%以下): 同一太さで、かつ管の屈曲が少なく引き替えが容易な場合</li>
    </ul>
  </div>
</template>

<style scoped lang="scss">
.conduit-notes {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
