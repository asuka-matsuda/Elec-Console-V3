<script setup lang="ts">
import { drumData } from '~/utils/drumData'
import { useDbFilter } from '~/composables/useDbFilter'

const { 
  searchQuery, 
  activeCats, 
  categoryOptions, 
  filteredData: filteredDrums, 
  toggleCat 
} = useDbFilter({
  data: drumData,
  searchMapper: item => `${item.category} ${item.id}`
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
          placeholder="種類、サイズなどを検索... (例: L1)"
        />
      </template>

      <template #main>
        <AppPanel v-if="filteredDrums.length > 0" class="p-db__table-panel">
          <AppTable>
            <template #header>
              <tr>
                <th>カテゴリ</th>
                <th>ドラム記号 (ID)</th>
                <th>ツバ径 (mm)</th>
                <th>胴径 (mm)</th>
                <th>外巾 (mm)</th>
                <th>内巾 (mm)</th>
                <th>軸穴径 (mm)</th>
                <th>空ドラム質量 (kg)</th>
                <th>最大巻取質量 (kg)</th>
              </tr>
            </template>
            <template #body>
              <tr v-for="(item, index) in filteredDrums" :key="`${item.id}-${index}`">
                <td><strong>{{ item.category }}</strong></td>
                <td>{{ item.id }}</td>
                <td>{{ item.flange_diameter }}</td>
                <td>{{ item.barrel_diameter }}</td>
                <td>{{ item.outer_width }}</td>
                <td>{{ item.inner_width }}</td>
                <td>{{ item.shaft_hole }}</td>
                <td>{{ item.weight }}</td>
                <td>{{ item.max_winding_weight }}</td>
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
/* No specific scoped styles needed anymore */
</style>
