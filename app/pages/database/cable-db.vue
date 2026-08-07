<script setup lang="ts">
import { cableData } from '~/utils/cableData'
import { useDbFilter } from '~/composables/useDbFilter'

const { 
  searchQuery, 
  activeCats, 
  categoryOptions, 
  filteredData: filteredCables
} = useDbFilter({
  data: cableData,
  searchMapper: item => `${item.category} ${item.cores} ${item.size}${item.unit} ${item.standard || ''}`
})
</script>

<template>
  <div class="p-db">
    <AppFilterLayout>
      <template #sidebar>
        <AppFilterPanel
          v-model:searchQuery="searchQuery"
          :category-options="categoryOptions"
          v-model:activeCats="activeCats"
          placeholder="種類、サイズなどを検索... (例: CVT 22)"
        />
      </template>

      <template #main>
        <AppPanel v-if="filteredCables.length > 0" class="p-db__table-panel">
          <AppTable>
            <template #header>
              <tr>
                <th>ケーブル名称</th>
                <th>許容電流 (A)</th>
                <th>仕上外径 (mm)</th>
                <th>概算質量 (kg/km)</th>
                <th>導体抵抗 (Ω/km)</th>
                <th>耐電圧</th>
                <th>基底/最高温度</th>
                <th>参考規格/メーカー</th>
              </tr>
            </template>
            <template #body>
              <tr v-for="(item, index) in filteredCables" :key="`${item.category}-${item.size}-${item.cores}-${index}`">
                <td>
                  <strong>{{ item.category }}</strong>
                  {{ item.cores !== '-' ? item.cores + ' ' : '' }}{{ item.size }}{{ item.unit }}
                </td>
                <td>{{ item.ampacity }}</td>
                <td>{{ item.diameter }}</td>
                <td>{{ item.weight }}</td>
                <td>{{ item.resistance }}</td>
                <td>{{ item.voltage }}</td>
                <td>{{ item.baseTemp }} / {{ item.maxTemp }}</td>
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
