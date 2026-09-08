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

const handleAddCable = () => {
  if (inputs.value.mode === 'strong') {
    emit('add-strong-cable')
  }
  else {
    emit('add-weak-cable')
  }
}
</script>

<template>
  <div class="rack-input">
    <!-- 強電／弱電 タブ切り替え -->
    <AtomsRadioGroup
      v-model="inputs.mode"
      :options="rackModeOptions"
    />

    <!-- 基本条件（ラック高さ、相乗り必要幅） -->
    <div class="header-grid">
      <AppFormGroup label="ラック高さ (H)">
        <MoleculesInputGroup addon="mm">
          <AtomsInput
            v-model="inputs.rackHeight"
            type="number"
            min="50"
            step="10"
          />
        </MoleculesInputGroup>
      </AppFormGroup>

      <AppFormGroup :label="inputs.mode === 'strong' ? '弱電必要幅' : '強電必要幅'">
        <MoleculesInputGroup addon="mm">
          <AtomsInput
            v-model="inputs.otherWidth"
            type="number"
            min="0"
            placeholder="相乗り時に指定"
          />
        </MoleculesInputGroup>
      </AppFormGroup>
    </div>

    <!-- 詳細設定（計算パラメータ） -->
    <details class="details-panel">
      <summary class="details-summary">
        <AtomsIcon name="sliders" size="sm" />
        <span>計算パラメータ設定（余裕係数・離隔など）</span>
      </summary>
      <div class="params-grid">
        <AppFormGroup label="余裕係数">
          <MoleculesInputGroup addon="倍">
            <AtomsInput
              v-model.number="inputs.marginRate"
              type="number"
              step="0.05"
              min="0.1"
              :placeholder="inputs.mode === 'strong' ? '1.2' : '0.6'"
            />
          </MoleculesInputGroup>
        </AppFormGroup>

        <AppFormGroup label="ケーブル間隔">
          <MoleculesInputGroup addon="mm">
            <AtomsInput
              v-model.number="inputs.cableSpacing"
              type="number"
              min="0"
              placeholder="10"
            />
          </MoleculesInputGroup>
        </AppFormGroup>

        <AppFormGroup label="親桁クリアランス">
          <MoleculesInputGroup addon="mm">
            <AtomsInput
              v-model.number="inputs.sideMargin"
              type="number"
              min="0"
              :placeholder="inputs.mode === 'strong' ? '60' : '120'"
            />
          </MoleculesInputGroup>
        </AppFormGroup>
      </div>
    </details>

    <!-- ケーブル条件セクション -->
    <section class="input-section">
      <div class="section-header">
        <h4 class="section-title">
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

      <!-- 強電ケーブルテーブル -->
      <AppTable
        v-if="inputs.mode === 'strong'"
        :columns="RACK_CABLE_COLUMNS"
        class="rack-table"
      >
        <template #body>
          <tr
            v-for="cable in inputs.strongCablesUI"
            :key="cable.id"
          >
            <td>
              <AtomsSelect
                v-model="cable.category"
                :options="strongCategories"
                placeholder="選択"
                @update:model-value="cable.cableIdx = ''"
              />
            </td>
            <td>
              <AtomsSelect
                v-model="cable.cableIdx"
                :options="getAvailableSizes(cable.category)"
                placeholder="選択"
                :disabled="!cable.category"
              />
            </td>
            <td>
              <MoleculesInputGroup addon="本">
                <AtomsInput
                  v-model.number="cable.count"
                  type="number"
                  min="1"
                />
              </MoleculesInputGroup>
            </td>
            <td style="text-align: right;">
              {{ getCableSpecText(cable.cableIdx) }}
            </td>
            <td class="action-cell">
              <AtomsButton
                variant="danger"
                size="sm"
                icon-only
                :disabled="inputs.strongCablesUI.length <= 1"
                aria-label="削除"
                @click="emit('remove-strong-cable', cable.id)"
              >
                <AtomsIcon name="trash-2" size="sm" />
              </AtomsButton>
            </td>
          </tr>
        </template>
      </AppTable>

      <!-- 弱電ケーブルテーブル -->
      <AppTable
        v-else
        :columns="RACK_CABLE_COLUMNS"
        class="rack-table"
      >
        <template #body>
          <tr
            v-for="cable in inputs.weakCablesUI"
            :key="cable.id"
          >
            <td>
              <AtomsSelect
                v-model="cable.category"
                :options="weakCategories"
                placeholder="選択"
                @update:model-value="cable.cableIdx = ''"
              />
            </td>
            <td>
              <AtomsSelect
                v-model="cable.cableIdx"
                :options="getAvailableSizes(cable.category)"
                placeholder="選択"
                :disabled="!cable.category"
              />
            </td>
            <td>
              <MoleculesInputGroup addon="本">
                <AtomsInput
                  v-model.number="cable.count"
                  type="number"
                  min="1"
                />
              </MoleculesInputGroup>
            </td>
            <td style="text-align: right;">
              {{ getCableSpecText(cable.cableIdx) }}
            </td>
            <td class="action-cell">
              <AtomsButton
                variant="danger"
                size="sm"
                icon-only
                :disabled="inputs.weakCablesUI.length <= 1"
                aria-label="削除"
                @click="emit('remove-weak-cable', cable.id)"
              >
                <AtomsIcon name="trash-2" size="sm" />
              </AtomsButton>
            </td>
          </tr>
        </template>
      </AppTable>
    </section>
  </div>
</template>

<style scoped lang="scss">
.rack-input {
  display: flex;
  flex-direction: column;
  gap: var(--space-form-row-gap);
}

.header-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-form-col-gap);

  @include mq("sm") {
    grid-template-columns: 1fr;
  }
}

.details-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  padding: var(--space-2) var(--space-3);
  border: var(--border-width-base) solid var(--color-border-subtle);
  border-radius: var(--radius-md);

  background: var(--color-surface-panel-subtle);

  &[open] {
    padding-bottom: var(--space-3);
  }
}

.details-summary {
  cursor: pointer;
  user-select: none;

  display: flex;
  gap: var(--space-2);
  align-items: center;

  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-secondary);

  &:hover {
    color: var(--color-text-main);
  }
}

.params-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-form-col-gap);

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

.rack-table {
  width: 100%;
  font-size: var(--font-size-xs);
}

.action-cell {
  padding-inline: var(--space-1) !important;
  text-align: center;
}
</style>
