<script setup lang="ts">
/**
 * admin
 * ポータル管理画面 (開発者向け)
 */
import { ref } from 'vue'

import { useHead } from '#app'
import { ADMIN_TABS } from '~/constants/adminConstants'

useHead({ title: 'ポータル管理 - Elec-Console' })

definePageMeta({
  middleware: ['admin'],
})

const activeTab = ref('users')
</script>

<template>
  <div class="flex flex-col gap-section-gap">
    <MoleculesSectionHeader title="ポータル管理 (開発者向け)" icon="settings" />

    <AtomsTabs v-model="activeTab" :options="ADMIN_TABS" />

    <div class="flex flex-1 flex-col gap-card-gap min-h-0">
      <PortalAdminUsersTab v-if="activeTab === 'users'" />
      <PortalAdminSitesTab v-if="activeTab === 'site'" />
    </div>
  </div>
</template>
