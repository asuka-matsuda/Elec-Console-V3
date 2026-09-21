<script setup lang="ts">
/**
 * FilterPanel
 * [Organisms] データベース一覧や用語集用のコンパクトな検索・絞り込みパネル。
 * 余計なラベルや縦余白を引き算し、グリッド整列されたチェックボックスと検索窓を提供します。
 */
import type { FilterPanelProps } from '~/types/components'

const searchQuery = defineModel<string>('searchQuery', { default: '' })
const activeCats = defineModel<string[]>('activeCats', { default: () => [] })

withDefaults(defineProps<FilterPanelProps>(), {
  title: '絞り込み・検索',
  tag: 'h3',
  icon: 'search',
  placeholder: 'キーワードで検索...',
  categoryOptions: () => [],
})
</script>

<template>
  <Panel as="section" class="flex flex-col gap-3">
    <SectionHeader :title="title" :tag="tag" :icon="icon" />

    <div class="flex flex-col gap-3">

      <Input
        v-model="searchQuery"
        :placeholder="placeholder"
        clearable
      />

      <div
        v-if="categoryOptions.length > 0"
        class="grid grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-2"
      >
        <Checkbox
          v-for="cat in categoryOptions"
          :key="cat.value"
          v-model="activeCats"
          :value="cat.value"
        >
          {{ cat.label }}
        </Checkbox>
      </div>

      <slot />
    </div>
  </Panel>
</template>
