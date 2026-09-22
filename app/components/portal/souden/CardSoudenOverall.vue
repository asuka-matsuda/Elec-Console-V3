<script setup lang="ts">
/**
 * SoudenOverallCard
 * [Portal Organisms] 送電試験ダッシュボードの総合進捗カード。
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
            <PortalSoudenProgressBarGroup
              :stats="stats"
              :kei-to="group.keiTo"
              :site-id="siteId"
            />
          </div>

          <Divider v-if="index < GROUPS.length - 1" type="fade-center" />
        </template>
      </div>
    </div>
  </Panel>
</template>
