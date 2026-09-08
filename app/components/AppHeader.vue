<script setup lang="ts">
/**
 * AppHeader
 * アプリケーションのヘッダー部分（パンくずリストやアクション等）を表示するコンポーネントです。
 */
import type { BreadcrumbItem } from '~/types/components'

interface Props {
  breadcrumbs?: BreadcrumbItem[]
}

const { breadcrumbs } = defineProps<Props>()

const emit = defineEmits<{
  'toggle-sidebar': []
}>()
</script>

<template>
  <header class="header">
    <div class="main">
      <MoleculesIconButton
        name="menu"
        class="menu-btn"
        @click="emit('toggle-sidebar')"
      />
      <AtomsLogo />

      <AtomsBreadcrumb
        v-if="breadcrumbs?.length"
        :items="breadcrumbs"
        class="breadcrumb"
      />
    </div>

    <div class="actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped lang="scss">
.header {
  position: relative;
  z-index: 10;

  display: flex;
  align-items: center;
  justify-content: space-between;

  height: 64px;
  padding: 0 var(--space-layout-pad);
  border-bottom: var(--border-width-base) solid var(--color-border);

  background-color: var(--surface-bg);
  backdrop-filter: blur(var(--blur-md));
}

.main {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.menu-btn {
  display: inline-flex;
}

.breadcrumb {
  @include mq("md") {
    display: none;
  }
}

.actions {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
</style>
