<script setup lang="ts">
/**
 * TorqueDbPage
 * 締付トルクのデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import { computed } from 'vue'

import type { TableColumn } from '~/components/AppTable.vue'
import { torqueData } from '~/constants/data/torqueData'

const flattenedData = computed(() => {
  return torqueData.flatMap(cat =>
    cat.items.map(item => ({
      category: cat.category,
      reference: cat.reference,
      ...item,
    })),
  )
})

const tableColumns: TableColumn<(typeof flattenedData.value)[number]>[] = [
  { key: 'category', label: 'カテゴリ', sortable: true },
  { key: 'size', label: 'サイズ', sortable: true },
  { key: 'torque_nm', label: '標準トルク (N・m)', sortable: true },
  { key: 'range_nm', label: '許容範囲 (N・m)', sortable: true },
  { key: 'note', label: '備考', sortable: true },
  { key: 'reference', label: '参考規格', sortable: true },
]
</script>

<template>
  <DbLayout
    :data="flattenedData"
    :columns="tableColumns"
    :search-mapper="(item) => `${item.category} ${item.size} ${item.note}`"
    placeholder="種類、サイズなどを検索... (例: M8)"
  >
    <template #cell-category="{ value }">
      <strong>{{ value }}</strong>
    </template>

    <template #cell-reference="{ value }">
      <small>{{ value }}</small>
    </template>
  </DbLayout>
</template>
