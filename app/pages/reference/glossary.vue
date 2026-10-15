<script setup lang="ts">
/**
 * 電気工事用語集画面
 * 用語集画面のコンポーネントです。専門用語の検索や、五十音・カテゴリ別での絞り込み機能を提供します。
 */
import { computed, ref } from 'vue'

import { useDbFilter } from '~/composables/useDbFilter'
import { glossaryData, TRADE_VARIANT_MAP } from '~/constants/data/glossaryData'
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

const hasActiveFilters = computed(
  () => !!searchQuery.value || activeCats.value.length > 0 || activeKanas.value.length > 0,
)

const resetFilters = () => {
  searchQuery.value = ''
  activeCats.value = []
  activeKanas.value = []
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-panel-gap max-w-[1400px] min-h-0">
    <section class="panel flex flex-col gap-form-row-gap">
      <header class="flex items-center justify-between">
        <h3 class="flex items-center gap-item-gap">
          <Icon name="search" />
          <span>絞り込み・検索</span>
          <Badge size="sm" variant="gray">{{ filteredGlossary.length }}件</Badge>
        </h3>
        <Button v-if="hasActiveFilters" variant="tertiary" size="sm" icon="refresh-cw" @click="resetFilters">リセット</Button>
      </header>
      <hr class="divider">

      <Input v-model="searchQuery" placeholder="用語名や説明を検索..." icon="search" clearable />

      <ul v-if="categoryOptions.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-item-gap">
        <li v-for="cat in categoryOptions" :key="cat.value">
          <Checkbox v-model="activeCats" :value="cat.value">{{ cat.label }}</Checkbox>
        </li>
      </ul>

      <div class="flex flex-col gap-inline-gap">
        <span class="label">INDEX (読み・五十音)</span>
        <ul class="grid grid-cols-5 gap-inline-gap">
          <li v-for="kana in KANA_ROWS" :key="kana.value">
            <Button size="sm" block :variant="activeKanas.includes(kana.value) ? 'primary' : 'secondary'" :disabled="disabledKanaRows.has(kana.value)" @click="toggleKanaRow(kana.value)">{{ kana.label }}</Button>
          </li>
        </ul>
      </div>
    </section>

    <ul v-if="filteredGlossary.length > 0" class="flex flex-1 flex-col gap-panel-gap min-w-0 min-h-0">
      <li v-for="item in filteredGlossary" :key="item.term">
        <article class="panel flex flex-col gap-panel-gap">
          <header class="flex items-center justify-between gap-item-gap">
            <div class="flex flex-col gap-inline-gap">
              <small v-if="item.kana">{{ item.kana }}</small>
              <h4>{{ item.term }}</h4>
            </div>
            <Badge :variant="TRADE_VARIANT_MAP[item.category] || 'gray'">{{ item.category }}</Badge>
          </header>

          <hr class="divider is-fade-center">

          <div class="flex flex-col gap-inline-gap">
            <p>{{ item.desc }}</p>

            <dl v-if="item.related" class="panel is-elevated p-panel-pad-compact flex flex-col gap-inline-gap">
              <dt><small>関連用語</small></dt>
              <dd>{{ item.related }}</dd>
            </dl>

            <dl v-if="item.example" class="panel is-elevated p-panel-pad-compact flex flex-col gap-inline-gap">
              <dt><small>用例・備考</small></dt>
              <dd>{{ item.example }}</dd>
            </dl>
          </div>
        </article>
      </li>
    </ul>

    <EmptyState v-else icon="search" variant="no-results" title="該当する用語が見つかりません" description="検索キーワードまたは五十音・工種フィルターの条件を変更してください。" class="flex-1" />
  </div>
</template>
