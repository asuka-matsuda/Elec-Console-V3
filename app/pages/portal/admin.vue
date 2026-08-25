<script setup lang="ts">
/**
 * admin
 * ポータル管理画面 (開発者向け)
 */
import { ref } from 'vue';
import { useHead } from '#app';
import AppPanel from '~/components/ui/AppPanel.vue';
import AppTabs from '~/components/ui/AppTabs.vue';
import AppTable from '~/components/ui/AppTable.vue';
import AppInput from '~/components/ui/AppInput.vue';
import AppFormGroup from '~/components/ui/AppFormGroup.vue';
import AppCheckbox from '~/components/ui/AppCheckbox.vue';
import AppButton from '~/components/ui/AppButton.vue';
import AppSectionHeader from '~/components/ui/AppSectionHeader.vue';
import AppBadge from '~/components/ui/AppBadge.vue';

useHead({ title: 'ポータル管理 - Elec-Console' });

definePageMeta({
  middleware: ['admin']
});

const tabs = [
  { value: 'users', label: 'ユーザー管理' },
  { value: 'site', label: '現場設定' },
  { value: 'system', label: 'システム設定' },
];
const activeTab = ref('users');

const userHeaders = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '名前' },
  { key: 'role', label: '権限' },
];
const users = ref([
  { id: 1, name: '山田 太郎', role: 'admin' },
  { id: 2, name: '鈴木 一郎', role: 'worker' },
  { id: 3, name: '佐藤 次郎', role: 'viewer' },
]);

const siteFields = [
  { id: 'name', label: '現場名' },
  { id: 'address', label: '所在地' },
];
const siteConfig = ref<Record<string, string>>({
  name: '新国立競技場',
  address: '東京都新宿区',
});

const systemConfig = ref({ maintenance: false });
</script>

<template>
  <div class="p-portal-admin">
    <AppSectionHeader title="ポータル管理 (開発者向け)" icon="settings" class="p-portal-admin__header" />

    <AppTabs :options="tabs" v-model="activeTab" class="p-portal-admin__tabs" />

    <!-- ユーザー管理タブ -->
    <div v-if="activeTab === 'users'">
      <AppPanel title="ユーザー一覧">
        <AppTable :columns="userHeaders" :data="users">
          <template #cell-role="{ value }">
            <AppBadge variant="neutral">{{ value }}</AppBadge>
          </template>
        </AppTable>
      </AppPanel>
    </div>

    <!-- 現場設定タブ -->
    <div v-if="activeTab === 'site'">
      <AppPanel title="現場基本情報">
        <div class="p-portal-admin__form">
          <template v-for="field in siteFields" :key="field.id">
            <AppFormGroup :label="field.label">
              <AppInput v-model="siteConfig[field.id]" />
            </AppFormGroup>
          </template>
          <div class="p-portal-admin__submit">
            <AppButton variant="primary" icon="save">設定を保存</AppButton>
          </div>
        </div>
      </AppPanel>
    </div>

    <!-- システム設定タブ -->
    <div v-if="activeTab === 'system'">
      <AppPanel title="システム動作設定">
        <p class="p-portal-admin__desc">ポータル全体の動作に関わる設定です。</p>
        <AppFormGroup>
          <AppCheckbox v-model="systemConfig.maintenance" label="メンテナンスモードを有効にする" />
        </AppFormGroup>
        <div class="p-portal-admin__submit">
          <AppButton variant="primary" icon="save">設定を保存</AppButton>
        </div>
      </AppPanel>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-portal-admin {
  &__header {
    // --- ボックスモデル ---
    margin-bottom: var(--gap-section);
  }
  
  &__tabs {
    // --- ボックスモデル ---
    margin-bottom: var(--gap-section);
  }

  &__form {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-element));

    // --- ボックスモデル ---
    max-width: 600px;
  }

  &__desc {
    // --- 継承 ---
    @extend %text-desc;

    // --- ボックスモデル ---
    margin-bottom: var(--gap-component);
  }

  &__submit {
    // --- ボックスモデル ---
    margin-top: var(--gap-component);
  }
}
</style>
