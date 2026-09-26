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
  <Panel as="section" class="flex flex-col gap-form-row-gap">
    <SectionHeader :title="title" :tag="tag" :icon="icon" />

    <Input
      v-model="searchQuery"
      :placeholder="placeholder"
      clearable
    />

    <ul
      v-if="categoryOptions.length > 0"
      class="grid grid-cols-[repeat(auto-fill,minmax(115px,1fr))] gap-item-gap list-none m-0 p-0"
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

    <slot />
  </Panel>
</template>
