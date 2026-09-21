<script setup lang="ts">
/**
 * SoudenProgressBarGroup
 * [Portal Molecules] 送電試験の各フェーズ（Phase 1〜3）プログレスバー群。
 * 系統（幹線/二次側）の統計データから各フェーズの進捗バーと入力リンクを一元描画します。
 */
import { computed } from 'vue'

import type { SoudenStats } from '~/types/portal'

const props = defineProps<{
  stats: SoudenStats
  keiTo: '幹線' | '二次側'
  siteId?: string
}>()

const isTrunk = computed(() => props.keiTo === '幹線')
const total = computed(() => (isTrunk.value ? props.stats.trunkTotal : props.stats.secTotal))
const excluded = computed(() => (isTrunk.value ? props.stats.trunkExcluded : props.stats.secExcluded))

const phases = computed(() => [
  {
    phase: 1,
    title: '回路確認 (Phase 1)',
    completed: isTrunk.value ? props.stats.trunkP1 : props.stats.secP1,
    pct: isTrunk.value ? props.stats.trunkP1Pct : props.stats.secP1Pct,
    color: 'var(--color-category-main)',
  },
  {
    phase: 2,
    title: '絶縁抵抗 (Phase 2)',
    completed: isTrunk.value ? props.stats.trunkP2 : props.stats.secP2,
    pct: isTrunk.value ? props.stats.trunkP2Pct : props.stats.secP2Pct,
    color: 'var(--color-category-tool)',
  },
  {
    phase: 3,
    title: '送電・電圧 (Phase 3)',
    completed: isTrunk.value ? props.stats.trunkP3 : props.stats.secP3,
    pct: isTrunk.value ? props.stats.trunkP3Pct : props.stats.secP3Pct,
    color: 'var(--color-status-success)',
  },
])
</script>

<template>
  <div class="flex flex-1 flex-col gap-3 w-full">
    <div
      v-for="item in phases"
      :key="item.phase"
      class="flex flex-col gap-1"
    >
      <div class="phase-row-header flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="phase-title">{{ item.title }}</span>
          <Button
            v-if="siteId"
            :to="`/portal/${siteId}/phase${item.phase}?kei_to=${keiTo}`"
          >
            試験入力
          </Button>
        </div>
        <div class="phase-stat flex items-center gap-2">
          <span><strong>{{ item.completed }}</strong> / {{ total }}</span>
          <span class="stat-pct">({{ item.pct }}%)</span>
          <Badge v-if="excluded > 0" id="exam:excluded">
            除外: {{ excluded }}
          </Badge>
        </div>
      </div>
      <PortalProgressBar :value="item.pct" :color="item.color" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.phase-row-header {
  font-size: var(--font-size-xs);
}

.phase-title {
  font-weight: var(--font-weight-medium, 500);
  color: var(--color-text-main);
}

.phase-stat {
  font-family: var(--font-mono);
  color: var(--color-text-muted);

  strong,
  .stat-pct {
    color: var(--color-text-main);
  }
}
</style>
