<script setup lang="ts">
/**
 * OrganismsFilterPanel
 * [Organisms] データベース画面や一覧画面用の検索・カテゴリ絞り込みパネル。
 * Panel, SectionHeader, FormGroup, Input, Checkbox を組み合わせた独立セクション。
 */
import type { IconName } from '~/constants/icons'
import type { HeadingTag, SelectOption } from '~/types/components'

interface Props {
  title?: string
  tag?: HeadingTag
  icon?: IconName
  placeholder?: string
  categoryOptions?: SelectOption<string>[]
}

const searchQuery = defineModel<string>('searchQuery', { default: '' })
const activeCats = defineModel<string[]>('activeCats', { default: () => [] })

const {
  title = '絞り込み・検索',
  tag = 'h3',
  icon = 'search',
  placeholder,
  categoryOptions = [],
} = defineProps<Props>()
</script>

<template>
  <Panel as="section" class="flex flex-col gap-4">
    <SectionHeader :title="title" :tag="tag" :icon="icon" />

    <div class="flex flex-col gap-4">
      <FormGroup label="Keyword">
        <Input v-model="searchQuery" :placeholder="placeholder" />
      </FormGroup>

      <FormGroup v-if="categoryOptions.length > 0" label="Category">
        <div class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
          <Checkbox
            v-for="cat in categoryOptions"
            :key="cat.value"
            v-model="activeCats"
            :value="cat.value"
          >
            {{ cat.label }}
          </Checkbox>
        </div>
      </FormGroup>

      <slot />
    </div>
  </Panel>
</template>
