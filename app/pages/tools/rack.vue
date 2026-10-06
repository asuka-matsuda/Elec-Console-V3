<script setup lang="ts">
/**
 * ケーブルラック幅選定計算画面
 * ケーブルラック選定ツールのコンポーネントです。強電・弱電ケーブルのリストと段積み数から最適なラック幅を選定します。
 */
import { computed, onUnmounted, ref, watch } from 'vue'

import { useRackCalculator } from '~/composables/tools/useRackCalculator'
import { RACK_CABLE_COLUMNS } from '~/constants/cableConstants'
import { RACK_DEFAULT_PARAMS, rackModeOptions } from '~/constants/rackConstants'
import {
  formatRackCableSpec,
  getAvailableSizes,
  getCableCategories,
} from '~/utils/cable'

useHead({
  title: 'ケーブルラック選定',
})

const {
  inputs,
  result,
  isSaveDisabled,
  addStrongCable,
  removeStrongCable,
  addWeakCable,
  removeWeakCable,
  handleSaveHistory,
  openResetModal,
  mathSteps,
} = useRackCalculator()

// 計算根拠の表示切り替え
const isShowingBasis = ref(false)

// 保存フィードバック
const saveState = ref<'idle' | 'saving' | 'success' | 'error'>('idle')
let resetTimer: ReturnType<typeof setTimeout> | null = null

const clearTimer = () => {
  if (resetTimer) {
    clearTimeout(resetTimer)
    resetTimer = null
  }
}

onUnmounted(clearTimer)

const handleSave = async () => {
  if (isSaveDisabled.value || saveState.value !== 'idle') return

  clearTimer()
  saveState.value = 'saving'
  try {
    await handleSaveHistory()
    saveState.value = 'success'
    resetTimer = setTimeout(() => {
      saveState.value = 'idle'
      resetTimer = null
    }, 2000)
  }
  catch (e) {
    console.error('Save failed:', e)
    saveState.value = 'error'
    resetTimer = setTimeout(() => {
      saveState.value = 'idle'
      resetTimer = null
    }, 3000)
  }
}

const strongCategories = getCableCategories('strong')
const weakCategories = getCableCategories('weak')
const currentCategories = computed(() =>
  inputs.value.mode === 'strong' ? strongCategories : weakCategories,
)

const getCableSpec = formatRackCableSpec

const currentCables = computed(() =>
  inputs.value.mode === 'strong' ? inputs.value.strongCablesUI : inputs.value.weakCablesUI,
)

// モード切替時にデフォルトパラメータを適応
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
    addStrongCable()
  }
  else {
    addWeakCable()
  }
}

const handleRemoveCable = (id: string) => {
  if (inputs.value.mode === 'strong') {
    removeStrongCable(id)
  }
  else {
    removeWeakCable(id)
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-panel-gap min-h-0 w-full max-w-[1600px] mx-auto">
    <Note variant="warning" text="免責事項: 本ツールによる計算結果は、規程に基づいた理論値（目安）です。選定や安全性については、必ず設計者自身の責任において各種関連法規・規程をご確認の上ご判断ください。" />

    <div class="grid flex-1 grid-cols-1 md:grid-cols-[minmax(0,4fr)_minmax(0,3fr)] gap-panel-gap min-h-0">
      <section class="panel flex flex-1 flex-col gap-panel-gap min-h-0">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon name="edit" style="color: var(--color-category-tool)" />
            <span>条件入力</span>
          </h3>
          <div class="flex items-center gap-item-gap">
            <Button variant="secondary" size="sm" icon="refresh-cw" @click="openResetModal">入力をリセットする</Button>
          </div>
        </header>
        <hr class="divider">

        <form class="flex flex-1 flex-col gap-form-row-gap min-h-0 overflow-y-auto" @submit.prevent>
          <nav class="radio-group">
            <button v-for="opt in rackModeOptions" :key="String(opt.value)" type="button" class="radio-group-item" :class="{ 'is-active': inputs.mode === opt.value }" @click="inputs.mode = opt.value">{{ opt.label }}</button>
          </nav>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-form-col-gap">
            <div class="flex flex-col gap-inline-gap">
              <div class="flex items-center gap-inline-gap">
                <label for="rack-margin-rate" class="label">余裕係数</label>
                <Tooltip :text="getHelpContent('marginRate')?.content">
                  <button type="button" class="help-trigger"><Icon name="circle-help" size="sm" /></button>
                </Tooltip>
              </div>
              <Input id="rack-margin-rate" v-model.number="inputs.marginRate" type="number" step="0.05" min="0.1" :placeholder="inputs.mode === 'strong' ? '1.2' : '0.6'" suffix="倍" />
            </div>

            <div class="flex flex-col gap-inline-gap">
              <div class="flex items-center gap-inline-gap">
                <label for="rack-cable-spacing" class="label">ケーブル間隔</label>
                <Tooltip :text="getHelpContent('cableSpacing')?.content">
                  <button type="button" class="help-trigger"><Icon name="circle-help" size="sm" /></button>
                </Tooltip>
              </div>
              <Input id="rack-cable-spacing" v-model.number="inputs.cableSpacing" type="number" min="0" placeholder="10" suffix="mm" />
            </div>

            <div class="flex flex-col gap-inline-gap">
              <div class="flex items-center gap-inline-gap">
                <label for="rack-side-margin" class="label">親桁クリアランス</label>
                <Tooltip :text="getHelpContent('sideMargin')?.content">
                  <button type="button" class="help-trigger"><Icon name="circle-help" size="sm" /></button>
                </Tooltip>
              </div>
              <Input id="rack-side-margin" v-model.number="inputs.sideMargin" type="number" min="0" :placeholder="inputs.mode === 'strong' ? '60' : '120'" suffix="mm" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-form-col-gap">
            <div class="flex flex-col gap-inline-gap">
              <div class="flex items-center gap-inline-gap">
                <label for="rack-height" class="label">ラック高さ (H)</label>
                <Tooltip :text="getHelpContent('rackHeight')?.content">
                  <button type="button" class="help-trigger"><Icon name="circle-help" size="sm" /></button>
                </Tooltip>
              </div>
              <Input id="rack-height" v-model="inputs.rackHeight" type="number" min="50" step="10" suffix="mm" />
            </div>

            <div class="flex flex-col gap-inline-gap">
              <div class="flex items-center gap-inline-gap">
                <label for="rack-other-width" class="label">{{ inputs.mode === 'strong' ? '弱電必要幅' : '強電必要幅' }}</label>
                <Tooltip :text="getHelpContent('otherWidth')?.content">
                  <button type="button" class="help-trigger"><Icon name="circle-help" size="sm" /></button>
                </Tooltip>
              </div>
              <Input id="rack-other-width" v-model="inputs.otherWidth" type="number" min="0" placeholder="相乗り時に指定" suffix="mm" />
            </div>
          </div>

          <section class="flex flex-col gap-item-gap">
            <Button class="self-end" size="sm" icon="plus" @click="handleAddCable">{{ inputs.mode === 'strong' ? '強電ケーブルを追加' : '弱電ケーブルを追加' }}</Button>

            <Table :columns="RACK_CABLE_COLUMNS" :data="currentCables" class="w-full">
              <template #cell-category="{ row }">
                <Select v-model="row.category" :options="currentCategories" placeholder="選択" @update:model-value="row.cableIdx = ''" />
              </template>

              <template #cell-cableIdx="{ row }">
                <Select v-model="row.cableIdx" :options="getAvailableSizes(row.category)" placeholder="選択" :disabled="!row.category" />
              </template>

              <template #cell-count="{ row }">
                <Input v-model.number="row.count" type="number" min="1" suffix="条" />
              </template>

              <template #cell-spec="{ row }">
                <div class="stacked-cell flex flex-col gap-0.5 items-end">
                  <span class="main-text">{{ getCableSpec(row.cableIdx, row.count).text }}</span>
                  <span v-if="getCableSpec(row.cableIdx, row.count).detail" class="sub-text">{{ getCableSpec(row.cableIdx, row.count).detail }}</span>
                </div>
              </template>

              <template #cell-actions="{ row }">
                <Tooltip :text="currentCables.length <= 1 ? '最低1本のケーブルが必要です' : 'ケーブルを削除'">
                  <Button variant="danger" size="sm" icon="trash-2" :disabled="currentCables.length <= 1" @click="handleRemoveCable(row.id)" />
                </Tooltip>
              </template>
            </Table>
          </section>
        </form>
      </section>

      <section class="panel flex flex-1 flex-col gap-panel-gap min-h-0">
        <header class="flex items-center justify-between gap-y-inline-gap gap-x-item-gap">
          <h3 class="flex items-center gap-item-gap">
            <Icon :name="isShowingBasis ? 'book' : 'check-square'" style="color: var(--color-category-tool)" />
            <span>{{ isShowingBasis ? '計算根拠' : '選定結果' }}</span>
          </h3>
          <div class="flex items-center gap-item-gap">
            <Button v-if="mathSteps?.length" variant="tertiary" size="sm" :icon="isShowingBasis ? 'arrow-left' : 'circle-help'" @click="isShowingBasis = !isShowingBasis">{{ isShowingBasis ? '計算結果に戻る' : '計算根拠を表示' }}</Button>
            <Button v-if="!isShowingBasis" variant="primary" size="sm" icon="save" :disabled="isSaveDisabled || saveState !== 'idle'" :loading="saveState === 'saving'" @click="handleSave">履歴に保存する</Button>
          </div>
        </header>
        <hr class="divider">

        <div class="flex flex-1 flex-col min-h-0 overflow-y-auto">
          <ToolResultRack v-if="!isShowingBasis" :result="result" />
          <ToolMathBasis v-else :steps="mathSteps" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.stacked-cell {
  .main-text {
    font-weight: var(--font-weight-medium);
    color: var(--color-text-main);
  }

  .sub-text {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
  }
}
</style>
