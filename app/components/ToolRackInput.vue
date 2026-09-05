<script setup lang="ts">
/**
 * ToolRackInput
 * ケーブルラック選定ツールの条件入力コンポーネントです。
 * 強電／弱電タブ切替、ラック高さ、相乗り必要幅、計算パラメータ、およびケーブル条件を管理します。
 */
import { computed, watch } from 'vue'

import { RACK_DEFAULT_PARAMS, rackModeOptions } from '~/constants/rackConstants'
import type { TableColumn } from '~/types/components'
import {
  findCableByIndexString,
  getAvailableSizes,
  getCableCategories,
  getEffectiveCableDiameter,
} from '~/utils/cable'
import type { RackInputs } from '~/utils/tools/rack/rackMapper'

const inputs = defineModel<RackInputs>({ required: true })

const emit = defineEmits<{
  'add-strong-cable': []
  'remove-strong-cable': [id: string]
  'add-weak-cable': []
  'remove-weak-cable': [id: string]
}>()

const strongCategories = computed(() => getCableCategories('strong'))
const weakCategories = computed(() => getCableCategories('weak'))

const cableColumns: TableColumn[] = [
  { key: 'no', label: 'No.', width: '44px', align: 'center' },
  { key: 'category', label: 'ケーブル種別', width: '32%' },
  { key: 'cableIdx', label: 'サイズ', width: '36%' },
  { key: 'count', label: '本数', width: '90px' },
  { key: 'spec', label: '外径', align: 'right' },
  { key: 'actions', label: '', width: '44px', align: 'center' },
]

const getCableSpecText = (cableIdx: string): string => {
  const def = findCableByIndexString(cableIdx)

  if (!def) return '---'

  const diameter = getEffectiveCableDiameter(def.diameter)

  if (diameter <= 0) return '---'

  return `φ${diameter.toFixed(1)}`
}

// モード切替時にデフォルトパラメータを適応（カスタム値がなければ自動追従）
watch(
  () => inputs.value.mode,
  (newMode, oldMode) => {
    if (!oldMode) return
    const oldDefaults = RACK_DEFAULT_PARAMS[oldMode]
    const newDefaults = RACK_DEFAULT_PARAMS[newMode]

    if (inputs.value.marginRate === null || inputs.value.marginRate === oldDefaults.marginRate) {
      inputs.value.marginRate = newDefaults.marginRate
    }
    if (inputs.value.sideMargin === null || inputs.value.sideMargin === oldDefaults.sideMargin) {
      inputs.value.sideMargin = newDefaults.sideMargin
    }
  },
)
</script>

<template>
  <div class="c-rack-input">
    <!-- 強電／弱電 タブ切り替え -->
    <AppRadioGroup
      v-model="inputs.mode"
      :options="rackModeOptions"
    />

    <!-- 基本条件（ラック高さ、相乗り必要幅） -->
    <div class="c-rack-input__grid">
      <AppFormGroup label="ラック高さ (H)">
        <AppInputGroup>
          <AppInput
            v-model="inputs.rackHeight"
            type="number"
            min="50"
            step="10"
          />
          <template #append>
            <span class="c-input-addon">mm</span>
          </template>
        </AppInputGroup>
      </AppFormGroup>

      <AppFormGroup :label="inputs.mode === 'strong' ? '弱電必要幅' : '強電必要幅'">
        <AppInputGroup>
          <AppInput
            v-model="inputs.otherWidth"
            type="number"
            min="0"
            placeholder="相乗り時に指定"
          />
          <template #append>
            <span class="c-input-addon">mm</span>
          </template>
        </AppInputGroup>
      </AppFormGroup>
    </div>

    <!-- 詳細設定（計算パラメータ） -->
    <details class="c-rack-input__details">
      <summary class="c-rack-input__details-summary">
        <AppIcon name="sliders" size="sm" />
        <span>計算パラメータ設定（余裕係数・離隔など）</span>
      </summary>
      <div class="c-rack-input__params-grid">
        <AppFormGroup label="余裕係数">
          <AppInputGroup>
            <AppInput
              v-model.number="inputs.marginRate"
              type="number"
              step="0.05"
              min="0.1"
              :placeholder="inputs.mode === 'strong' ? '1.2' : '0.6'"
            />
            <template #append>
              <span class="c-input-addon">倍</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>

        <AppFormGroup label="ケーブル間隔">
          <AppInputGroup>
            <AppInput
              v-model.number="inputs.cableSpacing"
              type="number"
              min="0"
              placeholder="10"
            />
            <template #append>
              <span class="c-input-addon">mm</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>

        <AppFormGroup label="親桁クリアランス">
          <AppInputGroup>
            <AppInput
              v-model.number="inputs.sideMargin"
              type="number"
              min="0"
              :placeholder="inputs.mode === 'strong' ? '60' : '120'"
            />
            <template #append>
              <span class="c-input-addon">mm</span>
            </template>
          </AppInputGroup>
        </AppFormGroup>
      </div>
    </details>

    <!-- ケーブル条件セクション -->
    <section class="c-rack-input__section">
      <div class="c-rack-input__section-header">
        <h4 class="c-rack-input__section-title">
          {{ inputs.mode === 'strong' ? '強電ケーブル条件' : '弱電ケーブル条件' }}
        </h4>
        <AppButton
          variant="secondary"
          size="sm"
          @click="emit(inputs.mode === 'strong' ? 'add-strong-cable' : 'add-weak-cable')"
        >
          <AppIcon name="plus" size="sm" />
          <span>{{ inputs.mode === 'strong' ? '強電ケーブルを追加' : '弱電ケーブルを追加' }}</span>
        </AppButton>
      </div>

      <!-- 強電ケーブルテーブル -->
      <AppTable
        v-if="inputs.mode === 'strong'"
        :columns="cableColumns"
        :data="inputs.strongCablesUI"
        class="c-rack-input__table"
      >
        <template #cell-no="{ row }">
          {{ inputs.strongCablesUI.indexOf(row) + 1 }}
        </template>
        <template #cell-category="{ row }">
          <AppSelect
            v-model="row.category"
            :options="strongCategories"
            placeholder="選択"
            size="sm"
            @update:model-value="row.cableIdx = ''"
          />
        </template>
        <template #cell-cableIdx="{ row }">
          <AppSelect
            v-model="row.cableIdx"
            :options="getAvailableSizes(row.category)"
            placeholder="選択"
            size="sm"
            :disabled="!row.category"
          />
        </template>
        <template #cell-count="{ row }">
          <AppInputGroup size="sm">
            <AppInput
              v-model.number="row.count"
              type="number"
              min="1"
              size="sm"
            />
            <template #append>
              <span class="c-input-addon">本</span>
            </template>
          </AppInputGroup>
        </template>
        <template #cell-spec="{ row }">
          {{ getCableSpecText(row.cableIdx) }}
        </template>
        <template #cell-actions="{ row }">
          <AppButton
            variant="danger"
            size="sm"
            icon-only
            :disabled="inputs.strongCablesUI.length <= 1"
            aria-label="削除"
            @click="emit('remove-strong-cable', row.id)"
          >
            <AppIcon name="trash-2" size="sm" />
          </AppButton>
        </template>
      </AppTable>

      <!-- 弱電ケーブルテーブル -->
      <AppTable
        v-else
        :columns="cableColumns"
        :data="inputs.weakCablesUI"
        class="c-rack-input__table"
      >
        <template #cell-no="{ row }">
          {{ inputs.weakCablesUI.indexOf(row) + 1 }}
        </template>
        <template #cell-category="{ row }">
          <AppSelect
            v-model="row.category"
            :options="weakCategories"
            placeholder="選択"
            size="sm"
            @update:model-value="row.cableIdx = ''"
          />
        </template>
        <template #cell-cableIdx="{ row }">
          <AppSelect
            v-model="row.cableIdx"
            :options="getAvailableSizes(row.category)"
            placeholder="選択"
            size="sm"
            :disabled="!row.category"
          />
        </template>
        <template #cell-count="{ row }">
          <AppInputGroup size="sm">
            <AppInput
              v-model.number="row.count"
              type="number"
              min="1"
              size="sm"
            />
            <template #append>
              <span class="c-input-addon">本</span>
            </template>
          </AppInputGroup>
        </template>
        <template #cell-spec="{ row }">
          {{ getCableSpecText(row.cableIdx) }}
        </template>
        <template #cell-actions="{ row }">
          <AppButton
            variant="danger"
            size="sm"
            icon-only
            :disabled="inputs.weakCablesUI.length <= 1"
            aria-label="削除"
            @click="emit('remove-weak-cable', row.id)"
          >
            <AppIcon name="trash-2" size="sm" />
          </AppButton>
        </template>
      </AppTable>
    </section>
  </div>
</template>

<style scoped lang="scss">
.c-rack-input {
  @include flex-start-stretch($direction: column);

  gap: var(--space-form-row-gap);

  &__grid {
    @include grid(repeat(2, minmax(0, 1fr)), var(--space-form-col-gap));

    @include mq("sm") {
      grid-template-columns: 1fr;
    }
  }

  &__details {
    padding: var(--space-2) var(--space-3);
    border: var(--border-width-base) solid var(--color-border-subtle);
    border-radius: var(--radius-md);
    background: var(--color-surface-panel-subtle);

    &[open] {
      padding-bottom: var(--space-3);
    }
  }

  &__details-summary {
    @include flex-start-center;
    @include text-meta("xs", "bold");

    cursor: pointer;
    user-select: none;
    gap: var(--space-2);
    color: var(--color-text-secondary);

    &:hover {
      color: var(--color-text-main);
    }
  }

  &__params-grid {
    @include grid(repeat(3, minmax(0, 1fr)), var(--space-form-col-gap));

    margin-top: var(--space-3);

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

  &__section-title {
    @include text-title("sm");
  }

  &__table {
    width: 100%;
  }
}
</style>
