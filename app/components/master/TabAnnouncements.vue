<script setup lang="ts">
/**
 * MasterTabAnnouncements
 * [Master Organisms] お知らせ管理タブ。
 * システム全体のお知らせの追加・一覧・編集・削除を行います。
 */
import { useMasterCrud } from '~/composables/master/useMasterCrud'
import type { AnnouncementItem, TableColumn } from '~/types/components'
import { getTodayDateInput } from '~/utils/date'

interface AnnouncementForm {
  title: string
  date: string
  desc: string
}

const {
  items: announcements,
  pending,
  isEditModalOpen,
  isSaving,
  editingId,
  formError,
  form,
  fieldErrors,
  openModal,
  handleSave,
  handleDelete,
} = await useMasterCrud<AnnouncementItem, AnnouncementForm>({
  endpoint: '/api/master/announcements',
  initialForm: { title: '', date: '', desc: '' },
  validationRules: { date: '日付', title: 'タイトル' },
  mapItemToForm: item => ({
    title: item.title,
    date: item.date.replace(/\./g, '-'),
    desc: item.desc || '',
  }),
  mapFormToPayload: form => ({
    ...form,
    date: form.date.replace(/-/g, '.'),
  }),
  getNewFormDefaults: () => ({ date: getTodayDateInput() }),
  deleteConfirm: {
    title: 'お知らせの削除',
    message: () => 'このお知らせを削除してもよろしいですか？',
  },
})

const columns: TableColumn<AnnouncementItem>[] = [
  { key: 'date', label: '日付', width: '130px' },
  { key: 'title', label: 'タイトル' },
  { key: 'desc', label: '内容詳細', truncate: true },
  { key: 'actions', label: '操作', width: '120px', align: 'right' },
]
</script>

<template>
  <MasterCrudLayout
    v-model:is-modal-open="isEditModalOpen"
    description="ダッシュボードの「お知らせ」ウィジェットに掲載される情報を管理します。"
    create-button-text="新規お知らせ作成"
    :columns="columns"
    :data="announcements"
    :loading="pending"
    empty-text="登録されているお知らせはありません。"
    :modal-title="editingId ? '編集' : '新規作成'"
    modal-icon="bell"
    :is-saving="isSaving"
    :form-error="formError"
    @create="openModal()"
    @edit="openModal($event)"
    @delete="handleDelete($event)"
    @save="handleSave"
  >
    <FormGroup
      label="日付"
      required
      :error="fieldErrors.date"
    >
      <Input
        v-model="form.date"
        type="date"
      />
    </FormGroup>

    <FormGroup
      label="タイトル"
      required
      :error="fieldErrors.title"
    >
      <Input
        v-model="form.title"
        placeholder="例: システムメンテナンスのお知らせ"
      />
    </FormGroup>

    <FormGroup label="詳細本文">
      <Textarea
        v-model="form.desc"
        :rows="5"
        placeholder="詳細な説明や補足を入力してください（モーダルで表示されます）"
      />
    </FormGroup>
  </MasterCrudLayout>
</template>
