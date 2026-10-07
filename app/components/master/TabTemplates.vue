<script setup lang="ts">
/**
 * 帳票テンプレート管理タブコンポーネント
 *
 * @description システムマスターで管理される複数の帳票ひな形Excelファイルの登録・更新・削除・ダウンロード、
 * 各帳票の現場割り当て設定、および流し込みロジックごとの使用可能キー一覧を提供します。
 */
import { computed, onMounted, ref } from 'vue'

import type {
  MasterReportTemplateForm,
  MasterReportTemplateItem,
  ReportLogicType,
  ReportTemplateKeyDefinition,
} from '#shared/types/reportTemplate'
import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useMasterTemplates } from '~/composables/master/useMasterTemplates'
import { getReportLogicMeta, REPORT_LOGIC_OPTIONS } from '~/constants/reportTemplates'
import type { MenuItem, TableColumn } from '~/types/components'
import { formatShortDateTime } from '~/utils/date'

const {
  items,
  isLoading,
  isSaving,
  deletingId,
  downloadingId,
  fetchTemplates,
  saveTemplate,
  downloadTemplate,
  deleteTemplate,
} = useMasterTemplates()

const { sites, fetchSites } = useAdminSites()
const toast = useToast()
const { askConfirm } = useModal()

// --- 登録・編集モーダル状態 ---
const isFormModalOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingId = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const editingExistingFile = ref<{ filename: string, size: number } | null>(null)

const INITIAL_FORM: MasterReportTemplateForm = {
  name: '',
  logicType: 'tag',
  description: '',
  isAllSites: true,
  assignedSiteIds: [],
}

const formState = ref<MasterReportTemplateForm>({ ...INITIAL_FORM })

// --- キー一覧モーダル状態 ---
const isKeyModalOpen = ref(false)
const selectedLogicType = ref<ReportLogicType>('tag')
const selectedLogicTitle = ref('')
const keySearchQuery = ref('')

const openKeyModal = (logicType: ReportLogicType, title?: string) => {
  keySearchQuery.value = ''
  selectedLogicType.value = logicType
  selectedLogicTitle.value = title || getReportLogicMeta(logicType).name
  isKeyModalOpen.value = true
}

const currentLogicMeta = computed(() => getReportLogicMeta(selectedLogicType.value))

const filteredKeys = computed<ReportTemplateKeyDefinition[]>(() => {
  const keys = currentLogicMeta.value.availableKeys || []
  const query = keySearchQuery.value.trim().toLowerCase()

  if (!query) return keys

  return keys.filter(
    k =>
      k.key.toLowerCase().includes(query)
      || k.label.toLowerCase().includes(query)
      || k.description.toLowerCase().includes(query)
      || k.sample.toLowerCase().includes(query),
  )
})

const keyColumns: TableColumn<ReportTemplateKeyDefinition>[] = [
  { key: 'key', label: 'キー記法（クリックでコピー）', width: '220px' },
  { key: 'label', label: '項目名', width: '180px' },
  { key: 'description', label: '説明' },
  { key: 'sample', label: 'サンプル値', width: '180px' },
]

const templateColumns: TableColumn<MasterReportTemplateItem>[] = [
  { key: 'name', label: '帳票名 / 備考', minWidth: '220px' },
  { key: 'logicType', label: '流し込みロジック', minWidth: '180px' },
  { key: 'sites', label: '対象現場', minWidth: '200px' },
  { key: 'file', label: 'ひな形Excelファイル', width: '220px' },
  { key: 'actions', label: '操作', width: '170px', align: 'right' },
]

const getRowMenuItems = (row: MasterReportTemplateItem): MenuItem[] => [
  {
    label: '使えるキー一覧…',
    icon: 'key',
    action: () => openKeyModal(row.logicType, row.name),
  },
  {
    label: '設定を変更…',
    icon: 'edit',
    action: () => openEditModal(row),
  },
  {
    label: 'ひな形を削除',
    icon: 'trash-2',
    variant: 'danger',
    disabled: deletingId.value === row.id,
    divider: true,
    action: () => confirmDelete(row),
  },
]

const copyKey = async (tag: string) => {
  try {
    await navigator.clipboard.writeText(tag)
    toast.success(`「${tag}」をコピーしました`)
  }
  catch {
    toast.error('クリップボードへのコピーに失敗しました')
  }
}

// --- モーダル操作 ---
const openCreateModal = () => {
  formMode.value = 'create'
  editingId.value = null
  selectedFile.value = null
  editingExistingFile.value = null
  formState.value = { ...INITIAL_FORM }
  isFormModalOpen.value = true
}

const openEditModal = (item: MasterReportTemplateItem) => {
  formMode.value = 'edit'
  editingId.value = item.id
  selectedFile.value = null
  editingExistingFile.value = {
    filename: item.file.filename,
    size: item.file.size,
  }
  formState.value = {
    name: item.name,
    logicType: item.logicType,
    description: item.description,
    isAllSites: item.isAllSites,
    assignedSiteIds: [...item.assignedSiteIds],
  }
  isFormModalOpen.value = true
}

const handleFileChange = (file: File | null) => {
  selectedFile.value = file
}

const submitForm = async () => {
  const name = formState.value.name.trim()

  if (!name) {
    toast.error('帳票名を入力してください')

    return
  }

  if (formMode.value === 'create' && !selectedFile.value) {
    toast.error('ひな形Excelファイル（.xlsx / .xlsm）を選択してください')

    return
  }

  if (!formState.value.isAllSites && formState.value.assignedSiteIds.length === 0) {
    toast.error('割り当てる現場を1件以上選択してください')

    return
  }

  const result = await saveTemplate(
    formState.value,
    selectedFile.value,
    editingId.value || undefined,
  )

  if (result) {
    isFormModalOpen.value = false
    await fetchTemplates()
  }
}

const confirmDelete = async (item: MasterReportTemplateItem) => {
  const isConfirmed = await askConfirm({
    title: '帳票テンプレートの削除',
    message: `「${item.name}」を削除しますか？\n削除すると割り当てられた現場でこの帳票を出力できなくなります。`,
    confirmText: '削除する',
    intent: 'danger',
  })

  if (isConfirmed) {
    await deleteTemplate(item.id, item.name)
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const getSiteName = (siteId: string): string => {
  const found = sites.value.find(s => s.id === siteId)

  return found ? found.name : siteId
}

onMounted(async () => {
  await Promise.all([
    fetchTemplates(),
    fetchSites(),
  ])
})
</script>

<template>
  <div class="flex flex-col gap-section-gap">
    <header class="flex flex-wrap items-center justify-between gap-panel-gap">
      <small class="guide-text">現場ポータルからワンクリックで出力されるExcel帳票のひな形と現場割り当てを管理します。</small>
      <div class="flex items-center gap-inline-gap flex-wrap">
        <Button variant="secondary" size="sm" icon="refresh-cw" :loading="isLoading" @click="fetchTemplates()">最新状態に更新</Button>
        <Button variant="primary" size="sm" icon="plus" @click="openCreateModal">帳票テンプレートを追加</Button>
      </div>
    </header>

    <!-- テンプレート一覧（テーブル表示） -->
    <div class="panel flex flex-col gap-panel-gap">
      <div class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap flex-wrap">
        <div class="flex items-center gap-item-gap">
          <Icon name="list" />
          <h4 class="tpl-title">登録済み帳票一覧</h4>
          <Badge size="sm" variant="gray">{{ items.length }}件</Badge>
        </div>
      </div>

      <Table
        :columns="templateColumns"
        :data="items"
        :loading="isLoading"
        row-key="id"
        empty-text="登録されている帳票テンプレートはありません。「帳票テンプレートを追加」ボタンからひな形Excelとロジックを登録してください。"
      >
        <template #cell-name="{ row }">
          <div class="flex flex-col gap-0.5">
            <span class="tpl-title">{{ row.name }}</span>
            <span v-if="row.description" class="desc-text">{{ row.description }}</span>
          </div>
        </template>

        <template #cell-logicType="{ row }">
          <div class="flex items-center gap-inline-gap">
            <Icon :name="getReportLogicMeta(row.logicType).icon" size="sm" />
            <span>{{ getReportLogicMeta(row.logicType).name }}</span>
          </div>
        </template>

        <template #cell-sites="{ row }">
          <span v-if="row.isAllSites" class="desc-text">全現場</span>
          <div v-else-if="row.assignedSiteIds.length > 0" class="flex flex-wrap items-center gap-inline-gap">
            <span v-for="sId in row.assignedSiteIds" :key="sId" class="site-chip">
              {{ getSiteName(sId) }}
            </span>
          </div>
          <span v-else class="desc-text text-muted">未割り当て</span>
        </template>

        <template #cell-file="{ row }">
          <div class="flex flex-col">
            <span class="file-name">{{ row.file.filename }}</span>
            <small class="file-meta">({{ formatFileSize(row.file.size) }} / {{ formatShortDateTime(row.file.updatedAt) }})</small>
          </div>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-inline-gap">
            <Button size="sm" variant="secondary" icon="download" :loading="downloadingId === row.id" @click="downloadTemplate(row.id, row.file.filename)">ひな形DL</Button>
            <Menu :items="getRowMenuItems(row)" />
          </div>
        </template>
      </Table>
    </div>

    <!-- 登録・編集モーダル -->
    <Modal v-model="isFormModalOpen" :title="formMode === 'create' ? '帳票テンプレートの新規登録' : '帳票テンプレートの編集'" icon="file-spreadsheet" size="lg">
      <div class="flex flex-col gap-panel-gap">
        <div class="flex flex-col gap-inline-gap">
          <label for="tpl-name" class="label">帳票名（必須）</label>
          <Input id="tpl-name" v-model="formState.name" placeholder="例: 線名札（A4判10面）、東京新築用 送電自主検査表" clearable />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-panel-gap">
          <div class="flex flex-col gap-inline-gap">
            <label for="tpl-logic" class="label">流し込みロジック種別</label>
            <Select id="tpl-logic" v-model="formState.logicType" :options="REPORT_LOGIC_OPTIONS" />
          </div>

          <div class="flex flex-col gap-inline-gap justify-end">
            <div class="flex items-center justify-between">
              <span class="desc-text">{{ getReportLogicMeta(formState.logicType).description }}</span>
              <Button variant="tertiary" size="sm" icon="key" @click="openKeyModal(formState.logicType)">キー一覧を確認</Button>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="tpl-desc" class="label">備考・補足説明（任意）</label>
          <Input id="tpl-desc" v-model="formState.description" placeholder="用途や出力時の注意点などを記入できます" clearable />
        </div>

        <hr class="divider">

        <!-- 現場割り当て設定 -->
        <div class="flex flex-col gap-item-gap">
          <span class="label">現場割り当て設定</span>
          <Toggle v-model="formState.isAllSites" label="すべての現場で利用可能にする" description="有効にすると、今後追加される現場を含め全現場のポータルから出力できるようになります。" />

          <div v-if="!formState.isAllSites" class="sites-select-box flex flex-col gap-inline-gap p-panel-pad-compact">
            <span class="label">利用を許可する現場を選択（{{ formState.assignedSiteIds.length }}現場 選択中）:</span>
            <div v-if="sites.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-inline-gap max-h-48 overflow-y-auto">
              <Checkbox v-for="site in sites" :key="site.id" v-model="formState.assignedSiteIds" :value="site.id" :label="site.name" />
            </div>
            <Note v-else variant="warning" text="登録されている現場がありません。先に現場ポータル管理で現場を登録してください。" />
          </div>
        </div>

        <hr class="divider">

        <!-- ひな形Excelアップロード -->
        <div class="flex flex-col gap-inline-gap">
          <span class="label">{{ formMode === 'create' ? 'ひな形Excelファイル（必須）' : 'ひな形Excelファイルの差し替え（任意）' }}</span>
          <div v-if="editingExistingFile && !selectedFile" class="existing-file-note p-inline-gap flex items-center justify-between">
            <span class="desc-text">現在の登録ファイル: <strong>{{ editingExistingFile.filename }}</strong> ({{ formatFileSize(editingExistingFile.size) }})</span>
            <span class="guide-text">※ 変更しない場合は再選択不要です</span>
          </div>
          <Dropzone v-model="selectedFile" accept=".xlsx, .xlsm, .xls" @change="handleFileChange" />
          <div v-if="selectedFile" class="selected-file-badge flex items-center gap-inline-gap">
            <Icon name="check" style="color: var(--color-status-success)" />
            <span>選択中のファイル: <strong>{{ selectedFile.name }}</strong> ({{ formatFileSize(selectedFile.size) }})</span>
          </div>
        </div>

        <!-- アクションボタン -->
        <div class="flex items-center justify-end gap-inline-gap pt-item-gap">
          <Button variant="secondary" @click="isFormModalOpen = false">キャンセル</Button>
          <Button variant="primary" :loading="isSaving" @click="submitForm">
            {{ formMode === 'create' ? '登録する' : '変更を保存する' }}
          </Button>
        </div>

      </div>
    </Modal>

    <!-- キー辞書モーダル -->
    <Modal v-model="isKeyModalOpen" :title="`【${selectedLogicTitle}】使用可能キー一覧`" icon="key" size="lg">
      <div class="flex flex-col gap-panel-gap">
        <Note variant="secondary" text="ひな形Excel内のセルに以下のキー記法（%キー名%）を半角で記述してください。クリックするとキーをクリップボードにコピーできます。" />

        <div class="flex flex-wrap items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <Input v-model="keySearchQuery" placeholder="キー記法・項目名・説明で絞り込み..." icon="search" clearable size="sm" class="w-full sm:w-80" />
          <small class="key-count-text">{{ filteredKeys.length }} / {{ currentLogicMeta.availableKeys.length }} 件表示</small>
        </div>

        <div class="max-h-[440px] overflow-y-auto">
          <Table :columns="keyColumns" :data="filteredKeys" empty-text="該当するキーが見つかりません。">
            <template #cell-key="{ row }">
              <button type="button" class="key-tag-btn inline-flex items-center gap-inline-gap px-inline-gap" @click="copyKey(row.key)">
                <code>{{ row.key }}</code>
                <Icon name="copy" size="sm" />
              </button>
            </template>
            <template #cell-sample="{ row }">
              <span class="sample-text">{{ row.sample }}</span>
            </template>
          </Table>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped lang="scss">
.guide-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.desc-text {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-text-secondary);
}

.tpl-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

.file-info-box {
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg-elevated);
}

.file-name {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

.file-meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.site-chips-box {
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg-sunken);
}

.site-chips-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
}

.site-chip {
  padding: 0 var(--space-1);
  border: var(--border-width-base) solid var(--color-border);

  font-size: var(--font-size-xs);
  color: var(--color-text-main);

  background-color: var(--surface-bg-elevated);
}

.sites-select-box {
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg-sunken);
}

.existing-file-note {
  border: var(--border-width-base) solid var(--color-border);
  background-color: var(--surface-bg-sunken);
}

.selected-file-badge {
  font-size: var(--font-size-xs);
  color: var(--color-text-main);
}

.key-tag-btn {
  height: 1.75rem;
  border: var(--border-width-base) solid var(--color-border);

  color: var(--theme-accent);

  background-color: var(--surface-bg-elevated);

  transition: var(--transition-interactive);

  @include state-interactive;

  &:hover {
    border-color: var(--theme-accent);
    box-shadow: var(--shadow-glow-sm);
  }

  code {
    font-family: var(--font-mono);
    font-weight: var(--font-weight-bold);
  }
}

.key-count-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.sample-text {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
