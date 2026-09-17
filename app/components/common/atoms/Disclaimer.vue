<script setup lang="ts">
/**
 * Disclaimer
 * 免責事項（注意事項）を表示するAtomコンポーネントです。
 *
 * @example
 * <!-- デフォルト表示 -->
 * <Disclaimer />
 *
 * <!-- 文言のカスタマイズ -->
 * <Disclaimer text="注意: ツール固有の注記..." />
 *
 * <!-- スロットによるカスタムアイコン・本文 -->
 * <Disclaimer>
 *   <template #icon><Icon name="info" size="sm" /></template>
 *   最新のカタログ値をご確認ください。
 * </Disclaimer>
 */
import type { DisclaimerProps } from '~/types/components'

const props = withDefaults(defineProps<DisclaimerProps>(), {
  text: '免責事項: 本ツールによる計算結果は、規程に基づいた理論値（目安）です。選定や安全性については、必ず設計者自身の責任において各種関連法規・規程をご確認の上ご判断ください。',
})
</script>

<template>
  <div class="disclaimer flex shrink-0 items-start gap-2 py-2 px-3">
    <slot name="icon">
      <Icon name="alert-triangle" class="mt-0.5 shrink-0" />
    </slot>
    <p class="flex-1 min-w-0 break-words">
      <slot>{{ props.text }}</slot>
    </p>
  </div>
</template>

<style scoped lang="scss">
.disclaimer {
  --disclaimer-color: var(--color-status-warning);

  border: var(--border-width-base) solid color-mix(in srgb, var(--disclaimer-color) 20%, transparent);
  color: var(--disclaimer-color);
  background-color: color-mix(
    in srgb,
    var(--disclaimer-color) 6%,
    var(--surface-bg)
  );

  p {
    font-size: var(--font-size-sm);
    line-height: var(--line-height-base);
    color: inherit;
    letter-spacing: var(--tracking-normal);
  }
}
</style>
