<script setup lang="ts">
/**
 * ToolConduitInput
 * 配管サイズ自動選定ツールの条件入力コンポーネントです。
 * 対象の配管種類と収容するケーブルリストの入力を管理します。
 */
import { computed } from 'vue'

import type { SelectOption, TableColumn } from '~/types/components'
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

const cableColumns: TableColumn[] = [
  { key: 'no', label: 'No.', width: '44px', align: 'center' },
  { key: 'category', label: 'ケーブル種別', width: '32%' },
  { key: 'cableIdx', label: 'サイズ', width: '36%' },
  { key: 'count', label: '本数', width: '90px' },
  { key: 'spec', label: '断面積', align: 'right' },
  { key: 'actions', label: '', width: '44px', align: 'center' },
]

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
  <div class="c-conduit-input">
    <div class="c-conduit-input__header-grid">
      <AppFormGroup label="対象の配管種類" class="c-conduit-input__category">
        <AppSelect
          v-model="inputs.conduitCategory"
          :options="categoryOptions"
          placeholder="選択してください"
        />
      </AppFormGroup>

      <AppFormGroup label="占積率" class="c-conduit-input__fill-rate">
        <AppInputGroup>
          <AppInput
            v-model.number="inputs.customFillRate"
            type="number"
            min="1"
            max="100"
            placeholder="80"
          />
          <template #append>
            <span class="c-input-addon">%</span>
          </template>
        </AppInputGroup>
      </AppFormGroup>
    </div>

    <!-- ケーブル条件セクション -->
    <section class="c-conduit-input__section">
      <div class="c-conduit-input__section-header">
        <h4 class="c-conduit-input__title">
          収容するケーブル
        </h4>
        <AppButton
          variant="secondary"
          size="sm"
          @click="emit('add-cable')"
        >
          <AppIcon name="plus" size="sm" />
          <span>ケーブルを追加</span>
        </AppButton>
      </div>

      <AppTable
        :columns="cableColumns"
        class="c-conduit-input__table"
      >
        <template #body>
          <tr
            v-for="(cable, index) in inputs.inputCables"
            :key="cable.id"
          >
            <td style="text-align: center;">
              {{ index + 1 }}
            </td>
            <td>
              <AppSelect
                v-model="cable.category"
                :options="categories"
                placeholder="選択"
                size="sm"
                @update:model-value="cable.cableIdx = ''"
              />
            </td>
            <td>
              <AppSelect
                v-model="cable.cableIdx"
                :options="getAvailableSizes(cable.category)"
                placeholder="選択"
                size="sm"
                :disabled="!cable.category"
              />
            </td>
            <td>
              <AppInputGroup size="sm">
                <AppInput
                  v-model.number="cable.count"
                  type="number"
                  min="1"
                  size="sm"
                />
                <template #append>
                  <span class="c-input-addon">本</span>
                </template>
              </AppInputGroup>
            </td>
            <td style="text-align: right;">
              {{ getCableAreaText(cable.cableIdx) }}
            </td>
            <td style="text-align: center;">
              <AppButton
                variant="danger"
                size="sm"
                icon-only
                :disabled="inputs.inputCables.length <= 1"
                aria-label="削除"
                @click="emit('remove-cable', cable.id)"
              >
                <AppIcon name="trash-2" size="sm" />
              </AppButton>
            </td>
          </tr>
        </template>
      </AppTable>
    </section>
  </div>
</template>

<style scoped lang="scss">
.c-conduit-input {
  @include flex-start-stretch($direction: column);

  gap: var(--space-form-row-gap);

  &__header-grid {
    @include grid(minmax(0, 1.8fr) minmax(130px, 1fr), var(--space-form-row-gap));

    @include mq("sm") {
      grid-template-columns: 1fr;
    }
  }

  &__section {
    @include flex-start-stretch($direction: column);

    gap: var(--space-item-gap);
  }

  &__section-header {
    @include flex-between-center;

    padding: var(--space-1) 0;
  }

  &__title {
    @include text-title("sm");
  }

  &__table {
    width: 100%;
  }
}
</style>
