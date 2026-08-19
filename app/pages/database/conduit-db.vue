<script setup lang="ts">
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
      <span class="p-db__meta">{{ value }}</span>
    </template>
  </AppDbViewer>
</template>
