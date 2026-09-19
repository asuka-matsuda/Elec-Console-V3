<script setup lang="ts">
/**
 * OrganismsRackInput
 * [Tool Organism] ケーブルラック選定ツールの条件入力フォームコンポーネント。
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

const strongCategories = getCableCategories('strong')
const weakCategories = getCableCategories('weak')
const currentCategories = computed(() =>
  inputs.value.mode === 'strong' ? strongCategories : weakCategories,
)

const getCableSpec = (cableIdx: string, count?: number | null) => {
  const def = findCableByIndexString(cableIdx)

  if (!def) return { text: '---', detail: '' }

  const diameter = getEffectiveCableDiameter(def.diameter)

  if (diameter <= 0) return { text: '---', detail: '' }

  const n = count && count > 0 ? count : 1

  return {
    text: `φ${(diameter * n).toFixed(1)}`,
    detail: n > 1 ? `(φ${diameter.toFixed(1)}×${n})` : '',
  }
}

const currentCables = computed(() =>
  inputs.value.mode === 'strong' ? inputs.value.strongCablesUI : inputs.value.weakCablesUI,
)

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
    <RadioGroup
      v-model="inputs.mode"
      :options="rackModeOptions"
    />

    <!-- パラメータ設定（余裕係数、ケーブル間隔、親桁クリアランス） -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-[var(--space-form-col-gap)]">
      <FormGroup label="余裕係数" help-id="marginRate">
        <Input
          v-model.number="inputs.marginRate"
          type="number"
          step="0.05"
          min="0.1"
          addon="倍"
          :placeholder="inputs.mode === 'strong' ? '1.2' : '0.6'"
        />
      </FormGroup>

      <FormGroup label="ケーブル間隔" help-id="cableSpacing">
        <Input
          v-model.number="inputs.cableSpacing"
          type="number"
          min="0"
          addon="mm"
          placeholder="10"
        />
      </FormGroup>

      <FormGroup label="親桁クリアランス" help-id="sideMargin">
        <Input
          v-model.number="inputs.sideMargin"
          type="number"
          min="0"
          addon="mm"
          :placeholder="inputs.mode === 'strong' ? '60' : '120'"
        />
      </FormGroup>
    </div>

    <!-- 基本条件（ラック高さ、相乗り必要幅） -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-form-col-gap)]">
      <FormGroup label="ラック高さ (H)" help-id="rackHeight">
        <Input
          v-model="inputs.rackHeight"
          type="number"
          min="50"
          step="10"
          addon="mm"
        />
      </FormGroup>

      <FormGroup
        :label="inputs.mode === 'strong' ? '弱電必要幅' : '強電必要幅'"
        help-id="otherWidth"
      >
        <Input
          v-model="inputs.otherWidth"
          type="number"
          min="0"
          addon="mm"
          placeholder="相乗り時に指定"
        />
      </FormGroup>
    </div>

    <!-- ケーブル条件セクション -->
    <section class="flex flex-col gap-[var(--space-item-gap)]">
      <Button
        class="self-end"
        icon="plus"
        @click="handleAddCable"
      >
        {{ inputs.mode === 'strong' ? '強電ケーブルを追加' : '弱電ケーブルを追加' }}
      </Button>

      <!-- ケーブルテーブル（強電/弱電 共通テンプレート） -->
      <Table
        :columns="RACK_CABLE_COLUMNS"
        :data="currentCables"
        class="w-full"
      >
        <template #cell-category="{ row }">
          <Select
            v-model="row.category"
            :options="currentCategories"
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
            :disabled="currentCables.length <= 1"
            title="削除"
            @click="handleRemoveCable(row.id)"
          />
        </template>
      </Table>
    </section>
  </div>
</template>
