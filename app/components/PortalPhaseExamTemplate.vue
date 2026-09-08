<script setup lang="ts">
/**
 * PortalPhaseExamTemplate
 * 送電試験（フェーズ1〜3）共通のテンプレート（Layout）コンポーネント。
 * ヘッダー、同期状態、絞り込み＆進捗コントロールパネル、およびメインコンテンツ（テーブル）の骨組みを提供します。
 */
import type { CircuitItem } from '~/types/souden'

const selectedShubetsu = defineModel<string>('shubetsu', { default: 'ALL' })
const selectedBanMeisho = defineModel<string>('banMeisho', { default: 'ALL' })

defineProps<{
  title: string
  icon: string
  phase: 1 | 2 | 3
  shubetsuOptions: { label: string, value: string }[]
  banMeishoOptions: { label: string, value: string }[]
  stats: {
    allCount: number
    completed: number
    total: number
    excluded: number
    pct: number
  }
  circuits: CircuitItem[]
}>()

defineEmits<{
  (e: 'select-circuit', circuit: CircuitItem): void
}>()
</script>

<template>
  <div class="portal-phase-exam-template">
    <!-- ページヘッダー -->
    <MoleculesSectionHeader
      :title="title"
      :icon="icon"
      size="lg"
    >
      <template #actions>
        <slot name="header-actions" />
      </template>
    </MoleculesSectionHeader>

    <!-- 検索・絞り込み ＆ 進捗コントロールパネル -->
    <PortalSoudenPhaseControls
      v-model:shubetsu="selectedShubetsu"
      v-model:ban-meisho="selectedBanMeisho"
      :shubetsu-options="shubetsuOptions"
      :ban-meisho-options="banMeishoOptions"
      :stats="stats"
      :circuits="circuits"
      :phase="phase"
      @select-circuit="$emit('select-circuit', $event)"
    >
      <template #filters-extra>
        <slot name="filters-extra" />
      </template>
    </PortalSoudenPhaseControls>

    <!-- メインコンテンツ（各フェーズのテーブル等） -->
    <main class="portal-phase-exam-template__main">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.portal-phase-exam-template {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-4);

  min-height: 0;

  &__main {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }
}
</style>
