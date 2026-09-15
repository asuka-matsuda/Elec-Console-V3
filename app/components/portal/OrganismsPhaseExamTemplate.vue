<script setup lang="ts">
/**
 * PortalOrganismsPhaseExamTemplate
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
  <div class="flex flex-1 flex-col gap-4 min-h-0">
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
    <PortalOrganismsSoudenPhaseControls
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
    </PortalOrganismsSoudenPhaseControls>

    <!-- メインコンテンツ（各フェーズのテーブル等） -->
    <main class="flex flex-1 flex-col min-h-0">
      <slot />
    </main>
  </div>
</template>
