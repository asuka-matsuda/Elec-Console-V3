<script setup lang="ts">
/**
 * AppDashboardAside
 * ダッシュボードのサイドバー（お知らせや更新履歴などを表示）コンポーネント
 */
const { data: dashboardData, pending } = await useFetch("/api/dashboard", {
  /** Prevent blocking navigation while loading */
  lazy: true,
});
const announcements = computed(() => dashboardData.value?.announcements || []);
const history = computed(() => dashboardData.value?.history || []);
</script>

<template>
  <!-- Right Column: Announcements & History -->
  <aside class="p-dashboard__aside">
    <!-- Announcements -->
    <section class="p-dashboard__aside-block">
      <AppSectionHeader title="お知らせ" icon="bell" size="md" />
      <div v-if="pending" class="p-dashboard__loading">
        データを読み込み中...
      </div>
      <div v-else class="p-dashboard__list">
        <AppCard
          v-for="item in announcements"
          :key="item.title"
          class="p-dashboard-list-item"
        >
          <div class="p-dashboard-list-item__title">{{ item.title }}</div>
          <div class="p-dashboard-list-item__meta">
            {{ item.date }} {{ item.desc }}
          </div>
        </AppCard>
      </div>
    </section>

    <!-- History -->
    <section class="p-dashboard__aside-block">
      <AppSectionHeader title="更新履歴" icon="clock" size="md" />
      <div v-if="pending" class="p-dashboard__loading">
        データを読み込み中...
      </div>
      <div v-else class="p-dashboard__list">
        <AppCard
          v-for="item in history"
          :key="item.version"
          class="p-dashboard-list-item"
        >
          <div class="p-dashboard-list-item__header">
            <AppBadge
              :variant="item.status === 'success' ? 'success' : 'neutral'"
            >
              {{ item.version }}
            </AppBadge>
            <span class="p-dashboard-list-item__title">{{ item.title }}</span>
          </div>
          <div class="p-dashboard-list-item__meta">
            {{ item.date }} {{ item.desc }}
          </div>
        </AppCard>
      </div>
    </section>
  </aside>
</template>

<style scoped lang="scss">
.p-dashboard {
  // --- 子要素 ---
  &__aside {
    // --- レイアウト・配置 ---
    position: sticky;
    top: var(--pad-container);

    @include flex-column(var(--gap-section));

    flex-shrink: 0;

    // --- ボックスモデル ---
    width: var(--sidebar-width);

    @include mq("md") {
      // --- レイアウト・配置 ---
      position: static;

      // --- ボックスモデル ---
      width: 100%;
    }
  }

  &__aside-block {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-component));
  }

  &__list {
    // --- レイアウト・配置 ---
    @include flex-column(var(--gap-component));
  }

  &__loading {
    // --- 継承 ---
    @extend %text-sm;

    // --- ボックスモデル ---
    padding: var(--pad-container);
    border-radius: 0;

    // --- タイポグラフィ ---
    color: var(--color-text-muted);
    text-align: center;

    // --- 視覚効果 ---
    @include surface(5%);
  }
}

/* List Item Card Styles */
.p-dashboard-list-item {
  // --- レイアウト・配置 ---
  @include flex-column(var(--gap-element));

  // --- ボックスモデル ---
  padding: var(--pad-container);

  // --- 子要素 ---
  &__header {
    // --- レイアウト・配置 ---
    @include flex-start(var(--gap-element));
  }

  &__title {
    // --- タイポグラフィ ---
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__meta {
    // --- 継承 ---
    @extend %text-xs;

    // --- タイポグラフィ ---
    color: var(--color-text-muted);
  }
}
</style>
