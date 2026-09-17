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
    <Tabs
      v-model="activeTab"
      :options="ADMIN_TABS"
      panel-class="flex flex-1 flex-col gap-panel-gap min-h-0"
    >
      <template #users>
        <PortalOrganismsAdminUsersTab />
      </template>

      <template #site>
        <PortalOrganismsAdminSitesTab />
      </template>
    </Tabs>
  </div>
</template>
