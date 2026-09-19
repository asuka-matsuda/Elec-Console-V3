<script setup lang="ts">
/**
 * MasterWordBreakTab
 * マスター管理者専用: 改行禁止ワード管理タブ。
 * システム全体の改行禁止ワードの追加・一覧・編集・削除を行います。
 * 更新履歴やお知らせ管理と同一のテーブル・モーダルCRUD方式を採用。
 */
import { ref } from 'vue'

import { useNoBreakWords } from '~/composables/useNoBreakWords'
import type { TableColumn, WordBreakItem } from '~/types/components'

const { data: wordBreakList, pending, refresh } = await useFetch<WordBreakItem[]>('/api/master/word-break', {
  default: () => [],
})

const { fetchWords } = useNoBreakWords()
const { askConfirm } = useModal()

const INITIAL_FORM = {
  word: '',
  date: '',
}

// モーダル管理状態
const isEditModalOpen = ref(false)
const isSaving = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')
const form = ref({ ...INITIAL_FORM })

// フォームのバリデーション管理
const { fieldErrors, validate, resetErrors } = useFormValidation(form, {
  date: '追加日',
  word: '単語',
})

const columns: TableColumn<WordBreakItem>[] = [
  { key: 'date', label: '追加日', width: '130px' },
  { key: 'word', label: '単語' },
  { key: 'actions', label: '操作', width: '120px', align: 'right' },
]

const openModal = (item?: WordBreakItem) => {
  editingId.value = item ? String(item.id) : null
  formError.value = ''
  resetErrors()
  form.value = item
    ? { word: item.word, date: item.date.replace(/\./g, '-') }
    : { ...INITIAL_FORM, date: getTodayDateInput() }
  isEditModalOpen.value = true
}

const handleSave = async () => {
  formError.value = ''
  if (!validate()) return

  isSaving.value = true

  try {
    const url = editingId.value ? `/api/master/word-break/${editingId.value}` : '/api/master/word-break'
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
    await fetchWords(true)
  }
  catch (e: unknown) {
    formError.value = (e as Error).message || '保存に失敗しました。'
  }
  finally {
    isSaving.value = false
  }
}

const handleDelete = async (item: WordBreakItem) => {
  const isConfirmed = await askConfirm({
    title: '改行禁止ワードの削除',
    message: `「${item.word}」を改行禁止ワードから削除してもよろしいですか？`,
    intent: 'danger',
    confirmText: '削除する',
  })

  if (!isConfirmed) return

  try {
    await $fetch(`/api/master/word-break/${item.id}`, {
      method: 'DELETE',
    })
    await refresh()
    await fetchWords(true)
  }
  catch (e: unknown) {
    alert((e as Error).message || '削除に失敗しました。')
  }
}
</script>

<template>
  <div class="flex flex-col gap-panel-gap">
    <!-- ヘッダー・アクション -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <small>
        テーブルの盤名称等で途中で改行させない単語を管理します（※「1-1」「分電盤」等はシステムで自動処理されます）。
      </small>

      <Button
        variant="success"
        icon="plus"
        @click="openModal()"
      >
        新規ワード追加
      </Button>
    </div>

    <!-- 単語一覧テーブル -->
    <Panel padding="none">
      <Table
        :columns="columns"
        :data="wordBreakList"
        :loading="pending"
        empty-text="登録されている改行禁止ワードはありません。"
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

    <!-- 作成・編集モーダル -->
    <Modal
      v-model="isEditModalOpen"
      :title="editingId ? '単語の編集' : '新規ワード登録'"
      icon="type"
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
          form="word-break-form"
          :loading="isSaving"
          @click="handleSave"
        >
          {{ isSaving ? '保存中...' : '保存する' }}
        </Button>
      </template>

      <form
        id="word-break-form"
        class="flex flex-col gap-4"
        @submit.prevent="handleSave"
      >
        <FormGroup v-if="formError" :error="formError" />

        <FormGroup
          label="追加日"
          required
          :error="fieldErrors.date"
        >
          <Input
            v-model="form.date"
            type="date"
          />
        </FormGroup>

        <FormGroup
          label="単語"
          required
          :error="fieldErrors.word"
        >
          <Input
            v-model="form.word"
            placeholder="例: 自動倉庫, 受変電設備"
          />
        </FormGroup>
      </form>
    </Modal>
  </div>
</template>
