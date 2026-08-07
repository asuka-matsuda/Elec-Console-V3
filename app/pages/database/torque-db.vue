<script setup lang="ts">
import { computed } from 'vue'
import { torqueData } from '~/utils/torqueData'
import { useDbFilter } from '~/composables/useDbFilter'

// Flatten the nested torqueData structure
const flattenedData = computed(() => {
  return torqueData.flatMap(cat => 
    cat.items.map(item => ({
      category: cat.category,
      reference: cat.reference,
      ...item
    }))
  )
})

const { 
  searchQuery, 
  activeCats, 
  categoryOptions, 
  filteredData: filteredTorques, 
  toggleCat 
} = useDbFilter({
  data: flattenedData.value,
  searchMapper: item => `${item.category} ${item.size} ${item.note}`
})
</script>

<template>
  <div class="p-db">
    <AppFilterLayout>
      <template #sidebar>
        <AppFilterPanel
          v-model:searchQuery="searchQuery"
          :category-options="categoryOptions"
          :active-cats="activeCats"
          @toggleCat="toggleCat"
          placeholder="種類、サイズなどを検索... (例: M8)"
        />
      </template>

      <template #main>
        <AppPanel v-if="filteredTorques.length > 0" class="p-db__table-panel">
          <AppTable>
            <template #header>
              <tr>
                <th>カテゴリ</th>
                <th>サイズ</th>
                <th>標準トルク (N・m)</th>
                <th>許容範囲 (N・m)</th>
                <th>備考</th>
                <th>参考規格</th>
              </tr>
            </template>
            <template #body>
              <tr v-for="(item, index) in filteredTorques" :key="`${item.category}-${item.size}-${index}`">
                <td><strong>{{ item.category }}</strong></td>
                <td>{{ item.size }}</td>
                <td>{{ item.torque_nm }}</td>
                <td>{{ item.range_nm }}</td>
                <td>{{ item.note }}</td>
                <td class="u-text-sm u-text-muted">{{ item.reference }}</td>
              </tr>
            </template>
          </AppTable>
        </AppPanel>
        
        <div v-else class="p-db__empty">
          <p>条件に一致するデータが見つかりません。</p>
        </div>
      </template>
    </AppFilterLayout>
  </div>
</template>

<style scoped lang="scss">
.u-text-sm {
  font-size: var(--text-sm);
}
.u-text-muted {
  color: var(--color-text-muted);
}
</style>
