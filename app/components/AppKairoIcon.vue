<script setup lang="ts">
/**
 * AppKairoIcon
 *
 * 回路記号（丸・二重丸・楕円・二重楕円・四角・二重四角）を読み取り、
 * 背景透明のSVG枠線として回路番号の周囲・背面に描画するコンポーネントです。
 */
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    kigou?: string | null
    bangou?: string | number | null
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    kigou: null,
    bangou: '',
    size: 'md',
  },
)

const normalizedKigou = computed(() => {
  if (!props.kigou) return null
  const trimmed = props.kigou.trim()

  if (['丸', '○', '〇', 'circle'].includes(trimmed)) return '丸'
  if (['二重丸', '◎', 'double-circle'].includes(trimmed)) return '二重丸'
  if (['楕円', 'ellipse'].includes(trimmed)) return '楕円'
  if (['二重楕円', 'double-ellipse'].includes(trimmed)) return '二重楕円'
  if (['四角', '□', 'square', 'rect'].includes(trimmed)) return '四角'
  if (['二重四角', 'double-square', 'double-rect'].includes(trimmed)) return '二重四角'

  return null
})

const displayText = computed(() => {
  if (props.bangou !== null && props.bangou !== undefined && props.bangou !== '') {
    return String(props.bangou)
  }

  return '-'
})

const tooltipTitle = computed(() => {
  if (props.kigou && props.bangou) {
    return `${props.kigou} ${props.bangou}`
  }

  return props.bangou ? String(props.bangou) : ''
})
</script>

<template>
  <div
    class="c-kairo-icon"
    :class="[
      `c-kairo-icon--${size}`,
      { 'has-symbol': !!normalizedKigou },
    ]"
    :title="tooltipTitle"
  >
    <!-- 背景透明の回路記号SVG -->
    <svg
      v-if="normalizedKigou"
      class="c-kairo-icon__svg"
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <!-- 丸 -->
      <circle
        v-if="normalizedKigou === '丸'"
        cx="20"
        cy="20"
        r="18.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      />

      <!-- 二重丸 -->
      <template v-else-if="normalizedKigou === '二重丸'">
        <circle
          cx="20"
          cy="20"
          r="18.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <circle
          cx="20"
          cy="20"
          r="15"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
        />
      </template>

      <!-- 楕円 -->
      <ellipse
        v-else-if="normalizedKigou === '楕円'"
        cx="20"
        cy="20"
        rx="18.5"
        ry="13.5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      />

      <!-- 二重楕円 -->
      <template v-else-if="normalizedKigou === '二重楕円'">
        <ellipse
          cx="20"
          cy="20"
          rx="18.5"
          ry="13.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <ellipse
          cx="20"
          cy="20"
          rx="15"
          ry="10.5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
        />
      </template>

      <!-- 四角 -->
      <rect
        v-else-if="normalizedKigou === '四角'"
        x="1.5"
        y="1.5"
        width="37"
        height="37"
        rx="3"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      />

      <!-- 二重四角 -->
      <template v-else-if="normalizedKigou === '二重四角'">
        <rect
          x="1.5"
          y="1.5"
          width="37"
          height="37"
          rx="3"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        />
        <rect
          x="4.5"
          y="4.5"
          width="31"
          height="31"
          rx="2"
          fill="none"
          stroke="currentColor"
          stroke-width="1.2"
        />
      </template>
    </svg>

    <!-- 回路番号テキスト -->
    <span class="c-kairo-icon__text">{{ displayText }}</span>
  </div>
</template>

<style scoped lang="scss">
.c-kairo-icon {
  position: relative;
  z-index: 0;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  line-height: 1;
  color: var(--color-text-main);

  &--sm {
    min-width: 22px;
    height: 22px;
    padding: 0 3px;
    font-size: 10px;
  }

  &--md {
    min-width: 28px;
    height: 28px;
    padding: 0 4px;
    font-size: var(--text-xs);
  }

  &--lg {
    min-width: 34px;
    height: 34px;
    padding: 0 6px;
    font-size: var(--text-sm);
  }

  &__svg {
    pointer-events: none;

    position: absolute;
    z-index: 0;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

    width: 100%;
    height: 100%;

    color: color-mix(in srgb, var(--color-text-main) 75%, var(--theme-accent) 25%);
  }

  &__text {
    position: relative;
    z-index: 1;

    font-family: var(--font-mono);
    font-weight: var(--font-weight-bold);
    text-align: center;
    white-space: nowrap;
  }

  &:not(.has-symbol) {
    min-width: auto;
    height: auto;
    padding: 0;

    .c-kairo-icon__text {
      color: var(--color-text-main);
    }
  }
}
</style>
