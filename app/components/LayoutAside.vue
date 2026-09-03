<script setup lang="ts">
/**
 * LayoutDashboardAside
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
          <div class="p-dashboard-list-item__title">
            {{ item.title }}
          </div>
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
              :color="item.status === 'success' ? 'success' : 'secondary'"
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
  &__aside {
    @include flex-start-stretch($direction: column);

    position: sticky;
    top: var(--space-layout-pad);

    flex-shrink: 0;
    gap: var(--space-section-gap);

    width: var(--sidebar-width);

    @include mq("md") {
      position: static;
      width: 100%;
    }
  }

  &__aside-block {
    @include flex-start-stretch($direction: column);
  }

  &__list {
    @include flex-start-stretch($direction: column);
  }

  &__loading {
    @include text-title("sm");

    padding: var(--space-card-pad);
    color: var(--color-text-muted);
    text-align: center;

    @include border-base;
  }
}

/* List Item Card Styles */
.p-dashboard-list-item {
  @include flex-start-stretch($direction: column);

  gap: var(--space-1);
  padding: var(--space-3);

  &__header {
    @include flex-start-center;
  }

  &__title {
    color: var(--color-text-main);
  }

  &__meta {
    @include text-meta;
  }
}
</style>
