<script setup lang="ts">
/**
 * RackDbPage
 * ケーブルラックのデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import type { TableColumn } from '~/components/AppTable.vue'
import { rackData } from '~/constants/data/rackData'

const tableColumns: TableColumn<(typeof rackData)[number]>[] = [
  { key: 'category', label: 'カテゴリ', sortable: true },
  { key: 'size', label: 'サイズ (呼び幅 mm)', sortable: true },
  { key: 'height', label: '親桁高さ (mm)', sortable: true },
  { key: 'weightPiece', label: '1本あたり質量 (kg/3m)', sortable: true },
  { key: 'weightMeter', label: '1mあたり質量 (kg/m)', sortable: true },
]
</script>

<template>
  <DbLayout
    :data="rackData"
    :columns="tableColumns"
    :search-mapper="(item) => `${item.category} ${item.size}`"
    placeholder="種類、サイズなどを検索... (例: SR 300)"
  >
    <template #cell-category="{ value }">
      <strong>{{ value }}</strong>
    </template>
  </DbLayout>
</template>
