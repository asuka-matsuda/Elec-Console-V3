<script setup lang="ts">
/**
 * MoleculesFilterPanel
 * [Molecules] データベース画面や一覧画面用の検索・カテゴリ絞り込みパネル。
 * AtomsPanel, MoleculesSectionHeader, MoleculesFormGroup, AtomsInput, AtomsCheckbox を組み合わせた純粋なUIブロック。
 */
interface CategoryOption {
  label: string
  value: string
}

interface Props {
  title?: string
  icon?: string
  placeholder?: string
  categoryOptions?: CategoryOption[]
}

const searchQuery = defineModel<string>('searchQuery', { default: '' })
const activeCats = defineModel<string[]>('activeCats', { default: () => [] })

const {
  title = '絞り込み・検索',
  icon = 'search',
  placeholder,
  categoryOptions = [],
} = defineProps<Props>()
</script>

<template>
  <AtomsPanel class="flex flex-col gap-4">
    <slot name="header">
      <MoleculesSectionHeader :title="title" :icon="icon" />
    </slot>

    <div class="flex flex-col gap-4">
      <slot name="keyword">
        <MoleculesFormGroup label="Keyword">
          <AtomsInput v-model="searchQuery" :placeholder="placeholder" />
        </MoleculesFormGroup>
      </slot>

      <slot name="categories">
        <MoleculesFormGroup v-if="categoryOptions.length > 0" label="Category">
          <div class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
            <AtomsCheckbox
              v-for="cat in categoryOptions"
              :key="cat.value"
              v-model="activeCats"
              :value="cat.value"
            >
              {{ cat.label }}
            </AtomsCheckbox>
          </div>
        </MoleculesFormGroup>
      </slot>

      <slot name="extra-filters" />
    </div>
  </AtomsPanel>
</template>
