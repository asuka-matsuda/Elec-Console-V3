
<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAdminSites } from '~/composables/admin/useAdminSites';
import { computed, onMounted } from 'vue';

const route = useRoute();
const siteId = route.params.siteId as string;

const { sites, fetchSites } = useAdminSites();
const currentSite = computed(() => sites.value.find(s => s.id === siteId));

onMounted(() => {
  if (sites.value.length === 0) {
    fetchSites();
  }
});
</script>

<template>
  <div class="p-site-dashboard">
    <div class="p-site-dashboard__header">
      <h2>{{ currentSite?.name || '読み込み中...' }}</h2>
    </div>
    
    <div class="l-grid l-grid--2col-2-1">
      <!-- 2/3: カレンダー -->
      <div class="p-site-dashboard__calendar">
        <PortalSiteCalendar :site-id="siteId" />
      </div>

      <!-- 1/3: ToDo & ボタン -->
      <div class="p-site-dashboard__sidebar">
        <PortalPersonalTodo :site-id="siteId" />
        
        <NuxtLink :to="`/portal/${siteId}/souden`" class="c-link-button">
          <AppButton variant="primary" style="width: 100%; margin-top: 16px;">
            <AppIcon name="zap" size="sm" style="margin-right: 8px;" />
            送電試験ダッシュボードへ
          </AppButton>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.p-site-dashboard {
  @include flex-column(var(--gap-lg));
  height: 100%;

  &__header {
    h2 {
      @extend %text-title-lg;
      color: var(--color-text-main);
    }
  }

  &__calendar {
    min-height: 500px; // カレンダーが潰れないように
  }

  &__sidebar {
    @include flex-column(var(--gap-md));
  }
}

.c-link-button {
  text-decoration: none;
  display: block;
}
</style>
