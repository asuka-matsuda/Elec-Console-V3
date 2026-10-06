<script setup lang="ts">
/**
 * 電線管サイズ選定計算画面
 * 配管サイズ自動選定ツールのコンポーネントです。収容するケーブルの種類と数から、適切な配管サイズを計算します。
 */
import { onUnmounted, ref } from 'vue'

import { useConduitCalculator } from '~/composables/tools/useConduitCalculator'
import { CONDUIT_CABLE_COLUMNS } from '~/constants/cableConstants'
import { conduitData } from '~/constants/data/conduitData'
import {
  formatConduitCableSpec,
  getAvailableSizes,
  getCableCategories,
} from '~/utils/cable'

useHead({
  title: '配管サイズ自動選定',
})

const {
  inputs,
  result,
  addCable,
  removeCable,
  isSaveDisabled,
  handleSaveHistory,
  openResetModal,
  mathSteps,
} = useConduitCalculator()

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

const categoryOptions = [...new Set(conduitData.map(c => c.category))].map(c => ({ value: c, label: c }))
const categories = getCableCategories()
const getCableSpec = formatConduitCableSpec
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
          <div class="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-x-form-col-gap gap-y-form-row-gap">
            <div class="flex flex-col gap-inline-gap">
              <label for="conduit-category" class="label">対象の配管種類</label>
              <Select id="conduit-category" v-model="inputs.conduitCategory" :options="categoryOptions" placeholder="選択してください" />
            </div>

            <div class="flex flex-col gap-inline-gap">
              <label for="conduit-fill-rate" class="label">占積率</label>
              <Input id="conduit-fill-rate" v-model.number="inputs.customFillRate" type="number" min="1" max="100" placeholder="80" suffix="%" />
            </div>
          </div>

          <section class="flex flex-col gap-item-gap">
            <Button class="self-end" size="sm" icon="plus" @click="addCable">ケーブルを追加する</Button>

            <Table :columns="CONDUIT_CABLE_COLUMNS" :data="inputs.inputCables" class="w-full">
              <template #cell-category="{ row }">
                <Select v-model="row.category" :options="categories" placeholder="選択" @update:model-value="row.cableIdx = ''" />
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
                <Tooltip :text="inputs.inputCables.length <= 1 ? '最低1本のケーブルが必要です' : 'ケーブルを削除'">
                  <Button variant="danger" size="sm" icon="trash-2" :disabled="inputs.inputCables.length <= 1" @click="removeCable(row.id)" />
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
            <span>{{ isShowingBasis ? '計算根拠' : '計算結果・選定結果' }}</span>
          </h3>
          <div class="flex items-center gap-item-gap">
            <Button v-if="mathSteps?.length" variant="tertiary" size="sm" :icon="isShowingBasis ? 'arrow-left' : 'circle-help'" @click="isShowingBasis = !isShowingBasis">{{ isShowingBasis ? '計算結果に戻る' : '計算根拠を表示' }}</Button>
            <Button v-if="!isShowingBasis" variant="primary" size="sm" icon="save" :disabled="isSaveDisabled || saveState !== 'idle'" :loading="saveState === 'saving'" @click="handleSave">履歴に保存する</Button>
          </div>
        </header>
        <hr class="divider">

        <div class="flex flex-1 flex-col min-h-0 overflow-y-auto">
          <ToolResultConduit v-if="!isShowingBasis" :result="result" />
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
