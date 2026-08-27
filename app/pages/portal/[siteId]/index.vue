
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

const _currentSite = computed(() => sites.value.find(s => s.id === siteId));

// アサインされている現場のみを抽出
const assignedSites = computed(() => {
  const ids = currentUser.value?.assignedSiteIds || [];
  return sites.value.filter(s => ids.includes(s.id));
});

const handleSiteChange = (newSiteId: string) => {
  if (newSiteId !== siteId) {
    router.push(`/portal/${newSiteId}`);
  }
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
      <h2>現場ダッシュボード</h2>
      <div class="p-site-dashboard__switcher">
        <span class="u-text-sm u-text-muted">ログイン中の現場:</span>
        <AppSelect 
          :model-value="siteId" 
          :options="assignedSites.map(s => ({ value: s.id, label: s.name }))"
          class="p-site-dashboard__select"
          @update:model-value="(val: any) => handleSiteChange(String(val))"
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
  @include flex-column(var(--gap-lg));
  height: 100%;

  &__header {
    @include flex-between;
    padding-bottom: var(--pad-sm);
    border-bottom: var(--border-width-base) solid var(--color-border);
    
    h2 {
      @extend %text-title-lg;
      color: var(--color-text-main);
    }
  }

  &__switcher {
    @include flex-start(var(--gap-sm));
  }
  
  &__select {
    min-width: 200px;
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
