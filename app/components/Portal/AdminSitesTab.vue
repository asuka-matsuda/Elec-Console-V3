<script setup lang="ts">
/**
 * PortalAdminSitesTab
 * ポータル管理 - 現場管理タブ
 */
import { ref } from "vue";
import { useAdminSites } from "~/composables/admin/useAdminSites";

import type { SiteStatus, Site } from "~/types/admin";

const { sites, createSite, toggleDisableSite, updateSite } =
  useAdminSites();

// --- 一覧定義 ---

const siteHeaders: TableColumn<Site>[] = [
  { key: "id", label: "現場ID", sortable: true },
  { key: "name", label: "現場名", sortable: true },
  { key: "status", label: "ステータス", sortable: true },
  { key: "createdAt", label: "作成日時", sortable: true },
  { key: "disabledAt", label: "無効化日時", sortable: true },
  { key: "actions", label: "操作" },
];

const {
  sortBy: sortKey,
  sortOrder,
  sortedData: sortedSites,
  handleSort,
} = useTableSort(sites, {
  defaultKey: "id",
  defaultOrder: "asc",
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
const {
  isOpen: isConfirmDisableOpen,
  title: confirmTitle,
  message: confirmMessage,
  confirmText: confirmBtnText,
  intent: confirmIntent,
  askConfirm,
  handleConfirm: handleToggleDisable,
} = useConfirmModal();

const confirmToggleDisable = (row: Site) => {
  const isCurrentlyDisabled = !!row.disabledAt;
  askConfirm({
    title: isCurrentlyDisabled ? "現場の有効化" : "現場の無効化",
    message: isCurrentlyDisabled
      ? `現場「${row.name}」へのアクセスを再度有効にしますか？`
      : `現場「${row.name}」を無効化しますか？ 無効になると現場へのアクセスができなくなります。`,
    confirmText: isCurrentlyDisabled ? "有効化する" : "無効化する",
    intent: isCurrentlyDisabled ? "success" : "danger",
    onConfirm: async () => {
      await toggleDisableSite(row.id);
    },
  });
};

// --- 現場設定モーダル (新) ---
const isSettingsModalOpen = ref(false);
const settingsTargetSite = ref<Site | null>(null);

const openSettingsModal = (siteId: string) => {
  const site = sites.value.find((s) => s.id === siteId);
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
            {{ formatDateTime(value) }}
          </template>
          <template #cell-disabledAt="{ value }">
            {{ formatDateTime(value) }}
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
    @include flex-end;
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
