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
import type { TabOption } from '~/types/components'

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

const categoryOptions: TabOption<'basic' | 'integration' | 'rules'>[] = [
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
      <EmptyState
        icon="layout"
        title="現場が選択されていません"
        description="左側の現場一覧から、設定やデータ連携を行う現場を選択してください。"
        class="placeholder-empty min-h-[400px] flex items-center justify-center"
      />
    </template>

    <!-- 現場選択時の設定コンソール -->
    <template v-else>
      <!-- 上部ヘッダー: 現場名 + ステータス + 一括保存ボタン -->
      <SectionHeader
        :title="site.name"
        icon="settings"
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
          <Button
            variant="success"
            icon="save"
            @click="emit('save')"
          >
            変更を保存
          </Button>
        </template>
      </SectionHeader>

      <!-- 設定カテゴリタブ (Tabs) -->
      <Tabs
        v-model="activeCategory"
        :options="categoryOptions"
      >
        <!-- 1. 基本情報設定 -->
        <template #basic>
          <PortalMoleculesSiteBasicSettings
            :edit-status="editStatus"
            :edit-id="editId"
            :edit-data="editData"
            :status-options="statusOptions"
            :worker-names="workerNames"
            @update:edit-status="emit('update:editStatus', $event)"
            @update:edit-id="emit('update:editId', $event)"
            @update:name="emit('update:name', $event)"
          />
        </template>

        <!-- 2. Excelデータ連携 (取込 & 帳票DL) -->
        <template #integration>
          <PortalMoleculesSiteExcelIntegration
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
        </template>

        <!-- 3. 除外回路ルール設定 -->
        <template #rules>
          <PortalMoleculesSiteExcludedRules
            :excluded-circuits-list="excludedCircuitsList"
            @add-circuit="emit('add-circuit')"
            @remove-circuit="emit('remove-circuit', $event)"
            @update:circuit="emit('update:circuit', $event)"
          />
        </template>
      </Tabs>

      <!-- 処理完了詳細モーダル -->
      <Modal
        v-model="isResultDialogOpen"
        :title="syncResultData?.title || '処理結果'"
        icon="check-circle"
        @cancel="isResultDialogOpen = false"
      >
        <div v-if="syncResultData" class="flex flex-col gap-3">
          <div class="result-msg">
            {{ syncResultData.title }}が正常に完了しました。
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Badge v-if="syncResultData.createdCount !== undefined" id="sync:added">
              追加: +{{ syncResultData.createdCount }} 件
            </Badge>
            <Badge v-if="syncResultData.updatedCount !== undefined" id="sync:updated">
              基本情報変更: {{ syncResultData.updatedCount }} 件
            </Badge>
            <span class="sync-total-count">
              全回路総数: {{ syncResultData.count }} 件
            </span>
          </div>
        </div>
      </Modal>
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

.sync-total-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
