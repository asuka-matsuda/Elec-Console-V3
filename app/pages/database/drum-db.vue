<script setup lang="ts">
/**
 * DrumDbPage
 * ケーブルドラムのデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import { drumData } from "~/utils/data/drumData";
import type { TableColumn } from "~/components/AppTable.vue";

const tableColumns: TableColumn[] = [
  { key: "category", label: "カテゴリ" },
  { key: "id", label: "ドラム記号 (ID)" },
  { key: "flange_diameter", label: "ツバ径 (mm)" },
  { key: "barrel_diameter", label: "胴径 (mm)" },
  { key: "outer_width", label: "外幅 (mm)" },
  { key: "inner_width", label: "内幅 (mm)" },
  { key: "shaft_hole", label: "軸穴径 (mm)" },
  { key: "weight", label: "空ドラム質量 (kg)" },
];
</script>

<template>
  <AppDbViewer
    :data="drumData"
    :columns="tableColumns"
    :search-mapper="(item) => `${item.category} ${item.id}`"
    placeholder="種類、サイズなどを検索... (例: L1)"
  >
    <template #cell-category="{ value }">
      <strong>{{ value }}</strong>
    </template>
  </AppDbViewer>
</template>
