<script setup lang="ts">
/**
 * TabAdminSites
 * [Portal Organisms] ポータル管理 - 現場管理（PC管理コンソール型 2ペインレイアウト）
 * 左ペイン（現場一覧・検索・新規登録）と右ペイン（現場詳細設定）を常時展開します。
 */
import { useAdminSitesTab } from '~/composables/admin/useAdminSitesTab'

const {
  sites,
  selectedSiteId,
  selectedSite,
  handleSelectSite,
  isSaving,
  handleSaveSite,
  isCreateModalOpen,
  isCreatingSite,
  newSite,
  fieldErrors,
  openCreateModal,
  handleCreateSite,
  confirmToggleDisable,
} = useAdminSitesTab()
</script>

<template>
  <Panel>
    <div class="flex flex-col lg:flex-row gap-6 items-start">

      <div class="w-full lg:w-[340px] shrink-0">
        <PortalMasterSiteList
          :sites="sites"
          :selected-site-id="selectedSiteId"
          @select="handleSelectSite"
          @create="openCreateModal"
          @toggle-disable="confirmToggleDisable"
        />
      </div>

      <Divider
        orientation="vertical"
        class="hidden lg:block self-stretch"
      />

      <div class="flex-1 min-w-0 w-full">
        <PortalDetailSiteSettings
          :site="selectedSite"
          :is-saving="isSaving"
          @save="handleSaveSite"
        />
      </div>
    </div>

    <Modal
      v-model="isCreateModalOpen"
      title="新規現場登録"
      icon="plus-circle"
    >
      <template #actions>
        <Button @click="isCreateModalOpen = false">
          キャンセル
        </Button>
        <Button
          variant="success"
          :loading="isCreatingSite"
          @click="handleCreateSite"
        >
          登録する
        </Button>
      </template>

      <div class="flex flex-col gap-4">
        <FormGroup label="現場ID (半角英数)" :error="fieldErrors.id">
          <Input v-model="newSite.id" placeholder="例: site-tokyo-01" />
        </FormGroup>
        <FormGroup label="現場名" :error="fieldErrors.name">
          <Input v-model="newSite.name" placeholder="例: 新宿プロジェクト" />
        </FormGroup>
      </div>
    </Modal>
  </Panel>
</template>
