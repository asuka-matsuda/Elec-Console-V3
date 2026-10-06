<script setup lang="ts">
/**
 * 統合帳票出力ページ
 * /portal/:siteId/reports
 *
 * @description タグ・線名札、送電試験結果、リモコン設定表の各帳票出力および
 * テンプレートキー一覧をタブ切り替えで一元管理します。
 */
import { computed, onMounted, ref, watch } from 'vue'

import { useHead, useRoute, useRouter } from '#app'
import type { RemoteExportTarget } from '#shared/types/remoteControl'
import ExcelDropzone from '~/components/portal/admin/ExcelDropzone.vue'
import ModalMeasurementDevices from '~/components/portal/exam/ModalMeasurementDevices.vue'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import { useExamReportPrint } from '~/composables/portal/useExamReportPrint'
import { useMeasurementDevices } from '~/composables/portal/useMeasurementDevices'
import { useRemoteControlSetting } from '~/composables/portal/useRemoteControlSetting'
import { useTagReportPrint } from '~/composables/portal/useTagReportPrint'
import type { RadioOption, TableColumn, TabOption } from '~/types/components'
import type { DynamicTagField } from '~/utils/tagReportExcel'

type ReportTab = 'tag' | 'exam' | 'remote' | 'keys'

const route = useRoute()
const router = useRouter()
const siteId = computed(() => route.params.siteId as string)
const { site, siteName } = useCurrentSite(siteId)

const pageTitle = computed(() =>
  siteName.value ? `${siteName.value}_帳票出力` : '帳票出力',
)

useHead({
  title: computed(() => `${pageTitle.value} - Elec-Console`),
})

// --- タブ管理 ---
const validTabs: ReportTab[] = ['tag', 'exam', 'remote', 'keys']
const initialTab = (validTabs.includes(route.query.tab as ReportTab) ? route.query.tab : 'tag') as ReportTab
const currentTab = ref<ReportTab>(initialTab)

const tabOptions: TabOption<ReportTab>[] = [
  { value: 'tag', label: 'タグ・線名札', icon: 'tag' },
  { value: 'exam', label: '送電試験結果', icon: 'zap' },
  { value: 'remote', label: 'リモコン設定表', icon: 'sliders' },
  { value: 'keys', label: 'テンプレートキー一覧', icon: 'key' },
]

const switchTab = (tab: string | number) => {
  const target = tab as ReportTab

  currentTab.value = target
  router.replace({ query: { ...route.query, tab: target } })
}

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && validTabs.includes(newTab as ReportTab) && newTab !== currentTab.value) {
      currentTab.value = newTab as ReportTab
    }
  },
)

// --- 1. タグ・線名札出力 Composable ---
const {
  dynamicHeaders,
  filteredRows: tagFilteredRows,
  isLoadingData: isTagLoading,
  dataError: tagDataError,
  templateFile: tagTemplateFile,
  selectedKeiTo: tagSelectedKeiTo,
  selectedBan: tagSelectedBan,
  flowDirection: tagFlowDirection,
  isGenerating: isTagGenerating,
  message: tagMessage,
  banOptions: tagBanOptions,
  keiToOptions: tagKeiToOptions,
  flowDirectionOptions: tagFlowDirectionOptions,
  summary: tagSummary,
  fetchSiteData: fetchTagSiteData,
  handleTemplateFileSelect: handleTagTemplateFileSelect,
  generateReport: generateTagReport,
} = useTagReportPrint(siteId, { siteName })

// --- 2. 送電試験結果出力 Composable ---
const hasSiteSettingExcel = computed(() => Boolean(site.value?.excelPath?.trim()))

const {
  devices,
  selectedMeggerId,
  selectedVoltmeterId,
  selectedPhaseDetectorId,
  isDevicesModalOpen,
  meggerOptions,
  voltmeterOptions,
  phaseDetectorOptions,
  currentSelectedDevices,
  selectedDevicesMap,
  fetchMeasurementDevices,
  onDeviceSelectionChange,
  onDevicesUpdated,
} = useMeasurementDevices(siteId)

const {
  isLoadingCircuits: isExamLoading,
  circuitsError: examCircuitsError,
  selectedBan: examSelectedBan,
  isGenerating: isExamGenerating,
  message: examMessage,
  banList: examBanList,
  banOptions: examBanOptions,
  fetchCircuits: fetchExamCircuits,
  generateReport: generateExamReport,
} = useExamReportPrint(siteId, { siteName, hasSiteSettingExcel })

const handleExamGenerate = () => {
  generateExamReport(selectedDevicesMap.value)
}

// --- 3. リモコン設定表出力 Composable ---
const {
  remoteCircuits,
  activeGroups,
  activePatterns,
  exportTarget: remoteExportTarget,
  templateFiles: remoteTemplateFiles,
  templateFile: remoteTemplateFile,
  isGenerating: isRemoteGenerating,
  generateMessage: remoteGenerateMessage,
  fetchSiteRemoteData,
  handleTemplateFileSelect: handleRemoteTemplateFileSelect,
  generateAndDownloadReport: generateRemoteReport,
} = useRemoteControlSetting(siteId, { siteName })

const remoteExportTargetOptions: RadioOption<RemoteExportTarget>[] = [
  { label: '① アドレス表', value: 'address' },
  { label: '② グループ設定表', value: 'group' },
  { label: '③ パターン設定表', value: 'pattern' },
]

const currentRemoteFile = computed(() => {
  if (remoteTemplateFiles.value) {
    return remoteTemplateFiles.value[remoteExportTarget.value]
  }

  return remoteTemplateFile.value ?? null
})

const handleRemoteFileUpdate = (file: File | null) => {
  handleRemoteTemplateFileSelect(file, remoteExportTarget.value)
}

const remoteFormatLabel = computed(() => {
  if (remoteExportTarget.value === 'address') return 'アドレス表フォーマット'
  if (remoteExportTarget.value === 'group') return 'グループ設定表フォーマット'

  return 'パターン設定表フォーマット'
})

const remoteDownloadButtonLabel = computed(() => {
  if (remoteExportTarget.value === 'address') return '① アドレス表 Excelを出力'
  if (remoteExportTarget.value === 'group') return '② グループ設定表 Excelを出力'

  return '③ パターン設定表 Excelを出力'
})

// --- 4. テンプレートキー一覧用状態 ---
const searchQuery = ref('')
const toast = useToast()

const allAvailableKeys = computed<DynamicTagField[]>(() => {
  const list: DynamicTagField[] = [
    {
      key: '出力日時',
      tag: '%出力日時%',
      colIndex: 0,
      sampleValue: '2026/10/05',
    },
    ...dynamicHeaders.value,
  ]

  return list
})

const filteredKeys = computed(() => {
  if (!searchQuery.value.trim()) {
    return allAvailableKeys.value
  }

  const q = searchQuery.value.trim().toLowerCase()

  return allAvailableKeys.value.filter((k) => {
    return (
      k.key.toLowerCase().includes(q)
      || k.tag.toLowerCase().includes(q)
      || (k.sampleValue && k.sampleValue.toLowerCase().includes(q))
    )
  })
})

const keyColumns: TableColumn<DynamicTagField>[] = [
  { key: 'tag', label: 'テンプレートキー記法', width: '220px' },
  { key: 'key', label: '対応するExcel列見出し', width: '240px' },
  { key: 'sampleValue', label: 'データ例（プレビュー）' },
  { key: 'actions', label: '', width: '120px', align: 'center' },
]

const copyKey = async (tag: string) => {
  try {
    await navigator.clipboard.writeText(tag)
    toast.success(`「${tag}」をコピーしました`)
  }
  catch (err) {
    console.warn('Clipboard copy failed', err)
  }
}

onMounted(() => {
  fetchTagSiteData()
  fetchExamCircuits()
  fetchMeasurementDevices()
  fetchSiteRemoteData()
})
</script>

<template>
  <div class="flex flex-col gap-section-gap min-h-full">
    <header class="flex flex-col gap-item-gap shrink-0">
      <div class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
        <h2 class="flex items-center gap-item-gap">
          <Icon name="printer" />
          <span>{{ pageTitle }}</span>
        </h2>
        <div class="flex items-center gap-item-gap">
          <Button variant="tertiary" size="sm" icon="arrow-left" :to="`/portal/${siteId}`">現場ポータルへ戻る</Button>
        </div>
      </div>
      <hr class="divider">
    </header>

    <Tabs :model-value="currentTab" :items="tabOptions" @update:model-value="switchTab" />

    <!-- タブ1: タグ・線名札出力 -->
    <section v-if="currentTab === 'tag'" class="flex flex-col gap-panel-gap">
      <Note v-if="tagDataError" variant="error" :text="tagDataError" />
      <Note v-if="tagMessage" :variant="tagMessage.type === 'error' ? 'error' : 'success'" :text="tagMessage.text" />

      <form class="panel flex flex-col gap-panel-gap max-w-4xl" @submit.prevent="generateTagReport">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="tag" />
            <span>タグ・線名札 Excel出力設定</span>
          </h3>
          <span class="text-note">
            出力対象: <strong>{{ tagSummary.filteredTotal }}</strong> / 全{{ tagSummary.total }}件
          </span>
        </header>

        <p class="guide-text">
          ご用意いただいたA4タグ枠テンプレートに、現場台帳の回路データを1枠ずつ差し込んでExcelを生成します。1ページを超える場合は自動で改ページされます。
        </p>
        <hr class="divider">

        <div class="flex flex-col gap-inline-gap">
          <span class="label">1. タグ用フォーマット (A4テンプレートExcel)</span>
          <ExcelDropzone :model-value="tagTemplateFile" :disabled="isTagGenerating" @update:model-value="handleTagTemplateFileSelect" />
          <small class="text-note">※A4タグ枠が配置されたExcelファイル（.xlsx）を指定してください。</small>
        </div>

        <hr class="divider">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-panel-gap">
          <div class="flex flex-col gap-inline-gap">
            <label for="tag-filter-keito" class="label">系統で絞り込み</label>
            <Select id="tag-filter-keito" v-model="tagSelectedKeiTo" :options="tagKeiToOptions" :disabled="isTagGenerating || isTagLoading" />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="tag-filter-ban" class="label">盤で絞り込み</label>
            <Select id="tag-filter-ban" v-model="tagSelectedBan" :options="tagBanOptions" :disabled="isTagGenerating || isTagLoading" />
          </div>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="tag-flow-direction" class="label">タグ枠への流し込み順</label>
          <Select id="tag-flow-direction" v-model="tagFlowDirection" :options="tagFlowDirectionOptions" :disabled="isTagGenerating || isTagLoading" />
        </div>

        <hr class="divider">

        <Button type="submit" variant="primary" icon="download" block :disabled="!tagTemplateFile || tagFilteredRows.length === 0 || isTagGenerating" :loading="isTagGenerating">タグExcelを出力 ({{ tagFilteredRows.length }}件)</Button>
      </form>
    </section>

    <!-- タブ2: 送電試験結果出力 -->
    <section v-if="currentTab === 'exam'" class="flex flex-col gap-panel-gap">
      <Note v-if="examCircuitsError" variant="error" :text="examCircuitsError" />
      <Note v-if="examMessage" :variant="examMessage.type === 'error' ? 'error' : 'success'" :text="examMessage.text" />

      <form class="panel flex flex-col gap-panel-gap max-w-4xl" @submit.prevent="handleExamGenerate">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="zap" />
            <span>送電試験結果 Excel出力設定</span>
          </h3>
        </header>

        <p class="guide-text">
          各盤の送電試験（フェーズ1〜3）の測定値・合否判定・選択した測定器の型式/校正日をテンプレートExcelへ反映して出力します。マクロ（.xlsm）にも対応しています。
        </p>
        <hr class="divider">

        <Note v-if="!hasSiteSettingExcel" variant="warning" text="現場設定にExcelテンプレートが登録されていません。管理画面からExcelファイルを登録してください。" />

        <div class="flex flex-col gap-inline-gap">
          <label for="print-ban" class="label">1. 出力対象の盤</label>
          <Select id="print-ban" v-model="examSelectedBan" :options="examBanOptions" :disabled="isExamLoading || examBanList.length === 0" placeholder="出力対象を選択..." />
        </div>

        <hr class="divider">

        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h4 class="flex items-center gap-item-gap">
            <Icon name="wrench" />
            <span>2. 使用測定機器の指定</span>
          </h4>
          <Button variant="secondary" size="sm" icon="settings" @click="isDevicesModalOpen = true">機器台帳を管理する</Button>
        </header>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-panel-gap">
          <div class="flex flex-col gap-inline-gap">
            <label for="print-megger" class="label">絶縁抵抗計</label>
            <Select id="print-megger" v-model="selectedMeggerId" :options="meggerOptions" @update:model-value="onDeviceSelectionChange" />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="print-voltmeter" class="label">電圧計</label>
            <Select id="print-voltmeter" v-model="selectedVoltmeterId" :options="voltmeterOptions" @update:model-value="onDeviceSelectionChange" />
          </div>

          <div class="flex flex-col gap-inline-gap">
            <label for="print-phase-detector" class="label">検相器</label>
            <Select id="print-phase-detector" v-model="selectedPhaseDetectorId" :options="phaseDetectorOptions" @update:model-value="onDeviceSelectionChange" />
          </div>
        </div>

        <hr class="divider">

        <Button type="submit" variant="primary" :icon="examSelectedBan === 'ALL' ? 'archive' : 'download'" block :loading="isExamGenerating" :disabled="!hasSiteSettingExcel || examBanList.length === 0 || !examSelectedBan">
          <template v-if="examBanList.length === 0">
            対象の盤がありません
          </template>
          <template v-else-if="examSelectedBan === 'ALL'">
            全盤を一括ZIP出力 ({{ examBanList.length }}盤)
          </template>
          <template v-else>
            「{{ examSelectedBan }}」の試験結果Excelを出力
          </template>
        </Button>
      </form>

      <ModalMeasurementDevices v-model="isDevicesModalOpen" :site-id="siteId" :devices="devices" :selected-device-ids="currentSelectedDevices" @updated="onDevicesUpdated" />
    </section>

    <!-- タブ3: リモコン設定表出力 -->
    <section v-if="currentTab === 'remote'" class="flex flex-col gap-panel-gap">
      <Note v-if="remoteGenerateMessage" :variant="remoteGenerateMessage.type === 'success' ? 'success' : 'error'" :text="remoteGenerateMessage.text" />

      <div class="panel flex flex-col gap-panel-gap max-w-4xl">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="sliders" />
            <span>リモコン設定表 Excel出力設定</span>
          </h3>
          <Button variant="secondary" size="sm" icon="sliders" :to="`/portal/${siteId}/remote-control`">リモコン設定へ移動する</Button>
        </header>

        <p class="guide-text">
          フル2線式リモコン等の負荷アドレスに対して編成されたグループ（G1〜G127）やパターン（P1〜P16）の設定内容を設定表フォーマットへ自動転記します。
        </p>
        <hr class="divider">

        <!-- 1. 設定サマリー -->
        <div class="flex flex-col gap-inline-gap">
          <span class="label">1. 設定データ状況（DB連動）</span>
          <div class="grid grid-cols-3 gap-item-gap">
            <div class="summary-box flex flex-col items-center justify-center p-item-gap">
              <span class="summary-label">負荷アドレス</span>
              <span class="summary-val is-accent">{{ remoteCircuits.length }}</span>
            </div>
            <div class="summary-box flex flex-col items-center justify-center p-item-gap">
              <span class="summary-label">編成グループ</span>
              <span class="summary-val">{{ activeGroups.length }}組</span>
            </div>
            <div class="summary-box flex flex-col items-center justify-center p-item-gap">
              <span class="summary-label">編成パターン</span>
              <span class="summary-val">{{ activePatterns.length }}種</span>
            </div>
          </div>
        </div>

        <hr class="divider">

        <!-- 2. 出力対象選択 -->
        <div class="flex flex-col gap-inline-gap">
          <span class="label">2. 出力対象（3パターン）</span>
          <div class="flex flex-wrap gap-panel-gap">
            <label v-for="opt in remoteExportTargetOptions" :key="opt.value" class="radio-label flex items-center gap-inline-gap">
              <input v-model="remoteExportTarget" type="radio" :value="opt.value" class="radio-input">
              <span>{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <hr class="divider">

        <!-- 3. フォーマット指定 -->
        <div class="flex flex-col gap-inline-gap">
          <span class="label">3. {{ remoteFormatLabel }} (.xlsx)</span>
          <ExcelDropzone :model-value="currentRemoteFile" :disabled="isRemoteGenerating" @update:model-value="handleRemoteFileUpdate" />
          <small class="text-note">※対象フォーマットのExcelファイルを指定してください。</small>
        </div>

        <hr class="divider">

        <Button variant="primary" icon="download" block :loading="isRemoteGenerating" :disabled="!currentRemoteFile" @click="generateRemoteReport">{{ remoteDownloadButtonLabel }}</Button>
      </div>
    </section>

    <!-- タブ4: テンプレートキー一覧 -->
    <section v-if="currentTab === 'keys'" class="flex flex-col gap-panel-gap">
      <section class="panel flex flex-col gap-panel-gap">
        <header class="flex items-center gap-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="info" />
            <span>テンプレートキー仕様ガイド</span>
          </h3>
        </header>
        <hr class="divider">

        <ol class="grid grid-cols-1 md:grid-cols-3 gap-item-gap">
          <li class="guide-box p-item-gap flex flex-col gap-inline-gap">
            <strong class="guide-title">1. 列見出しから自動生成</strong>
            <p class="guide-desc">
              取り込んだExcel台帳の列名からキーを自動生成しています。テンプレート内のセルに以下の <code>%キー名%</code> を記述してください。列を追加した場合もそのまま新しいキーとして認識されます。
            </p>
          </li>

          <li class="guide-box p-item-gap flex flex-col gap-inline-gap">
            <strong class="guide-title">2. 全角・半角どちらもOK</strong>
            <p class="guide-desc">
              <code>%回路名称%</code> でも <code>％回路名称％</code> でも自動で同一キーとして認識されます。スペースやカタカナの全角半角の揺らぎも自動で吸収されます。
            </p>
          </li>

          <li class="guide-box p-item-gap flex flex-col gap-inline-gap">
            <strong class="guide-title">3. 出力日時の自動挿入</strong>
            <p class="guide-desc">
              セル内に <code>%出力日時%</code>（または <code>%日付%</code>）と記述すると、帳票Excelを出力した実際の日付が自動で差し込まれます。
            </p>
          </li>
        </ol>
      </section>

      <section class="flex flex-col gap-panel-gap">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-item-gap">
          <div class="flex items-center gap-item-gap">
            <h4 class="flex items-center gap-inline-gap">
              <span>利用可能なキー一覧</span>
              <Skeleton :show="isTagLoading">
                <span>({{ allAvailableKeys.length }}項目)</span>
              </Skeleton>
            </h4>
          </div>

          <div class="w-full sm:w-72">
            <ClearableInput v-model="searchQuery" placeholder="キー名・列名で絞り込み..." icon="search" />
          </div>
        </div>

        <Table :columns="keyColumns" :data="filteredKeys" :loading="isTagLoading" row-key="tag" empty-text="該当するキーが見つかりません">
          <template #cell-tag="{ row }">
            <code class="key-code" @click="copyKey(row.tag)">
              {{ row.tag }}
            </code>
          </template>

          <template #cell-key="{ row }">
            <div class="flex items-center gap-inline-gap">
              <strong class="key-label">{{ row.key }}</strong>
              <Badge v-if="row.colIndex === 0" size="sm" variant="gray">共通</Badge>
            </div>
          </template>

          <template #cell-sampleValue="{ row }">
            <span class="sample-text">{{ row.sampleValue || '-' }}</span>
          </template>

          <template #cell-actions="{ row }">
            <Button variant="tertiary" size="sm" icon="copy" @click="copyKey(row.tag)">コピーする</Button>
          </template>
        </Table>
      </section>
    </section>
  </div>
</template>

<style scoped lang="scss">
.guide-box {
  border: var(--border-width-base) solid var(--color-border);
  background: var(--surface-bg-sunken);
}

.guide-title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.guide-desc,
.guide-text {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);

  code {
    padding: 0.1em 0.3em;
    font-family: var(--font-mono);
    color: var(--theme-accent);
    background: var(--surface-bg-elevated);
  }
}

.key-code {
  display: inline-block;

  padding: var(--space-1) var(--space-2);
  border: var(--border-width-base) solid var(--color-border);

  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--theme-accent);

  background: var(--surface-bg-sunken);

  transition: var(--transition-base);

  @include state-interactive;

  &:hover {
    border-color: var(--theme-accent);
    background: var(--surface-bg-elevated);
  }
}

.key-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-main);
}

.sample-text {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.summary-box {
  border: var(--border-width-base) solid var(--color-border);
  background: var(--surface-bg-sunken);
}

.summary-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.summary-val {
  font-family: var(--font-mono);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);

  &.is-accent {
    color: var(--theme-accent);
  }
}

.guide-title {
  color: var(--theme-accent);
}

.radio-label {
  font-size: var(--font-size-sm);

  @include state-interactive;
}

.radio-input {
  accent-color: var(--theme-accent);
}
</style>
