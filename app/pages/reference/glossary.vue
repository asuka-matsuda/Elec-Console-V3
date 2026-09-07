<script setup lang="ts">
/**
 * Glossary
 * 用語集画面のコンポーネントです。専門用語の検索や、五十音・カテゴリ別での絞り込み機能を提供します。
 */
import { computed, ref } from 'vue'

import { useDbFilter } from '~/composables/useDbFilter'
import { glossaryData } from '~/constants/data/glossaryData'
import {
  collectAvailableKanaRows,
  filterByKana,
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

const activeKanas = ref<string[]>([])

const filteredGlossary = computed(() => {
  const sorted = sortByKana(baseFilteredGlossary.value, item => item.kana)

  return filterByKana(sorted, activeKanas.value, item => item.kana)
})

const availableRows = computed(() =>
  collectAvailableKanaRows(baseFilteredGlossary.value, item => item.kana),
)

const categoryColorMap: Record<string, string> = {
  電気: 'var(--trade-color-electric)',
  建築: 'var(--trade-color-architecture)',
  空調・換気: 'var(--trade-color-hvac)',
  衛生: 'var(--trade-color-plumbing)',
  雑学: 'var(--trade-color-trivia)',
}
</script>

<template>
  <div class="glossary-view">
    <aside class="filter-sidebar">
      <AppFilterPanel
        v-model:search-query="searchQuery"
        v-model:active-cats="activeCats"
        :category-options="categoryOptions"
        placeholder="用語名や説明を検索..."
      >
        <template #extra-filters>
          <AppFormGroup label="INDEX (読み・五十音)">
            <AppKanaFilter
              v-model="activeKanas"
              :available-rows="availableRows"
            />
          </AppFormGroup>
        </template>
      </AppFilterPanel>
    </aside>

    <main class="glossary-main">
      <div v-if="filteredGlossary.length > 0" class="glossary-list">
        <AppPanel
          v-for="item in filteredGlossary"
          :key="item.term"
          as="article"
          class="glossary-item"
          :style="{ '--item-accent': categoryColorMap[item.category] }"
        >
          <header class="item-header">
            <div class="item-title">
              <span class="item-kana">{{ item.kana }}</span>
              <h2 class="item-term">
                {{ item.term }}
              </h2>
            </div>
            <AppBadge :color="categoryColorMap[item.category]">
              {{ item.category }}
            </AppBadge>
          </header>

          <div class="item-body">
            <p class="item-desc">
              {{ item.desc }}
            </p>

            <div v-if="item.related" class="item-meta">
              <span class="meta-label">関連用語</span>
              <p class="meta-text">
                {{ item.related }}
              </p>
            </div>

            <div v-if="item.example" class="item-meta">
              <span class="meta-label">用例・備考</span>
              <p class="meta-text">
                {{ item.example }}
              </p>
            </div>
          </div>
        </AppPanel>
      </div>

      <AppEmptyState
        v-else
        icon="search"
        title="該当する用語が見つかりません"
        description="検索キーワードまたは五十音・工種フィルターの条件を変更してください。"
      />
    </main>
  </div>
</template>

<style scoped lang="scss">
.glossary-view {
  --trade-color-electric: #eab308;
  --trade-color-architecture: #ea580c;
  --trade-color-hvac: #22c55e;
  --trade-color-plumbing: #06b6d4;
  --trade-color-trivia: var(--color-category-reference);

  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-card-gap);

  max-width: 1400px;
  min-height: 0;
}

.filter-sidebar {
  flex-shrink: 0;
}

.glossary-main {
  display: flex;
  flex: 1;
  flex-direction: column;

  min-width: 0;
  min-height: 0;
}

.glossary-list {
  display: flex;
  flex-direction: column;
}

.glossary-item {
  position: relative;
  z-index: 1;

  display: flex;
  flex-direction: column;

  transition: var(--transition-base);
}

.item-header {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;

  padding-bottom: var(--space-1);
  border-bottom: var(--border-width-base) solid transparent;
  border-image: linear-gradient(
      to right,
      transparent,
      var(--color-border) 50%,
      transparent
    )
    1;
}

.item-title {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.item-kana {
  font-size: var(--font-size-2xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}

.item-term {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}

.item-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.item-desc {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);
}

.item-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);

  padding: var(--space-3);
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
  border-radius: var(--radius-sm);
}

.meta-label {
  font-size: var(--font-size-2xs);
  line-height: var(--line-height-base);
  color: var(--color-text-muted);
}

.meta-text {
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: var(--color-text-secondary);
}
</style>
