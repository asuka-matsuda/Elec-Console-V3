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

const badgeColor = computed(() => props.color || 'var(--theme-accent)');
</script>

<template>
  <div
    class="c-cal-badge"
    :style="{ '--badge-color': badgeColor }"
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

  // 親から渡された単一変数を参照するため color-mix が確実に機能する
  --badge-color-dim: color-mix(in srgb, var(--badge-color) 80%, transparent);

  @include border-base(var(--badge-color-dim));
  @include state-base(none, var(--transition-glow), var(--badge-color));

  width: 100%;
  padding: var(--space-badge-p);

  &__time {
    @include text-badge;

    flex-shrink: 0;
    font-family: var(--font-mono);
    color: var(--badge-color-dim);
  }

  &__title {
    @include text-caption;
    @include text-truncate;

    min-width: 0;
    font-family: var(--font-mono);
    color: var(--color-text-main);
  }
}
</style>
