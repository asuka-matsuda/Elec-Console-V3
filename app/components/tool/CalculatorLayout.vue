<script setup lang="ts">
/**
 * CalculatorLayout
 * [Tool Template] 計算ツールページの全体テンプレートコンポーネント。
 * 条件入力パネルと計算結果パネルの大枠、および計算根拠モーダルのスロットを提供します。
 * 結果パネル・ドロワー機能は ToolResultDrawer に包括されています。
 */
import type { ToolCalculatorLayoutProps } from '~/types/components'

withDefaults(
  defineProps<ToolCalculatorLayoutProps>(),
  {
    inputsTitle: '条件入力',
    inputsIcon: 'edit',
    resultsTitle: '計算結果・選定結果',
    resultsIcon: 'check-square',
    saveDisabled: false,
    disclaimerText: '免責事項: 本ツールによる計算結果は、規程に基づいた理論値（目安）です。選定や安全性については、必ず設計者自身の責任において各種関連法規・規程をご確認の上ご判断ください。',
    hideDisclaimer: false,
  },
)

const emit = defineEmits<{
  reset: []
}>()
</script>

<template>
  <div class="tool-layout flex flex-1 flex-col gap-panel-gap min-h-0 w-full max-w-[1600px] mx-auto">

    <slot v-if="!hideDisclaimer" name="disclaimer">
      <Disclaimer :text="disclaimerText" />
    </slot>

    <div class="grid flex-1 grid-cols-1 md:grid-cols-[minmax(0,4fr)_minmax(0,3fr)] gap-panel-gap min-h-0">

      <Panel as="section" class="flex flex-1 flex-col gap-panel-gap min-h-0">
        <SectionHeader
          :title="inputsTitle"
          :icon="inputsIcon"
          tag="h3"
        >
          <template #actions>
            <Button
              variant="danger"
              icon="refresh-cw"
              @click="emit('reset')"
            >
              リセット
            </Button>
          </template>
        </SectionHeader>

        <div class="body flex flex-1 flex-col min-h-0 overflow-y-auto px-item-gap py-inline-gap">
          <slot name="inputs" />
        </div>
      </Panel>

      <ToolResultDrawer
        :title="resultsTitle"
        :icon="resultsIcon"
        :save-disabled="saveDisabled"
        :save-function="saveFunction"
      >
        <template #default>
          <slot name="results" />
        </template>
        <template v-if="$slots.basis" #basis>
          <slot name="basis" />
        </template>
      </ToolResultDrawer>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tool-layout {
  .body {
    --scrollbar-size: var(--space-2);
  }
}
</style>
