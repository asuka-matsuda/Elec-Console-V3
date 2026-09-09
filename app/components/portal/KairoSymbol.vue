<script setup lang="ts">
/**
 * KairoSymbol
 * [Portal Atom] 回路記号（丸・二重丸・楕円・二重楕円・四角・二重四角）を読み取り、
 * 背景透明のSVG枠線として回路番号の周囲・背面に描画するコンポーネントです。
 * 親要素の文字サイズ（font-size）に自動追従します。
 */
import { computed } from 'vue'

export interface PortalKairoSymbolProps {
  kigou?: string | null
  bangou?: string | number | null
}

interface SymbolPaths {
  outer: string
  inner?: string
}

const props = withDefaults(
  defineProps<PortalKairoSymbolProps>(),
  {
    kigou: null,
    bangou: '',
  },
)

const KIGOU_ALIAS_MAP: Record<string, string> = {
  '丸': '丸',
  '○': '丸',
  '〇': '丸',
  'circle': '丸',
  '二重丸': '二重丸',
  '◎': '二重丸',
  'double-circle': '二重丸',
  '楕円': '楕円',
  'ellipse': '楕円',
  '二重楕円': '二重楕円',
  'double-ellipse': '二重楕円',
  '四角': '四角',
  '□': '四角',
  'square': '四角',
  'rect': '四角',
  '二重四角': '二重四角',
  'double-square': '二重四角',
  'double-rect': '二重四角',
}

const KAIRO_PATHS: Record<string, SymbolPaths> = {
  丸: {
    outer: 'M 20 1.5 A 18.5 18.5 0 1 0 20 38.5 A 18.5 18.5 0 1 0 20 1.5 Z',
  },
  二重丸: {
    outer: 'M 20 1.5 A 18.5 18.5 0 1 0 20 38.5 A 18.5 18.5 0 1 0 20 1.5 Z',
    inner: 'M 20 5 A 15 15 0 1 0 20 35 A 15 15 0 1 0 20 5 Z',
  },
  楕円: {
    outer: 'M 20 6.5 A 18.5 13.5 0 1 0 20 33.5 A 18.5 13.5 0 1 0 20 6.5 Z',
  },
  二重楕円: {
    outer: 'M 20 6.5 A 18.5 13.5 0 1 0 20 33.5 A 18.5 13.5 0 1 0 20 6.5 Z',
    inner: 'M 20 9.5 A 15 10.5 0 1 0 20 30.5 A 15 10.5 0 1 0 20 9.5 Z',
  },
  四角: {
    outer: 'M 4.5 1.5 h 31 a 3 3 0 0 1 3 3 v 31 a 3 3 0 0 1 -3 3 h -31 a 3 3 0 0 1 -3 -3 v -31 a 3 3 0 0 1 3 -3 Z',
  },
  二重四角: {
    outer: 'M 4.5 1.5 h 31 a 3 3 0 0 1 3 3 v 31 a 3 3 0 0 1 -3 3 h -31 a 3 3 0 0 1 -3 -3 v -31 a 3 3 0 0 1 3 -3 Z',
    inner: 'M 6.5 4.5 h 27 a 2 2 0 0 1 2 2 v 27 a 2 2 0 0 1 -2 2 h -27 a 2 2 0 0 1 -2 -2 v -27 a 2 2 0 0 1 2 -2 Z',
  },
}

const symbolPaths = computed<SymbolPaths | null>(() => {
  if (!props.kigou) return null
  const normalized = KIGOU_ALIAS_MAP[props.kigou.trim()]

  return (normalized && KAIRO_PATHS[normalized]) || null
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
    class="kairo-symbol relative z-0 inline-flex items-center justify-center leading-none"
    :class="symbolPaths ? 'min-w-[2.5em] h-[2.5em] px-[0.4em]' : ''"
    :title="tooltipTitle"
  >
    <!-- 背景透明の回路記号SVG -->
    <svg
      v-if="symbolPaths"
      class="pointer-events-none absolute inset-0 w-full h-full"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path :d="symbolPaths.outer" stroke-width="1.5" />
      <path v-if="symbolPaths.inner" :d="symbolPaths.inner" stroke-width="1.2" />
    </svg>

    <!-- 回路番号テキスト -->
    <span class="relative z-[1] text-center whitespace-nowrap font-bold font-mono">
      {{ displayText }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.kairo-symbol {
  color: var(--color-text-main);

  svg {
    color: var(--color-text-muted);
  }
}
</style>
