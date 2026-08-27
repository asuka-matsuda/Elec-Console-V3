
<script setup lang="ts">
import { useAdminSites } from '~/composables/admin/useAdminSites';
import { useAuth } from '~/composables/useAuth';
import { useLocalStorage } from '@vueuse/core';

const route = useRoute();
const siteId = route.params.siteId as string;

const { sites, fetchSites } = useAdminSites();
const { currentUser } = useAuth();
const router = useRouter();

const lastSiteId = useLocalStorage("last-accessed-site", "");
lastSiteId.value = siteId; // アクセス時に記憶を更新

const currentSite = computed(() => sites.value.find(s => s.id === siteId));

// アサインされている現場のみを抽出
const assignedSites = computed(() => {
  const ids = currentUser.value?.assignedSiteIds || [];
  return sites.value.filter(s => ids.includes(s.id));
});

const siteOptions = computed(() => assignedSites.value.map(s => ({ value: s.id, label: s.name })));

const handleSiteChange = (newSiteId: unknown) => {
  const targetId = String(newSiteId);
  if (!targetId || targetId === siteId) return;
  router.push(`/portal/${targetId}`);
};

onMounted(() => {
  if (sites.value.length === 0) {
    fetchSites();
  }
});
</script>

<template>
  <div class="p-site-dashboard">
    <div class="p-site-dashboard__header">
      <div class="p-site-dashboard__title">
        <AppIcon name="map-pin" class="u-text-muted" style="margin-right: 8px;" />
        <h2>{{ currentSite?.name || '現場ダッシュボード' }}</h2>
      </div>
      <div class="p-site-dashboard__switcher">
        <AppSelect 
          :model-value="siteId" 
          :options="siteOptions"
          class="p-site-dashboard__select"
          @update:model-value="handleSiteChange"
        />
      </div>
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
  @include flex-column(var(--gap-section));
  height: 100%;

  &__header {
    @include flex-between;
    padding-bottom: var(--pad-sm);
    border-bottom: var(--border-width-base) solid var(--color-border);
  }

  &__title {
    @include flex-start;
    h2 {
      @extend %text-title-lg;
      color: var(--color-text-main);
    }
  }

  &__switcher {
    @include flex-start(var(--gap-element));
  }
  
  &__select {
    min-width: 200px;
  }

  &__calendar {
    min-height: 500px; // カレンダーが潰れないように
  }

  &__sidebar {
    @include flex-column(var(--gap-component));
  }
}

.c-link-button {
  text-decoration: none;
  display: block;
}

.l-grid--2col-2-1 {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--gap-section);
  align-items: flex-start;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
}

</style>
