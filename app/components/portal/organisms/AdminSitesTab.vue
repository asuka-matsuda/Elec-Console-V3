<script setup lang="ts">
/**
 * AdminSitesTab
 * [Portal Organisms] ポータル管理 - 現場管理（PC管理コンソール型 2ペインレイアウト）
 * 左ペイン（現場一覧・検索・新規登録）と右ペイン（現場詳細設定）を常時展開します。
 */
import { computed, onMounted, ref, watch } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useModal } from '~/composables/useModal'
import type { Site, SiteStatus } from '~/types/admin'
import { parseToAppException } from '~/utils/errors'

const { sites, fetchSites, createSite, toggleDisableSite, updateSite } = useAdminSites()

onMounted(async () => {
  if (sites.value.length === 0) {
    await fetchSites()
  }
})

// --- 選択中の現場管理 ---
const selectedSiteId = ref<string | null>(null)

// sitesが更新されたら先頭を選択、または存在しないIDをクリア
watch(
  sites,
  (loadedSites) => {
    if (loadedSites.length > 0) {
      if (!selectedSiteId.value || !loadedSites.some(s => s.id === selectedSiteId.value)) {
        selectedSiteId.value = loadedSites[0]?.id || null
      }
    }
    else {
      selectedSiteId.value = null
    }
  },
  { immediate: true },
)

const selectedSite = computed<Site | null>(() => {
  if (!selectedSiteId.value) return null

  return sites.value.find(s => s.id === selectedSiteId.value) || null
})

const handleSelectSite = (site: Site) => {
  selectedSiteId.value = site.id
}

// --- 現場情報の保存 ---
const isSaving = ref(false)

const handleSaveSite = async (payload: Site) => {
  if (!selectedSite.value) return

  isSaving.value = true
  try {
    const originalId = selectedSite.value.id

    await updateSite(originalId, payload)
    if (payload.id && payload.id !== originalId) {
      selectedSiteId.value = payload.id
    }
  }
  catch (e: unknown) {
    const appErr = parseToAppException(e)

    alert(appErr.getUserFacingMessage())
  }
  finally {
    isSaving.value = false
  }
}

// --- 新規登録モーダル ---
const isCreateModalOpen = ref(false)
const isCreatingSite = ref(false)

const INITIAL_NEW_SITE = {
  id: '',
  name: '',
  status: 'planning' as SiteStatus,
}
const newSite = ref({ ...INITIAL_NEW_SITE })
const fieldErrors = ref({ id: '', name: '' })

const openCreateModal = () => {
  fieldErrors.value = { id: '', name: '' }
  newSite.value = { ...INITIAL_NEW_SITE }
  isCreateModalOpen.value = true
}

const handleCreateSite = async () => {
  fieldErrors.value = { id: '', name: '' }
  const id = newSite.value.id.trim()
  const name = newSite.value.name.trim()

  let hasError = false

  if (!id) {
    fieldErrors.value.id = '現場IDを入力してください。'
    hasError = true
  }
  if (!name) {
    fieldErrors.value.name = '現場名を入力してください。'
    hasError = true
  }
  if (hasError) return

  try {
    isCreatingSite.value = true
    await createSite({ id, name, status: newSite.value.status })
    selectedSiteId.value = id
    isCreateModalOpen.value = false
    newSite.value = { ...INITIAL_NEW_SITE }
  }
  catch (e: unknown) {
    const appErr = parseToAppException(e)

    fieldErrors.value.name = appErr.getUserFacingMessage()
  }
  finally {
    isCreatingSite.value = false
  }
}

// --- 有効化・無効化確認モーダル ---
const { askConfirm } = useModal()

const confirmToggleDisable = async (row: Site) => {
  const isCurrentlyDisabled = !!row.disabledAt

  const isConfirmed = await askConfirm({
    title: isCurrentlyDisabled ? '現場の有効化' : '現場の無効化',
    message: isCurrentlyDisabled
      ? `現場「${row.name}」へのアクセスを再度有効にしますか？`
      : `現場「${row.name}」を無効化しますか？ 無効になると現場へのアクセスができなくなります。`,
    confirmText: isCurrentlyDisabled ? '有効化する' : '無効化する',
    intent: isCurrentlyDisabled ? 'success' : 'danger',
  })

  if (isConfirmed) {
    await toggleDisableSite(row.id)
  }
}
</script>

<template>
  <Panel>
    <div class="flex flex-col lg:flex-row gap-6 items-start">
      <!-- 左ペイン: Master (幅約340px) -->
      <div class="w-full lg:w-[340px] shrink-0">
        <PortalSiteListMaster
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

      <!-- 右ペイン: Detail (残りワイド領域) -->
      <div class="flex-1 min-w-0 w-full">
        <PortalSiteSettingsDetail
          :site="selectedSite"
          :is-saving="isSaving"
          @save="handleSaveSite"
        />
      </div>
    </div>

    <!-- 新規登録モーダル (中央ダイアログ) -->
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
