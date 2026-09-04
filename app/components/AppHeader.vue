<script setup lang="ts">
/**
 * AppHeader
 * アプリケーションのヘッダー部分（パンくずリストやアクション等）を表示するコンポーネントです。
 */
import type { BreadcrumbItem } from '~/components/AppBreadcrumb.vue'

defineProps<{
  breadcrumbs?: BreadcrumbItem[]
}>()

const emit = defineEmits<{
  (e: 'toggle-sidebar'): void
}>()
</script>

<template>
  <header class="c-header">
    <div class="c-header__main">
      <AppIconButton
        name="menu"
        class="c-header__menu-btn"
        @click="emit('toggle-sidebar')"
      />
      <AppLogo />

      <AppBreadcrumb
        v-if="breadcrumbs?.length"
        :items="breadcrumbs"
        class="c-header__breadcrumb"
      />
    </div>

    <div class="c-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.c-header {
  @include flex-between-center;

  height: 64px;
  padding: 0 var(--space-layout-pad);

  &__main {
    @include flex-start-center;

    gap: var(--space-3);
  }

  &__breadcrumb {
    @include mq("md") {
      display: none;
    }
  }

  &__menu-btn {
    display: none;

    @include mq("md") {
      display: inline-flex;
    }
  }

  &__actions {
    @include flex-start-center;

    gap: var(--space-2);
  }
}
</style>
