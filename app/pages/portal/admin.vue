<script setup lang="ts">
/**
 * 現場管理コンソール
 * 現場管理者・マスター向けの現場プロジェクト管理画面。
 * 左ペイン（現場一覧・検索・新規登録）と右ペイン（現場詳細設定・Excelデータ連携・除外ルール）を1ファイルに統合。
 */
import { computed, onMounted, reactive, ref, toRef, watch } from 'vue'

import { useHead } from '#app'
import type { Site, SiteStatus } from '#shared/types/site'
import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useAdminUsers } from '~/composables/admin/useAdminUsers'
import { useSiteExcelSync } from '~/composables/portal/useSiteExcelSync'
import { useModal } from '~/composables/useModal'
import {
  SITE_SETTINGS_TABS,
  SITE_STATUS_CONFIG,
  SITE_STATUS_OPTIONS,
} from '~/constants/adminConstants'
import type { RadioOption } from '~/types/components'
import { parseToAppException } from '~/utils/errors'
import { getAssignedWorkerNames } from '~/utils/portal'

useHead({ title: '現場ポータル管理 - Elec-Console' })

definePageMeta({
  middleware: ['admin'],
})

interface CreateSiteFormState {
  id: string
  name: string
  status: SiteStatus
}

type StatusFilterType = 'all' | SiteStatus

const INITIAL_CREATE_SITE: CreateSiteFormState = {
  id: '',
  name: '',
  status: 'planning',
}

const { sites, isLoaded, fetchSites, createSite, toggleDisableSite, updateSite, deleteSite } = useAdminSites()
const { users, fetchUsers } = useAdminUsers()
const { askConfirm } = useModal()

// --- 状態宣言（State） ---
const selectedSiteId = ref<string | null>(null)
const isSaving = ref(false)
const isCreateModalOpen = ref(false)
const isCreatingSite = ref(false)
const newSite = ref<CreateSiteFormState>({ ...INITIAL_CREATE_SITE })
const fieldErrors = ref({ id: '', name: '' })
const isDeletingSite = ref(false)

// --- 左ペイン（検索・絞り込み） ---
const searchQuery = ref('')
const statusFilter = ref<StatusFilterType>('all')

const filterOptions: RadioOption<StatusFilterType>[] = [
  { label: 'すべて', value: 'all' },
  { label: '進行中', value: 'in_progress' },
  { label: '計画中', value: 'planning' },
  { label: '完了', value: 'completed' },
]

const filteredSites = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const filter = statusFilter.value

  return sites.value.filter((site) => {
    if (filter !== 'all' && site.status !== filter) {
      return false
    }
    if (query) {
      const matchName = site.name?.toLowerCase().includes(query)
      const matchId = site.id?.toLowerCase().includes(query)

      if (!matchName && !matchId) return false
    }

    return true
  })
})

// --- 右ペイン（詳細設定） ---
const selectedSite = computed<Site | null>(() => {
  if (!selectedSiteId.value) return null

  return sites.value.find(s => s.id === selectedSiteId.value) || null
})

const activeTab = ref('basic')

const hasExcelPath = computed(() =>
  Boolean((selectedSite.value?.excelPath || (selectedSite.value as unknown as { settings?: { excelPath?: string } })?.settings?.excelPath)?.trim()),
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
  site: toRef(() => selectedSite.value),
})

const form = reactive({
  name: '',
  status: 'planning' as Site['status'],
  excludedCircuits: [] as string[],
  noBreakWords: [] as string[],
})

const workerNames = computed(() =>
  getAssignedWorkerNames(selectedSite.value?.id, users.value),
)

// --- 監視（Watch） ---
watch(
  sites,
  (loadedSites) => {
    if (loadedSites.length > 0) {
      if (!selectedSiteId.value || !loadedSites.some(s => s.id === selectedSiteId.value)) {
        selectedSiteId.value = loadedSites[0]?.id || null
      }
    }
    else {
      selectedSiteId.value = null
    }
  },
  { immediate: true },
)

watch(
  selectedSite,
  async (newSite) => {
    if (newSite) {
      form.name = newSite.name || ''
      form.status = newSite.status || 'planning'
      form.excludedCircuits = [...(newSite.excludedCircuits || [])]
      form.noBreakWords = [...(newSite.noBreakWords || [])]

      if (users.value.length === 0) {
        await fetchUsers()
      }
    }
  },
  { immediate: true },
)

// --- ライフサイクル（Lifecycle） ---
onMounted(async () => {
  if (!isLoaded?.value) {
    await fetchSites()
  }
})

// --- アクションハンドラ（Actions） ---
const handleSelectSite = (site: Site) => {
  selectedSiteId.value = site.id
}

const handleAddExcludedCircuit = () => {
  form.excludedCircuits.push('')
}

const handleRemoveExcludedCircuit = (index: number) => {
  form.excludedCircuits.splice(index, 1)
}

const handleUpdateExcludedCircuit = (index: number, val: string | number | null | undefined) => {
  form.excludedCircuits[index] = String(val ?? '')
}

const handleAddNoBreakWord = () => {
  form.noBreakWords.push('')
}

const handleRemoveNoBreakWord = (index: number) => {
  form.noBreakWords.splice(index, 1)
}

const handleUpdateNoBreakWord = (index: number, val: string | number | null | undefined) => {
  form.noBreakWords[index] = String(val ?? '')
}

const handleSaveSite = async () => {
  if (!selectedSite.value) return

  const parsedCircuits = form.excludedCircuits
    .map(c => c.trim())
    .filter(c => c.length > 0)

  const parsedWords = form.noBreakWords
    .map(w => w.trim())
    .filter(w => w.length > 0)

  const payload: Site = {
    ...selectedSite.value,
    name: form.name.trim(),
    status: form.status,
    excludedCircuits: parsedCircuits,
    noBreakWords: parsedWords,
  }

  isSaving.value = true
  try {
    const originalId = selectedSite.value.id

    await updateSite(originalId, payload)
    if (payload.id && payload.id !== originalId) {
      selectedSiteId.value = payload.id
    }
  }
  catch (e: unknown) {
    const appErr = parseToAppException(e)

    alert(appErr.getUserFacingMessage())
  }
  finally {
    isSaving.value = false
  }
}

const openCreateModal = () => {
  fieldErrors.value = { id: '', name: '' }
  newSite.value = { ...INITIAL_CREATE_SITE }
  isCreateModalOpen.value = true
}

const handleCreateSite = async () => {
  fieldErrors.value = { id: '', name: '' }
  const id = newSite.value.id.trim()
  const name = newSite.value.name.trim()

  let hasError = false

  if (!id) {
    fieldErrors.value.id = '現場IDを入力してください。'
    hasError = true
  }
  if (!name) {
    fieldErrors.value.name = '現場名を入力してください。'
    hasError = true
  }
  if (hasError) return

  try {
    isCreatingSite.value = true
    await createSite({ id, name, status: newSite.value.status })
    selectedSiteId.value = id
    isCreateModalOpen.value = false
    newSite.value = { ...INITIAL_CREATE_SITE }
  }
  catch (e: unknown) {
    const appErr = parseToAppException(e)

    fieldErrors.value.name = appErr.getUserFacingMessage()
  }
  finally {
    isCreatingSite.value = false
  }
}

const confirmToggleDisable = async (row: Site) => {
  const isCurrentlyDisabled = !row.disabledAt

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

const confirmDeleteSite = async (site: Site) => {
  const isConfirmed = await askConfirm({
    title: '現場の完全削除（全データ消去）',
    message: `【警告】現場「${site.name}」(ID: ${site.id}) を完全に削除しますか？\n\n現場に紐づくすべての回路データ・試験測定記録・工程カレンダーなどの全データが完全に消去されます。元に戻すことはできませんが、本当によろしいですか？`,
    confirmText: 'すべて消去して削除する',
    intent: 'danger',
  })

  if (isConfirmed) {
    isDeletingSite.value = true
    try {
      await deleteSite(site.id)
      if (selectedSiteId.value === site.id) {
        const remaining = sites.value.filter(s => s.id !== site.id)

        selectedSiteId.value = remaining[0]?.id || null
      }
    }
    catch (e: unknown) {
      const appErr = parseToAppException(e)

      alert(appErr.getUserFacingMessage())
    }
    finally {
      isDeletingSite.value = false
    }
  }
}
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-section-gap items-start">
    <!-- 左ペイン: 現場一覧・検索 -->
    <aside class="w-full lg:w-[340px] shrink-0 flex flex-col gap-panel-gap min-h-0">
      <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
        <h3 class="flex items-center gap-item-gap">
          <Icon name="building" class="text-primary" />
          <span>現場プロジェクト</span>
        </h3>
        <div class="flex items-center gap-item-gap">
          <Button
            icon="plus"
            @click="openCreateModal"
          >
            新規登録
          </Button>
        </div>
      </header>
      <hr class="divider">

      <Input
        v-model="searchQuery"
        placeholder="現場名・IDで検索..."
      />

      <div class="radio-group w-full">
        <button
          v-for="opt in filterOptions"
          :key="String(opt.value)"
          type="button"
          class="radio-group-item"
          :class="{ 'is-active': statusFilter === opt.value }"
          @click="statusFilter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>

      <ul
        v-if="filteredSites.length > 0"
        class="flex flex-col gap-item-gap overflow-y-auto flex-1 min-h-[300px]"
      >
        <li
          v-for="site in filteredSites"
          :key="site.id"
        >
          <div
            class="panel p-panel-pad-compact site-item-panel flex items-center justify-between gap-panel-gap w-full"
            :class="{ 'is-disabled': Boolean(site.disabledAt), 'is-active': site.id === selectedSiteId }"
          >
            <button
              type="button"
              class="site-select-btn flex-1 min-w-0 flex flex-col gap-inline-gap text-left"
              :disabled="Boolean(site.disabledAt)"
              @click="handleSelectSite(site)"
            >
              <div class="flex items-center gap-item-gap">
                <span class="site-name">
                  {{ site.name }}
                </span>
                <span class="badge" :style="{ '--glow-color': SITE_STATUS_CONFIG[site.status]?.color }">
                  {{ SITE_STATUS_CONFIG[site.status]?.label }}
                </span>
                <span v-if="site.disabledAt" class="badge" :style="{ '--glow-color': 'var(--color-status-danger)' }">
                  無効
                </span>
              </div>
              <div class="site-id">
                ID: {{ site.id }}
              </div>
            </button>

            <Button
              class="shrink-0"
              :variant="site.disabledAt ? 'success' : 'danger'"
              @click="confirmToggleDisable(site)"
            >
              {{ site.disabledAt ? '有効化' : '無効化' }}
            </Button>
          </div>
        </li>
      </ul>

      <EmptyState
        v-else
        icon="search"
        title="該当する現場がありません"
        description="検索条件を変更するか、新規現場を登録してください。"
      />
    </aside>

    <hr class="divider is-vertical is-solid hidden lg:block self-stretch">

    <!-- 右ペイン: 現場詳細設定 -->
    <section class="panel flex-1 min-w-0">
      <EmptyState
        v-if="!selectedSite"
        icon="layout"
        title="現場が選択されていません"
        description="左側の現場一覧から、設定やデータ連携を行う現場を選択してください。"
        class="min-h-[400px] flex items-center justify-center"
      />

      <div v-else class="flex flex-col gap-panel-gap">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="settings" class="text-primary" />
            <span class="flex items-baseline gap-item-gap">
              <span>{{ selectedSite.name }}</span>
              <span class="site-id">
                (ID: {{ selectedSite.id }})
              </span>
            </span>
          </h3>

          <div class="flex items-center gap-item-gap">
            <Button
              variant="danger"
              icon="trash-2"
              :loading="isDeletingSite"
              @click="confirmDeleteSite(selectedSite)"
            >
              削除
            </Button>
            <Button
              variant="success"
              icon="save"
              :loading="isSaving"
              @click="handleSaveSite"
            >
              変更を保存
            </Button>
          </div>
        </header>
        <hr class="divider">

        <nav class="tabs flex items-center gap-inline-gap overflow-x-auto">
          <button
            v-for="item in SITE_SETTINGS_TABS"
            :key="item.value"
            type="button"
            class="tabs-item"
            :class="{ 'is-active': activeTab === item.value }"
            @click="activeTab = item.value"
          >
            <Icon v-if="item.icon" :name="item.icon" size="sm" />
            <span>{{ item.label }}</span>
          </button>
        </nav>

        <!-- 基本情報タブ -->
        <form v-if="activeTab === 'basic'" class="flex flex-col gap-form-row-gap max-w-xl" @submit.prevent="handleSaveSite">
          <header class="flex items-center gap-item-gap">
            <h4 class="flex items-center gap-item-gap">
              <Icon name="info" class="text-primary" />
              <span>現場基本情報</span>
            </h4>
          </header>
          <hr class="divider">

          <div class="flex flex-col gap-inline-gap">
            <label for="site-id-display" class="label">現場ID (変更不可)</label>
            <Input
              id="site-id-display"
              :model-value="selectedSite.id"
              disabled
            />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="site-name-input" class="label">現場名</label>
            <Input
              id="site-name-input"
              v-model="form.name"
              placeholder="例: 新宿プロジェクト"
            />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="site-status-select" class="label">ステータス</label>
            <Select
              id="site-status-select"
              v-model="form.status"
              :options="SITE_STATUS_OPTIONS"
            />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <span class="label">アサイン済作業者</span>
            <ul
              v-if="workerNames.length > 0"
              class="flex flex-wrap items-center gap-item-gap"
            >
              <li
                v-for="worker in workerNames"
                :key="worker"
              >
                <span class="inline-flex items-center worker-name">
                  {{ worker }}
                </span>
              </li>
            </ul>
            <EmptyState
              v-else
              icon="users"
              title="アサインされている作業者はいません"
              description="ユーザー管理画面から作業者をアサインしてください。"
            />
          </div>
        </form>

        <!-- Excel連携タブ -->
        <div v-else-if="activeTab === 'integration'" class="flex flex-col gap-panel-gap">
          <section class="flex flex-col gap-panel-gap">
            <header>
              <h4 class="flex items-center gap-item-gap">
                <Icon name="cloud-upload" class="text-primary" />
                <span>Excelデータ取込 (差分同期 / 初期設定)</span>
              </h4>
            </header>
            <hr class="divider">
            <p class="desc-text">
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
          </section>

          <section class="flex flex-col gap-panel-gap">
            <header>
              <h4 class="flex items-center gap-item-gap">
                <Icon name="file-spreadsheet" class="text-primary" />
                <span>最新結果の帳票出力</span>
              </h4>
            </header>
            <hr class="divider">
            <small>
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
              <small v-if="!hasExcelPath">
                ※ 現場設定にExcel台帳ファイルが登録されていないため、ダウンロードできません
              </small>
            </div>
          </section>

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

          <Alert
            v-else-if="syncResultData"
            variant="success"
            :title="syncResultData.title"
          >
            <div class="flex flex-wrap items-center gap-item-gap">
              <template v-if="syncResultData.type === 'merge'">
                <span>追加: <strong class="text-success">+{{ syncResultData.createdCount ?? 0 }}</strong> 件</span>
                <span>変更: <strong class="text-warning">{{ syncResultData.updatedCount ?? 0 }}</strong> 件</span>
                <small class="text-muted">
                  全回路数: {{ syncResultData.count }} 件
                </small>
              </template>
              <template v-else-if="syncResultData.type === 'reset'">
                <span>取込総数: <strong>{{ syncResultData.count }}</strong> 件</span>
              </template>
            </div>
          </Alert>
        </div>

        <!-- 除外回路ルールタブ -->
        <div v-else-if="activeTab === 'rules'" class="flex flex-col gap-form-row-gap max-w-xl">
          <header class="flex items-center gap-item-gap">
            <h4 class="flex items-center gap-item-gap">
              <Icon name="slash" class="text-primary" />
              <span>除外回路の設定</span>
            </h4>
          </header>
          <hr class="divider">
          <p class="desc-text">
            計算や試験連携の対象外とする盤・回路を指定します。
          </p>

          <ul
            v-if="form.excludedCircuits.length > 0"
            class="flex flex-col gap-item-gap"
          >
            <li
              v-for="(circuit, idx) in form.excludedCircuits"
              :key="idx"
              class="flex items-center gap-item-gap"
            >
              <Input
                :model-value="circuit"
                placeholder="例: 盤A-回路1"
                @update:model-value="handleUpdateExcludedCircuit(idx, $event)"
              />
              <Button
                icon="trash-2"
                variant="danger"
                @click="handleRemoveExcludedCircuit(idx)"
              />
            </li>
          </ul>

          <EmptyState
            v-else
            icon="slash"
            title="除外回路は設定されていません"
            description="すべての回路が計算・連携の対象となります。"
          />

          <Button
            icon="plus"
            class="w-fit"
            @click="handleAddExcludedCircuit"
          >
            除外回路を追加する
          </Button>
        </div>

        <!-- 改行禁止ワードタブ -->
        <div v-else-if="activeTab === 'wordBreak'" class="flex flex-col gap-form-row-gap max-w-xl">
          <header class="flex items-center gap-item-gap">
            <h4 class="flex items-center gap-item-gap">
              <Icon name="type" class="text-primary" />
              <span>改行禁止ワードの設定</span>
            </h4>
          </header>
          <hr class="divider">
          <p class="desc-text">
            テーブルの盤名称等で途中で改行させない単語を指定します（※「1-1」等の英数字ハイフンや「分電盤」等はシステムで自動処理されます）。
          </p>

          <ul
            v-if="form.noBreakWords.length > 0"
            class="flex flex-col gap-item-gap"
          >
            <li
              v-for="(word, idx) in form.noBreakWords"
              :key="idx"
              class="flex items-center gap-item-gap"
            >
              <Input
                :model-value="word"
                placeholder="例: 自動倉庫, 受変電設備"
                @update:model-value="handleUpdateNoBreakWord(idx, $event)"
              />
              <Button
                icon="trash-2"
                variant="danger"
                @click="handleRemoveNoBreakWord(idx)"
              />
            </li>
          </ul>

          <EmptyState
            v-else
            icon="type"
            title="改行禁止ワードは設定されていません"
            description="現場固有の単語を追加すると、テーブル内で途中で改行されなくなります。"
          />

          <Button
            icon="plus"
            class="w-fit"
            @click="handleAddNoBreakWord"
          >
            改行禁止ワードを追加する
          </Button>
        </div>
      </div>
    </section>
  </div>

  <!-- 新規現場登録モーダル -->
  <Modal
    v-model="isCreateModalOpen"
    title="新規現場登録"
    icon="circle-plus"
  >
    <template #actions>
      <Button @click="isCreateModalOpen = false">
        キャンセル
      </Button>
      <Button
        variant="success"
        :loading="isCreatingSite"
        @click="handleCreateSite"
      >
        登録する
      </Button>
    </template>

    <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleCreateSite">
      <div class="flex flex-col gap-inline-gap">
        <label for="create-site-id" class="label">現場ID (半角英数)</label>
        <Input id="create-site-id" v-model="newSite.id" placeholder="例: site-tokyo-01" />
        <p v-if="fieldErrors.id" class="error-text">
          {{ fieldErrors.id }}
        </p>
      </div>
      <div class="flex flex-col gap-inline-gap">
        <label for="create-site-name" class="label">現場名</label>
        <Input id="create-site-name" v-model="newSite.name" placeholder="例: 新宿プロジェクト" />
        <p v-if="fieldErrors.name" class="error-text">
          {{ fieldErrors.name }}
        </p>
      </div>
    </form>
  </Modal>
</template>

<style scoped lang="scss">
.site-item-panel {
  transition: var(--transition-panel);
}

.site-select-btn {
  padding: 0;
  border: none;

  font: inherit;
  color: inherit;

  background: transparent;

  @include state-interactive;

  &:hover:not(:disabled) .site-name {
    color: var(--theme-accent);
  }

  @include state-disabled;
}

.site-name {
  font-weight: var(--font-weight-medium);
  transition: color var(--transition-fast);
}

.site-id {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.error-text {
  font-size: var(--font-size-xs);
  color: var(--color-status-danger);
}

.worker-name {
  padding: 0.1em var(--space-inline-gap);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.desc-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
