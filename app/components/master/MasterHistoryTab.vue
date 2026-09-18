<script setup lang="ts">
/**
 * MasterHistoryTab
 * マスター管理者専用: 更新履歴管理タブ。
 * システム全体の更新履歴（バージョンリリース情報）の追加・一覧・編集・削除を行います。
 */
import { ref } from 'vue'

import type { HistoryItem, SelectOption, TableColumn } from '~/types/components'

const { data: historyList, pending, refresh } = await useFetch<HistoryItem[]>('/api/master/history', {
  default: () => [],
})

// モーダル管理状態
const isEditModalOpen = ref(false)
const isSaving = ref(false)
const editingId = ref<string | null>(null)
const modalError = ref('')

const form = ref({
  version: '',
  title: '',
  date: '',
  desc: '',
  status: 'neutral',
})

const statusOptions: SelectOption<string>[] = [
  { label: '通常 (neutral)', value: 'neutral' },
  { label: 'メジャーリリース (success)', value: 'success' },
]

const columns: TableColumn<HistoryItem>[] = [
  { key: 'version', label: 'バージョン', width: '110px', sortable: true },
  { key: 'date', label: '日付', width: '130px', sortable: true },
  { key: 'title', label: 'タイトル', sortable: true },
  { key: 'status', label: 'ステータス', width: '120px' },
  { key: 'desc', label: '内容詳細', truncate: true },
  { key: 'actions', label: '操作', width: '120px', align: 'right' },
]

// 今日の日付文字列（YYYY.MM.DD形式）
const getTodayString = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')

  return `${y}.${m}.${d}`
}

const openCreateModal = () => {
  editingId.value = null
  modalError.value = ''
  form.value = {
    version: 'v',
    title: '',
    date: getTodayString(),
    desc: '',
    status: 'neutral',
  }
  isEditModalOpen.value = true
}

const openEditModal = (item: HistoryItem) => {
  editingId.value = String(item.id)
  modalError.value = ''
  form.value = {
    version: item.version,
    title: item.title,
    date: item.date,
    desc: item.desc || '',
    status: item.status || 'neutral',
  }
  isEditModalOpen.value = true
}

const handleSave = async () => {
  if (!form.value.version.trim() || !form.value.title.trim() || !form.value.date.trim()) {
    modalError.value = 'バージョン、タイトル、日付は必須です。'

    return
  }

  isSaving.value = true
  modalError.value = ''

  try {
    if (editingId.value) {
      await $fetch(`/api/master/history/${editingId.value}`, {
        method: 'PUT',
        body: form.value,
      })
    }
    else {
      await $fetch('/api/master/history', {
        method: 'POST',
        body: form.value,
      })
    }
    isEditModalOpen.value = false
    await refresh()
  }
  catch (e: unknown) {
    modalError.value = (e as Error).message || '保存に失敗しました。'
  }
  finally {
    isSaving.value = false
  }
}

const handleDelete = async (id?: string | number) => {
  if (!id) return
  if (!confirm('この更新履歴を削除してもよろしいですか？')) return

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
  <div class="flex flex-col gap-6 master-history">
    <!-- ヘッダー・アクション -->
    <Panel>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 class="m-0 section-title">
            システム更新履歴管理
          </h3>
          <p class="m-0 mt-1 section-desc">
            ダッシュボードの「更新履歴」ウィジェットに掲載されるバージョン情報を管理します。
          </p>
        </div>

        <Button
          variant="success"
          icon="plus"
          @click="openCreateModal"
        >
          新規更新履歴作成
        </Button>
      </div>
    </Panel>

    <!-- 更新履歴一覧テーブル -->
    <Panel padding="none">
      <Table
        :columns="columns"
        :data="historyList || []"
        :loading="pending"
        empty-text="登録されている更新履歴はありません。"
      >
        <template #cell-version="{ row }">
          <Badge
            :id="row.status === 'success' ? 'version:release' : 'version:muted'"
          >
            {{ row.version }}
          </Badge>
        </template>

        <template #cell-date="{ row }">
          <time class="col-date">
            {{ row.date }}
          </time>
        </template>

        <template #cell-title="{ row }">
          <span class="col-title">
            {{ row.title }}
          </span>
        </template>

        <template #cell-status="{ row }">
          <span class="col-status">
            {{ row.status === 'success' ? 'リリース' : '通常' }}
          </span>
        </template>

        <template #cell-desc="{ row }">
          <span class="col-desc">
            {{ row.desc || '—' }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <Button
              icon="pencil"
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
      :title="editingId ? '更新履歴を編集' : '新規更新履歴作成'"
      icon="clock"
    >
      <div class="flex flex-col gap-4">
        <div v-if="modalError" class="p-2 modal-error">
          {{ modalError }}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="form-label">
              バージョン <span class="req-mark">*</span>
            </label>
            <Input
              v-model="form.version"
              placeholder="例: v2.1.0"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="form-label">
              日付 <span class="req-mark">*</span>
            </label>
            <Input
              v-model="form.date"
              placeholder="例: 2026.09.19"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="form-label">
              タイトル <span class="req-mark">*</span>
            </label>
            <Input
              v-model="form.title"
              placeholder="例: 新機能追加"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="form-label">
              ステータス
            </label>
            <Select
              v-model="form.status"
              :options="statusOptions"
              :clearable="false"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="form-label">
            詳細本文
          </label>
          <Textarea
            v-model="form.desc"
            :rows="5"
            placeholder="詳細な更新内容や変更点を入力してください（モーダルで表示されます）"
          />
        </div>

        <footer class="flex items-center justify-end gap-2 pt-3 modal-footer">
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
        </footer>
      </div>
    </Modal>
  </div>
</template>

<style scoped lang="scss">
.section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-main);
}

.section-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.col-date {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.col-title {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-main);
}

.col-status {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.col-desc {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.form-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
}

.req-mark {
  color: var(--color-status-danger);
}

.modal-error {
  border: var(--border-width-base) solid var(--color-status-danger);
  font-size: var(--font-size-xs);
  color: var(--color-status-danger);
  background-color: var(--surface-bg-elevated);
}

.modal-footer {
  border-top: 1px solid var(--color-border);
}
</style>
