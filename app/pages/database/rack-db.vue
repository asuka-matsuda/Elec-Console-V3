<script setup lang="ts">
/**
 * RackDbPage
 * ケーブルラックのデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import { rackData } from '~/constants/data/rackData'
import { RACK_DB_COLUMNS } from '~/constants/databaseConstants'
</script>

<template>
  <DbLayout
    :data="rackData"
    :columns="RACK_DB_COLUMNS"
    :search-mapper="(item) => `${item.category} ${item.size}`"
    placeholder="種類、サイズなどを検索... (例: SR 300)"
  >
    <template #cell-category="{ value }">
      <strong>{{ value }}</strong>
    </template>
  </DbLayout>
</template>
