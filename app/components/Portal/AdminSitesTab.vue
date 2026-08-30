<script setup lang="ts">
/**
 * PortalAdminSitesTab
 * ポータル管理 - 現場管理タブ
 */
import { ref, computed } from "vue";
import { useAdminSites } from "~/composables/admin/useAdminSites";

import type { SiteStatus, Site } from "~/types/admin";

const { sites, createSite, toggleDisableSite, updateSite } =
  useAdminSites();

// --- 一覧定義 ---

const sortKey = ref('id');
const sortOrder = ref<'asc' | 'desc'>('asc');

const handleSort = (payload: { key: string; order: 'asc' | 'desc' }) => {
  sortKey.value = payload.key;
  sortOrder.value = payload.order;
};

const sortedSites = computed(() => {
  return [...sites.value].sort((a, b) => {
    const valA = a[sortKey.value as keyof typeof a];
    const valB = b[sortKey.value as keyof typeof b];
    
    if (valA === valB) return 0;
    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;
    
    const cmp = String(valA).localeCompare(String(valB));
    return sortOrder.value === 'asc' ? cmp : -cmp;
  });
});

const getStatusLabel = (status: unknown) => {
  switch (status) {
    case 'planning': return '計画中';
    case 'in_progress': return '進行中';
    case 'completed': return '完了';
    case 'on_hold': return '保留';
    default: return '不明';
  }
};

const getStatusColor = (status: unknown) => {
  switch (status) {
    case 'planning': return 'secondary';
    case 'in_progress': return 'warning';
    case 'completed': return 'success';
    case 'on_hold': return 'danger';
    default: return 'secondary';
  }
};

const siteHeaders = [
  { key: "id", label: "現場ID", sortable: true },
  { key: "name", label: "現場名", sortable: true },
  { key: "status", label: "ステータス", sortable: true },
  { key: "createdAt", label: "作成日時" },
  { key: "disabledAt", label: "無効化日時" },
  { key: "actions", label: "操作" },
];

const formatDate = (isoString: unknown) => {
  if (typeof isoString !== "string") return "-";
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString();
};

// --- 新規登録モーダル ---
const isCreateModalOpen = ref(false);
const newSite = ref({
  id: "",
  name: "",
  status: "planning" as SiteStatus,
});

const handleCreateSite = async () => {
  if (!newSite.value.id || !newSite.value.name) {
    throw new Error("現場IDと現場名を入力してください。");
  }
  await createSite({ ...newSite.value });
  isCreateModalOpen.value = false;
  newSite.value = { id: "", name: "", status: "planning" };
};

// --- 無効化/有効化モーダル ---
const isConfirmDisableOpen = ref(false);
const siteToToggle = ref<Site | null>(null);

const confirmToggleDisable = (row: Site) => {
  siteToToggle.value = row;
  isConfirmDisableOpen.value = true;
};

const handleToggleDisable = async () => {
  if (siteToToggle.value) {
    await toggleDisableSite(siteToToggle.value.id);
  }
  isConfirmDisableOpen.value = false;
  siteToToggle.value = null;
};

// --- 現場設定モーダル (新) ---
  const isSettingsModalOpen = ref(false);
  const settingsTargetSite = ref<Site | null>(null);

  const openSettingsModal = (siteId: string) => {
    const site = sites.value.find(s => s.id === siteId);
    if (site) {
      settingsTargetSite.value = { ...site };
      isSettingsModalOpen.value = true;
    }
  };

  const handleSaveSettings = async (updatedSite: Site) => {
  if (settingsTargetSite.value) {
    const originalId = settingsTargetSite.value.id;
    await updateSite(originalId, updatedSite);
  }
  isSettingsModalOpen.value = false;
};

  const confirmMessage = computed(() => {
  if (siteToToggle.value?.disabledAt) {
    return (
      "現場「" +
      siteToToggle.value.name +
      "」へのアクセスを再度有効にしますか？"
    );
  }
  return (
    "現場「" +
    (siteToToggle.value?.name || "") +
    "」を無効化しますか？ 無効になると現場へのアクセスができなくなります。"
  );
});

const confirmTitle = computed(() => {
  return siteToToggle.value?.disabledAt ? "現場の有効化" : "現場の無効化";
});

const confirmBtnText = computed(() => {
  return siteToToggle.value?.disabledAt ? "有効化する" : "無効化する";
});

const confirmIntent = computed(() => {
  return siteToToggle.value?.disabledAt ? "success" : "danger";
});
</script>

<template>
  <div class="c-admin-sites">
    <AppPanel title="現場プロジェクト一覧">
      <div class="c-admin-sites__stack">
        <div class="c-admin-sites__toolbar">
          <AppButton
            variant="primary"
            icon="plus"
            @click="isCreateModalOpen = true"
          >
            新規現場登録
          </AppButton>
        </div>

        <AppTable 
          :columns="siteHeaders" 
          :data="sortedSites"
          :sort-by="sortKey"
          :sort-order="sortOrder"
          @sort="handleSort"
        >
          <template #cell-status="{ value, row }">
            <div class="c-admin-sites__status-stack">
              <AppBadge :color="getStatusColor(value)">
                {{ getStatusLabel(value) }}
              </AppBadge>
              <AppBadge
                v-if="row.disabledAt"
                color="danger"
                size="sm"
              >
                無効
              </AppBadge>
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
              <AppButton
                variant="secondary"
                size="sm"
                icon="settings"
                @click="openSettingsModal(String(row.id))"
              >
                現場設定
              </AppButton>
              <AppButton
                :variant="row.disabledAt ? 'success' : 'danger'"
                size="sm"
                @click="confirmToggleDisable(row)"
              >
                {{ row.disabledAt ? "有効化" : "無効化" }}
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
      submit-text="登録する"
    >
      <AppFormGroup label="現場ID (半角英数)">
        <AppInput
          v-model="newSite.id"
          placeholder="例: site-tokyo-01"
        />
      </AppFormGroup>
      <AppFormGroup label="現場名">
        <AppInput
          v-model="newSite.name"
          placeholder="例: 新宿プロジェクト"
        />
      </AppFormGroup>
    </AppFormModal>

    

    <!-- 現場設定モーダル (新) -->
    <SiteSettingsModal
      v-model="isSettingsModalOpen"
      :site="settingsTargetSite"
      @update:site="handleSaveSettings"
    />

    <!-- 無効化/有効化の確認モーダル -->
    <AppConfirmModal
      v-model="isConfirmDisableOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmBtnText"
      :intent="confirmIntent"
      @confirm="handleToggleDisable"
    />
  </div>
</template>

<style scoped lang="scss">
.c-admin-sites {
  &__toolbar {
      display: flex;
      justify-content: flex-end;
    }
    
    &__stack {
    @include flex-column(var(--space-card-gap));
  }

  &__status-stack {
    @include flex-column(var(--space-1));
  }

  &__actions {
    @include flex-start(var(--space-inline-gap));
  }
}
</style>
