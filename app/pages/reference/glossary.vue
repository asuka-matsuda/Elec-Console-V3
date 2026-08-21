<script setup lang="ts">
/**
 * Glossary
 * 用語集画面のコンポーネントです。専門用語の検索や、五十音・カテゴリ別での絞り込み機能を提供します。
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
  if (/[あ-おア-オ]/.test(firstChar)) return "a";
  if (/[か-こカ-コが-ごガ-ゴ]/.test(firstChar)) return "k";
  if (/[さ-そサ-ソざ-ぞザ-ゾ]/.test(firstChar)) return "s";
  if (/[た-とタ-トだ-どダ-ド]/.test(firstChar)) return "t";
  if (/[な-のナ-ノ]/.test(firstChar)) return "n";
  if (/[は-ほハ-ホば-ぼバ-ボぱ-ぽパ-ポ]/.test(firstChar)) return "h";
  if (/[ま-もマ-モ]/.test(firstChar)) return "m";
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
  電気: "#eab308",
  建築: "#ea580c",
  "空調・換気": "#22c55e",
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
            placeholder="用語名や説明を検索..."
          >
            <template #extra-filters>
              <AppFormGroup label="INDEX (読み・五十音)">
                  <AppKanaFilter v-model="activeKanas" :available-rows="availableRows" />
              </AppFormGroup>
            </template>
          </AppFilterPanel>
        </aside>

        <main class="l-filter-layout__main">
          <div v-if="filteredGlossary.length > 0" class="p-glossary__list">
            <AppCard
              v-for="item in filteredGlossary"
              :key="item.term"
              class="p-glossary__card"
              :style="{ '--card-accent': categoryColorMap[item.category] }"
            >
              <div class="p-glossary__card-header">
                <div class="p-glossary__card-title">
                  <span class="p-glossary__card-kana">{{ item.kana }}</span>
                  <h2 class="p-glossary__card-term">{{ item.term }}</h2>
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

              <div class="p-glossary__card-body">
                <p class="p-glossary__card-desc">{{ item.desc }}</p>

                <div v-if="item.related" class="p-glossary__card-meta">
                  <span class="p-glossary__card-label">関連用語</span>
                  <p class="p-glossary__card-text">{{ item.related }}</p>
                </div>

                <div v-if="item.example" class="p-glossary__card-meta">
                  <span class="p-glossary__card-label">用例・備考</span>
                  <p class="p-glossary__card-text">{{ item.example }}</p>
                </div>
              </div>
            </AppCard>
          </div>

          <div v-else class="p-db__empty">
            <p>条件に一致する用語が見つかりません。</p>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.l-filter-layout {
  // --- Base Styles ---
  container-name: filter-layout;
  container-type: inline-size;
  display: flex;
  flex: 1;
  flex-direction: column;

  width: 100%;
  max-width: 1400px;
  min-height: 0;

  &__grid {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--gap-section);

    min-height: 0;
  }

  &__sidebar {
    width: 100%;
  }

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;

    min-width: 0;
    min-height: 0;
  }
}
</style>
