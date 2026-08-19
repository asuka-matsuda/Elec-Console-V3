<script setup lang="ts">
import { rackData } from "~/utils/data/rackData";
import type { TableColumn } from "~/components/AppTable.vue";

const tableColumns: TableColumn[] = [
  { key: "category", label: "カテゴリ" },
  { key: "size", label: "サイズ (呼び幅 mm)" },
  { key: "height", label: "親桁高さ (mm)" },
  { key: "weightPiece", label: "1本あたり質量 (kg/3m)" },
  { key: "weightMeter", label: "1mあたり質量 (kg/m)" },
];
</script>

<template>
  <AppDbViewer
    :data="rackData"
    :columns="tableColumns"
    :search-mapper="(item) => `${item.category} ${item.size}`"
    placeholder="種類、サイズなどを検索... (例: SR 300)"
  >
    <template #cell-category="{ value }">
      <strong>{{ value }}</strong>
    </template>
  </AppDbViewer>
</template>
