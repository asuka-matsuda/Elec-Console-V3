<script setup lang="ts">
/**
 * PortalSiteSettingsModal
 * 現場設定モーダルコンポーネント。
 * 各設定タブ（基本情報、Excel同期、除外回路）のOrganismsをオーケストレーションします。
 */
import { toRef } from 'vue'

import { useSiteSettingsForm } from '~/composables/portal/useSiteSettingsForm'
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
  handleMergeSync,
  handleResetImport,
  handleExport,
  handleDownloadExcel,
} = useSiteSettingsForm({
  site: toRef(props, 'site'),
  isOpen,
  onSave: payload => emit('update:site', payload),
})
</script>

<template>
  <OrganismsModal
    v-model="isOpen"
    title="現場設定"
    icon="settings"
    @cancel="isOpen = false"
  >
    <AtomsTabs v-model="activeTab" :options="tabs" />

    <div class="site-settings__content">
      <!-- 基本設定タブ (Organism) -->
      <PortalSiteBasicTab
        v-if="activeTab === 'basic'"
        v-model:status="editStatus"
        v-model:site-id="editId"
        v-model:name="editData.name"
        :status-options="statusOptions"
        :worker-names="workerNames"
      />

      <!-- データベース連携・Excel同期タブ (Organism) -->
      <PortalSiteSyncTab
        v-else-if="activeTab === 'integration'"
        v-model:excel-path="editData.excelPath"
        v-model:report-template-path="editData.reportTemplatePath"
        :selected-file="selectedFile"
        :show-sync-msg="showSyncMsg"
        :sync-msg="syncMsg"
        :sync-msg-type="syncMsgType"
        :sync-action="syncAction"
        :is-syncing="isSyncing"
        :sync-result-data="syncResultData"
        :on-file-select="handleFileSelect"
        :on-merge-sync="handleMergeSync"
        :on-reset-import="handleResetImport"
        :on-export="handleExport"
        :on-download-excel="handleDownloadExcel"
      />

      <!-- 除外回路タブ (Organism) -->
      <PortalSiteExclusionTab
        v-else-if="activeTab === 'rules'"
        v-model="excludedCircuitsList"
        :add-circuit="addCircuit"
        :remove-circuit="removeCircuit"
      />
    </div>

    <template #footer>
      <AtomsButton variant="secondary" @click="isOpen = false">
        キャンセル
      </AtomsButton>
      <AtomsButton variant="primary" @click="handleSave">
        保存する
      </AtomsButton>
    </template>
  </OrganismsModal>
</template>

<style scoped lang="scss">
.site-settings__content {
  min-height: 320px;
  margin-top: var(--space-4);
}
</style>
