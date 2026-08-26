<script setup lang="ts">
/**
 * PortalAdminSitesTab
 * ポータル管理 - 現場管理タブ
 */
import { ref } from 'vue';
import { useAdminSites } from '~/composables/admin/useAdminSites';
import AppPanel from '~/components/ui/AppPanel.vue';
import AppTable from '~/components/ui/AppTable.vue';
import AppBadge from '~/components/ui/AppBadge.vue';
import AppButton from '~/components/ui/AppButton.vue';
import AppModal from '~/components/ui/AppModal.vue';
import AppFormGroup from '~/components/ui/AppFormGroup.vue';
import AppInput from '~/components/ui/AppInput.vue';
import AppCheckbox from '~/components/ui/AppCheckbox.vue';
import type { SiteStatus, SiteSettings } from '~/types/admin';

const { sites, createSite, getSettings, updateSettings } = useAdminSites();

// --- 一覧定義 ---
const siteHeaders = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: '現場名' },
  { key: 'address', label: '所在地' },
  { key: 'status', label: 'ステータス' },
  { key: 'actions', label: '操作' },
];

// --- 新規登録モーダル ---
const isCreateModalOpen = ref(false);
const newSite = ref({
  name: '',
  address: '',
  status: 'planning' as SiteStatus,
});
const newSiteSettings = ref({
  phase2ThresholdMegOhm: 1.0,
  enablePhase3: true,
});

const handleCreateSite = () => {
  createSite({ ...newSite.value }, { ...newSiteSettings.value });
  isCreateModalOpen.value = false;
  newSite.value = { name: '', address: '', status: 'planning' };
};

// --- 詳細設定モーダル ---
const isSettingsModalOpen = ref(false);
const settingsTargetSiteId = ref('');
const editingSettings = ref<Partial<SiteSettings>>({});

const openSettingsModal = (siteId: string) => {
  const currentSettings = getSettings(siteId);
  if (currentSettings) {
    settingsTargetSiteId.value = siteId;
    editingSettings.value = { ...currentSettings };
    isSettingsModalOpen.value = true;
  }
};

const handleSaveSettings = () => {
  updateSettings(settingsTargetSiteId.value, editingSettings.value);
  isSettingsModalOpen.value = false;
};
</script>

<template>
  <div class="c-admin-sites">
    <AppPanel title="現場プロジェクト一覧">
      <div class="c-admin-sites__toolbar">
        <AppButton variant="primary" icon="plus" @click="isCreateModalOpen = true">新規現場登録</AppButton>
      </div>

      <AppTable :columns="siteHeaders" :data="sites">
        <template #cell-status="{ value }">
          <AppBadge :variant="value === 'in_progress' ? 'success' : value === 'completed' ? 'neutral' : 'warning'">
            {{ value === 'planning' ? '計画中' : value === 'in_progress' ? '進行中' : '完了' }}
          </AppBadge>
        </template>
        <template #cell-actions="{ row }">
          <AppButton variant="secondary" size="sm" icon="settings" @click="openSettingsModal(row.id)">現場設定</AppButton>
        </template>
      </AppTable>
    </AppPanel>

    <!-- 新規登録モーダル -->
    <AppModal v-model="isCreateModalOpen" title="新規現場プロジェクト登録">
      <div class="c-admin-sites__stack">
        <AppFormGroup label="現場名">
          <AppInput v-model="newSite.name" placeholder="例: 新宿プロジェクト" />
        </AppFormGroup>
        <AppFormGroup label="所在地">
          <AppInput v-model="newSite.address" placeholder="例: 東京都新宿区" />
        </AppFormGroup>
        <hr class="c-admin-sites__divider" />
        <p class="c-admin-sites__desc">初期設定</p>
        <AppFormGroup label="Phase2 絶縁抵抗基準値 (MΩ)">
          <AppInput v-model.number="newSiteSettings.phase2ThresholdMegOhm" type="number" step="0.1" />
        </AppFormGroup>
        <AppFormGroup>
          <AppCheckbox v-model="newSiteSettings.enablePhase3" label="Phase3 (耐圧試験) を実施する" />
        </AppFormGroup>
      </div>
      <template #footer>
        <AppButton variant="primary" @click="handleCreateSite">登録する</AppButton>
      </template>
    </AppModal>

    <!-- 詳細設定モーダル -->
    <AppModal v-model="isSettingsModalOpen" title="現場詳細設定">
      <div class="c-admin-sites__stack">
        <AppFormGroup label="Phase2 絶縁抵抗基準値 (MΩ)">
          <AppInput v-model.number="editingSettings.phase2ThresholdMegOhm" type="number" step="0.1" />
        </AppFormGroup>
        <AppFormGroup>
          <AppCheckbox v-model="editingSettings.enablePhase3" label="Phase3 (耐圧試験) を実施する" />
        </AppFormGroup>
      </div>
      <template #footer>
        <AppButton variant="primary" @click="handleSaveSettings">設定を保存</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped lang="scss">
.c-admin-sites {
  &__stack {
    // --- レイアウト ---
    @include flex-column(var(--gap-section));
  }

  &__toolbar {
    // --- ボックスモデル ---
    margin-bottom: var(--gap-section);
  }

  &__desc {
    // --- 継承 ---
    @extend %text-desc;

    // --- ボックスモデル ---
    margin-bottom: var(--gap-component);
  }
  
  &__divider {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: var(--gap-section) 0;
  }
}
</style>
