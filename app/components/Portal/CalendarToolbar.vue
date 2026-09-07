<script setup lang="ts">
import AppButton from '~/components/AppButton.vue'

defineProps<{
  title: string
  currentView: 'dayGridMonth' | 'listMonth'
}>()

const emit = defineEmits<{
  (e: 'prev' | 'next' | 'today' | 'openTypeSettings'): void
  (e: 'changeView', view: 'dayGridMonth' | 'listMonth'): void
}>()
</script>

<template>
  <div class="c-calendar-toolbar">
    <div class="c-calendar-toolbar__nav">
      <AppButton
        variant="secondary"
        size="sm"
        icon="chevron-left"
        icon-only
        @click="emit('prev')"
      />
      <AppButton
        variant="secondary"
        size="sm"
        icon="chevron-right"
        icon-only
        @click="emit('next')"
      />
      <AppButton variant="secondary" size="sm" @click="emit('today')">
        今日
      </AppButton>
    </div>

    <div class="c-calendar-toolbar__center">
      <h3 class="c-calendar-toolbar__title">
        {{ title }}
      </h3>
    </div>

    <div class="c-calendar-toolbar__views">
      <AppButton
        :variant="currentView === 'dayGridMonth' ? 'primary' : 'secondary'"
        size="sm"
        icon="calendar"
        @click="emit('changeView', 'dayGridMonth')"
      >
        月表示
      </AppButton>
      <AppButton
        :variant="currentView === 'listMonth' ? 'primary' : 'secondary'"
        size="sm"
        icon="list"
        @click="emit('changeView', 'listMonth')"
      >
        リスト
      </AppButton>
      <AppButton
        variant="secondary"
        size="sm"
        icon="settings"
        @click="emit('openTypeSettings')"
      >
        種別設定
      </AppButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.c-calendar-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;

  padding: var(--space-2) var(--space-card-pad);

  background-color: var(--color-surface);

  @include border-base($opacity: 30%);

  @include mq("md") {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);

    &__center {
      order: -1;
      width: 100%;
    }

    &__nav,
    &__views {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
  }

  &__nav {
    display: flex;
    gap: var(--space-1);
    align-items: center;
  }

  &__center {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;

    min-width: 160px;
  }

  &__title {
    @include text-title("md");

    color: var(--theme-accent);

    @include cyber-text-glow(var(--theme-accent), 60%, var(--blur-sm));
  }

  &__views {
    display: flex;
    gap: var(--space-1);
    align-items: center;
    justify-content: flex-end;
  }
}
</style>
