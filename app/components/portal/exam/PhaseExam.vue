<script setup lang="ts">
/**
 * PhaseExam
 * [Portal Templates] 送電試験（フェーズ1〜3）共通のテンプレートコンポーネント。
 * ページヘッダー（同期バッジ・戻る導線・フェーズ固有アクション）、
 * 絞り込み＆進捗コントロールパネル、およびメインコンテンツ領域を一元管理します。
 */
import { computed } from 'vue'

import type { IconName } from '~/constants/icons'
import type { CircuitItem, PhaseStats } from '~/types/souden'

const selectedShubetsu = defineModel<string>('shubetsu', { default: 'ALL' })
const selectedBanMeisho = defineModel<string>('banMeisho', { default: 'ALL' })

defineProps<{
  title: string
  icon: IconName
  phase: 1 | 2 | 3
  shubetsuOptions: { label: string, value: string }[]
  banMeishoOptions: { label: string, value: string }[]
  stats: PhaseStats
  circuits: CircuitItem[]
}>()

const emit = defineEmits<{
  synced: []
}>()

const route = useRoute()
const siteId = computed(() => route.params.siteId as string)

const handleSelectCircuit = (circuit: CircuitItem) => {
  scrollToTableRow(circuit.id)
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-section-gap min-h-0">

    <SectionHeader
      :title="title"
      :icon="icon"
    >
      <template #actions>
        <PortalSyncStatusBadge
          :site-id="siteId"
          @synced="emit('synced')"
        />

        <slot name="actions" />

        <Button
          icon="arrow-left"
          :to="`/portal/${siteId}/souden`"
        >
          ダッシュボードへ戻る
        </Button>
      </template>
    </SectionHeader>

    <Panel>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-panel-gap items-start">

        <div class="flex flex-col gap-3">

          <div class="flex items-center gap-3">
            <span class="shrink-0">盤種別:</span>
            <RadioGroup
              v-model="selectedShubetsu"
              :options="shubetsuOptions"
            />
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2">
              <span class="shrink-0">盤名称:</span>
              <Select
                v-model="selectedBanMeisho"
                :options="banMeishoOptions"
                :clearable="false"
                class="w-40"
              />
            </div>

            <slot name="filters-extra" />

            <span class="whitespace-nowrap">
              対象回路: <strong>{{ stats.allCount }}</strong> 件
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span>フェーズ{{ phase }} 進捗状況</span>
              <div class="flex items-center gap-2">
                <span><strong>{{ stats.completed }}</strong> / {{ stats.total }}</span>
                <span>({{ stats.pct }}%)</span>
                <Badge v-if="stats.excluded > 0">
                  除外: {{ stats.excluded }}
                </Badge>
              </div>
            </div>
            <PortalProgressBar :value="stats.pct" />
          </div>

          <PortalExamMinimap
            :circuits="circuits"
            :phase="phase"
            @select-circuit="handleSelectCircuit"
          />
        </div>
      </div>
    </Panel>

    <div class="flex flex-1 flex-col min-h-0">
      <slot />
    </div>
  </div>
</template>
