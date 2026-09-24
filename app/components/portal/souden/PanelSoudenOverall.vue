<script setup lang="ts">
/**
 * PanelSoudenOverall
 * [Portal Organisms] 送電試験ダッシュボードの総合進捗パネル。
 * 全試験完了率の円形ゲージと、幹線・二次側それぞれの詳細進捗群を一元表示します。
 */
import type { SoudenStats } from '~/types/portal'

defineProps<{
  stats: SoudenStats
  siteId?: string
}>()

const GROUPS = [
  { keiTo: '幹線', label: '幹線 全体', pctKey: 'trunkOverallPct' },
  { keiTo: '二次側', label: '二次側 全体', pctKey: 'secOverallPct' },
] as const

const getGroupData = (keiTo: '幹線' | '二次側', stats: SoudenStats) => {
  const isTrunk = keiTo === '幹線'
  const total = isTrunk ? stats.trunkTotal : stats.secTotal
  const excluded = isTrunk ? stats.trunkExcluded : stats.secExcluded

  const phases = [
    {
      phase: 1,
      title: '回路確認 (Phase 1)',
      completed: isTrunk ? stats.trunkP1 : stats.secP1,
      pct: isTrunk ? stats.trunkP1Pct : stats.secP1Pct,
    },
    {
      phase: 2,
      title: '絶縁抵抗 (Phase 2)',
      completed: isTrunk ? stats.trunkP2 : stats.secP2,
      pct: isTrunk ? stats.trunkP2Pct : stats.secP2Pct,
    },
    {
      phase: 3,
      title: '送電・電圧 (Phase 3)',
      completed: isTrunk ? stats.trunkP3 : stats.secP3,
      pct: isTrunk ? stats.trunkP3Pct : stats.secP3Pct,
    },
  ]

  return { total, excluded, phases }
}
</script>

<template>
  <Panel>
    <SectionHeader
      title="総合進捗"
      icon="activity"
      variant="hud"
      tag="h3"
    />

    <div class="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
      <PortalCircularGauge
        class="shrink-0"
        :value="stats.totalPct"
        size="lg"
        label="全試験完了率"
      />

      <div class="flex flex-1 flex-col gap-5 w-full">
        <template v-for="(group, index) in GROUPS" :key="group.keiTo">
          <div class="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
            <PortalCircularGauge
              class="shrink-0"
              :value="stats[group.pctKey]"
              size="sm"
              :label="group.label"
            />
            <div class="flex flex-1 flex-col gap-3 w-full">
              <div
                v-for="item in getGroupData(group.keiTo, stats).phases"
                :key="item.phase"
                class="flex flex-col gap-1"
              >
                <div class="phase-row-header flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="phase-title">{{ item.title }}</span>
                    <Button
                      v-if="siteId"
                      :to="`/portal/${siteId}/phase${item.phase}?kei_to=${group.keiTo}`"
                    >
                      試験入力
                    </Button>
                  </div>
                  <div class="phase-stat flex items-center gap-2">
                    <span><strong>{{ item.completed }}</strong> / {{ getGroupData(group.keiTo, stats).total }}</span>
                    <span class="stat-pct">({{ item.pct }}%)</span>
                    <Badge v-if="getGroupData(group.keiTo, stats).excluded > 0" id="exam:excluded">
                      除外: {{ getGroupData(group.keiTo, stats).excluded }}
                    </Badge>
                  </div>
                </div>
                <PortalProgressBar :value="item.pct" />
              </div>
            </div>
          </div>

          <Divider v-if="index < GROUPS.length - 1" type="fade-center" />
        </template>
      </div>
    </div>
  </Panel>
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
