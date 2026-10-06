<script setup lang="ts">
/**
 * TabAnnouncements
 * [Master Organisms] お知らせ管理タブ。
 * システム全体のお知らせの追加・一覧・編集・削除を行います。
 */
import type { AnnouncementItem } from '#shared/types/master'
import { useMasterCrud } from '~/composables/master/useMasterCrud'
import type { TableColumn } from '~/types/components'
import { formatDate, formatToDateInputString, getTodayDateInput } from '~/utils/date'

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
    date: formatToDateInputString(item.date),
    desc: item.desc || '',
  }),
  mapFormToPayload: form => ({
    ...form,
  }),
  getNewFormDefaults: () => ({ date: getTodayDateInput() }),
  deleteConfirm: {
    title: 'お知らせの削除',
    message: () => 'このお知らせを削除してもよろしいですか？',
  },
})

const columns: TableColumn<AnnouncementItem>[] = [
  { key: 'date', label: '日付', width: '130px', format: val => formatDate(val) },
  { key: 'title', label: 'タイトル' },
  { key: 'desc', label: '内容詳細', truncate: true },
  { key: 'actions', label: '操作', width: '120px', align: 'right' },
]
</script>

<template>
  <section class="flex flex-col gap-panel-gap">
    <header class="flex flex-wrap items-center justify-between gap-panel-gap">
      <small>ダッシュボードの「お知らせ」ウィジェットに掲載される情報を管理します。</small>

      <Button variant="primary" size="sm" icon="plus" @click="openModal()">お知らせを作成する</Button>
    </header>

    <Table :columns="columns" :data="announcements" :loading="pending" empty-text="登録されているお知らせはありません。">
      <template #cell-actions="{ row }">
        <div class="flex items-center justify-end">
          <Menu :items="[{ label: 'お知らせを編集…', icon: 'edit', action: () => openModal(row) }, { label: 'お知らせを削除', icon: 'trash-2', variant: 'danger', divider: true, action: () => handleDelete(row) }]" />
        </div>
      </template>
    </Table>

    <Modal v-model="isEditModalOpen" :title="editingId ? '編集' : '新規作成'" icon="bell">
      <template #actions>
        <Button :disabled="isSaving" @click="isEditModalOpen = false">キャンセル</Button>
        <Button variant="primary" :loading="isSaving" @click="handleSave">保存する</Button>
      </template>

      <form class="flex flex-col gap-form-row-gap" @submit.prevent="handleSave">
        <Note v-if="formError" variant="error">{{ formError }}</Note>

        <div class="flex flex-col gap-inline-gap">
          <label for="announcement-date" class="label">日付 <span class="req-mark">＊</span></label>
          <Input id="announcement-date" v-model="form.date" type="date" />
          <p v-if="fieldErrors.date" class="error-text">
            {{ fieldErrors.date }}
          </p>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="announcement-title" class="label">タイトル <span class="req-mark">＊</span></label>
          <Input id="announcement-title" v-model="form.title" placeholder="例: システムメンテナンスのお知らせ" />
          <p v-if="fieldErrors.title" class="error-text">
            {{ fieldErrors.title }}
          </p>
        </div>

        <div class="flex flex-col gap-inline-gap">
          <label for="announcement-desc" class="label">詳細本文</label>
          <Textarea id="announcement-desc" v-model="form.desc" :rows="5" trim placeholder="例: 来週月曜日に定期メンテナンスを実施します。" />
        </div>
      </form>
    </Modal>
  </section>
</template>

<style scoped lang="scss">
.error-text {
  font-size: var(--font-size-xs);
  color: var(--color-status-danger);
}
</style>
