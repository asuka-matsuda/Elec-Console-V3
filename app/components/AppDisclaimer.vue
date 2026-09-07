<script setup lang="ts">
/**
 * AppDisclaimer
 * 免責事項（注意事項）を表示するコンポーネントです。
 */
const {
  text = '本ツールによる計算結果は、規程に基づいた理論値（目安）です。選定や安全性については、必ず設計者自身の責任において各種関連法規・規程をご確認の上ご判断ください。',
} = defineProps<{
  text?: string
}>()
</script>

<template>
  <aside class="c-disclaimer" role="note" aria-label="免責事項">
    <AppIcon name="alert-triangle" size="sm" class="icon" />
    <div class="body">
      <strong class="label">免責事項:</strong>
      <span class="text"><slot>{{ text }}</slot></span>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.c-disclaimer {
  --disclaimer-color: var(--color-status-warning);

  display: flex;
  flex-shrink: 0;
  gap: var(--space-2);
  align-items: flex-start;

  padding: var(--space-2) var(--space-3);
  border: var(--border-width-base) solid color-mix(in srgb, var(--disclaimer-color) 20%, transparent);
  border-radius: var(--radius-sm);

  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  color: color-mix(in srgb, var(--disclaimer-color) 85%, var(--color-text-main));
  letter-spacing: var(--tracking-normal);

  background-color: color-mix(
    in srgb,
    var(--disclaimer-color) 6%,
    var(--surface-bg)
  );

  .icon {
    flex-shrink: 0;
    margin-top: 3px;
    font-size: var(--icon-size-md);
    color: var(--disclaimer-color);
  }

  .body {
    flex: 1;
  }

  .label {
    margin-right: var(--space-1);
    font-weight: var(--font-weight-bold);
    color: var(--disclaimer-color);
  }
}
</style>
