<script setup lang="ts">
/**
 * MasterAnnouncementsTab
 * [Master Organisms] お知らせ管理タブ。
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

const { askConfirm } = useModal()

// モーダル管理状態
const isEditModalOpen = ref(false)
const isSaving = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')
const form = ref({ ...INITIAL_FORM })

// フォームのバリデーション管理（ルールを指定するだけで完結）
const { fieldErrors, validate, resetErrors } = useFormValidation(form, {
  date: '日付',
  title: 'タイトル',
})

const columns: TableColumn<AnnouncementItem>[] = [
  { key: 'date', label: '日付', width: '130px' },
  { key: 'title', label: 'タイトル' },
  { key: 'desc', label: '内容詳細', truncate: true },
  { key: 'actions', label: '操作', width: '120px', align: 'right' },
]

const openModal = (item?: AnnouncementItem) => {
  editingId.value = item ? String(item.id) : null
  formError.value = ''
  resetErrors()
  form.value = item
    ? { title: item.title, date: item.date.replace(/\./g, '-'), desc: item.desc || '' }
    : { ...INITIAL_FORM, date: getTodayDateInput() }
  isEditModalOpen.value = true
}

const handleSave = async () => {
  formError.value = ''
  if (!validate()) return

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
  if (!id) return

  const isConfirmed = await askConfirm({
    title: 'お知らせの削除',
    message: 'このお知らせを削除してもよろしいですか？',
    intent: 'danger',
    confirmText: '削除する',
  })

  if (!isConfirmed) return

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
        @click="openModal()"
      >
        新規お知らせ作成
      </Button>
    </div>

    <!-- お知らせ一覧テーブル -->
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
              @click="handleDelete(row.id)"
            />
          </div>
        </template>
      </Table>
    </Panel>

    <!-- 作成・編集モーダル -->
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
