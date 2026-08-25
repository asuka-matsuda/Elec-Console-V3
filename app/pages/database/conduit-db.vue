<script setup lang="ts">
/**
 * ConduitDbPage
 * 電線管のデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import { conduitData } from "~/utils/data/conduitData";
import type { TableColumn } from "~/components/AppTable.vue";

const tableColumns: TableColumn[] = [
  { key: "category", label: "配管種類" },
  { key: "size", label: "呼び径" },
  { key: "innerDiameter", label: "内径 (mm)" },
  { key: "outerDiameter", label: "外径 (mm)" },
  { key: "area", label: "断面積 (mm²)" },
  { key: "standard", label: "規格" },
];
</script>

<template>
  <AppDbViewer
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
      <span class="c-db-meta">{{ value }}</span>
    </template>
  </AppDbViewer>
</template>

<style scoped lang="scss">
.c-db-meta {
  // --- 継承 ---
  @extend %text-sm;

  // --- タイポグラフィ ---
  color: var(--color-text-muted);
}
</style>
