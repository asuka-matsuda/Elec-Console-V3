<script setup lang="ts">
/**
 * ポータル管理者設定画面
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
        <PortalTabAdminUsers />
      </template>

      <template #site>
        <PortalTabAdminSites />
      </template>
    </Tabs>
  </div>
</template>
