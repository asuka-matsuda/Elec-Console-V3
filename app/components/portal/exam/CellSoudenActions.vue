<script setup lang="ts">
/**
 * CellSoudenActions
 * [Portal Exam] 送電試験（Phase 1〜3）共通の行アクションボタングループコンポーネント。
 * - ロック状態（幹線未完了 / 前フェーズ未了）の理由表示
 * - 確定済み状態での「解除」ボタン（ローカルで再編集可能に戻す）
 * - 未確定状態での「確定」ボタンおよび追加アクションスロット（全相OK等）
 */
import type { CircuitItem } from '#shared/types/circuit'

withDefaults(
  defineProps<{
    circuit: CircuitItem
    isLocked?: boolean
    lockedReason?: string
    isCompleted?: boolean
    isLoading?: boolean
    disabled?: boolean
    confirmLabel?: string
  }>(),
  {
    isLocked: false,
    lockedReason: '幹線未完了',
    isCompleted: false,
    isLoading: false,
    disabled: false,
    confirmLabel: '確定',
  },
)

defineEmits<{
  confirm: []
  clear: []
}>()
</script>

<template>
  <div class="cell-actions flex items-center justify-center gap-1.5 whitespace-nowrap">
    <template v-if="isLocked">
      <span class="text-note inline-flex items-center gap-1">
        ⏸ {{ lockedReason }}
      </span>
    </template>

    <template v-else-if="isCompleted">
      <Button
        variant="danger"
        :disabled="circuit.isExcluded || isLoading"
        @click="$emit('clear')"
      >
        解除
      </Button>
    </template>

    <template v-else>
      <slot />
      <Button
        variant="success"
        :disabled="circuit.isExcluded || disabled"
        :loading="isLoading"
        @click="$emit('confirm')"
      >
        {{ confirmLabel }}
      </Button>
    </template>
  </div>
</template>

<style scoped lang="scss">
.cell-actions {
  white-space: nowrap;

  :deep(.btn) {
    min-height: 2em;
    padding-block: 0.25em;
    padding-inline: 0.65em;

    font-size: var(--font-size-xs);
    white-space: nowrap;
  }
}

.text-note {
  font-size: inherit;
  font-weight: var(--font-weight-normal);
  color: var(--color-status-warning);
}
</style>
