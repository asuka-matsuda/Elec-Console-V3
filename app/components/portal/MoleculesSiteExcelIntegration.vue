<script setup lang="ts">
/**
 * MoleculesSiteExcelIntegration
 * [Portal Molecules] 現場管理のExcelデータ連携セクション。
 * Excelファイルのアップロードによる差分同期・全件初期化取込、最新帳票のダウンロード、
 * および処理結果・ステータス表示を提供します。
 */
import type { SyncResultInfo } from '~/composables/portal/useSiteSettingsForm'
import { useModal } from '~/composables/useModal'

defineProps<{
  selectedFile: File | null
  isSyncing: boolean
  syncAction: string | null
  showSyncMsg: boolean
  syncMsg: string
  syncMsgType: 'info' | 'success' | 'error'
  syncResultData: SyncResultInfo | null
}>()

const emit = defineEmits<{
  'file-select': [file: File | null]
  'merge-sync': []
  'reset-import': []
  'download-excel': []
  'show-result-detail': []
}>()

const { askConfirm } = useModal()

const confirmResetImport = async () => {
  const isConfirmed = await askConfirm({
    title: '全件初期化取込の確認',
    message: '現在の回路データおよびWeb上で入力された試験結果がすべて破棄され、選択したExcelの内容で最初から再構築されます。本当に実行しますか？',
    confirmText: '全件初期化して取り込む',
    intent: 'danger',
  })

  if (isConfirmed) {
    emit('reset-import')
  }
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- 取込セクション -->
    <div class="flex flex-col gap-3">
      <MoleculesSectionHeader
        title="Excelデータ取込 (差分同期 / 初期設定)"
        icon="upload-cloud"
        size="sm"
      />
      <p class="desc-text m-0">
        回路情報・現場基本情報の更新は「差分同期」、新規立ち上げ時は「全件初期化取込」を行います。
      </p>

      <PortalAtomsExcelDropzone
        :model-value="selectedFile"
        :disabled="isSyncing"
        @update:model-value="emit('file-select', $event)"
      />

      <div class="flex flex-wrap items-center gap-3 mt-1">
        <Button
          icon="refresh-cw"
          :loading="syncAction === 'merge'"
          :disabled="!selectedFile || isSyncing"
          @click="emit('merge-sync')"
        >
          {{ selectedFile ? '選択ファイルから差分同期' : 'ファイルを選択して差分同期' }}
        </Button>

        <Button
          variant="danger"
          icon="trash-2"
          :loading="syncAction === 'reset'"
          :disabled="!selectedFile || isSyncing"
          @click="confirmResetImport"
        >
          全件初期化取込
        </Button>
      </div>
    </div>

    <!-- 出力セクション -->
    <div class="flex flex-col gap-3">
      <MoleculesSectionHeader
        title="最新結果の帳票出力"
        icon="file-spreadsheet"
        size="sm"
      />
      <p class="desc-text m-0">
        Web上で完了した最新の試験結果（Phase 1〜3）を含むExcel帳票ファイルをダウンロードします。
      </p>

      <div>
        <Button
          icon="download"
          :loading="syncAction === 'download'"
          :disabled="isSyncing"
          @click="emit('download-excel')"
        >
          Excel帳票ダウンロード (ブラウザDL)
        </Button>
      </div>
    </div>

    <!-- 実行中ステータス表示 -->
    <div
      v-if="isSyncing"
      class="status-msg is-info flex items-center gap-2 p-3"
    >
      <AtomsIcon name="loader" size="sm" class="u-spin" />
      <span>{{ syncMsg }}</span>
    </div>

    <!-- エラー発生時の表示 -->
    <div
      v-else-if="showSyncMsg && syncMsgType === 'error'"
      class="status-msg is-error flex items-center gap-2 p-3"
    >
      <AtomsIcon name="alert-circle" size="sm" />
      <span>{{ syncMsg }}</span>
    </div>

    <!-- 完了時のインライン件数サマリー表示 (MoleculesResultBox) -->
    <MoleculesResultBox
      v-else-if="syncResultData"
      status="success"
      :title="syncResultData.title"
    >
      <template #actions>
        <Button
          @click="emit('show-result-detail')"
        >
          詳細を表示
        </Button>
      </template>

      <template #value>
        <div class="flex flex-wrap items-center gap-2 mt-2">
          <template v-if="syncResultData.type === 'merge'">
            <Badge id="sync:added">
              追加: +{{ syncResultData.createdCount ?? 0 }} 件
            </Badge>
            <Badge id="sync:updated">
              変更: {{ syncResultData.updatedCount ?? 0 }} 件
            </Badge>
            <span class="sync-total-count">
              全回路数: {{ syncResultData.count }} 件
            </span>
          </template>
          <template v-else-if="syncResultData.type === 'reset'">
            <Badge id="sync:imported">
              取込総数: {{ syncResultData.count }} 件
            </Badge>
          </template>
        </div>
      </template>
    </MoleculesResultBox>
  </div>
</template>

<style scoped lang="scss">
.desc-text {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}

.status-msg {
  font-size: var(--font-size-sm);

  &.is-info {
    color: var(--color-category-main);
    background: color-mix(in srgb, var(--color-category-main) 10%, transparent);
  }

  &.is-error {
    color: var(--color-status-danger);
    background: color-mix(in srgb, var(--color-status-danger) 10%, transparent);
  }
}

.sync-total-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
