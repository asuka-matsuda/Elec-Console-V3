<script setup lang="ts">
/**
 * 現場公式帳票出力ページ
 * /portal/:siteId/reports
 *
 * @description マスター管理で現場に割り当てられた公式帳票のカテゴリ別ワンクリック出力機能を提供します。
 * （現場の最新データが自動反映された完成品Excelを出力）
 */
import { computed, onMounted, ref, watch } from 'vue'

import { useHead, useNuxtApp, useRoute, useRouter } from '#app'
import type { MasterReportTemplateItem } from '#shared/types/reportTemplate'
import { useMasterTemplates } from '~/composables/master/useMasterTemplates'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import { useExamReportPrint } from '~/composables/portal/useExamReportPrint'
import { useMeasurementDevices } from '~/composables/portal/useMeasurementDevices'
import { useRemoteControlSetting } from '~/composables/portal/useRemoteControlSetting'
import { useTagReportPrint } from '~/composables/portal/useTagReportPrint'
import { getReportLogicMeta } from '~/constants/reportTemplates'
import type { TabOption } from '~/types/components'
import { formatShortDateTime } from '~/utils/date'
import { generateExamReportsZip } from '~/utils/examReportExcel'
import { generateRemoteReportExcel } from '~/utils/remoteReportExcel'
import { generateTagReportExcel } from '~/utils/tagReportExcel'

type FilterTab = 'all' | 'tag' | 'exam' | 'remote'

const route = useRoute()
const router = useRouter()
const { $api } = useNuxtApp()
const toast = useToast()

const siteId = computed(() => route.params.siteId as string)
const { site, siteName } = useCurrentSite(siteId)

const pageTitle = computed(() =>
  siteName.value ? `${siteName.value}_帳票出力` : '帳票出力',
)

useHead({
  title: computed(() => `${pageTitle.value} - Elec-Console`),
})

// --- マスター管理ひな形（現場割り当て） ---
const {
  items: masterTemplates,
  isLoading: isMasterLoading,
  fetchTemplates: fetchMasterTemplates,
  downloadTemplate: downloadMasterTemplate,
} = useMasterTemplates()

const executingTplId = ref<string | null>(null)

// --- カテゴリタブ管理 ---
const validTabs: FilterTab[] = ['all', 'tag', 'exam', 'remote']
const initialTab = (validTabs.includes(route.query.tab as FilterTab) ? route.query.tab : 'all') as FilterTab
const currentTab = ref<FilterTab>(initialTab)

const tabOptions = computed<TabOption<FilterTab>[]>(() => {
  const allCount = masterTemplates.value.length
  const tagCount = masterTemplates.value.filter(t => t.logicType === 'tag' || t.logicType === 'socket-tepra').length
  const examCount = masterTemplates.value.filter(t => t.logicType === 'exam').length
  const remoteCount = masterTemplates.value.filter(t => t.logicType === 'remote').length

  return [
    { value: 'all', label: 'すべて', icon: 'file-spreadsheet', badge: allCount },
    { value: 'tag', label: '線名札・ラベル', icon: 'tag', badge: tagCount },
    { value: 'exam', label: '送電試験結果', icon: 'zap', badge: examCount },
    { value: 'remote', label: 'リモコン設定表', icon: 'sliders', badge: remoteCount },
  ]
})

const filteredTemplates = computed(() => {
  if (currentTab.value === 'all') {
    return masterTemplates.value
  }
  if (currentTab.value === 'tag') {
    return masterTemplates.value.filter(t => t.logicType === 'tag' || t.logicType === 'socket-tepra')
  }

  return masterTemplates.value.filter(t => t.logicType === currentTab.value)
})

const switchTab = (tab: string | number) => {
  const target = tab as FilterTab

  currentTab.value = target
  router.replace({ query: { ...route.query, tab: target === 'all' ? undefined : target } })
}

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && validTabs.includes(newTab as FilterTab) && newTab !== currentTab.value) {
      currentTab.value = newTab as FilterTab
    }
  },
)

// --- データ取得用 Composable ---
const {
  filteredRows: tagFilteredRows,
  fetchSiteData: fetchTagSiteData,
  flowDirection: tagFlowDirection,
} = useTagReportPrint(siteId, { siteName })

const hasSiteSettingExcel = computed(() => Boolean(site.value?.excelPath?.trim()))
const {
  selectedDevicesMap,
  fetchMeasurementDevices,
} = useMeasurementDevices(siteId)

const {
  circuits: examCircuits,
  banList: examBanList,
  fetchCircuits: fetchExamCircuits,
} = useExamReportPrint(siteId, { siteName, hasSiteSettingExcel })

const {
  remoteCircuits,
  config: remoteConfig,
  fetchSiteRemoteData,
} = useRemoteControlSetting(siteId, { siteName })

// --- ワンクリック帳票出力処理 ---
const triggerBlobDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const handleExecuteTemplate = async (tpl: MasterReportTemplateItem) => {
  executingTplId.value = tpl.id
  try {
    const blob = await $api<Blob>(`/api/master/templates/${tpl.id}/download`, {
      responseType: 'blob',
    })
    const templateBuffer = await blob.arrayBuffer()

    if (tpl.logicType === 'tag' || tpl.logicType === 'socket-tepra') {
      if (tagFilteredRows.value.length === 0) {
        await fetchTagSiteData()
      }
      if (tagFilteredRows.value.length === 0) {
        toast.error('出力対象となる現場の回路データが登録されていません')

        return
      }

      const result = await generateTagReportExcel({
        templateBuffer,
        rows: tagFilteredRows.value,
        siteName: siteName.value,
        flowDirection: tagFlowDirection.value,
      })

      triggerBlobDownload(
        new Blob([result.buffer as unknown as BlobPart], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        result.filename,
      )
      toast.success(`「${tpl.name}」を出力しました (${result.totalTags}件)`)
    }
    else if (tpl.logicType === 'exam') {
      if (examBanList.value.length === 0) {
        await fetchExamCircuits()
      }
      if (examBanList.value.length === 0) {
        toast.error('出力対象となる盤データが登録されていません')

        return
      }

      const isXlsm = tpl.file.filename.toLowerCase().endsWith('.xlsm')
      const result = await generateExamReportsZip({
        templateBuffer,
        banMeishoList: examBanList.value,
        circuits: examCircuits.value,
        symbolSize: 28,
        isXlsm,
        siteName: siteName.value,
        devices: selectedDevicesMap.value,
      })

      triggerBlobDownload(
        new Blob([result.buffer as unknown as BlobPart], {
          type: 'application/zip',
        }),
        result.filename,
      )
      toast.success(`「${tpl.name}」を出力しました (${examBanList.value.length}盤一括ZIP)`)
    }
    else if (tpl.logicType === 'remote') {
      if (remoteCircuits.value.length === 0) {
        await fetchSiteRemoteData()
      }
      if (remoteCircuits.value.length === 0) {
        toast.error('出力対象となるリモコン回路データが登録されていません')

        return
      }

      const result = await generateRemoteReportExcel({
        templateBuffer,
        circuits: remoteCircuits.value,
        config: remoteConfig.value,
        siteName: siteName.value,
        exportTarget: 'address',
      })

      triggerBlobDownload(
        new Blob([result.buffer as unknown as BlobPart], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }),
        result.filename,
      )
      toast.success(`「${tpl.name}」を出力しました`)
    }
  }
  catch (err: unknown) {
    console.error('Failed to execute template:', err)
    const msg = (err as Error)?.message || '帳票の出力に失敗しました'

    toast.error(msg)
  }
  finally {
    executingTplId.value = null
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

onMounted(() => {
  fetchMasterTemplates(siteId.value)
  fetchTagSiteData()
  fetchExamCircuits()
  fetchMeasurementDevices()
  fetchSiteRemoteData()
})
</script>

<template>
  <div class="flex flex-col gap-section-gap min-h-full">
    <!-- ページ概要と更新ボタン -->
    <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap flex-wrap">
      <p class="guide-text">マスター管理でこの現場に割り当てられた公式ひな形Excelです。最新データが自動で流し込まれた完成品Excelをワンクリックで出力できます。</p>
      <Button variant="secondary" size="sm" icon="refresh-cw" :loading="isMasterLoading" @click="fetchMasterTemplates(siteId)">最新状態に更新</Button>
    </header>

    <!-- 帳票分類タブ -->
    <Tabs :model-value="currentTab" :items="tabOptions" @update:model-value="switchTab" />

    <!-- 現場公式帳票一覧（ワンクリック出力専用） -->
    <section class="flex flex-col gap-panel-gap">
      <div v-if="filteredTemplates.length > 0" class="grid grid-cols-1 xl:grid-cols-2 gap-panel-gap">
        <div v-for="tpl in filteredTemplates" :key="tpl.id" class="panel flex flex-col gap-panel-gap">
          <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap flex-wrap">
            <div class="flex items-center gap-item-gap flex-wrap">
              <Icon :name="getReportLogicMeta(tpl.logicType).icon" />
              <h4 class="tpl-card-title">{{ tpl.name }}</h4>
              <span class="guide-text">({{ getReportLogicMeta(tpl.logicType).name }})</span>
            </div>
            <Badge size="sm" :variant="tpl.isAllSites ? 'blue' : 'purple'">
              {{ tpl.isAllSites ? '全社共通' : '現場専用' }}
            </Badge>
          </header>

          <hr class="divider">

          <p v-if="tpl.description" class="desc-text">{{ tpl.description }}</p>

          <div class="file-info-box flex items-center justify-between gap-item-gap p-panel-pad-compact flex-wrap">
            <div class="flex items-center gap-item-gap flex-wrap">
              <Icon name="file-check" style="color: var(--color-status-success)" />
              <span class="file-name">{{ tpl.file.filename }}</span>
              <small class="file-meta">({{ formatFileSize(tpl.file.size) }} / 更新: {{ formatShortDateTime(tpl.file.updatedAt) }})</small>
            </div>
            <Button size="sm" variant="secondary" icon="download" @click="downloadMasterTemplate(tpl.id, tpl.file.filename)">ひな形DL</Button>
          </div>

          <Button
            variant="primary"
            icon="download"
            block
            :loading="executingTplId === tpl.id"
            @click="handleExecuteTemplate(tpl)"
          >
            最新データでExcelを出力する
          </Button>
        </div>
      </div>

      <Note
        v-else-if="!isMasterLoading"
        variant="secondary"
        :text="currentTab === 'all'
          ? '現在この現場に割り当てられた公式帳票はありません。マスター管理メニューで帳票テンプレートを登録し、この現場に割り当ててください。'
          : 'このカテゴリに割り当てられた帳票はありません。'"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.guide-text {
  font-size: var(--font-size-xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}

.desc-text {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-text-secondary);
}

.tpl-card-title {
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
</style>
