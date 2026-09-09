<script setup lang="ts">
/**
 * PortalSiteSyncTab
 * 現場設定モーダル - Excelデータベース連携・同期設定タブOrganismコンポーネント。
 * ファイルアップロード、PCローカルパス設定、差分同期/書戻し/初期化取込、および処理結果表示を管理します。
 */
import { ref } from 'vue'

import type { SyncResultInfo } from '~/composables/portal/useSiteSettingsForm'
import { useModal } from '~/composables/useModal'

const excelPath = defineModel<string>('excelPath', { default: '' })
const reportTemplatePath = defineModel<string>('reportTemplatePath', { default: '' })

const props = defineProps<{
  selectedFile: File | null
  showSyncMsg: boolean
  syncMsg: string
  syncMsgType: 'info' | 'success' | 'error'
  syncAction: string | null
  isSyncing: boolean
  syncResultData: SyncResultInfo | null
  onFileSelect: (file: File | null) => void
  onMergeSync: () => Promise<void>
  onResetImport: () => Promise<void>
  onExport: () => Promise<void>
  onDownloadExcel: () => Promise<void>
}>()

const { askConfirm } = useModal()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isResultDialogOpen = ref(false)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const onFileInputChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0] ?? null

  props.onFileSelect(file)
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
    props.onFileSelect(file)
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
    await props.onResetImport()
  }
}
</script>

<template>
  <div class="portal-site-sync-tab">
    <!-- 非表示ファイル入力 -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".xlsx,.xlsm,.xls"
      style="display: none"
      @change="onFileInputChange"
    >

    <!-- ファイル直接アップロード エリア -->
    <div class="portal-site-sync-tab__upload-section">
      <div class="portal-site-sync-tab__section-label">
        <AtomsIcon name="file-spreadsheet" size="sm" />
        <span>Excelファイルから直接取り込む</span>
      </div>

      <div
        class="portal-site-sync-tab__dropzone"
        :class="{ 'is-dragging': isDragging, 'has-file': !!selectedFile }"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop"
        @click="triggerFileInput"
      >
        <template v-if="!selectedFile">
          <AtomsIcon name="upload-cloud" size="lg" class="portal-site-sync-tab__dropzone-icon" />
          <div class="portal-site-sync-tab__dropzone-text">
            <strong>クリックしてファイルを選択</strong> またはここにドラッグ＆ドロップ
          </div>
          <div class="portal-site-sync-tab__dropzone-hint">
            対応形式: .xlsx, .xlsm
          </div>
        </template>
        <template v-else>
          <div class="portal-site-sync-tab__file-preview">
            <AtomsIcon name="file-check" size="md" class="u-text-success" />
            <div class="portal-site-sync-tab__file-info">
              <div class="portal-site-sync-tab__file-name">
                {{ selectedFile.name }}
              </div>
              <div class="portal-site-sync-tab__file-size">
                {{ formatFileSize(selectedFile.size) }}
              </div>
            </div>
            <MoleculesIconButton
              name="x"
              variant="secondary"
              size="sm"
              title="選択を解除"
              @click.stop="onFileSelect(null)"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- PCローカル絶対パス設定 (高度な設定・後方互換用) -->
    <details class="portal-site-sync-tab__advanced-details">
      <summary class="portal-site-sync-tab__advanced-summary">
        <AtomsIcon name="folder" size="sm" />
        <span>PCローカル絶対パス連携 (任意)</span>
      </summary>
      <div class="portal-site-sync-tab__advanced-content">
        <MoleculesFormGroup label="Excel連携ファイル保存先 (絶対パス)">
          <AtomsInput
            v-model="excelPath"
            placeholder="例: D:\Data\site_a.xlsm"
          />
        </MoleculesFormGroup>
        <MoleculesFormGroup label="帳票テンプレート保存先 (絶対パス)">
          <AtomsInput
            v-model="reportTemplatePath"
            placeholder="例: D:\Templates\report.xlsx"
          />
        </MoleculesFormGroup>
      </div>
    </details>

    <AtomsPanel>
      <MoleculesSectionHeader title="データベース連携（Excel同期・エクスポート）" />
      <ul class="portal-site-sync-tab__sync-list">
        <!-- 差分再同期 (スマートマージ) -->
        <li class="portal-site-sync-tab__sync-item">
          <div class="portal-site-sync-tab__sync-info">
            <h4 class="portal-site-sync-tab__sync-title">
              {{ selectedFile ? '選択ファイルから差分同期 (スマートマージ)' : 'Excelから差分再同期 (スマートマージ)' }}
            </h4>
            <p class="portal-site-sync-tab__sync-desc">
              Web上の試験結果（Phase 1〜3）を保持したまま、Excelで追加された回路や基本情報の変更のみを安全に同期します。
            </p>
          </div>
          <AtomsButton
            variant="primary"
            icon="refresh-cw"
            :loading="syncAction === 'merge'"
            :disabled="isSyncing"
            @click="onMergeSync"
          >
            {{ selectedFile ? '選択ファイルから差分同期' : '差分再同期' }}
          </AtomsButton>
        </li>

        <!-- Excel帳票ダウンロード (Web標準) -->
        <li class="portal-site-sync-tab__sync-item">
          <div class="portal-site-sync-tab__sync-info">
            <h4 class="portal-site-sync-tab__sync-title">
              Excel帳票ダウンロード (ブラウザDL)
            </h4>
            <p class="portal-site-sync-tab__sync-desc">
              Web上で入力・完了した最新の試験結果（Phase 1〜3）を含むExcel帳票ファイルをブラウザへ直接ダウンロードします。
            </p>
          </div>
          <AtomsButton
            variant="secondary"
            icon="download"
            :loading="syncAction === 'download'"
            :disabled="isSyncing"
            @click="onDownloadExcel"
          >
            帳票ダウンロード
          </AtomsButton>
        </li>

        <!-- PCローカルExcelへ書戻し (実エクスポート) -->
        <li
          v-if="excelPath"
          class="portal-site-sync-tab__sync-item"
        >
          <div class="portal-site-sync-tab__sync-info">
            <h4 class="portal-site-sync-tab__sync-title">
              PCローカルExcelへ書戻し (直接上書き)
            </h4>
            <p class="portal-site-sync-tab__sync-desc">
              指定されたPCローカルのExcelファイルに最新試験結果を直接上書き保存します。
            </p>
          </div>
          <AtomsButton
            variant="secondary"
            icon="upload"
            :loading="syncAction === 'export'"
            :disabled="isSyncing"
            @click="onExport"
          >
            指定パスへ書戻し
          </AtomsButton>
        </li>

        <!-- 全件初期化取込 (完全リセット) -->
        <li class="portal-site-sync-tab__sync-item portal-site-sync-tab__sync-item--danger">
          <div class="portal-site-sync-tab__sync-info">
            <h4 class="portal-site-sync-tab__sync-title">
              {{ selectedFile ? '選択ファイルで全件初期化取込' : '全件取込 (完全初期化)' }}
            </h4>
            <p class="portal-site-sync-tab__sync-desc">
              Web上の試験結果を含むすべてのデータを破棄し、Excelからまっさらに最初から作り直します（現場初期設定用）。
            </p>
          </div>
          <AtomsButton
            variant="danger"
            icon="trash-2"
            :loading="syncAction === 'reset'"
            :disabled="isSyncing"
            @click="confirmResetImport"
          >
            {{ selectedFile ? '選択ファイルで初期化取込' : '全件初期化取込' }}
          </AtomsButton>
        </li>
      </ul>

      <!-- 実行中ステータス表示 -->
      <div
        v-if="isSyncing"
        class="portal-site-sync-tab__sync-status portal-site-sync-tab__sync-status--loading"
      >
        <AtomsIcon name="loader" size="sm" class="u-spin" />
        <span>{{ syncMsg }}</span>
      </div>

      <!-- エラー発生時の表示 -->
      <div
        v-else-if="showSyncMsg && syncMsgType === 'error'"
        class="portal-site-sync-tab__sync-status portal-site-sync-tab__sync-status--error"
      >
        <AtomsIcon name="alert-circle" size="sm" />
        <span>{{ syncMsg }}</span>
      </div>

      <!-- 完了時のインライン件数サマリー表示 (MoleculesResultBox & AtomsBadge) -->
      <MoleculesResultBox
        v-else-if="syncResultData"
        status="success"
        :title="syncResultData.title"
      >
        <template #actions>
          <AtomsButton
            variant="secondary"
            size="sm"
            @click="isResultDialogOpen = true"
          >
            詳細を表示
          </AtomsButton>
        </template>

        <template #value>
          <div class="portal-site-sync-tab__result-badges">
            <template v-if="syncResultData.type === 'merge'">
              <AtomsBadge color="var(--color-status-success)">
                追加: +{{ syncResultData.createdCount ?? 0 }} 件
              </AtomsBadge>
              <AtomsBadge color="var(--color-category-tool)">
                変更: {{ syncResultData.updatedCount ?? 0 }} 件
              </AtomsBadge>
              <AtomsBadge color="var(--color-text-muted)">
                全回路数: {{ syncResultData.count }} 件
              </AtomsBadge>
            </template>
            <template v-else-if="syncResultData.type === 'reset'">
              <AtomsBadge color="var(--color-status-success)">
                取込総数: {{ syncResultData.count }} 件
              </AtomsBadge>
            </template>
            <template v-else-if="syncResultData.type === 'export'">
              <AtomsBadge color="var(--color-category-tool)">
                書戻し完了: {{ syncResultData.count }} 件
              </AtomsBadge>
            </template>
          </div>
        </template>
      </MoleculesResultBox>
    </AtomsPanel>

    <!-- 処理完了・件数確認モーダルダイアログ -->
    <OrganismsModal
      v-model="isResultDialogOpen"
      :title="syncResultData?.title || '処理結果'"
      icon="check-circle"
      variant="success"
      size="sm"
      @cancel="isResultDialogOpen = false"
    >
      <div v-if="syncResultData" class="portal-site-sync-tab__result-dialog-body">
        <div class="portal-site-sync-tab__result-desc">
          {{ syncResultData.title }}が正常に完了しました。
        </div>

        <div class="portal-site-sync-tab__result-badges">
          <AtomsBadge v-if="syncResultData.createdCount !== undefined" color="var(--color-status-success)">
            追加: +{{ syncResultData.createdCount }} 件
          </AtomsBadge>
          <AtomsBadge v-if="syncResultData.updatedCount !== undefined" color="var(--color-category-tool)">
            基本情報変更: {{ syncResultData.updatedCount }} 件
          </AtomsBadge>
          <AtomsBadge color="var(--color-text-muted)">
            全回路総数: {{ syncResultData.count }} 件
          </AtomsBadge>
        </div>
      </div>
    </OrganismsModal>
  </div>
</template>

<style scoped lang="scss">
.portal-site-sync-tab {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

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
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__dropzone {
    cursor: pointer;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    padding: var(--space-6);
    border: 2px dashed var(--color-border);
    border-radius: var(--radius-md);

    background-color: var(--color-bg-subtle);

    transition: var(--transition-base);

    &:hover,
    &.is-dragging {
      border-color: var(--color-category-main);
      background-color: color-mix(in srgb, var(--color-category-main) 5%, var(--color-bg-subtle));
    }

    &.has-file {
      border-color: var(--color-status-success);
      border-style: solid;
    }
  }

  &__dropzone-icon {
    margin-bottom: var(--space-2);
    color: var(--color-text-muted);
  }

  &__dropzone-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-main);
  }

  &__dropzone-hint {
    margin-top: var(--space-1);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  &__file-preview {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    width: 100%;
  }

  &__file-info {
    flex: 1;
    min-width: 0;
  }

  &__file-name {
    overflow: hidden;

    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__file-size {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }

  &__advanced-details {
    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
  }

  &__advanced-summary {
    cursor: pointer;

    display: flex;
    gap: var(--space-2);
    align-items: center;

    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
  }

  &__advanced-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-top: var(--space-3);
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
    gap: var(--space-4);
    align-items: center;
    justify-content: space-between;

    padding: var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);

    &--danger {
      border-color: color-mix(in srgb, var(--color-status-danger) 40%, transparent);
      background-color: color-mix(in srgb, var(--color-status-danger) 5%, transparent);
    }
  }

  &__sync-title {
    margin: 0 0 var(--space-1) 0;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__sync-desc {
    margin: 0;
    font-size: var(--font-size-xs);
    line-height: var(--leading-relaxed);
    color: var(--color-text-muted);
  }

  &__sync-status {
    display: flex;
    gap: var(--space-2);
    align-items: center;

    padding: var(--space-3);
    border-radius: var(--radius-sm);

    font-size: var(--font-size-sm);

    &--loading {
      color: var(--color-category-main);
      background-color: color-mix(in srgb, var(--color-category-main) 10%, transparent);
    }

    &--error {
      color: var(--color-status-danger);
      background-color: color-mix(in srgb, var(--color-status-danger) 10%, transparent);
    }
  }

  &__result-badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  &__result-dialog-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  &__result-desc {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
  }
}
</style>
