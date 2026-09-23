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

const categoryColorMap: Record<string, string> = {
  電気: 'var(--color-trade-electric)',
  建築: 'var(--color-trade-architecture)',
  空調・換気: 'var(--color-trade-hvac)',
  衛生: 'var(--color-trade-plumbing)',
  雑学: 'var(--color-trade-trivia)',
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

    <div class="flex flex-1 flex-col min-w-0 min-h-0">
      <div v-if="filteredGlossary.length > 0" class="flex flex-col gap-panel-gap">
        <Panel
          v-for="item in filteredGlossary"
          :key="item.term"
          as="article"
          class="relative z-[1] flex flex-col glossary-item"
          :style="{ '--item-accent': categoryColorMap[item.category] }"
        >
          <header class="flex items-center justify-between gap-2 pb-1 item-header">
            <div class="flex flex-col gap-1">
              <span class="item-kana">{{ item.kana }}</span>
              <h2 class="item-term">
                {{ item.term }}
              </h2>
            </div>
            <Badge
              v-if="categoryPresetMap[item.category]"
              :id="categoryPresetMap[item.category]"
            >
              {{ item.category }}
            </Badge>
          </header>

          <div class="flex flex-col gap-1">
            <p class="item-desc">
              {{ item.desc }}
            </p>

            <div v-if="item.related" class="flex flex-col gap-1 p-3 item-meta">
              <span class="meta-label">関連用語</span>
              <p class="meta-text">
                {{ item.related }}
              </p>
            </div>

            <div v-if="item.example" class="flex flex-col gap-1 p-3 item-meta">
              <span class="meta-label">用例・備考</span>
              <p class="meta-text">
                {{ item.example }}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <EmptyState
        v-else
        icon="search"
        title="該当する用語が見つかりません"
        description="検索キーワードまたは五十音・工種フィルターの条件を変更してください。"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.glossary-item {
  transition: var(--transition-base);
}

.item-header {
  border-bottom: var(--border-width-base) solid transparent;
  border-image: linear-gradient(
      to right,
      transparent,
      var(--color-border) 50%,
      transparent
    )
    1;
}

.item-kana {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.item-desc {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);
}

.item-meta {
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
}

.meta-label {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.meta-text {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
