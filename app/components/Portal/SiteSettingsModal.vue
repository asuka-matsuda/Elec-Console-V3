<script setup lang="ts">
import { ref, toRef } from 'vue'

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
  selectedFile,
  handleFileSelect,
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
  handleDownloadExcel,
} = useSiteSettingsForm({
  site: toRef(props, 'site'),
  isOpen,
  onSave: payload => emit('update:site', payload),
})

const { askConfirm } = useModal()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const onFileInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0] ?? null

  handleFileSelect(file)
}

const onDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = true
}

const onDragLeave = () => {
  isDragging.value = false
}

const onDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragging.value = false

  const file = e.dataTransfer?.files?.[0]

  if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm') || file.name.endsWith('.xls'))) {
    handleFileSelect(file)
  }
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

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
        <!-- 非表示ファイル入力 -->
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx,.xlsm,.xls"
          style="display: none"
          @change="onFileInputChange"
        >

        <!-- ファイル直接アップロード エリア -->
        <div class="c-site-settings__upload-section">
          <div class="c-site-settings__section-label">
            <AppIcon name="file-spreadsheet" size="sm" />
            <span>Excelファイルから直接取り込む</span>
          </div>

          <div
            class="c-site-settings__dropzone"
            :class="{ 'is-dragging': isDragging, 'has-file': !!selectedFile }"
            @dragover="onDragOver"
            @dragleave="onDragLeave"
            @drop="onDrop"
            @click="triggerFileInput"
          >
            <template v-if="!selectedFile">
              <AppIcon name="upload-cloud" size="lg" class="c-site-settings__dropzone-icon" />
              <div class="c-site-settings__dropzone-text">
                <strong>クリックしてファイルを選択</strong> またはここにドラッグ＆ドロップ
              </div>
              <div class="c-site-settings__dropzone-hint">
                対応形式: .xlsx, .xlsm
              </div>
            </template>
            <template v-else>
              <div class="c-site-settings__file-preview">
                <AppIcon name="file-check" size="md" class="u-text-success" />
                <div class="c-site-settings__file-info">
                  <div class="c-site-settings__file-name">
                    {{ selectedFile.name }}
                  </div>
                  <div class="c-site-settings__file-size">
                    {{ formatFileSize(selectedFile.size) }}
                  </div>
                </div>
                <AppButton
                  variant="secondary"
                  size="sm"
                  title="選択を解除"
                  @click.stop="handleFileSelect(null)"
                >
                  <AppIcon name="x" size="sm" />
                </AppButton>
              </div>
            </template>
          </div>
        </div>

        <!-- PCローカル絶対パス設定 (高度な設定・後方互換用) -->
        <details class="c-site-settings__advanced-details">
          <summary class="c-site-settings__advanced-summary">
            <AppIcon name="folder" size="sm" />
            <span>PCローカル絶対パス連携 (任意)</span>
          </summary>
          <div class="c-site-settings__advanced-content">
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
          </div>
        </details>

        <AppPanel>
          <AppSectionHeader title="データベース連携（Excel同期・エクスポート）" />
          <ul class="c-site-settings__sync-list">
            <!-- 差分再同期 (スマートマージ) -->
            <li class="c-site-settings__sync-item">
              <div class="c-site-settings__sync-info">
                <h4 class="c-site-settings__sync-title">
                  {{ selectedFile ? '選択ファイルから差分同期 (スマートマージ)' : 'Excelから差分再同期 (スマートマージ)' }}
                </h4>
                <p class="c-site-settings__sync-desc">
                  Web上の試験結果（Phase 1〜3）を保持したまま、Excelで追加された回路や基本情報の変更のみを安全に同期します。
                </p>
              </div>
              <AppButton
                variant="primary"
                icon="refresh-cw"
                :loading="syncAction === 'merge'"
                :disabled="isSyncing"
                @click="handleMergeSync"
              >
                {{ selectedFile ? '選択ファイルから差分同期' : '差分再同期' }}
              </AppButton>
            </li>

            <!-- Excel帳票ダウンロード (Web標準) -->
            <li class="c-site-settings__sync-item">
              <div class="c-site-settings__sync-info">
                <h4 class="c-site-settings__sync-title">
                  Excel帳票ダウンロード (ブラウザDL)
                </h4>
                <p class="c-site-settings__sync-desc">
                  Web上で入力・完了した最新の試験結果（Phase 1〜3）を含むExcel帳票ファイルをブラウザへ直接ダウンロードします。
                </p>
              </div>
              <AppButton
                variant="secondary"
                icon="download"
                :loading="syncAction === 'download'"
                :disabled="isSyncing"
                @click="handleDownloadExcel"
              >
                帳票ダウンロード
              </AppButton>
            </li>

            <!-- PCローカルExcelへ書戻し (実エクスポート) -->
            <li
              v-if="editData.excelPath"
              class="c-site-settings__sync-item"
            >
              <div class="c-site-settings__sync-info">
                <h4 class="c-site-settings__sync-title">
                  PCローカルExcelへ書戻し (直接上書き)
                </h4>
                <p class="c-site-settings__sync-desc">
                  指定されたPCローカルのExcelファイルに最新試験結果を直接上書き保存します。
                </p>
              </div>
              <AppButton
                variant="secondary"
                icon="upload"
                :loading="syncAction === 'export'"
                :disabled="isSyncing"
                @click="handleExport"
              >
                指定パスへ書戻し
              </AppButton>
            </li>

            <!-- 全件初期化取込 (完全リセット) -->
            <li class="c-site-settings__sync-item c-site-settings__sync-item--danger">
              <div class="c-site-settings__sync-info">
                <h4 class="c-site-settings__sync-title">
                  {{ selectedFile ? '選択ファイルで全件初期化取込' : '全件取込 (完全初期化)' }}
                </h4>
                <p class="c-site-settings__sync-desc">
                  Web上の試験結果を含むすべてのデータを破棄し、Excelからまっさらに最初から作り直します（現場初期設定用）。
                </p>
              </div>
              <AppButton
                variant="danger"
                icon="trash-2"
                :loading="syncAction === 'reset'"
                :disabled="isSyncing"
                @click="confirmResetImport"
              >
                {{ selectedFile ? '選択ファイルで初期化取込' : '全件初期化取込' }}
              </AppButton>
            </li>
          </ul>

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
            class="c-site-settings__sync-result-box"
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
          <div class="c-site-settings__circuit-container">
            <ul v-if="excludedCircuitsList.length > 0" class="c-site-settings__circuit-list">
              <li
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
              </li>
            </ul>
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
          <div class="c-site-settings__result-stat-box c-site-settings__result-stat-box--add">
            <span class="c-site-settings__result-stat-label">追加された回路</span>
            <span class="c-site-settings__result-stat-val">
              +{{ syncResultData.createdCount ?? 0 }}<span class="c-site-settings__result-stat-unit">件</span>
            </span>
          </div>

          <div class="c-site-settings__result-stat-box c-site-settings__result-stat-box--update">
            <span class="c-site-settings__result-stat-label">基本情報変更</span>
            <span class="c-site-settings__result-stat-val">
              {{ syncResultData.updatedCount ?? 0 }}<span class="c-site-settings__result-stat-unit">件</span>
            </span>
          </div>

          <div class="c-site-settings__result-stat-box">
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
          <div class="c-site-settings__result-stat-box c-site-settings__result-stat-box--add">
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
          <div class="c-site-settings__result-stat-box c-site-settings__result-stat-box--info">
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
    border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
    border-radius: var(--radius-sm);
  }

  &__sync-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);

    margin: 0;
    padding: 0;

    list-style: none;
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
    margin: 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  &__sync-desc {
    margin: 0;
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

  &__sync-result-box {
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

  &__result-stat-box {
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
    display: inline-flex;
    gap: 2px;
    align-items: baseline;

font-size: var(--font-size-2xl);
    font-weight: 700;
    line-height: 1.1;
    color: var(--color-text-main);
  }

  &__result-stat-unit {
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

  &__circuit-container {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__circuit-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);

    margin: 0;
    padding: 0;

    list-style: none;
  }

  &__circuit-row {
    display: flex;
    gap: var(--space-1);
    align-items: center;

    > *:first-child {
      flex: 1;
    }
  }

  &__upload-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__section-label {
    display: flex;
    gap: var(--space-2);
    align-items: center;

    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-main);
  }

  &__dropzone {
    cursor: pointer;

    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    align-items: center;
    justify-content: center;

    padding: var(--space-4) var(--space-3);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);

    text-align: center;

    background: var(--color-bg-surface-elevated);

    transition: all 0.2s ease;

    &:hover,
    &.is-dragging {
      border-color: var(--color-category-main, #3b82f6);
      background: color-mix(in srgb, var(--color-category-main, #3b82f6) 8%, var(--color-bg-surface-elevated));
    }

    &.has-file {
      border-color: color-mix(in srgb, var(--color-status-success) 40%, var(--color-border));
      border-style: solid;
      background: color-mix(in srgb, var(--color-status-success) 5%, var(--color-bg-surface-elevated));
    }
  }

  &__dropzone-icon {
    color: var(--color-text-muted);
  }

  &__dropzone-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-main);

    strong {
      color: var(--color-category-main, #3b82f6);
    }
  }

  &__dropzone-hint {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  &__file-preview {
    display: flex;
    gap: var(--space-3);
    align-items: center;

    width: 100%;
    max-width: 450px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid color-mix(in srgb, var(--color-status-success) 30%, transparent);
    border-radius: var(--radius-sm);

    background: color-mix(in srgb, var(--color-status-success) 10%, transparent);
  }

  &__file-info {
    display: flex;
    flex: 1;
    flex-direction: column;

    min-width: 0;

    text-align: left;
  }

  &__file-name {
    overflow: hidden;

    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-main);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__file-size {
    font-family: var(--font-mono);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  &__advanced-details {
    margin: var(--space-1) 0;
    border: 1px solid var(--color-border-subtle);
    border-radius: var(--radius-sm);
    background: var(--color-bg-surface);
  }

  &__advanced-summary {
    cursor: pointer;
    user-select: none;

    display: flex;
    gap: var(--space-2);
    align-items: center;

    padding: var(--space-2) var(--space-3);

    font-size: var(--font-size-xs);
    font-weight: 500;
    color: var(--color-text-muted);

    &:hover {
      color: var(--color-text-main);
    }
  }

  &__advanced-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);

    padding: var(--space-2) var(--space-3) var(--space-3);
    border-top: 1px dashed var(--color-border-subtle);
  }
}
</style>
