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
    <nav class="tabs flex items-center gap-inline-gap overflow-x-auto">
      <button
        v-for="item in MASTER_TABS"
        :key="item.value"
        type="button"
        class="tabs-item"
        :class="{ 'is-active': activeTab === item.value }"
        @click="activeTab = item.value"
      >
        <Icon v-if="item.icon" :name="item.icon" size="sm" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div class="flex flex-col gap-panel-gap">
      <PortalTabAdminUsers v-if="activeTab === 'users'" />
      <MasterTabAnnouncements v-else-if="activeTab === 'announcements'" />
      <MasterTabHistory v-else-if="activeTab === 'history'" />
    </div>
  </div>
</template>
