<script setup lang="ts">
/**
 * ToolConduitInput
 * 配管サイズ自動選定ツールの条件入力コンポーネントです。
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

const getCableAreaText = (cableIdx: string): string => {
  const def = findCableByIndexString(cableIdx)

  if (!def) return '---'

  const diameter = getEffectiveCableDiameter(def.diameter)

  if (diameter <= 0) return '---'

  const area = calculateCableArea(diameter)

  return `${area.toFixed(1)} mm²`
}
</script>

<template>
  <div class="conduit-input">
    <div class="header-grid">
      <MoleculesFormGroup label="対象の配管種類" class="category-select">
        <AtomsSelect
          v-model="inputs.conduitCategory"
          :options="categoryOptions"
          placeholder="選択してください"
        />
      </MoleculesFormGroup>

      <MoleculesFormGroup label="占積率" class="fill-rate">
        <MoleculesInputGroup addon="%">
          <AtomsInput
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
    <section class="input-section">
      <div class="section-header">
        <h4 class="section-title">
          収容するケーブル
        </h4>
        <AtomsButton
          variant="secondary"
          size="sm"
          @click="emit('add-cable')"
        >
          <AtomsIcon name="plus" size="sm" />
          <span>ケーブルを追加</span>
        </AtomsButton>
      </div>

      <MoleculesTable
        :columns="CONDUIT_CABLE_COLUMNS"
        :data="inputs.inputCables"
        class="conduit-table"
      >
        <template #cell-category="{ row }">
          <AtomsSelect
            v-model="row.category"
            :options="categories"
            placeholder="選択"
            @update:model-value="row.cableIdx = ''"
          />
        </template>

        <template #cell-cableIdx="{ row }">
          <AtomsSelect
            v-model="row.cableIdx"
            :options="getAvailableSizes(row.category)"
            placeholder="選択"
            :disabled="!row.category"
          />
        </template>

        <template #cell-count="{ row }">
          <MoleculesInputGroup addon="本">
            <AtomsInput
              v-model.number="row.count"
              type="number"
              min="1"
            />
          </MoleculesInputGroup>
        </template>

        <template #cell-spec="{ row }">
          {{ getCableAreaText(row.cableIdx) }}
        </template>

        <template #cell-actions="{ row }">
          <div class="flex justify-center items-center">
            <AtomsButton
              variant="danger"
              size="sm"
              icon-only
              :disabled="inputs.inputCables.length <= 1"
              aria-label="削除"
              @click="emit('remove-cable', row.id)"
            >
              <AtomsIcon name="trash-2" size="sm" />
            </AtomsButton>
          </div>
        </template>
      </MoleculesTable>
    </section>
  </div>
</template>

<style scoped lang="scss">
.conduit-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-form-row-gap);
}

.header-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.8fr) minmax(130px, 1fr);
  gap: var(--space-form-row-gap);

  @include mq("sm") {
    grid-template-columns: 1fr;
  }
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-item-gap);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-1) 0;
}

.conduit-table {
  width: 100%;
  font-size: var(--font-size-xs);
}

.action-cell {
  padding-inline: var(--space-1) !important;
  text-align: center;
}
</style>
