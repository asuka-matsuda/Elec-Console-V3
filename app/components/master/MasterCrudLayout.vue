<script setup lang="ts" generic="T extends Record<string, any>">
/**
 * MasterCrudLayout
 * [Master] マスター管理画面（お知らせ・更新履歴・改行禁止ワード等）共通のCRUDレイアウトコンポーネント。
 * 説明ヘッダー＋作成ボタン、一覧テーブル（編集・削除アクション内蔵）、編集/作成モーダルの定型シェルを一元管理します。
 */
import { computed } from 'vue'

import type { IconName } from '~/constants/icons'
import type { TableColumn } from '~/types/components'

const isModalOpen = defineModel<boolean>('isModalOpen', { required: true })

const props = withDefaults(
  defineProps<{
    description: string
    createButtonText: string
    columns: TableColumn<T>[]
    data: T[]
    loading?: boolean
    emptyText?: string
    modalTitle: string
    modalIcon?: IconName
    isSaving?: boolean
    formError?: string
    saveButtonText?: string
  }>(),
  {
    loading: false,
    emptyText: '登録されているデータはありません。',
    modalIcon: 'edit',
    isSaving: false,
    formError: '',
    saveButtonText: '保存する',
  },
)

const emit = defineEmits<{
  create: []
  edit: [item: T]
  delete: [item: T]
  save: []
}>()

// スロット転送用：actions 以外のカスタムセルを判定
const customColumns = computed(() =>
  props.columns.filter(col => String(col.key) !== 'actions'),
)
</script>

<template>
  <div class="flex flex-col gap-panel-gap">

    <div class="flex flex-wrap items-center justify-between gap-4">
      <small>
        {{ description }}
      </small>

      <Button
        variant="success"
        icon="plus"
        @click="emit('create')"
      >
        {{ createButtonText }}
      </Button>
    </div>

    <Panel padding="none">
      <Table
        :columns="columns"
        :data="data"
        :loading="loading"
        :empty-text="emptyText"
      >
        <template
          v-for="col in customColumns"
          :key="String(col.key)"
          #[`cell-${String(col.key)}`]="slotProps"
        >
          <slot
            :name="`cell-${String(col.key)}`"
            v-bind="slotProps"
          />
        </template>

        <template #cell-actions="{ row }">
          <slot name="cell-actions" :row="row">
            <div class="flex items-center justify-end gap-1.5">
              <Button
                icon="edit"
                title="編集"
                @click="emit('edit', row)"
              />
              <Button
                variant="danger"
                icon="trash-2"
                title="削除"
                @click="emit('delete', row)"
              />
            </div>
          </slot>
        </template>
      </Table>
    </Panel>

    <Modal
      v-model="isModalOpen"
      :title="modalTitle"
      :icon="modalIcon"
    >
      <template #actions>
        <Button
          :disabled="isSaving"
          @click="isModalOpen = false"
        >
          キャンセル
        </Button>
        <Button
          variant="success"
          :loading="isSaving"
          @click="emit('save')"
        >
          {{ saveButtonText }}
        </Button>
      </template>

      <div class="flex flex-col gap-4">
        <Alert
          v-if="formError"
          variant="danger"
        >
          {{ formError }}
        </Alert>

        <slot />
      </div>
    </Modal>
  </div>
</template>
