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
  <div class="portal-admin">
    <AppSectionHeader title="ポータル管理 (開発者向け)" icon="settings" />

    <AppTabs v-model="activeTab" :options="tabs" />

    <div class="portal-admin__content">
      <PortalAdminUsersTab v-if="activeTab === 'users'" />
      <PortalAdminSitesTab v-if="activeTab === 'site'" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.portal-admin {
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);

  &__content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--space-card-gap);

    min-height: 0;
  }
}
</style>
