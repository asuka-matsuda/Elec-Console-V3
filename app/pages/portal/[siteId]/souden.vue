<script setup lang="ts">
/**
 * Souden Dashboard View
 * 送電試験ダッシュボード（総合進捗・幹線/二次側の進捗および各フェーズへの導線）
 */
import { computed, onMounted } from 'vue'

import { useHead, useRoute } from '#app'
import { useSoudenDashboard } from '~/composables/portal/useSoudenDashboard'

useHead({ title: '送電試験ダッシュボード - Elec-Console' })

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)

const {
  stats,
  isLoading,
  error,
  fetchStats,
} = useSoudenDashboard(siteId)

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="souden-dashboard">
    <MoleculesSectionHeader
      title="送電試験ダッシュボード"
      icon="zap"
      size="lg"
    >
      <template #actions>
        <PortalSyncStatusBadge
          :site-id="siteId"
          @synced="fetchStats"
        />

        <AtomsButton
          :to="`/portal/${siteId}`"
          variant="secondary"
          size="sm"
        >
          <AtomsIcon name="arrow-left" size="sm" />
          ポータルへ戻る
        </AtomsButton>

        <AtomsButton
          :to="`/portal/${siteId}/operation-logs`"
          variant="secondary"
          size="sm"
        >
          <AtomsIcon name="book-open" size="sm" />
          操作ログ
        </AtomsButton>
      </template>
    </MoleculesSectionHeader>

    <div v-if="error" class="error-message">
      <AtomsIcon name="alert-triangle" />
      <span>{{ error }}</span>
    </div>

    <!-- データ未取込時のエンプティステート -->
    <MoleculesEmptyState
      v-if="!isLoading && stats && stats.totalCircuits === 0"
      icon="database"
      title="回路データが登録されていません"
      description="管理者の「現場設定」よりExcel連携ファイルの保存先設定および回路データの取り込みを行ってください。"
    >
      <template #actions>
        <AtomsButton
          to="/portal/admin"
          variant="primary"
          size="sm"
        >
          <AtomsIcon name="settings" size="sm" />
          現場設定へ移動
        </AtomsButton>
      </template>
    </MoleculesEmptyState>

    <template v-else-if="stats">
      <!-- 総合進捗カード (Organism) -->
      <PortalSoudenOverallCard :stats="stats" />

      <!-- 幹線と二次側のフェーズ遷移カード (2カラム, Organism) -->
      <div class="two-col-grid">
        <PortalSoudenPhaseNavCard
          title="幹線"
          icon="zap"
          variant="tool"
          :site-id="siteId"
          kei-to="幹線"
          :p1-completed="stats.trunkP1"
          :p2-completed="stats.trunkP2"
          :p3-completed="stats.trunkP3"
          :total="stats.trunkTotal"
        />

        <PortalSoudenPhaseNavCard
          title="二次側"
          icon="layers"
          variant="management"
          :site-id="siteId"
          kei-to="二次側"
          :p1-completed="stats.secP1"
          :p2-completed="stats.secP2"
          :p3-completed="stats.secP3"
          :total="stats.secTotal"
        />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.souden-dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);
  height: 100%;
}

.error-message {
  display: flex;
  gap: var(--space-2);
  align-items: center;

  padding: var(--space-3);
  border: 1px solid color-mix(in srgb, var(--color-status-danger) 25%, transparent);
  border-radius: var(--radius-sm);

  color: var(--color-status-danger);

  background-color: color-mix(in srgb, var(--color-status-danger) 10%, transparent);
}

.two-col-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-section-gap);
  align-items: flex-start;

  @include mq("md") {
    grid-template-columns: 1fr;
  }
}
</style>
