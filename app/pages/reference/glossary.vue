<script setup lang="ts">
/**
 * Glossary
 * 用語集画面のコンポーネントです。専門用語の検索や、五十音・カテゴリ別での絞り込み機能を提供します。
 */
import { ref, computed } from "vue";
import { glossaryData } from "~/constants/data/glossaryData";
import { useDbFilter } from "~/composables/useDbFilter";

const {
  searchQuery,
  activeCats,
  categoryOptions,
  filteredData: baseFilteredGlossary,
} = useDbFilter({
  data: glossaryData,
  searchMapper: (item) => `${item.term} ${item.kana || ""}`,
});

function getKanaRow(kanaStr: string) {
  if (!kanaStr) return "other";
  const firstChar = kanaStr.charAt(0);
  if (/[ぁEおア-オ]/.test(firstChar)) return "a";
  if (/[ぁEこカ-コぁEごガ-ゴ]/.test(firstChar)) return "k";
  if (/[ぁEそサ-ソぁEぞザ-ゾ]/.test(firstChar)) return "s";
  if (/[ぁEとタ-トだ-どダ-ド]/.test(firstChar)) return "t";
  if (/[な-のナ-ノ]/.test(firstChar)) return "n";
  if (/[\u306f-\u307b\u30cf-\u30db\u3070-\u307c\u30d0-\u30dc\u3071-\u307d\u30d1-\u30dd]/.test(firstChar)) return "h";
  if (/[\u307e-\u3082\u30de-\u30e2]/.test(firstChar)) return "m";
  if (/[や-よヤ-ヨ]/.test(firstChar)) return "y";
  if (/[ら-ろラ-ロ]/.test(firstChar)) return "r";
  if (/[わ-んワ-ン]/.test(firstChar)) return "w";
  return "other";
}

const activeKanas = ref<string[]>([]);

const filteredGlossary = computed(() => {
  let result = [...baseFilteredGlossary.value].sort((a, b) =>
    (a.kana || "").localeCompare(b.kana || "", "ja"),
  );

  if (activeKanas.value.length > 0) {
    result = result.filter((item) => {
      const row = getKanaRow(item.kana || "");
      return (
        activeKanas.value.includes(row) ||
        (activeKanas.value.includes("w") && row === "other")
      );
    });
  }

  return result;
});

const availableRows = computed(() => {
  const rows = new Set<string>();
  baseFilteredGlossary.value.forEach((item) => {
    rows.add(getKanaRow(item.kana || ""));
  });
  return rows;
});

const categoryColorMap: Record<string, string> = {
  電気: '#eab308',
  建築: '#ea580c',
  '空調・換気': '#22c55e',
  衛生: '#06b6d4',
  雑学: 'var(--color-category-reference)',
};
</script>

<template>
  <div>
    <div class="l-filter-layout">
      <div class="l-filter-layout__grid">
        <aside class="l-filter-layout__sidebar">
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
          <div
            v-if="filteredGlossary.length > 0"
            class="c-glossary-list"
          >
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

                <div
                  v-if="item.related"
                  class="c-glossary-card__meta"
                >
                  <span class="c-glossary-card__label">関連用語</span>
                  <p class="c-glossary-card__text">
                    {{ item.related }}
                  </p>
                </div>

                <div
                  v-if="item.example"
                  class="c-glossary-card__meta"
                >
                  <span class="c-glossary-card__label">用例・備考</span>
                  <p class="c-glossary-card__text">
                    {{ item.example }}
                  </p>
                </div>
              </div>
            </AppCard>
          </div>

          <div
            v-else
            class="c-empty-state"
          >
            <p>条件に一致する用語が見つかりません。</p>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.l-filter-layout {
  // --- レイアウト・配置 ---
  container-name: filter-layout;
  container-type: inline-size;

  @include flex-column;

  flex: 1;

  // --- ボックスモデル ---
  width: 100%;
  max-width: 1400px;
  min-height: 0;

  // --- 子要素 ---
  &__grid {
    // --- レイアウト・配置 ---
    @include flex-column(var(--space-card-gap));

    flex: 1;

    // --- ボックスモデル ---
    min-height: 0;
  }

  &__sidebar {
    // --- ボックスモデル ---
    width: 100%;
  }

  &__main {
    // --- レイアウト・配置 ---
    @include flex-column;

    flex: 1;

    // --- ボックスモデル ---
    min-width: 0;
    min-height: 0;
  }
}

.c-glossary-list {
  // --- レイアウト・配置 ---
  @include flex-column;
}

.c-glossary-card {
  // --- レイアウト・配置 ---
  @include flex-column;

  // --- 視覚効果 ---
  @include state-base;

  // --- 子要素 ---
  &__header {
    // --- レイアウト・配置 ---
    @include flex-between(var(--space-inline-gap));

    // --- ボックスモデル ---
    padding-bottom: var(--space-control-py-sm);
    border-bottom: var(--border-width-base) solid transparent;
    border-image: linear-gradient(to right, transparent, var(--color-border) 50%, transparent) 1;
  }

  &__title {
    // --- レイアウト・配置 ---
    @include flex-column(var(--space-1));
  }

  &__kana {
    // --- 継承 ---
    @include text-meta;
  }

  &__term {
    // --- 継承 ---
    @include text-title-md;

  }

  &__body {
    // --- レイアウト・配置 ---
    @include flex-column(var(--space-1));
  }

  &__desc {
    // --- 継承 ---
    @include text-title-sm;

    // --- タイポグラフィ ---
    line-height: 1.6;
    color: var(--color-text-secondary);
  }

  &__meta {
    // --- レイアウト・配置 ---
    @include flex-column(var(--space-stack-gap-sm));

    // --- ボックスモデル ---
    padding: var(--space-card-pad-md);

    @include border-dim;
  }

  &__label {
    // --- 継承 ---
    @include text-meta;

    // --- タイポグラフィ ---
    }

  &__text {
    // --- 継承 ---
    @include text-desc;

    // --- タイポグラフィ ---
    line-height: 1.5;
    color: var(--color-text-secondary);
  }
}

.c-empty-state {
  // --- 継承 ---
  @include text-body;

  // --- ボックスモデル ---
  padding: var(--space-card-pad);

  @include border-dim;

  // --- タイポグラフィ ---
  color: var(--color-text-muted);
  text-align: center;
}
</style>
