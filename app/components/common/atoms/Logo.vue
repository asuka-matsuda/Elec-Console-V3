<script setup lang="ts">
/**
 * Logo
 * アプリケーションロゴ表示コンポーネント。
 */
</script>

<template>
  <div class="flex shrink-0 items-center gap-item-gap logo">
    <Icon name="gauge" class="logo-icon" />
    <span>Elec-Console</span>
  </div>
</template>

<style scoped lang="scss">
.logo {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
  white-space: nowrap;
}

.logo-icon {
  color: var(--theme-accent);
}
</style>
