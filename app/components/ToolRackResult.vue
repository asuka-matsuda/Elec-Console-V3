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
  mode?: 'strong' | 'weak'
}>()

const vm = computed(() =>
  formatRackResult({
    result: props.result,
    maxDepth: props.maxDepth,
    mode: props.mode,
  }),
)
</script>

<template>
  <div class="c-rack-result">
    <AppResultBox
      :status="vm.boxStatus"
      :is-empty="vm.isEmpty"
    >
      <template #title>
        <span class="c-rack-result__box-title">
          推奨ラックサイズ
          <AppBadge v-if="vm.isOverflow" color="warning">高さ不足</AppBadge>
          <AppBadge v-else-if="vm.isSizeOver" color="danger">規格外</AppBadge>
        </span>
      </template>

      <template #value>
        <div class="c-rack-result__value-box">
          <div class="c-rack-result__val">
            {{ vm.displaySize }}
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

  &__box-title {
    @include flex-center-center;

    gap: var(--space-2);
  }

  &__value-box {
    @include flex-start-center($direction: column);

    gap: var(--space-1);
  }

  &__val {
    @include text-mono("3xl", "bold");
  }
}

.is-overflow {
  color: var(--color-status-warning);
}
</style>
