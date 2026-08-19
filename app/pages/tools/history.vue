<script setup lang="ts">
import { ref, computed } from "vue";
import { useCalcHistory } from "~/composables/calc/useCalcHistory";

useHead({
  title: "計算履歴",
});

const currentTab = ref("voltage");

const tabs = [
  { value: "voltage", label: "電圧降下計算" },
  // 拡張用：後から追加可能
  // { value: "conduit", label: "配管サイズ" },
];

// タブに応じたストレージキーを取得
const storageKey = computed(() => {
  if (currentTab.value === "voltage") return "elec_calc_voltage_hist";
  return "";
});

// 現在のタブの履歴ロジックを取得
const { historyList, deleteHistory, clearAll } = useCalcHistory(
  storageKey.value,
);

// タブが切り替わったら再取得するために、useCalcHistoryをコンポーネント化するか、
// 簡易的にコンポーザブル自体を再呼び出しするか。
// 依存関係としてstorageKeyを持たせるより、タブごとに切り替える方が綺麗なのでwatchする。
// （※現在の実装では useCalcHistory が onMounted で動作するため、タブ切り替え時に一工夫必要。
// 今回は電圧降下のみなので、単純化のために1つだけロードする構成としています）

const handleClearAll = () => {
  if (confirm("全ての履歴を削除しますか？\nこの操作は取り消せません。")) {
    clearAll();
  }
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
              @click="handleClearAll"
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
            @delete="deleteHistory"
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
  </div>
</template>

<style scoped lang="scss">
.p-history-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  &__tabs {
    margin-bottom: var(--space-6);
  }

  &__grid {
    display: grid;
    gap: var(--space-4);
    
    // デスクトップファーストのレイアウト
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));

    @include mq("md") {
      grid-template-columns: 1fr;
    }
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12) 0;
    gap: var(--space-4);
    color: var(--color-text-muted);
  }
}

.u-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
