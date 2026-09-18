<script setup lang="ts">
/**
 * MasterAnnouncementsTab
 * マスター管理者専用: お知らせ管理タブ。
 * システム全体のお知らせの追加・一覧・編集・削除を行います。
 */
import { ref } from 'vue'

import type { AnnouncementItem, TableColumn } from '~/types/components'

const { data: announcements, pending, refresh } = await useFetch<AnnouncementItem[]>('/api/master/announcements', {
  default: () => [],
})

const INITIAL_FORM = {
  title: '',
  date: '',
  desc: '',
}

// 今日の日付文字列（YYYY-MM-DD形式: type="date" 用）
const getTodayDateInput = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')

  return `${y}-${m}-${d}`
}

// モーダル管理状態
const isEditModalOpen = ref(false)
const isSaving = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')
const fieldErrors = ref({ title: '', date: '' })
const form = ref({ ...INITIAL_FORM })

const columns: TableColumn<AnnouncementItem>[] = [
  { key: 'date', label: '日付', width: '130px', sortable: true },
  { key: 'title', label: 'タイトル', sortable: true },
  { key: 'desc', label: '内容詳細', truncate: true },
  { key: 'actions', label: '操作', width: '120px', align: 'right' },
]

const openCreateModal = () => {
  editingId.value = null
  formError.value = ''
  fieldErrors.value = { title: '', date: '' }
  form.value = { ...INITIAL_FORM, date: getTodayDateInput() }
  isEditModalOpen.value = true
}

const openEditModal = (item: AnnouncementItem) => {
  editingId.value = String(item.id)
  formError.value = ''
  fieldErrors.value = { title: '', date: '' }
  form.value = {
    title: item.title,
    date: item.date.replace(/\./g, '-'),
    desc: item.desc || '',
  }
  isEditModalOpen.value = true
}

const handleSave = async () => {
  fieldErrors.value = { title: '', date: '' }
  formError.value = ''

  if (!form.value.date.trim()) {
    fieldErrors.value.date = '日付は必須です。'
  }
  if (!form.value.title.trim()) {
    fieldErrors.value.title = 'タイトルは必須です。'
  }

  if (fieldErrors.value.date || fieldErrors.value.title) {
    return
  }

  isSaving.value = true

  try {
    const url = editingId.value ? `/api/master/announcements/${editingId.value}` : '/api/master/announcements'
    const method = editingId.value ? 'PUT' : 'POST'

    await $fetch(url, {
      method,
      body: {
        ...form.value,
        date: form.value.date.replace(/-/g, '.'),
      },
    })
    isEditModalOpen.value = false
    await refresh()
  }
  catch (e: unknown) {
    formError.value = (e as Error).message || '保存に失敗しました。'
  }
  finally {
    isSaving.value = false
  }
}

const handleDelete = async (id?: string | number) => {
  if (!id || !confirm('このお知らせを削除してもよろしいですか？')) return

  try {
    await $fetch(`/api/master/announcements/${id}`, {
      method: 'DELETE',
    })
    await refresh()
  }
  catch (e: unknown) {
    alert((e as Error).message || '削除に失敗しました。')
  }
}
</script>

<template>
  <div class="flex flex-col gap-panel-gap">
    <!-- ヘッダー・アクション（Panelを撤廃し、説明文とアクションボタンを直接配置） -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <small>
        ダッシュボードの「お知らせ」ウィジェットに掲載される情報を管理します。
      </small>

      <Button
        variant="success"
        icon="plus"
        @click="openCreateModal"
      >
        新規お知らせ作成
      </Button>
    </div>

    <!-- お知らせ一覧テーブル -->
    <Panel padding="none">
      <Table
        :columns="columns"
        :data="announcements || []"
        :loading="pending"
        empty-text="登録されているお知らせはありません。"
      >
        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <Button
              icon="edit"
              title="編集"
              @click="openEditModal(row)"
            />
            <Button
              variant="danger"
              icon="trash-2"
              title="削除"
              @click="handleDelete(row.id)"
            />
          </div>
        </template>
      </Table>
    </Panel>

    <!-- 作成・編集モーダル -->
    <Modal
      v-model="isEditModalOpen"
      :title="editingId ? 'お知らせを編集' : '新規お知らせ作成'"
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
          :loading="isSaving"
          @click="handleSave"
        >
          {{ isSaving ? '保存中...' : '保存する' }}
        </Button>
      </template>

      <div class="flex flex-col gap-4">
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
      </div>
    </Modal>
  </div>
</template>
