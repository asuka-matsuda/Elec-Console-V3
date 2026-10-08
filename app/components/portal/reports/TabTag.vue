<script setup lang="ts">
/**
 * 線名札・ラベル帳票出力タブ
 * [Portal] 現場の回路台帳から動的に抽出した回路一覧を選択・検索し、
 * 線名札またはテプラテンプレートExcelへ差し込み出力します。
 */
import { computed, onMounted, ref, watch } from 'vue'

import type { MasterReportTemplateItem } from '#shared/types/reportTemplate'
import { useMasterTemplates } from '~/composables/master/useMasterTemplates'
import { useTagReportPrint } from '~/composables/portal/useTagReportPrint'
import type { TableColumn } from '~/types/components'
import { downloadBlob } from '~/utils/download'
import type { DynamicCircuitRow } from '~/utils/tagReportExcel'
import { generateTagReportExcel } from '~/utils/tagReportExcel'

interface Props {
  siteId: string
  siteName: string
  template: MasterReportTemplateItem | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:canExport' | 'update:isExporting', val: boolean): void
  (e: 'update:exportLabel', val: string): void
}>()

const { fetchTemplateBuffer } = useMasterTemplates()
const toast = useToast()
const isExporting = ref(false)

// 線名札データ取得・フィルター
const {
  filteredRows: tagSourceRows,
  isLoadingData: isLoadingTagData,
  selectedKeiTo: tagSelectedKeiTo,
  keiToOptions: tagKeiToOptions,
  selectedBanShubetsu: tagSelectedBanShubetsu,
  banShubetsuOptions: tagBanShubetsuOptions,
  selectedBan: tagSelectedBan,
  banOptions: tagBanOptions,
  selectedKansen: tagSelectedKansen,
  kansenOptions: tagKansenOptions,
  flowDirection: tagFlowDirection,
  flowDirectionOptions: tagFlowDirectionOptions,
  fetchSiteData: fetchTagSiteData,
} = useTagReportPrint(computed(() => props.siteId), {
  siteName: computed(() => props.siteName),
  templateName: computed(() => props.template?.logicFile || props.template?.name || props.template?.file?.filename),
})

interface TagRowItem extends DynamicCircuitRow {
  uniqueKey: string
  cableText: string
  destinationText: string
}

const tagSearchQuery = ref('')

const tagRowItems = computed<TagRowItem[]>(() => {
  return tagSourceRows.value.map((r, index) => {
    const kBangou = r.kairoBangou?.trim() || ''
    const kMeisho = r.kairoMeisho?.trim() || ''
    const uniqueKey = r.id || `${r.banMeisho}_${kBangou}_${kMeisho}_${index}`
    const cableText = r.values['ケーブル'] || r.values['電線'] || r.values['種別・サイズ'] || '-'
    const destinationText = r.values['行き先'] || r.values['行先'] || r.values['負荷名称'] || r.kairoMeisho || '-'

    return {
      ...r,
      uniqueKey,
      cableText,
      destinationText,
    }
  })
})

const displayedTagRows = computed(() => {
  const q = tagSearchQuery.value.trim().toLowerCase()

  if (!q) return tagRowItems.value

  return tagRowItems.value.filter((r) => {
    return (
      r.banMeisho.toLowerCase().includes(q)
      || (r.banShubetsu && r.banShubetsu.toLowerCase().includes(q))
      || (r.keiToName && r.keiToName.toLowerCase().includes(q))
      || (r.kairoBangou && r.kairoBangou.toLowerCase().includes(q))
      || (r.kairoMeisho && r.kairoMeisho.toLowerCase().includes(q))
      || r.cableText.toLowerCase().includes(q)
      || r.destinationText.toLowerCase().includes(q)
    )
  })
})

const selectedTagKeys = ref<string[]>([])

// 現在表示されている行の中で選択されている件数（SSoT）
const selectedCountInDisplay = computed(() => {
  const set = new Set(selectedTagKeys.value)
  let count = 0

  for (const r of displayedTagRows.value) {
    if (set.has(r.uniqueKey)) count++
  }

  return count
})

// 表示行のキー一覧Set
const displayedKeySet = computed(() => new Set(displayedTagRows.value.map(r => r.uniqueKey)))

// 表示行が変わった時、存在しなくなったキーを安全にパージ
watch(
  displayedTagRows,
  () => {
    if (selectedTagKeys.value.length === 0) return

    const allSourceKeys = new Set(tagRowItems.value.map(r => r.uniqueKey))

    selectedTagKeys.value = selectedTagKeys.value.filter(k => allSourceKeys.has(k))
  },
)

const isAllTagsSelected = computed({
  get: () => displayedTagRows.value.length > 0 && selectedCountInDisplay.value === displayedTagRows.value.length,
  set: (val: boolean) => {
    if (val) {
      const set = new Set(selectedTagKeys.value)

      for (const r of displayedTagRows.value) {
        set.add(r.uniqueKey)
      }
      selectedTagKeys.value = Array.from(set)
    }
    else {
      const currentDisplayed = displayedKeySet.value

      selectedTagKeys.value = selectedTagKeys.value.filter(k => !currentDisplayed.has(k))
    }
  },
})

const isPartialTagsSelected = computed(() => {
  return selectedCountInDisplay.value > 0 && selectedCountInDisplay.value < displayedTagRows.value.length
})

const tagTableColumns: TableColumn<TagRowItem>[] = [
  { key: 'select', label: '', width: '44px', align: 'center' },
  { key: 'keiToName', label: '系統', width: '130px', sortable: true },
  { key: 'banShubetsu', label: '盤種別', width: '110px', sortable: true },
  { key: 'banMeisho', label: '盤名称', width: '130px', sortable: true },
  { key: 'keiTo', label: '幹線区分', width: '90px', align: 'center', sortable: true },
  { key: 'kairoBangou', label: '回路番号', width: '90px', align: 'center', sortable: true },
  { key: 'kairoMeisho', label: '回路名称・負荷名称', minWidth: '180px', truncate: true },
  { key: 'cableText', label: 'ケーブル・電線', width: '140px' },
  { key: 'destinationText', label: '行き先', width: '140px' },
]

const canExport = computed(() => {
  return Boolean(props.template && selectedCountInDisplay.value > 0 && !isExporting.value)
})

const exportButtonLabel = computed(() => {
  return `選択した ${selectedCountInDisplay.value} 回路を出力する`
})

watch(canExport, val => emit('update:canExport', val), { immediate: true })
watch(isExporting, val => emit('update:isExporting', val), { immediate: true })
watch(exportButtonLabel, val => emit('update:exportLabel', val), { immediate: true })

const exportReport = async () => {
  const tpl = props.template

  if (!tpl) return

  isExporting.value = true
  try {
    const templateBuffer = await fetchTemplateBuffer(tpl.id)

    if (!templateBuffer) return

    const selectedKeySet = new Set(selectedTagKeys.value)
    const targetRows = displayedTagRows.value.filter(r => selectedKeySet.has(r.uniqueKey))

    if (targetRows.length === 0) {
      toast.error('出力する回路を1件以上選択してください')

      return
    }

    const result = await generateTagReportExcel({
      templateBuffer,
      rows: targetRows,
      siteName: props.siteName,
      templateName: props.template?.logicFile || props.template?.name || props.template?.file?.filename,
      flowDirection: tagFlowDirection.value,
    })

    const outBlob = new Blob([result.buffer as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    downloadBlob(outBlob, result.filename)
    toast.success(`${result.totalTags}件の線名札帳票を出力しました`)
  }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '線名札Excelの生成に失敗しました'

    toast.error(msg)
  }
  finally {
    isExporting.value = false
  }
}

defineExpose({
  exportReport,
  canExport,
  exportButtonLabel,
})

onMounted(() => {
  fetchTagSiteData()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-item-gap min-h-0">
    <!-- フィルター & 選択操作バー（固定） -->
    <div class="panel p-panel-pad-compact flex flex-wrap items-center justify-between gap-item-gap shrink-0">
      <div class="flex flex-wrap items-center gap-item-gap">
        <!-- 1. 系統 -->
        <div class="flex items-center gap-inline-gap">
          <label for="filter-keito-tag" class="shrink-0 label">系統:</label>
          <Select id="filter-keito-tag" v-model="tagSelectedKeiTo" :options="tagKeiToOptions" :disabled="isLoadingTagData" class="w-[140px]" />
        </div>

        <!-- 2. 盤種別 -->
        <div class="flex items-center gap-inline-gap">
          <label for="filter-shubetsu-tag" class="shrink-0 label">盤種別:</label>
          <Select id="filter-shubetsu-tag" v-model="tagSelectedBanShubetsu" :options="tagBanShubetsuOptions" :disabled="isLoadingTagData" class="w-[150px]" />
        </div>

        <!-- 3. 盤名称 -->
        <div class="flex items-center gap-inline-gap">
          <label for="filter-ban-tag" class="shrink-0 label">盤名称:</label>
          <Select id="filter-ban-tag" v-model="tagSelectedBan" :options="tagBanOptions" :disabled="isLoadingTagData" class="w-[190px]" />
        </div>

        <!-- 4. 幹線可否 -->
        <div class="flex items-center gap-inline-gap">
          <label for="filter-kansen-tag" class="shrink-0 label">幹線可否:</label>
          <Select id="filter-kansen-tag" v-model="tagSelectedKansen" :options="tagKansenOptions" :disabled="isLoadingTagData" class="w-[180px]" />
        </div>

        <!-- 5. 流し込み順 -->
        <div class="flex items-center gap-inline-gap">
          <label for="filter-flow-tag" class="shrink-0 label">流し込み順:</label>
          <Select id="filter-flow-tag" v-model="tagFlowDirection" :options="tagFlowDirectionOptions" :disabled="isLoadingTagData" class="w-[150px]" />
        </div>

        <!-- 6. 検索窓 -->
        <Input v-model="tagSearchQuery" placeholder="回路名・ケーブル検索..." icon="search" clearable :disabled="isLoadingTagData" class="w-48" />
      </div>

      <!-- 全選択 / 選択件数カウンター（高さ固定でスケルトンと表示後のレイアウトシフトを100%防止） -->
      <div class="flex items-center gap-item-gap min-h-control-sm shrink-0 min-w-[210px] justify-end">
        <template v-if="isLoadingTagData">
          <Skeleton width="64px" height="18px" />
          <Skeleton width="120px" height="18px" />
        </template>
        <template v-else>
          <Checkbox v-model="isAllTagsSelected" :indeterminate="isPartialTagsSelected" label="全選択" />
          <span class="selection-count">
            選択中: <strong>{{ selectedCountInDisplay }}</strong> / {{ displayedTagRows.length }} 回路
          </span>
        </template>
      </div>
    </div>

    <!-- 回路一覧テーブル (見出し固定・本体スクロール) -->
    <Table :columns="tagTableColumns" :data="displayedTagRows" :loading="isLoadingTagData" :skeleton-rows="6" row-key="uniqueKey" empty-text="対象の回路データが見つかりません" class="flex-1 min-h-[400px] h-full">
      <template #header-select>
        <Checkbox v-model="isAllTagsSelected" :indeterminate="isPartialTagsSelected" />
      </template>

      <template #cell-select="{ row }">
        <Checkbox v-model="selectedTagKeys" :value="row.uniqueKey" />
      </template>

      <template #cell-keiToName="{ row }">
        <span>{{ row.keiToName || '-' }}</span>
      </template>

      <template #cell-banShubetsu="{ row }">
        <span>{{ row.banShubetsu || '-' }}</span>
      </template>

      <template #cell-banMeisho="{ row }">
        <span class="ban-cell-text">{{ row.banMeisho }}</span>
      </template>

      <template #cell-keiTo="{ row }">
        <Badge :variant="row.keiTo.includes('幹線') ? 'blue' : 'gray'" size="sm">{{ row.keiTo }}</Badge>
      </template>

      <template #cell-kairoBangou="{ row }">
        <span>{{ row.kairoBangou || '-' }}</span>
      </template>

      <template #cell-kairoMeisho="{ row }">
        <span class="meisho-cell-text">{{ row.kairoMeisho || '-' }}</span>
      </template>

      <template #cell-cableText="{ row }">
        <span class="cable-cell-text">{{ row.cableText }}</span>
      </template>

      <template #cell-destinationText="{ row }">
        <span class="dest-cell-text">{{ row.destinationText }}</span>
      </template>
    </Table>
  </div>
</template>

<style scoped lang="scss">
.ban-cell-text {
  font-weight: var(--font-weight-bold);
}

.meisho-cell-text {
  font-weight: var(--font-weight-medium);
}

.cable-cell-text {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.dest-cell-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.selection-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);

  strong {
    color: var(--color-text-main);
  }
}
</style>
