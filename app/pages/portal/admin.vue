<script setup lang="ts">
/**
 * admin
 * ポータル管理画面 (開発者向け)
 */
import { ref } from 'vue';
import { useHead } from '#app';
import AppTabs from '~/components/ui/AppTabs.vue';
import AppSectionHeader from '~/components/ui/AppSectionHeader.vue';

// タブコンポーネントのインポート
import AdminUsersTab from '~/components/portal/AdminUsersTab.vue';
import AdminSitesTab from '~/components/portal/AdminSitesTab.vue';

useHead({ title: 'ポータル管理 - Elec-Console' });

definePageMeta({
  middleware: ['admin']
});

const tabs = [
  { value: 'users', label: 'ユーザー管理' },
  { value: 'site', label: '現場管理' },
];
const activeTab = ref('users');
</script>

<template>
  <div class="p-portal-admin">
    <AppSectionHeader title="ポータル管理 (開発者向け)" icon="settings" />

    <AppTabs :options="tabs" v-model="activeTab" />

    <div class="p-portal-admin__content">
      <AdminUsersTab v-if="activeTab === 'users'" />
      <AdminSitesTab v-if="activeTab === 'site'" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-portal-admin {
  // --- レイアウト・配置 ---
  @include flex-column(var(--gap-section));

  &__content {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-section));
    flex: 1;
    min-height: 0;
  }
}
</style>
