<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    title: string;
    allDay?: boolean;
    start?: Date | null;
    end?: Date | null;
    color?: string;
  }>(),
  {
    allDay: false,
    start: null,
    end: null,
    color: '#00f0ff',
  },
);

const timeText = computed(() => {
  if (props.allDay || !props.start) return '';
  const format = (d: Date) =>
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const startStr = format(props.start);
  if (!props.end) return `${startStr}~`;
  return `${startStr} - ${format(props.end)}`;
});
</script>

<template>
  <div
    class="c-cal-badge"
    :style="{ '--event-color': color }"
  >
    <span
      v-if="timeText"
      class="c-cal-badge__time"
    >
      {{ timeText }}
    </span>
    <span class="c-cal-badge__title">{{ title }}</span>
  </div>
</template>

<style scoped lang="scss">
.c-cal-badge {
  @include flex-start(var(--space-inline-gap-xs));
  @include border-base(var(--glow-color));
  @include state-base(var(--shadow-glow-sm), var(--transition-glow));

  --glow-color: var(--event-color, var(--color-primary));

  width: 100%;
  padding: var(--space-badge-p);

  &__time {
    @include text-badge;

    flex-shrink: 0;
    font-family: var(--font-mono);
  }

  &__title {
    @include text-caption;
    @include text-truncate;

    min-width: 0;
    font-family: var(--font-mono);
    color: var(--color-text-main);
  }

  &:hover {
    @include state-hover(var(--event-color, var(--color-primary)));
  }
}
</style>
