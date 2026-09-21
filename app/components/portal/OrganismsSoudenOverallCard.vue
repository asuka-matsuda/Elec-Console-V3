<script setup lang="ts">
/**
 * OrganismsSoudenOverallCard
 * [Portal Organisms] 送電試験ダッシュボードの総合進捗カードOrganismコンポーネント。
 * 全試験完了率の円形ゲージ（Atom）と、幹線・二次側それぞれの詳細進捗ブロック（Molecules × 2）を一元表示します。
 */
import type { SoudenStats } from '~/types/portal'

defineProps<{
  stats: SoudenStats
  siteId?: string
}>()
</script>

<template>
  <Panel>
    <SectionHeader
      title="総合進捗"
      icon="activity"
      variant="hud"
      tag="h3"
    />
    <div class="flex flex-col lg:flex-row items-center gap-6 lg:gap-8 py-2">
      <!-- 全試験完了率ゲージ（Atom） -->
      <div class="flex shrink-0 items-center justify-center min-w-[220px]">
        <PortalCircularGauge
          :value="stats.totalPct"
          size="lg"
          label="全試験完了率"
        />
      </div>

      <!-- 系統別進捗ブロック（Molecules × 2） -->
      <div class="flex flex-1 flex-col gap-5 w-full">
        <!-- 幹線 詳細 -->
        <div class="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
          <div class="flex shrink-0 items-center justify-center w-[120px]">
            <PortalCircularGauge
              :value="stats.trunkOverallPct"
              size="sm"
              label="幹線 全体"
            />
          </div>
          <PortalSoudenProgressBarGroup
            :stats="stats"
            kei-to="幹線"
            :site-id="siteId"
          />
        </div>

        <Divider type="fade-center" />

        <!-- 二次側 詳細 -->
        <div class="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
          <div class="flex shrink-0 items-center justify-center w-[120px]">
            <PortalCircularGauge
              :value="stats.secOverallPct"
              size="sm"
              label="二次側 全体"
            />
          </div>
          <PortalSoudenProgressBarGroup
            :stats="stats"
            kei-to="二次側"
            :site-id="siteId"
          />
        </div>
      </div>
    </div>
  </Panel>
</template>
