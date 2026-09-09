<script setup lang="ts">
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
  <nav class="calendar-toolbar" aria-label="カレンダーナビゲーション">
    <div class="nav-controls">
      <AtomsButton
        variant="secondary"
        size="sm"
        icon="chevron-left"
        icon-only
        @click="emit('prev')"
      />
      <AtomsButton
        variant="secondary"
        size="sm"
        icon="chevron-right"
        icon-only
        @click="emit('next')"
      />
      <AtomsButton variant="secondary" size="sm" @click="emit('today')">
        今日
      </AtomsButton>
    </div>

    <div class="toolbar-center">
      <h3 class="toolbar-title">
        {{ title }}
      </h3>
    </div>

    <div class="view-controls">
      <AtomsButton
        :variant="currentView === 'dayGridMonth' ? 'primary' : 'secondary'"
        size="sm"
        icon="calendar"
        @click="emit('changeView', 'dayGridMonth')"
      >
        月表示
      </AtomsButton>
      <AtomsButton
        :variant="currentView === 'listMonth' ? 'primary' : 'secondary'"
        size="sm"
        icon="list"
        @click="emit('changeView', 'listMonth')"
      >
        リスト
      </AtomsButton>
      <AtomsButton
        variant="secondary"
        size="sm"
        icon="settings"
        @click="emit('openTypeSettings')"
      >
        種別設定
      </AtomsButton>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.calendar-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;

  padding: var(--space-2) var(--space-card-pad);
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
  border-radius: var(--radius-sm);

  background-color: var(--color-surface);

  @include mq("md") {
    flex-direction: column;
    gap: var(--space-1);

    .toolbar-center {
      order: -1;
      width: 100%;
    }

    .nav-controls,
    .view-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }
  }
}

.nav-controls {
  display: flex;
  gap: var(--space-1);
  align-items: center;
}

.toolbar-center {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;

  min-width: 160px;
}

.toolbar-title {
  --glow-color: var(--theme-accent);

  color: var(--theme-accent);
  text-shadow: var(--text-glow-sm);
}

.view-controls {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  justify-content: flex-end;
}
</style>
