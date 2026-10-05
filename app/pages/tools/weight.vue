<script setup lang="ts">
/**
 * ケーブル重量・ドラム選定計算画面
 * ケーブル重量・ドラム選定ツールのページコンポーネントです。
 */
import { computed, onUnmounted, ref, watch } from 'vue'

import { useWeightCalculator } from '~/composables/tools/useWeightCalculator'
import { getAvailableSizes, getCableCategories } from '~/utils/cable'

useHead({
  title: 'ケーブル重量・ドラム選定',
})

const {
  inputs,
  result,
  isSaveDisabled,
  handleSaveHistory,
  openResetModal,
  mathSteps,
} = useWeightCalculator()

const categories = getCableCategories()
const availableSizes = computed(() => getAvailableSizes(inputs.value.category))

watch(
  () => inputs.value.category,
  (newVal, oldVal) => {
    if (!oldVal) return
    inputs.value.cableIdx = ''
  },
)

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
</script>

<template>
  <div class="flex flex-1 flex-col gap-panel-gap min-h-0 w-full max-w-[1600px] mx-auto">
    <Alert variant="warning" text="免責事項: 本ツールによる計算結果は、規程に基づいた理論値（目安）です。選定や安全性については、必ず設計者自身の責任において各種関連法規・規程をご確認の上ご判断ください。" />

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

        <form class="flex flex-1 flex-col min-h-0 overflow-y-auto" @submit.prevent>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-form-col-gap gap-y-form-row-gap">
            <div class="flex flex-col gap-inline-gap">
              <label for="weight-category" class="label">ケーブル種別</label>
              <Select id="weight-category" v-model="inputs.category" :options="categories" placeholder="選択してください" />
            </div>

            <div class="flex flex-col gap-inline-gap">
              <label for="weight-cable-size" class="label">ケーブルサイズ</label>
              <Select id="weight-cable-size" v-model="inputs.cableIdx" :options="availableSizes" placeholder="選択してください" :disabled="!inputs.category" />
            </div>

            <div class="flex flex-col gap-inline-gap">
              <label for="weight-cable-length" class="label">ケーブル長 (L)</label>
              <div class="flex items-center gap-inline-gap w-full min-w-0">
                <Input id="weight-cable-length" v-model="inputs.L_input" type="number" min="1" class="flex-1 min-w-0" />
                <span class="shrink-0 form-addon">m</span>
              </div>
            </div>
          </div>
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
          <ToolResultWeight v-if="!isShowingBasis" :result="result" />
          <ToolMathBasis v-else :steps="mathSteps" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.form-addon {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  white-space: nowrap;
}
</style>
