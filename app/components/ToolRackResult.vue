<script setup lang="ts">
/**
 * ToolRackResult
 * ケーブルラック選定ツールの計算・選定結果表示コンポーネントです。
 */
import type { RackCalcResult } from '~/utils/tools/rack/rackCalcLogic'

defineProps<{
  result: RackCalcResult | null
  maxDepth: number
  isStrong: boolean
  isWeak: boolean
}>()
</script>

<template>
  <div class="c-rack-result">
    <AppResultBox
      title="推奨ラックサイズ"
      :variant="result?.error ? 'error' : 'default'"
      :is-empty="result?.error || (!isStrong && !isWeak)"
    >
      <template #value>
        <div class="c-rack-result__value-box">
          <div class="c-rack-result__val">
            <template v-if="result?.error || (!isStrong && !isWeak)">
              ---
            </template>
            <template v-else-if="result?.selectedSize">
              W{{ result?.selectedSize }}
            </template>
            <template v-else>
              規格外 ({{ result?.totalWidth ? Math.ceil(result.totalWidth) : 0 }}mm以上)
            </template>
          </div>
          <div v-if="result?.isOverflow" class="c-rack-result__warning">
            ⚠️ ケーブルの高さがラックの有効深さ({{ maxDepth }}mm)を超過しています。
          </div>
        </div>
      </template>
    </AppResultBox>

    <ToolResultDetails>
      <ToolResultRow label="強電 必要幅">
        <strong>{{ result?.wStrong?.toFixed(1) ?? "0.0" }}</strong> mm
      </ToolResultRow>
      <ToolResultRow label="弱電 必要幅">
        <strong>{{ result?.wWeak?.toFixed(1) ?? "0.0" }}</strong> mm
      </ToolResultRow>
      <ToolResultRow
        v-if="isStrong && isWeak"
        label="セパレータ幅"
      >
        <strong>{{ result?.wSep?.toFixed(1) ?? "0.0" }}</strong> mm
      </ToolResultRow>
      <ToolResultRow label="合計 必要幅" top-border>
        <strong>{{
          result?.totalWidth ? Math.ceil(result.totalWidth) : 0
        }}</strong>
        mm
      </ToolResultRow>
      <ToolResultRow label="最大ケーブル高さ">
        <strong :class="{ 'is-overflow': result?.isOverflow }">{{
          result?.maxCableStackHeight?.toFixed(1) ?? "0.0"
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
    @include flex-start-stretch($direction: column);

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
