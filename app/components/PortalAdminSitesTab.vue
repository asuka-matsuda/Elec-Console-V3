<script setup lang="ts">
/**
 * PortalAdminSitesTab
 * ポータル管理 - 現場管理（PC管理コンソール型 2ペインレイアウト）
 * 左ペイン（現場一覧・検索・新規登録）と右ペイン（現場詳細設定・Excel連携・除外ルール）を常時展開します。
 */
import { computed, ref, watch } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useSiteSettingsForm } from '~/composables/portal/useSiteSettingsForm'
import { useModal } from '~/composables/useModal'
import type { Site, SiteStatus } from '~/types/admin'

const { sites, createSite, toggleDisableSite, updateSite } = useAdminSites()

// 選択中の現場ID（初期値は先頭現場または未選択）
const selectedSiteId = ref<string | null>(null)

// sitesが読み込まれたら自動的に先頭を選択
watch(
  sites,
  (loadedSites) => {
    if (loadedSites.length > 0 && !selectedSiteId.value) {
      selectedSiteId.value = loadedSites[0]?.id || null
    }
    else if (loadedSites.length === 0) {
      selectedSiteId.value = null
    }
  },
  { immediate: true },
)

const selectedSite = computed<Site | null>(() => {
  if (!selectedSiteId.value) return null

  return sites.value.find(s => s.id === selectedSiteId.value) || null
})

const handleSelectSite = (site: Site) => {
  selectedSiteId.value = site.id
}

// 新規登録モーダル
const isCreateModalOpen = ref(false)
const newSite = ref({
  id: '',
  name: '',
  status: 'planning' as SiteStatus,
})

const openCreateModal = () => {
  newSite.value = { id: '', name: '', status: 'planning' }
  isCreateModalOpen.value = true
}

const handleCreateSite = async () => {
  if (!newSite.value.id || !newSite.value.name) {
    throw new Error('現場IDと現場名を入力してください。')
  }
  await createSite({ ...newSite.value })
  selectedSiteId.value = newSite.value.id
  isCreateModalOpen.value = false
  newSite.value = { id: '', name: '', status: 'planning' }
}

// 現場設定フォーム・コンポーザブル
const isSettingsActive = computed(() => selectedSite.value !== null)

const {
  editData,
  editStatus,
  editId,
  excludedCircuitsList,
  addCircuit,
  removeCircuit,
  statusOptions,
  workerNames,
  handleSave: handleSaveSettingsForm,
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
  site: selectedSite,
  isOpen: isSettingsActive,
  onSave: async (payload) => {
    if (selectedSite.value) {
      const originalId = selectedSite.value.id

      await updateSite(originalId, payload)
      if (payload.id && payload.id !== originalId) {
        selectedSiteId.value = payload.id
      }
    }
  },
})

// 有効化・無効化確認モーダル
const { askConfirm } = useModal()

const confirmToggleDisable = async (row: Site) => {
  const isCurrentlyDisabled = !!row.disabledAt

  const isConfirmed = await askConfirm({
    title: isCurrentlyDisabled ? '現場の有効化' : '現場の無効化',
    message: isCurrentlyDisabled
      ? `現場「${row.name}」へのアクセスを再度有効にしますか？`
      : `現場「${row.name}」を無効化しますか？ 無効になると現場へのアクセスができなくなります。`,
    confirmText: isCurrentlyDisabled ? '有効化する' : '無効化する',
    intent: isCurrentlyDisabled ? 'success' : 'danger',
  })

  if (isConfirmed) {
    await toggleDisableSite(row.id)
  }
}
</script>

<template>
  <AtomsPanel>
    <div class="flex flex-col lg:flex-row gap-6 items-start">
      <!-- 左ペイン: Master (幅約340px) -->
      <div class="w-full lg:w-[340px] shrink-0">
        <PortalOrganismsSiteListMaster
          :sites="sites"
          :selected-site-id="selectedSiteId"
          @select="handleSelectSite"
          @create="openCreateModal"
          @toggle-disable="confirmToggleDisable"
        />
      </div>

      <div class="hidden lg:block w-px self-stretch bg-[var(--color-border)]" />

      <!-- 右ペイン: Detail (残りワイド領域) -->
      <div class="flex-1 min-w-0 w-full">
        <PortalOrganismsSiteSettingsDetail
          :site="selectedSite"
          :edit-data="editData"
          :edit-status="editStatus"
          :edit-id="editId"
          :status-options="statusOptions"
          :worker-names="workerNames"
          :excluded-circuits-list="excludedCircuitsList"
          :selected-file="selectedFile"
          :show-sync-msg="showSyncMsg"
          :sync-msg="syncMsg"
          :sync-msg-type="syncMsgType"
          :sync-action="syncAction"
          :is-syncing="isSyncing"
          :sync-result-data="syncResultData"
          @save="handleSaveSettingsForm"
          @update:edit-status="editStatus = $event"
          @update:edit-id="editId = $event"
          @update:name="editData.name = $event"
          @file-select="handleFileSelect"
          @merge-sync="handleMergeSync"
          @reset-import="handleResetImport"
          @download-excel="handleDownloadExcel"
          @add-circuit="addCircuit"
          @remove-circuit="removeCircuit"
          @update:circuit="excludedCircuitsList[$event.index] = $event.value"
        />
      </div>
    </div>

    <!-- 新規登録モーダル (中央ダイアログ) -->
    <OrganismsModal
      v-model="isCreateModalOpen"
      title="新規現場プロジェクト登録"
      icon="plus-circle"
      size="md"
      :submit-fn="handleCreateSite"
      submit-text="登録する"
      @cancel="isCreateModalOpen = false"
    >
      <div class="flex flex-col gap-4">
        <MoleculesFormGroup label="現場ID (半角英数)">
          <AtomsInput v-model="newSite.id" placeholder="例: site-tokyo-01" />
        </MoleculesFormGroup>
        <MoleculesFormGroup label="現場名">
          <AtomsInput v-model="newSite.name" placeholder="例: 新宿プロジェクト" />
        </MoleculesFormGroup>
      </div>
    </OrganismsModal>
  </AtomsPanel>
</template>
