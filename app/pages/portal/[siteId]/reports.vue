<script setup lang="ts">
/**
 * 現場公式帳票出力ページ
 * /portal/:siteId/reports
 *
 * @description マスター管理で現場に割り当てられた公式ひな形をセレクトボックスで選択し、
 * 画面全体を活用して出力対象（線名札・送電試験・リモコン設定）を柔軟に設定・出力するワークスペース画面。
 */
import { computed, onMounted, ref, watch } from 'vue'

import { useHead, useRoute, useRouter } from '#app'
import { useMasterTemplates } from '~/composables/master/useMasterTemplates'
import { useCurrentSite } from '~/composables/portal/useCurrentSite'
import type { SelectOption, TabOption } from '~/types/components'
import { formatShortDateTime } from '~/utils/date'

type CategoryTab = 'tag' | 'tepra' | 'exam' | 'remote'

const route = useRoute()
const router = useRouter()

const siteId = computed(() => route.params.siteId as string)
const { site, siteName } = useCurrentSite(siteId)
const hasSiteSettingExcel = computed(() => Boolean(site.value?.excelPath?.trim()))

const pageTitle = computed(() =>
  siteName.value ? `${siteName.value}_帳票出力` : '帳票出力',
)

useHead({
  title: computed(() => `${pageTitle.value} - Elec-Console`),
})

// --- マスター管理ひな形 ---
const {
  items: masterTemplates,
  isLoading: isMasterLoading,
  fetchTemplates: fetchMasterTemplates,
  downloadTemplate: downloadMasterTemplate,
} = useMasterTemplates()

// --- 帳票カテゴリタブ ---
const validTabs: CategoryTab[] = ['exam', 'remote', 'tag', 'tepra']
const initialTab = (validTabs.includes(route.query.tab as CategoryTab) ? route.query.tab : 'exam') as CategoryTab
const currentCategory = ref<CategoryTab>(initialTab)

const categoryTabOptions = computed<TabOption<CategoryTab>[]>(() => {
  const examCount = masterTemplates.value.filter(t => t.logicType === 'exam').length
  const remoteCount = masterTemplates.value.filter(t => t.logicType === 'remote').length
  const tagCount = masterTemplates.value.filter(t => t.logicType === 'tag' || t.logicType === 'socket-tepra').length

  return [
    { value: 'exam', label: '送電試験結果', icon: 'zap', badge: examCount },
    { value: 'remote', label: 'リモコン設定表', icon: 'sliders', badge: remoteCount },
    { value: 'tag', label: '線名札・ラベル', icon: 'tag', badge: tagCount },
    { value: 'tepra', label: 'コンセント用テプラ', icon: 'printer' },
  ]
})

// 現在のカテゴリに該当するひな形リスト
const availableTemplatesForCategory = computed(() => {
  if (currentCategory.value === 'tag') {
    return masterTemplates.value.filter(t => t.logicType === 'tag' || t.logicType === 'socket-tepra')
  }

  return masterTemplates.value.filter(t => t.logicType === currentCategory.value)
})

const templateSelectOptions = computed<SelectOption[]>(() => {
  return availableTemplatesForCategory.value.map(t => ({
    value: t.id,
    label: t.name,
  }))
})

// 選択中のひな形
const selectedTemplateId = ref<string>('')

// カテゴリ変更またはひな形読み込み時に先頭ひな形を自動選択
watch(
  availableTemplatesForCategory,
  (templates) => {
    if (templates.length > 0) {
      if (!templates.some(t => t.id === selectedTemplateId.value)) {
        selectedTemplateId.value = templates[0]?.id ?? ''
      }
    }
    else {
      selectedTemplateId.value = ''
    }
  },
  { immediate: true },
)

watch(
  currentCategory,
  (newCat) => {
    router.replace({ query: { ...route.query, tab: newCat } })
    const templates = availableTemplatesForCategory.value

    if (templates.length > 0) {
      selectedTemplateId.value = templates[0]?.id ?? ''
    }
    else {
      selectedTemplateId.value = ''
    }
  },
)

const selectedTemplate = computed(() => {
  return masterTemplates.value.find(t => t.id === selectedTemplateId.value) || null
})

// --- タブコンポーネントとの連携ステート ---
interface TabExpose {
  exportReport: () => Promise<void>
}

const tagTabRef = ref<TabExpose | null>(null)
const tepraTabRef = ref<TabExpose | null>(null)
const examTabRef = ref<TabExpose | null>(null)
const remoteTabRef = ref<TabExpose | null>(null)

const tagCanExport = ref(false)
const tagIsExporting = ref(false)
const tagExportLabel = ref('Excelを出力する')

const tepraCanExport = ref(false)
const tepraIsExporting = ref(false)
const tepraExportLabel = ref('Excelを出力する')

const examCanExport = ref(false)
const examIsExporting = ref(false)
const examExportLabel = ref('Excelを出力する')

const remoteCanExport = ref(false)
const remoteIsExporting = ref(false)
const remoteExportLabel = ref('Excelを出力する')

const canExport = computed(() => {
  if (currentCategory.value === 'exam') return examCanExport.value
  if (currentCategory.value === 'remote') return remoteCanExport.value
  if (currentCategory.value === 'tag') return tagCanExport.value
  if (currentCategory.value === 'tepra') return tepraCanExport.value

  return false
})

const isExporting = computed(() => {
  if (currentCategory.value === 'exam') return examIsExporting.value
  if (currentCategory.value === 'remote') return remoteIsExporting.value
  if (currentCategory.value === 'tag') return tagIsExporting.value
  if (currentCategory.value === 'tepra') return tepraIsExporting.value

  return false
})

const exportButtonLabel = computed(() => {
  if (currentCategory.value === 'tepra') return tepraExportLabel.value
  if (!selectedTemplate.value) {
    return 'ひな形を選択してください'
  }
  if (currentCategory.value === 'exam') return examExportLabel.value
  if (currentCategory.value === 'remote') return remoteExportLabel.value
  if (currentCategory.value === 'tag') return tagExportLabel.value

  return 'Excelを出力する'
})

const handleExport = async () => {
  if (currentCategory.value === 'exam') {
    await examTabRef.value?.exportReport()
  }
  else if (currentCategory.value === 'remote') {
    await remoteTabRef.value?.exportReport()
  }
  else if (currentCategory.value === 'tag') {
    await tagTabRef.value?.exportReport()
  }
  else if (currentCategory.value === 'tepra') {
    await tepraTabRef.value?.exportReport()
  }
}

onMounted(() => {
  fetchMasterTemplates(siteId.value)
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-item-gap min-h-0 h-full">
    <!-- 1. 最上部タブナビゲーション（画面全幅・下線が右端まで通る） -->
    <Tabs v-model="currentCategory" :items="categoryTabOptions" class="shrink-0" />

    <!-- 2. コントロールツールバー: 使用ひな形 ＆ 出力実行ボタン（タブの下・フラット） -->
    <div class="flex flex-wrap items-center justify-between gap-y-inline-gap gap-x-item-gap shrink-0 min-h-10">
      <div class="flex flex-wrap items-center gap-item-gap">
        <!-- テプラタブ時: テンプレート不要インジケーター -->
        <div v-if="currentCategory === 'tepra'" class="flex items-center gap-inline-gap">
          <Badge variant="blue" size="sm">テプラ専用仕様</Badge>
          <span class="field-help-text">A列:盤名称 / B列:回路番号 / 盤ごとにシート分割（テンプレート不要・自動生成）</span>
        </div>

        <!-- その他タブ時: ひな形セレクトボックス -->
        <template v-else>
          <div class="flex items-center gap-inline-gap">
            <label for="template-select" class="shrink-0 label">使用ひな形:</label>
            <Select id="template-select" v-model="selectedTemplateId" :options="templateSelectOptions" placeholder="ひな形を選択..." class="w-[320px]" />
          </div>

          <div v-if="selectedTemplate" class="flex items-center gap-inline-gap">
            <Button variant="secondary" icon="download" @click="downloadMasterTemplate(selectedTemplate.id, selectedTemplate.file.filename)">ひな形DL</Button>
            <small class="field-help-text hidden sm:inline">({{ formatShortDateTime(selectedTemplate.file.updatedAt) }} 更新)</small>
          </div>
        </template>
      </div>

      <div class="flex items-center gap-item-gap shrink-0">
        <Button variant="primary" icon="download" :disabled="!canExport" :loading="isExporting" class="min-w-[200px]" @click="handleExport">{{ exportButtonLabel }}</Button>
      </div>
    </div>

    <!-- ひな形が1件も割り当てられていない場合の注意表示（テプラタブ以外） -->
    <Note v-if="currentCategory !== 'tepra' && !isMasterLoading && availableTemplatesForCategory.length === 0" variant="warning" class="shrink-0" text="このカテゴリに割り当てられた公式ひな形がありません。マスター管理画面の「帳票ひな形管理」でひな形Excelを登録し、この現場に割り当ててください。" />

    <!-- 各タブ画面（左から送電試験、リモコン、線名札、テプラ） -->
    <PortalTabExam v-if="currentCategory === 'exam'" ref="examTabRef" :site-id="siteId" :site-name="siteName" :template="selectedTemplate" :has-site-setting-excel="hasSiteSettingExcel" @update:can-export="examCanExport = $event" @update:is-exporting="examIsExporting = $event" @update:export-label="examExportLabel = $event" />
    <PortalTabRemote v-else-if="currentCategory === 'remote'" ref="remoteTabRef" :site-id="siteId" :site-name="siteName" :template="selectedTemplate" @update:can-export="remoteCanExport = $event" @update:is-exporting="remoteIsExporting = $event" @update:export-label="remoteExportLabel = $event" />
    <PortalTabTag v-else-if="currentCategory === 'tag'" ref="tagTabRef" :site-id="siteId" :site-name="siteName" :template="selectedTemplate" @update:can-export="tagCanExport = $event" @update:is-exporting="tagIsExporting = $event" @update:export-label="tagExportLabel = $event" />
    <PortalTabTepra v-else-if="currentCategory === 'tepra'" ref="tepraTabRef" :site-id="siteId" :site-name="siteName" @update:can-export="tepraCanExport = $event" @update:is-exporting="tepraIsExporting = $event" @update:export-label="tepraExportLabel = $event" />
  </div>
</template>
