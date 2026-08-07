<script setup lang="ts">
import { conduitData } from '~/utils/conduitData'
import { useDbFilter } from '~/composables/useDbFilter'

const { 
  searchQuery, 
  activeCats, 
  categoryOptions, 
  filteredData: filteredConduits, 
  toggleCat 
} = useDbFilter({
  data: conduitData,
  searchMapper: item => `${item.category} ${item.size} ${item.standard || ''}`
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
          placeholder="種類、サイズなどを検索... (例: G22)"
        />
      </template>

      <template #main>
        <AppPanel v-if="filteredConduits.length > 0" class="p-db__table-panel">
          <AppTable>
            <template #header>
              <tr>
                <th>配管種類</th>
                <th>呼び径</th>
                <th>内径 (mm)</th>
                <th>外径 (mm)</th>
                <th>断面積 (mm²)</th>
                <th>占積率 32% (mm²)</th>
                <th>占積率 48% (mm²)</th>
                <th>規格</th>
              </tr>
            </template>
            <template #body>
              <tr v-for="(item, index) in filteredConduits" :key="`${item.category}-${item.size}-${index}`">
                <td><strong>{{ item.category }}</strong></td>
                <td>{{ item.size }}</td>
                <td>{{ item.innerDiameter }}</td>
                <td>{{ item.outerDiameter }}</td>
                <td>{{ item.area }}</td>
                <td>{{ item.area32 }}</td>
                <td>{{ item.area48 }}</td>
                <td class="u-text-sm u-text-muted">{{ item.standard }}</td>
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
