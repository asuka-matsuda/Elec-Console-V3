<script setup lang="ts">
/**
 * SiteSettingsDetail
 * [Portal Organisms] 現場管理の右ペイン（詳細設定コンソール）
 * 選択された現場の基本情報、Excelデータ連携、除外回路ルールを統合提供します。
 */
import { ref } from 'vue'

import { useSiteSettingsForm } from '~/composables/portal/useSiteSettingsForm'
import { SITE_SETTINGS_TABS } from '~/constants/adminConstants'
import type { Site } from '~/types/admin'

const props = defineProps<{
  site: Site | null
  isSaving?: boolean
}>()

const emit = defineEmits<{
  save: [payload: Site]
}>()

const {
  editData,
  editStatus,
  editId,
  excludedCircuitsList,
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
  handleMergeSync,
  handleResetImport,
  handleDownloadExcel,
} = useSiteSettingsForm({
  site: () => props.site,
  onSave: (payload) => {
    emit('save', payload)
  },
})

const activeTab = ref('basic')
</script>

<template>
  <div class="flex flex-col gap-6 w-full">
    <!-- 現場未選択時の空状態表示 -->
    <EmptyState
      v-if="!site"
      icon="layout"
      title="現場が選択されていません"
      description="左側の現場一覧から、設定やデータ連携を行う現場を選択してください。"
      class="placeholder-empty min-h-[400px] flex items-center justify-center"
    />

    <!-- 現場選択時の設定コンソール -->
    <template v-else>
      <!-- 上部ヘッダー: 現場名 + ステータス + 保存ボタン -->
      <SectionHeader icon="settings">
        <template #default>
          <div class="flex items-baseline gap-2">
            <span>{{ site.name }}</span>
            <span class="site-id">
              (ID: {{ site.id }})
            </span>
          </div>
        </template>

        <template #actions>
          <Button
            variant="success"
            icon="save"
            :loading="isSaving"
            @click="handleSave"
          >
            変更を保存
          </Button>
        </template>
      </SectionHeader>

      <!-- 設定カテゴリタブ -->
      <Tabs
        v-model="activeTab"
        :options="SITE_SETTINGS_TABS"
      >
        <!-- 1. 基本情報設定（インライン統合） -->
        <template #basic>
          <div class="flex flex-col gap-5 max-w-xl">
            <SectionHeader
              title="現場基本情報"
              icon="info"
              tag="h4"
            />

            <FormGroup label="ステータス">
              <Select
                v-model="editStatus"
                :options="statusOptions"
              />
            </FormGroup>

            <FormGroup label="現場ID (半角英数)">
              <Input
                v-model="editId"
                placeholder="例: site-tokyo-01"
              />
            </FormGroup>

            <FormGroup label="現場名">
              <Input
                v-model="editData.name"
                placeholder="例: 新宿プロジェクト"
              />
            </FormGroup>

            <FormGroup label="アサイン済作業者">
              <div
                v-if="workerNames.length > 0"
                class="flex flex-wrap items-center gap-2"
              >
                <Badge
                  v-for="worker in workerNames"
                  :key="worker"
                >
                  {{ worker }}
                </Badge>
              </div>
              <EmptyState
                v-else
                icon="users"
                title="アサインされている作業者はいません"
                description="ユーザー管理画面から作業者をアサインしてください。"
              />
            </FormGroup>
          </div>
        </template>

        <!-- 2. Excelデータ連携 (取込 & 帳票DL) -->
        <template #integration>
          <PortalSiteExcelIntegration
            :selected-file="selectedFile"
            :is-syncing="isSyncing"
            :sync-action="syncAction"
            :show-sync-msg="showSyncMsg"
            :sync-msg="syncMsg"
            :sync-msg-type="syncMsgType"
            :sync-result-data="syncResultData"
            @file-select="handleFileSelect"
            @merge-sync="handleMergeSync"
            @reset-import="handleResetImport"
            @download-excel="handleDownloadExcel"
          />
        </template>

        <!-- 3. 除外回路ルール設定 -->
        <template #rules>
          <PortalSiteExcludedRules
            :model-value="excludedCircuitsList"
            @update:model-value="excludedCircuitsList = $event"
          />
        </template>
      </Tabs>
    </template>
  </div>
</template>

<style scoped>
.site-id {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
