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
        <PortalAtomsCircularGauge
          :value="stats.totalPct"
          size="lg"
          label="全試験完了率"
          color="var(--color-category-main)"
        />
      </div>

      <!-- 系統別進捗ブロック（Molecules × 2） -->
      <div class="flex flex-1 flex-col gap-5 w-full">
        <!-- 幹線 詳細 -->
        <div class="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
          <div class="flex shrink-0 items-center justify-center w-[120px]">
            <PortalAtomsCircularGauge
              :value="stats.trunkOverallPct"
              size="sm"
              label="幹線 全体"
              color="var(--color-category-tool)"
            />
          </div>
          <PortalMoleculesSoudenProgressBarGroup
            :total="stats.trunkTotal"
            :excluded="stats.trunkExcluded"
            :p1-completed="stats.trunkP1"
            :p1-pct="stats.trunkP1Pct"
            :p2-completed="stats.trunkP2"
            :p2-pct="stats.trunkP2Pct"
            :p3-completed="stats.trunkP3"
            :p3-pct="stats.trunkP3Pct"
            :site-id="siteId"
            kei-to="幹線"
          />
        </div>

        <Divider type="fade-center" />

        <!-- 二次側 詳細 -->
        <div class="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
          <div class="flex shrink-0 items-center justify-center w-[120px]">
            <PortalAtomsCircularGauge
              :value="stats.secOverallPct"
              size="sm"
              label="二次側 全体"
              color="var(--color-category-management)"
            />
          </div>
          <PortalMoleculesSoudenProgressBarGroup
            :total="stats.secTotal"
            :excluded="stats.secExcluded"
            :p1-completed="stats.secP1"
            :p1-pct="stats.secP1Pct"
            :p2-completed="stats.secP2"
            :p2-pct="stats.secP2Pct"
            :p3-completed="stats.secP3"
            :p3-pct="stats.secP3Pct"
            :site-id="siteId"
            kei-to="二次側"
          />
        </div>
      </div>
    </div>
  </Panel>
</template>
