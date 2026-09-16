<script setup lang="ts">
/**
 * AtomsCalEventBadge
 * カレンダーイベント表示用の発光バッジコンポーネント。
 * 時刻フォーマットと長文タイトルの省略表示、イベントカラーに応じたネオングローを提供します。
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    allDay?: boolean
    start?: Date | null
    end?: Date | null
    color?: string
  }>(),
  {
    allDay: false,
    start: null,
    end: null,
    color: 'var(--theme-accent)',
  },
)

const timeText = computed(() => {
  if (props.allDay || !props.start) return ''
  const format = (d: Date) =>
    String(d.getHours()).padStart(2, '0')
    + ':'
    + String(d.getMinutes()).padStart(2, '0')
  const startStr = format(props.start)

  if (!props.end) return `${startStr}~`

  return `${startStr} - ${format(props.end)}`
})

const badgeColor = computed(() => props.color || 'var(--theme-accent)')
</script>

<template>
  <div
    class="cal-badge relative z-[1] flex items-center gap-1 w-full px-1 py-0.5 overflow-hidden"
    :style="{ '--badge-color': badgeColor }"
  >
    <span
      v-if="timeText"
      class="cal-badge-time shrink-0"
    >
      {{ timeText }}
    </span>
    <span class="cal-badge-title min-w-0 flex-1">
      {{ title }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.cal-badge {
  --badge-color-dim: color-mix(in srgb, var(--badge-color) 80%, transparent);
  --glow-color: var(--badge-color);

  border: var(--border-width-base) solid var(--badge-color-dim);
  box-shadow: var(--shadow-glow-base);
  transition: var(--transition-interactive);
}

.cal-badge-time {
  font-family: var(--font-mono);
  font-size: var(--font-size-2xs);
  font-weight: var(--font-weight-bold);
  font-variant-numeric: tabular-nums;
  color: var(--badge-color-dim);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wider);
}

.cal-badge-title {
  overflow: hidden;

  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  font-variant-numeric: tabular-nums;
  color: var(--color-text-main);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
