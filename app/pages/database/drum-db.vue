<script setup lang="ts">
/**
 * DrumDbPage
 * ケーブルドラムのデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import { drumData } from '~/constants/data/drumData'
import { DRUM_DB_COLUMNS } from '~/constants/databaseConstants'
</script>

<template>
  <DbLayout
    :data="drumData"
    :columns="DRUM_DB_COLUMNS"
    :search-mapper="(item) => `${item.category} ${item.id}`"
    placeholder="種類、サイズなどを検索... (例: L1)"
  >
    <template #cell-category="{ value }">
      <strong>{{ value }}</strong>
    </template>
  </DbLayout>
</template>
