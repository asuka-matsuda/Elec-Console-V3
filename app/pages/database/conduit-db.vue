<script setup lang="ts">
/**
 * ConduitDbPage
 * 電線管のデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import type { TableColumn } from '~/components/AppTable.vue'
import { conduitData } from '~/constants/data/conduitData'

const tableColumns: TableColumn<(typeof conduitData)[number]>[] = [
  { key: 'category', label: '配管種類', sortable: true },
  { key: 'size', label: '呼び径', sortable: true },
  { key: 'innerDiameter', label: '内径 (mm)', sortable: true },
  { key: 'outerDiameter', label: '外径 (mm)', sortable: true },
  { key: 'area', label: '断面積 (mm²)', sortable: true },
  { key: 'standard', label: '規格', sortable: true },
]
</script>

<template>
  <DbLayout
    :data="conduitData"
    :columns="tableColumns"
    :search-mapper="
      (item) => `${item.category} ${item.size} ${item.standard || ''}`
    "
    placeholder="種類、サイズなどを検索... (例: G22)"
  >
    <template #cell-category="{ value }">
      <strong>{{ value }}</strong>
    </template>

    <template #cell-standard="{ value }">
      <small>{{ value }}</small>
    </template>
  </DbLayout>
</template>
