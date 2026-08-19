<script setup lang="ts">
import { cableData } from "~/utils/data/cableData";
import type { TableColumn } from "~/components/AppTable.vue";

const tableColumns: TableColumn[] = [
  { key: "name", label: "ケーブル名称" },
  { key: "ampacity", label: "許容電流 (A)" },
  { key: "diameter", label: "仕上外径 (mm)" },
  { key: "weight", label: "概算質量 (kg/m)" },
  { key: "voltage", label: "耐電圧" },
  { key: "temp", label: "基底/最高温度" },
  { key: "standard", label: "参考規格/メーカー" },
];
</script>

<template>
  <AppDbViewer
    :data="cableData"
    :columns="tableColumns"
    :search-mapper="(item) => `${item.name} ${item.standard || ''}`"
    placeholder="種類、サイズなどを検索... (例: CVT 22)"
  >
    <!-- 質量セル (kg/km -> kg/m) -->
    <template #cell-weight="{ value }">
      {{ isNaN(Number(value)) ? value : Number(value) / 1000 }}
    </template>

    <!-- 温度セル -->
    <template #cell-temp="{ row }">
      {{ row.baseTemp }} / {{ row.maxTemp }}
    </template>

    <!-- 規格セル -->
    <template #cell-standard="{ value }">
      <span class="p-db__meta">{{ value }}</span>
    </template>
  </AppDbViewer>
</template>
