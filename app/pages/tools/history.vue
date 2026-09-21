<script setup lang="ts">
/**
 * CalculationHistory
 * 計算履歴ツールのコンポーネントです。過去に実行した各種計算ツールの履歴を一覧表示し、管理します。
 */
import { useCalculationHistoryPage } from '~/composables/tools/useCalculationHistoryPage'

useHead({
  title: '計算履歴',
})

const {
  tabs,
  currentTab,
  historyList,
  handleClearAll,
  openDeleteModal,
} = useCalculationHistoryPage()
</script>

<template>
  <div class="flex flex-col gap-section-gap">
    <Panel as="section" class="flex flex-col gap-4">
      <SectionHeader
        title="計算履歴"
        icon="clock"
      >
        <template #actions>
          <Button
            v-if="historyList.length > 0"
            variant="danger"
            icon="trash-2"
            @click="handleClearAll"
          >
            全て削除
          </Button>
        </template>
      </SectionHeader>

      <RadioGroup v-model="currentTab" :options="tabs" />

      <ClientOnly>
        <div
          v-if="historyList.length > 0"
          class="grid grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-panel-gap"
        >
          <ToolHistoryCard
            v-for="entry in historyList"
            :key="entry.id"
            :entry="entry"
            @delete="openDeleteModal"
          />
        </div>

        <EmptyState
          v-else
          icon="inbox"
          title="保存された履歴はありません"
          description="計算ツールで計算を実行し、「履歴に保存」を行うとここに記録されます。"
        />

        <template #fallback>
          <EmptyState
            icon="loader"
            spin
            title="履歴を読み込み中..."
          />
        </template>
      </ClientOnly>
    </Panel>
  </div>
</template>
