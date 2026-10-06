<script setup lang="ts">
/**
 * 規格データベース詳細画面
 * 規格データベース画面の統合ページコンポーネント。
 * ルーティングパラメータに基づいて該当するデータベース定義を取得し表示します。
 */
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import DiagramDrum from '~/components/database/DiagramDrum.vue'
import DiagramTerminal from '~/components/database/DiagramTerminal.vue'
import { useDbFilter } from '~/composables/useDbFilter'
import { useTableSort } from '~/composables/useTableSort'
import { DATABASE_REGISTRY } from '~/constants/databaseRegistry'

// ルート変更時にコンポーネントを確実に再初期化
definePageMeta({
  key: route => route.fullPath,
})

const route = useRoute()
const dbKey = String(route.params.type)
const currentDb = DATABASE_REGISTRY[dbKey]

if (!currentDb) {
  throw createError({ statusCode: 404, statusMessage: 'データベースが見つかりません', fatal: true })
}

useHead({
  title: currentDb.title,
})

const isDiagramOpen = ref(false)
const hasDiagram = computed(() => ['terminal-db', 'drum-db'].includes(dbKey))
const diagramTitle = computed(() => {
  if (dbKey === 'terminal-db') return '端子各部寸法の図解'
  if (dbKey === 'drum-db') return 'ケーブルドラム各部寸法の図解'

  return '各部寸法の図解'
})

const { searchQuery, activeCats, categoryOptions, filteredData } = useDbFilter({
  data: currentDb.data,
  searchMapper: currentDb.searchMapper,
})

const { sortBy, sortOrder, sortedData } = useTableSort(filteredData)
</script>

<template>
  <div class="flex flex-1 flex-col gap-panel-gap w-full max-w-[1400px] min-h-0 mx-auto">

    <Note variant="secondary" text="注記: 掲載データはJISおよび内線規程等に基づく標準規格値です。選定にあたってはメーカー仕様書も併せてご確認ください。" />

    <section class="panel flex flex-col gap-form-row-gap">
      <header class="flex items-center justify-between">
        <h3 class="flex items-center gap-item-gap">
          <Icon name="search" />
          <span>絞り込み・検索</span>
        </h3>
        <div v-if="hasDiagram" class="inline-flex items-center">
          <Button size="sm" icon="circle-dot" @click="isDiagramOpen = true">寸法図解を確認する</Button>
        </div>
      </header>

      <ClearableInput v-model="searchQuery" :placeholder="currentDb.placeholder" icon="search" />

      <ul v-if="categoryOptions.length > 0" class="grid grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-item-gap">
        <li v-for="cat in categoryOptions" :key="cat.value">
          <Checkbox v-model="activeCats" :value="cat.value">{{ cat.label }}</Checkbox>
        </li>
      </ul>
    </section>

    <Table v-model:sort-by="sortBy" v-model:sort-order="sortOrder" :columns="currentDb.columns" :data="sortedData" empty-text="条件に一致するデータが見つかりません" class="flex-1 min-h-0" />

    <Modal v-if="hasDiagram" v-model="isDiagramOpen" :title="diagramTitle" icon="tag">
      <DiagramTerminal v-if="dbKey === 'terminal-db'" />
      <DiagramDrum v-else-if="dbKey === 'drum-db'" />
    </Modal>
  </div>
</template>
