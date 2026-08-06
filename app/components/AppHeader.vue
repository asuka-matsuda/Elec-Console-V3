<script setup lang="ts">
import type { BreadcrumbItem } from './AppBreadcrumb.vue'

const props = defineProps<{
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
      <AppButton 
        variant="tool" 
        class="l-header__menu-btn"
        @click="emit('toggle-sidebar')"
      >
        <AppIcon name="menu" />
      </AppButton>

      <!-- Breadcrumbs / Page Title -->
      <AppBreadcrumb 
        v-if="breadcrumbs?.length" 
        :items="breadcrumbs" 
      />
    </div>

    <div class="l-header__actions">
      <!-- User profile, notifications, etc. will go here -->
      <slot name="actions"></slot>
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
  background-color: transparent;
  border-bottom: var(--border-width-base) solid #{glass-color(15%)};
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4); // Drop shadow over main content

  @include mq('md') {
    padding: 0 var(--space-4);
  }

  &__left {
    display: flex;
    align-items: center;
    gap: var(--space-4);
  }

  &__menu-btn {
    display: none; // Hidden on desktop

    @include mq('lg') {
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
