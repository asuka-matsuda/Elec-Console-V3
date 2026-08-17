<script setup lang="ts">
const { data: dashboardData, pending } = await useFetch("/api/dashboard", {
  lazy: true, // Prevent blocking navigation while loading
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
  &__aside {
    width: 320px; // Desktop default
    flex-shrink: 0;
    position: sticky;
    top: var(--space-8);
    display: flex;
    flex-direction: column;
    gap: var(--gap-section);

    @include mq("md") {
      width: 100%;
      position: static;
    }
  }

  &__aside-block {
    display: flex;
    flex-direction: column;
    gap: var(--gap-component);
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: var(--gap-component);
  }

  &__loading {
    padding: var(--pad-card);
    text-align: center;
    color: var(--color-text-muted);
    font-size: var(--text-sm);

    @include ui-surface(5%);

    border-radius: 0;
  }
}

/* List Item Card Styles */
.p-dashboard-list-item {
  padding: var(--space-4);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--gap-element);
    margin-bottom: var(--gap-element);
  }

  &__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__meta {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    margin-top: var(--space-1);
  }
}
</style>
