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
  @include flex-start-center;
  @include text-title("md");

  flex-shrink: 0;
  gap: var(--space-2);
  color: var(--color-text-main);
  white-space: nowrap;

  @include state-base;

  :deep(.c-icon) {
    color: var(--theme-accent);

    @include state-base;
  }

  &:is(:hover, :focus-visible) {
    :deep(.c-icon) {
      transform: scale(1.1);

      @include cyber-text-glow(var(--theme-accent), 60%, var(--blur-md));
    }
  }
}
</style>
