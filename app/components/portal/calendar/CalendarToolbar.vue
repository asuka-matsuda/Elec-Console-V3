<script setup lang="ts">
/**
 * CalendarToolbar
 * [Portal Molecules] カレンダー操作ツールバーコンポーネント。
 * 月送り・今日へ戻るナビゲーションおよび表示形式（月グリッド/リスト）の切替を提供します。
 */
import type { IconName } from '~/constants/icons'
import type { RadioOption } from '~/types/components'

type CalendarView = 'dayGridMonth' | 'listMonth'

defineProps<{
  title: string
  currentView: CalendarView
}>()

const emit = defineEmits<{
  (e: 'prev' | 'next' | 'today' | 'openTypeSettings'): void
  (e: 'changeView', view: CalendarView): void
}>()

const VIEW_OPTIONS: RadioOption<CalendarView>[] = [
  { value: 'dayGridMonth', label: '月表示' },
  { value: 'listMonth', label: 'リスト' },
]

const VIEW_ICONS: Record<CalendarView, IconName> = {
  dayGridMonth: 'calendar',
  listMonth: 'list',
}
</script>

<template>
  <header class="calendar-toolbar flex flex-col md:flex-row items-center justify-between gap-2 px-panel-pad py-2">

    <div class="flex items-center gap-1">
      <Button icon="chevron-left" @click="emit('prev')" />
      <Button icon="chevron-right" @click="emit('next')" />
      <Button @click="emit('today')">
        今日
      </Button>
    </div>

    <h3 class="toolbar-title order-first md:order-none">
      {{ title }}
    </h3>

    <div class="flex items-center gap-2">
      <RadioGroup
        :model-value="currentView"
        :options="VIEW_OPTIONS"
        @update:model-value="val => val && emit('changeView', val)"
      >
        <template #option="{ option }">
          <div class="flex items-center gap-1.5">
            <Icon :name="VIEW_ICONS[option.value]" />
            <span>{{ option.label }}</span>
          </div>
        </template>
      </RadioGroup>

      <Button icon="settings" @click="emit('openTypeSettings')">
        種別設定
      </Button>
    </div>
  </header>
</template>

<style scoped>
.calendar-toolbar {
  border: var(--border-width-base) solid color-mix(in srgb, var(--color-border) 30%, transparent);
  background-color: var(--surface-bg);
}

.toolbar-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--theme-accent);
}
</style>
