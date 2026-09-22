/**
 * ポータル管理 - 現場管理タブ（2ペインレイアウト）オーケストレーション Composable
 *
 * @description 現場一覧の選択状態同期、新規現場登録モーダル、
 * 現場保存、有効化/無効化確認ダイアログフローを一元管理します。
 */

import { computed, onMounted, ref, watch } from 'vue'

import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useModal } from '~/composables/useModal'
import type { Site, SiteStatus } from '~/types/admin'
import { parseToAppException } from '~/utils/errors'

export interface CreateSiteFormState {
  id: string
  name: string
  status: SiteStatus
}

export const INITIAL_CREATE_SITE: CreateSiteFormState = {
  id: '',
  name: '',
  status: 'planning',
}

export function useAdminSitesTab() {
  const { sites, fetchSites, createSite, toggleDisableSite, updateSite } = useAdminSites()
  const { askConfirm } = useModal()

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
  const newSite = ref<CreateSiteFormState>({ ...INITIAL_CREATE_SITE })
  const fieldErrors = ref({ id: '', name: '' })

  const openCreateModal = () => {
    fieldErrors.value = { id: '', name: '' }
    newSite.value = { ...INITIAL_CREATE_SITE }
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
      newSite.value = { ...INITIAL_CREATE_SITE }
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

  return {
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
  }
}
