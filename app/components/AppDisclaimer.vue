<script setup lang="ts">
/**
 * AppDisclaimer
 * 免責事項（注意事項）を表示するコンポーネントです。
 */
withDefaults(
  defineProps<{
    text?: string
  }>(),
  {
    text: '本ツールによる計算結果は、規程に基づいた理論値（目安）です。選定や安全性については、必ず設計者自身の責任において各種関連法規・規程をご確認の上ご判断ください。',
  },
)
</script>

<template>
  <p class="c-disclaimer">
    <strong>⚠️ 免責事項:</strong> <slot>{{ text }}</slot>
  </p>
</template>

<style scoped lang="scss">
.c-disclaimer {
  @include text-desc;

  flex-shrink: 0;

  padding: var(--space-2) var(--space-3);
  border: var(--border-width-base) solid
    color-mix(in srgb, var(--color-status-warning) 20%, transparent);
  border-radius: var(--radius-sm);

  color: color-mix(in srgb, var(--color-status-warning) 85%, var(--color-text-main));

  background-color: color-mix(
    in srgb,
    var(--color-status-warning) 6%,
    var(--surface-bg)
  );
}
</style>
