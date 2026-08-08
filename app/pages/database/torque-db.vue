<script setup lang="ts">
import { computed } from "vue";
import { torqueData } from "~/utils/torqueData";
import type { TableColumn } from "~/components/AppTable.vue";

// Flatten the nested torqueData structure
const flattenedData = computed(() => {
  return torqueData.flatMap((cat) =>
    cat.items.map((item) => ({
      category: cat.category,
      reference: cat.reference,
      ...item,
    })),
  );
});

const tableColumns: TableColumn[] = [
  { key: "category", label: "カテゴリ" },
  { key: "size", label: "サイズ" },
  { key: "torque_nm", label: "標準トルク (N・m)" },
  { key: "range_nm", label: "許容範囲 (N・m)" },
  { key: "note", label: "備考" },
  { key: "reference", label: "参考規格" },
];
</script>

<template>
  <AppDbViewer
    :data="flattenedData"
    :columns="tableColumns"
    :search-mapper="(item) => `${item.category} ${item.size} ${item.note}`"
    placeholder="種類、サイズなどを検索... (例: M8)"
  >
    <template #cell-category="{ value }">
      <strong>{{ value }}</strong>
    </template>

    <template #cell-reference="{ value }">
      <span class="p-db__meta">{{ value }}</span>
    </template>
  </AppDbViewer>
</template>
