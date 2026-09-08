<script setup lang="ts">
/**
 * TorqueDbPage
 * 締付トルクのデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import { computed } from 'vue'

import { torqueData } from '~/constants/data/torqueData'
import { TORQUE_DB_COLUMNS } from '~/constants/databaseConstants'

const flattenedData = computed(() => {
  return torqueData.flatMap(cat =>
    cat.items.map(item => ({
      category: cat.category,
      reference: cat.reference,
      ...item,
    })),
  )
})
</script>

<template>
  <DbLayout
    :data="flattenedData"
    :columns="TORQUE_DB_COLUMNS"
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
