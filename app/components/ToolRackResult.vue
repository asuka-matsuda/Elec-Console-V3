<script setup lang="ts">
/**
 * ToolRackResult
 * ケーブルラック選定ツールの計算・選定結果表示コンポーネントです。
 */
import { computed } from 'vue'

import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'
import { formatRackResult } from '~/utils/tools/rack/rackResultPresenter'

const props = defineProps<{
  result: RackCalcResult | null
  maxDepth: number
  isStrong: boolean
  isWeak: boolean
}>()

const vm = computed(() =>
  formatRackResult({
    result: props.result,
    maxDepth: props.maxDepth,
    isStrong: props.isStrong,
    isWeak: props.isWeak,
  }),
)
</script>

<template>
  <div class="c-rack-result">
    <AppResultBox
      title="推奨ラックサイズ"
      :variant="vm.boxVariant"
      :is-empty="vm.isEmpty"
    >
      <template #value>
        <div class="c-rack-result__value-box">
          <div class="c-rack-result__val">
            {{ vm.displaySize }}
          </div>
          <div v-if="vm.isOverflow" class="c-rack-result__warning">
            {{ vm.overflowWarning }}
          </div>
        </div>
      </template>
    </AppResultBox>

    <ToolResultDetails>
      <ToolResultRow label="強電 必要幅">
        <strong>{{ vm.wStrong }}</strong> mm
      </ToolResultRow>
      <ToolResultRow label="弱電 必要幅">
        <strong>{{ vm.wWeak }}</strong> mm
      </ToolResultRow>
      <ToolResultRow
        v-if="vm.showSeparator"
        label="セパレータ幅"
      >
        <strong>{{ vm.wSep }}</strong> mm
      </ToolResultRow>
      <ToolResultRow label="合計 必要幅" top-border>
        <strong>{{ vm.totalWidth }}</strong> mm
      </ToolResultRow>
      <ToolResultRow label="最大ケーブル高さ">
        <strong :class="{ 'is-overflow': vm.isMaxHeightOverflow }">{{
          vm.maxHeight
        }}</strong>
        mm (有効 {{ maxDepth }} mm)
      </ToolResultRow>
    </ToolResultDetails>
  </div>
</template>

<style scoped lang="scss">
.c-rack-result {
  @include flex-start-stretch($direction: column);

  gap: var(--space-card-gap);

  &__value-box {
    @include flex-start-center($direction: column);

    gap: var(--space-1);
  }

  &__val {
    @include text-title("xl");
  }

  &__warning {
    @include text-meta("sm", "bold");

    color: var(--color-status-danger);
  }
}

.is-overflow {
  color: var(--color-status-danger);
}
</style>
