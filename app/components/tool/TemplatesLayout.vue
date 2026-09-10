<script setup lang="ts">
/**
 * TemplatesLayout
 * [Tool Template] 計算ツールページの全体テンプレートコンポーネント。
 * 条件入力パネルと計算結果パネルの大枠、および計算根拠モーダルのスロットを提供します。
 * 結果パネル・ドロワー機能は ToolOrganismsResultDrawer に包括されています。
 */
import { computed, provide, ref, useSlots } from 'vue'

withDefaults(
  defineProps<{
    inputsTitle?: string
    inputsIcon?: string
    resultsTitle?: string
    resultsIcon?: string
    saveDisabled?: boolean
    saveFunction?: () => Promise<void>
  }>(),
  {
    inputsTitle: '条件入力',
    inputsIcon: 'edit',
    resultsTitle: '計算結果・選定結果',
    resultsIcon: 'check-square',
    saveDisabled: false,
  },
)

const emit = defineEmits<{
  reset: []
}>()

const slots = useSlots()
const isBasisModalOpen = ref(false)

const openBasisModal = () => {
  isBasisModalOpen.value = true
}

const closeBasisModal = () => {
  isBasisModalOpen.value = false
}

const hasBasis = computed(() => !!slots.basis)

provide('openToolBasis', openBasisModal)
provide('hasToolBasis', hasBasis)
provide('toolBasisModal', {
  isOpen: isBasisModalOpen,
  open: openBasisModal,
  close: closeBasisModal,
})
</script>

<template>
  <div class="tool-layout flex flex-1 flex-col gap-card-gap min-h-0 w-full max-w-[1600px] mx-auto">
    <!-- 免責事項 -->
    <slot name="disclaimer">
      <AtomsDisclaimer />
    </slot>

    <!-- メイングリッド（左: 条件入力 / 右: 計算結果） -->
    <div class="grid flex-1 grid-cols-1 md:grid-cols-[minmax(0,4fr)_minmax(0,3fr)] gap-panel-gap min-h-0">
      <!-- 1. 条件入力（PC: 左側 4fr / モバイル: 全面表示） -->
      <section class="flex flex-col min-h-0">
        <AtomsPanel class="flex flex-1 flex-col gap-panel-gap min-h-0">
          <MoleculesSectionHeader
            :title="inputsTitle"
            :icon="inputsIcon"
            variant="tool"
            size="md"
          >
            <template #actions>
              <AtomsButton variant="danger" size="sm" @click="emit('reset')">
                <AtomsIcon name="refresh-cw" size="sm" />
                リセット
              </AtomsButton>
            </template>
          </MoleculesSectionHeader>

          <div class="body flex flex-1 flex-col min-h-0 overflow-y-auto px-2 py-1">
            <slot name="inputs" :open-basis="openBasisModal" />
          </div>
        </AtomsPanel>
      </section>

      <!-- 2. 計算結果（PC: 右側 3fr / モバイル: 下部Stickyドロワー） -->
      <ToolOrganismsResultDrawer
        :title="resultsTitle"
        :icon="resultsIcon"
        :save-disabled="saveDisabled"
        :save-function="saveFunction"
        :has-basis="hasBasis"
        @open-basis="openBasisModal"
      >
        <slot name="results" :open-basis="openBasisModal" />
      </ToolOrganismsResultDrawer>
    </div>

    <!-- 計算根拠モーダルスロット -->
    <slot name="basis" />
  </div>
</template>

<style scoped lang="scss">
.tool-layout {
  .body {
    --scrollbar-size: var(--space-2);
  }
}
</style>
