<script setup lang="ts">
/**
 * TabSiteExcelIntegration
 * [Portal Organisms] 現場管理のExcelデータ連携セクション。
 * Excelファイルのアップロードによる差分同期・全件初期化取込、最新帳票のダウンロード、
 * および処理結果・ステータス表示を提供します。
 */
import { computed, toRef } from 'vue'

import type { Site } from '#shared/types/site'
import { useSiteExcelSync } from '~/composables/portal/useSiteExcelSync'

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
  <div class="flex flex-col gap-section-gap">

    <div class="flex flex-col gap-panel-gap">
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

      <div class="flex flex-wrap items-center gap-item-gap">
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

    <div class="flex flex-col gap-panel-gap">
      <SectionHeader
        title="最新結果の帳票出力"
        icon="file-spreadsheet"
        tag="h4"
      />
      <small class="m-0">
        Web上で完了した最新の試験結果（Phase 1〜3）を含むExcel帳票ファイルをダウンロードします。
      </small>

      <div class="flex flex-col gap-inline-gap">
        <Button
          icon="download"
          :loading="syncAction === 'download'"
          :disabled="isSyncing || !hasExcelPath"
          class="w-fit"
          @click="handleDownloadExcel"
        >
          Excel帳票ダウンロード (ブラウザDL)
        </Button>
        <small v-if="!hasExcelPath" class="m-0">
          ※ 現場設定にExcel台帳ファイルが登録されていないため、ダウンロードできません
        </small>
      </div>
    </div>

    <Alert
      v-if="isSyncing"
      variant="info"
      icon="loader"
    >
      {{ syncMsg }}
    </Alert>

    <Alert
      v-else-if="showSyncMsg && syncMsgType === 'error'"
      variant="danger"
    >
      {{ syncMsg }}
    </Alert>

    <ResultPanel
      v-else-if="syncResultData"
      status="success"
      :title="syncResultData.title"
    >
      <div class="flex flex-wrap items-center gap-item-gap">
        <template v-if="syncResultData.type === 'merge'">
          <Badge id="sync:added">
            追加: +{{ syncResultData.createdCount ?? 0 }} 件
          </Badge>
          <Badge id="sync:updated">
            変更: {{ syncResultData.updatedCount ?? 0 }} 件
          </Badge>
          <small>
            全回路数: {{ syncResultData.count }} 件
          </small>
        </template>
        <template v-else-if="syncResultData.type === 'reset'">
          <Badge id="sync:imported">
            取込総数: {{ syncResultData.count }} 件
          </Badge>
        </template>
      </div>
    </ResultPanel>
  </div>
</template>
