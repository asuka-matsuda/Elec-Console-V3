<script setup lang="ts">
/**
 * ConduitDbPage
 * 電線管のデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import { conduitData } from '~/constants/data/conduitData'
import { CONDUIT_DB_COLUMNS } from '~/constants/databaseConstants'
</script>

<template>
  <DbLayout
    :data="conduitData"
    :columns="CONDUIT_DB_COLUMNS"
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
