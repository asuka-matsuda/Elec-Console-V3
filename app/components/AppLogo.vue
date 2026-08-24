<script setup lang="ts">
/**
 * AppLogo
 * アプリケーションのロゴを表示し、クリック時にホームへ遷移またはイベントを発火するコンポーネント。
 */
const emit = defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <NuxtLink to="/" class="c-logo" @click="emit('click')">
    <AppIcon name="zap" class="c-logo__icon" />
    <span class="c-logo__text">Elec-Console</span>
  </NuxtLink>
</template>

<style scoped lang="scss">
.c-logo {
  // --- Base Styles ---
  @include flex-start(var(--gap-section));

  transition: var(--transition-base);

  &:hover {
    .c-logo__icon {
      @include cyber-text-glow(var(--color-category-main), 60%, var(--blur-md));

      transform: scale(1.1);
    }
  }

  &__icon {
    width: var(--icon-size-md);
    height: var(--icon-size-md);
    color: var(--color-category-main);
    transition: var(--transition-base);
  }

  &__text {
    @extend %text-lg;

    font-weight: var(--font-weight-bold);
    letter-spacing: 0.05em;
  }
}
</style>
