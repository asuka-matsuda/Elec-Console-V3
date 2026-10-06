<script setup lang="ts">
/**
 * 送電試験進捗ダッシュボード画面
 * 送電試験ダッシュボード（総合進捗・幹線/二次側の進捗および各フェーズへの導線）
 */
import { computed, onMounted } from 'vue'

import { useHead, useRoute } from '#app'
import type { SoudenStats } from '#shared/types/circuit'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import { useSoudenDashboard } from '~/composables/portal/useSoudenDashboard'

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const { siteName } = useCurrentSite(siteId)

const pageTitle = computed(() => (siteName.value ? `${siteName.value}_送電試験` : '送電試験ダッシュボード'))

useHead({
  title: computed(() => `${pageTitle.value} - Elec-Console`),
})

const {
  stats,
  isLoading,
  error,
  fetchStats,
} = useSoudenDashboard(siteId)

const SOUDEN_GROUPS = [
  { keiTo: '幹線' as const, label: '幹線 全体', pctKey: 'trunkOverallPct' as const },
  { keiTo: '二次側' as const, label: '二次側 全体', pctKey: 'secOverallPct' as const },
]

const getGroupData = (keiTo: '幹線' | '二次側', currentStats: SoudenStats) => {
  const isTrunk = keiTo === '幹線'
  const total = isTrunk ? currentStats.trunkTotal : currentStats.secTotal
  const excluded = isTrunk ? currentStats.trunkExcluded : currentStats.secExcluded

  const phases = [
    {
      phase: 1,
      title: '回路確認 (Phase 1)',
      completed: isTrunk ? currentStats.trunkP1 : currentStats.secP1,
      pct: isTrunk ? currentStats.trunkP1Pct : currentStats.secP1Pct,
    },
    {
      phase: 2,
      title: '絶縁抵抗 (Phase 2)',
      completed: isTrunk ? currentStats.trunkP2 : currentStats.secP2,
      pct: isTrunk ? currentStats.trunkP2Pct : currentStats.secP2Pct,
    },
    {
      phase: 3,
      title: '送電・電圧 (Phase 3)',
      completed: isTrunk ? currentStats.trunkP3 : currentStats.secP3,
      pct: isTrunk ? currentStats.trunkP3Pct : currentStats.secP3Pct,
    },
  ]

  return { total, excluded, phases }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="flex flex-col gap-section-gap h-full">
    <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
      <h2 class="flex items-center gap-item-gap">
        <Icon name="zap" />
        <span>{{ pageTitle }}</span>
      </h2>
      <div class="flex items-center gap-item-gap">
        <PortalSyncStatusBadge :site-id="siteId" @synced="fetchStats" />

        <Button variant="tertiary" size="sm" icon="arrow-left" :to="`/portal/${siteId}`">現場ポータルへ戻る</Button>

        <Button variant="secondary" size="sm" icon="book-open" :to="`/portal/${siteId}/operation-logs`">操作ログを確認する</Button>
      </div>
    </header>
    <hr class="divider">

    <Note v-if="error" variant="error">{{ error }}</Note>

    <EmptyState v-if="!isLoading && stats && stats.totalCircuits === 0" icon="database" variant="informational" title="回路データが登録されていません" description="管理者の「現場設定」よりExcel連携ファイルの保存先設定および回路データの取り込みを行ってください。">
      <template #actions>
        <Button variant="secondary" size="sm" icon="settings" to="/portal/admin">現場設定へ移動する</Button>
      </template>
    </EmptyState>

    <template v-else-if="stats">
      <section class="panel flex flex-col gap-panel-gap">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="activity" />
            <span>総合進捗</span>
          </h3>
          <div v-if="siteId" class="flex items-center gap-item-gap">
            <Button variant="secondary" size="sm" icon="printer" :to="`/portal/${siteId}/reports?tab=exam`">帳票を出力する</Button>
          </div>
        </header>
        <hr class="divider">

        <div class="flex flex-col lg:flex-row items-center gap-panel-gap">
          <Gauge class="shrink-0" :value="stats.totalPct" size="lg" label="全試験完了率" />

          <div class="flex flex-1 flex-col gap-panel-gap w-full">
            <template v-for="(group, index) in SOUDEN_GROUPS" :key="group.keiTo">
              <div class="flex flex-col md:flex-row items-start md:items-center gap-panel-gap">
                <Gauge class="shrink-0" :value="stats[group.pctKey]" size="sm" :label="group.label" />
                <ul class="flex flex-1 flex-col gap-form-row-gap w-full">
                  <li v-for="item in getGroupData(group.keiTo, stats).phases" :key="item.phase" class="flex flex-col gap-inline-gap">
                    <div class="phase-row-header flex items-center justify-between">
                      <div class="flex items-center gap-item-gap">
                        <span class="phase-title">{{ item.title }}</span>
                        <Button v-if="siteId" variant="secondary" size="sm" :to="`/portal/${siteId}/phase${item.phase}?kei_to=${group.keiTo}`">試験を入力する</Button>
                      </div>
                      <div class="phase-stat flex items-center gap-item-gap">
                        <span><strong>{{ item.completed }}</strong> / {{ getGroupData(group.keiTo, stats).total }}</span>
                        <span class="stat-pct">({{ item.pct }}%)</span>
                        <small v-if="getGroupData(group.keiTo, stats).excluded > 0">(除外: {{ getGroupData(group.keiTo, stats).excluded }})</small>
                      </div>
                    </div>
                    <Progress :value="item.pct" />
                  </li>
                </ul>
              </div>

              <hr v-if="index < SOUDEN_GROUPS.length - 1" class="divider is-fade-center">
            </template>
          </div>
        </div>
      </section>
    </template>
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
