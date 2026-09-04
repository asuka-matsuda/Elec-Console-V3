<script setup lang="ts">
/**
 * CableDbPage
 * ケーブルのデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import type { TableColumn } from '~/components/AppTable.vue'
import { cableData } from '~/constants/data/cableData'

const tableColumns: TableColumn<(typeof cableData)[number]>[] = [
  { key: 'name', label: 'ケーブル名称', sortable: true },
  { key: 'ampacity', label: '許容電流 (A)', sortable: true },
  { key: 'diameter', label: '仕上外径 (mm)', sortable: true },
  { key: 'weight', label: '概算質量 (kg/m)', sortable: true },
  { key: 'voltage', label: '耐電圧', sortable: true },
  { key: 'temp', label: '基底/最高温度', sortable: true },
  { key: 'standard', label: '参考規格/メーカー', sortable: true },
]
</script>

<template>
  <DbLayout
    :data="cableData"
    :columns="tableColumns"
    :search-mapper="(item) => `${item.name} ${item.standard || ''}`"
    placeholder="種類、サイズなどを検索... (例: CVT 22)"
  >
    <template #cell-weight="{ value }">
      {{ isNaN(Number(value)) ? value : Number(value) / 1000 }}
    </template>

    <template #cell-voltage="{ value }"> {{ value }} V </template>

    <template #cell-temp="{ row }">
      {{ row.baseTemp }}℃ / {{ row.maxTemp }}℃
    </template>

    <template #cell-standard="{ value }">
      <small>{{ value }}</small>
    </template>
  </DbLayout>
</template>
