<script setup lang="ts">
/**
 * OrganismsConduitInput
 * [Tool Organism] 配管サイズ自動選定ツールの条件入力コンポーネント。
 * 対象の配管種類と収容するケーブルリストの入力を管理します。
 */
import { computed } from 'vue'

import { CONDUIT_CABLE_COLUMNS } from '~/constants/cableConstants'
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

defineProps<{
  categoryOptions: SelectOption[]
}>()

const emit = defineEmits<{
  'add-cable': []
  'remove-cable': [id: string]
}>()

const categories = computed(() => getCableCategories())

const getSingleArea = (cableIdx: string): number => {
  const def = findCableByIndexString(cableIdx)

  if (!def) return 0
  const diameter = getEffectiveCableDiameter(def.diameter)

  if (diameter <= 0) return 0

  return calculateCableArea(diameter)
}

const getCableSpecText = (cableIdx: string, count?: number | null): string => {
  const area = getSingleArea(cableIdx)

  if (area <= 0) return '---'
  const n = count && count > 0 ? count : 1
  const totalArea = area * n

  return `${totalArea.toFixed(1)} mm²`
}

const getCableSpecDetailText = (cableIdx: string, count?: number | null): string => {
  const area = getSingleArea(cableIdx)

  if (area <= 0) return ''
  const n = count && count > 0 ? count : 1

  if (n > 1) {
    return `(${area.toFixed(1)}×${n})`
  }

  return ''
}
</script>

<template>
  <div class="flex flex-col gap-[var(--space-form-row-gap)]">
    <div class="grid grid-cols-1 sm:grid-cols-[minmax(0,1.8fr)_minmax(130px,1fr)] gap-[var(--space-form-row-gap)]">
      <MoleculesFormGroup label="対象の配管種類">
        <Select
          v-model="inputs.conduitCategory"
          :options="categoryOptions"
          placeholder="選択してください"
        />
      </MoleculesFormGroup>

      <MoleculesFormGroup label="占積率">
        <MoleculesInputGroup addon="%">
          <Input
            v-model.number="inputs.customFillRate"
            type="number"
            min="1"
            max="100"
            placeholder="80"
          />
        </MoleculesInputGroup>
      </MoleculesFormGroup>
    </div>

    <!-- ケーブル条件セクション -->
    <section class="flex flex-col gap-[var(--space-item-gap)]">
      <div class="flex items-center justify-end py-[var(--space-1)]">
        <Button
          icon="plus"
          @click="emit('add-cable')"
        >
          ケーブルを追加
        </Button>
      </div>

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
          <MoleculesInputGroup addon="条">
            <Input
              v-model.number="row.count"
              type="number"
              min="1"
              :clearable="false"
            />
          </MoleculesInputGroup>
        </template>

        <template #cell-spec="{ row }">
          <div class="stacked-cell flex flex-col gap-0.5 items-end">
            <span class="main-text">
              {{ getCableSpecText(row.cableIdx, row.count) }}
            </span>
            <span
              v-if="getCableSpecDetailText(row.cableIdx, row.count)"
              class="sub-text"
            >
              {{ getCableSpecDetailText(row.cableIdx, row.count) }}
            </span>
          </div>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex justify-center items-center">
            <Button
              variant="danger"
              icon="trash-2"
              :disabled="inputs.inputCables.length <= 1"
              title="削除"
              @click="emit('remove-cable', row.id)"
            />
          </div>
        </template>
      </Table>
    </section>
  </div>
</template>
