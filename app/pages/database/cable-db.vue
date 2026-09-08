<script setup lang="ts">
/**
 * CableDbPage
 * ケーブルのデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import { cableData } from '~/constants/data/cableData'
import { CABLE_DB_COLUMNS } from '~/constants/databaseConstants'
</script>

<template>
  <DbLayout
    :data="cableData"
    :columns="CABLE_DB_COLUMNS"
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
