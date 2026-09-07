<script setup lang="ts">
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
    color: '#00f0ff',
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
  <div class="c-cal-badge" :style="{ '--badge-color': badgeColor }">
    <span v-if="timeText" class="c-cal-badge__time">
      {{ timeText }}
    </span>
    <span class="c-cal-badge__title">{{ title }}</span>
  </div>
</template>

<style scoped lang="scss">
.c-cal-badge {
  --badge-color-dim: color-mix(in srgb, var(--badge-color) 80%, transparent);

  position: relative;
  z-index: 1;

  display: flex;
  gap: var(--space-0-5);
  align-items: center;

  width: 100%;
  padding: var(--space-0-5) var(--space-1);
  border: var(--border-width-base) solid var(--badge-color-dim);
  border-radius: var(--radius-sm);

  box-shadow: inset 0 0 4px color-mix(in srgb, var(--badge-color) 20%, transparent), 0 2px 4px color-mix(in srgb, black 20%, transparent);

  transition: var(--transition-glow);

  &__time {
    flex-shrink: 0;

    font-family: var(--font-mono);
    font-size: var(--font-size-2xs);
    font-weight: var(--font-weight-bold);
    font-variant-numeric: tabular-nums;
    color: var(--badge-color-dim);
    text-transform: uppercase;
    letter-spacing: var(--tracking-wider);
  }

  &__title {
    overflow: hidden;

    min-width: 0;

    font-family: var(--font-mono);
    font-size: var(--font-size-sm);
    font-variant-numeric: tabular-nums;
    color: var(--color-text-main);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
