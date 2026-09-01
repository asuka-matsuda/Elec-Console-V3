<script setup lang="ts">
/**
 * LayoutHeader
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
  <header class="l-header">
    <div class="l-header__left">
      <!-- Mobile Sidebar Toggle -->
      <AppIconButton
        name="menu"
        class="l-header__menu-btn"
        @click="emit('toggle-sidebar')"
      />

      <!-- Breadcrumbs / Page Title -->
      <AppBreadcrumb
        v-if="breadcrumbs?.length"
        :items="breadcrumbs"
      />
    </div>

    <div class="l-header__actions">
      <!-- User profile, notifications, etc. will go here -->
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.l-header {
  @include flex-between-center;

  height: 64px;
  padding: 0 var(--space-layout-pad);

  &__left {
    @include flex-start-center;

    gap: var(--space-inline-gap);
  }

  &__menu-btn.c-btn {
    display: none; // Hidden on desktop

    @include mq("md") {
      display: inline-flex;
    }
  }

  &__actions {
    @include flex-start-center;

    gap: var(--space-inline-gap);
  }
}
</style>
