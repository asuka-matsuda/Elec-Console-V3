<script setup lang="ts">
/**
 * AppDisclaimer
 * 免責事項（注意事項）を表示するコンポーネントです。
 */
withDefaults(
  defineProps<{
    text?: string;
  }>(),
  {
    text: "本ツールによる計算結果は、規程に基づいた理論値（目安）です。選定や安全性については、必ず設計者自身の責任において各種関連法規・規程をご確認の上ご判断ください。",
  },
);
</script>

<template>
  <p class="c-disclaimer">
    <strong>⚠️ 免責事項:</strong> <slot>{{ text }}</slot>
  </p>
</template>

<style scoped lang="scss">
.c-disclaimer {
  // --- Base Styles ---
  @extend %text-sm;

  width: 100%;
  padding: var(--space-3);
  line-height: var(--line-height-relaxed);
  color: var(--color-status-warning);
}
</style>
