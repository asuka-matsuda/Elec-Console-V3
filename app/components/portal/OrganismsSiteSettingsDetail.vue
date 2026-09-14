<script setup lang="ts">
/**
 * OrganismsSiteSettingsDetail
 * [Portal Organisms] 現場管理の右ペイン（Detail）。
 * 選択された現場の基本設定、Excelデータ連携（取込・DL）、除外回路ルールを統合提供します。
 * Organisms規約に基づき独自のクラス定義スタイルは持たず、Atoms / Molecules を純粋にレイアウトします。
 */
import { ref } from 'vue'

import type { SyncResultInfo } from '~/composables/portal/useSiteSettingsForm'
import { useModal } from '~/composables/useModal'
import type { Site } from '~/types/admin'
import type { RadioOption } from '~/types/components'
import { getSiteStatusColor, getSiteStatusLabel } from '~/utils/portal'

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

// 初期化取込の危険確認モーダル
const { askConfirm } = useModal()
const isResultDialogOpen = ref(false)

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
  <div class="flex flex-col gap-6 w-full">
    <!-- 現場未選択時の空状態表示 -->
    <template v-if="!site">
      <MoleculesEmptyState
        icon="layout"
        title="現場が選択されていません"
        description="左側の現場一覧から、設定やデータ連携を行う現場を選択してください。"
        class="min-h-[400px] flex items-center justify-center border border-dashed border-[var(--color-border)] rounded-md"
      />
    </template>

    <!-- 現場選択時の設定コンソール -->
    <template v-else>
      <!-- 上部ヘッダー: 現場名 + ステータス + 一括保存ボタン (MoleculesSectionHeader) -->
      <MoleculesSectionHeader
        :title="site.name"
        icon="settings"
        size="lg"
      >
        <template #default>
          <div class="flex flex-wrap items-center gap-2">
            <span>{{ site.name }}</span>
            <AtomsBadge :color="getSiteStatusColor(site.status)">
              {{ getSiteStatusLabel(site.status) }}
            </AtomsBadge>
            <AtomsBadge v-if="site.disabledAt" color="var(--color-status-danger)">
              無効
            </AtomsBadge>
            <span class="site-id-label font-mono text-[var(--color-text-muted)] font-normal ml-1">
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
      <div v-if="activeCategory === 'basic'" class="flex flex-col gap-5 max-w-xl">
        <MoleculesSectionHeader
          title="現場基本情報"
          icon="info"
          size="sm"
        />

        <MoleculesFormGroup label="ステータス">
          <AtomsSelect
            :model-value="editStatus"
            :options="statusOptions"
            @update:model-value="emit('update:editStatus', String($event ?? ''))"
          />
        </MoleculesFormGroup>

        <MoleculesFormGroup label="現場ID (半角英数)">
          <AtomsInput
            :model-value="editId"
            placeholder="例: site-tokyo-01"
            @update:model-value="emit('update:editId', String($event ?? ''))"
          />
        </MoleculesFormGroup>

        <MoleculesFormGroup label="現場名">
          <AtomsInput
            :model-value="editData.name"
            placeholder="例: 新宿プロジェクト"
            @update:model-value="emit('update:name', String($event ?? ''))"
          />
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
              description="ユーザー管理画面からワーカーをアサインしてください。"
            />
          </div>
        </MoleculesFormGroup>
      </div>

      <!-- 2. Excelデータ連携 (取込 & 帳票DL) -->
      <div v-else-if="activeCategory === 'integration'" class="flex flex-col gap-6">
        <!-- 取込セクション -->
        <div class="flex flex-col gap-3">
          <MoleculesSectionHeader
            title="Excelデータ取込 (差分同期 / 初期設定)"
            icon="upload-cloud"
            size="sm"
          />
          <p class="desc-text m-0 text-[var(--color-text-muted)] leading-relaxed">
            回路情報・現場基本情報の更新は「差分同期」、新規立ち上げ時は「全件初期化取込」を行います。
          </p>

          <PortalAtomsExcelDropzone
            :model-value="selectedFile"
            :disabled="isSyncing"
            @update:model-value="emit('file-select', $event)"
          />

          <div class="flex flex-wrap items-center gap-3 mt-1">
            <AtomsButton
              variant="primary"
              icon="refresh-cw"
              :loading="syncAction === 'merge'"
              :disabled="!selectedFile || isSyncing"
              @click="emit('merge-sync')"
            >
              {{ selectedFile ? '選択ファイルから差分同期' : 'ファイルを選択して差分同期' }}
            </AtomsButton>

            <AtomsButton
              variant="danger"
              icon="trash-2"
              :loading="syncAction === 'reset'"
              :disabled="!selectedFile || isSyncing"
              @click="confirmResetImport"
            >
              全件初期化取込
            </AtomsButton>
          </div>
        </div>

        <!-- 出力セクション -->
        <div class="flex flex-col gap-3">
          <MoleculesSectionHeader
            title="最新結果の帳票出力"
            icon="file-spreadsheet"
            size="sm"
          />
          <p class="desc-text m-0 text-[var(--color-text-muted)] leading-relaxed">
            Web上で完了した最新の試験結果（Phase 1〜3）を含むExcel帳票ファイルをダウンロードします。
          </p>

          <div>
            <AtomsButton
              variant="secondary"
              icon="download"
              :loading="syncAction === 'download'"
              :disabled="isSyncing"
              @click="emit('download-excel')"
            >
              Excel帳票ダウンロード (ブラウザDL)
            </AtomsButton>
          </div>
        </div>

        <!-- 実行中ステータス表示 -->
        <div
          v-if="isSyncing"
          class="status-msg flex items-center gap-2 p-3 rounded-sm text-[var(--color-category-main)] bg-[color-mix(in_srgb,var(--color-category-main)_10%,transparent)]"
        >
          <AtomsIcon name="loader" size="sm" class="u-spin" />
          <span>{{ syncMsg }}</span>
        </div>

        <!-- エラー発生時の表示 -->
        <div
          v-else-if="showSyncMsg && syncMsgType === 'error'"
          class="status-msg flex items-center gap-2 p-3 rounded-sm text-[var(--color-status-danger)] bg-[color-mix(in_srgb,var(--color-status-danger)_10%,transparent)]"
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
            <AtomsButton
              variant="secondary"
              @click="isResultDialogOpen = true"
            >
              詳細を表示
            </AtomsButton>
          </template>

          <template #value>
            <div class="flex flex-wrap gap-2 mt-2">
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
            </div>
          </template>
        </MoleculesResultBox>
      </div>

      <!-- 3. 除外回路ルール設定 -->
      <div v-else-if="activeCategory === 'rules'" class="flex flex-col gap-4 max-w-xl">
        <MoleculesSectionHeader
          title="除外回路の設定"
          icon="slash"
          size="sm"
        />
        <p class="desc-text m-0 text-[var(--color-text-muted)] leading-relaxed">
          計算や試験連携の対象外とする盤・回路を指定します。
        </p>

        <div class="flex flex-col gap-3">
          <ul v-if="excludedCircuitsList.length > 0" class="m-0 flex flex-col gap-2 p-0 list-none">
            <li
              v-for="(circuit, idx) in excludedCircuitsList"
              :key="idx"
              class="flex items-center gap-2"
            >
              <AtomsInput
                :model-value="circuit"
                placeholder="例: 盤A-回路1"
                @update:model-value="emit('update:circuit', { index: idx, value: String($event ?? '') })"
              />
              <AtomsButton
                icon="trash-2"
                variant="danger"
                title="除外回路を削除"
                @click="emit('remove-circuit', idx)"
              />
            </li>
          </ul>

          <MoleculesEmptyState
            v-else
            icon="slash"
            title="除外回路は設定されていません"
            description="すべての回路が計算・連携の対象となります。"
          />

          <div>
            <AtomsButton
              variant="secondary"
              icon="plus"
              @click="emit('add-circuit')"
            >
              除外回路を追加する
            </AtomsButton>
          </div>
        </div>
      </div>

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
          <div class="result-msg text-[var(--color-text-muted)]">
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
.site-id-label,
.desc-text {
  font-size: var(--font-size-xs);
}

.status-msg,
.result-msg {
  font-size: var(--font-size-sm);
}
</style>
