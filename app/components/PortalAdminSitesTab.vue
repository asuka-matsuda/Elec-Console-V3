<script setup lang="ts">
/**
 * PortalAdminSitesTab
 * ポータル管理 - 現場管理タブ
 * 新規現場プロジェクト登録および現場設定を右サイドドロワー（OrganismsDrawer）に集約しています。
 */
import { computed, ref } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useSiteSettingsForm } from '~/composables/portal/useSiteSettingsForm'
import { ADMIN_SITE_COLUMNS } from '~/constants/adminConstants'
import type { Site, SiteStatus } from '~/types/admin'
import { formatDateTime } from '~/utils/date'
import {
  getSiteStatusColor as getStatusColor,
  getSiteStatusLabel as getStatusLabel,
} from '~/utils/portal'

const { sites, createSite, toggleDisableSite, updateSite } = useAdminSites()

const {
  sortBy: sortKey,
  sortOrder,
  sortedData: sortedSites,
  handleSort,
} = useTableSort(sites, {
  defaultKey: 'id',
  defaultOrder: 'asc',
})

// ドロワー状態管理
type SiteDrawerMode = 'create' | 'settings'
const isDrawerOpen = ref(false)
const drawerMode = ref<SiteDrawerMode>('create')

// 新規登録用データ
const newSite = ref({
  id: '',
  name: '',
  status: 'planning' as SiteStatus,
})

const openCreateDrawer = () => {
  newSite.value = { id: '', name: '', status: 'planning' }
  drawerMode.value = 'create'
  isDrawerOpen.value = true
}

const handleCreateSite = async () => {
  if (!newSite.value.id || !newSite.value.name) {
    throw new Error('現場IDと現場名を入力してください。')
  }
  await createSite({ ...newSite.value })
  isDrawerOpen.value = false
  newSite.value = { id: '', name: '', status: 'planning' }
}

// 現場設定用データ・コンポーザブル
const settingsTargetSite = ref<Site | null>(null)

const isSettingsOpen = computed({
  get: () => isDrawerOpen.value && drawerMode.value === 'settings',
  set: (val: boolean) => {
    if (!val && drawerMode.value === 'settings') {
      isDrawerOpen.value = false
    }
  },
})

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
  handleExport,
  handleDownloadExcel,
} = useSiteSettingsForm({
  site: settingsTargetSite,
  isOpen: isSettingsOpen,
  onSave: async (payload) => {
    if (settingsTargetSite.value) {
      await updateSite(settingsTargetSite.value.id, payload)
    }
    isDrawerOpen.value = false
  },
})

const openSettingsDrawer = (siteId: string) => {
  const site = sites.value.find(s => s.id === siteId)

  if (site) {
    settingsTargetSite.value = { ...site }
    drawerMode.value = 'settings'
    isDrawerOpen.value = true
  }
}

// ドロワー見出し・幅などの動的計算
const drawerTitle = computed(() => {
  if (drawerMode.value === 'create') return '新規現場プロジェクト登録'

  return `現場設定: ${settingsTargetSite.value?.name || ''}`
})

const drawerIcon = computed(() => {
  return drawerMode.value === 'create' ? 'plus-circle' : 'settings'
})

const drawerWidth = computed<'md' | 'lg'>(() => {
  return drawerMode.value === 'create' ? 'md' : 'lg'
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
  <AtomsPanel class="admin-sites">
    <MoleculesSectionHeader title="現場プロジェクト一覧">
      <template #actions>
        <AtomsButton
          variant="primary"
          icon="plus"
          @click="openCreateDrawer"
        >
          新規現場登録
        </AtomsButton>
      </template>
    </MoleculesSectionHeader>

    <MoleculesTable
      :columns="ADMIN_SITE_COLUMNS"
      :data="sortedSites"
      :sort-by="sortKey"
      :sort-order="sortOrder"
      @sort="handleSort"
    >
      <template #cell-status="{ value, row }">
        <div class="flex flex-col gap-1">
          <AtomsBadge :color="getStatusColor(value)">
            {{ getStatusLabel(value) }}
          </AtomsBadge>
          <AtomsBadge v-if="row.disabledAt" color="var(--color-status-danger)">
            無効
          </AtomsBadge>
        </div>
      </template>
      <template #cell-createdAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
      <template #cell-disabledAt="{ value }">
        {{ formatDateTime(value) }}
      </template>
      <template #cell-actions="{ row }">
        <div class="flex items-center gap-2">
          <AtomsButton
            variant="secondary"
            size="sm"
            icon="settings"
            @click="openSettingsDrawer(String(row.id))"
          >
            現場設定
          </AtomsButton>
          <AtomsButton
            :variant="row.disabledAt ? 'success' : 'danger'"
            size="sm"
            @click="confirmToggleDisable(row)"
          >
            {{ row.disabledAt ? "有効化" : "無効化" }}
          </AtomsButton>
        </div>
      </template>
    </MoleculesTable>

    <!-- 右サイドドロワー (新規登録 / 現場設定) -->
    <OrganismsDrawer
      v-model="isDrawerOpen"
      :title="drawerTitle"
      :icon="drawerIcon"
      :width="drawerWidth"
      :submit-fn="drawerMode === 'create' ? handleCreateSite : undefined"
      :submit-text="drawerMode === 'create' ? '登録する' : undefined"
      @cancel="isDrawerOpen = false"
    >
      <!-- 1. 新規現場登録モード -->
      <div v-if="drawerMode === 'create'" class="flex flex-col gap-4">
        <MoleculesFormGroup label="現場ID (半角英数)">
          <AtomsInput v-model="newSite.id" placeholder="例: site-tokyo-01" />
        </MoleculesFormGroup>
        <MoleculesFormGroup label="現場名">
          <AtomsInput v-model="newSite.name" placeholder="例: 新宿プロジェクト" />
        </MoleculesFormGroup>
      </div>

      <!-- 2. 現場設定モード -->
      <div v-else-if="drawerMode === 'settings'" class="flex flex-col gap-4">
        <AtomsTabs v-model="activeTab" :options="tabs" />

        <div class="mt-2 min-h-[320px]">
          <!-- 基本設定 (旧 PortalSiteBasicTab のインライン化) -->
          <div v-if="activeTab === 'basic'" class="flex flex-col gap-4">
            <MoleculesFormGroup label="ステータス">
              <AtomsSelect v-model="editStatus" :options="statusOptions" />
            </MoleculesFormGroup>

            <MoleculesFormGroup label="現場ID (半角英数)">
              <AtomsInput v-model="editId" placeholder="例: site-tokyo-01" />
            </MoleculesFormGroup>

            <MoleculesFormGroup label="現場名">
              <AtomsInput v-model="editData.name" />
            </MoleculesFormGroup>

            <MoleculesFormGroup label="アサイン済ワーカー">
              <div class="flex flex-wrap items-center gap-2">
                <template v-if="workerNames.length > 0">
                  <AtomsBadge
                    v-for="(name, idx) in workerNames"
                    :key="idx"
                    color="var(--color-category-main)"
                  >
                    {{ name }}
                  </AtomsBadge>
                </template>
                <MoleculesEmptyState
                  v-else
                  icon="users"
                  title="アサインされているワーカーはいません"
                  description="管理者よりワーカーをアサインしてください。"
                />
              </div>
            </MoleculesFormGroup>
          </div>

          <!-- データベース連携・Excel同期 (既存の PortalSiteSyncTab を活用) -->
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

          <!-- 除外回路の設定 (旧 PortalSiteExclusionTab のインライン化) -->
          <div v-else-if="activeTab === 'rules'" class="flex flex-col gap-4">
            <MoleculesFormGroup label="除外回路の設定">
              <template #description>
                計算や連携の対象外とする回路を複数追加できます。
              </template>

              <div class="flex flex-col gap-3">
                <ul v-if="excludedCircuitsList.length > 0" class="m-0 flex flex-col gap-2 p-0 list-none">
                  <li
                    v-for="(_, idx) in excludedCircuitsList"
                    :key="idx"
                    class="flex items-center gap-2"
                  >
                    <AtomsInput
                      v-model="excludedCircuitsList[idx]"
                      placeholder="例: 盤A-回路1"
                    />
                    <MoleculesIconButton
                      name="trash-2"
                      variant="danger"
                      size="sm"
                      title="除外回路を削除"
                      @click="removeCircuit(idx)"
                    />
                  </li>
                </ul>

                <MoleculesEmptyState
                  v-else
                  icon="slash"
                  title="除外回路は設定されていません"
                  description="すべての回路が計算・連携の対象となります。"
                />

                <AtomsButton
                  variant="secondary"
                  icon="plus"
                  size="sm"
                  @click="addCircuit"
                >
                  除外回路を追加する
                </AtomsButton>
              </div>
            </MoleculesFormGroup>
          </div>
        </div>
      </div>

      <!-- 現場設定モード用フッター -->
      <template v-if="drawerMode === 'settings'" #footer>
        <AtomsButton variant="secondary" @click="isDrawerOpen = false">
          キャンセル
        </AtomsButton>
        <AtomsButton variant="primary" @click="handleSaveSettingsForm">
          保存する
        </AtomsButton>
      </template>
    </OrganismsDrawer>
  </AtomsPanel>
</template>
