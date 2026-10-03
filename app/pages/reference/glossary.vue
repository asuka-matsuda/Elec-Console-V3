<script setup lang="ts">
/**
 * 電気工事用語集画面
 * 用語集画面のコンポーネントです。専門用語の検索や、五十音・カテゴリ別での絞り込み機能を提供します。
 */
import { computed, ref } from 'vue'

import { useDbFilter } from '~/composables/useDbFilter'
import { glossaryData, TRADE_COLOR_MAP } from '~/constants/data/glossaryData'
import {
  collectAvailableKanaRows,
  filterByKana,
  KANA_ROWS,
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

const toggleKanaRow = (val: KanaRowKey) => {
  activeKanas.value = activeKanas.value.includes(val)
    ? activeKanas.value.filter(v => v !== val)
    : [...activeKanas.value, val]
}

const disabledKanaRows = computed(() => {
  const rows = availableRows.value
  const hasW = rows.has('w') || rows.has('other')

  return new Set(
    KANA_ROWS
      .map(k => k.value)
      .filter(k => (k === 'w' ? !hasW : !rows.has(k))),
  )
})
</script>

<template>
  <div class="flex flex-1 flex-col gap-panel-gap max-w-[1400px] min-h-0">
    <aside class="shrink-0">
      <section class="panel flex flex-col gap-form-row-gap">
        <header class="flex items-center justify-between">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="search" />
            <span>絞り込み・検索</span>
          </h3>
        </header>

        <Input
          v-model="searchQuery"
          placeholder="用語名や説明を検索..."
        />

        <ul
          v-if="categoryOptions.length > 0"
          class="grid grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-item-gap"
        >
          <li
            v-for="cat in categoryOptions"
            :key="cat.value"
          >
            <Checkbox
              v-model="activeCats"
              :value="cat.value"
            >
              {{ cat.label }}
            </Checkbox>
          </li>
        </ul>

        <div class="flex flex-col gap-inline-gap">
          <span class="index-label">INDEX (読み・五十音)</span>
          <nav class="grid grid-cols-5 gap-inline-gap">
            <button
              v-for="kana in KANA_ROWS"
              :key="kana.value"
              type="button"
              class="flex items-center justify-center kana-btn"
              :class="{ 'is-active': activeKanas.includes(kana.value) }"
              :disabled="disabledKanaRows.has(kana.value)"
              @click="toggleKanaRow(kana.value)"
            >
              {{ kana.label }}
            </button>
          </nav>
        </div>
      </section>
    </aside>

    <ul
      v-if="filteredGlossary.length > 0"
      class="flex flex-1 flex-col gap-panel-gap min-w-0 min-h-0"
    >
      <li
        v-for="item in filteredGlossary"
        :key="item.term"
      >
        <article class="panel flex flex-col gap-panel-gap">
          <header class="flex items-center justify-between gap-item-gap">
            <div class="flex flex-col gap-inline-gap">
              <span v-if="item.kana" class="kana">{{ item.kana }}</span>
              <h2 class="term">
                {{ item.term }}
              </h2>
            </div>
            <span class="badge" :style="{ '--glow-color': TRADE_COLOR_MAP[item.category] }">
              {{ item.category }}
            </span>
          </header>

          <hr class="divider is-fade-center">

          <div class="flex flex-col gap-inline-gap">
            <p class="desc">
              {{ item.desc }}
            </p>

            <dl v-if="item.related" class="meta flex flex-col gap-inline-gap p-panel-pad-compact">
              <dt class="meta-label">関連用語</dt>
              <dd class="meta-text">
                {{ item.related }}
              </dd>
            </dl>

            <dl v-if="item.example" class="meta flex flex-col gap-inline-gap p-panel-pad-compact">
              <dt class="meta-label">用例・備考</dt>
              <dd class="meta-text">
                {{ item.example }}
              </dd>
            </dl>
          </div>
        </article>
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

<style scoped lang="scss">
.index-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);
  letter-spacing: var(--tracking-wide);
}

.kana-btn {
  height: 1.75rem;
  padding: 0;
  border: var(--border-width-base) solid var(--color-border);

  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-muted);

  background-color: var(--surface-bg-elevated);

  transition: var(--transition-interactive);

  @include state-interactive;

  &:hover:not(:disabled, .is-active) {
    border-color: var(--theme-accent);
    color: var(--color-text-main);
  }

  &.is-active {
    border-color: var(--theme-accent);
    color: var(--theme-accent);
    background-color: color-mix(in srgb, var(--theme-accent) 15%, transparent);
    box-shadow: var(--shadow-glow-sm);
  }

  @include state-disabled;
}

.kana {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.term {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-main);
}

.desc {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-secondary);
}

.meta {
  margin: 0;
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
}

.meta-label {
  font-size: var(--font-size-2xs);
  color: var(--color-text-muted);
}

.meta-text {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
</style>
