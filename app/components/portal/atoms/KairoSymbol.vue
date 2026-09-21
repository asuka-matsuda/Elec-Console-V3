<script setup lang="ts">
/**
 * PortalKairoSymbol
 * [Portal Atoms] 回路記号のSVG枠線と回路番号を描画する最小レンダラーコンポーネント。
 */
import { computed } from 'vue'

import { resolveKairoSymbol } from '../../../constants/kairoConfig'

export interface PortalKairoSymbolProps {
  kigou?: string | null
  bangou?: string | number | null
}

const props = withDefaults(defineProps<PortalKairoSymbolProps>(), {
  kigou: null,
  bangou: '',
})

const symbolDef = computed(() => resolveKairoSymbol(props.kigou))
const displayText = computed(() => (props.bangou != null && props.bangou !== '' ? String(props.bangou) : '-'))
</script>

<template>
  <div class="relative inline-flex items-center justify-center kairo-symbol">
    <!-- 背景透明の幾何学枠線SVG（設定ファイルに基づき描画） -->
    <svg
      v-if="symbolDef"
      class="absolute inset-0 kairo-svg"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
    >
      <!-- 丸 / 二重丸 -->
      <template v-if="symbolDef.type === 'circle'">
        <circle cx="20" cy="20" r="18" stroke-width="1.5" />
        <circle v-if="symbolDef.isDouble" cx="20" cy="20" r="14.5" stroke-width="1.2" />
      </template>

      <!-- 楕円 / 二重楕円 -->
      <template v-else-if="symbolDef.type === 'ellipse'">
        <ellipse cx="20" cy="20" rx="18" ry="13.5" stroke-width="1.5" />
        <ellipse v-if="symbolDef.isDouble" cx="20" cy="20" rx="14.5" ry="10" stroke-width="1.2" />
      </template>

      <!-- 四角 / 二重四角 -->
      <template v-else-if="symbolDef.type === 'rect'">
        <rect x="2.5" y="2.5" width="35" height="35" rx="3" stroke-width="1.5" />
        <rect v-if="symbolDef.isDouble" x="5.5" y="5.5" width="29" height="29" rx="2" stroke-width="1.2" />
      </template>

      <!-- 多角形（三角・菱形・六角形等） -->
      <template v-else-if="symbolDef.type === 'polygon' && symbolDef.points">
        <polygon :points="symbolDef.points" stroke-width="1.5" />
        <polygon v-if="symbolDef.isDouble && symbolDef.innerPoints" :points="symbolDef.innerPoints" stroke-width="1.2" />
      </template>
    </svg>

    <!-- 回路番号テキスト -->
    <span class="kairo-text">
      {{ displayText }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.kairo-symbol {
  user-select: none;

  width: 2.5em;
  height: 2.5em;

  font-size: 0.95em;
  line-height: 1;

  .kairo-svg {
    pointer-events: none;
    width: 100%;
    height: 100%;
    color: var(--color-text-muted);
  }

  .kairo-text {
    font-family: var(--font-mono, monospace);
    font-weight: 500;
    line-height: 1;
    color: var(--color-text-main);
  }
}
</style>
