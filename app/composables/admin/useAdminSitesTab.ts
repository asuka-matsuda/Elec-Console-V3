/**
 * ポータル管理 - 現場管理タブ（2ペインレイアウト）オーケストレーション Composable
 *
 * @description 現場一覧の選択状態同期、新規現場登録モーダル、
 * 現場保存、有効化/無効化確認ダイアログフロー、および現場削除フローを一元管理します。
 */

import { computed, onMounted, ref, watch } from 'vue'

import type { Site, SiteStatus } from '#shared/types/site'
import { useAdminSites } from '~/composables/admin/useAdminSites'
import { useModal } from '~/composables/useModal'
import { parseToAppException } from '~/utils/errors'

interface CreateSiteFormState {
  id: string
  name: string
  status: SiteStatus
}

const INITIAL_CREATE_SITE: CreateSiteFormState = {
  id: '',
  name: '',
  status: 'planning',
}

export function useAdminSitesTab() {
  const { sites, isLoaded, fetchSites, createSite, toggleDisableSite, updateSite, deleteSite } = useAdminSites()
  const { askConfirm } = useModal()

  // --- 状態宣言（State） ---
  const selectedSiteId = ref<string | null>(null)
  const isSaving = ref(false)
  const isCreateModalOpen = ref(false)
  const isCreatingSite = ref(false)
  const newSite = ref<CreateSiteFormState>({ ...INITIAL_CREATE_SITE })
  const fieldErrors = ref({ id: '', name: '' })
  const isDeletingSite = ref(false)

  // --- 派生状態（Computed） ---
  const selectedSite = computed<Site | null>(() => {
    if (!selectedSiteId.value) return null

    return sites.value.find(s => s.id === selectedSiteId.value) || null
  })

  // --- 監視（Watch） ---
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

  // --- ライフサイクル（Lifecycle） ---
  onMounted(async () => {
    if (!isLoaded?.value) {
      await fetchSites()
    }
  })

  // --- アクションハンドラ（Actions / Methods） ---
  const handleSelectSite = (site: Site) => {
    selectedSiteId.value = site.id
  }

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

  const confirmDeleteSite = async (site: Site) => {
    const isConfirmed = await askConfirm({
      title: '現場の完全削除（全データ消去）',
      message: `【警告】現場「${site.name}」(ID: ${site.id}) を完全に削除しますか？\n\n現場に紐づくすべての回路データ・試験測定記録・工程カレンダーなどの全データが完全に消去されます。元に戻すことはできませんが、本当によろしいですか？`,
      confirmText: 'すべて消去して削除する',
      intent: 'danger',
    })

    if (isConfirmed) {
      isDeletingSite.value = true
      try {
        await deleteSite(site.id)
        if (selectedSiteId.value === site.id) {
          const remaining = sites.value.filter(s => s.id !== site.id)

          selectedSiteId.value = remaining[0]?.id || null
        }
      }
      catch (e: unknown) {
        const appErr = parseToAppException(e)

        alert(appErr.getUserFacingMessage())
      }
      finally {
        isDeletingSite.value = false
      }
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
    isDeletingSite,
    confirmDeleteSite,
  }
}
