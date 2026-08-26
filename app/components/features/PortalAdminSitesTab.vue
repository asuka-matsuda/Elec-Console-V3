<script setup lang="ts">
/**
 * PortalAdminSitesTab
 * ポータル管理 - 現場管理タブ
 */
import { ref, computed } from 'vue';
import { useAdminSites } from '~/composables/admin/useAdminSites';
import type { SiteStatus, SiteSettings, Site } from '~/types/admin';

const { sites, createSite, getSettings, updateSettings, toggleDisableSite } = useAdminSites();

// --- 一覧定義 ---
const siteHeaders = [
  { key: 'id', label: '現場ID' },
  { key: 'name', label: '現場名' },
  { key: 'status', label: 'ステータス' },
  { key: 'createdAt', label: '作成日時' },
  { key: 'disabledAt', label: '無効化日時' },
  { key: 'actions', label: '操作' },
];

const formatDate = (isoString: any) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString();
};

// --- 新規登録モーダル ---
const isCreateModalOpen = ref(false);
const newSite = ref({
  id: '',
  name: '',
  status: 'planning' as SiteStatus,
});

const handleCreateSite = async () => {
  if (!newSite.value.id || !newSite.value.name) {
    throw new Error('現場IDと現場名を入力してください。');
  }
  createSite({ ...newSite.value });
  isCreateModalOpen.value = false;
  newSite.value = { id: '', name: '', status: 'planning' };
};

// --- 無効化/有効化モーダル ---
const isConfirmDisableOpen = ref(false);
const siteToToggle = ref<Site | null>(null);

const confirmToggleDisable = (row: any) => {
  siteToToggle.value = row;
  isConfirmDisableOpen.value = true;
};

const handleToggleDisable = async () => {
  if (siteToToggle.value) {
    toggleDisableSite(siteToToggle.value.id);
  }
  isConfirmDisableOpen.value = false;
  siteToToggle.value = null;
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

const handleSaveSettings = async () => {
  updateSettings(settingsTargetSiteId.value, editingSettings.value);
  isSettingsModalOpen.value = false;
};

const confirmMessage = computed(() => {
  if (siteToToggle.value?.disabledAt) {
    return "現場「" + siteToToggle.value.name + "」へのアクセスを再度有効にしますか？";
  }
  return "現場「" + (siteToToggle.value?.name || "") + "」を無効化しますか？ 無効になると現場へのアクセスができなくなります。";
});

const confirmTitle = computed(() => {
  return siteToToggle.value?.disabledAt ? '現場の有効化' : '現場の無効化';
});

const confirmBtnText = computed(() => {
  return siteToToggle.value?.disabledAt ? '有効化する' : '無効化する';
});

const confirmIntent = computed(() => {
  return siteToToggle.value?.disabledAt ? 'success' : 'danger';
});
</script>

<template>
  <div class="c-admin-sites">
    <AppPanel title="現場プロジェクト一覧">
      <div class="c-admin-sites__stack">
        <div class="c-admin-sites__toolbar">
          <AppButton variant="primary" icon="plus" @click="isCreateModalOpen = true">新規現場登録</AppButton>
        </div>

        <AppTable :columns="siteHeaders" :data="sites as any">
          <template #cell-status="{ value, row }">
            <div class="c-admin-sites__status-stack">
              <AppBadge :variant="value === 'in_progress' ? 'success' : value === 'completed' ? 'neutral' : 'warning'">
                {{ value === 'planning' ? '計画中' : value === 'in_progress' ? '進行中' : '完了' }}
              </AppBadge>
              <AppBadge v-if="row.disabledAt" variant="danger" size="sm">無効</AppBadge>
            </div>
          </template>
          <template #cell-createdAt="{ value }">
            {{ formatDate(value) }}
          </template>
          <template #cell-disabledAt="{ value }">
            {{ formatDate(value) }}
          </template>
          <template #cell-actions="{ row }">
            <div class="c-admin-sites__actions">
              <AppButton variant="secondary" size="sm" icon="settings" @click="openSettingsModal(row.id as any)">現場設定</AppButton>
              <AppButton 
                :variant="row.disabledAt ? 'success' : 'danger'" 
                size="sm" 
                @click="confirmToggleDisable(row)"
              >
                {{ row.disabledAt ? '有効化' : '無効化' }}
              </AppButton>
            </div>
          </template>
        </AppTable>
      </div>
    </AppPanel>

    <!-- 新規登録モーダル -->
    <AppFormModal 
      v-model="isCreateModalOpen" 
      title="新規現場プロジェクト登録"
      :submit-fn="handleCreateSite"
      submitText="登録する"
    >
      <AppFormGroup label="現場ID (半角英数)">
        <AppInput v-model="newSite.id" placeholder="例: site-tokyo-01" />
      </AppFormGroup>
      <AppFormGroup label="現場名">
        <AppInput v-model="newSite.name" placeholder="例: 新宿プロジェクト" />
      </AppFormGroup>
    </AppFormModal>

    <!-- 詳細設定モーダル -->
    <AppFormModal 
      v-model="isSettingsModalOpen" 
      title="現場詳細設定"
      :submit-fn="handleSaveSettings"
      submitText="設定を保存"
    >
      <AppFormGroup label="Phase2 絶縁抵抗基準値 (MΩ)">
        <AppInput v-model.number="editingSettings.phase2ThresholdMegOhm" type="number" step="0.1" />
      </AppFormGroup>
      <AppFormGroup>
        <AppCheckbox v-model="editingSettings.enablePhase3" label="Phase3 (耐圧試験) を実施する" />
      </AppFormGroup>
    </AppFormModal>

    <!-- 無効化/有効化の確認モーダル -->
    <AppConfirmModal
      v-model="isConfirmDisableOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirmText="confirmBtnText"
      :intent="confirmIntent"
      @confirm="handleToggleDisable"
    />
  </div>
</template>

<style scoped lang="scss">
.c-admin-sites {
  &__stack {
    @include flex-column(var(--gap-section));
  }

  &__toolbar {
  }

  &__status-stack {
    @include flex-column(var(--gap-element));
  }

  &__actions {
    @include flex-start(var(--gap-component));
  }
}
</style>
