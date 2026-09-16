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
  <div class="flex flex-col gap-section-gap h-full">
    <MoleculesSectionHeader
      title="送電試験ダッシュボード"
      icon="zap"
      size="lg"
    >
      <template #actions>
        <PortalMoleculesSyncStatusBadge
          :site-id="siteId"
          @synced="fetchStats"
        />

        <Button
          icon="arrow-left"
          :to="`/portal/${siteId}`"
        >
          ポータルへ戻る
        </Button>

        <Button
          icon="book-open"
          :to="`/portal/${siteId}/operation-logs`"
        >
          操作ログ
        </Button>
      </template>
    </MoleculesSectionHeader>

    <div v-if="error" class="error-message flex items-center gap-2 p-3">
      <Icon name="alert-triangle" />
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
        <Button
          icon="settings"
          to="/portal/admin"
        >
          現場設定へ移動
        </Button>
      </template>
    </MoleculesEmptyState>

    <template v-else-if="stats">
      <!-- 総合進捗カード (Organism) -->
      <PortalOrganismsSoudenOverallCard :stats="stats" :site-id="siteId" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.error-message {
  border: 1px solid color-mix(in srgb, var(--color-status-danger) 25%, transparent);
  color: var(--color-status-danger);
  background-color: color-mix(in srgb, var(--color-status-danger) 10%, transparent);
}
</style>
