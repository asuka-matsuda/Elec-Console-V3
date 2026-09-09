<script setup lang="ts">
/**
 * AtomsDisclaimer
 * 免責事項（注意事項）を表示するAtomコンポーネントです。
 */
const {
  text = '本ツールによる計算結果は、規程に基づいた理論値（目安）です。選定や安全性については、必ず設計者自身の責任において各種関連法規・規程をご確認の上ご判断ください。',
} = defineProps<{
  text?: string
}>()
</script>

<template>
  <div class="disclaimer flex shrink-0 items-center gap-2 py-2 px-3">
    <AtomsIcon name="alert-triangle" size="sm" />
    <p class="flex-1">
      <strong>免責事項:</strong> <slot>{{ text }}</slot>
    </p>
  </div>
</template>

<style scoped lang="scss">
.disclaimer {
  --disclaimer-color: var(--color-status-warning);

  border: var(--border-width-base) solid color-mix(in srgb, var(--disclaimer-color) 20%, transparent);
  border-radius: var(--radius-sm);

  color: var(--disclaimer-color);
  letter-spacing: var(--tracking-normal);

  background-color: color-mix(
    in srgb,
    var(--disclaimer-color) 6%,
    var(--surface-bg)
  );

  p {
    font-size: var(--font-size-sm);
    color: inherit;
  }

  strong {
    font-weight: var(--font-weight-bold);
  }
}
</style>
