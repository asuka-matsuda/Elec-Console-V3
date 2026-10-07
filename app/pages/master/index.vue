<script setup lang="ts">
/**
 * マスターシステム管理画面
 * ID:master ユーザー専用のシステム管理画面。
 * 全社メンバー統括・全社お知らせ設定・全社更新履歴設定・全社帳票ひな形管理を集約します。
 */
import { ref, watch } from 'vue'

import { useHead, useRoute, useRouter } from '#app'
import type { TabOption } from '~/types/components'

useHead({ title: 'マスター管理 - Elec-Console' })

definePageMeta({
  middleware: ['master'],
})

type MasterTabKey = 'users' | 'announcements' | 'history' | 'templates'

const route = useRoute()
const router = useRouter()

const VALID_TABS: MasterTabKey[] = ['users', 'announcements', 'history', 'templates']
const initialTab = (VALID_TABS.includes(route.query.tab as MasterTabKey) ? route.query.tab : 'users') as MasterTabKey
const activeTab = ref<MasterTabKey>(initialTab)

const switchTab = (tab: string | number) => {
  const target = tab as MasterTabKey

  activeTab.value = target
  router.replace({ query: { ...route.query, tab: target } })
}

watch(
  () => route.query.tab,
  (newTab) => {
    if (newTab && VALID_TABS.includes(newTab as MasterTabKey) && newTab !== activeTab.value) {
      activeTab.value = newTab as MasterTabKey
    }
  },
)

const MASTER_TABS: TabOption<MasterTabKey>[] = [
  { label: 'メンバー管理', value: 'users', icon: 'user' },
  { label: 'お知らせ設定', value: 'announcements', icon: 'bell' },
  { label: '更新履歴設定', value: 'history', icon: 'clock' },
  { label: '帳票ひな形管理', value: 'templates', icon: 'file-spreadsheet' },
]
</script>

<template>
  <div class="flex flex-col gap-section-gap">
    <Tabs :model-value="activeTab" :items="MASTER_TABS" @update:model-value="switchTab" />

    <div class="flex flex-col gap-panel-gap">
      <PortalTabAdminUsers v-if="activeTab === 'users'" />
      <MasterTabAnnouncements v-else-if="activeTab === 'announcements'" />
      <MasterTabHistory v-else-if="activeTab === 'history'" />
      <MasterTabTemplates v-else-if="activeTab === 'templates'" />
    </div>
  </div>
</template>
