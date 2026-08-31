<script setup lang="ts">
/**
 * DrumDbPage
 * ケーブルドラムのデータベース情報を一覧表示・検索するためのページコンポーネントです。
 */
import { drumData } from "~/constants/data/drumData";
import type { TableColumn } from "~/components/AppTable.vue";

const tableColumns: TableColumn[] = [
  { key: "category", label: "カテゴリ", sortable: true },
  { key: "id", label: "ドラム記号 (ID)", sortable: true },
  { key: "flange_diameter", label: "ツバ径 (mm)", sortable: true },
  { key: "barrel_diameter", label: "胴径 (mm)", sortable: true },
  { key: "outer_width", label: "外幅 (mm)", sortable: true },
  { key: "inner_width", label: "内幅 (mm)", sortable: true },
  { key: "shaft_hole", label: "軸穴径 (mm)", sortable: true },
  { key: "weight", label: "空ドラム質量 (kg)", sortable: true },
];
</script>

<template>
  <DbViewer
    :data="drumData"
    :columns="tableColumns"
    :search-mapper="(item) => `${item.category} ${item.id}`"
    placeholder="種類、サイズなどを検索... (例: L1)"
  >
    <template #cell-category="{ value }">
      <strong>{{ value }}</strong>
    </template>
  </DbViewer>
</template>
