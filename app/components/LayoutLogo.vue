<script setup lang="ts">
/**
 * LayoutLogo
 * アプリケーションのロゴを表示し、クリック時にホームへ遷移またはイベントを発火するコンポーネント。
 */
const emit = defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <NuxtLink
    to="/"
    class="c-logo"
    @click="emit('click')"
  >
    <AppIcon
      name="zap"
      class="c-logo__icon"
    />
    <span class="c-logo__text">Elec-Console</span>
  </NuxtLink>
</template>

<style scoped lang="scss">
.c-logo {
  @include click-enabled;
  @include flex-start(var(--space-inline-gap));
  @include state-base;

  &:is(:hover, :focus-visible) {
    .c-logo__icon {
      @include cyber-text-glow(var(--color-category-main), 60%, var(--blur-md));

      transform: scale(1.1);
    }
  }

  &:active {
    @include state-active(var(--color-category-main));
  }

  &__icon {
    width: var(--icon-size-md);
    height: var(--icon-size-md);
    color: var(--color-category-main);

    @include state-base;
  }

  &__text {
    @include text-title-md;
  }
}
</style>
