<script setup lang="ts" generic="T extends string | number">
/**
 * MoleculesTabs
 * [Molecules] タブナビゲーションとコンテンツパネル（TabPanels）を一体化して管理するコンポーネント。
 * 各タブのコンテンツを `<template #[tabValue]>` でスロットとして宣言的に指定できます。
 */
import type { TabOption } from '~/types/components'

const model = defineModel<T>({ required: true })

withDefaults(
  defineProps<{
    options: TabOption<T>[]
    variant?: 'underline' | 'pill'
    panelClass?: string
  }>(),
  {
    variant: 'underline',
    panelClass: '',
  },
)
</script>

<template>
  <div class="flex flex-col gap-4 molecules-tabs">
    <!-- タブヘッダー -->
    <div class="overflow-x-auto pb-0.5">
      <AtomsTabs
        v-model="model"
        :options="options"
        :variant="variant"
      >
        <template #tab="{ option, isActive }">
          <slot name="tab" :option="option" :is-active="isActive">
            {{ option.label }}
          </slot>
        </template>
      </AtomsTabs>
    </div>

    <!-- コンテンツパネル -->
    <div class="flex-1 min-h-0 molecules-tabs__panel" :class="panelClass">
      <slot :name="String(model)" :active-tab="model">
        <!-- 名前付きスロットが指定されていない場合はデフォルトスロットにフォールバック -->
        <slot :active-tab="model" />
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
.molecules-tabs {
  width: 100%;
}
</style>
