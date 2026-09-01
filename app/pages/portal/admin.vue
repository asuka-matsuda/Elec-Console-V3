<script setup lang="ts">
/**
 * admin
 * ポータル管理画面 (開発者向け)
 */
import { ref } from 'vue'

import { useHead } from '#app'

useHead({ title: 'ポータル管理 - Elec-Console' })

definePageMeta({
  middleware: ['admin'],
})

const tabs = [
  { value: 'users', label: 'ユーザー管理' },
  { value: 'site', label: '現場管理' },
]
const activeTab = ref('users')
</script>

<template>
  <div class="p-portal-admin">
    <AppSectionHeader
      title="ポータル管理 (開発者向け)"
      icon="settings"
    />

    <AppTabs
      v-model="activeTab"
      :options="tabs"
    />

    <div class="p-portal-admin__content">
      <AdminUsersTab v-if="activeTab === 'users'" />
      <AdminSitesTab v-if="activeTab === 'site'" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-portal-admin {
  @include flex-start-stretch($direction: column);

  gap: var(--space-section-gap);

  &__content {
    @include flex-start-stretch($direction: column);

    flex: 1;
    gap: var(--space-card-gap);
    min-height: 0;
  }
}
</style>
