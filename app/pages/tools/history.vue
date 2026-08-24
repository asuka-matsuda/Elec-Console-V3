<script setup lang="ts">
/**
 * CalculationHistory
 * 計算履歴ツールのコンポーネントです。過去に実行した各種計算ツールの履歴を一覧表示し、管理します。
 */
import { ref, computed, watch } from "vue";

useHead({
  title: "計算履歴",
});

const currentTab = ref("voltage");

const tabs = [
  { value: "voltage", label: "電圧降下計算" },
  { value: "conduit", label: "配管サイズ" },
];

/** タブに応じたストレージキーを取得 */
const storageKey = computed(() => {
  return `elec_calc_${currentTab.value}_hist`;
});

/** 履歴ロジック (マウント後・タブ切り替え時に再取得) */
const historyList = ref<any[]>([]);

const loadHistory = () => {
  if (import.meta.client) {
    const stored = localStorage.getItem(storageKey.value);
    if (stored) {
      try {
        historyList.value = JSON.parse(stored);
      } catch (e) {
        historyList.value = [];
      }
    } else {
      historyList.value = [];
    }
  }
};

watch(currentTab, () => {
  loadHistory();
}, { immediate: true });

// ストレージへの自動保存（削除時など）
watch(historyList, (newVal) => {
  if (import.meta.client) {
    localStorage.setItem(storageKey.value, JSON.stringify(newVal));
  }
}, { deep: true });

const deleteHistory = (id: string) => {
  historyList.value = historyList.value.filter(item => item.id !== id);
};

// --- Dialog States ---
const isClearAllModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const targetDeleteId = ref<string | null>(null);

const confirmClearAll = () => {
  historyList.value = [];
  isClearAllModalOpen.value = false;
};

const openDeleteModal = (id: string) => {
  targetDeleteId.value = id;
  isDeleteModalOpen.value = true;
};

const confirmDelete = () => {
  if (targetDeleteId.value) {
    deleteHistory(targetDeleteId.value);
    targetDeleteId.value = null;
  }
  isDeleteModalOpen.value = false;
};
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
            <AppButtonDanger
              v-if="historyList.length > 0"
              size="sm"
              @click="isClearAllModalOpen = true"
            >
              <AppIcon name="trash-2" size="sm" />
              全て削除
            </AppButtonDanger>
          </template>
        </AppSectionHeader>
      </template>

      <!-- タブ部分 -->
      <div class="p-history-page__tabs">
        <AppTabs v-model="currentTab" :options="tabs" />
      </div>

      <ClientOnly>
        <!-- 履歴一覧 -->
        <div
          v-if="historyList.length > 0"
          class="p-history-page__grid l-grid l-grid--auto-fill"
        >
          <AppHistoryCard
            v-for="entry in historyList"
            :key="entry.id"
            :entry="entry"
            @delete="openDeleteModal"
          />
        </div>

        <!-- 空状態 -->
        <div v-else class="p-history-page__empty c-empty-state">
          <AppIcon name="inbox" size="lg" class="c-empty-state__icon" />
          <p class="c-empty-state__text">保存された履歴はありません。</p>
        </div>

        <!-- SSR時・ハイドレーション前のプレースホルダー -->
        <template #fallback>
          <div class="p-history-page__empty c-empty-state">
            <AppIcon
              name="loader"
              size="lg"
              class="c-empty-state__icon u-spin"
            />
            <p class="c-empty-state__text">履歴を読み込み中...</p>
          </div>
        </template>
      </ClientOnly>
    </AppPanel>

    <!-- Dialogs -->
    <AppConfirmModal
      v-model="isClearAllModalOpen"
      title="履歴をすべて削除"
      message="全ての履歴を削除しますか？この操作は取り消せません。"
      confirm-text="削除する"
      @confirm="confirmClearAll"
    />

    <AppConfirmModal
      v-model="isDeleteModalOpen"
      title="履歴を削除"
      message="この履歴を削除しますか？"
      confirm-text="削除する"
      @confirm="confirmDelete"
    />
  </div>
</template>

<style scoped lang="scss">
.p-history-page {
  // --- レイアウト・配置 ---
  container-type: inline-size;

  @include flex-column(var(--gap-section));


  // --- 子要素 ---

  &__tabs {
    /* 親要素(p-history-page)のgapで管理されるためmargin-bottomは削除 */
  }

  &__grid {
    // --- レイアウト・配置 ---
    display: grid;
    grid-template-columns: 1fr; // スモールファースト
    gap: var(--gap-component);

    @include cq("sm") {
      // --- レイアウト・配置 ---
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    }
  }

  &__empty {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-element));

    align-items: center;
    justify-content: center;

    // --- ボックスモデル ---
    padding: var(--pad-container) 0;

    // --- タイポグラフィ ---
    color: var(--color-text-muted);
  }
}

.u-spin {
  // --- 視覚効果 ---
  animation: spin 1s linear infinite;
}

@keyframes spin {
  // --- 子要素 ---
  from {
    // --- 視覚効果 ---
    transform: rotate(0deg);
  }

  to {
    // --- 視覚効果 ---
    transform: rotate(360deg);
  }
}
</style>
