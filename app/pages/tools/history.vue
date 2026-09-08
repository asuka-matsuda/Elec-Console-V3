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
  <div class="history-page">
    <AppPanel>
      <template #header>
        <AppSectionHeader
          title="計算履歴"
          divider-type="fade-center"
          icon="clock"
          variant="tool"
          size="lg"
        >
          <template #actions>
            <AtomsButton
              v-if="historyList.length > 0"
              variant="danger"
              size="sm"
              @click="handleClearAll"
            >
              <AtomsIcon name="trash-2" size="sm" />
              全て削除
            </AtomsButton>
          </template>
        </AppSectionHeader>
      </template>

      <AppTabs v-model="currentTab" :options="tabs" />

      <ClientOnly>
        <div
          v-if="historyList.length > 0"
          class="history-page__grid"
        >
          <ToolHistoryCard
            v-for="entry in historyList"
            :key="entry.id"
            :entry="entry"
            @delete="openDeleteModal"
          />
        </div>

        <AppEmptyState
          v-else
          icon="inbox"
          title="保存された履歴はありません"
          description="計算ツールで計算を実行し、「履歴に保存」を行うとここに記録されます。"
        />

        <template #fallback>
          <AppEmptyState icon="loader" title="履歴を読み込み中..." />
        </template>
      </ClientOnly>
    </AppPanel>
  </div>
</template>

<style scoped lang="scss">
.history-page {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: var(--space-section-gap);

  &__grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-panel-gap);

    @include cq("sm") {
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    }
  }
}
</style>
