<script setup lang="ts">
import { toRef } from 'vue'

import { useSiteSettingsForm } from '~/composables/portal/useSiteSettingsForm'
import { useModal } from '~/composables/useModal'
import type { Site } from '~/types/admin'

const isOpen = defineModel<boolean>({ default: false })

const props = defineProps<{
  site: Site | null
}>()

const emit = defineEmits<{
  (e: 'update:site', site: Site): void
}>()

const {
  editData,
  editStatus,
  editId,
  excludedCircuitsList,
  addCircuit,
  removeCircuit,
  activeTab,
  tabs,
  statusOptions,
  workerNames,
  handleSave,
  showSyncMsg,
  syncMsg,
  syncMsgType,
  syncAction,
  isSyncing,
  syncResultData,
  isResultDialogOpen,
  handleMergeSync,
  handleResetImport,
  handleExport,
} = useSiteSettingsForm({
  site: toRef(props, 'site'),
  isOpen,
  onSave: payload => emit('update:site', payload),
})

const { askConfirm } = useModal()

const confirmResetImport = async () => {
  const isConfirmed = await askConfirm({
    title: '全件初期化取込の確認',
    message: '現在の回路データおよびWeb上で入力された試験結果（Phase 1〜3）がすべて破棄され、Excelの内容で最初から再構築されます。本当に実行しますか？',
    confirmText: '全件初期化して取り込む',
    intent: 'danger',
  })

  if (isConfirmed) {
    await handleResetImport()
  }
}
</script>

<template>
  <AppModal
    v-model="isOpen"
    title="現場設定"
    icon="settings"
    @cancel="isOpen = false"
  >
    <AppTabs v-model="activeTab" :options="tabs" />

    <div class="c-site-settings__content">
      <template v-if="activeTab === 'basic'">
        <AppFormGroup label="ステータス">
          <AppSelect v-model="editStatus" :options="statusOptions" />
        </AppFormGroup>
        <AppFormGroup label="現場ID (半角英数)">
          <AppInput v-model="editId" placeholder="例: site-tokyo-01" />
        </AppFormGroup>
        <AppFormGroup label="現場名">
          <AppInput v-model="editData.name" />
        </AppFormGroup>
        <AppFormGroup label="アサイン済ワーカー">
          <div class="c-site-settings__workers">
            <template v-if="workerNames.length > 0">
              <AppBadge
                v-for="(name, idx) in workerNames"
                :key="idx"
              >
                {{ name }}
              </AppBadge>
            </template>
            <div v-else class="u-text-muted u-text-sm">
              アサインされているワーカーはいません
            </div>
          </div>
        </AppFormGroup>
      </template>

      <template v-else-if="activeTab === 'integration'">
        <AppFormGroup label="Excel連携ファイル保存先 (絶対パス)">
          <AppInput
            v-model="editData.excelPath"
            placeholder="例: D:\Data\site_a.xlsm"
          />
        </AppFormGroup>
        <AppFormGroup label="帳票テンプレート保存先 (絶対パス)">
          <AppInput
            v-model="editData.reportTemplatePath"
            placeholder="例: D:\Templates\report.xlsx"
          />
        </AppFormGroup>

        <AppPanel class="u-mt-6">
          <AppSectionHeader title="データベース連携（Excel同期・エクスポート）" />
          <div class="c-site-settings__sync-cards">
            <!-- 差分再同期 (スマートマージ) -->
            <div class="c-site-settings__sync-item">
              <div class="c-site-settings__sync-info">
                <div class="c-site-settings__sync-title">
                  Excelから差分再同期 (スマートマージ)
                </div>
                <div class="c-site-settings__sync-desc">
                  Web上の試験結果（Phase 1〜3）を保持したまま、Excelで追加された回路や基本情報の変更のみを安全に同期します（途中行の挿入にも対応）。
                </div>
              </div>
              <AppButton
                variant="primary"
                icon="refresh-cw"
                :loading="syncAction === 'merge'"
                :disabled="isSyncing"
                @click="handleMergeSync"
              >
                差分再同期
              </AppButton>
            </div>

            <!-- Excelへ書戻し (実エクスポート) -->
            <div class="c-site-settings__sync-item">
              <div class="c-site-settings__sync-info">
                <div class="c-site-settings__sync-title">
                  Excelへ書戻し (エクスポート)
                </div>
                <div class="c-site-settings__sync-desc">
                  Web上で入力・完了した最新の試験結果（Phase 1〜3の確認・測定値・作業者等）を元のExcelファイルに上書き保存します。
                </div>
              </div>
              <AppButton
                variant="secondary"
                icon="upload"
                :loading="syncAction === 'export'"
                :disabled="isSyncing"
                @click="handleExport"
              >
                Excelへ書戻し
              </AppButton>
            </div>

            <!-- 全件初期化取込 (完全リセット) -->
            <div class="c-site-settings__sync-item c-site-settings__sync-item--danger">
              <div class="c-site-settings__sync-info">
                <div class="c-site-settings__sync-title">
                  全件取込 (完全初期化)
                </div>
                <div class="c-site-settings__sync-desc">
                  Web上の試験結果を含むすべてのデータを破棄し、Excelからまっさらに最初から作り直します（現場初期設定用）。
                </div>
              </div>
              <AppButton
                variant="danger"
                icon="trash-2"
                :loading="syncAction === 'reset'"
                :disabled="isSyncing"
                @click="confirmResetImport"
              >
                全件初期化取込
              </AppButton>
            </div>
          </div>

          <!-- 実行中ステータス表示 -->
          <div
            v-if="isSyncing"
            class="c-site-settings__sync-status c-site-settings__sync-status--loading"
          >
            <AppIcon name="loader" size="sm" class="u-spin" />
            <span>{{ syncMsg }}</span>
          </div>

          <!-- エラー発生時の表示 -->
          <div
            v-else-if="showSyncMsg && syncMsgType === 'error'"
            class="c-site-settings__sync-status c-site-settings__sync-status--error"
          >
            <AppIcon name="alert-circle" size="sm" />
            <span>{{ syncMsg }}</span>
          </div>

          <!-- 完了時のインライン件数サマリー表示 -->
          <div
            v-else-if="syncResultData"
            class="c-site-settings__sync-result-card"
          >
            <div class="c-site-settings__sync-result-header">
              <div class="c-site-settings__sync-result-tag">
                <AppIcon name="check-circle" size="sm" class="u-text-success" />
                <span class="u-font-bold">{{ syncResultData.title }}</span>
              </div>
              <AppButton
                variant="secondary"
                size="sm"
                @click="isResultDialogOpen = true"
              >
                詳細を表示
              </AppButton>
            </div>

            <!-- 差分再同期の場合のバッジ -->
            <div
              v-if="syncResultData.type === 'merge'"
              class="c-site-settings__sync-badges"
            >
              <span class="c-site-settings__stat-badge c-site-settings__stat-badge--add">
                追加: <strong>+{{ syncResultData.createdCount ?? 0 }}</strong> 件
              </span>
              <span class="c-site-settings__stat-badge c-site-settings__stat-badge--update">
                変更: <strong>{{ syncResultData.updatedCount ?? 0 }}</strong> 件
              </span>
              <span class="c-site-settings__stat-badge">
                全回路数: <strong>{{ syncResultData.count }}</strong> 件
              </span>
            </div>

            <!-- 全件初期化取込の場合のバッジ -->
            <div
              v-else-if="syncResultData.type === 'reset'"
              class="c-site-settings__sync-badges"
            >
              <span class="c-site-settings__stat-badge c-site-settings__stat-badge--add">
                取込総数: <strong>{{ syncResultData.count }}</strong> 件
              </span>
            </div>

            <!-- Excel書戻しの場合のバッジ -->
            <div
              v-else-if="syncResultData.type === 'export'"
              class="c-site-settings__sync-badges"
            >
              <span class="c-site-settings__stat-badge c-site-settings__stat-badge--info">
                書戻し完了: <strong>{{ syncResultData.count }}</strong> 件
              </span>
            </div>

            <div class="c-site-settings__sync-result-note">
              <template v-if="syncResultData.type === 'merge'">
                ※ Web上で登録された試験結果（Phase 1〜3）はすべて保持されました。
              </template>
              <template v-else-if="syncResultData.type === 'reset'">
                ※ Excelファイルから全回路を初期化して取り込みました。
              </template>
              <template v-else-if="syncResultData.type === 'export'">
                ※ Web上の最新試験結果（Phase 1〜3）をExcelファイルに書き戻しました。
              </template>
            </div>
          </div>
        </AppPanel>
      </template>

      <template v-else-if="activeTab === 'rules'">
        <AppFormGroup label="除外回路の設定">
          <template #description>
            計算や連携の対象外とする回路を複数追加できます。
          </template>
          <div class="c-site-settings__circuit-list">
            <div
              v-for="(_, idx) in excludedCircuitsList"
              :key="idx"
              class="c-site-settings__circuit-row"
            >
              <AppInput
                v-model="excludedCircuitsList[idx]"
                placeholder="例: 盤A-回路1"
              />
              <AppButton
                variant="danger"
                icon="trash-2"
                size="sm"
                @click="removeCircuit(idx)"
              />
            </div>
            <AppButton
              variant="secondary"
              icon="plus"
              size="sm"
              @click="addCircuit"
            >
              除外回路を追加する
            </AppButton>
          </div>
        </AppFormGroup>
      </template>
    </div>

    <template #footer>
      <AppButton variant="secondary" @click="isOpen = false">
        キャンセル
      </AppButton>
      <AppButton variant="primary" @click="handleSave"> 保存する </AppButton>
    </template>
  </AppModal>

  <!-- 処理完了・件数確認モーダルダイアログ -->
  <AppModal
    v-model="isResultDialogOpen"
    :title="syncResultData?.title || '処理結果'"
    icon="check-circle"
    variant="success"
    size="sm"
    @cancel="isResultDialogOpen = false"
  >
    <div v-if="syncResultData" class="c-site-settings__result-body">
      <!-- 差分再同期 (スマートマージ) の場合 -->
      <template v-if="syncResultData.type === 'merge'">
        <div class="c-site-settings__result-desc">
          Excelファイルとの差分同期が正常に完了しました。<br />
          Web上で入力された試験結果（Phase 1〜3）は安全に保持されています。
        </div>

        <div class="c-site-settings__result-stats">
          <div class="c-site-settings__result-stat-card c-site-settings__result-stat-card--add">
            <span class="c-site-settings__result-stat-label">追加された回路</span>
            <span class="c-site-settings__result-stat-val">
              +{{ syncResultData.createdCount ?? 0 }}<span class="c-site-settings__result-stat-unit">件</span>
            </span>
          </div>

          <div class="c-site-settings__result-stat-card c-site-settings__result-stat-card--update">
            <span class="c-site-settings__result-stat-label">基本情報変更</span>
            <span class="c-site-settings__result-stat-val">
              {{ syncResultData.updatedCount ?? 0 }}<span class="c-site-settings__result-stat-unit">件</span>
            </span>
          </div>

          <div class="c-site-settings__result-stat-card">
            <span class="c-site-settings__result-stat-label">全回路総数</span>
            <span class="c-site-settings__result-stat-val">
              {{ syncResultData.count }}<span class="c-site-settings__result-stat-unit">件</span>
            </span>
          </div>
        </div>

        <div class="c-site-settings__result-alert">
          <AppIcon name="check" size="sm" class="u-text-success" />
          <span>Web側の試験進捗・測定値データはそのまま維持されています。</span>
        </div>
      </template>

      <!-- 全件初期化取込の場合 -->
      <template v-else-if="syncResultData.type === 'reset'">
        <div class="c-site-settings__result-desc">
          Excelファイルから全回路データを初期化取り込みしました。
        </div>

        <div class="c-site-settings__result-stats c-site-settings__result-stats--single">
          <div class="c-site-settings__result-stat-card c-site-settings__result-stat-card--add">
            <span class="c-site-settings__result-stat-label">取込回路総数</span>
            <span class="c-site-settings__result-stat-val">
              {{ syncResultData.count }}<span class="c-site-settings__result-stat-unit">件</span>
            </span>
          </div>
        </div>

        <div class="c-site-settings__result-alert">
          <AppIcon name="check" size="sm" class="u-text-success" />
          <span>全回路データが初期化され、最新のExcel内容で登録されました。</span>
        </div>
      </template>

      <!-- Excel書戻しの場合 -->
      <template v-else-if="syncResultData.type === 'export'">
        <div class="c-site-settings__result-desc">
          Web上の最新試験結果（Phase 1〜3）をExcelファイルに書き戻しました。
        </div>

        <div class="c-site-settings__result-stats c-site-settings__result-stats--single">
          <div class="c-site-settings__result-stat-card c-site-settings__result-stat-card--info">
            <span class="c-site-settings__result-stat-label">書戻し回路数</span>
            <span class="c-site-settings__result-stat-val">
              {{ syncResultData.count }}<span class="c-site-settings__result-stat-unit">件</span>
            </span>
          </div>
        </div>

        <div class="c-site-settings__result-alert">
          <AppIcon name="check" size="sm" class="u-text-primary" />
          <span>Excelファイルへの上書き保存が正常に完了しました。</span>
        </div>
      </template>
    </div>

    <template #footer>
      <AppButton variant="primary" @click="isResultDialogOpen = false">
        OK
      </AppButton>
    </template>
  </AppModal>
</template>

<style lang="scss" scoped>
.c-site-settings {
  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-form-row-gap);
    min-height: 300px;
  }

  &__workers {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;

    min-height: 40px;
    padding: var(--space-2);

    @include border-base($opacity: 30%);
  }

  &__sync-cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__sync-item {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    justify-content: space-between;

    padding: var(--space-3);
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-md);

    background: var(--color-bg-surface-elevated);

    &--danger {
      border-color: rgb(239 68 68 / 30%);
    }
  }

  &__sync-info {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__sync-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__sync-desc {
    font-size: var(--font-size-xs);
    line-height: 1.4;
    color: var(--color-text-muted);
  }

  &__sync-status {
    display: flex;
    gap: var(--space-2);
    align-items: center;

    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);

    font-size: var(--font-size-xs);
    line-height: 1.4;

    &--loading {
      border: 1px solid hsl(var(--color-category-main-base) / 30%);
      color: var(--color-category-main);
      background: hsl(var(--color-category-main-base) / 10%);
    }

    &--error {
      border: 1px solid hsl(var(--color-status-danger-base) / 30%);
      color: var(--color-status-danger);
      background: hsl(var(--color-status-danger-base) / 10%);
    }
  }

  &__sync-result-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    padding: var(--space-3);
    border: 1px solid hsl(var(--color-status-success-base) / 30%);
    border-radius: var(--radius-md);

    background: hsl(var(--color-status-success-base) / 8%);
  }

  &__sync-result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__sync-result-tag {
    display: flex;
    gap: var(--space-2);
    align-items: center;

    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-status-success);
  }

  &__sync-badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    align-items: center;
  }

  &__stat-badge {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;

    padding: var(--space-1) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);

    font-size: var(--font-size-xs);
    color: var(--color-text-main);

    background: var(--surface-bg-elevated);

    strong {
      font-weight: 700;
      color: var(--color-text-main);
    }

    &--add {
      border-color: hsl(var(--color-status-success-base) / 40%);
      color: var(--color-status-success);

      strong {
        color: var(--color-status-success);
      }
    }

    &--update {
      border-color: hsl(var(--color-category-main-base) / 40%);
      color: var(--color-category-main);

      strong {
        color: var(--color-category-main);
      }
    }

    &--info {
      border-color: hsl(var(--color-category-tool-base) / 40%);
      color: var(--color-category-tool);

      strong {
        color: var(--color-category-tool);
      }
    }
  }

  &__sync-result-note {
    font-size: var(--font-size-xs);
    line-height: 1.4;
    color: var(--color-text-muted);
  }

  &__result-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-1) 0;
  }

  &__result-desc {
    font-size: var(--font-size-sm);
    line-height: 1.5;
    color: var(--color-text-main);
  }

  &__result-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-2);

    &--single {
      grid-template-columns: 1fr;
    }
  }

  &__result-stat-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    align-items: center;

    padding: var(--space-3) var(--space-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);

    text-align: center;

    background: var(--surface-bg-elevated);

    &--add {
      border-color: hsl(var(--color-status-success-base) / 50%);
      background: hsl(var(--color-status-success-base) / 8%);

      .c-site-settings__result-stat-val {
        color: var(--color-status-success);
      }
    }

    &--update {
      border-color: hsl(var(--color-category-main-base) / 50%);
      background: hsl(var(--color-category-main-base) / 8%);

      .c-site-settings__result-stat-val {
        color: var(--color-category-main);
      }
    }

    &--info {
      border-color: hsl(var(--color-category-tool-base) / 50%);
      background: hsl(var(--color-category-tool-base) / 8%);

      .c-site-settings__result-stat-val {
        color: var(--color-category-tool);
      }
    }
  }

  &__result-stat-label {
    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--color-text-muted);
  }

  &__result-stat-val {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    line-height: 1.1;
    color: var(--color-text-main);
  }

  &__result-stat-unit {
    margin-left: 2px;
    font-size: var(--font-size-xs);
    font-weight: 400;
    color: var(--color-text-muted);
  }

  &__result-alert {
    display: flex;
    gap: var(--space-2);
    align-items: center;

    padding: var(--space-2) var(--space-3);
    border: 1px solid hsl(var(--color-status-success-base) / 30%);
    border-radius: var(--radius-sm);

    font-size: var(--font-size-xs);
    line-height: 1.4;
    color: var(--color-text-main);

    background: hsl(var(--color-status-success-base) / 10%);
  }

  &__circuit-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  &__circuit-row {
    display: flex;
    gap: var(--space-1);
    align-items: center;

    > *:first-child {
      flex: 1;
    }
  }
}
</style>
