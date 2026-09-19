<script setup lang="ts">
/**
 * MasterHistoryTab
 * マスター管理者専用: 更新履歴管理タブ。
 * システム全体の更新履歴（バージョンリリース情報）の追加・一覧・編集・削除を行います。
 */
import { ref } from 'vue'

import type { HistoryItem, TableColumn } from '~/types/components'

const { data: historyList, pending, refresh } = await useFetch<HistoryItem[]>('/api/master/history', {
  default: () => [],
})

const INITIAL_FORM = {
  version: 'v',
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
  version: 'バージョン',
  date: '日付',
  title: 'タイトル',
})

const columns: TableColumn<HistoryItem>[] = [
  { key: 'version', label: 'バージョン', width: '110px' },
  { key: 'date', label: '日付', width: '130px' },
  { key: 'title', label: 'タイトル' },
  { key: 'desc', label: '内容詳細', truncate: true },
  { key: 'actions', label: '操作', width: '120px', align: 'right' },
]

const openModal = (item?: HistoryItem) => {
  editingId.value = item ? String(item.id) : null
  formError.value = ''
  resetErrors()
  form.value = item
    ? {
        version: item.version,
        title: item.title,
        date: item.date.replace(/\./g, '-'),
        desc: item.desc || '',
      }
    : { ...INITIAL_FORM, date: getTodayDateInput() }
  isEditModalOpen.value = true
}

const handleSave = async () => {
  formError.value = ''
  if (!validate()) return

  isSaving.value = true

  try {
    const url = editingId.value ? `/api/master/history/${editingId.value}` : '/api/master/history'
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
    title: '更新履歴の削除',
    message: 'この更新履歴を削除してもよろしいですか？',
    intent: 'danger',
    confirmText: '削除する',
  })

  if (!isConfirmed) return

  try {
    await $fetch(`/api/master/history/${id}`, {
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
        ダッシュボードの「更新履歴」ウィジェットに掲載されるバージョン情報を管理します。
      </small>

      <Button
        variant="success"
        icon="plus"
        @click="openModal()"
      >
        新規更新履歴作成
      </Button>
    </div>

    <!-- 更新履歴一覧テーブル -->
    <Panel padding="none">
      <Table
        :columns="columns"
        :data="historyList"
        :loading="pending"
        empty-text="登録されている更新履歴はありません。"
      >
        <template #cell-version="{ row }">
          <Badge
            id="version:muted"
          >
            {{ row.version }}
          </Badge>
        </template>

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
      icon="clock"
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
          form="history-form"
          :loading="isSaving"
          @click="handleSave"
        >
          {{ isSaving ? '保存中...' : '保存する' }}
        </Button>
      </template>

      <form
        id="history-form"
        class="flex flex-col gap-4"
        @submit.prevent="handleSave"
      >
        <FormGroup v-if="formError" :error="formError" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormGroup
            label="バージョン"
            required
            :error="fieldErrors.version"
          >
            <Input
              v-model="form.version"
              placeholder="例: v2.1.0"
            />
          </FormGroup>

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
        </div>

        <FormGroup
          label="タイトル"
          required
          :error="fieldErrors.title"
        >
          <Input
            v-model="form.title"
            placeholder="例: 新機能追加"
          />
        </FormGroup>

        <FormGroup label="詳細本文">
          <Textarea
            v-model="form.desc"
            :rows="5"
            placeholder="詳細な更新内容や変更点を入力してください（モーダルで表示されます）"
          />
        </FormGroup>
      </form>
    </Modal>
  </div>
</template>
