<script setup lang="ts">
import { rackData } from '~/utils/rackData'
import { useDbFilter } from '~/composables/useDbFilter'

const { 
  searchQuery, 
  activeCats, 
  categoryOptions, 
  filteredData: filteredRacks, 
  toggleCat 
} = useDbFilter({
  data: rackData,
  searchMapper: item => `${item.category} ${item.size}`
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
          placeholder="種類、サイズなどを検索... (例: SR 300)"
        />
      </template>

      <template #main>
        <AppPanel v-if="filteredRacks.length > 0" class="p-db__table-panel">
          <AppTable>
            <template #header>
              <tr>
                <th>カテゴリ</th>
                <th>サイズ (呼び幅 mm)</th>
                <th>親桁高さ (mm)</th>
                <th>1本あたり質量 (kg/3m)</th>
                <th>1mあたり質量 (kg/m)</th>
              </tr>
            </template>
            <template #body>
              <tr v-for="(item, index) in filteredRacks" :key="`${item.category}-${item.size}-${index}`">
                <td><strong>{{ item.category }}</strong></td>
                <td>{{ item.size }}</td>
                <td>{{ item.height }}</td>
                <td>{{ item.weightPiece }}</td>
                <td>{{ item.weightMeter }}</td>
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
