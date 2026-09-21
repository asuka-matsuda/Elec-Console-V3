<script setup lang="ts">
/**
 * OrganismsConduitInput
 * [Tool Organism] 配管サイズ自動選定ツールの条件入力コンポーネント。
 * 対象の配管種類と収容するケーブルリストの入力を管理します。
 */
import { CONDUIT_CABLE_COLUMNS } from '~/constants/cableConstants'
import { conduitData } from '~/constants/data/conduitData'
import type { SelectOption } from '~/types/components'
import type { ConduitInputData } from '~/types/tools'
import {
  findCableByIndexString,
  getAvailableSizes,
  getCableCategories,
  getEffectiveCableDiameter,
} from '~/utils/cable'
import { calculateCableArea } from '~/utils/tools/conduit/conduitCalcLogic'

const inputs = defineModel<ConduitInputData>({ required: true })

withDefaults(
  defineProps<{
    categoryOptions?: SelectOption[]
  }>(),
  {
    categoryOptions: () => [...new Set(conduitData.map(c => c.category))].map(c => ({ value: c, label: c })),
  },
)

const emit = defineEmits<{
  'add-cable': []
  'remove-cable': [id: string]
}>()

const categories = getCableCategories()

const getCableSpec = (cableIdx: string, count?: number | null) => {
  const def = findCableByIndexString(cableIdx)

  if (!def) return { text: '---', detail: '' }

  const diameter = getEffectiveCableDiameter(def.diameter)

  if (diameter <= 0) return { text: '---', detail: '' }

  const area = calculateCableArea(diameter)
  const n = count && count > 0 ? count : 1

  return {
    text: `${(area * n).toFixed(1)} mm²`,
    detail: n > 1 ? `(${area.toFixed(1)}×${n})` : '',
  }
}
</script>

<template>
  <div class="flex flex-col gap-[var(--space-form-row-gap)]">
    <div class="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-x-[var(--space-form-col-gap)] gap-y-[var(--space-form-row-gap)]">
      <FormGroup label="対象の配管種類">
        <Select
          v-model="inputs.conduitCategory"
          :options="categoryOptions"
          placeholder="選択してください"
        />
      </FormGroup>

      <FormGroup label="占積率">
        <Input
          v-model.number="inputs.customFillRate"
          type="number"
          min="1"
          max="100"
          addon="%"
          placeholder="80"
        />
      </FormGroup>
    </div>

    <section class="flex flex-col gap-[var(--space-item-gap)]">
      <Button
        class="self-end"
        icon="plus"
        @click="emit('add-cable')"
      >
        ケーブルを追加
      </Button>

      <Table
        :columns="CONDUIT_CABLE_COLUMNS"
        :data="inputs.inputCables"
        class="w-full"
      >
        <template #cell-category="{ row }">
          <Select
            v-model="row.category"
            :options="categories"
            placeholder="選択"
            @update:model-value="row.cableIdx = ''"
          />
        </template>

        <template #cell-cableIdx="{ row }">
          <Select
            v-model="row.cableIdx"
            :options="getAvailableSizes(row.category)"
            placeholder="選択"
            :disabled="!row.category"
          />
        </template>

        <template #cell-count="{ row }">
          <Input
            v-model.number="row.count"
            type="number"
            min="1"
            addon="条"
            :clearable="false"
          />
        </template>

        <template #cell-spec="{ row }">
          <div class="stacked-cell flex flex-col gap-0.5 items-end">
            <span class="main-text">
              {{ getCableSpec(row.cableIdx, row.count).text }}
            </span>
            <span
              v-if="getCableSpec(row.cableIdx, row.count).detail"
              class="sub-text"
            >
              {{ getCableSpec(row.cableIdx, row.count).detail }}
            </span>
          </div>
        </template>

        <template #cell-actions="{ row }">
          <Button
            variant="danger"
            icon="trash-2"
            :disabled="inputs.inputCables.length <= 1"
            title="削除"
            @click="emit('remove-cable', row.id)"
          />
        </template>
      </Table>
    </section>
  </div>
</template>
