/**
 * マスター帳票テンプレート管理 Composable
 *
 * @description システムマスターで管理される複数の帳票ひな形Excelファイルの登録・更新・削除・ダウンロードおよび現場割り当てを管理します。
 */

import { ref } from 'vue'

import { useNuxtApp } from '#app'
import type {
  MasterReportTemplateForm,
  MasterReportTemplateItem,
} from '#shared/types/reportTemplate'

export function useMasterTemplates() {
  const { $api } = useNuxtApp()
  const toast = useToast()

  const items = ref<MasterReportTemplateItem[]>([])
  const isLoading = ref(false)
  const isSaving = ref(false)
  const deletingId = ref<string | null>(null)
  const downloadingId = ref<string | null>(null)

  // 帳票テンプレート一覧の取得（siteId 指定で現場絞り込み可能）
  const fetchTemplates = async (siteId?: string) => {
    isLoading.value = true
    try {
      const res = await $api<MasterReportTemplateItem[] | { items: MasterReportTemplateItem[] }>('/api/master/templates', {
        query: siteId ? { siteId } : undefined,
      })

      if (Array.isArray(res)) {
        items.value = res
      }
      else if (Array.isArray(res?.items)) {
        items.value = res.items
      }
      else {
        items.value = []
      }
    }
    catch (err) {
      console.error('Failed to fetch master templates:', err)
      toast.error('帳票テンプレート一覧の取得に失敗しました')
    }
    finally {
      isLoading.value = false
    }
  }

  // 帳票テンプレートの保存（新規登録または更新）
  const saveTemplate = async (
    form: MasterReportTemplateForm,
    file?: File | null,
    templateId?: string,
  ): Promise<MasterReportTemplateItem | null> => {
    isSaving.value = true
    try {
      const formData = new FormData()

      if (templateId) {
        formData.append('id', templateId)
      }
      formData.append('name', form.name)
      formData.append('logicType', form.logicType)
      formData.append('logicFile', form.logicFile || '')
      formData.append('description', form.description || '')
      formData.append('isAllSites', String(form.isAllSites))
      formData.append('assignedSiteIds', JSON.stringify(form.assignedSiteIds || []))

      if (file) {
        formData.append('file', file)
      }

      const res = await $api<{ success: boolean, item?: MasterReportTemplateItem, template?: MasterReportTemplateItem }>('/api/master/templates', {
        method: 'POST',
        body: formData,
      })

      const savedItem = res?.item || res?.template

      if (savedItem) {
        const index = items.value.findIndex(it => it.id === savedItem.id)

        if (index >= 0) {
          items.value[index] = savedItem
        }
        else {
          items.value.unshift(savedItem)
        }

        toast.success(templateId ? `「${savedItem.name}」を更新しました` : `「${savedItem.name}」を登録しました`)

        return savedItem
      }

      return null
    }
    catch (err: unknown) {
      console.error('Failed to save master template:', err)
      const msg = (err as { data?: { message?: string } })?.data?.message || '帳票テンプレートの保存に失敗しました'

      toast.error(msg)

      return null
    }
    finally {
      isSaving.value = false
    }
  }

  // ひな形Excelのダウンロード
  const downloadTemplate = async (templateId: string, filename?: string) => {
    downloadingId.value = templateId
    try {
      const blob = await $api<Blob>(`/api/master/templates/${templateId}/download`, {
        responseType: 'blob',
      })

      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = downloadUrl
      a.download = filename || 'template.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(downloadUrl)

      toast.success('ひな形Excelをダウンロードしました')
    }
    catch (err) {
      console.error('Failed to download template:', err)
      toast.error('ひな形Excelのダウンロードに失敗しました')
    }
    finally {
      downloadingId.value = null
    }
  }

  // ひな形Excelのバイナリバッファを取得（帳票生成用）
  const fetchTemplateBuffer = async (templateId: string): Promise<ArrayBuffer | null> => {
    try {
      const blob = await $api<Blob>(`/api/master/templates/${templateId}/download`, {
        responseType: 'blob',
      })

      return await blob.arrayBuffer()
    }
    catch (err) {
      console.error('Failed to fetch template buffer:', err)
      toast.error('ひな形Excelの取得に失敗しました')

      return null
    }
  }

  // 帳票テンプレートの削除
  const deleteTemplate = async (templateId: string, templateName?: string) => {
    deletingId.value = templateId
    try {
      await $api(`/api/master/templates/${templateId}`, {
        method: 'DELETE',
      })

      items.value = items.value.filter(it => it.id !== templateId)
      toast.success(`「${templateName || '帳票テンプレート'}」を削除しました`)

      return true
    }
    catch (err) {
      console.error('Failed to delete template:', err)
      toast.error('帳票テンプレートの削除に失敗しました')

      return false
    }
    finally {
      deletingId.value = null
    }
  }

  return {
    items,
    isLoading,
    isSaving,
    deletingId,
    downloadingId,
    fetchTemplates,
    saveTemplate,
    downloadTemplate,
    fetchTemplateBuffer,
    deleteTemplate,
  }
}
