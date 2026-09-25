<script setup lang="ts">
/**
 * 送電試験進捗ダッシュボード画面
 * 送電試験ダッシュボード（総合進捗・幹線/二次側の進捗および各フェーズへの導線）
 */
import { computed, onMounted } from 'vue'

import { useHead, useRoute } from '#app'
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

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="flex flex-col gap-section-gap h-full">
    <SectionHeader
      :title="pageTitle"
      icon="zap"
    >
      <template #actions>
        <PortalSyncStatusBadge
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
    </SectionHeader>

    <div v-if="error" class="error-message flex items-center gap-2 p-3">
      <Icon name="alert-triangle" />
      <span>{{ error }}</span>
    </div>

    <EmptyState
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
    </EmptyState>

    <template v-else-if="stats">

      <PortalPanelSoudenOverall :stats="stats" :site-id="siteId" />
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
