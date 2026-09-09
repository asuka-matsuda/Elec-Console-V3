<script setup lang="ts">
/**
 * Logo
 * [Atom] アプリケーションのロゴを表示し、クリック時にホームへ遷移またはイベントを発火するコンポーネント。
 */
const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <NuxtLink
    to="/"
    class="relative z-[1] flex shrink-0 items-center gap-2 logo"
    @click="emit('click')"
  >
    <AtomsIcon name="zap" size="md" />
    <span>Elec-Console</span>
  </NuxtLink>
</template>

<style scoped lang="scss">
.logo {
  cursor: pointer;
  user-select: none;

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
