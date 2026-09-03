<script setup lang="ts">
/**
 * Glossary
 * 用語集画面のコンポーネントです。専門用語の検索や、五十音・カテゴリ別での絞り込み機能を提供します。
 */
import { computed, ref } from 'vue'

import { useDbFilter } from '~/composables/useDbFilter'
import { glossaryData } from '~/constants/data/glossaryData'

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

function getKanaRow(kanaStr: string) {
  if (!kanaStr) return 'other'
  const firstChar = kanaStr.charAt(0)

  if (/[ぁ-おア-オ]/.test(firstChar)) return 'a'
  if (/[か-こカ-コが-ごガ-ゴ]/.test(firstChar)) return 'k'
  if (/[さ-そサ-ソざ-ぞザ-ゾ]/.test(firstChar)) return 's'
  if (/[た-とタ-トだ-どダ-ド]/.test(firstChar)) return 't'
  if (/[な-のナ-ノ]/.test(firstChar)) return 'n'
  if (
    /[\u306f-\u307b\u30cf-\u30db\u3070-\u307c\u30d0-\u30dc\u3071-\u307d\u30d1-\u30dd]/.test(
      firstChar,
    )
  )
    return 'h'
  if (/[\u307e-\u3082\u30de-\u30e2]/.test(firstChar)) return 'm'
  if (/[や-よヤ-ヨ]/.test(firstChar)) return 'y'
  if (/[ら-ろラ-ロ]/.test(firstChar)) return 'r'
  if (/[わ-んワ-ン]/.test(firstChar)) return 'w'

  return 'other'
}

const filteredGlossary = computed(() => {
  let result = [...baseFilteredGlossary.value].sort((a, b) =>
    (a.kana || '').localeCompare(b.kana || '', 'ja'),
  )

  if (activeKanas.value.length > 0) {
    result = result.filter((item) => {
      const row = getKanaRow(item.kana || '')

      return (
        activeKanas.value.includes(row)
        || (activeKanas.value.includes('w') && row === 'other')
      )
    })
  }

  return result
})

const availableRows = computed(() => {
  const rows = new Set<string>()

  baseFilteredGlossary.value.forEach((item) => {
    rows.add(getKanaRow(item.kana || ''))
  })

  return rows
})

const categoryColorMap: Record<string, string> = {
  電気: 'var(--trade-color-electric)',
  建築: 'var(--trade-color-architecture)',
  空調・換気: 'var(--trade-color-hvac)',
  衛生: 'var(--trade-color-plumbing)',
  雑学: 'var(--trade-color-trivia)',
}
</script>

<template>
  <div>
    <div class="l-filter-layout">
      <div class="l-filter-layout__grid">
        <aside>
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

        <main class="l-filter-layout__main">
          <div v-if="filteredGlossary.length > 0" class="c-glossary-list">
            <AppCard
              v-for="item in filteredGlossary"
              :key="item.term"
              class="c-glossary-card"
              :style="{ '--card-accent': categoryColorMap[item.category] }"
            >
              <div class="c-glossary-card__header">
                <div class="c-glossary-card__title">
                  <span class="c-glossary-card__kana">{{ item.kana }}</span>
                  <h2 class="c-glossary-card__term">
                    {{ item.term }}
                  </h2>
                </div>
                <AppBadge :color="categoryColorMap[item.category]">
                  {{ item.category }}
                </AppBadge>
              </div>

              <div class="c-glossary-card__body">
                <p class="c-glossary-card__desc">
                  {{ item.desc }}
                </p>

                <div v-if="item.related" class="c-glossary-card__meta">
                  <span class="c-glossary-card__label">関連用語</span>
                  <p class="c-glossary-card__text">
                    {{ item.related }}
                  </p>
                </div>

                <div v-if="item.example" class="c-glossary-card__meta">
                  <span class="c-glossary-card__label">用例・備考</span>
                  <p class="c-glossary-card__text">
                    {{ item.example }}
                  </p>
                </div>
              </div>
            </AppCard>
          </div>

          <AppEmptyState
            v-else
            icon="search"
            title="該当する用語が見つかりません"
            description="検索キーワードまたは五十音・工種フィルターの条件を変更してください。"
          />
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.l-filter-layout {
  --trade-color-electric: #eab308;
  --trade-color-architecture: #ea580c;
  --trade-color-hvac: #22c55e;
  --trade-color-plumbing: #06b6d4;
  --trade-color-trivia: var(--color-category-reference);

  @include flex-start-stretch($direction: column);

  container-name: filter-layout;
  container-type: inline-size;
  flex: 1;

  max-width: 1400px;
  min-height: 0;

  &__grid {
    @include flex-start-stretch($direction: column);

    flex: 1;
    gap: var(--space-card-gap);
    min-height: 0;
  }

  &__main {
    @include flex-start-stretch($direction: column);

    flex: 1;
    min-width: 0;
    min-height: 0;
  }
}

.c-glossary-list {
  @include flex-start-stretch($direction: column);
}

.c-glossary-card {
  @include flex-start-stretch($direction: column);
  @include state-base;

  &__header {
    @include flex-between-center;

    gap: var(--space-2);
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

  &__title {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
  }

  &__kana {
    @include text-meta;
  }

  &__term {
    @include text-title("md");
  }

  &__body {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
  }

  &__desc {
    @include text-title("sm");

    color: var(--color-text-secondary);
  }

  &__meta {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
    padding: var(--space-3);

    @include border-base($opacity: 30%);
  }

  &__label {
    @include text-meta;
  }

  &__text {
    @include text-desc;

    color: var(--color-text-secondary);
  }
}
</style>
