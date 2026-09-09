<script setup lang="ts">
/**
 * ToolRackInput
 * ケーブルラック選定ツールの条件入力コンポーネントです。
 * 強電／弱電タブ切替、ラック高さ、相乗り必要幅、計算パラメータ、およびケーブル条件を管理します。
 */
import { computed, watch } from 'vue'

import { RACK_CABLE_COLUMNS } from '~/constants/cableConstants'
import { RACK_DEFAULT_PARAMS, rackModeOptions } from '~/constants/rackConstants'
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
const currentCategories = computed(() =>
  inputs.value.mode === 'strong' ? strongCategories.value : weakCategories.value,
)
const currentCablesUI = computed(() =>
  inputs.value.mode === 'strong' ? inputs.value.strongCablesUI : inputs.value.weakCablesUI,
)

const getSingleDiameter = (cableIdx: string): number => {
  const def = findCableByIndexString(cableIdx)

  if (!def) return 0

  return getEffectiveCableDiameter(def.diameter)
}

const getCableSpecText = (cableIdx: string, count?: number | null): string => {
  const diameter = getSingleDiameter(cableIdx)

  if (diameter <= 0) return '---'

  const n = count && count > 0 ? count : 1
  const totalDiameter = diameter * n

  return `φ${totalDiameter.toFixed(1)}`
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

const handleAddCable = () => {
  if (inputs.value.mode === 'strong') {
    emit('add-strong-cable')
  }
  else {
    emit('add-weak-cable')
  }
}

const handleRemoveCable = (id: string) => {
  if (inputs.value.mode === 'strong') {
    emit('remove-strong-cable', id)
  }
  else {
    emit('remove-weak-cable', id)
  }
}
</script>

<template>
  <div class="flex flex-col gap-[var(--space-form-row-gap)]">
    <!-- 強電／弱電 タブ切り替え -->
    <AtomsRadioGroup
      v-model="inputs.mode"
      :options="rackModeOptions"
    />

    <!-- パラメータ設定（余裕係数、ケーブル間隔、親桁クリアランス） -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-form-col-gap)]">
      <MoleculesFormGroup label="余裕係数" help-id="marginRate">
        <MoleculesInputGroup addon="倍">
          <AtomsInput
            v-model.number="inputs.marginRate"
            type="number"
            step="0.05"
            min="0.1"
            :placeholder="inputs.mode === 'strong' ? '1.2' : '0.6'"
          />
        </MoleculesInputGroup>
      </MoleculesFormGroup>

      <MoleculesFormGroup label="ケーブル間隔" help-id="cableSpacing">
        <MoleculesInputGroup addon="mm">
          <AtomsInput
            v-model.number="inputs.cableSpacing"
            type="number"
            min="0"
            placeholder="10"
          />
        </MoleculesInputGroup>
      </MoleculesFormGroup>

      <MoleculesFormGroup label="親桁クリアランス" help-id="sideMargin">
        <MoleculesInputGroup addon="mm">
          <AtomsInput
            v-model.number="inputs.sideMargin"
            type="number"
            min="0"
            :placeholder="inputs.mode === 'strong' ? '60' : '120'"
          />
        </MoleculesInputGroup>
      </MoleculesFormGroup>
    </div>

    <!-- 基本条件（ラック高さ、相乗り必要幅） -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-form-col-gap)]">
      <MoleculesFormGroup label="ラック高さ (H)" help-id="rackHeight">
        <MoleculesInputGroup addon="mm">
          <AtomsInput
            v-model="inputs.rackHeight"
            type="number"
            min="50"
            step="10"
          />
        </MoleculesInputGroup>
      </MoleculesFormGroup>

      <MoleculesFormGroup
        :label="inputs.mode === 'strong' ? '弱電必要幅' : '強電必要幅'"
        help-id="otherWidth"
      >
        <MoleculesInputGroup addon="mm">
          <AtomsInput
            v-model="inputs.otherWidth"
            type="number"
            min="0"
            placeholder="相乗り時に指定"
          />
        </MoleculesInputGroup>
      </MoleculesFormGroup>
    </div>

    <!-- ケーブル条件セクション -->
    <section class="flex flex-col gap-[var(--space-item-gap)]">
      <div class="flex items-center justify-between py-[var(--space-1)]">
        <h4 class="font-bold text-[var(--font-size-sm)] text-[var(--color-text-main)]">
          {{ inputs.mode === 'strong' ? '強電ケーブル条件' : '弱電ケーブル条件' }}
        </h4>
        <AtomsButton
          variant="secondary"
          size="sm"
          @click="handleAddCable"
        >
          <AtomsIcon name="plus" size="sm" />
          <span>{{ inputs.mode === 'strong' ? '強電ケーブルを追加' : '弱電ケーブルを追加' }}</span>
        </AtomsButton>
      </div>

      <!-- ケーブルテーブル（強電/弱電 共通テンプレート） -->
      <MoleculesTable
        :columns="RACK_CABLE_COLUMNS"
        :data="currentCablesUI"
        class="w-full text-[var(--font-size-xs)]"
      >
        <template #cell-category="{ row }">
          <AtomsSelect
            v-model="row.category"
            :options="currentCategories"
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
          <div class="flex flex-col items-end leading-tight">
            <span class="font-medium font-mono text-[var(--color-text-main)]">
              {{ getCableSpecText(row.cableIdx, row.count) }}
            </span>
            <span
              v-if="row.count && row.count > 1 && getSingleDiameter(row.cableIdx) > 0"
              class="text-[10px] text-[var(--color-text-muted)] font-mono whitespace-nowrap"
            >
              (φ{{ getSingleDiameter(row.cableIdx).toFixed(1) }}×{{ row.count }})
            </span>
          </div>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex justify-center items-center">
            <AtomsButton
              variant="danger"
              size="sm"
              icon-only
              :disabled="currentCablesUI.length <= 1"
              aria-label="削除"
              @click="handleRemoveCable(row.id)"
            >
              <AtomsIcon name="trash-2" size="sm" />
            </AtomsButton>
          </div>
        </template>
      </MoleculesTable>
    </section>
  </div>
</template>
