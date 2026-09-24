<script setup lang="ts">
/**
 * マスターシステム管理画面
 * ID:master ユーザー専用のシステム管理画面。
 * 全社メンバー統括・全社お知らせ設定・全社更新履歴設定を集約します。
 */
import { ref } from 'vue'

import { useHead } from '#app'
import type { TabOption } from '~/types/components'

useHead({ title: 'マスター管理 - Elec-Console' })

definePageMeta({
  middleware: ['master'],
})

const activeTab = ref<'users' | 'announcements' | 'history'>('users')

const MASTER_TABS: TabOption<'users' | 'announcements' | 'history'>[] = [
  {
    label: 'メンバー管理',
    value: 'users',
    icon: 'user',
  },
  {
    label: 'お知らせ設定',
    value: 'announcements',
    icon: 'bell',
  },
  {
    label: '更新履歴設定',
    value: 'history',
    icon: 'clock',
  },
]
</script>

<template>
  <div class="flex flex-col gap-section-gap">
    <Tabs
      v-model="activeTab"
      :options="MASTER_TABS"
      panel-class="flex flex-col gap-panel-gap"
    >
      <template #users>
        <PortalTabAdminUsers />
      </template>

      <template #announcements>
        <MasterTabAnnouncements />
      </template>

      <template #history>
        <MasterTabHistory />
      </template>
    </Tabs>
  </div>
</template>
