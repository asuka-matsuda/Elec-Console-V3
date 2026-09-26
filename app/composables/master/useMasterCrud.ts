/**
 * システムマスター管理 CRUD オーケストレーション Composable
 *
 * @description マスター管理（改行禁止ワード・お知らせ・更新履歴等）における
 * 一覧取得、モーダル状態管理、バリデーション、保存（POST/PUT）、削除確認フローを一元化します。
 */

import { ref } from 'vue'

import { useApi } from '~/composables/useApi'
import { useFormValidation } from '~/composables/useFormValidation'
import { useModal } from '~/composables/useModal'
import { parseToAppException } from '~/utils/errors'

interface UseMasterCrudOptions<T extends { id?: string | number }, F extends object> {
  /** APIエンドポイント（ベースパス）例: '/api/master/word-break' */
  endpoint: string
  /** フォームの初期値 */
  initialForm: F
  /** バリデーションルール定義（必須項目のラベル名マッピング） */
  validationRules?: Partial<Record<keyof F, string>>
  /** アイテムからフォームへの変換関数（未指定時は展開コピー） */
  mapItemToForm?: (item: T) => F
  /** フォームからAPIペイロードへの変換関数（未指定時は展開コピー） */
  mapFormToPayload?: (form: F) => Record<string, unknown>
  /** 新規作成時の日付等デフォルト設定（未指定時は getTodayDateInput() を適用） */
  getNewFormDefaults?: () => Partial<F>
  /** 削除確認ダイアログ設定 */
  deleteConfirm: {
    title: string
    message: (item: T) => string
  }
  /** 保存完了後の追加コールバック（キャッシュ破棄など） */
  onAfterSave?: () => Promise<void> | void
  /** 削除完了後の追加コールバック（キャッシュ破棄など） */
  onAfterDelete?: () => Promise<void> | void
}

export async function useMasterCrud<T extends { id?: string | number }, F extends object>(
  options: UseMasterCrudOptions<T, F>,
) {
  const {
    endpoint,
    initialForm,
    validationRules = {},
    mapItemToForm,
    mapFormToPayload,
    getNewFormDefaults,
    deleteConfirm,
    onAfterSave,
    onAfterDelete,
  } = options

  const { $api } = useApi()
  const { askConfirm } = useModal()

  // 一覧取得（$api による認証・共通エラーハンドリングを適用）
  const { data: items, pending, refresh } = await useFetch<T[]>(endpoint, {
    default: () => [],
    $fetch: $api,
  })

  // モーダル・フォーム状態
  const isEditModalOpen = ref(false)
  const isSaving = ref(false)
  const editingId = ref<string | null>(null)
  const formError = ref('')
  const form = ref<F>({ ...initialForm } as F)

  // フォームバリデーション
  const { fieldErrors, validate, resetErrors } = useFormValidation(
    form,
    validationRules as Record<string, string>,
  )

  const openModal = (item?: T) => {
    editingId.value = item ? String(item.id) : null
    formError.value = ''
    resetErrors()

    if (item) {
      form.value = mapItemToForm ? mapItemToForm(item) : ({ ...item } as unknown as F)
    }
    else {
      const defaults = getNewFormDefaults ? getNewFormDefaults() : {}

      form.value = {
        ...initialForm,
        ...(defaults as object),
      } as F
    }

    isEditModalOpen.value = true
  }

  const closeModal = () => {
    isEditModalOpen.value = false
    formError.value = ''
    resetErrors()
  }

  const handleSave = async () => {
    formError.value = ''
    if (!validate()) return

    isSaving.value = true

    try {
      const url = editingId.value ? `${endpoint}/${editingId.value}` : endpoint
      const method = editingId.value ? 'PUT' : 'POST'
      const payload = mapFormToPayload ? mapFormToPayload(form.value) : form.value

      await $api(url, {
        method,
        body: payload,
      })

      isEditModalOpen.value = false
      await refresh()
      if (onAfterSave) {
        await onAfterSave()
      }
    }
    catch (e: unknown) {
      const appErr = parseToAppException(e)

      formError.value = appErr.getUserFacingMessage()
    }
    finally {
      isSaving.value = false
    }
  }

  const handleDelete = async (target: T | string | number) => {
    let item: T | undefined
    let id: string | number

    if (typeof target === 'object' && target !== null && 'id' in target) {
      if (target.id == null) return
      item = target as T
      id = target.id
    }
    else {
      id = target as string | number
      item = items.value.find(i => String(i.id) === String(id))
    }

    if (!id || !item) return

    const isConfirmed = await askConfirm({
      title: deleteConfirm.title,
      message: deleteConfirm.message(item),
      intent: 'danger',
      confirmText: '削除する',
    })

    if (!isConfirmed) return

    try {
      await $api(`${endpoint}/${id}`, {
        method: 'DELETE',
      })
      await refresh()
      if (onAfterDelete) {
        await onAfterDelete()
      }
    }
    catch (e: unknown) {
      const appErr = parseToAppException(e)

      alert(appErr.getUserFacingMessage())
    }
  }

  return {
    items,
    pending,
    refresh,
    isEditModalOpen,
    isSaving,
    editingId,
    formError,
    form,
    fieldErrors,
    openModal,
    closeModal,
    handleSave,
    handleDelete,
  }
}
