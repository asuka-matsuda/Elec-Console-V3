<script setup lang="ts">
/**
 * 電気工事用語集画面
 * 用語集画面のコンポーネントです。専門用語の検索や、五十音・カテゴリ別での絞り込み機能を提供します。
 */
import { computed, ref } from 'vue'

import { useDbFilter } from '~/composables/useDbFilter'
import { glossaryData } from '~/constants/data/glossaryData'
import type { BadgePresetId } from '~/types/components'
import {
  collectAvailableKanaRows,
  filterByKana,
  type KanaRowKey,
  sortByKana,
} from '~/utils/kana'

useHead({
  title: '用語集',
})

const {
  searchQuery,
  activeCats,
  categoryOptions,
  filteredData: baseFilteredGlossary,
} = useDbFilter({
  data: glossaryData,
  searchMapper: item => `${item.term} ${item.kana || ''}`,
})

const activeKanas = ref<KanaRowKey[]>([])

const filteredGlossary = computed(() => {
  const sorted = sortByKana(baseFilteredGlossary.value, item => item.kana)

  return filterByKana(sorted, activeKanas.value, item => item.kana)
})

const availableRows = computed(() =>
  collectAvailableKanaRows(baseFilteredGlossary.value, item => item.kana),
)

const categoryPresetMap: Record<string, BadgePresetId> = {
  電気: 'trade:electric',
  建築: 'trade:architecture',
  空調・換気: 'trade:hvac',
  衛生: 'trade:plumbing',
  雑学: 'trade:trivia',
}
</script>

<template>
  <div class="glossary-view flex flex-1 flex-col gap-panel-gap max-w-[1400px] min-h-0">
    <aside class="shrink-0">
      <FilterPanel
        v-model:search-query="searchQuery"
        v-model:active-cats="activeCats"
        :category-options="categoryOptions"
        placeholder="用語名や説明を検索..."
      >
        <FormGroup label="INDEX (読み・五十音)">
          <KanaFilter
            v-model="activeKanas"
            :available-rows="availableRows"
          />
        </FormGroup>
      </FilterPanel>
    </aside>

    <ul
      v-if="filteredGlossary.length > 0"
      class="flex flex-1 flex-col gap-panel-gap min-w-0 min-h-0 list-none m-0 p-0"
    >
      <li
        v-for="item in filteredGlossary"
        :key="item.term"
      >
        <PanelGlossary
          :item="item"
          :badge-id="categoryPresetMap[item.category]"
        />
      </li>
    </ul>

    <EmptyState
      v-else
      icon="search"
      title="該当する用語が見つかりません"
      description="検索キーワードまたは五十音・工種フィルターの条件を変更してください。"
      class="flex-1"
    />
  </div>
</template>
