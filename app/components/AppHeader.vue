<script setup lang="ts">
/**
 * AppHeader
 * アプリケーションのヘッダー部分（パンくずリストやアクション等）を表示するコンポーネントです。
 */
import type { BreadcrumbItem } from "./AppBreadcrumb.vue";

defineProps<{
  breadcrumbs?: BreadcrumbItem[];
}>();

const emit = defineEmits<{
  (e: "toggle-sidebar"): void;
}>();
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
      <AppBreadcrumb v-if="breadcrumbs?.length" :items="breadcrumbs" />
    </div>

    <div class="l-header__actions">
      <!-- User profile, notifications, etc. will go here -->
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.l-header {
  // --- レイアウト・配置 ---
  @include flex-between;


  // --- ボックスモデル ---

  height: 64px;
  padding: var(--pad-container);

  @include mq("md") {
    // --- ボックスモデル ---
    padding: var(--pad-section);
  }


  // --- 子要素 ---

  &__left {
    // --- レイアウト・配置 ---
    @include flex-start(var(--gap-component));
  }

  &__menu-btn.c-btn {
    // --- レイアウト・配置 ---
    display: none; // Hidden on desktop

    @include mq("md") {
      // --- レイアウト・配置 ---
      display: inline-flex;
    }
  }

  &__actions {
    // --- レイアウト・配置 ---
    @include flex-start(var(--gap-component));
  }
}
</style>
