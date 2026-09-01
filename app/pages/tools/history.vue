<script setup lang="ts">
/**
 * CalculationHistory
 * 計算履歴ツールのコンポーネントです。過去に実行した各種計算ツールの履歴を一覧表示し、管理します。
 */
import { computed, ref, watch } from 'vue'

import type { HistoryEntry } from '~/types/history'

useHead({
  title: '計算履歴',
})

const tabs = [
  { value: 'voltage', label: '電圧降下計算' },
  { value: 'conduit', label: '配管サイズ' },
]

const currentTab = ref('voltage')
const historyList = ref<HistoryEntry[]>([])

const {
  isOpen: isConfirmOpen,
  title: confirmTitle,
  message: confirmMessage,
  confirmText: confirmBtnText,
  intent: confirmIntent,
  askConfirm,
  handleConfirm,
} = useConfirmModal()

const storageKey = computed(() => {
  return `elec_calc_${currentTab.value}_hist`
})

const loadHistory = () => {
  if (import.meta.client) {
    const stored = localStorage.getItem(storageKey.value)

    if (stored) {
      try {
        historyList.value = JSON.parse(stored)
      }
      catch {
        historyList.value = []
      }
    }
    else {
      historyList.value = []
    }
  }
}

const deleteHistory = (id: string) => {
  historyList.value = historyList.value.filter(item => item.id !== id)
}

const handleClearAll = () => {
  askConfirm({
    title: '履歴をすべて削除',
    message: '全ての履歴を削除しますか？この操作は取り消せません。',
    confirmText: '削除する',
    intent: 'danger',
    onConfirm: () => {
      historyList.value = []
    },
  })
}

const openDeleteModal = (id: string) => {
  askConfirm({
    title: '履歴を削除',
    message: 'この履歴を削除しますか？',
    confirmText: '削除する',
    intent: 'danger',
    onConfirm: () => {
      deleteHistory(id)
    },
  })
}

watch(
  currentTab,
  () => {
    loadHistory()
  },
  { immediate: true },
)

watch(
  historyList,
  (newVal) => {
    if (import.meta.client) {
      localStorage.setItem(storageKey.value, JSON.stringify(newVal))
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="p-history-page">
    <AppPanel bracket-color="tool">
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
              <AppIcon
                name="trash-2"
                size="sm"
              />
              全て削除
            </AppButton>
          </template>
        </AppSectionHeader>
      </template>

      <!-- タブ部分 -->
      <div class="p-history-page__tabs">
        <AppTabs
          v-model="currentTab"
          :options="tabs"
        />
      </div>

      <ClientOnly>
        <!-- 履歴一覧 -->
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

        <!-- 空状態 -->
        <AppEmptyState
          v-else
          icon="inbox"
          title="保存された履歴はありません"
          description="計算ツールで計算を実行し、「履歴に保存」を行うとここに記録されます。"
        />

        <!-- SSR時・ハイドレーション前のプレースホルダー -->
        <template #fallback>
          <AppEmptyState
            icon="loader"
            title="履歴を読み込み中..."
          />
        </template>
      </ClientOnly>
    </AppPanel>

    <!-- Dialogs -->
    <AppConfirmModal
      v-model="isConfirmOpen"
      :title="confirmTitle"
      :message="confirmMessage"
      :confirm-text="confirmBtnText"
      :intent="confirmIntent"
      @confirm="handleConfirm"
    />
  </div>
</template>

<style scoped lang="scss">
.p-history-page {
  container-type: inline-size;

  @include flex-start-stretch($direction: column);

  gap: var(--space-section-gap);

  &__tabs {
    /* 親要素(p-history-page)のgapで管理されるためmargin-bottomは削除 */
  }

  &__grid {
    @include grid;

    @include cq("sm") {
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    }
  }

  &__empty {
    @include flex-start-stretch($direction: column);

    gap: var(--space-stack-gap-sm);
    align-items: center;
    justify-content: center;

    padding: var(--space-layout-pad) 0;

    color: var(--color-text-muted);
  }
}
</style>
