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
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 var(--space-4);

  @include mq("md") {
    padding: 0 var(--space-3);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  &__menu-btn {
    display: none; // Hidden on desktop

    @include mq("md") {
      display: inline-flex;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }
}
</style>
