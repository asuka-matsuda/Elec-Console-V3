<script setup lang="ts">
/**
 * TemplatesLayout
 * [Tool Template] 計算ツールページの全体テンプレートコンポーネント。
 * 条件入力パネルと計算結果パネルの大枠、および計算根拠モーダルのスロットを提供します。
 * 結果パネル・ドロワー機能は ToolOrganismsResultDrawer に包括されています。
 */
import { computed, useSlots } from 'vue'

import type { ToolTemplatesLayoutProps } from '~/types/components'

withDefaults(
  defineProps<ToolTemplatesLayoutProps>(),
  {
    inputsTitle: '条件入力',
    inputsIcon: 'edit',
    resultsTitle: '計算結果・選定結果',
    resultsIcon: 'check-square',
    saveDisabled: false,
    disclaimerText: undefined,
    hideDisclaimer: false,
  },
)

const emit = defineEmits<{
  reset: []
}>()

const slots = useSlots()
const hasBasis = computed(() => Boolean(slots.basis))
</script>

<template>
  <div class="tool-layout flex flex-1 flex-col gap-panel-gap min-h-0 w-full max-w-[1600px] mx-auto">
    <!-- 免責事項 -->
    <slot v-if="!hideDisclaimer" name="disclaimer">
      <ToolDisclaimer :text="disclaimerText" />
    </slot>

    <!-- メイングリッド（左: 条件入力 / 右: 計算結果） -->
    <div class="grid flex-1 grid-cols-1 md:grid-cols-[minmax(0,4fr)_minmax(0,3fr)] gap-panel-gap min-h-0">
      <!-- 1. 条件入力（PC: 左側 4fr / モバイル: 全面表示） -->
      <section class="flex flex-col min-h-0">
        <Panel class="flex flex-1 flex-col gap-panel-gap min-h-0">
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

          <div class="body flex flex-1 flex-col min-h-0 overflow-y-auto px-2 py-1">
            <slot name="inputs" />
          </div>
        </Panel>
      </section>

      <!-- 2. 計算結果（PC: 右側 3fr / モバイル: 下部Stickyドロワー） -->
      <ToolOrganismsResultDrawer
        :title="resultsTitle"
        :icon="resultsIcon"
        :save-disabled="saveDisabled"
        :save-function="saveFunction"
        :has-basis="hasBasis"
      >
        <template #default>
          <slot name="results" />
        </template>
        <template v-if="hasBasis" #basis>
          <slot name="basis" />
        </template>
      </ToolOrganismsResultDrawer>
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
