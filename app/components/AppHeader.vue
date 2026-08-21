<script setup lang="ts">
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
  // --- Base Styles ---
  @include flex-between;

  height: 64px;
  padding: var(--pad-container);

  @include mq("md") {
    padding: var(--space-3);
  }

  &__left {
    @include flex-start(var(--gap-component));
  }

  &__menu-btn {
    display: none; // Hidden on desktop

    @include mq("md") {
      display: inline-flex;
    }
  }

  &__actions {
    @include flex-start(var(--gap-component));
  }
}
</style>
