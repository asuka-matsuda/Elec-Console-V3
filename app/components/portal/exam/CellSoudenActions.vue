<script setup lang="ts">
/**
 * CellSoudenActions
 * [Portal Exam] 送電試験（Phase 1〜3）共通の行アクションボタングループコンポーネント。
 * ロック状態表示、編集中操作（保存/取消）、完了後操作（解除/変更）、未完了時操作（クイック確定/手入力）のステートマシンを一元管理します。
 */
import type { CircuitItem } from '~/types/souden'

withDefaults(
  defineProps<{
    circuit: CircuitItem
    isLocked?: boolean
    lockedReason?: string
    isEditing?: boolean
    isCompleted?: boolean
    isLoading?: boolean
    confirmLabel?: string
    editLabel?: string
    saveLabel?: string
    hasModifyButton?: boolean
  }>(),
  {
    isLocked: false,
    lockedReason: '幹線未完了',
    isEditing: false,
    isCompleted: false,
    isLoading: false,
    confirmLabel: '確定',
    editLabel: '編集',
    saveLabel: '保存',
    hasModifyButton: true,
  },
)

defineEmits<{
  confirm: []
  clear: []
  edit: []
  save: []
  cancel: []
}>()
</script>

<template>
  <div class="flex items-center justify-center gap-1">
    <template v-if="isLocked">
      <span class="text-note inline-flex items-center gap-1">
        ⏸ {{ lockedReason }}
      </span>
    </template>

    <template v-else-if="isEditing">
      <Button
        variant="success"
        :loading="isLoading"
        @click="$emit('save')"
      >
        {{ saveLabel }}
      </Button>
      <Button @click="$emit('cancel')">
        取消
      </Button>
    </template>

    <template v-else-if="isCompleted">
      <Button
        variant="danger"
        :loading="isLoading"
        @click="$emit('clear')"
      >
        解除
      </Button>
      <Button
        v-if="hasModifyButton"
        @click="$emit('edit')"
      >
        変更
      </Button>
    </template>

    <template v-else>
      <Button
        variant="success"
        :disabled="circuit.isExcluded"
        :loading="isLoading"
        @click="$emit('confirm')"
      >
        {{ confirmLabel }}
      </Button>
      <Button
        :disabled="circuit.isExcluded"
        @click="$emit('edit')"
      >
        {{ editLabel }}
      </Button>
    </template>
  </div>
</template>

<style scoped lang="scss">
.text-note {
  font-size: inherit;
  font-weight: var(--font-weight-normal);
  color: var(--color-status-warning);
}
</style>
