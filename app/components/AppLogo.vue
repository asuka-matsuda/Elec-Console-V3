<script setup lang="ts">
/**
 * AppLogo
 * アプリケーションのロゴを表示し、クリック時にホームへ遷移またはイベントを発火するコンポーネント。
 */
import AppIcon from './AppIcon.vue'

const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <NuxtLink to="/" class="logo" @click="emit('click')">
    <AppIcon name="zap" size="md" />
    <span>Elec-Console</span>
  </NuxtLink>
</template>

<style scoped lang="scss">
.logo {
  cursor: pointer;
  user-select: none;

  position: relative;
  z-index: 1;

  display: flex;
  flex-shrink: 0;
  gap: var(--space-2);
  align-items: center;

  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  color: var(--color-text-main);
  white-space: nowrap;

  transition: var(--transition-base);

  :deep(.icon) {
    position: relative;
    z-index: 1;
    color: var(--theme-accent);
    transition: var(--transition-base);
  }

  &:is(:hover, :focus-visible) {
    :deep(.icon) {
      --glow-color: var(--theme-accent);

      text-shadow: var(--text-glow-md);
    }
  }
}
</style>
