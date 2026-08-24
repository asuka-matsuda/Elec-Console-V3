<script setup lang="ts">
/**
 * Glossary
 * 用語集画面のコンポ�Eネントです。専門用語�E検索めE��五十音・カチE��リ別での絞り込み機�Eを提供します、E
 */
import { ref, computed } from "vue";
import { glossaryData } from "~/utils/data/glossaryData";
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
  if (/[な-のチEノ]/.test(firstChar)) return "n";
  if (/[は-ほチEホ�E-ぼチEボ�E-ぽチEポ]/.test(firstChar)) return "h";
  if (/[ま-も�E-モ]/.test(firstChar)) return "m";
  if (/[めEよヤ-ヨ]/.test(firstChar)) return "y";
  if (/[めEろラ-ロ]/.test(firstChar)) return "r";
  if (/[めEんワ-ン]/.test(firstChar)) return "w";
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
  電氁E "#eab308",
  建篁E "#ea580c",
  "空調・換氁E: "#22c55e",
  衛生: "#06b6d4",
  雑学: "var(--color-category-reference)",
};
</script>

<template>
  <div class="p-glossary">
    <div class="l-filter-layout">
      <div class="l-filter-layout__grid">
        <aside class="l-filter-layout__sidebar">
          <AppFilterPanel
            v-model:search-query="searchQuery"
            v-model:active-cats="activeCats"
            :category-options="categoryOptions"
            placeholder="用語名めE��明を検索..."
          >
            <template #extra-filters>
              <AppFormGroup label="INDEX (読み・五十音)">
                  <AppKanaFilter v-model="activeKanas" :available-rows="availableRows" />
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
                  <h2 class="c-glossary-card__term">{{ item.term }}</h2>
                </div>
                <AppBadge
                  :style="{
                    '--badge-color': categoryColorMap[item.category],
                    '--badge-border': categoryColorMap[item.category],
                  }"
                >
                  {{ item.category }}
                </AppBadge>
              </div>

              <div class="c-glossary-card__body">
                <p class="c-glossary-card__desc">{{ item.desc }}</p>

                <div v-if="item.related" class="c-glossary-card__meta">
                  <span class="c-glossary-card__label">関連用誁E/span>
                  <p class="c-glossary-card__text">{{ item.related }}</p>
                </div>

                <div v-if="item.example" class="c-glossary-card__meta">
                  <span class="c-glossary-card__label">用例�E備老E/span>
                  <p class="c-glossary-card__text">{{ item.example }}</p>
                </div>
              </div>
            </AppCard>
          </div>

          <div v-else class="c-empty-state">
            <p>条件に一致する用語が見つかりません、E/p>
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

  @include flex-column(0);

  flex: 1;


  // --- ボックスモデル ---

  width: 100%;
  max-width: 1400px;
  min-height: 0;


  // --- 子要素 ---

  &__grid {
    // --- レイアウト・配置 ---
    @include flex-column(0);

    flex: 1;
    gap: var(--gap-section);

    // --- ボックスモデル ---
    min-height: 0;
  }

  &__sidebar {
    // --- ボックスモデル ---
    width: 100%;
  }

  &__main {
    // --- レイアウト・配置 ---
    @include flex-column(0);

    flex: 1;

    // --- ボックスモデル ---
    min-width: 0;
    min-height: 0;
  }
}

.c-glossary-list {
  // --- レイアウト・配置 ---
  @include flex-column(var(--gap-component));
}

.c-glossary-card {
  // --- レイアウト・配置 ---
  @include flex-column(var(--gap-component));


  // --- 視覚効果 ---

  transition: var(--transition-base);


  // --- 子要素 ---

  &__header {
    // --- レイアウト・配置 ---
    @include flex-between(var(--gap-component));


    // --- ボックスモデル ---

    padding-bottom: var(--gap-element);
    border-bottom: var(--border-width-base) solid transparent;
    border-image: linear-gradient(to right, transparent, var(--color-border) 50%, transparent) 1;
  }

  &__title {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-element));
  }

  &__kana {
    // --- 継承 ---
    @extend %text-xs;


    // --- タイポグラフィ ---

    color: var(--color-text-muted);
  }

  &__term {
    // --- 継承 ---
    @extend %text-lg;


    // --- タイポグラフィ ---

    color: var(--color-text-main);
  }

  &__body {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-element));
  }

  &__desc {
    // --- 継承 ---
    @extend %text-sm;


    // --- タイポグラフィ ---

    line-height: 1.6;
    color: var(--color-text-secondary);
  }

  &__meta {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-element));


    // --- ボックスモデル ---

    padding: var(--pad-container);
    border: var(--border-width-base) solid theme-color(var(--color-border), 50%);
  }

  &__label {
    // --- 継承 ---
    @extend %text-xs;


    // --- タイポグラフィ ---

    font-weight: var(--font-weight-bold);
    color: var(--color-text-muted);
  }

  &__text {
    // --- 継承 ---
    @extend %text-sm;


    // --- タイポグラフィ ---

    line-height: 1.5;
    color: var(--color-text-secondary);
  }
}

.c-empty-state {
  // --- 継承 ---
  @extend %text-base;


  // --- ボックスモデル ---

  padding: var(--pad-container);
  border: var(--border-width-base) solid theme-color(var(--color-border), 50%);

  // --- タイポグラフィ ---
  color: var(--color-text-muted);
  text-align: center;
}
</style>
