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
    position: sticky;
    top: var(--pad-container);
    display: flex;
    flex-shrink: 0;
    flex-direction: column;
    gap: var(--gap-section);
    width: var(--sidebar-width);

    @include mq("md") {
      position: static;
      width: 100%;
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
    padding: var(--pad-container);
    color: var(--color-text-muted);
    text-align: center;
    border-radius: 0;

    @extend %text-sm;
    @include ui-surface(5%);
  }
}

/* List Item Card Styles */
.p-dashboard-list-item {
  display: flex;
  flex-direction: column;
  gap: var(--gap-element);
  padding: var(--pad-container);

  &__header {
    display: flex;
    gap: var(--gap-element);
    align-items: center;
  }

  &__title {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-main);
  }

  &__meta {
    @extend %text-xs;

    color: var(--color-text-muted);
  }
}
</style>
