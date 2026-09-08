<script setup lang="ts">
/**
 * PortalSoudenOverallCard
 * 送電試験ダッシュボードの総合進捗カードOrganismコンポーネント。
 * 全試験完了率の円形ゲージと、幹線・二次側それぞれの詳細進捗バーを一元表示します。
 */
import type { SoudenStats } from '~/types/portal'

defineProps<{
  stats: SoudenStats
}>()
</script>

<template>
  <AppPanel class="portal-souden-overall-card">
    <AppSectionHeader title="総合進捗" icon="activity" variant="hud" />
    <div class="progress-summary">
      <div class="summary-main">
        <AtomsCircularGauge
          :value="stats.totalPct"
          size="lg"
          label="全試験完了率"
          color="var(--color-category-main)"
        />
      </div>

      <div class="summary-details">
        <!-- 幹線 詳細 -->
        <PortalSoudenProgressGroup
          label="幹線"
          :overall-pct="stats.trunkOverallPct"
          color="var(--color-category-tool)"
          :total="stats.trunkTotal"
          :excluded="stats.trunkExcluded"
          :p1-completed="stats.trunkP1"
          :p1-pct="stats.trunkP1Pct"
          :p2-completed="stats.trunkP2"
          :p2-pct="stats.trunkP2Pct"
          :p3-completed="stats.trunkP3"
          :p3-pct="stats.trunkP3Pct"
        />

        <AtomsDivider type="fade-center" />

        <!-- 二次側 詳細 -->
        <PortalSoudenProgressGroup
          label="二次側"
          :overall-pct="stats.secOverallPct"
          color="var(--color-category-management)"
          :total="stats.secTotal"
          :excluded="stats.secExcluded"
          :p1-completed="stats.secP1"
          :p1-pct="stats.secP1Pct"
          :p2-completed="stats.secP2"
          :p2-pct="stats.secP2Pct"
          :p3-completed="stats.secP3"
          :p3-pct="stats.secP3Pct"
        />
      </div>
    </div>
  </AppPanel>
</template>

<style scoped lang="scss">
.progress-summary {
  display: flex;
  gap: var(--space-8);
  align-items: center;
  padding: var(--space-2) 0;

  @include mq("lg") {
    flex-direction: column;
    gap: var(--space-6);
  }
}

.summary-main {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;

  min-width: 220px;
}

.summary-details {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-5);
}
</style>
