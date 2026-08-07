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
      <AppButton
        variant="tool"
        class="l-header__menu-btn"
        @click="emit('toggle-sidebar')"
      >
        <AppIcon name="menu" />
      </AppButton>

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
  height: 72px;
  padding: 0 var(--space-6);

  @include mq("md") {
    padding: 0 var(--space-4);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  // Use class chaining (.c-btn) to increase specificity over AppButton's default styles
  // without relying on !important.
  &__menu-btn.c-btn {
    display: none; // Hidden on desktop

    @include mq("lg") {
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
