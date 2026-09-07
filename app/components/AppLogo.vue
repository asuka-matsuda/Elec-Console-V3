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
  <NuxtLink to="/" class="c-logo" @click="emit('click')">
    <AppIcon name="zap" size="md" />
    <span>Elec-Console</span>
  </NuxtLink>
</template>

<style scoped lang="scss">
.c-logo {
  @include click-enabled;
  @include text-title("md");

  display: flex;
  flex-shrink: 0;
  gap: var(--space-2);
  align-items: center;

  color: var(--color-text-main);
  white-space: nowrap;

  @include state-base;

  :deep(.c-icon) {
    color: var(--theme-accent);

    @include state-base;
  }

  &:is(:hover, :focus-visible) {
    :deep(.c-icon) {
      @include cyber-text-glow(var(--theme-accent), 60%, var(--blur-md));
    }
  }
}
</style>
