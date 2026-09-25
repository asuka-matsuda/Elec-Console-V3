<script setup lang="ts">
/**
 * TabSiteExcelIntegration
 * [Portal Organisms] 現場管理のExcelデータ連携セクション。
 * Excelファイルのアップロードによる差分同期・全件初期化取込、最新帳票のダウンロード、
 * および処理結果・ステータス表示を提供します。
 */
import { computed, toRef } from 'vue'

import { useSiteExcelSync } from '~/composables/portal/useSiteExcelSync'
import type { Site } from '~/types/admin'

const props = defineProps<{
  site: Site
}>()

const hasExcelPath = computed(() =>
  Boolean((props.site.excelPath || (props.site as unknown as { settings?: { excelPath?: string } }).settings?.excelPath)?.trim()),
)

const {
  selectedFile,
  isSyncing,
  syncAction,
  showSyncMsg,
  syncMsg,
  syncMsgType,
  syncResultData,
  handleFileSelect,
  handleMergeSync,
  handleResetImport,
  handleDownloadExcel,
} = useSiteExcelSync({
  site: toRef(props, 'site'),
})
</script>

<template>
  <div class="flex flex-col gap-6">

    <div class="flex flex-col gap-3">
      <SectionHeader
        title="Excelデータ取込 (差分同期 / 初期設定)"
        icon="upload-cloud"
        tag="h4"
      />
      <p class="desc-text m-0">
        回路情報・現場基本情報の更新は「差分同期」、新規立ち上げ時は「全件初期化取込」を行います。
      </p>

      <PortalExcelDropzone
        :model-value="selectedFile"
        :disabled="isSyncing"
        @update:model-value="handleFileSelect"
      />

      <div class="flex flex-wrap items-center gap-3 mt-1">
        <Button
          icon="refresh-cw"
          :loading="syncAction === 'merge'"
          :disabled="!selectedFile || isSyncing"
          @click="handleMergeSync"
        >
          {{ selectedFile ? '選択ファイルから差分同期' : 'ファイルを選択して差分同期' }}
        </Button>

        <Button
          variant="danger"
          icon="trash-2"
          :loading="syncAction === 'reset'"
          :disabled="!selectedFile || isSyncing"
          @click="handleResetImport"
        >
          全件初期化取込
        </Button>
      </div>
    </div>

    <div class="flex flex-col gap-3">
      <SectionHeader
        title="最新結果の帳票出力"
        icon="file-spreadsheet"
        tag="h4"
      />
      <p class="desc-text m-0">
        Web上で完了した最新の試験結果（Phase 1〜3）を含むExcel帳票ファイルをダウンロードします。
      </p>

      <div class="flex flex-col gap-1.5">
        <Button
          icon="download"
          :loading="syncAction === 'download'"
          :disabled="isSyncing || !hasExcelPath"
          class="w-fit"
          @click="handleDownloadExcel"
        >
          Excel帳票ダウンロード (ブラウザDL)
        </Button>
        <p v-if="!hasExcelPath" class="desc-text m-0">
          ※ 現場設定にExcel台帳ファイルが登録されていないため、ダウンロードできません
        </p>
      </div>
    </div>

    <div
      v-if="isSyncing"
      class="status-msg is-info flex items-center gap-2 p-3"
    >
      <Icon name="loader" size="sm" spin />
      <span>{{ syncMsg }}</span>
    </div>

    <div
      v-else-if="showSyncMsg && syncMsgType === 'error'"
      class="status-msg is-error flex items-center gap-2 p-3"
    >
      <Icon name="alert-circle" size="sm" />
      <span>{{ syncMsg }}</span>
    </div>

    <ResultPanel
      v-else-if="syncResultData"
      status="success"
      :title="syncResultData.title"
    >
      <div class="flex flex-wrap items-center gap-2 mt-2">
        <template v-if="syncResultData.type === 'merge'">
          <Badge>
            追加: +{{ syncResultData.createdCount ?? 0 }} 件
          </Badge>
          <Badge>
            変更: {{ syncResultData.updatedCount ?? 0 }} 件
          </Badge>
          <span class="sync-total-count">
            全回路数: {{ syncResultData.count }} 件
          </span>
        </template>
        <template v-else-if="syncResultData.type === 'reset'">
          <Badge>
            取込総数: {{ syncResultData.count }} 件
          </Badge>
        </template>
      </div>
    </ResultPanel>
  </div>
</template>

<style scoped>
.desc-text {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}

.status-msg {
  font-size: var(--font-size-sm);
}

.status-msg.is-info {
  color: var(--color-category-main);
  background: color-mix(in srgb, var(--color-category-main) 10%, transparent);
}

.status-msg.is-error {
  color: var(--color-status-danger);
  background: color-mix(in srgb, var(--color-status-danger) 10%, transparent);
}

.sync-total-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
