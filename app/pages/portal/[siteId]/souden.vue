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
  <main class="souden-dashboard">
    <AppSectionHeader
      title="送電試験ダッシュボード"
      icon="zap"
      size="lg"
    >
      <template #actions>
        <SyncStatusBadge
          :site-id="siteId"
          @synced="fetchStats"
        />

        <AppButton
          :to="`/portal/${siteId}`"
          variant="secondary"
          size="sm"
        >
          <AppIcon name="arrow-left" size="sm" />
          ポータルへ戻る
        </AppButton>

        <AppButton
          :to="`/portal/${siteId}/operation-logs`"
          variant="secondary"
          size="sm"
        >
          <AppIcon name="book-open" size="sm" />
          操作ログ
        </AppButton>
      </template>
    </AppSectionHeader>

    <div v-if="error" class="error-message">
      <AppIcon name="alert-triangle" />
      <span>{{ error }}</span>
    </div>

    <!-- データ未取込時のエンプティステート -->
    <AppEmptyState
      v-if="!isLoading && stats && stats.totalCircuits === 0"
      icon="database"
      title="回路データが登録されていません"
      description="管理者の「現場設定」よりExcel連携ファイルの保存先設定および回路データの取り込みを行ってください。"
    >
      <template #actions>
        <AppButton
          to="/portal/admin"
          variant="primary"
          size="sm"
        >
          <AppIcon name="settings" size="sm" />
          現場設定へ移動
        </AppButton>
      </template>
    </AppEmptyState>

    <template v-else-if="stats">
      <!-- 総合進捗カード -->
      <AppPanel>
        <AppSectionHeader title="総合進捗" icon="activity" variant="hud" />
        <div class="progress-summary">
          <div class="summary-main">
            <AppCircularGauge
              :value="stats.totalPct"
              size="lg"
              label="全試験完了率"
              color="var(--color-category-main)"
            />
          </div>

          <div class="summary-details">
            <!-- 幹線 詳細 -->
            <div class="summary-group">
              <div class="sub-gauge">
                <AppCircularGauge
                  :value="stats.trunkOverallPct"
                  size="sm"
                  label="幹線 全体"
                  color="var(--color-category-tool)"
                />
              </div>

              <div class="progress-bars">
                <AppProgressBar
                  label="回路確認 (Phase 1)"
                  :completed="stats.trunkP1"
                  :total="stats.trunkTotal"
                  :excluded="stats.trunkExcluded"
                  :pct="stats.trunkP1Pct"
                  variant="main"
                />
                <AppProgressBar
                  label="絶縁抵抗 (Phase 2)"
                  :completed="stats.trunkP2"
                  :total="stats.trunkTotal"
                  :excluded="stats.trunkExcluded"
                  :pct="stats.trunkP2Pct"
                  variant="tool"
                />
                <AppProgressBar
                  label="送電・電圧 (Phase 3)"
                  :completed="stats.trunkP3"
                  :total="stats.trunkTotal"
                  :excluded="stats.trunkExcluded"
                  :pct="stats.trunkP3Pct"
                  variant="success"
                />
              </div>
            </div>

            <AppDivider type="fade-center" />

            <!-- 二次側 詳細 -->
            <div class="summary-group">
              <div class="sub-gauge">
                <AppCircularGauge
                  :value="stats.secOverallPct"
                  size="sm"
                  label="二次側 全体"
                  color="var(--color-category-management)"
                />
              </div>

              <div class="progress-bars">
                <AppProgressBar
                  label="回路確認 (Phase 1)"
                  :completed="stats.secP1"
                  :total="stats.secTotal"
                  :excluded="stats.secExcluded"
                  :pct="stats.secP1Pct"
                  variant="main"
                />
                <AppProgressBar
                  label="絶縁抵抗 (Phase 2)"
                  :completed="stats.secP2"
                  :total="stats.secTotal"
                  :excluded="stats.secExcluded"
                  :pct="stats.secP2Pct"
                  variant="tool"
                />
                <AppProgressBar
                  label="送電・電圧 (Phase 3)"
                  :completed="stats.secP3"
                  :total="stats.secTotal"
                  :excluded="stats.secExcluded"
                  :pct="stats.secP3Pct"
                  variant="success"
                />
              </div>
            </div>
          </div>
        </div>
      </AppPanel>

      <!-- 幹線と二次側のフェーズ遷移カード (2カラム) -->
      <div class="l-grid l-grid--2col">
        <!-- 幹線カード -->
        <AppPanel>
          <AppSectionHeader title="幹線" icon="zap" variant="tool" />
          <div class="step-list">
            <SoudenStepIndicator
              :step-num="1"
              title="回路確認・増し締め"
              :completed="stats.trunkP1"
              :total="stats.trunkTotal"
              :to="`/portal/${siteId}/phase1?kei_to=幹線`"
            />
            <SoudenStepIndicator
              :step-num="2"
              title="絶縁抵抗測定"
              :completed="stats.trunkP2"
              :total="stats.trunkTotal"
              :to="`/portal/${siteId}/phase2?kei_to=幹線`"
            />
            <SoudenStepIndicator
              :step-num="3"
              title="送電・電圧測定"
              :completed="stats.trunkP3"
              :total="stats.trunkTotal"
              :to="`/portal/${siteId}/phase3?kei_to=幹線`"
            />
          </div>
        </AppPanel>

        <!-- 二次側カード -->
        <AppPanel>
          <AppSectionHeader title="二次側" icon="layers" variant="management" />
          <div class="step-list">
            <SoudenStepIndicator
              :step-num="1"
              title="回路確認・増し締め"
              :completed="stats.secP1"
              :total="stats.secTotal"
              :to="`/portal/${siteId}/phase1?kei_to=二次側`"
            />
            <SoudenStepIndicator
              :step-num="2"
              title="絶縁抵抗測定"
              :completed="stats.secP2"
              :total="stats.secTotal"
              :to="`/portal/${siteId}/phase2?kei_to=二次側`"
            />
            <SoudenStepIndicator
              :step-num="3"
              title="送電・電圧測定"
              :completed="stats.secP3"
              :total="stats.secTotal"
              :to="`/portal/${siteId}/phase3?kei_to=二次側`"
            />
          </div>
        </AppPanel>
      </div>
    </template>
  </main>
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
  border: 1px solid rgb(239 68 68 / 20%);
  border-radius: var(--radius-sm);

  color: var(--color-status-danger);

  background-color: rgb(239 68 68 / 10%);
}

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

.summary-group {
  display: flex;
  gap: var(--space-6);
  align-items: center;

  @include mq("md") {
    flex-direction: column;
    gap: var(--space-3);
    align-items: flex-start;
  }
}

.sub-gauge {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;

  width: 120px;
}

.progress-bars {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-3);

  width: 100%;
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  padding: var(--space-2) 0;
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
