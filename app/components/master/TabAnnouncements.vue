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
  <div class="flex flex-col gap-panel-gap">

    <div class="flex flex-wrap items-center justify-between gap-4">
      <small>
        ダッシュボードの「お知らせ」ウィジェットに掲載される情報を管理します。
      </small>

      <Button
        variant="success"
        icon="plus"
        @click="openModal()"
      >
        新規お知らせ作成
      </Button>
    </div>

    <Panel padding="none">
      <Table
        :columns="columns"
        :data="announcements"
        :loading="pending"
        empty-text="登録されているお知らせはありません。"
      >
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <Button
              icon="edit"
              title="編集"
              @click="openModal(row)"
            />
            <Button
              variant="danger"
              icon="trash-2"
              title="削除"
              @click="handleDelete(row)"
            />
          </div>
        </template>
      </Table>
    </Panel>

    <Modal
      v-model="isEditModalOpen"
      :title="editingId ? '編集' : '新規作成'"
      icon="bell"
    >
      <template #actions>
        <Button
          :disabled="isSaving"
          @click="isEditModalOpen = false"
        >
          キャンセル
        </Button>
        <Button
          variant="success"
          icon="check"
          type="submit"
          form="announcement-form"
          :loading="isSaving"
          @click="handleSave"
        >
          {{ isSaving ? '保存中...' : '保存する' }}
        </Button>
      </template>

      <form
        id="announcement-form"
        class="flex flex-col gap-4"
        @submit.prevent="handleSave"
      >
        <FormGroup v-if="formError" :error="formError" />

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
      </form>
    </Modal>
  </div>
</template>
