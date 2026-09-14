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
  <nav
    class="calendar-toolbar flex flex-col md:flex-row flex-wrap items-center justify-between gap-1 md:gap-2 px-card-pad py-2"
  >
    <div class="flex items-center justify-center md:justify-start w-full md:w-auto gap-1">
      <AtomsButton
        variant="secondary"
        icon="chevron-left"
        icon-only
        @click="emit('prev')"
      />
      <AtomsButton
        variant="secondary"
        icon="chevron-right"
        icon-only
        @click="emit('next')"
      />
      <AtomsButton variant="secondary" @click="emit('today')">
        今日
      </AtomsButton>
    </div>

    <div class="order-first md:order-none flex flex-1 items-center justify-center w-full md:w-auto min-w-[160px]">
      <h3 class="toolbar-title">
        {{ title }}
      </h3>
    </div>

    <div class="flex items-center justify-center md:justify-end w-full md:w-auto gap-1">
      <AtomsButton
        :variant="currentView === 'dayGridMonth' ? 'primary' : 'secondary'"
        icon="calendar"
        @click="emit('changeView', 'dayGridMonth')"
      >
        月表示
      </AtomsButton>
      <AtomsButton
        :variant="currentView === 'listMonth' ? 'primary' : 'secondary'"
        icon="list"
        @click="emit('changeView', 'listMonth')"
      >
        リスト
      </AtomsButton>
      <AtomsButton
        variant="secondary"
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
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
  border-radius: var(--radius-sm);
  background-color: var(--color-surface);
}

.toolbar-title {
  --glow-color: var(--theme-accent);

  color: var(--theme-accent);
  text-shadow: var(--text-glow-sm);
}
</style>
