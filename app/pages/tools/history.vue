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
  <div class="p-history-page">
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
            <AppButton
              v-if="historyList.length > 0"
              variant="danger"
              size="sm"
              @click="handleClearAll"
            >
              <AppIcon name="trash-2" size="sm" />
              全て削除
            </AppButton>
          </template>
        </AppSectionHeader>
      </template>

      <div class="p-history-page__tabs">
        <AppTabs v-model="currentTab" :options="tabs" />
      </div>

      <ClientOnly>
        <div
          v-if="historyList.length > 0"
          class="p-history-page__grid l-grid l-grid--auto-fill"
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
.p-history-page {
  @include flex-start-stretch($direction: column);

  container-type: inline-size;
  gap: var(--space-section-gap);

  &__grid {
    @include grid;

    @include cq("sm") {
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    }
  }

  &__empty {
    @include flex-start-stretch($direction: column);

    gap: var(--space-1);
    align-items: center;
    justify-content: center;

    padding: var(--space-layout-pad) 0;

    color: var(--color-text-muted);
  }
}
</style>
