<script setup lang="ts">
/**
 * OrganismsSiteSettingsDetail
 * [Portal Organisms] 現場管理の右ペイン（Detail）。
 * 選択された現場の基本設定、Excelデータ連携（取込・DL）、除外回路ルールを統合提供します。
 * 内部コンポーネントとして以下の Molecules をオーケストレートします:
 * - PortalMoleculesSiteBasicSettings
 * - PortalMoleculesSiteExcelIntegration
 * - PortalMoleculesSiteExcludedRules
 */
import { ref } from 'vue'

import type { SyncResultInfo } from '~/composables/portal/useSiteSettingsForm'
import type { Site } from '~/types/admin'
import type { RadioOption } from '~/types/components'

defineProps<{
  site: Site | null
  editData: Partial<Site>
  editStatus: string
  editId: string
  statusOptions: { label: string, value: string }[]
  workerNames: string[]
  excludedCircuitsList: string[]
  selectedFile: File | null
  showSyncMsg: boolean
  syncMsg: string
  syncMsgType: 'info' | 'success' | 'error'
  syncAction: string | null
  isSyncing: boolean
  syncResultData: SyncResultInfo | null
}>()

const emit = defineEmits<{
  'save': []
  'merge-sync': []
  'reset-import': []
  'download-excel': []
  'add-circuit': []
  'update:editStatus': [val: string]
  'update:editId': [val: string]
  'update:name': [val: string]
  'file-select': [file: File | null]
  'remove-circuit': [idx: number]
  'update:circuit': [payload: { index: number, value: string }]
}>()

const activeCategory = ref<'basic' | 'integration' | 'rules'>('basic')

const categoryOptions: RadioOption<'basic' | 'integration' | 'rules'>[] = [
  { label: '基本情報', value: 'basic' },
  { label: 'Excelデータ連携', value: 'integration' },
  { label: '除外回路ルール', value: 'rules' },
]

const isResultDialogOpen = ref(false)
</script>

<template>
  <div class="flex flex-col gap-6 w-full">
    <!-- 現場未選択時の空状態表示 -->
    <template v-if="!site">
      <MoleculesEmptyState
        icon="layout"
        title="現場が選択されていません"
        description="左側の現場一覧から、設定やデータ連携を行う現場を選択してください。"
        class="placeholder-empty min-h-[400px] flex items-center justify-center"
      />
    </template>

    <!-- 現場選択時の設定コンソール -->
    <template v-else>
      <!-- 上部ヘッダー: 現場名 + ステータス + 一括保存ボタン -->
      <MoleculesSectionHeader
        :title="site.name"
        icon="settings"
        size="lg"
      >
        <template #default>
          <div class="flex items-baseline gap-2">
            <span>{{ site.name }}</span>
            <span class="site-id-label">
              (ID: {{ site.id }})
            </span>
          </div>
        </template>

        <template #actions>
          <AtomsButton
            variant="primary"
            icon="save"
            @click="emit('save')"
          >
            変更を保存
          </AtomsButton>
        </template>
      </MoleculesSectionHeader>

      <!-- 設定カテゴリ選択 (AtomsRadioGroup) -->
      <div class="overflow-x-auto pb-1">
        <AtomsRadioGroup
          v-model="activeCategory"
          :options="categoryOptions"
        />
      </div>

      <!-- 1. 基本情報設定 -->
      <PortalMoleculesSiteBasicSettings
        v-if="activeCategory === 'basic'"
        :edit-status="editStatus"
        :edit-id="editId"
        :edit-data="editData"
        :status-options="statusOptions"
        :worker-names="workerNames"
        @update:edit-status="emit('update:editStatus', $event)"
        @update:edit-id="emit('update:editId', $event)"
        @update:name="emit('update:name', $event)"
      />

      <!-- 2. Excelデータ連携 (取込 & 帳票DL) -->
      <PortalMoleculesSiteExcelIntegration
        v-else-if="activeCategory === 'integration'"
        :selected-file="selectedFile"
        :is-syncing="isSyncing"
        :sync-action="syncAction"
        :show-sync-msg="showSyncMsg"
        :sync-msg="syncMsg"
        :sync-msg-type="syncMsgType"
        :sync-result-data="syncResultData"
        @file-select="emit('file-select', $event)"
        @merge-sync="emit('merge-sync')"
        @reset-import="emit('reset-import')"
        @download-excel="emit('download-excel')"
        @show-result-detail="isResultDialogOpen = true"
      />

      <!-- 3. 除外回路ルール設定 -->
      <PortalMoleculesSiteExcludedRules
        v-else-if="activeCategory === 'rules'"
        :excluded-circuits-list="excludedCircuitsList"
        @add-circuit="emit('add-circuit')"
        @remove-circuit="emit('remove-circuit', $event)"
        @update:circuit="emit('update:circuit', $event)"
      />

      <!-- 処理完了詳細モーダル -->
      <OrganismsModal
        v-model="isResultDialogOpen"
        :title="syncResultData?.title || '処理結果'"
        icon="check-circle"
        variant="success"
        size="sm"
        @cancel="isResultDialogOpen = false"
      >
        <div v-if="syncResultData" class="flex flex-col gap-3">
          <div class="result-msg">
            {{ syncResultData.title }}が正常に完了しました。
          </div>

          <div class="flex flex-wrap gap-2">
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
    </template>
  </div>
</template>

<style scoped lang="scss">
.site-id-label {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.result-msg {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
