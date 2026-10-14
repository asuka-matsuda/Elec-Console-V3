<script setup lang="ts">
/**
 * コンセント用テプラ（TEPRA）帳票出力タブ
 * [Portal] 現場の回路台帳（データベース.xlsm）から受口数のある回路を抽出し、
 * 盤名称・回路記号で絞り込んで盤ごとにシート分割したテプラ流し込み用Excelを出力します。
 */
import { onMounted, watch } from 'vue'

import { useSocketTepraPrint } from '~/composables/portal/useSocketTepraPrint'
import type { TableColumn } from '~/types/components'

interface Props {
  siteId: string
  siteName: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:canExport' | 'update:isExporting', val: boolean): void
  (e: 'update:exportLabel', val: string): void
}>()

const {
  filteredCircuits,
  isLoadingData,
  hasExcelPath,
  selectedBan,
  banOptions,
  selectedKairoKigou,
  kairoKigouOptions,
  summary,
  canExport,
  isExporting,
  exportButtonLabel,
  fetchTepraCircuits,
  exportReport,
} = useSocketTepraPrint(computed(() => props.siteId), {
  siteName: computed(() => props.siteName),
})

// 親コンポーネント（reports.vue）のヘッダーツールバーとの同期
watch(canExport, val => emit('update:canExport', val), { immediate: true })
watch(isExporting, val => emit('update:isExporting', val), { immediate: true })
watch(exportButtonLabel, val => emit('update:exportLabel', val), { immediate: true })

interface TepraTableRow {
  id?: string
  banMeisho: string
  kairoBangou: string
  kairoKigou?: string | null
  kairoMeisho?: string | null
  ukeguchiCount: number
}

const tableColumns: TableColumn<TepraTableRow>[] = [
  { key: 'banMeisho', label: '盤名称 (シート名)', width: '150px', sortable: true },
  { key: 'kairoKigou', label: '回路記号', width: '100px', align: 'center', sortable: true },
  { key: 'kairoBangou', label: '回路番号 (B列)', width: '120px', align: 'center', sortable: true },
  { key: 'kairoMeisho', label: '回路名称・用途', minWidth: '200px', truncate: true },
  { key: 'ukeguchiCount', label: '受口数', width: '100px', align: 'center', sortable: true },
  { key: 'printCount', label: '転記行数 (枚数)', width: '130px', align: 'center' },
]

defineExpose({
  exportReport,
  canExport,
  exportButtonLabel,
})

onMounted(() => {
  fetchTepraCircuits()
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-item-gap min-h-0">
    <!-- 原本Excel未設定時のインライン警告 -->
    <Note
      v-if="!isLoadingData && !hasExcelPath"
      variant="warning"
      class="shrink-0"
      text="現場設定に回路台帳原本Excel（データベース.xlsm）が登録されていません。現場編集画面でExcelパスを設定してください。"
    />

    <!-- フィルター ＆ サマリー操作バー -->
    <div class="panel p-panel-pad-compact flex flex-wrap items-center justify-between gap-item-gap shrink-0">
      <div class="flex flex-wrap items-center gap-item-gap">
        <!-- 1. 盤名称セレクトボックス -->
        <div class="flex items-center gap-inline-gap">
          <label for="filter-tepra-ban" class="shrink-0 label">盤名称:</label>
          <Select
            id="filter-tepra-ban"
            v-model="selectedBan"
            :options="banOptions"
            :disabled="isLoadingData"
            class="w-[220px]"
          />
        </div>

        <!-- 2. 回路記号セレクトボックス -->
        <div class="flex items-center gap-inline-gap">
          <label for="filter-tepra-kigou" class="shrink-0 label">回路記号:</label>
          <Select
            id="filter-tepra-kigou"
            v-model="selectedKairoKigou"
            :options="kairoKigouOptions"
            :disabled="isLoadingData"
            class="w-[160px]"
          />
        </div>
      </div>

      <!-- 出力枚数サマリー -->
      <div class="flex items-center gap-item-gap shrink-0">
        <template v-if="isLoadingData">
          <Skeleton width="120px" height="20px" />
        </template>
        <template v-else>
          <span class="summary-text">
            対象回路: <strong>{{ summary.totalCircuits }}</strong> 件
          </span>
          <span class="summary-divider">/</span>
          <span class="summary-text">
            シート数: <strong>{{ summary.totalSheets }}</strong> 盤
          </span>
          <span class="summary-divider">/</span>
          <span class="summary-highlight">
            テプラ印刷枚数: <strong>{{ summary.totalRows }}</strong> 枚
          </span>
        </template>
      </div>
    </div>

    <!-- 対象回路一覧テーブル -->
    <Table
      :columns="tableColumns"
      :data="filteredCircuits"
      :loading="isLoadingData"
      :skeleton-rows="6"
      row-key="id"
      empty-text="受口数（コンセント）の回路データが見つかりません"
      class="flex-1 min-h-[400px] h-full"
    >
      <template #cell-banMeisho="{ row }">
        <span class="ban-name-text">{{ row.banMeisho }}</span>
      </template>

      <template #cell-kairoKigou="{ row }">
        <Badge v-if="row.kairoKigou" variant="blue" size="sm">{{ row.kairoKigou }}</Badge>
        <span v-else class="placeholder-dash">-</span>
      </template>

      <template #cell-kairoBangou="{ row }">
        <span class="bangou-text">{{ row.kairoBangou }}</span>
      </template>

      <template #cell-kairoMeisho="{ row }">
        <span>{{ row.kairoMeisho || '-' }}</span>
      </template>

      <template #cell-ukeguchiCount="{ row }">
        <span class="ukeguchi-badge">{{ row.ukeguchiCount }} 口</span>
      </template>

      <template #cell-printCount="{ row }">
        <span class="print-count-text">{{ row.ukeguchiCount }} 枚 (行複製)</span>
      </template>
    </Table>
  </div>
</template>

<style scoped lang="scss">
.ban-name-text {
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

.bangou-text {
  font-family: var(--font-mono);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--theme-accent);
}

.ukeguchi-badge {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-main);
}

.print-count-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.summary-text {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);

  strong {
    color: var(--color-text-main);
  }
}

.summary-divider {
  font-size: var(--font-size-xs);
  color: var(--color-border-subtle);
}

.summary-highlight {
  font-size: var(--font-size-xs);
  color: var(--color-text-main);

  strong {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--theme-accent);
  }
}

.placeholder-dash {
  color: var(--color-text-muted);
}
</style>
