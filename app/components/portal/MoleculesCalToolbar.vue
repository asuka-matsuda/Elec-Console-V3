<script setup lang="ts">
/**
 * PortalMoleculesCalToolbar
 * カレンダー操作ツールバーコンポーネント。
 * 月送り/今日移動、年月タイトル、月表示/リスト切り替え（AtomsRadioGroupセグメントコントロール）、
 * および種別設定モーダルオープンボタンを提供します。
 */
import type { RadioOption } from '~/types/components'

type CalendarView = 'dayGridMonth' | 'listMonth'

interface CalendarViewOption extends RadioOption<CalendarView> {
  icon: string
}

defineProps<{
  title: string
  currentView: CalendarView
}>()

const emit = defineEmits<{
  (e: 'prev' | 'next' | 'today' | 'openTypeSettings'): void
  (e: 'changeView', view: CalendarView): void
}>()

const VIEW_OPTIONS: CalendarViewOption[] = [
  { value: 'dayGridMonth', label: '月表示', icon: 'calendar' },
  { value: 'listMonth', label: 'リスト', icon: 'list' },
]

const handleViewChange = (view: CalendarView) => {
  emit('changeView', view)
}

const getOptionIcon = (option: RadioOption<CalendarView>): string => {
  return (option as CalendarViewOption).icon || ''
}
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

    <div class="flex items-center justify-center md:justify-end w-full md:w-auto gap-2">
      <!-- 表示ビュー切り替え（セグメントコントロール） -->
      <AtomsRadioGroup
        :model-value="currentView"
        :options="VIEW_OPTIONS"
        @update:model-value="handleViewChange"
      >
        <template #option="{ option }">
          <div class="flex items-center gap-1.5">
            <AtomsIcon :name="getOptionIcon(option)" />
            <span>{{ option.label }}</span>
          </div>
        </template>
      </AtomsRadioGroup>

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
  background-color: var(--surface-bg);
}

.toolbar-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--theme-accent);
}
</style>
