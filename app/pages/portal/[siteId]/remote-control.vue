<script setup lang="ts">
/**
 * リモコン設定＆帳票出力画面
 * /portal/:siteId/remote-control
 *
 * @description 回路台帳から負荷アドレスを持つ回路を抽出し、
 * グループ（G1〜G127）やパターン（P1〜P72 ON/OFF）への割り当て、
 * およびリモコン設定表テンプレートへの自動流し込み出力を行います。
 */
import { computed, onMounted, ref } from 'vue'

import { useHead, useRoute } from '#app'
import type { RemoteCircuitItem, RemoteExportTarget } from '#shared/types/remoteControl'
import ExcelDropzone from '~/components/portal/admin/ExcelDropzone.vue'
import CircuitSymbol from '~/components/portal/exam/CircuitSymbol.vue'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import { useRemoteControlSetting } from '~/composables/portal/useRemoteControlSetting'
import type { RadioOption, SelectOption, TableColumn, TabOption } from '~/types/components'

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)
const { siteName } = useCurrentSite(siteId)

const pageTitle = computed(() =>
  siteName.value ? `${siteName.value}_リモコン設定` : 'リモコン設定・設定表出力',
)

useHead({
  title: computed(() => `${pageTitle.value} - Elec-Console`),
})

const {
  remoteCircuits,
  banList,
  densoKeiToList,
  config,
  isLoadingData,
  dataError,
  isSaving,
  saveMessage,
  activeGroups,
  activePatterns,
  templateFiles,
  templateFile,
  exportTarget,
  isGenerating,
  generateMessage,
  fetchSiteRemoteData,
  saveRemoteConfig,
  assignGroup,
  removeGroup,
  assignPattern,
  removePattern,
  clearSelectedAssignments,
  handleTemplateFileSelect,
  generateAndDownloadReport,
} = useRemoteControlSetting(siteId, {
  siteName,
})

// --- 左ペイン（リモコン設定・編成）のローカル状態 ---
type TabKey = 'addresses' | 'groups' | 'patterns'
const currentTab = ref<TabKey>('addresses')

const tabOptions = computed<TabOption<TabKey>[]>(() => [
  { label: '負荷アドレス一覧', value: 'addresses', icon: 'list', badge: remoteCircuits.value.length },
  { label: 'グループ編成', value: 'groups', icon: 'box', badge: activeGroups.value.length },
  { label: 'パターン編成', value: 'patterns', icon: 'layout', badge: activePatterns.value.length },
])

const filterDenso = ref<string>('ALL')
const filterBan = ref<string>('ALL')
const hideVacant = ref<boolean>(false)
const searchQuery = ref<string>('')

const sortBy = ref<string>('fukaAddress')
const sortOrder = ref<'asc' | 'desc' | null>('asc')

const selectedAddresses = ref<string[]>([])

const bulkGroupInput = ref<number | null>(null)
const bulkPatternInput = ref<string>('P1 ON')

const patternOptions: SelectOption[] = [
  { value: 'P1 ON', label: 'P1 ON' },
  { value: 'P1 OFF', label: 'P1 OFF' },
  { value: 'P2 ON', label: 'P2 ON' },
  { value: 'P2 OFF', label: 'P2 OFF' },
  { value: 'P3 ON', label: 'P3 ON' },
  { value: 'P3 OFF', label: 'P3 OFF' },
  { value: 'P4 ON', label: 'P4 ON' },
  { value: 'P4 OFF', label: 'P4 OFF' },
  { value: 'P5 ON', label: 'P5 ON' },
  { value: 'P5 OFF', label: 'P5 OFF' },
  { value: 'P6 ON', label: 'P6 ON' },
  { value: 'P6 OFF', label: 'P6 OFF' },
  { value: 'P7 ON', label: 'P7 ON' },
  { value: 'P7 OFF', label: 'P7 OFF' },
  { value: 'P8 ON', label: 'P8 ON' },
  { value: 'P8 OFF', label: 'P8 OFF' },
]

const densoOptions = computed<SelectOption[]>(() => [
  { value: 'ALL', label: `全伝送系統 (${remoteCircuits.value.length}件)` },
  ...densoKeiToList.value.map(d => ({
    value: d,
    label: `伝送系統 ${d} (${remoteCircuits.value.filter(c => c.densoKeiTo === d).length}件)`,
  })),
])

const banOptions = computed<SelectOption[]>(() => [
  { value: 'ALL', label: '全盤対象' },
  ...banList.value.map(b => ({
    value: b,
    label: `${b} (${remoteCircuits.value.filter(c => c.banMeisho === b).length}件)`,
  })),
])

const displayedCircuits = computed(() => {
  const filtered = remoteCircuits.value.filter((c) => {
    if (filterDenso.value !== 'ALL' && c.densoKeiTo !== filterDenso.value) {
      return false
    }
    if (filterBan.value !== 'ALL' && c.banMeisho !== filterBan.value) {
      return false
    }
    if (hideVacant.value && c.isVacant) {
      return false
    }
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.trim().toLowerCase()
      const match = c.fukaAddress.toLowerCase().includes(q)
        || c.banMeisho.toLowerCase().includes(q)
        || c.kairoBangou.toLowerCase().includes(q)
        || c.kairoMeisho.toLowerCase().includes(q)

      if (!match) return false
    }

    return true
  })

  if (!sortBy.value || !sortOrder.value) {
    return filtered
  }

  const key = sortBy.value as keyof RemoteCircuitItem
  const order = sortOrder.value === 'asc' ? 1 : -1

  return [...filtered].sort((a, b) => {
    if (key === 'fukaAddress') {
      const [a1, a2] = a.fukaAddress.split('-').map(Number)
      const [b1, b2] = b.fukaAddress.split('-').map(Number)

      if (a1 !== b1) return ((a1 || 0) - (b1 || 0)) * order

      return ((a2 || 0) - (b2 || 0)) * order
    }

    const valA = String(a[key] ?? '')
    const valB = String(b[key] ?? '')

    return valA.localeCompare(valB, 'ja', { numeric: true }) * order
  })
})

const isAllSelected = computed({
  get: () => displayedCircuits.value.length > 0 && selectedAddresses.value.length === displayedCircuits.value.length,
  set: (val: boolean) => {
    if (val) {
      selectedAddresses.value = displayedCircuits.value.map(c => c.uniqueKey)
    }
    else {
      selectedAddresses.value = []
    }
  },
})

const isPartiallySelected = computed(() => {
  return selectedAddresses.value.length > 0 && selectedAddresses.value.length < displayedCircuits.value.length
})

const circuitColumns = computed<TableColumn<RemoteCircuitItem>[]>(() => {
  const cols: TableColumn<RemoteCircuitItem>[] = [
    { key: 'select', label: '', width: '44px', align: 'center' },
    { key: 'fukaAddress', label: '負荷アドレス', width: '110px', sortable: true },
  ]

  if (densoKeiToList.value.length > 1) {
    cols.push({ key: 'densoKeiTo', label: '系統', width: '70px', sortable: true })
  }

  cols.push(
    { key: 'banMeisho', label: '盤名称', width: '100px', sortable: true },
    { key: 'kairoBangou', label: '回路番号', width: '100px', sortable: true, align: 'center' },
    { key: 'kairoMeisho', label: '負荷名称', truncate: true },
    { key: 'groups', label: '所属グループ', width: '130px' },
    { key: 'patterns', label: '所属パターン', width: '140px' },
  )

  return cols
})

const handleBulkAssignGroup = () => {
  if (selectedAddresses.value.length === 0 || !bulkGroupInput.value) return
  const gNum = Number(bulkGroupInput.value)

  if (gNum >= 1 && gNum <= 127) {
    assignGroup(selectedAddresses.value, gNum)
    bulkGroupInput.value = null
  }
}

const handleBulkAssignPattern = () => {
  if (selectedAddresses.value.length === 0 || !bulkPatternInput.value) return
  assignPattern(selectedAddresses.value, bulkPatternInput.value)
}

const handleBulkClear = () => {
  if (selectedAddresses.value.length === 0) return
  clearSelectedAssignments(selectedAddresses.value)
  selectedAddresses.value = []
}

const getAssignedGroups = (uniqueKey: string, fukaAddr: string): number[] => {
  return config.value.assignments[uniqueKey]?.groups
    || config.value.assignments[fukaAddr]?.groups
    || []
}

const getAssignedPatterns = (uniqueKey: string, fukaAddr: string): string[] => {
  return config.value.assignments[uniqueKey]?.patterns
    || config.value.assignments[fukaAddr]?.patterns
    || []
}

const currentBoardConfig = computed(() => {
  if (currentTab.value === 'groups') {
    return {
      description: '各グループ（G1〜G127）に所属している負荷アドレスの一覧です。Excel出力時はこの一覧が半角スペース2つ区切りで自動反映されます。',
      emptyIcon: 'box' as const,
      emptyTitle: 'グループ編成がありません',
      emptyDesc: '負荷アドレス一覧タブで回路を選択し、G番号を一括追加してください。',
      items: activeGroups.value.map(g => ({
        key: g.groupKey,
        count: g.addresses.length,
        addresses: g.addresses,
        color: 'var(--theme-accent)',
        isAccent: true,
        remove: (addr: string) => removeGroup(addr, g.groupNumber),
      })),
    }
  }
  if (currentTab.value === 'patterns') {
    return {
      description: '各パターン（P1 ON〜P16 OFF）に所属している負荷アドレスの一覧です。',
      emptyIcon: 'layout' as const,
      emptyTitle: 'パターン編成がありません',
      emptyDesc: '負荷アドレス一覧タブで回路を選択し、パターンを一括追加してください。',
      items: activePatterns.value.map(p => ({
        key: p.patternKey,
        count: p.addresses.length,
        addresses: p.addresses,
        color: 'var(--color-status-warning)',
        isAccent: false,
        remove: (addr: string) => removePattern(addr, p.patternKey),
      })),
    }
  }

  return null
})

// --- 右ペイン（Excel出力）のローカル状態 ---
const currentFile = computed(() => {
  if (templateFiles.value) {
    return templateFiles.value[exportTarget.value]
  }

  return templateFile.value ?? null
})

const handleFileUpdate = (file: File | null) => {
  handleTemplateFileSelect(file, exportTarget.value)
}

const exportTargetOptions: RadioOption<RemoteExportTarget>[] = [
  { label: '① アドレス表', value: 'address' },
  { label: '② グループ設定表', value: 'group' },
  { label: '③ パターン設定表', value: 'pattern' },
]

const targetFormatLabel = computed(() => {
  if (exportTarget.value === 'address') return 'アドレス表フォーマット'
  if (exportTarget.value === 'group') return 'グループ設定表フォーマット'

  return 'パターン設定表フォーマット'
})

const downloadButtonLabel = computed(() => {
  if (exportTarget.value === 'address') return '① アドレス表 Excelを出力'
  if (exportTarget.value === 'group') return '② グループ設定表 Excelを出力'

  return '③ パターン設定表 Excelを出力'
})

onMounted(() => {
  fetchSiteRemoteData()
})
</script>

<template>
  <div class="flex flex-col gap-section-gap h-full">
    <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
      <h2 class="flex items-center gap-item-gap">
        <Icon name="sliders" class="text-primary" />
        <span>{{ pageTitle }}</span>
      </h2>
      <div class="flex items-center gap-item-gap">
        <Button variant="tertiary" size="sm" icon="arrow-left" :to="`/portal/${siteId}`">現場ポータルへ戻る</Button>
      </div>
    </header>
    <hr class="divider">

    <Note v-if="dataError" variant="error" :text="dataError" />

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-panel-gap items-start">
      <!-- 左ペイン: リモコン設定・編成 -->
      <section class="lg:col-span-2 flex flex-col gap-panel-gap min-w-0">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="sliders" class="text-primary" />
            <span>リモコン設定・グループ編成</span>
          </h3>
          <div class="flex items-center gap-item-gap">
            <Button variant="primary" size="sm" icon="save" :loading="isSaving" @click="saveRemoteConfig">設定を保存する</Button>
          </div>
        </header>
        <hr class="divider">

        <Note v-if="saveMessage" :variant="saveMessage.type === 'success' ? 'success' : 'error'" :text="saveMessage.text" />

        <Tabs v-model="currentTab" :items="tabOptions" />

        <div v-if="currentTab === 'addresses'" class="flex flex-col gap-item-gap">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-item-gap">
            <div v-if="densoKeiToList.length > 1" class="flex flex-col gap-inline-gap">
              <label for="filter-denso" class="label">伝送系統</label>
              <Select id="filter-denso" v-model="filterDenso" :options="densoOptions" />
            </div>

            <div class="flex flex-col gap-inline-gap">
              <label for="filter-ban" class="label">盤で絞り込み</label>
              <Select id="filter-ban" v-model="filterBan" :options="banOptions" />
            </div>

            <div class="flex flex-col gap-inline-gap">
              <label for="filter-search-query" class="label">キーワード検索 (アドレス・負荷名等)</label>
              <Input id="filter-search-query" v-model="searchQuery" placeholder="0-1, 照明, 1L-1..." icon="search" clearable />
            </div>
          </div>

          <div class="bulk-toolbar flex flex-wrap items-center justify-between gap-item-gap p-item-gap">
            <div class="flex items-center gap-item-gap">
              <Checkbox v-model="isAllSelected" :indeterminate="isPartiallySelected" label="全選択" />
              <Toggle v-model="hideVacant" label="空きを除外" size="sm" />
              <span class="selection-count">選択: {{ selectedAddresses.length }} / {{ displayedCircuits.length }}件</span>
            </div>

            <div class="flex flex-wrap items-center gap-inline-gap">
              <div class="flex items-center gap-inline-gap">
                <span class="toolbar-label">G:</span>
                <Input v-model="bulkGroupInput" type="number" placeholder="1〜127" class="w-20" />
                <Button size="sm" :disabled="selectedAddresses.length === 0 || !bulkGroupInput" @click="handleBulkAssignGroup">グループを追加</Button>
              </div>

              <div class="flex items-center gap-inline-gap">
                <span class="toolbar-label">P:</span>
                <Select v-model="bulkPatternInput" :options="patternOptions" class="w-28" />
                <Button size="sm" :disabled="selectedAddresses.length === 0" @click="handleBulkAssignPattern">パターンを追加</Button>
              </div>

              <Button variant="danger" size="sm" :disabled="selectedAddresses.length === 0" @click="handleBulkClear">一括解除する</Button>
            </div>
          </div>

          <Table v-model:sort-by="sortBy" v-model:sort-order="sortOrder" :columns="circuitColumns" :data="displayedCircuits" :loading="isLoadingData" row-key="uniqueKey" empty-text="該当する負荷アドレスが見つかりません">
            <template #header-select>
              <Checkbox v-model="isAllSelected" :indeterminate="isPartiallySelected" :title="isPartiallySelected ? `${selectedAddresses.length} / ${displayedCircuits.length}件 選択中` : undefined" />
            </template>

            <template #cell-select="{ row }">
              <Checkbox v-model="selectedAddresses" :value="row.uniqueKey" />
            </template>

            <template #cell-fukaAddress="{ row }">
              <strong class="address-text" :class="{ 'is-vacant': row.isVacant }">{{ row.fukaAddress }}</strong>
            </template>

            <template #cell-densoKeiTo="{ row }">
              <Badge variant="gray" size="sm">{{ row.densoKeiTo }}系</Badge>
            </template>

            <template #cell-banMeisho="{ row }">
              <span :class="{ 'is-vacant-text': row.isVacant }">{{ row.banMeisho }}</span>
            </template>

            <template #cell-kairoBangou="{ row }">
              <div v-if="!row.isVacant && (row.kairoBangou !== '-' || row.kairoKigou)" class="symbol-wrapper flex items-center justify-center">
                <CircuitSymbol :kigou="row.kairoKigou" :bangou="row.kairoBangou" />
              </div>
              <span v-else class="empty-mark">-</span>
            </template>

            <template #cell-kairoMeisho="{ row }">
              <Badge v-if="row.isVacant" variant="amber" size="sm">空き</Badge>
              <span v-else class="meisho-text">{{ row.kairoMeisho }}</span>
            </template>

            <template #cell-groups="{ row }">
              <div class="flex flex-wrap items-center gap-inline-gap">
                <span v-for="g in getAssignedGroups(row.uniqueKey, row.fukaAddress)" :key="g" class="inline-flex items-center gap-inline-gap">
                  <Badge variant="purple">G{{ g }}</Badge>
                  <Button variant="tertiary" size="sm" icon="x" class="chip-remove-btn" @click.stop="removeGroup(row.uniqueKey, g)" />
                </span>
                <span v-if="getAssignedGroups(row.uniqueKey, row.fukaAddress).length === 0" class="empty-mark">-</span>
              </div>
            </template>

            <template #cell-patterns="{ row }">
              <div class="flex flex-wrap items-center gap-inline-gap">
                <span v-for="p in getAssignedPatterns(row.uniqueKey, row.fukaAddress)" :key="p" class="inline-flex items-center gap-inline-gap">
                  <Badge variant="amber">{{ p }}</Badge>
                  <Button variant="tertiary" size="sm" icon="x" class="chip-remove-btn" @click.stop="removePattern(row.uniqueKey, p)" />
                </span>
                <span v-if="getAssignedPatterns(row.uniqueKey, row.fukaAddress).length === 0" class="empty-mark">-</span>
              </div>
            </template>
          </Table>
        </div>

        <div v-else-if="currentBoardConfig" class="flex flex-col gap-item-gap">
          <p class="tab-description">
            {{ currentBoardConfig.description }}
          </p>

          <EmptyState v-if="currentBoardConfig.items.length === 0" :icon="currentBoardConfig.emptyIcon" :title="currentBoardConfig.emptyTitle" :description="currentBoardConfig.emptyDesc" />

          <ul v-else class="board-grid grid grid-cols-1 md:grid-cols-2 gap-item-gap">
            <li v-for="card in currentBoardConfig.items" :key="card.key" class="board-card p-item-gap flex flex-col gap-inline-gap">
              <div class="flex justify-between items-center">
                <strong class="card-title" :class="card.isAccent ? 'is-accent' : 'is-warning'">{{ card.key }}</strong>
                <span class="card-count">{{ card.count }}回路</span>
              </div>

              <div class="flex flex-wrap items-center gap-inline-gap">
                <span v-for="addr in card.addresses" :key="addr" class="inline-flex items-center gap-inline-gap">
                  <Badge :variant="card.isAccent ? 'purple' : 'amber'">{{ addr }}</Badge>
                  <Button variant="tertiary" size="sm" icon="x" class="chip-remove-btn" @click="card.remove(addr)" />
                </span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- 右ペイン: リモコン設定表 Excel出力 -->
      <section class="panel lg:col-span-1 flex flex-col gap-panel-gap">
        <header class="flex items-center justify-between gap-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="file-spreadsheet" class="text-primary" />
            <span>リモコン設定表 Excel出力</span>
          </h3>
          <div v-if="siteId" class="flex items-center gap-item-gap">
            <Button icon="key" :to="`/portal/${siteId}/template-keys`" target="_blank">出力キー一覧</Button>
          </div>
        </header>

        <hr class="divider">

        <Note v-if="generateMessage" :variant="generateMessage.type === 'success' ? 'success' : 'error'" :text="generateMessage.text" />

        <div class="flex flex-col gap-item-gap">
          <header class="flex items-center gap-item-gap">
            <h4 class="flex items-center gap-item-gap">
              <Icon name="info" class="text-primary" />
              <span>1. 設定サマリー (DB連動)</span>
            </h4>
          </header>
          <hr class="divider">

          <div class="grid grid-cols-3 gap-item-gap">
            <div class="summary-tile flex flex-col items-center justify-center gap-inline-gap">
              <span class="summary-tile__title">負荷アドレス</span>
              <span class="summary-tile__value text-accent">{{ remoteCircuits.length }}</span>
            </div>

            <div class="summary-tile flex flex-col items-center justify-center gap-inline-gap">
              <span class="summary-tile__title">編成グループ</span>
              <div class="summary-tile__value text-primary flex items-baseline gap-0.5">
                <span>{{ activeGroups.length }}</span>
                <span class="summary-tile__unit">組</span>
              </div>
            </div>

            <div class="summary-tile flex flex-col items-center justify-center gap-inline-gap">
              <span class="summary-tile__title">編成パターン</span>
              <div class="summary-tile__value text-warning flex items-baseline gap-0.5">
                <span>{{ activePatterns.length }}</span>
                <span class="summary-tile__unit">種</span>
              </div>
            </div>
          </div>
        </div>

        <hr class="divider">

        <div class="flex flex-col gap-inline-gap">
          <span class="label">2. 出力対象 (3パターン)</span>
          <div class="flex flex-wrap gap-panel-gap">
            <Radio
              v-for="opt in exportTargetOptions"
              :key="opt.value"
              v-model="exportTarget"
              :value="opt.value"
              :label="opt.label"
              :disabled="isGenerating"
              name="export-target"
            />
          </div>
          <small class="text-note">※データベースから取得したアドレス表、および設定したグループ・パターンの3パターンから選んで出力できます。</small>
        </div>

        <hr class="divider">

        <div class="flex flex-col gap-inline-gap">
          <span class="label">3. {{ targetFormatLabel }} (.xlsx)</span>
          <ExcelDropzone :model-value="currentFile" :disabled="isGenerating" accept=".xlsx, .xlsm" @update:model-value="handleFileUpdate" />
          <small class="text-note">※ご用意いただいた{{ targetFormatLabel }}のExcelファイルを指定してください。フォーマットがセットされると出力可能になります。</small>
        </div>

        <div class="flex flex-col gap-item-gap mt-auto">
          <Button variant="primary" icon="printer" block :disabled="!currentFile || remoteCircuits.length === 0 || isGenerating" :loading="isGenerating" @click="generateAndDownloadReport(exportTarget)">{{ downloadButtonLabel }}</Button>
          <small v-if="!currentFile" class="text-center text-warning-note">※{{ targetFormatLabel }}がセットされていないため出力できません</small>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bulk-toolbar {
  border: var(--border-width-base) solid var(--color-border);
  background: var(--surface-bg-sunken);
}

.selection-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.toolbar-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.address-text {
  font-family: var(--font-mono);
  color: var(--theme-accent);

  &.is-vacant {
    color: var(--color-text-muted);
    opacity: 0.6;
  }
}

.system-tag {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.symbol-wrapper {
  min-height: 2.2em;
}

.meisho-text {
  white-space: pre-line;
}

.vacant-badge {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  opacity: 0.7;
}

.is-vacant-text {
  color: var(--color-text-muted);
}

.chip-remove-btn {
  padding: 0.1em 0.3em;
  font-size: var(--font-size-xs);
  line-height: var(--line-height-tight);
}

.empty-mark {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.tab-description {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.board-grid {
  overflow-y: auto;
  max-height: 35rem;
}

.board-card {
  border: var(--border-width-base) solid var(--color-border);
  background: var(--surface-bg-sunken);
}

.card-title {
  font-family: var(--font-mono);
  font-size: var(--font-size-base);

  &.is-accent {
    color: var(--theme-accent);
  }

  &.is-warning {
    color: var(--color-status-warning);
  }
}

.card-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.summary-tile {
  padding: var(--space-1) var(--space-2);
  border: var(--border-width-base) solid var(--color-border);
  background: var(--surface-bg);
  box-shadow: var(--shadow-sink);

  &__title {
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);
  }

  &__value {
    font-family: var(--font-mono);
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
    line-height: var(--line-height-tight);
    color: var(--color-text-main);
  }

  &__unit {
    font-family: var(--font-base);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-normal);
    color: var(--color-text-secondary);
  }
}

.text-note {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
